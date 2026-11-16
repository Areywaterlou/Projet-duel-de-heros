import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HERO_RANKS } from '../../data/game-constants';
import {
  creerDuel,
  duelTermine,
  jouerTourDuel,
  type CombatAction,
  type DuelFighter,
  type DuelResult
} from '../../data/duel-rules';
import type { Hero } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';
import { HeroJeuComponent } from '../hero-jeu/hero-jeu';

@Component({
  selector: 'app-duel',
  imports: [HeroJeuComponent, RouterLink],
  templateUrl: './duel.html',
  styleUrl: './duel.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuelComponent {
  private readonly firebase = inject(FirebaseService);

  readonly hero = input('');
  protected readonly heros = this.firebase.herosEnDirect;
  protected readonly armes = this.firebase.armesEnDirect;
  protected readonly premierId = signal('');
  protected readonly secondId = signal('');
  protected readonly combat = signal<DuelResult | null>(null);
  protected readonly erreur = signal('');
  protected readonly adversaireInfo = signal('');
  private queryHeroHandled = false;
  private readonly selectQueryHero = effect(() => {
    const heroes = this.heros();
    if (heroes === undefined || this.queryHeroHandled) return;
    this.queryHeroHandled = true;
    const selected = heroes.find(item => item.id === this.hero());
    if (selected) this.selectionnerHero(selected);
  });
  protected readonly combatPret = computed(
    () => !!this.premierId() && !!this.secondId() && this.premierId() !== this.secondId()
  );
  protected readonly vainqueurNom = computed(
    () => this.heros()?.find(hero => hero.id === this.combat()?.vainqueurId)?.nom ?? 'Égalité'
  );
  protected readonly fighters = computed<readonly DuelFighter[]>(
    () => this.combat()?.combattants ?? []
  );
  protected readonly termine = computed(() => {
    const current = this.combat();
    return current !== null && duelTermine(current);
  });
  protected readonly actionsRecentes = computed(() => (this.combat()?.actions ?? []).slice(-8));

  protected choisirPremier(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const hero = this.heros()?.find(item => item.id === id);
    this.premierId.set(id);
    if (hero) this.choisirAdversaireAleatoire(hero);
    else {
      this.secondId.set('');
      this.adversaireInfo.set('');
    }
  }

  private selectionnerHero(hero: Hero): void {
    this.premierId.set(hero.id);
    this.choisirAdversaireAleatoire(hero);
  }

  private choisirAdversaireAleatoire(hero: Hero): void {
    const candidates = (this.heros() ?? []).filter(item => item.id !== hero.id);
    if (!candidates.length) {
      this.secondId.set('');
      this.adversaireInfo.set('Il faut un autre héros pour jouer.');
      return;
    }
    const sameRank = candidates.filter(item => item.rang === hero.rang);
    const pool = sameRank.length ? sameRank : candidates.filter(item => {
      const closestDistance = Math.min(...candidates.map(candidate =>
        Math.abs(HERO_RANKS.indexOf(candidate.rang) - HERO_RANKS.indexOf(hero.rang))
      ));
      return Math.abs(HERO_RANKS.indexOf(item.rang) - HERO_RANKS.indexOf(hero.rang)) === closestDistance;
    });
    const opponent = pool[Math.floor(Math.random() * pool.length)];
    this.secondId.set(opponent.id);
    this.adversaireInfo.set(sameRank.length ? '' : 'Aucun rival du même rang : adversaire de rang voisin.');
  }

  protected lancerDuel(): void {
    const heroes = this.heros() ?? [];
    const first = heroes.find(hero => hero.id === this.premierId());
    const second = heroes.find(hero => hero.id === this.secondId());
    if (!first || !second || first.id === second.id) {
      this.erreur.set('Choisissez deux héros différents.');
      return;
    }
    try {
      this.combat.set(creerDuel(first, second, this.armes() ?? []));
      this.erreur.set('');
    } catch (error) {
      this.erreur.set(error instanceof Error ? error.message : 'Le duel ne peut pas commencer.');
    }
  }

  protected attaquer(): void {
    this.combat.update(current => current
      ? jouerTourDuel(current, this.armes() ?? [], Math.random)
      : current
    );
  }

  protected auto(): void {
    let current = this.combat();
    while (current && !duelTermine(current)) {
      current = jouerTourDuel(current, this.armes() ?? [], Math.random);
      this.combat.set(current);
    }
  }

  protected retirerAdversaire(): void {
    if (this.combat()) return;
    this.secondId.set('');
    this.adversaireInfo.set('');
  }

  protected nomHero(id: string): string {
    return this.heros()?.find(hero => hero.id === id)?.nom ?? 'Un héros';
  }

  protected descriptionAction(action: CombatAction): string {
    const attacker = this.nomHero(action.attaquantId);
    const defender = this.nomHero(action.cibleId);
    if (action.esquive) return `${defender} esquive l’attaque de ${attacker}.`;
    const damage = `${attacker} inflige ${action.degats} dégâts${action.critique ? ' critiques' : ''} à ${defender}.`;
    return action.soin > 0 ? `${damage} ${attacker} récupère ${Math.round(action.soin)} PV.` : damage;
  }

  protected rejouer(): void {
    this.combat.set(null);
    this.erreur.set('');
  }

}
