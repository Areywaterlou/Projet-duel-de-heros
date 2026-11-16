import { COMBAT_RULES, HERO_STATS } from './game-constants';
import { heroStatTotal } from './hero-display';
import type { Hero, HeroStat } from './hero';
import type { Arme } from './weapon';

export interface DuelFighter {
  hero: Hero;
  pvActuels: number;
  pvMax: number;
}

export interface CombatAction {
  attaquantId: string;
  cibleId: string;
  esquive: boolean;
  critique: boolean;
  degats: number;
  soin: number;
}

export interface DuelResult {
  combattants: [DuelFighter, DuelFighter];
  actions: CombatAction[];
  tours: number;
  vainqueurId: string | null;
  termineParLimite: boolean;
}

export function creerDuel(
  firstHero: Hero,
  secondHero: Hero,
  armes: readonly Arme[]
): DuelResult {
  return {
    combattants: [
      createDuelFighter(firstHero, armes),
      createDuelFighter(secondHero, armes)
    ],
    actions: [],
    tours: 0,
    vainqueurId: null,
    termineParLimite: false
  };
}

export function duelTermine(result: DuelResult): boolean {
  return result.vainqueurId !== null || result.termineParLimite;
}

export function jouerTourDuel(
  current: DuelResult,
  armes: readonly Arme[],
  rng: () => number
): DuelResult {
  if (duelTermine(current)) return current;

  const fighters: [DuelFighter, DuelFighter] = [...current.combattants];
  const actions = [...current.actions];
  for (let index = 0; index < 2; index++) {
    if (fighters.some(fighter => fighter.pvActuels <= 0)) break;
    const targetIndex = 1 - index;
    const tour = current.tours + 1;
    const result = attaqueCombat(fighters[index], fighters[targetIndex], armes, rng, tour);
    fighters[index] = result.attaquant;
    fighters[targetIndex] = result.defenseur;
    const healing = soignerApresTour(fighters[index], armes, tour);
    fighters[index] = healing.fighter;
    actions.push({ ...result.action, soin: healing.soin });
  }

  const tours = current.tours + 1;
  const termineParLimite = tours >= COMBAT_RULES.maxTurns &&
    fighters.every(fighter => fighter.pvActuels > 0);
  const knockout = fighters.some(fighter => fighter.pvActuels <= 0);
  return {
    combattants: fighters,
    actions,
    tours,
    vainqueurId: knockout || termineParLimite ? determineWinner(fighters) : null,
    termineParLimite
  };
}

export function createDuelFighter(hero: Hero, armes: readonly Arme[]): DuelFighter {
  if (!HERO_STATS.every(stat => Number.isInteger(heroStatTotal(hero, stat, armes)))) {
    throw new Error(`Les caractéristiques de ${hero.nom} sont invalides.`);
  }
  const pvMax = COMBAT_RULES.baseHp + COMBAT_RULES.hpPerPoint * statTotal(hero, 'pv', armes);
  return { hero, pvActuels: pvMax, pvMax };
}

export function attaqueCombat(
  attaquant: DuelFighter,
  defenseur: DuelFighter,
  armes: readonly Arme[],
  rng: () => number,
  tour = 1
): { attaquant: DuelFighter; defenseur: DuelFighter; action: CombatAction } {
  if (rng() * 100 >= chanceDeToucher(attaquant, defenseur, armes)) {
    return {
      attaquant,
      defenseur,
      action: {
        attaquantId: attaquant.hero.id,
        cibleId: defenseur.hero.id,
        esquive: true,
        critique: false,
        degats: 0,
        soin: 0
      }
    };
  }

  const variation = 1 + (rng() * 2 - 1) * COMBAT_RULES.damageVariation;
  const critique = rng() < attaquant.hero.tauxCritique / 100;
  const baseDamage = COMBAT_RULES.damagePerAttackPoint * statTotal(attaquant.hero, 'attaque', armes);
  const critDamage = critique ? baseDamage * attaquant.hero.degatsCritiques / 100 : baseDamage;
  const defense = statTotal(defenseur.hero, 'defense', armes);
  const mitigation = defense / (defense + COMBAT_RULES.defenseReductionBase);
  const fatigue = Math.max(0, tour - COMBAT_RULES.fatigueStartTurn);
  const fatigueDamage = 1 + fatigue * COMBAT_RULES.fatigueDamagePerTurn;
  const damage = Math.max(1, Math.round(critDamage * variation * (1 - mitigation) * fatigueDamage));
  const updatedDefender = { ...defenseur, pvActuels: Math.max(0, defenseur.pvActuels - damage) };
  return {
    attaquant,
    defenseur: updatedDefender,
    action: {
      attaquantId: attaquant.hero.id,
      cibleId: defenseur.hero.id,
      esquive: false,
      critique,
      degats: damage,
      soin: 0
    }
  };
}

export function chanceDeToucher(
  attaquant: DuelFighter,
  defenseur: DuelFighter,
  armes: readonly Arme[]
): number {
  const attack = statTotal(attaquant.hero, 'attaque', armes);
  const evasion = statTotal(defenseur.hero, 'esquive', armes);
  return Math.min(
    COMBAT_RULES.maxHitChancePercent,
    Math.max(
      COMBAT_RULES.minHitChancePercent,
      COMBAT_RULES.hitChanceBasePercent +
        (attack - evasion) * COMBAT_RULES.hitChancePerPointDifference
    )
  );
}

export function soignerApresTour(
  fighter: DuelFighter,
  armes: readonly Arme[],
  tour = 1
): { fighter: DuelFighter; soin: number } {
  const fatigue = Math.max(0, tour - COMBAT_RULES.fatigueStartTurn);
  const fatigueHealing = Math.max(0, 1 - fatigue * COMBAT_RULES.fatigueHealReductionPerTurn);
  const requestedHealing = Math.min(
    statTotal(fighter.hero, 'soin', armes),
    COMBAT_RULES.maxHealPercent
  ) / 100 * fighter.pvMax * fatigueHealing;
  const soin = Math.min(requestedHealing, fighter.pvMax - fighter.pvActuels);
  return {
    fighter: { ...fighter, pvActuels: Math.min(fighter.pvMax, fighter.pvActuels + soin) },
    soin
  };
}

export function simulerDuel(
  firstHero: Hero,
  secondHero: Hero,
  armes: readonly Arme[],
  rng: () => number
): DuelResult {
  let result = creerDuel(firstHero, secondHero, armes);
  while (!duelTermine(result)) result = jouerTourDuel(result, armes, rng);
  return result;
}

function determineWinner(fighters: [DuelFighter, DuelFighter]): string | null {
  const [first, second] = fighters;
  if (first.pvActuels <= 0) return second.hero.id;
  if (second.pvActuels <= 0) return first.hero.id;
  if (first.pvActuels / first.pvMax === second.pvActuels / second.pvMax) return null;
  return first.pvActuels / first.pvMax > second.pvActuels / second.pvMax
    ? first.hero.id
    : second.hero.id;
}

function statTotal(hero: Hero, stat: HeroStat, armes: readonly Arme[]): number {
  return heroStatTotal(hero, stat, armes);
}
