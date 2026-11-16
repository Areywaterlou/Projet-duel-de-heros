import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HERO_ARCHETYPES, HERO_BASE_STATS, HERO_RANKS } from '../../data/game-constants';
import { heroStatBreakdown, heroStatTotal } from '../../data/hero-display';
import type { Hero, HeroBaseStat } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';

type DashboardSort = 'rang' | 'nom' | HeroBaseStat | 'tauxCritique' | 'degatsCritiques';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly firebaseService = inject(FirebaseService);

  protected readonly heros = this.firebaseService.herosEnDirect;
  protected readonly armes = this.firebaseService.armesEnDirect;
  protected readonly erreur = this.firebaseService.erreurHerosEnDirect;
  protected readonly stats = HERO_BASE_STATS;
  protected readonly rangs = HERO_RANKS;
  protected readonly classes = HERO_ARCHETYPES;
  protected readonly labels: Record<HeroBaseStat, string> = {
    attaque: 'ATK',
    defense: 'DEF',
    pv: 'PV',
    soin: 'SOIN',
    esquive: 'ESQ'
  };
  protected readonly recherche = signal('');
  protected readonly filtreRang = signal('');
  protected readonly filtreClasse = signal('');
  protected readonly tri = signal<DashboardSort>('rang');
  protected readonly ordre = signal<'desc' | 'asc'>('desc');
  protected readonly herosMarquants = computed(() => {
    const weapons = this.armes() ?? [];
    const nameFilter = this.recherche().trim().toLocaleLowerCase();
    const rankFilter = this.filtreRang();
    const classFilter = this.filtreClasse();
    const sort = this.tri();
    const descending = this.ordre() === 'desc';
    return [...(this.heros() ?? [])]
      .filter(hero => !nameFilter || hero.nom.toLocaleLowerCase().includes(nameFilter))
      .filter(hero => !rankFilter || hero.rang === rankFilter)
      .filter(hero => !classFilter || hero.archetype === classFilter)
      .sort((left, right) => {
        const leftAttack = heroStatTotal(left, 'attaque', weapons) ?? 0;
        const rightAttack = heroStatTotal(right, 'attaque', weapons) ?? 0;
        const rankDifference = HERO_RANKS.indexOf(left.rang) - HERO_RANKS.indexOf(right.rang);
        if (sort === 'rang') {
          return (descending ? rankDifference : -rankDifference) ||
            rightAttack - leftAttack || left.nom.localeCompare(right.nom);
        }
        const leftValue = sort === 'nom' ? left.nom.toLocaleLowerCase()
          : sort === 'tauxCritique' ? left.tauxCritique
            : sort === 'degatsCritiques' ? left.degatsCritiques
              : heroStatTotal(left, sort, weapons) ?? 0;
        const rightValue = sort === 'nom' ? right.nom.toLocaleLowerCase()
          : sort === 'tauxCritique' ? right.tauxCritique
            : sort === 'degatsCritiques' ? right.degatsCritiques
              : heroStatTotal(right, sort, weapons) ?? 0;
        const difference = typeof leftValue === 'string' && typeof rightValue === 'string'
          ? leftValue.localeCompare(rightValue)
          : Number(leftValue) - Number(rightValue);
        return (descending ? -difference : difference) || rankDifference || left.nom.localeCompare(right.nom);
      })
  });

  protected detailStat(hero: Hero, stat: HeroBaseStat) {
    return heroStatBreakdown(hero, stat, this.armes() ?? []);
  }

  protected changerRecherche(event: Event): void {
    this.recherche.set((event.target as HTMLInputElement).value);
  }

  protected changerFiltreRang(event: Event): void {
    this.filtreRang.set((event.target as HTMLSelectElement).value);
  }

  protected changerFiltreClasse(event: Event): void {
    this.filtreClasse.set((event.target as HTMLSelectElement).value);
  }

  protected changerTri(event: Event): void {
    this.tri.set((event.target as HTMLSelectElement).value as DashboardSort);
  }

  protected changerOrdre(event: Event): void {
    this.ordre.set((event.target as HTMLSelectElement).value === 'asc' ? 'asc' : 'desc');
  }
}
