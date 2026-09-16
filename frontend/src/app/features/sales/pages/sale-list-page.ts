import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { EMPTY, catchError, debounceTime, switchMap, tap } from 'rxjs';
import { Page, QueryParams } from '../../../core/base-crud.service';
import { ApiError } from '../../../core/error.interceptor';
import { NeuButton, NeuCard, NeuInput, NeuSelect, PageHeader } from '../../../shared/ui';
import { PAYMENT_LABELS, STATUS_LABELS, SaleResponse } from '../models';
import { SalesService } from '../sales.service';

interface Filters {
  from: string;
  to: string;
  status: string;
  page: number;
}

const EMPTY_PAGE: Page<SaleResponse> = { content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } };

@Component({
  selector: 'app-sale-list-page',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink, LucideAngularModule, NeuButton, NeuCard, NeuInput, NeuSelect, PageHeader],
  template: `
    <page-header title="Ventas">
      <neu-button variant="primary" routerLink="/ventas/nueva">
        <lucide-icon name="plus" class="w-5 h-5" />
        Nueva venta
      </neu-button>
    </page-header>

    <div class="flex flex-wrap items-end gap-3 mb-6">
      <div class="w-40"><neu-input label="Desde" type="date" [formControl]="fromControl" /></div>
      <div class="w-40"><neu-input label="Hasta" type="date" [formControl]="toControl" /></div>
      <div class="w-44"><neu-select label="Estado" placeholder="Todas" [options]="statusOptions" [formControl]="statusControl" /></div>
    </div>

    @if (error()) {
      <neu-card><p class="text-danger" role="alert">{{ error() }}</p></neu-card>
    } @else if (!loading() && page().page.totalElements === 0) {
      <neu-card><p class="text-neuMuted">No hay ventas para ese filtro.</p></neu-card>
    } @else {
      <neu-card [compact]="true">
        <div class="neu-table overflow-x-auto transition-opacity" [class.opacity-50]="loading()">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>#</th><th>Ítems</th><th>Medio</th><th class="text-right">Total</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (s of page().content; track s.id) {
                <tr class="cursor-pointer" [routerLink]="['/ventas', s.id]">
                  <td class="whitespace-nowrap">{{ s.soldAt | date: 'dd/MM/yy HH:mm' }}</td>
                  <td class="font-mono text-neuMuted">{{ s.id }}</td>
                  <td>{{ s.itemCount }}</td>
                  <td>{{ payment[s.paymentMethod] }}</td>
                  <td class="text-right font-semibold tabular-nums" [class.line-through]="s.status === 'CANCELLED'">
                    {{ s.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}
                  </td>
                  <td>
                    <span [class.text-danger]="s.status === 'CANCELLED'" [class.text-neuMuted]="s.status !== 'CANCELLED'">
                      {{ status[s.status] }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </neu-card>

      @if (page().page.totalPages > 1) {
        <div class="flex items-center justify-center gap-3 mt-6">
          <neu-button variant="icon" [disabled]="page().page.number === 0" (pressed)="goTo(page().page.number - 1)" aria-label="Anterior">
            <lucide-icon name="chevron-left" class="w-5 h-5" />
          </neu-button>
          <span class="text-sm text-neuMuted">Página {{ page().page.number + 1 }} de {{ page().page.totalPages }}</span>
          <neu-button variant="icon" [disabled]="page().page.number + 1 >= page().page.totalPages" (pressed)="goTo(page().page.number + 1)" aria-label="Siguiente">
            <lucide-icon name="chevron-right" class="w-5 h-5" />
          </neu-button>
        </div>
      }
    }`,
})
export class SaleListPage {
  private readonly sales = inject(SalesService);

  readonly payment = PAYMENT_LABELS;
  readonly status = STATUS_LABELS;
  readonly statusOptions = [
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
  ];

  readonly fromControl = new FormControl('', { nonNullable: true });
  readonly toControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl('', { nonNullable: true });
  readonly filters = signal<Filters>({ from: '', to: '', status: '', page: 0 });
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly page = toSignal(
    toObservable(this.filters).pipe(
      debounceTime(200),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap((f) =>
        this.sales.list(toParams(f)).pipe(
          catchError((e: ApiError) => {
            this.error.set(e.message);
            this.loading.set(false);
            return EMPTY;
          }),
        ),
      ),
      tap(() => this.loading.set(false)),
    ),
    { initialValue: EMPTY_PAGE },
  );

  constructor() {
    this.fromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((from) => this.set({ from }));
    this.toControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((to) => this.set({ to }));
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((status) => this.set({ status }));
  }

  goTo(page: number): void {
    this.filters.update((f) => ({ ...f, page }));
  }

  private set(patch: Partial<Filters>): void {
    this.filters.update((f) => ({ ...f, ...patch, page: 0 }));
  }
}

function toParams(f: Filters): QueryParams {
  const params: QueryParams = { page: f.page, size: 20, sort: 'soldAt,desc' };
  if (f.from) params['from'] = f.from;
  if (f.to) params['to'] = f.to;
  if (f.status) params['status'] = f.status;
  return params;
}
