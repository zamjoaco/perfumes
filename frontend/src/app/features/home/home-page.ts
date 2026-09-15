import { Component } from '@angular/core';
import { NeuBadge, NeuButton, NeuCard, NeuInput, PageHeader } from '../../shared/ui';

@Component({
  selector: 'app-home-page',
  imports: [NeuCard, NeuButton, NeuInput, NeuBadge, PageHeader],
  template: `
    <page-header title="Inicio">
      <neu-button variant="primary">Nueva venta</neu-button>
    </page-header>
    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <neu-card>
        <p class="text-sm text-neuMuted mb-1">Productos activos</p>
        <p class="text-3xl font-semibold">0</p>
      </neu-card>
      <neu-card>
        <p class="text-sm text-neuMuted mb-1">Stock bajo</p>
        <p class="text-3xl font-semibold">0 <neu-badge kind="warn">revisar</neu-badge></p>
      </neu-card>
      <neu-card>
        <p class="text-sm text-neuMuted mb-3">Muestra de controles</p>
        <neu-input label="Buscar" placeholder="Nombre o SKU" />
        <div class="flex gap-3 mt-4">
          <neu-button>Secundario</neu-button>
          <neu-button variant="danger">Eliminar</neu-button>
        </div>
      </neu-card>
    </div>`,
})
export class HomePage {}
