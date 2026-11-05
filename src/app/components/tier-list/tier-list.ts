import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { HeroDocument, HeroRank } from '../../data/hero';
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
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tier-list.html',
  styleUrl: './tier-list.css'
})
export class TierListComponent implements OnInit {
  private readonly firebaseService = inject(FirebaseService);

  protected readonly ranks = RANKS;
  protected readonly heros = signal<HeroDocument[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal('');

  protected readonly groupes = computed(() =>
    this.ranks.map(rank => ({
      ...rank,
      heros: this.heros().filter(hero => hero.rang === rank.rang)
    }))
  );
  protected readonly herosSansRang = computed(() =>
    this.heros().filter(hero => !hero.rang || !this.ranks.some(rank => rank.rang === hero.rang))
  );

  ngOnInit(): void {
    void this.chargerHeros();
  }

  private async chargerHeros(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set('');

    try {
      this.heros.set(await this.firebaseService.initialiserHerosSiVide());
    } catch (error) {
      console.error('Erreur lors du chargement des héros :', error);
      this.erreur.set('Impossible de charger les héros depuis Firestore.');
    } finally {
      this.chargement.set(false);
    }
  }
}
