package com.jz.perfumes.shared;

/** Regla de negocio violada: se traduce a HTTP 409. */
public class DomainException extends RuntimeException {
    public DomainException(String message) {
        super(message);
    }
}
