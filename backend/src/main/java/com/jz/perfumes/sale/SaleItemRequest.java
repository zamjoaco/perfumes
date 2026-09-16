package com.jz.perfumes.sale;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SaleItemRequest(
        @NotNull(message = "es obligatorio") Long productId,
        @NotNull(message = "es obligatoria") @Positive(message = "tiene que ser mayor a cero") Integer quantity) {
}
