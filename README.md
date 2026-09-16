# Pefumes

Inventario y ventas de perfumes. Una sola persona, una PC en casa, un `docker compose up`.

## Stack

Spring Boot 3.5 (Java 21) · Angular 21 · PostgreSQL 16 · Tailwind v4 · Docker Compose.
El jar sirve el build de Angular: una sola URL, sin nginx.

## Levantar en casa (producción)

1. Instalar Docker Desktop.
2. Copiar `.env.example` a `.env` y completar `DB_PASSWORD`, `APP_ADMIN_PASSWORD` y `APP_JWT_SECRET`.
3. `docker compose up -d --build`
4. Entrar a `http://localhost:8080` desde la PC, o `http://<ip-de-la-pc>:8080` desde el celular en la misma wifi
   (la IP sale de `ipconfig`, "Dirección IPv4" del adaptador de wifi/ethernet).

Si desde el celular no carga, Windows está bloqueando el puerto. Una vez, en PowerShell como administrador:

```
New-NetFirewallRule -DisplayName "Pefumes 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Any
```

**Respaldá el `.env` junto con los backups**: sin `DB_PASSWORD` no se puede abrir el volumen de la base.

### Contraseña olvidada

En `.env` poné `APP_ADMIN_RESET_PASSWORD=true` y la contraseña nueva en `APP_ADMIN_PASSWORD`, corré
`docker compose up -d app` (rehashea al arrancar) y volvé a poner `false`.

### Si se pierde `DB_PASSWORD` con el volumen ya creado

El volumen guarda la contraseña con la que se creó; cambiarla en `.env` no alcanza. Poné en `.env` la nueva
y avisale a Postgres:

```
docker compose exec db psql -U postgres -c "ALTER USER postgres PASSWORD 'la-nueva'"
docker compose up -d app
```

## Backup y restauración

```
.\scripts\backup.ps1                                        # → backups\perfumes-AAAA-MM-DD_HHmm.sql
.\scripts\restore.ps1 .\backups\perfumes-2026-09-15_2330.sql  # pisa TODA la base, pide confirmación
```

El backup se hace con `pg_dump` dentro del contenedor y `docker cp`: no usar `>` de PowerShell, escribe UTF-16
y `psql` no lo lee. Conviene copiar `backups\` y `.env` a un pendrive o a la nube cada tanto.

## Desarrollo

```
docker compose up -d db
cd backend && .\mvnw.cmd spring-boot:run     # http://localhost:8080
cd frontend && npm start                     # http://localhost:4200, proxy /api → 8080
```

Tests: `cd backend && .\mvnw.cmd verify` (usa Testcontainers, necesita Docker) y `cd frontend && npm test`.

Ojo: el contenedor `perfumes-app` vuelve a arrancar solo con Docker y ocupa el 8080. Antes de correr el backend
local: `docker compose stop app`.

## Cómo funciona

- **Productos**: alta con marca, concentración, tamaño, presentación, costo y precio. El SKU se normaliza
  (mayúsculas, sin espacios). Baja lógica: un producto vendido nunca se borra, se desactiva y no se puede vender.
- **Stock**: nunca se edita a mano. Toda variación es un movimiento (compra, ajuste, devolución, pérdida, venta)
  con la foto del stock resultante, así el historial siempre cierra. Stock bajo = stock actual ≤ mínimo.
- **Ventas**: el carrito arma ítems y descuento; el total lo calcula el backend con los precios del momento y
  descuenta stock en la misma transacción. Si un ítem no tiene stock, no queda nada. Cancelar una venta devuelve
  el stock con movimientos de devolución. Precio y costo quedan congelados en cada ítem (margen real).

## Decisiones

| Tema | Decisión |
|---|---|
| Arquitectura | Monolito plano por feature (`auth`, `product`, `stock`, `sale`). Sin módulos, eventos ni fachadas. |
| Auth | JWT HS256 stateless, tabla `app_user` con un solo registro creado desde `.env`. `created_by` en ventas y movimientos. |
| Plata | `NUMERIC(12,2)` / `BigDecimal` escala 2 en el back; centavos enteros en el front. ARS. Snapshot de precio y costo en cada ítem de venta. |
| Stock | Toda variación pasa por un `stock_movement` con `stock_after`. Venta y stock en la misma transacción, con bloqueo de fila del producto. |
| Baja | Lógica (`active = false`); un producto vendido nunca se borra. |
| Frontend | Neumorfismo con modo claro/oscuro. Íconos y logo solo SVG. Un botón de acento por pantalla. |
| Tests | Solo donde hay plata o stock: dominio puro + flujo completo contra Postgres real. |
| Alcance | MVP hecho: productos con stock → venta → alerta de stock bajo. CSV, clientes, proveedores y dashboard después, si el uso lo pide. |
