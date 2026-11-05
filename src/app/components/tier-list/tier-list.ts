import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { HeroRank } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';

const RANKS: { rang: HeroRank; nom: string }[] = [
  { rang: 'S', nom: 'Rang S — Légendaires' },
  { rang: 'A', nom: 'Rang A — Élite' },
  { rang: 'B', nom: 'Rang B — Solides' },
  { rang: 'C', nom: 'Rang C — Moyens' },
  { rang: 'D', nom: 'Rang D — À améliorer' }
];

@Component({
  selector: 'app-tier-list',
  imports: [RouterLink],
  templateUrl: './tier-list.html',
  styleUrl: './tier-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierListComponent {
  private readonly firebaseService = inject(FirebaseService);

  protected readonly ranks = RANKS;
  protected readonly heros = resource({
    loader: () => this.firebaseService.obtenirHeros()
  });

  protected readonly groupes = computed(() =>
    this.ranks.map(rank => ({
      ...rank,
      heros: (this.heros.value() ?? []).filter(hero => hero.rang === rank.rang)
    }))
  );
}
