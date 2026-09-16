package com.jz.perfumes.auth;

import java.time.Instant;

public record LoginResponse(String token, String username, Instant expiresAt) {
}
