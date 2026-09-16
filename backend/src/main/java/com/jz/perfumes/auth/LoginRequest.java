package com.jz.perfumes.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "es obligatorio") String username,
        @NotBlank(message = "es obligatoria") String password) {
}
