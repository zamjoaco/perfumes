# Levantar Pefumes — guía para agentes de IA

Instrucciones deterministas para un agente que necesita la app corriendo (para probar un cambio, reproducir un bug
o verificar en el navegador). Windows 11, PowerShell. Leé `CLAUDE.md` primero; las reglas de código están en
`.claude/skills/perfumes-backend` y `.claude/skills/perfumes-frontend`.

## Hechos que condicionan todo

- Un solo puerto de API: **8080**. El contenedor `perfumes-app` (`restart: unless-stopped`) lo ocupa cada vez que
  arranca Docker. Antes de correr el backend local hay que pararlo, si no `spring-boot:run` falla con "Port 8080 already in use".
- Spring Boot lee `.env` desde la raíz del repo (`spring.config.import` en `application.yml`). Sin `.env` con
  `DB_PASSWORD`, `APP_ADMIN_*` y `APP_JWT_SECRET` (≥ 32 chars) el backend no arranca. **No lo generes ni lo modifiques
  sin pedir permiso**: contiene la contraseña del volumen de la base del usuario.
- El esquema lo gobierna Flyway (`ddl-auto: validate`). Si una entidad no coincide con la migration, falla al arrancar.
- Todo `/api/**` menos `/api/auth/login` pide JWT (`Authorization: Bearer <token>`). `/actuator/health` es público.
- El frontend en dev corre en **4200** y proxya `/api` al 8080 (`frontend/proxy.conf.json`). En prod el mismo jar sirve
  el build de Angular desde `static/` (ignorado por git).
- `backend/mvnw.cmd` desde PowerShell; `./mvnw` desde Bash. No uses un `mvn` global.

## 0. Verificar prerequisitos

```
docker info --format "{{.ServerVersion}}"   # falla → Docker Desktop cerrado; no se puede seguir
java -version                                # 21.x
node -v                                      # v24.x
Test-Path .env                               # True; si es False, frená y pedile al usuario que lo cree desde .env.example
```

## 1. Modo desarrollo (backend local + ng serve)

Es el modo para trabajar en código. Orden exacto:

```
docker compose stop app
docker compose up -d db
docker compose ps db          # esperar STATUS "healthy" (healthcheck cada 5 s)
```

Backend, en background (tarda ~20-40 s):

```
cd backend; .\mvnw.cmd spring-boot:run
```

Listo cuando el log dice `Started PerfumesApplication`. Verificación sin depender del log:

```
curl.exe -s http://localhost:8080/actuator/health      # {"status":"UP"}
```

Frontend: usá `preview_start` con `{name: "frontend"}` (`.claude/launch.json` ya define `npx ng serve --port 4200`
en `frontend/`). Si `frontend/node_modules` no existe, antes `cd frontend; npm install`. Nunca levantes servers con
Bash si tenés `preview_start`.

Verificación: `http://localhost:4200/login` responde y la consola del navegador no tiene errores.

## 2. Modo producción (todo en Docker)

Para verificar el build completo o reproducir exactamente lo que ve el usuario:

```
docker compose up -d --build     # primera vez: varios minutos (npm ci + mvn package)
docker compose ps                # db healthy, app running
curl.exe -s http://localhost:8080/actuator/health
```

Logs: `docker compose logs app --tail 100`. Al terminar, si vas a volver a modo desarrollo: `docker compose stop app`.

## 3. Probar la API a mano

Login (credenciales del `.env`, no las inventes; si no las tenés, pedilas):

```
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/login -ContentType application/json -Body '{"username":"admin","password":"<APP_ADMIN_PASSWORD>"}'
$h = @{ Authorization = "Bearer $($r.token)" }
Invoke-RestMethod -Uri http://localhost:8080/api/products -Headers $h
```

Endpoints: `/api/auth/{login,password}`, `/api/brands`, `/api/products` (`/summary`, `/{id}`, `/{id}/activate`),
`/api/products/{id}/movements`, `/api/sales` (`/today`, `/{id}`, `/{id}/cancel`). Las listas devuelven
`{ content: [...], page: { size, number, totalElements, totalPages } }`.

Rutas del frontend: `/login`, `/` (home), `/productos`, `/productos/nuevo`, `/productos/:id`, `/ventas`,
`/ventas/nueva`, `/ventas/:id`, `/cambiar-contrasena`.

## 4. Tests

```
cd backend; .\mvnw.cmd verify    # Testcontainers levanta postgres:16-alpine efímero; necesita Docker. ~1-2 min
cd frontend; npm test            # vitest, no necesita nada corriendo
```

Los tests de backend usan `src/test/resources/application.properties`, no el `.env`.

## 5. Verificar en el navegador (definición de terminado)

Todo incremento termina con la app corriendo y probada en el navegador **en modo claro y oscuro**. El tema se cambia
con el botón del header o con `document.documentElement.setAttribute('data-theme', 'dark')` desde `javascript_tool`;
persiste en `localStorage.theme`. Probá la pantalla que tocaste en ambos, sacá screenshot de las dos y chequeá
`read_console_messages` sin errores.

## 6. Apagar

```
docker compose stop            # db y app; los datos quedan en el volumen perfumes_data
```

Nunca `docker compose down -v`: borra la base del usuario.

## Errores frecuentes y su causa

| Mensaje | Causa | Fix |
|---|---|---|
| `Port 8080 was already in use` | `perfumes-app` corriendo | `docker compose stop app` |
| `Definí DB_PASSWORD en .env` | Falta `.env` | Pedírselo al usuario |
| `password authentication failed for user "postgres"` | `DB_PASSWORD` del `.env` ≠ la del volumen | Pedirle al usuario; el fix está en `README.md` |
| `Schema-validation: missing column/table` | Entidad cambiada sin migration | Agregar `V<n>__*.sql` en `db/migration`, nunca editar una aplicada |
| `FlywayValidateException ... checksum mismatch` | Se editó una migration ya aplicada | Revertir la edición y crear una nueva |
| `APP_JWT_SECRET tiene que tener al menos 32 caracteres` | `APP_JWT_SECRET` corto | Pedirle al usuario que lo cambie |
| `ng serve` sirve pero `/api` da 404/ECONNREFUSED | Backend no levantó | Ver logs del `spring-boot:run` |
| 401 en todo | Token vencido (12 h) o falta header | Volver a loguear |
| `psql` no puede leer un backup | Se generó con `>` de PowerShell (UTF-16) | Usar `scripts/backup.ps1` |
