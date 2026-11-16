import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HERO_BASE_STATS, HERO_RANKS, HERO_RARITY } from '../../data/game-constants';
import { heroStatBreakdown } from '../../data/hero-display';
import type { Hero, HeroBaseStat } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-tier-list',
  imports: [RouterLink],
  templateUrl: './tier-list.html',
  styleUrl: './tier-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierListComponent {
  private readonly firebaseService = inject(FirebaseService);

  protected readonly rangs = HERO_RANKS;
  protected readonly stats = HERO_BASE_STATS;
  protected readonly etoiles = [1, 2, 3, 4, 5];
  protected readonly heros = this.firebaseService.herosEnDirect;
  protected readonly armes = this.firebaseService.armesEnDirect;
  protected readonly erreurHeros = this.firebaseService.erreurHerosEnDirect;
  protected readonly erreurArmes = this.firebaseService.erreurArmesEnDirect;
  protected readonly groupes = computed(() => {
    const heroes = [...(this.heros() ?? [])].sort((left, right) => left.nom.localeCompare(right.nom));
    return this.rangs.map(rang => ({
      rang,
      etoiles: HERO_RARITY[rang],
      heros: heroes.filter(hero => hero.rang === rang)
    }));
  });

  protected detailStat(hero: Hero, stat: HeroBaseStat) {
    return heroStatBreakdown(hero, stat, this.armes() ?? []);
  }

  protected armeNom(hero: Hero): string {
    return this.armes()?.find(arme => arme.id === hero.armeId)?.nom ?? 'Sans arme';
  }

}
