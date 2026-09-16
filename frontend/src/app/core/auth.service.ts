import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ChangePasswordRequest, LoginRequest, LoginResponse } from '../features/auth/models';
import { API_URL } from './api';

const STORAGE_KEY = 'session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<LoginResponse | null>(restore());

  readonly token = computed(() => this.session()?.token ?? null);
  readonly username = computed(() => this.session()?.username ?? null);
  /** Un token vencido cuenta como no autenticado: mejor pedir login que recibir un 401. */
  readonly isAuthenticated = computed(() => {
    const s = this.session();
    return !!s && new Date(s.expiresAt).getTime() > Date.now();
  });

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, request).pipe(tap((r) => this.store(r)));
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${API_URL}/auth/password`, request);
  }

  logout(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage bloqueado */
    }
  }

  private store(session: LoginResponse): void {
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* storage bloqueado: la sesión vive solo en memoria */
    }
  }
}

function restore(): LoginResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<LoginResponse>;
    return s.token && s.username && s.expiresAt ? (s as LoginResponse) : null;
  } catch {
    return null;
  }
}
