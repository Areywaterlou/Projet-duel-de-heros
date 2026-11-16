import { describe, expect, it } from 'vitest';
import {
  attaqueCombat,
  creerDuel,
  createDuelFighter,
  jouerTourDuel,
  simulerDuel,
  soignerApresTour
} from './duel-rules';
import type { Hero } from './hero';

function hero(id: string, overrides: Partial<Hero> = {}): Hero {
  return {
    id,
    nom: id,
    archetype: 'Équilibré',
    classe: 'Épée',
    attaque: 10,
    defense: 5,
    pv: 5,
    soin: 1,
    esquive: 1,
    tauxCritique: 40,
    degatsCritiques: 180,
    talents: [],
    armeId: null,
    rang: 'D',
    ...overrides
  };
}

describe('combat rules', () => {
  it('creates max HP using the configured PV formula', () => {
    expect(createDuelFighter(hero('one'), []).pvMax).toBe(350);
  });

  it('uses the bounded attack-versus-evasion hit chance', () => {
    const attacker = createDuelFighter(hero('one'), []);
    const dodger = createDuelFighter(hero('two', { esquive: 20 }), []);
    const action = attaqueCombat(attacker, dodger, [], () => 0.99);
    expect(action.action.esquive).toBe(true);
    expect(action.defenseur.pvActuels).toBe(dodger.pvMax);
  });

  it('applies random damage, criticals, and defense with injected RNG', () => {
    const attacker = createDuelFighter(hero('one', {
      attaque: 20,
      tauxCritique: 80,
      degatsCritiques: 230
    }), []);
    const defender = createDuelFighter(hero('two', { defense: 10, esquive: 1 }), []);
    const result = attaqueCombat(attacker, defender, [], () => 0.5);
    expect(result.action.critique).toBe(true);
    expect(result.action.degats).toBeGreaterThan(0);
    expect(result.defenseur.pvActuels).toBeLessThan(defender.pvMax);
  });

  it('reduces healing after fatigue begins and caps it by missing HP', () => {
    const fighter = createDuelFighter(hero('one', { soin: 20 }), []);
    const wounded = { ...fighter, pvActuels: fighter.pvMax - 100 };
    const result = soignerApresTour(wounded, [], 11);
    expect(result.soin).toBeCloseTo(fighter.pvMax * 0.024, 10);
    expect(result.fighter.pvActuels).toBe(wounded.pvActuels + result.soin);
  });

  it('increases damage progressively after the fatigue turn', () => {
    const attacker = createDuelFighter(hero('one', { attaque: 15 }), []);
    const defender = createDuelFighter(hero('two', { esquive: 1 }), []);
    const normal = attaqueCombat(attacker, defender, [], () => 0.5, 10);
    const fatigued = attaqueCombat(attacker, defender, [], () => 0.5, 11);
    expect(fatigued.action.degats).toBeGreaterThan(normal.action.degats);
  });

  it('resolves a player turn and the automatic opponent reply', () => {
    const initial = creerDuel(hero('player'), hero('opponent'), []);
    const result = jouerTourDuel(initial, [], () => 0.99);
    expect(result.tours).toBe(1);
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0].attaquantId).toBe('player');
    expect(result.actions[1].attaquantId).toBe('opponent');
  });

  it('finishes at the turn limit and selects the higher remaining health percentage', () => {
    const result = simulerDuel(
      hero('one', { attaque: 1, defense: 20, pv: 20, soin: 20, esquive: 20 }),
      hero('two', { attaque: 1, defense: 20, pv: 20, soin: 20, esquive: 20 }),
      [],
      (() => {
        const values = [0.1, 0.99, 0.99, 0.99];
        let index = 0;
        return () => values[index++ % values.length];
      })()
    );
    expect(result.tours).toBe(40);
    expect(result.termineParLimite).toBe(true);
    expect(result.vainqueurId).toBe('one');
  });

  it('ends immediately when a combatant reaches zero HP', () => {
    const result = simulerDuel(
      hero('one', { attaque: 20, defense: 1, tauxCritique: 80 }),
      hero('two', { defense: 1, pv: 1, soin: 1, esquive: 1 }),
      [],
      () => 0.5
    );
    expect(result.vainqueurId).toBe('one');
    expect(result.combattants[1].pvActuels).toBe(0);
  });
});
