package com.jz.perfumes.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Bloque `app:` de application.yml; los valores vienen de .env. */
@ConfigurationProperties(prefix = "app")
public record AuthProperties(Admin admin, Jwt jwt) {

    public record Admin(String username, String password, boolean resetPassword) {
    }

    public record Jwt(String secret, Duration expiration) {
    }
}
