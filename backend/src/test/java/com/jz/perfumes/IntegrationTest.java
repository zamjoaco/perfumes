package com.jz.perfumes;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Un solo Postgres para todos los tests de integración. Se arranca a mano (sin @Container) para que
 * viva más que cada clase: el contexto de Spring se cachea entre clases y apunta a este puerto.
 */
@SpringBootTest
public abstract class IntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }
}
