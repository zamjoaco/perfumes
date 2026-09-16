package com.jz.perfumes.shared;

import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final Clock clock;

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiError> domain(DomainException e) {
        return error(HttpStatus.CONFLICT, e.getMessage());
    }

    /** Unique/FK que no se chequeó antes (p. ej. mismo producto con otra SKU): 409 genérico en vez de 500. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> integrity(DataIntegrityViolationException e) {
        return error(HttpStatus.CONFLICT, "Ya existe un registro igual o el dato está en uso");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> badCredentials(BadCredentialsException e) {
        return error(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> notFound(NotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> noResource(NoResourceFoundException e) {
        return error(HttpStatus.NOT_FOUND, "Recurso no encontrado");
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiError> validation(ValidationException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> beanValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .sorted()
                .reduce((a, b) -> a + "; " + b)
                .orElse("Datos inválidos");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException e) {
        return error(HttpStatus.BAD_REQUEST, "El cuerpo de la petición no es válido");
    }

    private ResponseEntity<ApiError> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ApiError(status.value(), message, clock.instant()));
    }
}
