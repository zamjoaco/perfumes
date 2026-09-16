package com.jz.perfumes.product;

import java.math.BigDecimal;

public record ProductResponse(
        Long id, String sku, Long brandId, String brand, String name,
        Concentration concentration, Presentation presentation, int sizeMl,
        Gender gender, String fragranceFamily,
        BigDecimal costPrice, BigDecimal salePrice,
        int currentStock, int minStock, boolean belowMinimum, boolean active) {

    public static ProductResponse from(Product p) {
        return new ProductResponse(p.getId(), p.getSku(), p.getBrand().getId(), p.getBrand().getName(), p.getName(),
                p.getConcentration(), p.getPresentation(), p.getSizeMl(), p.getGender(), p.getFragranceFamily(),
                p.getCostPrice(), p.getSalePrice(), p.getCurrentStock(), p.getMinStock(), p.isBelowMinimum(),
                p.isActive());
    }
}
