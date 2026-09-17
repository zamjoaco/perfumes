# Levantar Perfumes — guía para personas

Para usar la app en casa o para desarrollarla. Todo pensado para Windows 11 con PowerShell.
Si solo querés **usar** la app, con la primera parte alcanza.

## 1. Usarla en casa (producción)

### Qué necesitás

- **Docker Desktop** (https://www.docker.com/products/docker-desktop/). Instalalo, abrilo y esperá a que diga "Engine running".
- **Git** (https://git-scm.com/download/win), solo para bajar el proyecto. Con las opciones por defecto está bien.

### Pasos

1. Bajar el proyecto. En PowerShell:

   ```
   cd $HOME
   git clone https://github.com/zamjoaco/perfumes.git
   cd perfumes
   ```

2. Crear el archivo de secretos:

   ```
   Copy-Item .env.example .env
   notepad .env
   ```

   Completá tres valores y guardá:

   | Variable | Qué poner |
   |---|---|
   | `DB_PASSWORD` | Una contraseña cualquiera para la base. **No la pierdas**: sin ella no se abre la base. |
   | `APP_ADMIN_PASSWORD` | La contraseña con la que vas a entrar a la app. El usuario es `admin` (`APP_ADMIN_USER`). |
   | `APP_JWT_SECRET` | Un texto largo al azar, mínimo 32 caracteres. Sirve cualquier cosa tipo `k8Hf3...`; si tenés Git Bash: `openssl rand -base64 48`. |

3. Levantar todo:

   ```
   docker compose up -d --build
   ```

   La primera vez tarda varios minutos (baja Node, Maven, Java y compila). Las siguientes, segundos.

4. Entrar a **http://localhost:8080** y loguearte con `admin` y la contraseña que pusiste.

### Desde el celular

Tiene que estar en la misma wifi que la PC. La dirección es `http://<ip-de-la-pc>:8080`. La IP sale con `ipconfig`,
línea "Dirección IPv4" del adaptador de wifi o ethernet (algo como `192.168.0.15`).

Si no carga, Windows está bloqueando el puerto. Una sola vez, en PowerShell **como administrador**:

```
New-NetFirewallRule -DisplayName "Perfumes 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Any
```

### Día a día

- La app arranca sola cuando abrís Docker Desktop. No hay que hacer nada más.
- Parar: `docker compose stop`. Volver a arrancar: `docker compose start`.
- Ver que esté viva: `docker compose ps` (las dos filas tienen que decir `running`/`healthy`).
- Ver qué pasó si algo falla: `docker compose logs app --tail 100`.

### Actualizar a una versión nueva

```
git pull
docker compose up -d --build
```

Los datos quedan: viven en un volumen de Docker, no en el contenedor.

### Backup y restauración

```
.\scripts\backup.ps1                                          # crea backups\perfumes-AAAA-MM-DD_HHmm.sql
.\scripts\restore.ps1 .\backups\perfumes-2026-09-15_2330.sql  # pisa TODA la base, pide confirmación
```

Copiá cada tanto la carpeta `backups\` **y el archivo `.env`** a un pendrive o a la nube. Con esas dos cosas se
reconstruye todo en otra PC: clonás, pegás el `.env`, `docker compose up -d --build` y `restore.ps1`.

### Problemas comunes

| Síntoma | Qué hacer |
|---|---|
| Me olvidé la contraseña de la app | En `.env` poné `APP_ADMIN_RESET_PASSWORD=true` y la nueva en `APP_ADMIN_PASSWORD`. `docker compose up -d app`. Volvé a poner `false`. |
| Cambié `DB_PASSWORD` y la app no arranca | El volumen guarda la contraseña original. Poné la nueva en `.env` y avisale a Postgres: `docker compose exec db psql -U postgres -c "ALTER USER postgres PASSWORD 'la-nueva'"` y después `docker compose up -d app`. |
| `Definí DB_PASSWORD en .env` | Falta el `.env` o está vacío ese valor. Volvé al paso 2. |
| El puerto 8080 está ocupado | Algo más lo usa. Cerralo, o cambiá `"8080:8080"` por `"8081:8080"` en `docker-compose.yml` y entrá por `:8081`. |
| `docker: command not found` | Docker Desktop no está abierto o la terminal es anterior a la instalación. Cerrá y abrí PowerShell. |

## 2. Desarrollarla

### Qué necesitás además

- **Java 21** (JDK). Verificar: `java -version` → `21.x`.
- **Node 24** con npm. Verificar: `node -v` → `v24.x`.
- El `.env` del paso 2 de arriba: Spring Boot lo lee desde la raíz del repo.

### Arrancar

Tres terminales:

```
docker compose stop app      # el contenedor de producción ocupa el 8080; si no lo parás, el backend local no levanta
docker compose up -d db      # solo la base
```

```
cd backend
.\mvnw.cmd spring-boot:run   # API en http://localhost:8080. Listo cuando el log dice "Started PerfumesApplication"
```

```
cd frontend
npm install                  # solo la primera vez o cuando cambia package.json
npm start                    # http://localhost:4200, con recarga automática. /api va al 8080 por proxy.conf.json
```

Desarrollás en **http://localhost:4200**. El 8080 sirve la API y, si alguna vez hiciste `ng build`, un frontend viejo:
ignoralo.

### Tests

```
cd backend;  .\mvnw.cmd verify   # necesita Docker abierto: levanta un Postgres efímero con Testcontainers
cd frontend; npm test            # vitest
```

### Antes de dar algo por terminado

Regla de la casa: la app corriendo y probada en el navegador, **en modo claro y en modo oscuro** (el botón de tema está
en el header). Y si el cambio toca plata o stock, tests en verde.

### Dónde está cada cosa

- `backend/src/main/java/com/jz/perfumes/` — un paquete por feature: `auth`, `product`, `stock`, `sale`, `shared`.
- `backend/src/main/resources/db/migration/` — el esquema. Cambios = migration nueva, nunca editar una aplicada.
- `frontend/src/app/` — `core/` (auth, tema, http), `shared/ui/` (componentes neumórficos), `features/<nombre>/`.
- `.claude/skills/` — las reglas de cada lado, sirven también como documentación de convenciones.
- `README.md` — decisiones de diseño y cómo funciona el negocio (productos, stock, ventas).
