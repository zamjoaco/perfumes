import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../../core/error.interceptor';
import { formError } from '../../../core/form-errors';
import { NeuButton, NeuCard, NeuInput, NeuSelect, PageHeader } from '../../../shared/ui';
import { BrandsService } from '../brands.service';
import {
  CONCENTRATION_LABELS,
  Concentration,
  GENDER_LABELS,
  Gender,
  PRESENTATION_LABELS,
  Presentation,
  ProductRequest,
  ProductResponse,
  toOptions,
} from '../models';
import { ProductsService } from '../products.service';
import { StockMovementDialog } from '../../stock/components/stock-movement-dialog';
import { MovementResponse } from '../../stock/models';

/** Alta y edición en el mismo componente: el modo lo decide `:id` en la ruta. */
@Component({
  selector: 'app-product-form-page',
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, NeuButton, NeuCard, NeuInput, NeuSelect, PageHeader, StockMovementDialog],
  template: `
    <page-header [title]="isEdit() ? 'Editar producto' : 'Nuevo producto'">
      <neu-button routerLink="/productos">
        <lucide-icon name="arrow-left" class="w-4 h-4" />
        Volver
      </neu-button>
    </page-header>

    @if (notFound()) {
      <neu-card><p class="text-danger" role="alert">Producto no encontrado.</p></neu-card>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 flex flex-col gap-6">
          <neu-card>
            <h2 class="font-semibold mb-4">Identificación</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <neu-input label="Nombre" formControlName="name" [error]="errors.name()" />
              <neu-input label="SKU" formControlName="sku" placeholder="Ej: SAUV-EDP-100" [error]="errors.sku()" />

              <div class="sm:col-span-2">
                <div class="flex items-end gap-2">
                  <div class="flex-1">
                    <neu-select label="Marca" placeholder="Elegí una marca" [options]="brandOptions()" formControlName="brandId" [error]="errors.brandId()" />
                  </div>
                  <neu-button variant="icon" (pressed)="newBrandOpen.set(!newBrandOpen())" aria-label="Nueva marca" title="Nueva marca">
                    <lucide-icon name="plus" class="w-5 h-5" />
                  </neu-button>
                </div>
                @if (newBrandOpen()) {
                  <div class="flex items-end gap-2 mt-3">
                    <div class="flex-1">
                      <neu-input label="Nueva marca" [formControl]="newBrandName" placeholder="Nombre de la marca" [error]="newBrandError()" />
                    </div>
                    <neu-button (pressed)="addBrand()" [disabled]="savingBrand()">Agregar</neu-button>
                  </div>
                }
              </div>

              <neu-select label="Concentración" placeholder="Elegí" [options]="concentrationOptions" formControlName="concentration" [error]="errors.concentration()" />
              <neu-input label="Tamaño (ml)" type="number" min="1" formControlName="sizeMl" [error]="errors.sizeMl()" />
              <neu-select label="Presentación" [options]="presentationOptions" formControlName="presentation" />
              <neu-select label="Género" placeholder="Sin especificar" [options]="genderOptions" formControlName="gender" />
              <neu-input label="Familia olfativa" formControlName="fragranceFamily" placeholder="Ej: Amaderada" [error]="errors.fragranceFamily()" />
            </div>
          </neu-card>

          <neu-card>
            <h2 class="font-semibold mb-4">Precios y stock</h2>
            <div class="grid gap-4 sm:grid-cols-3">
              <neu-input label="Costo (ARS)" type="number" min="0" step="0.01" formControlName="costPrice" [error]="errors.costPrice()" />
              <neu-input label="Precio de venta (ARS)" type="number" min="0" step="0.01" formControlName="salePrice" [error]="errors.salePrice()" />
              <neu-input label="Stock mínimo" type="number" min="0" formControlName="minStock" [error]="errors.minStock()" />
            </div>
            @if (isEdit() && product(); as p) {
              <div class="flex flex-wrap items-center justify-between gap-3 mt-4">
                <p class="text-sm text-neuMuted">
                  Stock actual: <span class="font-semibold text-neuText">{{ p.currentStock }}</span>. Se modifica con movimientos, no desde acá.
                </p>
                <neu-button (pressed)="stockOpen.set(true)">
                  <lucide-icon name="package-plus" class="w-4 h-4" />
                  Movimiento de stock
                </neu-button>
              </div>
            }
          </neu-card>
        </div>

        <div class="flex flex-col gap-4">
          <neu-card>
            @if (error()) {
              <p class="text-sm text-danger mb-4" role="alert">{{ error() }}</p>
            }
            <neu-button variant="primary" type="submit" [disabled]="loading()" [block]="true">
              {{ loading() ? 'Guardando…' : 'Guardar' }}
            </neu-button>
            @if (isEdit() && product(); as p) {
              <div class="mt-4 pt-4 border-t border-neuLight/60">
                @if (p.active) {
                  <neu-button variant="danger" [block]="true" (pressed)="deactivate()" [disabled]="loading()">Dar de baja</neu-button>
                  <p class="text-xs text-neuMuted mt-2">No se borra: deja de aparecer en la grilla y no se puede vender.</p>
                } @else {
                  <neu-button [block]="true" (pressed)="activate()" [disabled]="loading()">Reactivar</neu-button>
                  <p class="text-xs text-neuMuted mt-2">Este producto está dado de baja.</p>
                }
              </div>
            }
          </neu-card>
        </div>
      </form>
    }

    @if (stockOpen() && product(); as p) {
      <stock-movement-dialog [product]="p" (registered)="onMovement($event)" (closed)="stockOpen.set(false)" />
    }`,
})
export class ProductFormPage {
  private readonly products = inject(ProductsService);
  private readonly brands = inject(BrandsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly id = Number(this.route.snapshot.paramMap.get('id')) || null;
  readonly isEdit = computed(() => this.id !== null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    sku: ['', [Validators.required, Validators.maxLength(40)]],
    brandId: ['', Validators.required],
    concentration: ['', Validators.required],
    sizeMl: ['', [Validators.required, Validators.min(1)]],
    presentation: ['BOTTLE', Validators.required],
    gender: [''],
    fragranceFamily: ['', Validators.maxLength(40)],
    costPrice: ['', [Validators.required, Validators.min(0)]],
    salePrice: ['', [Validators.required, Validators.min(0)]],
    minStock: ['1', [Validators.required, Validators.min(0)]],
  });

  readonly errors = {
    name: formError(this.form.controls.name, { required: 'El nombre es obligatorio', maxlength: 'Máximo 150 caracteres' }),
    sku: formError(this.form.controls.sku, { required: 'El SKU es obligatorio', maxlength: 'Máximo 40 caracteres' }),
    brandId: formError(this.form.controls.brandId, { required: 'Elegí una marca' }),
    concentration: formError(this.form.controls.concentration, { required: 'Elegí la concentración' }),
    sizeMl: formError(this.form.controls.sizeMl, { required: 'Ingresá los ml', min: 'Tiene que ser mayor a cero' }),
    fragranceFamily: formError(this.form.controls.fragranceFamily, { maxlength: 'Máximo 40 caracteres' }),
    costPrice: formError(this.form.controls.costPrice, { required: 'Ingresá el costo', min: 'No puede ser negativo' }),
    salePrice: formError(this.form.controls.salePrice, { required: 'Ingresá el precio', min: 'No puede ser negativo' }),
    minStock: formError(this.form.controls.minStock, { required: 'Ingresá el mínimo', min: 'No puede ser negativo' }),
  };

  readonly concentrationOptions = toOptions(CONCENTRATION_LABELS);
  readonly presentationOptions = toOptions(PRESENTATION_LABELS);
  readonly genderOptions = toOptions(GENDER_LABELS);

  private readonly brandList = signal<{ id: number; name: string }[]>([]);
  readonly brandOptions = computed(() => this.brandList().map((b) => ({ value: String(b.id), label: b.name })));

  readonly newBrandOpen = signal(false);
  readonly newBrandName = this.fb.control('', [Validators.required, Validators.maxLength(80)]);
  readonly newBrandError = signal<string | null>(null);
  readonly savingBrand = signal(false);

  readonly product = signal<ProductResponse | null>(null);
  readonly stockOpen = signal(false);
  readonly notFound = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.brands.list().subscribe((list) => this.brandList.set(list));
    if (this.id !== null) {
      this.products.get(this.id).subscribe({
        next: (p) => this.fill(p),
        error: () => this.notFound.set(true),
      });
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.error.set(null);
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const body = this.toRequest();
    const call = this.id === null ? this.products.create(body) : this.products.update(this.id, body);
    call.subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  addBrand(): void {
    this.newBrandName.markAsTouched();
    this.newBrandError.set(null);
    if (this.newBrandName.invalid || this.savingBrand()) {
      this.newBrandError.set('Ingresá el nombre de la marca');
      return;
    }
    this.savingBrand.set(true);
    this.brands.create({ name: this.newBrandName.value.trim() }).subscribe({
      next: (b) => {
        this.brandList.update((list) => [...list, b].sort((x, y) => x.name.localeCompare(y.name)));
        this.form.controls.brandId.setValue(String(b.id));
        this.newBrandName.reset();
        this.newBrandOpen.set(false);
        this.savingBrand.set(false);
      },
      error: (e: ApiError) => {
        this.newBrandError.set(e.message);
        this.savingBrand.set(false);
      },
    });
  }

  deactivate(): void {
    if (this.id === null) return;
    this.loading.set(true);
    this.products.deactivate(this.id).subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  activate(): void {
    if (this.id === null) return;
    this.loading.set(true);
    this.products.activate(this.id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  onMovement(m: MovementResponse): void {
    this.product.update((p) => (p ? { ...p, currentStock: m.stockAfter, belowMinimum: m.stockAfter <= p.minStock } : p));
  }

  private fill(p: ProductResponse): void {
    this.product.set(p);
    this.form.setValue({
      name: p.name,
      sku: p.sku,
      brandId: String(p.brandId),
      concentration: p.concentration,
      sizeMl: String(p.sizeMl),
      presentation: p.presentation,
      gender: p.gender ?? '',
      fragranceFamily: p.fragranceFamily ?? '',
      costPrice: p.costPrice.toFixed(2),
      salePrice: p.salePrice.toFixed(2),
      minStock: String(p.minStock),
    });
  }

  private toRequest(): ProductRequest {
    const v = this.form.getRawValue();
    return {
      name: v.name.trim(),
      sku: v.sku.trim(),
      brandId: Number(v.brandId),
      concentration: v.concentration as Concentration,
      sizeMl: Number(v.sizeMl),
      presentation: v.presentation as Presentation,
      gender: (v.gender || null) as Gender | null,
      fragranceFamily: v.fragranceFamily.trim() || null,
      costPrice: Number(v.costPrice).toFixed(2),
      salePrice: Number(v.salePrice).toFixed(2),
      minStock: Number(v.minStock),
    };
  }
}
