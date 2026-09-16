import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NeuBadge, NeuButton, NeuCard } from '../../../shared/ui';
import { CONCENTRATION_LABELS, PRESENTATION_LABELS, ProductResponse } from '../models';

@Component({
  selector: 'product-card',
  imports: [CurrencyPipe, RouterLink, LucideAngularModule, NeuCard, NeuBadge, NeuButton],
  template: `
    <neu-card [compact]="true">
      <div class="flex flex-col h-full" [class.opacity-60]="!product().active">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-neuMuted truncate">{{ product().brand }}</p>
            <a [routerLink]="['/productos', product().id]" class="block font-semibold leading-tight truncate hover:text-accent transition-colors duration-150" [title]="product().name">
              {{ product().name }}
            </a>
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

        <div class="flex items-center justify-between mt-3 pt-3 border-t border-neuLight/60">
          <span class="text-xs text-neuMuted font-mono">{{ product().sku }}</span>
          <div class="flex gap-2">
            <neu-button [routerLink]="['/productos', product().id]" [small]="true">
              <lucide-icon name="pencil" class="w-4 h-4" />
              Editar
            </neu-button>
            <neu-button (pressed)="stock.emit(product())" [small]="true" title="Cargar compra, ajuste, devolución o pérdida">
              <lucide-icon name="package-plus" class="w-4 h-4" />
              Stock
            </neu-button>
          </div>
        </div>
      </div>
    </neu-card>`,
})
export class ProductCard {
  product = input.required<ProductResponse>();
  stock = output<ProductResponse>();
  readonly labels = { concentration: CONCENTRATION_LABELS, presentation: PRESENTATION_LABELS };
}
