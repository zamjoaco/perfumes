package com.jz.perfumes.auth;

/** Principal que viaja en el SecurityContext tras validar el JWT. De acá sale `created_by`. */
public record AuthenticatedUser(Long id, String username) {
}
