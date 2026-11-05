import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tier-list' },
  {
    path: 'tier-list',
    loadComponent: () =>
      import('./components/tier-list/tier-list').then(module => module.TierListComponent)
  },
  {
    path: 'ajouter',
    loadComponent: () =>
      import('./components/hero-form/hero-form').then(module => module.HeroFormComponent)
  },
  {
    path: 'heros/:id',
    loadComponent: () =>
      import('./components/hero-detail/hero-detail').then(module => module.HeroDetailPageComponent)
  },
  { path: '**', redirectTo: 'tier-list' }
];