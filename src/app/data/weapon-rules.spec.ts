import { describe, expect, it } from 'vitest';
import { isValidWeapon } from './weapon-rules';
import type { ArmeFormValue } from './weapon';

function weapon(overrides: Partial<ArmeFormValue> = {}): ArmeFormValue {
  return {
    nom: 'Lame',
    type: 'Épée',
    rarete: 5,
    statPrincipale: 'attaque',
    bonusPrincipal: 9,
    statSecondaire: 'esquive',
    bonusSecondaire: 4,
    ...overrides
  };
}

describe('weapon rules', () => {
  it('accepts bonuses in each rarity range', () => {
    expect(isValidWeapon(weapon())).toBe(true);
    expect(isValidWeapon(weapon({
      rarete: 4,
      bonusPrincipal: 7,
      bonusSecondaire: 3
    }))).toBe(true);
    expect(isValidWeapon(weapon({
      rarete: 3,
      bonusPrincipal: 5,
      bonusSecondaire: 2
    }))).toBe(true);
  });

  it('requires two different stats and rarity-bounded positive bonuses', () => {
    expect(isValidWeapon(weapon({ statSecondaire: 'attaque' }))).toBe(false);
    expect(isValidWeapon(weapon({ bonusPrincipal: 8 }))).toBe(false);
    expect(isValidWeapon(weapon({ bonusSecondaire: 0 }))).toBe(false);
  });
});
