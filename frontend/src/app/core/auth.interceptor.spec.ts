import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { ApiError, errorInterceptor } from './error.interceptor';

const FUTURE = new Date(Date.now() + 3_600_000).toISOString();

function setup(): { http: HttpClient; ctrl: HttpTestingController; auth: AuthService; router: Router } {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])), provideHttpClientTesting()],
  });
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  return {
    http: TestBed.inject(HttpClient),
    ctrl: TestBed.inject(HttpTestingController),
    auth: TestBed.inject(AuthService),
    router,
  };
}

describe('authInterceptor', () => {
  beforeEach(() => localStorage.clear());

  it('agrega el Bearer cuando hay sesión', () => {
    localStorage.setItem('session', JSON.stringify({ token: 'jwt', username: 'admin', expiresAt: FUTURE }));
    const { http, ctrl } = setup();
    http.get('/api/x').subscribe();
    expect(ctrl.expectOne('/api/x').request.headers.get('Authorization')).toBe('Bearer jwt');
  });

  it('no agrega header sin sesión', () => {
    const { http, ctrl } = setup();
    http.get('/api/x').subscribe();
    expect(ctrl.expectOne('/api/x').request.headers.has('Authorization')).toBe(false);
  });

  it('un 401 con token desloguea y manda al login; el error llega como ApiError', () => {
    localStorage.setItem('session', JSON.stringify({ token: 'jwt', username: 'admin', expiresAt: FUTURE }));
    const { http, ctrl, auth, router } = setup();
    let received: ApiError | undefined;
    http.get('/api/x').subscribe({ error: (e: ApiError) => (received = e) });
    ctrl.expectOne('/api/x').flush({ status: 401, message: 'Iniciá sesión para continuar' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], expect.objectContaining({ queryParams: expect.anything() }));
    expect(received?.status).toBe(401);
    expect(received?.message).toBe('Iniciá sesión para continuar');
  });

  it('un 401 sin token (login fallido) no navega', () => {
    const { http, ctrl, router } = setup();
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    ctrl.expectOne('/api/auth/login').flush({ status: 401, message: 'Usuario o contraseña incorrectos' }, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('sin cuerpo del backend el mensaje es de conexión', () => {
    const { http, ctrl } = setup();
    let received: ApiError | undefined;
    http.get('/api/x').subscribe({ error: (e: ApiError) => (received = e) });
    ctrl.expectOne('/api/x').error(new ProgressEvent('error'));
    expect(received?.message).toBe('Error de conexión con el servidor');
  });
});
