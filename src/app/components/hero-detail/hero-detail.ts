import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { HERO_ARCHETYPES, HERO_STATS } from '../../data/game-constants';
import type { Hero, HeroFormValue, HeroStat } from '../../data/hero';
import { heroPointsRemaining, heroTotalPoints, isHeroBaseStatsComplete, createHeroFormSchema } from '../../data/hero-rules';
import { rangDepuisPoints } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';
import { NotificationService } from '../../services/notification.service';

function heroFormValue(hero: Hero): HeroFormValue {
  return {
    nom: hero.nom,
    archetype: hero.archetype,
    classe: hero.classe ?? '',
    attaque: hero.attaque,
    defense: hero.defense,
    pv: hero.pv,
    soin: hero.soin,
    esquive: hero.esquive,
    armeId: hero.armeId ?? ''
  };
}

@Component({
  selector: 'app-hero-detail-page',
  imports: [FormField, RouterLink],
  templateUrl: './hero-detail.html',
  styleUrl: './hero-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseService);
  private readonly notifications = inject(NotificationService);
  private readonly heroId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') }
  );

  protected readonly heros = this.firebaseService.herosEnDirect;
  protected readonly armes = this.firebaseService.armesEnDirect;
  protected readonly erreurArmes = this.firebaseService.erreurArmesEnDirect;
  protected readonly typesArme = ['Épée', 'Épée lourde', 'Pistolets', 'Gantelets', 'Rectifieur'] as const;
  protected readonly archetypes = HERO_ARCHETYPES;
  protected readonly stats = HERO_STATS;
  protected readonly statLabels: Record<HeroStat, string> = {
    attaque: 'Attaque',
    defense: 'Défense',
    pv: 'Points de vie',
    soin: 'Soin',
    esquive: 'Esquive'
  };
  protected readonly hero = computed(() => this.heros()?.find(item => item.id === this.heroId()) ?? null);
  protected readonly chargementHero = computed(() => this.heros() === undefined);
  protected readonly baseStatsDisponibles = computed(() => isHeroBaseStatsComplete(this.hero()));
  protected readonly model = signal<HeroFormValue>({
    nom: '',
    archetype: 'Équilibré',
    classe: '',
    attaque: 2,
    defense: 2,
    pv: 2,
    soin: 2,
    esquive: 2,
    armeId: ''
  });
  protected readonly formulaire = form(this.model, createHeroFormSchema());
  private lastModelHeroId: string | null = null;
  private readonly synchronizeForm = effect(() => {
    const hero = this.hero();
    if (!hero) return;
    const next = heroFormValue(hero);
    if (this.lastModelHeroId !== hero.id) {
      this.lastModelHeroId = hero.id;
      this.model.set(next);
    } else if (!this.formulaire().dirty() && JSON.stringify(this.model()) !== JSON.stringify(next)) {
      this.model.set(next);
    }
  });
  protected readonly totalPoints = computed(() => heroTotalPoints(this.model()));
  protected readonly pointsRestants = computed(() => heroPointsRemaining(this.model()));
  protected readonly rang = computed(() => rangDepuisPoints(this.totalPoints()));
  protected readonly enregistrement = signal(false);
  protected readonly suppression = signal(false);
  protected readonly erreur = signal('');
  protected readonly succes = signal('');
  protected readonly erreurHeros = this.firebaseService.erreurHerosEnDirect;
  protected readonly messageErreurChargement = computed(() => {
    if (this.erreurHeros()) return 'Impossible de charger ce héros.';
    if (!this.chargementHero() && this.hero() === null) return 'Ce héros est introuvable.';
    return '';
  });

  protected changerStat(stat: HeroStat, delta: number): void {
    this.model.update(hero => ({ ...hero, [stat]: Math.min(20, Math.max(1, hero[stat] + delta)) }));
  }

  protected async enregistrer(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.erreur.set('');
    this.succes.set('');
    this.formulaire().markAsTouched();
    const id = this.heroId();
    if (!id || !this.formulaire().valid()) return;
    this.enregistrement.set(true);
    try {
      await this.firebaseService.modifierHero(id, this.model());
      const nom = this.model().nom.trim();
      this.succes.set('Modifications enregistrées.');
      this.notifications.success(`Héros ${nom} mis à jour`);
    } catch (error) {
      console.error('Erreur lors de la modification du héros :', error);
      this.erreur.set(error instanceof Error ? error.message : 'La modification a échoué.');
    } finally {
      this.enregistrement.set(false);
    }
  }

  protected async supprimer(): Promise<void> {
    const hero = this.hero();
    if (!hero || !window.confirm(`Supprimer définitivement ${hero.nom} ?`)) return;
    this.erreur.set('');
    this.suppression.set(true);
    try {
      await this.firebaseService.supprimerHero(hero.id);
      this.notifications.success(`Héros ${hero.nom} supprimé`);
      await this.router.navigateByUrl('/tier-list');
    } catch (error) {
      console.error('Erreur lors de la suppression du héros :', error);
      this.erreur.set('La suppression a échoué.');
    } finally {
      this.suppression.set(false);
    }
  }
}
