import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'neu-button',
  host: { '[class.block]': 'block()' },
  template: `
    <button [type]="type()" [disabled]="disabled()" [class]="classes()" (click)="pressed.emit($event)">
      <ng-content />
    </button>`,
})
export class NeuButton {
  variant = input<'primary' | 'secondary' | 'danger' | 'icon'>('secondary');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
  /** Ocupa todo el ancho del contenedor (formularios de una columna). */
  block = input(false);
  /** Estado "apretado" (filtro activo): se ve hundido en reposo. */
  active = input(false);
  pressed = output<MouseEvent>();

  classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 h-11 rounded-neu font-medium select-none ' +
      'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed' +
      (this.block() ? ' w-full' : '');
    const rest = this.active() ? 'shadow-neu-inset' : 'shadow-neu-sm active:shadow-neu-inset';
    switch (this.variant()) {
      // La acción primaria NO es neumórfica: color sólido para que se encuentre siempre.
      case 'primary':
        return `${base} px-5 bg-accent text-white ${rest} hover:brightness-110`;
      case 'danger':
        return `${base} px-5 bg-neu text-danger ${rest}`;
      case 'icon':
        return `${base} w-11 px-0 bg-neu text-neuText ${rest}`;
      default:
        return `${base} px-5 bg-neu ${this.active() ? 'text-accent' : 'text-neuText'} ${rest}`;
    }
  });
}
