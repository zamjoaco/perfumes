import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api';
import { BrandRequest, BrandResponse } from './models';

@Injectable({ providedIn: 'root' })
export class BrandsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/brands`;

  list(): Observable<BrandResponse[]> {
    return this.http.get<BrandResponse[]>(this.url);
  }

  create(body: BrandRequest): Observable<BrandResponse> {
    return this.http.post<BrandResponse>(this.url, body);
  }
}
