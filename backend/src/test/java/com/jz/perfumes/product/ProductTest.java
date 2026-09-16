package com.jz.perfumes.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jz.perfumes.shared.DomainException;
import com.jz.perfumes.shared.ValidationException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ProductTest {

    private static Product.ProductBuilder valid() {
        return Product.builder()
                .sku("abc-1").brand(Brand.create("Dior")).name("Sauvage")
                .concentration(Concentration.EDP).sizeMl(100).presentation(Presentation.BOTTLE)
                .costPrice(new BigDecimal("50000")).salePrice(new BigDecimal("89999.999")).minStock(2);
    }

    @Test
    void normalizesSkuAndRoundsMoneyToTwoDecimals() {
        Product p = Product.builder().sku(" ab c-1 ").brand(Brand.create("Dior")).name(" Sauvage ")
                .concentration(Concentration.EDP).sizeMl(100).presentation(Presentation.BOTTLE)
                .costPrice(new BigDecimal("50000")).salePrice(new BigDecimal("89999.995")).minStock(2).build();

        assertThat(p.getSku()).isEqualTo("ABC-1");
        assertThat(p.getName()).isEqualTo("Sauvage");
        assertThat(p.getCostPrice()).isEqualTo(new BigDecimal("50000.00"));
        assertThat(p.getSalePrice()).isEqualTo(new BigDecimal("90000.00"));
        assertThat(p.getCurrentStock()).isZero();
        assertThat(p.isActive()).isTrue();
        assertThat(p.isBelowMinimum()).isTrue();
    }

    @Test
    void rejectsNegativePricesAndInvalidSize() {
        assertThatThrownBy(() -> valid().costPrice(new BigDecimal("-1")).build()).isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> valid().salePrice(null).build()).isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> valid().sizeMl(0).build()).isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> valid().minStock(-1).build()).isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> valid().sku("  ").build()).isInstanceOf(ValidationException.class);
    }

    @Test
    void stockNeverGoesNegative() {
        Product p = valid().build();
        p.increaseStock(5);
        assertThat(p.getCurrentStock()).isEqualTo(5);
        assertThat(p.isBelowMinimum()).isFalse();

        assertThatThrownBy(() -> p.decreaseStock(6)).isInstanceOf(DomainException.class)
                .hasMessageContaining("Stock insuficiente");
        assertThatThrownBy(() -> p.decreaseStock(0)).isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> p.increaseStock(-1)).isInstanceOf(ValidationException.class);

        p.decreaseStock(3);
        assertThat(p.getCurrentStock()).isEqualTo(2);
        assertThat(p.isBelowMinimum()).isTrue();
    }

    @Test
    void deactivateIsReversible() {
        Product p = valid().build();
        p.deactivate();
        assertThat(p.isActive()).isFalse();
        p.activate();
        assertThat(p.isActive()).isTrue();
    }
}
