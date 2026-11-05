import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, min, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import type { HeroFormValue } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-hero-form',
  imports: [FormField],
  templateUrl: './hero-form.html',
  styleUrl: './hero-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroFormComponent {
  private readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  protected readonly enregistrement = signal(false);
  protected readonly erreur = signal('');

  protected readonly model = signal<HeroFormValue>({
    nom: '',
    pointsDeVie: 1,
    attaque: 0,
    defense: 0,
    classe: '',
    rang: 'C'
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

  protected async soumettre(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.erreur.set('');

    this.formulaire().markAsTouched();
    if (!this.formulaire().valid()) {
      return;
    }

    this.enregistrement.set(true);

    try {
      const id = await this.firebaseService.ajouterHero(this.model());
      this.model.set({
        nom: '',
        pointsDeVie: 1,
        attaque: 0,
        defense: 0,
        classe: '',
        rang: 'C'
      });
      await this.router.navigate(['/heros', id]);
    } catch (error) {
      console.error('Erreur lors de l’enregistrement du héros :', error);
      this.erreur.set('L’enregistrement a échoué. Vérifiez votre connexion et les règles Firestore.');
    } finally {
      this.enregistrement.set(false);
    }
  }
}
