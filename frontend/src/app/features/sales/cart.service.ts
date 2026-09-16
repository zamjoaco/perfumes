import { Injectable, computed, signal } from '@angular/core';
import { ProductResponse } from '../products/models';
import { PaymentMethod, SaleRequest } from './models';

export interface CartLine {
  product: ProductResponse;
  quantity: number;
}

/** Convierte un monto en pesos (número o string con hasta 2 decimales) a centavos enteros. */
export function toCents(amount: number | string): number {
  const n = typeof amount === 'string' ? Number(amount.replace(',', '.')) : amount;
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Carrito de la venta en curso. Todo en centavos enteros: nada de sumar floats.
 * El total es un preview; el que vale lo calcula el backend.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<CartLine[]>([]);
  private readonly _discountCents = signal(0);

  readonly lines = this._lines.asReadonly();
  readonly discountCents = this._discountCents.asReadonly();
  readonly itemCount = computed(() => this._lines().reduce((n, l) => n + l.quantity, 0));
  readonly subtotalCents = computed(() =>
    this._lines().reduce((sum, l) => sum + toCents(l.product.salePrice) * l.quantity, 0),
  );
  readonly totalCents = computed(() => Math.max(0, this.subtotalCents() - this._discountCents()));
  readonly discountExceedsSubtotal = computed(() => this._discountCents() > this.subtotalCents());
  readonly isEmpty = computed(() => this._lines().length === 0);

  /** Agrega una unidad; si el producto ya está, suma. No pasa del stock disponible ni agrega sin stock. */
  add(product: ProductResponse): void {
    if (product.currentStock <= 0) return;
    this._lines.update((lines) => {
      const existing = lines.find((l) => l.product.id === product.id);
      if (existing) {
        return lines.map((l) =>
          l === existing ? { ...l, quantity: Math.min(l.quantity + 1, product.currentStock) } : l,
        );
      }
      return [...lines, { product, quantity: 1 }];
    });
  }

  setQuantity(productId: number, quantity: number): void {
    this._lines.update((lines) =>
      lines
        .map((l) => (l.product.id === productId ? { ...l, quantity: Math.floor(quantity) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  remove(productId: number): void {
    this._lines.update((lines) => lines.filter((l) => l.product.id !== productId));
  }

  setDiscount(amount: number | string): void {
    this._discountCents.set(Math.max(0, toCents(amount)));
  }

  clear(): void {
    this._lines.set([]);
    this._discountCents.set(0);
  }

  lineSubtotalCents(line: CartLine): number {
    return toCents(line.product.salePrice) * line.quantity;
  }

  toRequest(paymentMethod: PaymentMethod, notes: string): SaleRequest {
    return {
      items: this._lines().map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      paymentMethod,
      discount: this._discountCents() > 0 ? fromCents(this._discountCents()).toFixed(2) : null,
      notes: notes.trim() || null,
      soldAt: null,
    };
  }
}
