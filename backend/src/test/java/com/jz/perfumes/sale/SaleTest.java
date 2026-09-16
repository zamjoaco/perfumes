package com.jz.perfumes.sale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jz.perfumes.product.Brand;
import com.jz.perfumes.product.Concentration;
import com.jz.perfumes.product.Presentation;
import com.jz.perfumes.product.Product;
import com.jz.perfumes.shared.DomainException;
import com.jz.perfumes.shared.ValidationException;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class SaleTest {

    private static final Instant NOW = Instant.parse("2026-09-15T15:00:00Z");

    private static Product product(String name, String price, String cost) {
        return Product.builder().sku(name.toUpperCase()).brand(Brand.create("Dior")).name(name)
                .concentration(Concentration.EDP).sizeMl(100).presentation(Presentation.BOTTLE)
                .costPrice(new BigDecimal(cost)).salePrice(new BigDecimal(price)).minStock(1).build();
    }

    @Test
    void snapshotsPriceAndCostAndComputesTotals() {
        Product sauvage = product("Sauvage", "89999.99", "50000");
        Product bleu = product("Bleu", "105000", "61000");
        Sale sale = Sale.create(NOW, PaymentMethod.CASH, "  ", 1L);

        sale.addItem(sauvage, 2);
        sale.addItem(bleu, 1);
        sale.applyDiscount(new BigDecimal("4999.985"));
        sale.close();

        assertThat(sale.getNotes()).isNull();
        assertThat(sale.getSubtotal()).isEqualTo(new BigDecimal("284999.98"));
        assertThat(sale.getDiscount()).isEqualTo(new BigDecimal("4999.99"));
        assertThat(sale.getTotal()).isEqualTo(new BigDecimal("279999.99"));
        assertThat(sale.getItems()).hasSize(2);
        SaleItem first = sale.getItems().get(0);
        assertThat(first.getUnitPrice()).isEqualTo(new BigDecimal("89999.99"));
        assertThat(first.getUnitCost()).isEqualTo(new BigDecimal("50000.00"));
        assertThat(first.getSubtotal()).isEqualTo(new BigDecimal("179999.98"));
        assertThat(sale.getStatus()).isEqualTo(SaleStatus.COMPLETED);
    }

    @Test
    void sameProductTwiceMergesQuantities() {
        Product sauvage = product("Sauvage", "100", "50");
        Sale sale = Sale.create(NOW, PaymentMethod.MP, null, 1L);

        sale.addItem(sauvage, 1);
        sale.addItem(sauvage, 2);

        assertThat(sale.getItems()).hasSize(1);
        assertThat(sale.getItems().get(0).getQuantity()).isEqualTo(3);
        assertThat(sale.getTotal()).isEqualTo(new BigDecimal("300.00"));
    }

    @Test
    void rejectsInactiveProductZeroQuantityAndEmptySale() {
        Product inactive = product("Viejo", "100", "50");
        inactive.deactivate();
        Sale sale = Sale.create(NOW, PaymentMethod.CARD, null, 1L);

        assertThatThrownBy(() -> sale.addItem(inactive, 1)).isInstanceOf(DomainException.class)
                .hasMessageContaining("dado de baja");
        assertThatThrownBy(() -> sale.addItem(product("X", "1", "1"), 0)).isInstanceOf(ValidationException.class);
        assertThatThrownBy(sale::close).isInstanceOf(ValidationException.class)
                .hasMessageContaining("al menos un ítem");
    }

    @Test
    void discountCannotExceedSubtotalOrBeNegative() {
        Sale sale = Sale.create(NOW, PaymentMethod.TRANSFER, null, 1L);
        sale.addItem(product("X", "100", "50"), 1);

        assertThatThrownBy(() -> sale.applyDiscount(new BigDecimal("-1"))).isInstanceOf(ValidationException.class);
        sale.applyDiscount(new BigDecimal("100.01"));
        assertThatThrownBy(sale::close).isInstanceOf(DomainException.class);
        sale.applyDiscount(new BigDecimal("100"));
        sale.close();
        assertThat(sale.getTotal()).isEqualTo(new BigDecimal("0.00"));
    }

    @Test
    void cancelIsIdempotentOnlyOnce() {
        Sale sale = Sale.create(NOW, PaymentMethod.CASH, null, 1L);
        sale.addItem(product("X", "100", "50"), 1);
        sale.cancel();
        assertThat(sale.getStatus()).isEqualTo(SaleStatus.CANCELLED);
        assertThatThrownBy(sale::cancel).isInstanceOf(DomainException.class);
    }

    @Test
    void requiresDateMethodAndUser() {
        assertThatThrownBy(() -> Sale.create(null, PaymentMethod.CASH, null, 1L)).isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> Sale.create(NOW, null, null, 1L)).isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> Sale.create(NOW, PaymentMethod.CASH, null, null)).isInstanceOf(ValidationException.class);
    }
}
