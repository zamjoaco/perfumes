package com.jz.perfumes.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BrandRequest(@NotBlank(message = "es obligatorio") @Size(max = 80, message = "máximo 80 caracteres") String name) {
}
