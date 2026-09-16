import { Component, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'neu-input',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: NeuInput, multi: true }],
  template: `
    <label class="block">
      @if (label()) {
        <span class="block mb-1 text-sm text-neuMuted">{{ label() }}</span>
      }
      <input
        [type]="type()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="isDisabled()"
        [autocomplete]="autocomplete()"
        [attr.step]="step()"
        [attr.min]="min()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="w-full h-11 px-4 rounded-neu bg-neu text-neuText shadow-neu-inset outline-none
               border-2 border-transparent transition-all duration-150 focus:border-accent/40"
        [class.border-danger]="error()" />
      @if (error()) {
        <span class="block mt-1 text-sm text-danger">{{ error() }}</span>
      }
    </label>`,
})
export class NeuInput implements ControlValueAccessor {
  label = input('');
  placeholder = input('');
  type = input<'text' | 'number' | 'password' | 'email' | 'date'>('text');
  autocomplete = input('off');
  step = input<string | null>(null);
  min = input<string | null>(null);
  error = input<string | null>(null);

  value = signal('');
  isDisabled = signal(false);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
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
