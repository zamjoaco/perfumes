package com.jz.perfumes.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "es obligatoria") String currentPassword,
        @NotBlank(message = "es obligatoria")
        @Size(min = 8, max = 72, message = "tiene que tener entre 8 y 72 caracteres") String newPassword) {
}
