import { Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

export type ErrorMessages = Record<string, string>;

/** Mensaje del primer error activo, o null. Solo después de tocar el control. */
export function formError(control: AbstractControl, messages: ErrorMessages): Signal<string | null> {
  // control.errors no es un signal; control.events sí es observable.
  const events = toSignal(control.events, { initialValue: null });
  return computed(() => {
    events();
    if (!control.touched || !control.errors) return null;
    const key = Object.keys(control.errors)[0];
    return messages[key] ?? 'Valor inválido';
  });
}
