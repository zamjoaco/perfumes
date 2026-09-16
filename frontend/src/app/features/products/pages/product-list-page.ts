import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { EMPTY, catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { Page, QueryParams } from '../../../core/base-crud.service';
import { ApiError } from '../../../core/error.interceptor';
import { NeuButton, NeuCard, NeuInput, NeuSelect, PageHeader } from '../../../shared/ui';
import { ProductCard } from '../components/product-card';
import { StockMovementDialog } from '../../stock/components/stock-movement-dialog';
import { BrandsService } from '../brands.service';
import { ProductResponse } from '../models';
import { ProductsService } from '../products.service';

interface Filters {
  q: string;
  brandId: string;
  belowMinimum: boolean;
  showInactive: boolean;
  page: number;
}

const EMPTY_PAGE: Page<ProductResponse> = { content: [], page: { size: 24, number: 0, totalElements: 0, totalPages: 0 } };

@Component({
  selector: 'app-product-list-page',
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule, NeuButton, NeuCard, NeuInput, NeuSelect, PageHeader, ProductCard, StockMovementDialog],
  template: `
    <page-header title="Productos">
      <neu-button variant="primary" routerLink="/productos/nuevo">
        <lucide-icon name="plus" class="w-5 h-5" />
        Nuevo producto
      </neu-button>
    </page-header>

    <div class="flex flex-wrap items-end gap-3 mb-6">
      <div class="w-full sm:w-72">
        <neu-input placeholder="Buscar por nombre, SKU o marca" [formControl]="qControl" />
      </div>
      <div class="w-full sm:w-56">
        <neu-select placeholder="Todas las marcas" [options]="brandOptions()" [formControl]="brandControl" />
      </div>
      <neu-button [active]="filters().belowMinimum" (pressed)="toggle('belowMinimum')">
        <lucide-icon name="triangle-alert" class="w-4 h-4" />
        Stock bajo
      </neu-button>
      <neu-button [active]="filters().showInactive" (pressed)="toggle('showInactive')">Mostrar inactivos</neu-button>
    </div>

    @if (error()) {
      <neu-card><p class="text-danger" role="alert">{{ error() }}</p></neu-card>
    } @else if (!loading() && page().page.totalElements === 0) {
      <neu-card>
        <p class="text-neuMuted">
          @if (hasFilters()) {
            No hay productos que coincidan con el filtro.
          } @else {
            Todavía no cargaste productos. Empezá con "Nuevo producto".
          }
        </p>
      </neu-card>
    } @else {
      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-opacity" [class.opacity-50]="loading()">
        @for (p of page().content; track p.id) {
          <product-card [product]="p" (stock)="stockFor.set(p)" />
        }
      </div>

      @if (page().page.totalPages > 1) {
        <div class="flex items-center justify-center gap-3 mt-8">
          <neu-button variant="icon" [disabled]="page().page.number === 0" (pressed)="goTo(page().page.number - 1)" aria-label="Anterior">
            <lucide-icon name="chevron-left" class="w-5 h-5" />
          </neu-button>
          <span class="text-sm text-neuMuted">Página {{ page().page.number + 1 }} de {{ page().page.totalPages }}</span>
          <neu-button variant="icon" [disabled]="page().page.number + 1 >= page().page.totalPages" (pressed)="goTo(page().page.number + 1)" aria-label="Siguiente">
            <lucide-icon name="chevron-right" class="w-5 h-5" />
          </neu-button>
        </div>
      }
    }

    @if (stockFor(); as p) {
      <stock-movement-dialog [product]="p" (registered)="touched.set(true)" (closed)="closeStock()" />
    }`,
})
export class ProductListPage {
  private readonly products = inject(ProductsService);
  private readonly brands = inject(BrandsService);

  readonly qControl = new FormControl('', { nonNullable: true });
  readonly brandControl = new FormControl('', { nonNullable: true });
  private readonly route = inject(ActivatedRoute);
  // ?stockBajo=1 llega desde la card de inicio y del menú; se sigue en constructor porque el componente se reutiliza.
  readonly filters = signal<Filters>({
    q: '',
    brandId: '',
    belowMinimum: this.route.snapshot.queryParamMap.has('stockBajo'),
    showInactive: false,
    page: 0,
  });
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Producto con el diálogo de stock abierto; `touched` fuerza el refetch al cerrarlo. */
  readonly stockFor = signal<ProductResponse | null>(null);
  readonly touched = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const belowMinimum = params.has('stockBajo');
      if (belowMinimum !== this.filters().belowMinimum) this.filters.update((f) => ({ ...f, belowMinimum, page: 0 }));
    });
    this.qControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((q) => this.setQ(q));
    this.brandControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((b) => this.setBrand(b));
  }

  readonly hasFilters = computed(() => {
    const f = this.filters();
    return !!f.q || !!f.brandId || f.belowMinimum || f.showInactive;
  });

  private readonly brandList = toSignal(this.brands.list().pipe(catchError(() => of([]))), { initialValue: [] });
  readonly brandOptions = computed(() => this.brandList().map((b) => ({ value: String(b.id), label: b.name })));

  readonly page = toSignal(
    toObservable(this.filters).pipe(
      debounceTime(200),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap((f) =>
        this.products.list(toParams(f)).pipe(
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

  setQ(q: string): void {
    this.filters.update((f) => ({ ...f, q, page: 0 }));
  }
  setBrand(brandId: string): void {
    this.filters.update((f) => ({ ...f, brandId, page: 0 }));
  }
  toggle(key: 'belowMinimum' | 'showInactive'): void {
    this.filters.update((f) => ({ ...f, [key]: !f[key], page: 0 }));
  }
  goTo(page: number): void {
    this.filters.update((f) => ({ ...f, page }));
  }
  closeStock(): void {
    this.stockFor.set(null);
    if (this.touched()) {
      this.touched.set(false);
      this.filters.update((f) => ({ ...f })); // objeto nuevo → vuelve a pedir la página
    }
  }
}

function toParams(f: Filters): QueryParams {
  const params: QueryParams = { page: f.page, size: 24, sort: 'name,asc' };
  if (f.q) params['q'] = f.q;
  if (f.brandId) params['brandId'] = f.brandId;
  if (f.belowMinimum) params['belowMinimum'] = true;
  if (!f.showInactive) params['active'] = true;
  return params;
}
