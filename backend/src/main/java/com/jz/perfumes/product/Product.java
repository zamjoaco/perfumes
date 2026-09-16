package com.jz.perfumes.product;

import com.jz.perfumes.shared.BaseEntity;
import com.jz.perfumes.shared.DomainException;
import com.jz.perfumes.shared.ValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends BaseEntity {

    @Column(nullable = false, unique = true, length = 40)
    private String sku;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Concentration concentration;

    @Column(name = "size_ml", nullable = false)
    private int sizeMl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Presentation presentation;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Gender gender;

    @Column(name = "fragrance_family", length = 40)
    private String fragranceFamily;

    @Column(name = "cost_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "sale_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "current_stock", nullable = false)
    private int currentStock;

    @Column(name = "min_stock", nullable = false)
    private int minStock;

    @Column(nullable = false)
    private boolean active;

    @Builder
    private Product(String sku, Brand brand, String name, Concentration concentration, int sizeMl,
                    Presentation presentation, Gender gender, String fragranceFamily,
                    BigDecimal costPrice, BigDecimal salePrice, int minStock) {
        this.currentStock = 0;   // el stock inicial entra por un movimiento, nunca por el alta
        this.active = true;
        update(sku, brand, name, concentration, sizeMl, presentation, gender, fragranceFamily,
                costPrice, salePrice, minStock);
    }

    public void update(String sku, Brand brand, String name, Concentration concentration, int sizeMl,
                       Presentation presentation, Gender gender, String fragranceFamily,
                       BigDecimal costPrice, BigDecimal salePrice, int minStock) {
        this.sku = normalizeSku(sku);
        this.brand = require(brand, "La marca es obligatoria");
        this.name = requireText(name, "El nombre es obligatorio");
        this.concentration = require(concentration, "La concentración es obligatoria");
        this.presentation = require(presentation, "La presentación es obligatoria");
        if (sizeMl <= 0) {
            throw new ValidationException("El tamaño en ml tiene que ser mayor a cero");
        }
        this.sizeMl = sizeMl;
        this.gender = gender;
        this.fragranceFamily = fragranceFamily == null || fragranceFamily.isBlank() ? null : fragranceFamily.trim();
        this.costPrice = money(costPrice, "El costo");
        this.salePrice = money(salePrice, "El precio de venta");
        if (minStock < 0) {
            throw new ValidationException("El stock mínimo no puede ser negativo");
        }
        this.minStock = minStock;
    }

    public void increaseStock(int quantity) {
        if (quantity <= 0) {
            throw new ValidationException("La cantidad tiene que ser mayor a cero");
        }
        this.currentStock += quantity;
    }

    public void decreaseStock(int quantity) {
        if (quantity <= 0) {
            throw new ValidationException("La cantidad tiene que ser mayor a cero");
        }
        if (quantity > currentStock) {
            throw new DomainException("Stock insuficiente de " + name + ": hay " + currentStock + ", se piden " + quantity);
        }
        this.currentStock -= quantity;
    }

    public void deactivate() {
        this.active = false;
    }

    public void activate() {
        this.active = true;
    }

    public boolean isBelowMinimum() {
        return currentStock <= minStock;
    }

    /** SKU sin espacios y en mayúsculas: "abc 1" y "ABC1" son el mismo producto. */
    public static String normalizeSku(String sku) {
        String normalized = requireText(sku, "El SKU es obligatorio").replaceAll("\\s+", "").toUpperCase();
        if (normalized.length() > 40) {
            throw new ValidationException("El SKU no puede superar los 40 caracteres");
        }
        return normalized;
    }

    private static BigDecimal money(BigDecimal value, String label) {
        if (value == null) {
            throw new ValidationException(label + " es obligatorio");
        }
        if (value.signum() < 0) {
            throw new ValidationException(label + " no puede ser negativo");
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static <T> T require(T value, String message) {
        if (value == null) {
            throw new ValidationException(message);
        }
        return value;
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ValidationException(message);
        }
        return value.trim();
    }
}
