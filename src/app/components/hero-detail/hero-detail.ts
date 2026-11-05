import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  resource,
  signal
} from '@angular/core';
import { FormField, form, maxLength, min, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import type { HeroFormValue } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';

const EMPTY_HERO: HeroFormValue = {
  nom: '',
  pointsDeVie: 1,
  attaque: 0,
  defense: 0,
  classe: '',
  rang: 'C'
};

@Component({
  selector: 'app-hero-detail-page',
  imports: [FormField, RouterLink],
  templateUrl: './hero-detail.html',
  styleUrl: './hero-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseService);

  private readonly heroId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') }
  );

  protected readonly hero = resource({
    params: () => this.heroId() ?? undefined,
    loader: ({ params: id }) => this.firebaseService.obtenirHero(id)
  });
  protected readonly model = linkedSignal(() => {
    const hero = this.hero.value();
    return hero
      ? {
          nom: hero.nom,
          pointsDeVie: hero.pointsDeVie,
          attaque: hero.attaque,
          defense: hero.defense,
          classe: hero.classe,
          rang: hero.rang
        }
      : { ...EMPTY_HERO };
  });
  protected readonly formulaire = form(this.model, path => {
    required(path.nom);
    maxLength(path.nom, 60);
    required(path.pointsDeVie);
    min(path.pointsDeVie, 1);
    required(path.attaque);
    min(path.attaque, 0);
    required(path.defense);
    min(path.defense, 0);
    required(path.classe);
    maxLength(path.classe, 40);
    required(path.rang);
  });

  protected readonly enregistrement = signal(false);
  protected readonly suppression = signal(false);
  protected readonly erreur = signal('');
  protected readonly succes = signal('');

  protected readonly messageErreurChargement = computed(() => {
    if (this.hero.error()) {
      return 'Impossible de charger ce héros depuis Firestore.';
    }
    if (this.hero.value() === null) {
      return 'Ce héros est introuvable.';
    }
    return '';
  });

  protected async enregistrer(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.erreur.set('');
    this.succes.set('');
    this.formulaire().markAsTouched();

    const id = this.heroId();
    if (!id || !this.formulaire().valid()) {
      return;
    }

    this.enregistrement.set(true);
    try {
      await this.firebaseService.modifierHero(id, this.model());
      this.succes.set('Les modifications ont été enregistrées.');
      this.hero.reload();
    } catch (error) {
      console.error('Erreur lors de la modification du héros :', error);
      this.erreur.set('La modification a échoué. Vérifiez les règles Firestore.');
    } finally {
      this.enregistrement.set(false);
    }
  }

  protected async supprimer(): Promise<void> {
    const hero = this.hero.value();
    if (!hero || !window.confirm(`Supprimer définitivement ${hero.nom} ?`)) {
      return;
    }

    this.erreur.set('');
    this.succes.set('');
    this.suppression.set(true);
    try {
      await this.firebaseService.supprimerHero(hero.id);
      await this.router.navigateByUrl('/tier-list');
    } catch (error) {
      console.error('Erreur lors de la suppression du héros :', error);
      this.erreur.set('La suppression a échoué. Vérifiez les règles Firestore.');
    } finally {
      this.suppression.set(false);
    }
  }
}
