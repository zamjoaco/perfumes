package com.jz.perfumes.sale;

import java.math.BigDecimal;

public record SaleItemResponse(Long productId, String productName, String brand, String sku, int quantity,
                               BigDecimal unitPrice, BigDecimal unitCost, BigDecimal subtotal) {

    public static SaleItemResponse from(SaleItem i) {
        var p = i.getProduct();
        return new SaleItemResponse(p.getId(), p.getName(), p.getBrand().getName(), p.getSku(), i.getQuantity(),
                i.getUnitPrice(), i.getUnitCost(), i.getSubtotal());
    }
}
