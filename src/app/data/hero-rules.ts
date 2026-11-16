import { max, maxLength, min, required, schema, validate } from '@angular/forms/signals';
import type { Hero, HeroFormValue } from './hero';
import { HERO_ARCHETYPES, HERO_RULES, HERO_STATS } from './game-constants';
export { HERO_RULES } from './game-constants';

export function heroTotalPoints(hero: Pick<Hero, typeof HERO_STATS[number]>): number {
  return HERO_STATS.reduce((total, stat) => total + hero[stat], 0);
}

export function heroPointsRemaining(hero: Pick<Hero, typeof HERO_STATS[number]>): number {
  return HERO_RULES.maxTotalPoints - heroTotalPoints(hero);
}

export function isValidHeroStats(hero: Pick<Hero, typeof HERO_STATS[number]>): boolean {
  const total = heroTotalPoints(hero);
  return HERO_STATS.every(stat =>
    Number.isInteger(hero[stat]) &&
    hero[stat] >= HERO_RULES.minStat &&
    hero[stat] <= HERO_RULES.maxStatPoints
  ) && total >= HERO_RULES.minTotalPoints && total <= HERO_RULES.maxTotalPoints;
}

export function isHeroBaseStatsComplete(
  hero: Partial<Pick<Hero, typeof HERO_STATS[number]>> | null | undefined
): hero is Pick<Hero, typeof HERO_STATS[number]> {
  return !!hero && HERO_STATS.every(stat => typeof hero[stat] === 'number') &&
    isValidHeroStats(hero as Pick<Hero, typeof HERO_STATS[number]>);
}

export function createHeroFormSchema(): ReturnType<typeof schema<HeroFormValue>> {
  return schema<HeroFormValue>(path => {
    required(path.nom);
    maxLength(path.nom, 60);
    required(path.archetype);
    required(path.classe);
    for (const stat of HERO_STATS) {
      required(path[stat]);
      min(path[stat], HERO_RULES.minStat);
      max(path[stat], HERO_RULES.maxStatPoints);
    }

    validate(path, ({ value }) => {
      const hero = value();
      const total = HERO_STATS.reduce((sum, stat) => sum + hero[stat], 0);
      if (!HERO_ARCHETYPES.some(archetype => archetype === hero.archetype)) {
        return { kind: 'hero-archetype', message: 'Choisissez un archétype valide.' };
      }
      if (!HERO_STATS.every(stat => Number.isInteger(hero[stat]))) {
        return { kind: 'hero-stats-integer', message: 'Les caractéristiques doivent être des entiers.' };
      }
      if (total < HERO_RULES.minTotalPoints || total > HERO_RULES.maxTotalPoints) {
        return { kind: 'hero-points-budget', message: 'Le total doit être compris entre 10 et 40 points.' };
      }
      return undefined;
    });
  });
}

export const heroFormSchema = createHeroFormSchema();
