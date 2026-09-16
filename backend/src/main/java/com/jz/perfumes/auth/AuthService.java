package com.jz.perfumes.auth;

import com.jz.perfumes.shared.NotFoundException;
import com.jz.perfumes.shared.ValidationException;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final Clock clock;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // Mismo mensaje para usuario inexistente y contraseña incorrecta: no revelar cuál falló.
        AppUser user = users.findByUsername(request.username().trim())
                .filter(u -> encoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Usuario o contraseña incorrectos"));
        user.recordLogin(clock.instant());
        JwtService.IssuedToken issued = jwtService.issue(user);
        return new LoginResponse(issued.token(), user.getUsername(), issued.expiresAt());
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        AppUser user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        if (!encoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ValidationException("La contraseña actual es incorrecta");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new ValidationException("La contraseña nueva tiene que ser distinta de la actual");
        }
        user.changePassword(encoder.encode(request.newPassword()));
    }
}
