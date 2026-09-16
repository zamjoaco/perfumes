import { Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

/** Diálogo centrado sobre un fondo oscurecido. Se cierra con Escape, con el fondo o desde adentro. */
@Component({
  selector: 'neu-modal',
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" (click)="closed.emit()">
      <div
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        class="w-full bg-neu rounded-neu shadow-neu p-6 max-h-[90vh] overflow-y-auto"
        [style.max-width]="maxWidth()"
        (click)="$event.stopPropagation()">
        <div class="flex items-start justify-between gap-4 mb-4">
          <h2 class="text-lg font-semibold">{{ title() }}</h2>
          <button type="button" class="text-neuMuted hover:text-neuText h-8 w-8 -mr-2 -mt-1 rounded-full" (click)="closed.emit()" aria-label="Cerrar">
            <svg class="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <ng-content />
      </div>
    </div>`,
})
export class NeuModal {
  title = input.required<string>();
  maxWidth = input('32rem');
  closed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      const first = this.host.nativeElement.querySelector<HTMLElement>('input, select, textarea, button:not([aria-label="Cerrar"])');
      first?.focus();
    });
  }
}
