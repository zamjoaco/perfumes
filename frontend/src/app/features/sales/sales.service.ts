import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../../core/base-crud.service';
import { SaleRequest, SaleResponse, SalesSummary } from './models';

@Injectable({ providedIn: 'root' })
export class SalesService extends BaseCrudService<SaleResponse, SaleRequest> {
  protected readonly resource = 'sales';

  cancel(id: number): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(`${this.url}/${id}/cancel`, {});
  }

  today(): Observable<SalesSummary> {
    return this.http.get<SalesSummary>(`${this.url}/today`);
  }
}
