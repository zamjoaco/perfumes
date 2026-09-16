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

/** Herencia justificada: los servicios comparten comportamiento HTTP, no solo forma. */
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
