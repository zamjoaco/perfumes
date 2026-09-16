import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, map, of } from 'rxjs';
import { NeuBadge, NeuButton, NeuCard, PageHeader } from '../../shared/ui';
import { ProductResponse } from '../products/models';
import { ProductsService } from '../products/products.service';
import { PAYMENT_LABELS, SaleResponse } from '../sales/models';
import { SalesService } from '../sales/sales.service';

@Component({
  selector: 'app-home-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, LucideAngularModule, NeuCard, NeuButton, NeuBadge, PageHeader],
  template: `
    <page-header title="Inicio">
      <div class="flex gap-3">
        <neu-button routerLink="/productos/nuevo">
          <lucide-icon name="plus" class="w-4 h-4" />
          Producto
        </neu-button>
        <neu-button variant="primary" routerLink="/ventas/nueva">
          <lucide-icon name="shopping-cart" class="w-4 h-4" />
          Nueva venta
        </neu-button>
      </div>
    </page-header>

    <!-- Tres indicadores con la misma estructura: etiqueta, número grande, línea de contexto. -->
    <div class="grid gap-5 md:grid-cols-3">
      <a routerLink="/ventas" class="block rounded-neu">
        <neu-card>
          <p class="text-sm text-neuMuted">Ventas de hoy</p>
          <p class="text-3xl font-semibold mt-1 tabular-nums">
            {{ today() ? (today()!.total | currency: 'ARS' : 'symbol-narrow' : '1.0-0') : '–' }}
          </p>
          <p class="text-sm text-neuMuted mt-1">{{ today()?.count ?? 0 }} {{ today()?.count === 1 ? 'venta' : 'ventas' }}</p>
        </neu-card>
      </a>
      <a routerLink="/productos" class="block rounded-neu">
        <neu-card>
          <p class="text-sm text-neuMuted">Productos activos</p>
          <p class="text-3xl font-semibold mt-1 tabular-nums">{{ summary()?.activeCount ?? '–' }}</p>
          <p class="text-sm text-neuMuted mt-1">en catálogo</p>
        </neu-card>
      </a>
      <a routerLink="/productos" [queryParams]="{ stockBajo: 1 }" class="block rounded-neu">
        <neu-card>
          <p class="text-sm text-neuMuted">Stock bajo</p>
          <p class="text-3xl font-semibold mt-1 tabular-nums" [class.text-danger]="(summary()?.belowMinimumCount ?? 0) > 0">
            {{ summary()?.belowMinimumCount ?? '–' }}
          </p>
          <p class="text-sm text-neuMuted mt-1">
            @if ((summary()?.belowMinimumCount ?? 0) > 0) {
              para reponer
            } @else {
              todo en orden
            }
          </p>
        </neu-card>
      </a>
    </div>

    <div class="grid gap-5 lg:grid-cols-2 mt-5">
      <neu-card>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Últimas ventas</h2>
          <a routerLink="/ventas" class="text-sm text-accent hover:underline">Ver todas</a>
        </div>
        @if (recentSales(); as sales) {
          @if (sales.length === 0) {
            <p class="text-sm text-neuMuted">Todavía no hay ventas.</p>
          } @else {
            <ul class="flex flex-col divide-y divide-neuLight/60">
              @for (s of sales; track s.id) {
                <li>
                  <a [routerLink]="['/ventas', s.id]" class="flex items-center justify-between gap-3 py-2.5 hover:text-accent transition-colors duration-150">
                    <div class="min-w-0">
                      <p class="text-sm font-medium truncate">
                        {{ s.items[0].productName }}@if (s.items.length > 1) { <span class="text-neuMuted">+{{ s.items.length - 1 }}</span> }
                      </p>
                      <p class="text-xs text-neuMuted">{{ s.soldAt | date: 'dd/MM HH:mm' }} · {{ payment[s.paymentMethod] }}</p>
                    </div>
                    <span class="font-semibold tabular-nums shrink-0" [class.line-through]="s.status === 'CANCELLED'" [class.text-neuMuted]="s.status === 'CANCELLED'">
                      {{ s.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}
                    </span>
                  </a>
                </li>
              }
            </ul>
          }
        } @else {
          <p class="text-sm text-neuMuted">Cargando…</p>
        }
      </neu-card>

      <neu-card>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Para reponer</h2>
          <a routerLink="/productos" [queryParams]="{ stockBajo: 1 }" class="text-sm text-accent hover:underline">Ver todos</a>
        </div>
        @if (lowStock(); as products) {
          @if (products.length === 0) {
            <p class="text-sm text-neuMuted">Ningún producto por debajo del mínimo.</p>
          } @else {
            <ul class="flex flex-col divide-y divide-neuLight/60">
              @for (p of products; track p.id) {
                <li>
                  <a [routerLink]="['/productos', p.id]" class="flex items-center justify-between gap-3 py-2.5 hover:text-accent transition-colors duration-150">
                    <div class="min-w-0">
                      <p class="text-sm font-medium truncate">{{ p.name }}</p>
                      <p class="text-xs text-neuMuted">{{ p.brand }} · mínimo {{ p.minStock }}</p>
                    </div>
                    <neu-badge [kind]="p.currentStock === 0 ? 'danger' : 'warn'">{{ p.currentStock === 0 ? 'sin stock' : 'quedan ' + p.currentStock }}</neu-badge>
                  </a>
                </li>
              }
            </ul>
          }
        } @else {
          <p class="text-sm text-neuMuted">Cargando…</p>
        }
      </neu-card>
    </div>`,
})
export class HomePage {
  private readonly products = inject(ProductsService);
  private readonly sales = inject(SalesService);

  readonly payment = PAYMENT_LABELS;
  readonly summary = toSignal(this.products.summary().pipe(catchError(() => of(null))), { initialValue: null });
  readonly today = toSignal(this.sales.today().pipe(catchError(() => of(null))), { initialValue: null });
  readonly recentSales = toSignal(
    this.sales.list({ size: 5, sort: 'soldAt,desc' }).pipe(
      map((page) => page.content),
      catchError(() => of([] as SaleResponse[])),
    ),
    { initialValue: null },
  );
  readonly lowStock = toSignal(
    this.products.list({ belowMinimum: true, active: true, size: 5, sort: 'currentStock,asc' }).pipe(
      map((page) => page.content),
      catchError(() => of([] as ProductResponse[])),
    ),
    { initialValue: null },
  );
}
