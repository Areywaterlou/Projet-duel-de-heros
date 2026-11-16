import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HERO_STATS } from '../../data/game-constants';
import type { HeroStat } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-arme-list',
  imports: [RouterLink],
  templateUrl: './arme-list.html',
  styleUrl: './arme-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArmeListComponent {
  private readonly firebaseService = inject(FirebaseService);

  protected readonly armesSource = this.firebaseService.armesEnDirect;
  protected readonly erreur = this.firebaseService.erreurArmesEnDirect;
  protected readonly filtreNom = signal('');
  protected readonly triStat = signal<HeroStat>('attaque');
  protected readonly ordreTri = signal<'desc' | 'asc'>('desc');
  protected readonly armes = computed(() => {
    const filter = this.filtreNom().trim().toLocaleLowerCase();
    return [...(this.armesSource() ?? [])]
      .filter(arme => arme.nom.toLocaleLowerCase().includes(filter))
      .sort((left, right) => {
        const leftValue = left.statPrincipale === this.triStat()
          ? left.bonusPrincipal
          : left.statSecondaire === this.triStat() ? left.bonusSecondaire : 0;
        const rightValue = right.statPrincipale === this.triStat()
          ? right.bonusPrincipal
          : right.statSecondaire === this.triStat() ? right.bonusSecondaire : 0;
        const difference = this.ordreTri() === 'desc'
          ? rightValue - leftValue
          : leftValue - rightValue;
        return difference || left.nom.localeCompare(right.nom);
      });
  });

  protected changerFiltre(event: Event): void {
    this.filtreNom.set((event.target as HTMLInputElement).value);
  }

  protected changerTri(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const stat = HERO_STATS.find(item => item === value);
    if (stat) {
      this.triStat.set(stat);
    }
  }

  protected changerOrdre(event: Event): void {
    this.ordreTri.set((event.target as HTMLSelectElement).value === 'asc' ? 'asc' : 'desc');
  }
}
