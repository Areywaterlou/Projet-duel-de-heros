import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Location, UpperCasePipe, DatePipe } from '@angular/common';
import { map, switchMap } from 'rxjs';
import { HeroInterface } from '../../data/heroInterface';
import { HeroService } from '../../services/hero-service';

@Component({
  selector: 'app-hero-detail',
  imports: [UpperCasePipe, DatePipe],
  templateUrl: './hero-detail-component.html',
  styleUrl: './hero-detail-component.css',
})
export class HeroDetailComponent {
  private route = inject(ActivatedRoute);
  private heroService = inject(HeroService);
  private location = inject(Location);

  hero = signal<HeroInterface | undefined>(undefined);

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        switchMap((id) => this.heroService.getHero(id)),
        takeUntilDestroyed(),
      )
      .subscribe((hero) => this.hero.set(hero));
  }

  goBack(): void {
    this.location.back();
  }
}