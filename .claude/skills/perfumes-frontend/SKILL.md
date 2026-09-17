---
name: perfumes-frontend
description: "Reglas del frontend Angular del proyecto Perfumes (inventario y ventas de perfumes para una sola persona): standalone, signals, Reactive Forms tipados, Tailwind v4 con neumorfismo en modo claro y oscuro, íconos SVG con lucide. Usá esta skill SIEMPRE que se toque código de frontend/: componente, pantalla, servicio HTTP, interceptor, guard, ruta, formulario, estilo o test. Reemplaza a angular-generator en este repo. Se activa aunque el usuario diga solo 'hacé la pantalla', 'armá el formulario', 'el login', 'que se vea neumórfico', 'en oscuro no se lee'."
---

# perfumes-frontend

Un solo usuario, uso diario, en notebook y a veces desde el celular en la misma wifi. Eso define las prioridades: **que se lea y que sea rápido de operar** vale más que cualquier efecto visual. El neumorfismo está al servicio de eso.

## Antes de tocar código

1. **Mirá qué ya existe en `shared/ui/` y `core/`.** Si hay `neu-button`, no se hace otro botón. Si hay `BaseCrudService`, el nuevo servicio lo extiende. El código de referencia está en `references/neu-components.md`.
2. **El contrato es el backend real.** Los `models.ts` de cada feature se escriben a partir de los records `XxxResponse`/`XxxRequest` del paquete Java correspondiente. Nada de inventar campos.

## Stack

- **Angular 21, zoneless, standalone.** Nombres sin sufijo `Component` (`shell.ts` → `Shell`, `product-list-page.ts` → `ProductListPage`).
- **Tailwind v4.** Sin `tailwind.config.js`: tokens en `src/styles.css`. Variables `--neu-*` definidas en `:root` (claro) y `[data-theme="dark"]` (oscuro); `@theme inline` las expone como `bg-neu`, `text-neuText`, `text-neuMuted`, `bg-accent`, `text-danger`, `shadow-neu`, `shadow-neu-sm`, `shadow-neu-inset`, `rounded-neu`. Un color nuevo se agrega ahí **en los dos temas**.
- **Vitest** vía `ng test`. `vi.fn()` para spies. Nada de Jasmine/Karma.
- **Sin `environments/`.** `API_URL = '/api'` en `core/api.ts`; en dev `proxy.conf.json` lo manda a `:8080`, en prod lo sirve el mismo jar.
- **Íconos y logos: SVG, siempre.** Íconos de UI con `lucide-angular` (`<lucide-icon name="package" />`, registrar el ícono en `app.config.ts`). Logo del negocio en `public/logo.svg`. Nunca PNG, JPG ni font-icons.

## Estructura

```
src/app/
├── core/          api.ts, theme.service.ts, auth.service.ts, interceptores, guard, form-errors.ts, base-crud.service.ts
├── shared/ui/     neu-card, neu-button, neu-input, neu-badge, page-header (+ los que hagan falta), index.ts
├── layout/        shell.ts (sidebar + header con toggle de tema + router-outlet)
└── features/<nombre>/   auth, products, stock, sales — mismos nombres que los paquetes Java
    ├── <nombre>.routes.ts, <nombre>.service.ts, models.ts
    ├── pages/       componentes de ruta
    └── components/  piezas propias de la feature
```

## Reglas técnicas

- Standalone siempre; rutas lazy con `loadComponent`/`loadChildren`.
- `inject()`, nunca constructor injection.
- Signals en componentes, Observables en servicios. `HttpClient` devuelve `Observable`; el componente lo convierte con `toSignal()` o lo suscribe en un handler.
- `@if` / `@for` (con `track item.id`) / `@switch`. Nunca `*ngIf`/`*ngFor`.
- Sin `any`. Reactive Forms tipados. Errores de formulario con `formError(control, mensajes)` de `core/form-errors.ts` (un `computed()` sobre `control.errors` no se recalcula).
- Cero lógica de negocio y cero `HttpClient` en componentes.
- Interceptores en este orden: `withInterceptors([errorInterceptor, authInterceptor])` — el último ve la respuesta primero, así `authInterceptor` detecta el 401 crudo. El 401 solo desloguea si la request llevaba token.
- Nunca `[innerHTML]` con datos del usuario.
- Locale `es-AR` ya registrado; montos con `currency:'ARS':'symbol-narrow':'1.2-2'`.

## Neumorfismo — la regla que decide todo

> **Superficies neumórficas. Texto y acción primaria, no.**

- **Sí**: cards, inputs, botones secundarios, badges, ítems de navegación.
- **No**: el texto (siempre `text-neuText`) y el botón de la acción principal de cada pantalla (`Guardar`, `Confirmar venta`), que va `variant="primary"` (`bg-accent` sólido). **Un solo botón de acento por pantalla.**
- El efecto real está en el "hundido": `shadow-neu-sm` en reposo → `shadow-neu-inset` en `:active` y en `:focus` de inputs.
- Los estados no dependen solo de la sombra: input con error lleva `border-danger` y texto; botón deshabilitado baja opacidad.
- Tamaños generosos: `h-11` en botones e inputs, targets ≥ 44 px.
- Una feature **nunca** escribe `shadow-neu-*` a mano: usa los `neu-*`. Si falta un componente, se agrega a `shared/ui/`.

## Modo claro y oscuro

- `ThemeService` (signal `theme`, `toggle()`) setea `data-theme` en `<html>` y persiste en `localStorage`; sin preferencia guardada arranca con `prefers-color-scheme`. `index.html` aplica el tema antes del primer render para evitar el flash.
- **Toda pantalla nueva se mira en los dos modos** antes de darla por lista. En oscuro la sombra clara tiene que ser apenas más clara que el fondo, nunca blanca; si algo "no se lee" en oscuro, la respuesta es más contraste en `--neu-text`, no más sombra.
- Nada de colores hardcodeados (`bg-white`, `text-gray-700`) en features: no cambian con el tema. Usar los tokens.

## Movimiento

Transiciones de 150–200 ms en hover/focus/active (`transition-all duration-150`), entrada suave de listas y modales. `prefers-reduced-motion` ya está respetado globalmente en `styles.css`. Sin animaciones decorativas en pantallas de operar (grilla, venta); si se quiere un detalle animado, va en el login.

## Plata en el navegador

El total del carrito es un **preview**: el que vale lo calcula el backend y el `SaleRequest` no manda total, solo ítems y descuento. Para sumar en el front trabajá en **centavos enteros** (`Math.round(x * 100)`) y dividí al mostrar. Esa lógica vive en un servicio o función pura con test.

## Tests

- **Sí**: servicios y funciones puras que tocan plata o sesión (`CartService`, `AuthService`, `authInterceptor`). `HttpTestingController` para HTTP.
- **No hace falta**: un test por componente visual.

## Flujo

`models.ts` desde los records del back → servicio (extiende `BaseCrudService`) → página → ruta lazy → probar contra el backend real (`docker compose up db` + `.\mvnw.cmd spring-boot:run` + `npm start`) con datos reales, en claro y en oscuro.

## Por qué no `angular-generator`

Sus reglas técnicas valen (sin `any`, `inject()`, `@if/@for`); no vale su estructura por entidad, su `ErrorMessageComponent` genérico ni su falta de diseño. Para este repo manda este documento.
