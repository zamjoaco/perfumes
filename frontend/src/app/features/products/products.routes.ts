import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/product-list-page').then((m) => m.ProductListPage) },
  { path: 'nuevo', loadComponent: () => import('./pages/product-form-page').then((m) => m.ProductFormPage) },
  { path: ':id', loadComponent: () => import('./pages/product-form-page').then((m) => m.ProductFormPage) },
];
