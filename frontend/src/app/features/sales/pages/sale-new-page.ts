import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, debounceTime, map, of, switchMap } from 'rxjs';
import { ApiError } from '../../../core/error.interceptor';
import { NeuButton, NeuCard, NeuInput, NeuSelect, NeuTile, PageHeader } from '../../../shared/ui';
import { ProductResponse } from '../../products/models';
import { ProductsService } from '../../products/products.service';
import { CartService, fromCents } from '../cart.service';
import { PAYMENT_OPTIONS, PaymentMethod } from '../models';
import { SalesService } from '../sales.service';

@Component({
  selector: 'app-sale-new-page',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, LucideAngularModule, NeuButton, NeuCard, NeuInput, NeuSelect, NeuTile, PageHeader],
  template: `
    <page-header title="Nueva venta">
      <neu-button routerLink="/ventas">
        <lucide-icon name="arrow-left" class="w-4 h-4" />
        Ventas
      </neu-button>
    </page-header>

    <div class="grid gap-6 lg:grid-cols-5">
      <!-- Buscador de productos -->
      <div class="lg:col-span-3 flex flex-col gap-4">
        <neu-input placeholder="Buscar producto por nombre, SKU o marca" [formControl]="query" autocomplete="off" />
        @if (results(); as list) {
          @if (list.length === 0) {
            <neu-card><p class="text-sm text-neuMuted">Sin productos activos con stock para esa búsqueda.</p></neu-card>
          } @else {
            <div class="grid gap-3 sm:grid-cols-2">
              @for (p of list; track p.id) {
                <neu-tile (pressed)="cart.add(p)" [disabled]="p.currentStock === 0 || inCart(p.id) >= p.currentStock">
                  <p class="text-xs uppercase tracking-wide text-neuMuted truncate">{{ p.brand }}</p>
                  <p class="font-semibold leading-tight truncate">{{ p.name }}</p>
                  <div class="flex items-center justify-between mt-2 text-sm">
                    <span class="font-semibold">{{ p.salePrice | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
                    <span class="text-neuMuted">
                      stock {{ p.currentStock }}
                      @if (inCart(p.id) > 0) {
                        · en carrito {{ inCart(p.id) }}
                      }
                    </span>
                  </div>
                </neu-tile>
              }
            </div>
          }
        } @else {
          <p class="text-sm text-neuMuted">Cargando…</p>
        }
      </div>

      <!-- Carrito -->
      <div class="lg:col-span-2">
        <neu-card>
          <h2 class="font-semibold mb-4">Carrito</h2>
          @if (cart.isEmpty()) {
            <p class="text-sm text-neuMuted">Tocá un producto para agregarlo.</p>
          } @else {
            <ul class="flex flex-col gap-3">
              @for (line of cart.lines(); track line.product.id) {
                <li class="flex flex-col gap-2 pb-3 border-b border-neuLight/60 last:border-0 last:pb-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="font-medium truncate">{{ line.product.name }}</p>
                      <p class="text-xs text-neuMuted">
                        {{ line.product.salePrice | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }} c/u · stock {{ line.product.currentStock }}
                      </p>
                    </div>
                    <neu-button variant="icon" (pressed)="cart.remove(line.product.id)" [attr.aria-label]="'Quitar ' + line.product.name">
                      <lucide-icon name="x" class="w-4 h-4" />
                    </neu-button>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1">
                      <neu-button variant="icon" (pressed)="cart.setQuantity(line.product.id, line.quantity - 1)" [attr.aria-label]="'Una menos de ' + line.product.name">
                        <lucide-icon name="minus" class="w-4 h-4" />
                      </neu-button>
                      <span class="w-8 text-center font-semibold tabular-nums">{{ line.quantity }}</span>
                      <neu-button
                        variant="icon"
                        [disabled]="line.quantity >= line.product.currentStock"
                        (pressed)="cart.setQuantity(line.product.id, line.quantity + 1)"
                        [attr.aria-label]="'Una más de ' + line.product.name">
                        <lucide-icon name="plus" class="w-4 h-4" />
                      </neu-button>
                    </div>
                    <span class="font-semibold tabular-nums">
                      {{ fromCents(cart.lineSubtotalCents(line)) | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}
                    </span>
                  </div>
                </li>
              }
            </ul>
          }

          <form [formGroup]="form" (ngSubmit)="confirm()" class="flex flex-col gap-4 mt-6">
            <neu-select label="Medio de pago" [options]="paymentOptions" formControlName="paymentMethod" />
            <neu-input label="Descuento (ARS)" type="number" min="0" step="0.01" formControlName="discount" placeholder="0" />
            <neu-input label="Notas (opcional)" formControlName="notes" placeholder="Ej: cliente Juli, seña" />

            <div class="text-sm flex flex-col gap-1 pt-3 border-t border-neuLight/60">
              <div class="flex justify-between text-neuMuted">
                <span>Subtotal ({{ cart.itemCount() }} u.)</span>
                <span class="tabular-nums">{{ fromCents(cart.subtotalCents()) | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
              </div>
              @if (cart.discountCents() > 0) {
                <div class="flex justify-between text-neuMuted" [class.text-danger]="cart.discountExceedsSubtotal()">
                  <span>Descuento</span>
                  <span class="tabular-nums">− {{ fromCents(cart.discountCents()) | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
                </div>
              }
              <div class="flex justify-between text-lg font-semibold mt-1">
                <span>Total</span>
                <span class="tabular-nums">{{ fromCents(cart.totalCents()) | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
              </div>
              <p class="text-xs text-neuMuted">El total definitivo lo calcula el sistema al confirmar.</p>
            </div>

            @if (error()) {
              <p class="text-sm text-danger" role="alert">{{ error() }}</p>
            }
            <neu-button
              variant="primary"
              type="submit"
              [block]="true"
              [disabled]="cart.isEmpty() || cart.discountExceedsSubtotal() || loading()">
              {{ loading() ? 'Confirmando…' : 'Confirmar venta' }}
            </neu-button>
          </form>
        </neu-card>
      </div>
    </div>`,
})
export class SaleNewPage {
  readonly cart = inject(CartService);
  private readonly products = inject(ProductsService);
  private readonly sales = inject(SalesService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly fromCents = fromCents;
  readonly paymentOptions = PAYMENT_OPTIONS;

  readonly query = new FormControl('', { nonNullable: true });
  private readonly q = signal('');
  /** Solo activos; los sin stock se muestran deshabilitados para que se entienda por qué no aparecen. */
  readonly results = toSignal(
    toObservable(this.q).pipe(
      debounceTime(200),
      switchMap((q) =>
        this.products.list({ q, active: true, size: 24, sort: 'name,asc' }).pipe(
          map((page) => page.content),
          catchError(() => of([] as ProductResponse[])),
        ),
      ),
    ),
    { initialValue: null },
  );

  // El carrito sobrevive a la navegación (singleton): el input arranca con el descuento que ya tiene.
  readonly form = this.fb.group({
    paymentMethod: ['CASH' as PaymentMethod, Validators.required],
    discount: [this.cart.discountCents() > 0 ? fromCents(this.cart.discountCents()).toFixed(2) : ''],
    notes: ['', Validators.maxLength(500)],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.query.valueChanges.pipe(takeUntilDestroyed()).subscribe((q) => this.q.set(q.trim()));
    this.form.controls.discount.valueChanges.pipe(takeUntilDestroyed()).subscribe((d) => this.cart.setDiscount(d || 0));
  }

  inCart(productId: number): number {
    return this.cart.lines().find((l) => l.product.id === productId)?.quantity ?? 0;
  }

  confirm(): void {
    this.error.set(null);
    if (this.cart.isEmpty() || this.cart.discountExceedsSubtotal() || this.loading()) return;
    this.loading.set(true);
    const { paymentMethod, notes } = this.form.getRawValue();
    this.sales.create(this.cart.toRequest(paymentMethod, notes)).subscribe({
      next: (sale) => {
        this.cart.clear();
        this.router.navigate(['/ventas', sale.id], { state: { created: true } });
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
