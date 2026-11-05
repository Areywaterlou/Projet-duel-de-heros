import { Component, OnInit,inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroInterface } from '../../data/heroInterface';
import { HeroService } from '../../services/hero-service';
import { MessageService } from '../../services/message-service';
import { HeroEditComponent } from '../hero-edit-component/hero-edit-component';

@Component({
  selector: 'app-heroes-component',
  imports: [RouterLink, HeroEditComponent],
  styleUrl: './heroes-component.css',
  templateUrl: './heroes-component.html',
})
export class HeroesComponent implements OnInit {
  private heroService = inject(HeroService);
  private messageService = inject(MessageService);

  title = 'Mes héros';
  heroesModel = signal<HeroInterface[]>([]);
  selectedHeroModel = signal<HeroInterface | null>(null);

  ngOnInit(): void {
    this.heroService.getHeroes().subscribe((heroes) => this.heroesModel.set(heroes));
  }

  onSelect(hero: HeroInterface): void {
    this.selectedHeroModel.set(hero);
    this.messageService.add(`Sélection : Héros "${hero.name}"`);
  }

  protected onHeroChange(updatedHero: HeroInterface): void {
    this.heroService.updateHero(updatedHero).subscribe(() => {
      this.heroesModel.update((heroes) =>
        heroes.map((hero) => (hero.id === updatedHero.id ? updatedHero : hero)),
      );
      this.selectedHeroModel.set(updatedHero);
    });
  }
}