import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  House,
  KeyRound,
  LUCIDE_ICONS,
  LogOut,
  LucideIconProvider,
  Moon,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  ShoppingCart,
  Sun,
  TriangleAlert,
} from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { errorInterceptor } from './core/error.interceptor';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // El orden importa: la respuesta la ve primero el ÚLTIMO, así authInterceptor detecta el 401 crudo.
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        House, Package, ShoppingCart, Sun, Moon, KeyRound, LogOut,
        Plus, ArrowLeft, ChevronLeft, ChevronRight, TriangleAlert, Pencil, PackagePlus,
      }),
    },
  ],
};
