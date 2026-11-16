import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HERO_BASE_STATS } from '../../data/game-constants';
import type { Hero, HeroBaseStat } from '../../data/hero';
import type { DuelFighter } from '../../data/duel-rules';
import { heroStatBreakdown } from '../../data/hero-display';
import type { Arme } from '../../data/weapon';

@Component({
  selector: 'app-hero-jeu',
  templateUrl: './hero-jeu.html',
  styleUrl: './hero-jeu.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroJeuComponent {
  readonly fighter = input.required<DuelFighter>();
  readonly armes = input<readonly Arme[]>([]);
  readonly active = input(false);
  readonly defeated = input(false);

  protected readonly stats = HERO_BASE_STATS;

  protected hero(): Hero {
    return this.fighter().hero;
  }

  protected detailStat(stat: HeroBaseStat) {
    return heroStatBreakdown(this.hero(), stat, this.armes());
  }
}
