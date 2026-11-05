import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { HeroesComponent } from './components/heroes-component/heroes-component';
import { HeroDetailComponent } from './components/hero-details-component/hero-detail-component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tier-list'
  },
  {
    path: 'ajouter',
    loadComponent: () =>
      import('./components/hero-form/hero-form').then(module => module.HeroFormComponent)
  },
  {
    path: 'tier-list',
    loadComponent: () =>
      import('./components/tier-list/tier-list').then(module => module.TierListComponent)
  },
  {
    path: 'heros/:id',
    loadComponent: () =>
      import('./components/hero-detail/hero-detail').then(module => module.HeroDetailPageComponent)
  },
  {
    path: '**',
    redirectTo: 'tier-list'
  }
];
