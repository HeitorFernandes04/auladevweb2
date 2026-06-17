import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('src/app/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('src/app/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'pecas',
        loadComponent: () =>
          import('src/app/pecas/pecas.page').then((m) => m.PecasPage),
      },
      {
        path: 'anuncios',
        loadComponent: () =>
          import('src/app/anuncios/anuncios.page').then((m) => m.AnunciosPage),
      },
      {
        path: 'busca',
        loadComponent: () =>
          import('src/app/busca/busca.page').then((m) => m.BuscaPage),
      },
      {
        path: '',
        redirectTo: 'anuncios',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'nova-peca',
    loadComponent: () =>
      import('src/app/pecas/nova-peca/nova-peca.page').then((m) => m.NovaPecaPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
