package com.jz.perfumes.stock;

import com.jz.perfumes.product.Product;
import com.jz.perfumes.shared.BaseEntity;
import com.jz.perfumes.shared.ValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Toda variación de stock pasa por acá: el movimiento aplica el cambio al producto y guarda la foto
 * (`stock_after`), así el historial siempre cierra con el stock actual.
 */
@Entity
@Table(name = "stock_movement")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockMovement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;

    /** Positivo entra, negativo sale. */
    @Column(nullable = false)
    private int quantity;

    @Column(name = "stock_after", nullable = false)
    private int stockAfter;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    /** Id de la venta que lo originó, si aplica. */
    @Column(name = "reference_id")
    private Long referenceId;

    @Column(length = 200)
    private String reason;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    private StockMovement(Product product, MovementType type, int quantity, BigDecimal unitCost,
                          Long referenceId, String reason, Long createdBy) {
        this.product = product;
        this.movementType = type;
        this.quantity = quantity;
        this.stockAfter = product.getCurrentStock();
        this.unitCost = unitCost;
        this.referenceId = referenceId;
        this.reason = reason;
        this.createdBy = createdBy;
    }

    /**
     * Aplica `signedQuantity` al producto y devuelve el movimiento listo para guardar.
     * Si el producto no tiene stock suficiente, el producto lanza DomainException y nada cambia.
     */
    public static StockMovement apply(Product product, MovementType type, int signedQuantity, BigDecimal unitCost,
                                      Long referenceId, String reason, Long createdBy) {
        if (product == null) {
            throw new ValidationException("El producto es obligatorio");
        }
        if (type == null) {
            throw new ValidationException("El tipo de movimiento es obligatorio");
        }
        if (createdBy == null) {
            throw new ValidationException("Falta el usuario que registra el movimiento");
        }
        if (signedQuantity == 0) {
            throw new ValidationException("La cantidad no puede ser cero");
        }
        if (type.direction() != 0 && Integer.signum(signedQuantity) != type.direction()) {
            throw new ValidationException("Un movimiento " + type + " no puede tener cantidad " + signedQuantity);
        }
        if (unitCost != null && unitCost.signum() < 0) {
            throw new ValidationException("El costo unitario no puede ser negativo");
        }
        if (signedQuantity > 0) {
            product.increaseStock(signedQuantity);
        } else {
            product.decreaseStock(-signedQuantity);
        }
        BigDecimal cost = unitCost == null ? null : unitCost.setScale(2, RoundingMode.HALF_UP);
        String trimmedReason = reason == null || reason.isBlank() ? null : reason.trim();
        return new StockMovement(product, type, signedQuantity, cost, referenceId, trimmedReason, createdBy);
    }
}
