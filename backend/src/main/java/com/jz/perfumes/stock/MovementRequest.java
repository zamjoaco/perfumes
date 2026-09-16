package com.jz.perfumes.stock;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** `quantity` es la cantidad con signo para ADJUSTMENT; para el resto se toma el valor absoluto. */
public record MovementRequest(
        @NotNull(message = "es obligatorio") MovementType type,
        @NotNull(message = "es obligatoria") Integer quantity,
        @DecimalMin(value = "0", message = "no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "hasta 2 decimales") BigDecimal unitCost,
        @Size(max = 200, message = "máximo 200 caracteres") String reason) {
}
