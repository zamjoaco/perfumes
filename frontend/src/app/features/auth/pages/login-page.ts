import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../../core/error.interceptor';
import { AuthService } from '../../../core/auth.service';
import { formError } from '../../../core/form-errors';
import { ThemeService } from '../../../core/theme.service';
import { NeuButton, NeuCard, NeuInput } from '../../../shared/ui';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, LucideAngularModule, NeuCard, NeuButton, NeuInput],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <neu-button
        variant="icon"
        class="fixed top-4 right-4"
        (pressed)="theme.toggle()"
        [attr.aria-label]="theme.theme() === 'dark' ? 'Modo claro' : 'Modo oscuro'">
        <lucide-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" class="w-5 h-5" />
      </neu-button>

      <div class="w-full max-w-sm">
        <neu-card>
          <div class="flex flex-col items-center gap-2 mb-6">
            <img src="logo.svg" alt="" class="w-14 h-14" />
            <h1 class="text-2xl font-semibold">Perfumes</h1>
            <p class="text-sm text-neuMuted">Ingresá para continuar</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
            <neu-input label="Usuario" formControlName="username" autocomplete="username" [error]="usernameError()" />
            <neu-input
              label="Contraseña"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              [error]="passwordError()" />

            @if (error()) {
              <p class="text-sm text-danger" role="alert">{{ error() }}</p>
            }

            <neu-button variant="primary" type="submit" [disabled]="loading()" [block]="true" class="mt-2">
              {{ loading() ? 'Ingresando…' : 'Ingresar' }}
            </neu-button>
          </form>
        </neu-card>
      </div>
    </div>`,
})
export class LoginPage {
  readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  readonly usernameError = formError(this.form.controls.username, { required: 'El usuario es obligatorio' });
  readonly passwordError = formError(this.form.controls.password, { required: 'La contraseña es obligatoria' });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.form.markAllAsTouched();
    this.error.set(null);
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/');
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
