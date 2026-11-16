import { describe, expect, it } from 'vitest';
import { HERO_STATS } from './game-constants';
import { rangDepuisPoints, tirerCritiques } from './hero';
import { heroTotalPoints, isValidHeroStats } from './hero-rules';

describe('hero point rules', () => {
  it('calculates all rank thresholds from the point total', () => {
    expect([rangDepuisPoints(40), rangDepuisPoints(30), rangDepuisPoints(20), rangDepuisPoints(15), rangDepuisPoints(14)])
      .toEqual(['S', 'A', 'B', 'C', 'D']);
  });

  it('accepts 10..40 points with each stat between 1 and 20', () => {
    expect(isValidHeroStats({ attaque: 14, defense: 6, pv: 9, soin: 3, esquive: 8 })).toBe(true);
    expect(isValidHeroStats({ attaque: 1, defense: 1, pv: 1, soin: 1, esquive: 6 })).toBe(true);
    expect(isValidHeroStats({ attaque: 20, defense: 20, pv: 1, soin: 1, esquive: 1 })).toBe(false);
    expect(isValidHeroStats({ attaque: 21, defense: 1, pv: 1, soin: 1, esquive: 1 })).toBe(false);
    expect(isValidHeroStats({ attaque: 1, defense: 1, pv: 1, soin: 1, esquive: 1 })).toBe(false);
  });

  it('calculates the total using the canonical stat list', () => {
    expect(heroTotalPoints({ attaque: 14, defense: 6, pv: 9, soin: 3, esquive: 8 })).toBe(40);
    expect(HERO_STATS).toHaveLength(5);
  });

  it('draws integer critical stats within inclusive ranges using an injected RNG', () => {
    expect(tirerCritiques(() => 0)).toEqual({ tauxCritique: 40, degatsCritiques: 180 });
    expect(tirerCritiques(() => 0.999999)).toEqual({ tauxCritique: 80, degatsCritiques: 230 });
  });

  it('rejects invalid random values', () => {
    expect(() => tirerCritiques(() => 1)).toThrow(RangeError);
  });
});
