import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/error.interceptor';
import { formError } from '../../../core/form-errors';
import { NeuButton, NeuInput, NeuModal, NeuSelect } from '../../../shared/ui';
import { ProductResponse } from '../../products/models';
import { MANUAL_MOVEMENT_TYPES, MOVEMENT_HELP, MOVEMENT_LABELS, MovementResponse, MovementType } from '../models';
import { StockService } from '../stock.service';

/** Registrar un movimiento y ver el historial de un producto. Se abre desde la grilla y desde el form. */
@Component({
  selector: 'stock-movement-dialog',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, NeuModal, NeuButton, NeuInput, NeuSelect],
  template: `
    <neu-modal [title]="'Stock de ' + product().name" maxWidth="36rem" (closed)="closed.emit()">
      <p class="text-sm text-neuMuted -mt-3 mb-4">
        {{ product().brand }} · hay
        <span class="font-semibold text-neuText">{{ stock() }}</span>
        @if (stock() <= product().minStock) {
          <span class="text-danger"> (por debajo del mínimo de {{ product().minStock }})</span>
        } @else {
          <span> (mínimo {{ product().minStock }})</span>
        }
      </p>

      <div class="flex gap-2 mb-5">
        <neu-button [active]="tab() === 'movement'" (pressed)="tab.set('movement')">Cargar movimiento</neu-button>
        <neu-button [active]="tab() === 'history'" (pressed)="showHistory()">Historial</neu-button>
      </div>

      @if (tab() === 'movement') {
        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <neu-select label="¿Qué pasó?" [options]="typeOptions" formControlName="type" />
              <p class="mt-1 text-xs text-neuMuted">{{ help[typeValue()] }}</p>
            </div>
            <neu-input
              [label]="isAdjustment() ? 'Cantidad (+ entra, − sale)' : 'Cantidad'"
              type="number"
              [min]="isAdjustment() ? null : '1'"
              formControlName="quantity"
              [error]="quantityError()" />
            @if (form.controls.type.value === 'PURCHASE') {
              <neu-input label="Costo unitario (ARS, opcional)" type="number" min="0" step="0.01" formControlName="unitCost" />
            }
            <div [class.sm:col-span-2]="form.controls.type.value !== 'PURCHASE'">
              <neu-input label="Motivo (opcional)" formControlName="reason" placeholder="Ej: conteo de fin de mes" [error]="reasonError()" />
            </div>
          </div>

          @if (error()) {
            <p class="text-sm text-danger" role="alert">{{ error() }}</p>
          }
          @if (lastSaved(); as m) {
            <p class="text-sm text-emerald-600" role="status">
              Listo: {{ labels[m.type].toLowerCase() }} de {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}.
              Stock {{ m.stockAfter - m.quantity }} → <span class="font-semibold">{{ m.stockAfter }}</span>.
            </p>
          }

          <div class="flex justify-end gap-3 mt-1">
            <neu-button (pressed)="closed.emit()">Cerrar</neu-button>
            <neu-button variant="primary" type="submit" [disabled]="loading()">
              {{ loading() ? 'Guardando…' : 'Registrar movimiento' }}
            </neu-button>
          </div>
        </form>
      } @else {
        @if (history(); as h) {
          @if (h.length === 0) {
            <p class="text-sm text-neuMuted">Sin movimientos todavía.</p>
          } @else {
            <div class="neu-table overflow-x-auto">
              <table>
                <thead>
                  <tr><th>Fecha</th><th>Tipo</th><th class="text-right">Cant.</th><th class="text-right">Stock</th><th>Motivo</th></tr>
                </thead>
                <tbody>
                  @for (m of h; track m.id) {
                    <tr>
                      <td class="whitespace-nowrap">{{ m.createdAt | date: 'dd/MM/yy HH:mm' }}</td>
                      <td>
                        {{ labels[m.type] }}
                        @if (m.unitCost !== null) {
                          <span class="text-neuMuted text-xs">· {{ m.unitCost | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
                        }
                      </td>
                      <td class="text-right font-mono" [class.text-danger]="m.quantity < 0">{{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}</td>
                      <td class="text-right font-mono">{{ m.stockAfter }}</td>
                      <td class="text-neuMuted">{{ m.reason ?? (m.referenceId ? 'Venta #' + m.referenceId : '') }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (historyHasMore()) {
              <p class="text-xs text-neuMuted mt-3">Se muestran los últimos {{ h.length }} movimientos.</p>
            }
          }
        } @else {
          <p class="text-sm text-neuMuted">Cargando…</p>
        }
      }
    </neu-modal>`,
})
export class StockMovementDialog {
  product = input.required<ProductResponse>();
  /** Se emite con cada movimiento guardado; el padre decide si refresca. */
  registered = output<MovementResponse>();
  closed = output<void>();

  private readonly stockService = inject(StockService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly labels = MOVEMENT_LABELS;
  readonly help = MOVEMENT_HELP;
  readonly typeOptions = MANUAL_MOVEMENT_TYPES.map((t) => ({ value: t, label: MOVEMENT_LABELS[t] }));

  readonly tab = signal<'movement' | 'history'>('movement');
  readonly stock = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastSaved = signal<MovementResponse | null>(null);
  readonly history = signal<MovementResponse[] | null>(null);
  readonly historyHasMore = signal(false);

  readonly form = this.fb.group({
    type: ['PURCHASE' as MovementType, Validators.required],
    quantity: ['', [Validators.required, Validators.pattern(/^-?\d+$/)]],
    unitCost: [''],
    reason: ['', Validators.maxLength(200)],
  });
  readonly typeValue = signal<MovementType>('PURCHASE');
  readonly isAdjustment = computed(() => this.typeValue() === 'ADJUSTMENT');

  readonly quantityError = formError(this.form.controls.quantity, {
    required: 'Ingresá la cantidad',
    pattern: 'Tiene que ser un número entero',
  });
  readonly reasonError = formError(this.form.controls.reason, { maxlength: 'Máximo 200 caracteres' });

  constructor() {
    effect(() => this.stock.set(this.product().currentStock));
    this.form.controls.type.valueChanges.subscribe((t) => this.typeValue.set(t));
  }

  showHistory(): void {
    this.tab.set('history');
    if (this.history() === null) this.loadHistory();
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.error.set(null);
    this.lastSaved.set(null);
    if (this.form.invalid || this.loading()) return;
    const v = this.form.getRawValue();
    const quantity = Number(v.quantity);
    if (quantity === 0 || (v.type !== 'ADJUSTMENT' && quantity < 0)) {
      this.error.set(v.type === 'ADJUSTMENT' ? 'La cantidad no puede ser cero' : 'La cantidad tiene que ser mayor a cero');
      return;
    }
    this.loading.set(true);
    this.stockService
      .register(this.product().id, {
        type: v.type,
        quantity,
        unitCost: v.type === 'PURCHASE' && v.unitCost !== '' ? Number(v.unitCost).toFixed(2) : null,
        reason: v.reason.trim() || null,
      })
      .subscribe({
        next: (m) => {
          this.stock.set(m.stockAfter);
          this.lastSaved.set(m);
          this.history.set(null); // se recarga al abrir la pestaña
          this.form.patchValue({ quantity: '', unitCost: '', reason: '' });
          this.form.markAsUntouched();
          this.loading.set(false);
          this.registered.emit(m);
        },
        error: (e: ApiError) => {
          this.error.set(e.message);
          this.loading.set(false);
        },
      });
  }

  private loadHistory(): void {
    this.stockService.history(this.product().id, 0, 10).subscribe({
      next: (page) => {
        this.history.set(page.content);
        this.historyHasMore.set(page.page.totalPages > 1);
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.history.set([]);
      },
    });
  }
}
