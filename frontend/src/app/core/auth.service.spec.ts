import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const FUTURE = new Date(Date.now() + 3_600_000).toISOString();
const PAST = new Date(Date.now() - 1_000).toISOString();

function setup(): { auth: AuthService; http: HttpTestingController } {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
}

describe('AuthService', () => {
  beforeEach(() => localStorage.clear());

  it('arranca sin sesión', () => {
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('guarda la sesión al loguear y la persiste en localStorage', () => {
    const { auth, http } = setup();
    auth.login({ username: 'admin', password: 'x' }).subscribe();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'jwt', username: 'admin', expiresAt: FUTURE });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.token()).toBe('jwt');
    expect(auth.username()).toBe('admin');
    expect(JSON.parse(localStorage.getItem('session') ?? '{}').token).toBe('jwt');
  });

  it('restaura la sesión guardada', () => {
    localStorage.setItem('session', JSON.stringify({ token: 'jwt', username: 'admin', expiresAt: FUTURE }));
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.username()).toBe('admin');
  });

  it('una sesión vencida no cuenta como autenticada', () => {
    localStorage.setItem('session', JSON.stringify({ token: 'jwt', username: 'admin', expiresAt: PAST }));
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('ignora un localStorage corrupto', () => {
    localStorage.setItem('session', '{no es json');
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('logout borra la sesión', () => {
    localStorage.setItem('session', JSON.stringify({ token: 'jwt', username: 'admin', expiresAt: FUTURE }));
    const { auth } = setup();
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('session')).toBeNull();
  });
});
