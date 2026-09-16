package com.jz.perfumes.auth;

import com.jz.perfumes.shared.BaseEntity;
import com.jz.perfumes.shared.ValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** El único usuario de la app. Se crea desde .env al arrancar; nunca desde un endpoint. */
@Entity
@Table(name = "app_user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppUser extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    private AppUser(String username, String passwordHash) {
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public static AppUser create(String username, String passwordHash) {
        if (username == null || username.isBlank()) {
            throw new ValidationException("El nombre de usuario es obligatorio");
        }
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new ValidationException("La contraseña es obligatoria");
        }
        return new AppUser(username.trim(), passwordHash);
    }

    public void changePassword(String newPasswordHash) {
        if (newPasswordHash == null || newPasswordHash.isBlank()) {
            throw new ValidationException("La contraseña es obligatoria");
        }
        this.passwordHash = newPasswordHash;
    }

    public void recordLogin(Instant at) {
        this.lastLoginAt = at;
    }
}
