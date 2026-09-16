import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../../core/error.interceptor';
import { NeuButton, NeuCard, NeuModal, PageHeader } from '../../../shared/ui';
import { PAYMENT_LABELS, STATUS_LABELS, SaleResponse } from '../models';
import { SalesService } from '../sales.service';

@Component({
  selector: 'app-sale-detail-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, LucideAngularModule, NeuButton, NeuCard, NeuModal, PageHeader],
  template: `
    <page-header [title]="sale() ? 'Venta #' + sale()!.id : 'Venta'">
      <neu-button routerLink="/ventas">
        <lucide-icon name="arrow-left" class="w-4 h-4" />
        Ventas
      </neu-button>
    </page-header>

    @if (justCreated()) {
      <p class="mb-4 text-sm text-emerald-600" role="status">Venta registrada. El stock ya se descontó.</p>
    }

    @if (notFound()) {
      <neu-card><p class="text-danger" role="alert">Venta no encontrada.</p></neu-card>
    } @else if (sale(); as s) {
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <neu-card [compact]="true">
            <div class="neu-table overflow-x-auto">
              <table>
                <thead>
                  <tr><th>Producto</th><th class="text-right">Cant.</th><th class="text-right">Precio</th><th class="text-right">Subtotal</th></tr>
                </thead>
                <tbody>
                  @for (i of s.items; track i.productId) {
                    <tr>
                      <td>
                        <a [routerLink]="['/productos', i.productId]" class="hover:text-accent">{{ i.productName }}</a>
                        <span class="block text-xs text-neuMuted">{{ i.brand }} · {{ i.sku }}</span>
                      </td>
                      <td class="text-right tabular-nums">{{ i.quantity }}</td>
                      <td class="text-right tabular-nums">{{ i.unitPrice | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</td>
                      <td class="text-right tabular-nums font-semibold">{{ i.subtotal | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </neu-card>
        </div>

        <div class="flex flex-col gap-4">
          <neu-card>
            <dl class="text-sm flex flex-col gap-2">
              <div class="flex justify-between"><dt class="text-neuMuted">Fecha</dt><dd>{{ s.soldAt | date: 'dd/MM/yyyy HH:mm' }}</dd></div>
              <div class="flex justify-between"><dt class="text-neuMuted">Medio de pago</dt><dd>{{ payment[s.paymentMethod] }}</dd></div>
              <div class="flex justify-between">
                <dt class="text-neuMuted">Estado</dt>
                <dd [class.text-danger]="s.status === 'CANCELLED'">{{ status[s.status] }}</dd>
              </div>
              @if (s.notes) {
                <div><dt class="text-neuMuted">Notas</dt><dd class="mt-1">{{ s.notes }}</dd></div>
              }
            </dl>
            <div class="mt-4 pt-4 border-t border-neuLight/60 text-sm flex flex-col gap-1">
              <div class="flex justify-between text-neuMuted"><span>Subtotal</span><span class="tabular-nums">{{ s.subtotal | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span></div>
              @if (s.discount > 0) {
                <div class="flex justify-between text-neuMuted"><span>Descuento</span><span class="tabular-nums">− {{ s.discount | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span></div>
              }
              <div class="flex justify-between text-lg font-semibold mt-1" [class.line-through]="s.status === 'CANCELLED'">
                <span>Total</span><span class="tabular-nums">{{ s.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
              </div>
            </div>
          </neu-card>

          @if (s.status === 'COMPLETED') {
            <neu-card>
              @if (error()) {
                <p class="text-sm text-danger mb-3" role="alert">{{ error() }}</p>
              }
              <neu-button variant="danger" [block]="true" (pressed)="confirmOpen.set(true)" [disabled]="loading()">Cancelar venta</neu-button>
              <p class="text-xs text-neuMuted mt-2">Devuelve el stock de cada ítem con un movimiento de devolución.</p>
            </neu-card>
          }
        </div>
      </div>
    } @else {
      <p class="text-sm text-neuMuted">Cargando…</p>
    }

    @if (confirmOpen()) {
      <neu-modal title="¿Cancelar la venta?" (closed)="confirmOpen.set(false)">
        <p class="text-sm text-neuMuted mb-6">Se marca como cancelada y el stock vuelve a los productos. No se puede deshacer.</p>
        <div class="flex justify-end gap-3">
          <neu-button (pressed)="confirmOpen.set(false)">Volver</neu-button>
          <neu-button variant="danger" (pressed)="cancel()" [disabled]="loading()">{{ loading() ? 'Cancelando…' : 'Sí, cancelar' }}</neu-button>
        </div>
      </neu-modal>
    }`,
})
export class SaleDetailPage {
  private readonly sales = inject(SalesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly payment = PAYMENT_LABELS;
  readonly status = STATUS_LABELS;

  readonly sale = signal<SaleResponse | null>(null);
  readonly notFound = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirmOpen = signal(false);
  readonly justCreated = signal(this.router.currentNavigation()?.extras.state?.['created'] === true);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.sales.get(id).subscribe({
      next: (s) => this.sale.set(s),
      error: () => this.notFound.set(true),
    });
  }

  cancel(): void {
    const s = this.sale();
    if (!s || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.sales.cancel(s.id).subscribe({
      next: (updated) => {
        this.sale.set(updated);
        this.confirmOpen.set(false);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.confirmOpen.set(false);
        this.loading.set(false);
      },
    });
  }
}
