import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('src/app/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'veiculos',
    loadComponent: () =>
      import('src/app/veiculos/veiculos.page').then((m) => m.VeiculosPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
