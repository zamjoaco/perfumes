# Referencia: `core/` y estructura de una feature

Los componentes `neu-card`, `neu-button`, `neu-input`, `neu-badge` y `page-header` ya están en `src/app/shared/ui/`: leé el código, es corto. Lo que sigue es el código de referencia de `core/` que se construye en las primeras historias y la forma de una feature.

## `BaseCrudService<T, Req>` — `core/base-crud.service.ts`

```ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';

/** Espejo del JSON de Spring con serialization-mode: via_dto. */
export interface Page<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

export type QueryParams = Record<string, string | number | boolean>;

export abstract class BaseCrudService<T, Req> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly resource: string; // 'products', 'sales'...

  protected get url(): string {
    return `${API_URL}/${this.resource}`;
  }

  list(params: QueryParams = {}): Observable<Page<T>> {
    return this.http.get<Page<T>>(this.url, { params: new HttpParams({ fromObject: params }) });
  }
  get(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }
  create(body: Req): Observable<T> {
    return this.http.post<T>(this.url, body);
  }
  update(id: number, body: Req): Observable<T> {
    return this.http.put<T>(`${this.url}/${id}`, body);
  }
  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

Una clase abstracta con genéricos: el único lugar donde la herencia se justifica en el front, porque los servicios comparten *comportamiento*, no solo forma.

## Interceptores y guard

```ts
// core/error.interceptor.ts — convierte el ApiError del back en algo que las pantallas muestran
export interface ApiError { status: number; message: string; timestamp: string; }

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const body = err.error as Partial<ApiError> | undefined;
      const apiError: ApiError = {
        status: err.status,
        message: body?.message ?? 'Error de conexión con el servidor',
        timestamp: body?.timestamp ?? new Date().toISOString(),
      };
      return throwError(() => apiError);
    }),
  );
```

```ts
// core/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      // Solo una sesión vencida manda al login. Un login fallido también es 401 pero no llevaba token.
      if (err.status === 401 && token) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
```

```ts
// core/auth.guard.ts
export const authGuard: CanActivateFn = () =>
  inject(AuthService).isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
```

```ts
// app.config.ts — el orden importa: la respuesta la ve primero el ÚLTIMO de la lista
provideHttpClient(withInterceptors([errorInterceptor, authInterceptor]))
```

## Errores de formulario — `core/form-errors.ts`

`control.errors` no es un signal; `control.events` sí es observable:

```ts
import { AbstractControl } from '@angular/forms';
import { Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

export type ErrorMessages = Record<string, string>;

/** Mensaje del primer error activo, o null. Solo después de tocar el control. */
export function formError(control: AbstractControl, messages: ErrorMessages): Signal<string | null> {
  const events = toSignal(control.events, { initialValue: null });
  return computed(() => {
    events();
    if (!control.touched || !control.errors) return null;
    const key = Object.keys(control.errors)[0];
    return messages[key] ?? 'Valor inválido';
  });
}
```

```ts
readonly nameError = formError(this.form.controls.name, { required: 'El nombre es obligatorio' });
```
```html
<neu-input label="Nombre" formControlName="name" [error]="nameError()" />
```

## Estructura de una feature — `products`

```
features/products/
├── products.routes.ts
├── products.service.ts        extends BaseCrudService<ProductResponse, ProductRequest>
├── models.ts                  ProductResponse, ProductRequest, Concentration, Presentation, Gender
├── pages/
│   ├── product-list-page.ts   grilla de neu-card + filtros + botón primario "Nuevo producto"
│   └── product-form-page.ts   alta y edición (mismo componente; modo por :id en la ruta)
└── components/
    └── product-card.ts        recibe ProductResponse por input()
```

```ts
// products.routes.ts
export const PRODUCTS_ROUTES: Routes = [
  { path: '',      loadComponent: () => import('./pages/product-list-page').then(m => m.ProductListPage) },
  { path: 'nuevo', loadComponent: () => import('./pages/product-form-page').then(m => m.ProductFormPage) },
  { path: ':id',   loadComponent: () => import('./pages/product-form-page').then(m => m.ProductFormPage) },
];
```

```ts
// models.ts — espejo de los records del paquete product/ del back
export type Concentration = 'EDP' | 'EDT' | 'PARFUM' | 'EDC' | 'BODY_MIST';
export type Presentation = 'BOTTLE' | 'DECANT' | 'SAMPLE';

export interface ProductResponse {
  id: number; sku: string; brand: string; brandId: number; name: string;
  concentration: Concentration; presentation: Presentation; sizeMl: number;
  costPrice: number; salePrice: number; currentStock: number; minStock: number;
  belowMinimum: boolean; active: boolean;
}

export interface ProductRequest {
  sku: string; brandId: number; name: string;
  concentration: Concentration; presentation: Presentation; sizeMl: number;
  costPrice: string; salePrice: string; // string: el back los parsea a BigDecimal, no a double
  minStock: number;
}
```
