import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ApiError } from '../../../core/error.interceptor';
import { AuthService } from '../../../core/auth.service';
import { formError } from '../../../core/form-errors';
import { NeuButton, NeuCard, NeuInput, PageHeader } from '../../../shared/ui';

/** Marca `mismatch` en `confirm` cuando no coincide con `newPassword`, sin pisar su `required`. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value as string | undefined;
  const confirm = group.get('confirm');
  if (!confirm || !confirm.value) return null;
  const { mismatch: _ignored, ...others } = confirm.errors ?? {};
  const errors = newPassword !== confirm.value ? { ...others, mismatch: true } : others;
  confirm.setErrors(Object.keys(errors).length ? errors : null);
  return null;
}

@Component({
  selector: 'app-change-password-page',
  imports: [ReactiveFormsModule, NeuCard, NeuButton, NeuInput, PageHeader],
  template: `
    <page-header title="Cambiar contraseña" />
    <div class="max-w-md">
      <neu-card>
        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
          <neu-input
            label="Contraseña actual"
            type="password"
            formControlName="currentPassword"
            autocomplete="current-password"
            [error]="currentError()" />
          <neu-input
            label="Contraseña nueva"
            type="password"
            formControlName="newPassword"
            autocomplete="new-password"
            [error]="newError()" />
          <neu-input
            label="Repetir contraseña nueva"
            type="password"
            formControlName="confirm"
            autocomplete="new-password"
            [error]="confirmError()" />

          @if (error()) {
            <p class="text-sm text-danger" role="alert">{{ error() }}</p>
          }
          @if (saved()) {
            <p class="text-sm text-emerald-600" role="status">Contraseña actualizada.</p>
          }

          <div class="flex justify-end mt-2">
            <neu-button variant="primary" type="submit" [disabled]="loading()">
              {{ loading() ? 'Guardando…' : 'Guardar' }}
            </neu-button>
          </div>
        </form>
      </neu-card>
    </div>`,
})
export class ChangePasswordPage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  readonly currentError = formError(this.form.controls.currentPassword, { required: 'Ingresá la contraseña actual' });
  readonly newError = formError(this.form.controls.newPassword, {
    required: 'Ingresá la contraseña nueva',
    minlength: 'Mínimo 8 caracteres',
    maxlength: 'Máximo 72 caracteres',
  });
  readonly confirmError = formError(this.form.controls.confirm, {
    required: 'Repetí la contraseña nueva',
    mismatch: 'Las contraseñas no coinciden',
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  submit(): void {
    this.form.markAllAsTouched();
    this.error.set(null);
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.saved.set(false);
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.saved.set(true);
        this.loading.set(false);
        this.form.reset();
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
