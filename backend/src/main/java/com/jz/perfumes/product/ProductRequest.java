package com.jz.perfumes.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "es obligatorio") @Size(max = 40, message = "máximo 40 caracteres") String sku,
        @NotNull(message = "es obligatoria") Long brandId,
        @NotBlank(message = "es obligatorio") @Size(max = 150, message = "máximo 150 caracteres") String name,
        @NotNull(message = "es obligatoria") Concentration concentration,
        @NotNull(message = "es obligatorio") @Positive(message = "tiene que ser mayor a cero") Integer sizeMl,
        @NotNull(message = "es obligatoria") Presentation presentation,
        Gender gender,
        @Size(max = 40, message = "máximo 40 caracteres") String fragranceFamily,
        @NotNull(message = "es obligatorio") @DecimalMin(value = "0", message = "no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "hasta 2 decimales") BigDecimal costPrice,
        @NotNull(message = "es obligatorio") @DecimalMin(value = "0", message = "no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "hasta 2 decimales") BigDecimal salePrice,
        @NotNull(message = "es obligatorio") @Min(value = 0, message = "no puede ser negativo") Integer minStock) {
}
