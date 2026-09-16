package com.jz.perfumes.sale;

import com.jz.perfumes.product.Product;
import com.jz.perfumes.shared.BaseEntity;
import com.jz.perfumes.shared.DomainException;
import com.jz.perfumes.shared.ValidationException;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

/** Una venta cerrada. Los totales los calcula la entidad; el front solo manda ítems y descuento. */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Sale extends BaseEntity {

    @Column(name = "sold_at", nullable = false)
    private Instant soldAt;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal discount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SaleStatus status;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<SaleItem> items = new ArrayList<>();

    private Sale(Instant soldAt, PaymentMethod paymentMethod, String notes, Long createdBy) {
        this.soldAt = soldAt;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
        this.createdBy = createdBy;
        this.status = SaleStatus.COMPLETED;
        this.subtotal = BigDecimal.ZERO.setScale(2);
        this.discount = BigDecimal.ZERO.setScale(2);
        this.total = BigDecimal.ZERO.setScale(2);
    }

    public static Sale create(Instant soldAt, PaymentMethod paymentMethod, String notes, Long createdBy) {
        if (soldAt == null) {
            throw new ValidationException("La fecha de la venta es obligatoria");
        }
        if (paymentMethod == null) {
            throw new ValidationException("El medio de pago es obligatorio");
        }
        if (createdBy == null) {
            throw new ValidationException("Falta el usuario que registra la venta");
        }
        String trimmed = notes == null || notes.isBlank() ? null : notes.trim();
        return new Sale(soldAt, paymentMethod, trimmed, createdBy);
    }

    /** Toma precio y costo actuales del producto. El mismo producto dos veces suma cantidades. */
    public void addItem(Product product, int quantity) {
        if (product == null) {
            throw new ValidationException("El producto es obligatorio");
        }
        if (quantity <= 0) {
            throw new ValidationException("La cantidad de " + product.getName() + " tiene que ser mayor a cero");
        }
        if (!product.isActive()) {
            throw new DomainException("El producto " + product.getName() + " está dado de baja y no se puede vender");
        }
        items.stream().filter(i -> i.getProduct().equals(product)).findFirst().ifPresentOrElse(
                existing -> existing.setQuantity(existing.getQuantity() + quantity),
                () -> items.add(new SaleItem(this, product, quantity)));
        recalculate();
    }

    public void applyDiscount(BigDecimal discount) {
        BigDecimal value = discount == null ? BigDecimal.ZERO : discount;
        if (value.signum() < 0) {
            throw new ValidationException("El descuento no puede ser negativo");
        }
        this.discount = value.setScale(2, RoundingMode.HALF_UP);
        recalculate();
    }

    /** Última validación antes de persistir: hay ítems y el descuento no supera el subtotal. */
    public void close() {
        if (items.isEmpty()) {
            throw new ValidationException("La venta necesita al menos un ítem");
        }
        if (discount.compareTo(subtotal) > 0) {
            throw new DomainException("El descuento (" + discount + ") no puede superar el subtotal (" + subtotal + ")");
        }
    }

    public void cancel() {
        if (status == SaleStatus.CANCELLED) {
            throw new DomainException("La venta #" + getId() + " ya está cancelada");
        }
        this.status = SaleStatus.CANCELLED;
    }

    public List<SaleItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    private void recalculate() {
        this.subtotal = items.stream().map(SaleItem::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        this.total = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);
    }
}
