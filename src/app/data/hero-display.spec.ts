import { describe, expect, it } from 'vitest';
import { heroStatBreakdown, heroStatTotal } from './hero-display';
import type { Hero } from './hero';
import type { Arme } from './weapon';

const hero: Hero = {
  id: 'hero',
  nom: 'Résonateur',
  archetype: 'Équilibré',
  classe: 'Épée',
  attaque: 10,
  defense: 8,
  pv: 10,
  soin: 6,
  esquive: 6,
  tauxCritique: 60,
  degatsCritiques: 205,
  talents: [{ stat: 'attaque', valeur: 3 }, { stat: 'attaque', valeur: 2 }],
  armeId: 'weapon',
  rang: 'S'
};

const weapon: Arme = {
  id: 'weapon',
  nom: 'Lame',
  type: 'Épée',
  rarete: 5,
  rang: 'S',
  statPrincipale: 'attaque',
  bonusPrincipal: 10,
  statSecondaire: 'esquive',
  bonusSecondaire: 4
};

describe('hero final stats', () => {
  it('combines base, weapon, and all matching talent bonuses', () => {
    expect(heroStatBreakdown(hero, 'attaque', [weapon])).toEqual({
      base: 10,
      arme: 10,
      talent: 5,
      archetype: 1,
      total: 26
    });
    expect(heroStatTotal(hero, 'esquive', [weapon])).toBe(11);
  });
});
