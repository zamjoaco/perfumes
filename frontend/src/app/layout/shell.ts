import { Component, inject } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { NeuButton } from '../shared/ui';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, NeuButton],
  template: `
    <div class="h-screen flex overflow-hidden">
      <aside class="w-60 shrink-0 p-4 flex flex-col gap-2">
        <a routerLink="/" class="flex items-center gap-3 px-3 py-4 mb-2">
          <img src="logo.svg" alt="" class="w-8 h-8" />
          <span class="text-lg font-semibold">Perfumes</span>
        </a>
        @for (item of nav; track item.path) {
          <a
            [routerLink]="item.path"
            [queryParams]="item.query ?? null"
            routerLinkActive="shadow-neu-inset"
            [routerLinkActiveOptions]="activeOptions"
            class="flex items-center gap-3 h-11 px-4 rounded-neu transition-all duration-150 hover:shadow-neu-sm">
            <lucide-icon [name]="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </a>
        }
      </aside>

      <div class="flex-1 flex flex-col min-w-0 min-h-0">
        <header class="flex items-center justify-end gap-2 px-6 py-4 shrink-0">
          <span class="text-sm text-neuMuted mr-2">{{ auth.username() }}</span>
          <neu-button variant="icon" routerLink="/cambiar-contrasena" aria-label="Mi cuenta" title="Mi cuenta">
            <lucide-icon name="key-round" class="w-5 h-5" />
          </neu-button>
          <neu-button variant="icon" (pressed)="theme.toggle()" [attr.aria-label]="theme.theme() === 'dark' ? 'Modo claro' : 'Modo oscuro'">
            <lucide-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" class="w-5 h-5" />
          </neu-button>
          <neu-button variant="icon" (pressed)="logout()" aria-label="Cerrar sesión" title="Cerrar sesión">
            <lucide-icon name="log-out" class="w-5 h-5" />
          </neu-button>
        </header>
        <!-- Solo el contenido scrollea; menú y cabecera quedan fijos. -->
        <main class="flex-1 min-h-0 overflow-y-auto px-6 pb-8">
          <router-outlet />
        </main>
      </div>
    </div>`,
})
export class Shell {
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly nav = [
    { path: '/', label: 'Inicio', icon: 'house' },
    { path: '/productos', label: 'Productos', icon: 'package' },
    { path: '/productos', label: 'Stock bajo', icon: 'triangle-alert', query: { stockBajo: 1 } },
    { path: '/ventas', label: 'Ventas', icon: 'shopping-cart' },
  ] as { path: string; label: string; icon: string; query?: Record<string, number> }[];

  /** Ruta y query exactos: "Productos" y "Stock bajo" comparten path y se distinguen por ?stockBajo. */
  readonly activeOptions: IsActiveMatchOptions = { paths: 'exact', queryParams: 'exact', fragment: 'ignored', matrixParams: 'ignored' };

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
