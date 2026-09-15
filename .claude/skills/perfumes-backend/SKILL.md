---
name: perfumes-backend
description: "Reglas del backend Spring Boot del proyecto Pefumes (inventario y ventas de perfumes para una sola persona): monolito plano por feature, JPA + Flyway + Postgres, JWT. Usá esta skill SIEMPRE que se toque código Java de backend/: entidad, repositorio, service, controller, migration, test, seguridad o config. Reemplaza a springboot-generator en este repo. Se activa aunque el usuario diga solo 'hacé el backend', 'agregá el endpoint', 'la venta no descuenta stock' o pegue un stacktrace."
---

# perfumes-backend

App de inventario para **una persona** que la levanta en su casa. La prioridad es que funcione, se entienda de un vistazo y no se rompa con la plata ni el stock. Todo lo demás es opcional.

## Estructura

`backend/src/main/java/com/jz/perfumes/` con un paquete **plano** por feature: `shared/`, `auth/`, `product/`, `stock/`, `sale/`. Entidad, repositorio, service, controller y records de request/response conviven en el mismo paquete. Sin `internal/`, `web/`, `dto/`, sin fachadas ni eventos: un service llama a otro service directamente.

## Reglas

- **Una sola clase de service** (`ProductService`), sin interfaz. `@Transactional` en el service, `readOnly = true` en lecturas. Nunca `@Transactional` en controllers.
- **Mapeo explícito**: `ProductResponse.from(product)` como método estático del record. Sin ModelMapper ni MapStruct.
- **Entidades sin setters públicos.** Lombok: `@Getter`, `@Builder` con constructor privado, `@NoArgsConstructor(access = PROTECTED)`. Nunca `@Setter` ni `@Data`. Los cambios de estado son métodos con nombre de negocio: `increaseStock(n)`, `decreaseStock(n)`, `deactivate()`, `sale.cancel()`. Toda entidad extiende `shared/BaseEntity` (id, createdAt, updatedAt) y su tabla tiene esas columnas.
- **Plata**: `BigDecimal` con `@Column(precision = 12, scale = 2)` y `setScale(2, RoundingMode.HALF_UP)` al operar. Nunca `double`/`float`. Todo ARS.
- **Excepciones**: `DomainException` → 409, `NotFoundException` → 404, `ValidationException` → 400 (en `shared/`). Las lanza la entidad o el service; `GlobalExceptionHandler` las traduce. Un nulo obligatorio es `ValidationException`, no `requireNonNull`.
- **Controllers**: solo records `@Valid` de request/response, `201` con `Location` al crear, `204` al desactivar. Baja lógica (`active = false`), nunca `DELETE` físico de productos. Paginación: devolver `Page<T>` directo; `serialization-mode: via_dto` ya produce `{ content, page: {...} }`.
- **Filtros**: un `@Query` JPQL con `(:param IS NULL OR ...)`. Sin `Specification`.
- **Esquema**: una migration `V<n>__<descripcion>.sql` por cambio. Nunca editar una ya aplicada. `ddl-auto = validate`.
- **Auditoría**: `sale` y `stock_movement` llevan `created_by` (id del `AppUser` del token). Se obtiene del `Principal`, nunca del body.
- Identificadores en inglés; mensajes de error de negocio en español.

## Patrones: solo con justificación de una línea

Antes de agregar un patrón, escribí en una línea qué problema concreto resuelve. Si no sale la línea, no va. Prohibidos de entrada: interfaces con una sola implementación, Singleton manual, herencia para reusar código, `@Data` en entidades, entidades JPA en firmas de controller. Sin análisis de complejidad: cientos de productos no lo justifican.

## Tests

Solo donde hay plata o stock; un CRUD de marcas no necesita test.
- Dominio en JUnit puro sin Spring: `new Sale(...)`, `sale.addItem(...)`, assert. Nombre = la regla: `rejectsSaleWhenStockIsInsufficient`.
- Services con Mockito cuando la lógica de orquestación lo pide.
- Integración con Testcontainers (`@ServiceConnection`, `postgres:16-alpine`) para el flujo completo de venta y movimientos. `src/test/resources/application.properties` ya trae `app.admin.*` para que el seeder cree el usuario de `created_by`.
- `.\mvnw.cmd verify` en verde antes de mergear. `/code-review` en las historias que tocan ventas o stock.

## Por qué no `springboot-generator`

Genera `IService/Impl`, ModelMapper y reglas en el service para rendir parciales. Acá la regla vive en la entidad y no hay indirección sin beneficio. Si se activa, ignorala.
