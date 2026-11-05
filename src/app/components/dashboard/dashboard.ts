import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CLASSES_ORDRE, HeroInterface } from '../../data/heroInterface';
import { HeroService } from '../../services/hero-service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private heroService = inject(HeroService);

  heroes = signal<HeroInterface[]>([]);

  // Une ligne par classe, de SS+ (en haut) à F (en bas)
  tiers = computed(() =>
    [...CLASSES_ORDRE].reverse().map((classe) => ({
      classe,
      heroes: this.heroes()
        .filter((hero) => hero.classe === classe)
        .sort((a, b) => a.id - b.id),
    })),
  );

  ngOnInit(): void {
    this.heroService.getHeroes().subscribe((heroes) => this.heroes.set(heroes));
  }
}