import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'neu-button',
  template: `
    <button [type]="type()" [disabled]="disabled()" [class]="classes()" (click)="pressed.emit($event)">
      <ng-content />
    </button>`,
})
export class NeuButton {
  variant = input<'primary' | 'secondary' | 'danger' | 'icon'>('secondary');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
  pressed = output<MouseEvent>();

  classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 h-11 rounded-neu font-medium select-none ' +
      'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
    switch (this.variant()) {
      // La acción primaria NO es neumórfica: color sólido para que se encuentre siempre.
      case 'primary':
        return `${base} px-5 bg-accent text-white shadow-neu-sm hover:brightness-110 active:shadow-neu-inset`;
      case 'danger':
        return `${base} px-5 bg-neu text-danger shadow-neu-sm active:shadow-neu-inset`;
      case 'icon':
        return `${base} w-11 px-0 bg-neu text-neuText shadow-neu-sm active:shadow-neu-inset`;
      default:
        return `${base} px-5 bg-neu text-neuText shadow-neu-sm active:shadow-neu-inset`;
    }
  });
}
