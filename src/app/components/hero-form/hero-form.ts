import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { HERO_ARCHETYPES, HERO_STATS } from '../../data/game-constants';
import { rangDepuisPoints, tirerCritiques, type HeroCrits, type HeroFormValue, type HeroStat } from '../../data/hero';
import { createHeroFormSchema, heroPointsRemaining, heroTotalPoints } from '../../data/hero-rules';
import { FirebaseService } from '../../services/firebase.service';
import { NotificationService } from '../../services/notification.service';

const EMPTY_HERO: HeroFormValue = {
  nom: '',
  archetype: 'Équilibré',
  classe: '',
  attaque: 2,
  defense: 2,
  pv: 2,
  soin: 2,
  esquive: 2,
  armeId: ''
};

@Component({
  selector: 'app-hero-form',
  imports: [FormField],
  templateUrl: './hero-form.html',
  styleUrl: './hero-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroFormComponent {
  private readonly firebaseService = inject(FirebaseService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly enregistrement = signal(false);
  protected readonly erreur = signal('');
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
  protected readonly model = signal<HeroFormValue>({ ...EMPTY_HERO });
  protected readonly armes = this.firebaseService.armesEnDirect;
  protected readonly erreurArmes = this.firebaseService.erreurArmesEnDirect;
  protected readonly formulaire = form(this.model, createHeroFormSchema());
  protected readonly totalPoints = computed(() => heroTotalPoints(this.model()));
  protected readonly pointsRestants = computed(() => heroPointsRemaining(this.model()));
  protected readonly rang = computed(() => rangDepuisPoints(this.totalPoints()));
  protected readonly filtreTypeArme = signal('');
  protected readonly armesFiltrees = computed(() => (this.armes() ?? []).filter(arme =>
    !this.filtreTypeArme() || arme.type === this.filtreTypeArme()
  ));
  protected readonly critiques = signal<HeroCrits | null>(null);

  protected changerStat(stat: HeroStat, delta: number): void {
    this.model.update(hero => ({
      ...hero,
      [stat]: Math.min(20, Math.max(1, hero[stat] + delta))
    }));
  }

  protected changerFiltreType(event: Event): void {
    this.filtreTypeArme.set((event.target as HTMLSelectElement).value);
  }

  protected tirerCritiquesUneFois(): void {
    if (!this.critiques()) this.critiques.set(tirerCritiques(Math.random));
  }

  protected async soumettre(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.erreur.set('');
    this.formulaire().markAsTouched();
    if (!this.formulaire().valid()) return;

    this.enregistrement.set(true);
    try {
      const id = await this.firebaseService.ajouterHero(this.model(), this.critiques() ?? undefined);
      this.notifications.success(`Héros ${this.model().nom.trim()} ajouté avec succès`);
      this.model.set({ ...EMPTY_HERO });
      this.critiques.set(null);
      await this.router.navigate(['/heros', id]);
    } catch (error) {
      console.error('Erreur lors de l’enregistrement du héros :', error);
      this.erreur.set(error instanceof Error ? error.message : 'L’enregistrement a échoué.');
    } finally {
      this.enregistrement.set(false);
    }
  }
}
