import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../core/theme.service';
import { NeuButton } from '../shared/ui';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, NeuButton],
  template: `
    <div class="min-h-screen flex">
      <aside class="w-60 shrink-0 p-4 flex flex-col gap-2">
        <a routerLink="/" class="flex items-center gap-3 px-3 py-4 mb-2">
          <img src="logo.svg" alt="" class="w-8 h-8" />
          <span class="text-lg font-semibold">Pefumes</span>
        </a>
        @for (item of nav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="shadow-neu-inset"
            [routerLinkActiveOptions]="{ exact: item.path === '/' }"
            class="flex items-center gap-3 h-11 px-4 rounded-neu transition-all duration-150 hover:shadow-neu-sm">
            <lucide-icon [name]="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </a>
        }
      </aside>

      <div class="flex-1 flex flex-col min-w-0">
        <header class="flex items-center justify-end gap-2 px-6 py-4">
          <neu-button variant="icon" (pressed)="theme.toggle()" [attr.aria-label]="theme.theme() === 'dark' ? 'Modo claro' : 'Modo oscuro'">
            <lucide-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" class="w-5 h-5" />
          </neu-button>
        </header>
        <main class="flex-1 px-6 pb-8">
          <router-outlet />
        </main>
      </div>
    </div>`,
})
export class Shell {
  readonly theme = inject(ThemeService);
  readonly nav = [
    { path: '/', label: 'Inicio', icon: 'house' },
    { path: '/productos', label: 'Productos', icon: 'package' },
    { path: '/ventas', label: 'Ventas', icon: 'shopping-cart' },
  ];
}
