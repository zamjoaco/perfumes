import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Espejo de shared/ApiError del backend. */
export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}

/** Convierte cualquier error HTTP en un ApiError con mensaje mostrable. */
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
