import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/pages/login-page').then((m) => m.LoginPage) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage) },
      {
        path: 'productos',
        loadChildren: () => import('./features/products/products.routes').then((m) => m.PRODUCTS_ROUTES),
      },
      {
        path: 'ventas',
        loadChildren: () => import('./features/sales/sales.routes').then((m) => m.SALES_ROUTES),
      },
      {
        path: 'cambiar-contrasena',
        loadComponent: () => import('./features/auth/pages/change-password-page').then((m) => m.ChangePasswordPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
