import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Desplegable propio (el <select> nativo no se puede estilar): botón neumórfico + lista flotante.
 * El placeholder solo se muestra cuando no hay valor; no es una opción elegible.
 * `actionLabel` agrega una fila al final (p. ej. "Nueva marca") que emite `action` en vez de elegir.
 */
@Component({
  selector: 'neu-select',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: NeuSelect, multi: true }],
  host: {
    class: 'block',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <div class="relative">
      @if (label()) {
        <span class="block mb-1 text-sm text-neuMuted">{{ label() }}</span>
      }
      <button
        type="button"
        role="combobox"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="label() || placeholder()"
        [disabled]="isDisabled()"
        (click)="toggle()"
        (blur)="onTouched()"
        class="w-full h-11 pl-4 pr-10 text-left rounded-neu bg-neu shadow-neu-inset outline-none
               border-2 border-transparent transition-all duration-150 focus:border-accent/40
               disabled:opacity-50 disabled:cursor-not-allowed"
        [class.border-danger]="error()"
        [class.text-neuMuted]="!selected()"
        [class.text-neuText]="selected()">
        <span class="block truncate">{{ selected()?.label ?? placeholder() }}</span>
        <svg class="pointer-events-none absolute right-4 bottom-3.5 w-4 h-4 text-neuMuted transition-transform duration-150"
             [class.rotate-180]="open()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      @if (open()) {
        <ul role="listbox" class="absolute z-40 left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-neu rounded-neu shadow-neu p-2">
          @for (o of options(); track o.value) {
            <li
              role="option"
              [attr.aria-selected]="o.value === value()"
              (click)="choose(o.value)"
              class="px-3 h-10 flex items-center rounded-neu cursor-pointer transition-all duration-150 hover:shadow-neu-sm"
              [class.shadow-neu-inset]="o.value === value()"
              [class.text-accent]="o.value === value()">
              {{ o.label }}
            </li>
          } @empty {
            <li class="px-3 h-10 flex items-center text-sm text-neuMuted">{{ emptyLabel() }}</li>
          }
          @if (actionLabel()) {
            <li
              role="option"
              (click)="runAction()"
              class="px-3 h-10 mt-1 flex items-center gap-2 rounded-neu cursor-pointer text-accent transition-all duration-150 hover:shadow-neu-sm border-t border-neuLight/60">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              {{ actionLabel() }}
            </li>
          }
        </ul>
      }
      @if (error()) {
        <span class="block mt-1 text-sm text-danger">{{ error() }}</span>
      }
    </div>`,
})
export class NeuSelect implements ControlValueAccessor {
  label = input('');
  placeholder = input('Elegí una opción');
  options = input.required<SelectOption[]>();
  error = input<string | null>(null);
  emptyLabel = input('No hay opciones');
  /** Fila extra al final de la lista; al tocarla se emite `action` y se cierra. */
  actionLabel = input('');
  action = output<void>();

  value = signal('');
  isDisabled = signal(false);
  open = signal(false);
  readonly selected = computed(() => this.options().find((o) => o.value === this.value()) ?? null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  toggle(): void {
    this.open.update((o) => !o);
  }
  close(): void {
    this.open.set(false);
  }
  choose(v: string): void {
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
    this.close();
  }
  runAction(): void {
    this.close();
    this.action.emit();
  }
  onDocumentClick(e: Event): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.close();
  }

  writeValue(v: string | number | null): void {
    this.value.set(v == null ? '' : String(v));
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.isDisabled.set(d);
  }
}
