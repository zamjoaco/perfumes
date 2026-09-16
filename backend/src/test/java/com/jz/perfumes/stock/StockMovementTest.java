package com.jz.perfumes.stock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jz.perfumes.product.Brand;
import com.jz.perfumes.product.Concentration;
import com.jz.perfumes.product.Presentation;
import com.jz.perfumes.product.Product;
import com.jz.perfumes.shared.DomainException;
import com.jz.perfumes.shared.ValidationException;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class StockMovementTest {

    private Product product;

    @BeforeEach
    void setUp() {
        product = Product.builder().sku("X-1").brand(Brand.create("Dior")).name("Sauvage")
                .concentration(Concentration.EDP).sizeMl(100).presentation(Presentation.BOTTLE)
                .costPrice(new BigDecimal("50000")).salePrice(new BigDecimal("90000")).minStock(2).build();
    }

    @Test
    void purchaseIncreasesStockAndSnapshotsStockAfter() {
        StockMovement m = StockMovement.apply(product, MovementType.PURCHASE, 10, new BigDecimal("48000.005"), null, "  Proveedor  ", 1L);

        assertThat(product.getCurrentStock()).isEqualTo(10);
        assertThat(m.getStockAfter()).isEqualTo(10);
        assertThat(m.getQuantity()).isEqualTo(10);
        assertThat(m.getUnitCost()).isEqualTo(new BigDecimal("48000.01"));
        assertThat(m.getReason()).isEqualTo("Proveedor");
        assertThat(m.getCreatedBy()).isEqualTo(1L);
    }

    @Test
    void lossBeyondStockLeavesProductUntouched() {
        StockMovement.apply(product, MovementType.PURCHASE, 3, null, null, null, 1L);

        assertThatThrownBy(() -> StockMovement.apply(product, MovementType.LOSS, -5, null, null, "rotura", 1L))
                .isInstanceOf(DomainException.class);
        assertThat(product.getCurrentStock()).isEqualTo(3);
    }

    @Test
    void signMustMatchMovementType() {
        assertThatThrownBy(() -> StockMovement.apply(product, MovementType.PURCHASE, -1, null, null, null, 1L))
                .isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> StockMovement.apply(product, MovementType.LOSS, 1, null, null, null, 1L))
                .isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> StockMovement.apply(product, MovementType.ADJUSTMENT, 0, null, null, null, 1L))
                .isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> StockMovement.apply(product, MovementType.PURCHASE, 1, null, null, null, null))
                .isInstanceOf(ValidationException.class);
        assertThat(product.getCurrentStock()).isZero();
    }

    @Test
    void adjustmentGoesBothWays() {
        StockMovement.apply(product, MovementType.ADJUSTMENT, 5, null, null, "conteo", 1L);
        StockMovement down = StockMovement.apply(product, MovementType.ADJUSTMENT, -2, null, null, "conteo", 1L);

        assertThat(product.getCurrentStock()).isEqualTo(3);
        assertThat(down.getStockAfter()).isEqualTo(3);
        assertThat(down.getQuantity()).isEqualTo(-2);
    }

    @Test
    void saleMovementKeepsSaleReference() {
        StockMovement.apply(product, MovementType.PURCHASE, 2, null, null, null, 1L);
        StockMovement sale = StockMovement.apply(product, MovementType.SALE, -1, new BigDecimal("50000"), 77L, null, 1L);

        assertThat(sale.getReferenceId()).isEqualTo(77L);
        assertThat(sale.getStockAfter()).isEqualTo(1);
    }
}
