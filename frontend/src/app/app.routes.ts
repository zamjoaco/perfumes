import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage) },
      { path: '**', redirectTo: '' },
    ],
  },
];
