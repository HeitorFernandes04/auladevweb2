import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('src/app/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'pecas',
    loadComponent: () =>
      import('src/app/pecas/pecas.page').then((m) => m.PecasPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
