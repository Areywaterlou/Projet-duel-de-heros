import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { HeroDocument } from '../../data/hero';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-hero-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero-detail.html',
  styleUrl: './hero-detail.css'
})
export class HeroDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly firebaseService = inject(FirebaseService);

  protected readonly hero = signal<HeroDocument | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal('');

  ngOnInit(): void {
    void this.chargerHero();
  }

  private async chargerHero(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.erreur.set('Aucun identifiant de héros n’a été fourni.');
      this.chargement.set(false);
      return;
    }

    try {
      this.hero.set(await this.firebaseService.obtenirHero(id));
      if (!this.hero()) {
        this.erreur.set('Ce héros est introuvable.');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails du héros :', error);
      this.erreur.set('Impossible de charger les détails du héros.');
    } finally {
      this.chargement.set(false);
    }
  }
}
