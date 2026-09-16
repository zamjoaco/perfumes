package com.jz.perfumes.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea el único usuario desde APP_ADMIN_USER / APP_ADMIN_PASSWORD si la tabla está vacía.
 * Con APP_ADMIN_RESET_PASSWORD=true rehashea la contraseña (rescate si se olvidó).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserSeeder implements ApplicationRunner {

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final AuthProperties properties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AuthProperties.Admin admin = properties.admin();
        if (isBlank(admin.username()) || isBlank(admin.password())) {
            throw new IllegalStateException("Definí APP_ADMIN_USER y APP_ADMIN_PASSWORD en .env (ver .env.example)");
        }
        if (users.count() == 0) {
            users.save(AppUser.create(admin.username(), encoder.encode(admin.password())));
            log.info("Usuario '{}' creado desde .env", admin.username());
            return;
        }
        if (admin.resetPassword()) {
            AppUser user = users.findByUsername(admin.username().trim())
                    .orElseThrow(() -> new IllegalStateException(
                            "APP_ADMIN_RESET_PASSWORD=true pero no existe el usuario '" + admin.username() + "'"));
            user.changePassword(encoder.encode(admin.password()));
            log.warn("Contraseña de '{}' reseteada desde .env. Volvé a poner APP_ADMIN_RESET_PASSWORD=false",
                    admin.username());
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
