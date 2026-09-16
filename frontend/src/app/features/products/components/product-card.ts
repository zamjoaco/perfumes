import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuBadge, NeuCard } from '../../../shared/ui';
import { CONCENTRATION_LABELS, PRESENTATION_LABELS, ProductResponse } from '../models';

@Component({
  selector: 'product-card',
  imports: [CurrencyPipe, RouterLink, NeuCard, NeuBadge],
  template: `
    <a [routerLink]="['/productos', product().id]" class="block h-full rounded-neu transition-all duration-150 hover:-translate-y-0.5"
       [class.opacity-60]="!product().active">
      <neu-card [compact]="true">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-neuMuted truncate">{{ product().brand }}</p>
            <h3 class="font-semibold leading-tight truncate" [title]="product().name">{{ product().name }}</h3>
            <p class="text-sm text-neuMuted mt-0.5">
              {{ labels.concentration[product().concentration] }} · {{ product().sizeMl }} ml ·
              {{ labels.presentation[product().presentation] }}
            </p>
          </div>
          @if (!product().active) {
            <neu-badge kind="danger">inactivo</neu-badge>
          } @else if (product().belowMinimum) {
            <neu-badge kind="warn">stock bajo</neu-badge>
          }
        </div>

        <div class="flex items-end justify-between mt-4">
          <div>
            <p class="text-xs text-neuMuted">Precio</p>
            <p class="text-lg font-semibold">{{ product().salePrice | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-neuMuted">Stock</p>
            <p class="text-lg font-semibold" [class.text-danger]="product().active && product().belowMinimum">
              {{ product().currentStock }}
            </p>
          </div>
        </div>
        <p class="text-xs text-neuMuted mt-2 font-mono">{{ product().sku }}</p>
      </neu-card>
    </a>`,
})
export class ProductCard {
  product = input.required<ProductResponse>();
  readonly labels = { concentration: CONCENTRATION_LABELS, presentation: PRESENTATION_LABELS };
}
