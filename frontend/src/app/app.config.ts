import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { House, LUCIDE_ICONS, LucideIconProvider, Moon, Package, ShoppingCart, Sun } from 'lucide-angular';

import { routes } from './app.routes';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([])),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ House, Package, ShoppingCart, Sun, Moon }) },
  ],
};
