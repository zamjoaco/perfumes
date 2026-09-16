import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api';
import { Page } from '../../core/base-crud.service';
import { MovementRequest, MovementResponse } from './models';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);

  register(productId: number, body: MovementRequest): Observable<MovementResponse> {
    return this.http.post<MovementResponse>(`${API_URL}/products/${productId}/movements`, body);
  }

  history(productId: number, page = 0, size = 10): Observable<Page<MovementResponse>> {
    return this.http.get<Page<MovementResponse>>(`${API_URL}/products/${productId}/movements`, {
      params: new HttpParams({ fromObject: { page, size } }),
    });
  }
}
