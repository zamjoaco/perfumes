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
        path: 'cambiar-contrasena',
        loadComponent: () => import('./features/auth/pages/change-password-page').then((m) => m.ChangePasswordPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
