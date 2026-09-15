# Pefumes

Inventario y ventas de perfumes. Una sola persona, una PC en casa, un `docker compose up`.

## Stack

Spring Boot 3.5 (Java 21) · Angular 21 · PostgreSQL 16 · Tailwind v4 · Docker Compose.
El jar sirve el build de Angular: una sola URL, sin nginx.

## Levantar en casa (producción)

1. Instalar Docker Desktop.
2. Copiar `.env.example` a `.env` y completar `DB_PASSWORD`, `APP_ADMIN_PASSWORD` y `APP_JWT_SECRET`.
3. `docker compose up -d --build`
4. Entrar a `http://localhost:8080` desde la PC, o `http://<ip-de-la-pc>:8080` desde el celular en la misma wifi.

**Respaldá el `.env` junto con los backups**: sin `DB_PASSWORD` no se puede abrir el volumen de la base.

## Desarrollo

```
docker compose up -d db
cd backend && .\mvnw.cmd spring-boot:run     # http://localhost:8080
cd frontend && npm start                     # http://localhost:4200, proxy /api → 8080
```

Tests: `cd backend && .\mvnw.cmd verify` (usa Testcontainers, necesita Docker) y `cd frontend && npm test`.

## Backup

Pendiente (`scripts/backup.ps1`). Manual mientras tanto:

```
docker compose exec db pg_dump -U postgres --file /tmp/perfumes.sql perfumes
docker cp perfumes-db:/tmp/perfumes.sql .\backups\perfumes-$(Get-Date -Format yyyy-MM-dd).sql
```

## Decisiones

| Tema | Decisión |
|---|---|
| Arquitectura | Monolito plano por feature (`auth`, `product`, `stock`, `sale`). Sin módulos, eventos ni fachadas. |
| Auth | JWT HS256 stateless, tabla `app_user` con un solo registro creado desde `.env`. `created_by` en ventas y movimientos. |
| Plata | `NUMERIC(12,2)` / `BigDecimal` escala 2. ARS. Snapshot de precio y costo en cada ítem de venta. |
| Stock | Toda variación pasa por un `stock_movement` con `stock_after`. La venta descuenta en la misma transacción. |
| Baja | Lógica (`active = false`); un producto vendido nunca se borra. |
| Frontend | Neumorfismo con modo claro/oscuro. Íconos y logo solo SVG. Un botón de acento por pantalla. |
| Tests | Solo donde hay plata o stock. |
| Alcance | MVP: productos con stock → venta → alerta de stock bajo. CSV, clientes, proveedores y dashboard después. |
