import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NeuBadge, NeuButton, NeuCard, PageHeader } from '../../shared/ui';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';

@Component({
  selector: 'app-home-page',
  imports: [CurrencyPipe, RouterLink, NeuCard, NeuButton, NeuBadge, PageHeader],
  template: `
    <page-header title="Inicio">
      <neu-button variant="primary" routerLink="/ventas/nueva">Nueva venta</neu-button>
    </page-header>
    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <a routerLink="/ventas" class="block rounded-neu">
        <neu-card>
          <p class="text-sm text-neuMuted mb-1">Ventas de hoy</p>
          <p class="text-3xl font-semibold">{{ today() ? (today()!.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2') : '–' }}</p>
          <p class="text-sm text-neuMuted mt-1">{{ today()?.count ?? 0 }} {{ today()?.count === 1 ? 'venta' : 'ventas' }}</p>
        </neu-card>
      </a>
      <a routerLink="/productos" class="block rounded-neu">
        <neu-card>
          <p class="text-sm text-neuMuted mb-1">Productos activos</p>
          <p class="text-3xl font-semibold">{{ summary()?.activeCount ?? '–' }}</p>
        </neu-card>
      </a>
      <a routerLink="/productos" [queryParams]="{ stockBajo: 1 }" class="block rounded-neu">
        <neu-card>
          <p class="text-sm text-neuMuted mb-1">Stock bajo</p>
          <p class="text-3xl font-semibold">
            {{ summary()?.belowMinimumCount ?? '–' }}
            @if ((summary()?.belowMinimumCount ?? 0) > 0) {
              <neu-badge kind="warn">revisar</neu-badge>
            }
          </p>
        </neu-card>
      </a>
    </div>`,
})
export class HomePage {
  private readonly products = inject(ProductsService);
  private readonly sales = inject(SalesService);
  readonly summary = toSignal(this.products.summary().pipe(catchError(() => of(null))), { initialValue: null });
  readonly today = toSignal(this.sales.today().pipe(catchError(() => of(null))), { initialValue: null });
}
