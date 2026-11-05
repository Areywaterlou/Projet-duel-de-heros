import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { HeroesComponent } from './components/heroes-component/heroes-component';
import { HeroDetailComponent } from './components/hero-details-component/hero-detail-component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tier-list' },

  // Anciennes pages
  { path: 'dashboard', component: DashboardComponent },
  { path: 'heroes', component: HeroesComponent },
  { path: 'detail/:id', component: HeroDetailComponent },

  // Nouvelles pages (lazy loading)
  {
    path: 'ajouter',
    loadComponent: () =>
      import('./components/hero-form/hero-form').then(m => m.HeroFormComponent)
  },
  {
    path: 'tier-list',
    loadComponent: () =>
      import('./components/tier-list/tier-list').then(m => m.TierListComponent)
  },
  {
    path: 'heros/:id',
    loadComponent: () =>
      import('./components/hero-detail/hero-detail').then(m => m.HeroDetailPageComponent)
  },

  // Toujours en dernier
  { path: '**', redirectTo: 'tier-list' }
];