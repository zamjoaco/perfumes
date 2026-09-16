import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../../core/base-crud.service';
import { ProductRequest, ProductResponse, ProductSummary } from './models';

@Injectable({ providedIn: 'root' })
export class ProductsService extends BaseCrudService<ProductResponse, ProductRequest> {
  protected readonly resource = 'products';

  activate(id: number): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.url}/${id}/activate`, {});
  }

  summary(): Observable<ProductSummary> {
    return this.http.get<ProductSummary>(`${this.url}/summary`);
  }
}
