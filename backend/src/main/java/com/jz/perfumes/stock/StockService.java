package com.jz.perfumes.stock;

import com.jz.perfumes.auth.AuthenticatedUser;
import com.jz.perfumes.product.Product;
import com.jz.perfumes.product.ProductService;
import com.jz.perfumes.shared.ValidationException;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockMovementRepository movements;
    private final ProductService productService;

    /** Movimientos manuales. Las ventas registran los suyos desde SaleService con {@link #record}. */
    @Transactional
    public MovementResponse register(Long productId, MovementRequest request, AuthenticatedUser user) {
        if (request.type() == MovementType.SALE) {
            throw new ValidationException("Las ventas se registran desde la pantalla de ventas");
        }
        int quantity = request.quantity();
        int signed = request.type() == MovementType.ADJUSTMENT ? quantity : Math.abs(quantity) * request.type().direction();
        Product product = productService.requireForUpdate(productId);
        return MovementResponse.from(record(product, request.type(), signed, request.unitCost(), null,
                request.reason(), user.id()));
    }

    /** Aplica el cambio al producto y guarda el movimiento en la transacción del que llama. */
    @Transactional
    public StockMovement record(Product product, MovementType type, int signedQuantity,
                                BigDecimal unitCost, Long referenceId, String reason, Long createdBy) {
        return movements.save(StockMovement.apply(product, type, signedQuantity, unitCost, referenceId, reason, createdBy));
    }

    @Transactional(readOnly = true)
    public Page<MovementResponse> history(Long productId, Pageable pageable) {
        productService.require(productId);
        return movements.findByProductIdOrderByCreatedAtDescIdDesc(productId, pageable).map(MovementResponse::from);
    }
}
