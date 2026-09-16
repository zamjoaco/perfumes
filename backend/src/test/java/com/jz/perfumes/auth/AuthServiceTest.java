package com.jz.perfumes.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.jz.perfumes.shared.ValidationException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-15T12:00:00Z");
    private static final String SECRET = "test-secret-0123456789abcdef0123456789abcdef0123456789";

    @Mock AppUserRepository users;
    @Mock PasswordEncoder encoder;

    private AuthService service;
    private JwtService jwtService;
    private AppUser admin;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
        var props = new AuthProperties(new AuthProperties.Admin("admin", "x", false),
                new AuthProperties.Jwt(SECRET, Duration.ofHours(12)));
        jwtService = new JwtService(props, clock);
        service = new AuthService(users, encoder, jwtService, clock);
        admin = AppUser.create("admin", "hash");
    }

    @Test
    void loginIssuesTokenAndRecordsLastLogin() {
        when(users.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(encoder.matches("secret", "hash")).thenReturn(true);

        LoginResponse response = service.login(new LoginRequest(" admin ", "secret"));

        assertThat(response.username()).isEqualTo("admin");
        assertThat(response.expiresAt()).isEqualTo(NOW.plus(Duration.ofHours(12)));
        assertThat(jwtService.parse(response.token())).map(AuthenticatedUser::username).contains("admin");
        assertThat(admin.getLastLoginAt()).isEqualTo(NOW);
    }

    @Test
    void rejectsLoginWithWrongPassword() {
        when(users.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(encoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("admin", "wrong")))
                .isInstanceOf(BadCredentialsException.class);
        assertThat(admin.getLastLoginAt()).isNull();
    }

    @Test
    void rejectsLoginOfUnknownUserWithSameMessageAsWrongPassword() {
        when(users.findByUsername("nadie")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(new LoginRequest("nadie", "x")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Usuario o contraseña incorrectos");
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        when(users.findById(1L)).thenReturn(Optional.of(admin));
        when(encoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword(1L, new ChangePasswordRequest("wrong", "nueva-clave")))
                .isInstanceOf(ValidationException.class);
        assertThat(admin.getPasswordHash()).isEqualTo("hash");
    }

    @Test
    void changePasswordRejectsSamePassword() {
        when(users.findById(1L)).thenReturn(Optional.of(admin));
        when(encoder.matches("misma", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.changePassword(1L, new ChangePasswordRequest("misma", "misma")))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void changePasswordStoresNewHash() {
        when(users.findById(1L)).thenReturn(Optional.of(admin));
        when(encoder.matches("actual", "hash")).thenReturn(true);
        when(encoder.encode(anyString())).thenReturn("nuevo-hash");

        service.changePassword(1L, new ChangePasswordRequest("actual", "nueva-clave"));

        assertThat(admin.getPasswordHash()).isEqualTo("nuevo-hash");
    }

    @Test
    void jwtRejectsExpiredAndTamperedTokens() {
        String token = jwtService.issue(admin).token();

        var later = new JwtService(new AuthProperties(null, new AuthProperties.Jwt(SECRET, Duration.ofHours(12))),
                Clock.fixed(NOW.plus(Duration.ofHours(13)), ZoneOffset.UTC));
        assertThat(later.parse(token)).isEmpty();

        assertThat(jwtService.parse(token.substring(0, token.length() - 2) + "xx")).isEmpty();
        assertThat(jwtService.parse("no-es-un-jwt")).isEmpty();
    }
}
