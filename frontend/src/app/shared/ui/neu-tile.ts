import { Component, input, output } from '@angular/core';

/** Superficie clickeable (botón grande con contenido libre): elegir un producto, una opción, etc. */
@Component({
  selector: 'neu-tile',
  host: { class: 'block' },
  template: `
    <button
      type="button"
      [disabled]="disabled()"
      (click)="pressed.emit()"
      class="w-full h-full text-left bg-neu text-neuText rounded-neu p-4 transition-all duration-150
             shadow-neu-sm active:shadow-neu-inset hover:-translate-y-0.5
             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
      <ng-content />
    </button>`,
})
export class NeuTile {
  disabled = input(false);
  pressed = output<void>();
}
