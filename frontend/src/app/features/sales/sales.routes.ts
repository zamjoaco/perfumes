import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/sale-list-page').then((m) => m.SaleListPage) },
  { path: 'nueva', loadComponent: () => import('./pages/sale-new-page').then((m) => m.SaleNewPage) },
  { path: ':id', loadComponent: () => import('./pages/sale-detail-page').then((m) => m.SaleDetailPage) },
];
