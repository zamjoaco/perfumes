package com.jz.perfumes.sale;

import com.jz.perfumes.auth.AuthenticatedUser;
import com.jz.perfumes.product.Product;
import com.jz.perfumes.product.ProductService;
import com.jz.perfumes.shared.AppTimeZone;
import com.jz.perfumes.shared.NotFoundException;
import com.jz.perfumes.stock.MovementType;
import com.jz.perfumes.stock.StockService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SaleService {

    private static final Instant MIN = Instant.EPOCH;
    private static final Instant MAX = Instant.parse("2100-01-01T00:00:00Z");

    private final SaleRepository sales;
    private final ProductService productService;
    private final StockService stockService;
    private final Clock clock;

    /**
     * Venta y descuento de stock en la misma transacción: si un producto no tiene stock, no queda
     * ni la venta ni ningún movimiento. Los productos se bloquean (FOR UPDATE) en orden de id
     * para que dos ventas simultáneas no se traben entre sí.
     */
    @Transactional
    public SaleResponse create(SaleRequest request, AuthenticatedUser user) {
        Instant soldAt = request.soldAt() == null ? clock.instant() : request.soldAt();
        Sale sale = Sale.create(soldAt, request.paymentMethod(), request.notes(), user.id());

        List<SaleItemRequest> items = request.items().stream()
                .sorted((a, b) -> Long.compare(a.productId(), b.productId()))
                .toList();
        for (SaleItemRequest item : items) {
            Product product = productService.requireForUpdate(item.productId());
            sale.addItem(product, item.quantity());
        }
        sale.applyDiscount(request.discount());
        sale.close();

        Sale saved = sales.save(sale); // IDENTITY: el id sale acá y lo necesita reference_id del movimiento
        for (SaleItem line : saved.getItems()) {
            stockService.record(line.getProduct(), MovementType.SALE, -line.getQuantity(), line.getUnitCost(),
                    saved.getId(), null, user.id());
        }
        return SaleResponse.from(saved);
    }

    /** Devuelve el stock con un movimiento RETURN por ítem, referenciando la venta. */
    @Transactional
    public SaleResponse cancel(Long id, AuthenticatedUser user) {
        Sale sale = find(id);
        sale.cancel();
        for (SaleItem line : sale.getItems()) {
            Product product = productService.requireForUpdate(line.getProduct().getId());
            stockService.record(product, MovementType.RETURN, line.getQuantity(), line.getUnitCost(),
                    sale.getId(), "Cancelación de venta #" + sale.getId(), user.id());
        }
        return SaleResponse.from(sale);
    }

    @Transactional(readOnly = true)
    public SaleResponse get(Long id) {
        return SaleResponse.from(find(id));
    }

    @Transactional(readOnly = true)
    public Page<SaleResponse> search(LocalDate from, LocalDate to, SaleStatus status, Pageable pageable) {
        Instant start = from == null ? MIN : from.atStartOfDay(AppTimeZone.ZONE).toInstant();
        Instant end = to == null ? MAX : to.plusDays(1).atStartOfDay(AppTimeZone.ZONE).toInstant();
        return sales.search(start, end, status, pageable).map(SaleResponse::from);
    }

    @Transactional(readOnly = true)
    public SalesSummary today() {
        LocalDate today = LocalDate.now(clock.withZone(AppTimeZone.ZONE));
        Instant start = today.atStartOfDay(AppTimeZone.ZONE).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(AppTimeZone.ZONE).toInstant();
        List<Sale> completed = sales.findByStatusAndSoldAtGreaterThanEqualAndSoldAtLessThan(SaleStatus.COMPLETED, start, end);
        BigDecimal total = completed.stream().map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2);
        return new SalesSummary(completed.size(), total);
    }

    private Sale find(Long id) {
        return sales.findWithItemsById(id).orElseThrow(() -> new NotFoundException("Venta no encontrada"));
    }
}
