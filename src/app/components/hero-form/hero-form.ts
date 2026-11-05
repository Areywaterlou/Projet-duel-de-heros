import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import type { Hero, HeroRank } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-hero-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hero-form.html',
  styleUrl: './hero-form.css'
})
export class HeroFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  protected readonly enregistrement = signal(false);
  protected readonly erreur = signal('');

  protected readonly formulaire = this.formBuilder.nonNullable.group({
    nom: ['', [Validators.required, Validators.maxLength(60)]],
    pointsDeVie: [0, [Validators.required, Validators.min(1)]],
    attaque: [0, [Validators.required, Validators.min(0)]],
    defense: [0, [Validators.required, Validators.min(0)]],
    classe: ['', [Validators.required, Validators.maxLength(40)]],
    rang: ['C' as HeroRank, Validators.required]
  });

  protected async soumettre(): Promise<void> {
    this.erreur.set('');

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enregistrement.set(true);
    const hero: Hero = this.formulaire.getRawValue();

    try {
      await this.firebaseService.ajouterHero(hero);
      this.formulaire.reset({
        nom: '',
        pointsDeVie: 0,
        attaque: 0,
        defense: 0,
        classe: '',
        rang: 'C'
      });
      await this.router.navigateByUrl('/tier-list');
    } catch (error) {
      console.error('Erreur lors de l’enregistrement du héros :', error);
      this.erreur.set('L’enregistrement a échoué. Vérifiez votre connexion et les règles Firestore.');
    } finally {
      this.enregistrement.set(false);
    }
  }
}
