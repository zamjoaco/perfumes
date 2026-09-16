import { Component, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

/** Select nativo con superficie neumórfica. El valor siempre es string; el componente que lo usa convierte. */
@Component({
  selector: 'neu-select',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: NeuSelect, multi: true }],
  template: `
    <label class="block">
      @if (label()) {
        <span class="block mb-1 text-sm text-neuMuted">{{ label() }}</span>
      }
      <div class="relative">
        <select
          [disabled]="isDisabled()"
          (change)="onSelect($event)"
          (blur)="onTouched()"
          class="w-full h-11 pl-4 pr-10 rounded-neu bg-neu text-neuText shadow-neu-inset outline-none appearance-none
                 border-2 border-transparent transition-all duration-150 focus:border-accent/40 cursor-pointer"
          [class.border-danger]="error()"
          [class.text-neuMuted]="!value()">
          @if (placeholder()) {
            <option value="" [selected]="!value()">{{ placeholder() }}</option>
          }
          @for (o of options(); track o.value) {
            <option [value]="o.value" [selected]="o.value === value()">{{ o.label }}</option>
          }
        </select>
        <svg class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neuMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      @if (error()) {
        <span class="block mt-1 text-sm text-danger">{{ error() }}</span>
      }
    </label>`,
})
export class NeuSelect implements ControlValueAccessor {
  label = input('');
  placeholder = input('');
  options = input.required<SelectOption[]>();
  error = input<string | null>(null);

  value = signal('');
  isDisabled = signal(false);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onSelect(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.value.set(v);
    this.onChange(v);
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
