import { Service, inject } from '@angular/core';
import { HeroInterface } from '../data/heroInterface';
import { HEROES } from '../data/mock-heroes';
import { Observable, of } from 'rxjs';
import { MessageService } from './message-service';

@Service()
export class HeroService {
  private messageService = inject(MessageService);

  getHeroes(): Observable<HeroInterface[]> {
    const heroes: Observable<HeroInterface[]> = new Observable((observer) => {
      observer.next(HEROES.slice(0, 2));
      setTimeout(() => {
        observer.next(HEROES);
        observer.complete();
      });
    });

    this.messageService.add('Héros récupérés avec succès');
    return heroes;
  }

  getHero(id: number): Observable<HeroInterface | undefined> {
    const hero = HEROES.find((h) => h.id === id);
    this.messageService.add(`HeroService: fetched hero id=${id}`);
    return of(hero);
  }

  updateHero(updated: HeroInterface): Observable<HeroInterface> {
    const index = HEROES.findIndex((h) => h.id === updated.id);
    if (index !== -1) {
      HEROES[index] = updated;
    }
    this.messageService.add(`HeroService: updated hero id=${updated.id}`);
    return of(updated);
  }
}   