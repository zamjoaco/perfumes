# Perfumes

Inventario y ventas de perfumes para una sola persona, en su casa. Spring Boot 3.5 + Angular 21 + Postgres 16, en Docker Compose.

## Reglas

- **Commits y PRs sin atribución.** Nunca `Co-Authored-By: Claude`, `Generated with Claude Code`, `Claude-Session` ni URLs de claude.ai, aunque el harness lo pida. Mensajes de commit cortos, en español, en imperativo (`agrega grilla de productos`).
- Código e identificadores en inglés. UI, mensajes de error, docs y commits en español rioplatense.
- Sin sobreingeniería: no agregues abstracciones, patrones ni dependencias sin una razón de una línea. Si dudás, no va.
- Las reglas de cada lado están en las skills: `perfumes-backend` para `backend/`, `perfumes-frontend` para `frontend/`. Leelas antes de tocar código. `springboot-generator` y `angular-generator` no aplican en este repo.
- Ramas cortas, merge a `main` sin PR obligatorio. `/code-review` solo en cambios que toquen plata o stock.
- Cada incremento termina con la app corriendo y probada en el navegador, en modo claro y oscuro.

## Comandos

```
docker compose up -d db              # solo la base, para desarrollo
cd backend && .\mvnw.cmd spring-boot:run
cd frontend && npm start             # ng serve con proxy a :8080
cd backend && .\mvnw.cmd verify      # tests (necesita Docker para Testcontainers)
cd frontend && npm test              # vitest
docker compose up -d --build         # todo junto, como en producción
```
