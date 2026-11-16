import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/accueil/accueil').then(module => module.AccueilComponent)
  },
  {
    path: 'tier-list',
    loadComponent: () =>
      import('./components/tier-list/tier-list').then(module => module.TierListComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard').then(module => module.DashboardComponent)
  },
  {
    path: 'duel',
    loadComponent: () =>
      import('./components/duel/duel').then(module => module.DuelComponent)
  },
  {
    path: 'ajouter',
    loadComponent: () =>
      import('./components/hero-form/hero-form').then(module => module.HeroFormComponent)
  },
  {
    path: 'heros/:id/edit',
    loadComponent: () =>
      import('./components/hero-detail/hero-detail').then(module => module.HeroDetailPageComponent)
  },
  {
    path: 'heros/:id',
    loadComponent: () =>
      import('./components/hero-detail/hero-detail').then(module => module.HeroDetailPageComponent)
  },
  {
    path: 'armes',
    loadComponent: () =>
      import('./components/arme-list/arme-list').then(module => module.ArmeListComponent)
  },
  {
    path: 'armes/nouvelle',
    loadComponent: () =>
      import('./components/arme-form/arme-form').then(module => module.ArmeFormComponent)
  },
  {
    path: 'armes/:id/edit',
    loadComponent: () =>
      import('./components/arme-form/arme-form').then(module => module.ArmeFormComponent)
  },
  {
    path: 'armes/:id',
    loadComponent: () =>
      import('./components/arme-detail/arme-detail').then(module => module.ArmeDetailPageComponent)
  },
  { path: '**', redirectTo: '' }
];