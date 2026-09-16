package com.jz.perfumes.product;

public record BrandResponse(Long id, String name) {
    public static BrandResponse from(Brand brand) {
        return new BrandResponse(brand.getId(), brand.getName());
    }
}
