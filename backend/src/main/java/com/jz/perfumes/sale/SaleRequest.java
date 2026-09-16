package com.jz.perfumes.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** El total NO viaja: lo calcula el backend con los precios actuales de cada producto. */
public record SaleRequest(
        @NotEmpty(message = "la venta necesita al menos un ítem") List<@Valid SaleItemRequest> items,
        @NotNull(message = "es obligatorio") PaymentMethod paymentMethod,
        @DecimalMin(value = "0", message = "no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "hasta 2 decimales") BigDecimal discount,
        @Size(max = 500, message = "máximo 500 caracteres") String notes,
        Instant soldAt) {
}
