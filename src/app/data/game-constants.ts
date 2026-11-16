export const HERO_RANKS = ['S', 'A', 'B', 'C', 'D'] as const;
export const HERO_WEAPONS = [
  'Épée',
  'Épée lourde',
  'Pistolets',
  'Gantelets',
  'Rectifieur'
] as const;
export const HERO_STATS = ['attaque', 'defense', 'pv', 'soin', 'esquive'] as const;
export const HERO_BASE_STATS = HERO_STATS;
export const WEAPON_RARITIES = [3, 4, 5] as const;

export const HERO_RULES = {
  minStat: 1,
  minTotalPoints: 10,
  maxTotalPoints: 40,
  maxStatPoints: 20,
  minCritRate: 40,
  maxCritRate: 80,
  minCritDamage: 180,
  maxCritDamage: 230,
  minTalentBonus: 2,
  maxTalentBonus: 5
} as const;

export const WEAPON_RULES = {
  bonusesByRarity: {
    3: { primary: { min: 5, max: 6 }, secondary: { min: 2, max: 3 } },
    4: { primary: { min: 7, max: 8 }, secondary: { min: 3, max: 4 } },
    5: { primary: { min: 9, max: 10 }, secondary: { min: 4, max: 5 } }
  }
} as const;

export const COMBAT_RULES = {
  baseHp: 150,
  hpPerPoint: 40,
  damagePerAttackPoint: 6,
  damageVariation: 0.1,
  defenseReductionBase: 39,
  hitChanceBasePercent: 50,
  hitChancePerPointDifference: 2.5,
  minHitChancePercent: 25,
  maxHitChancePercent: 90,
  maxHealPercent: 6,
  fatigueStartTurn: 8,
  fatigueDamagePerTurn: 0.1,
  fatigueHealReductionPerTurn: 0.2,
  maxTurns: 40
} as const;

export const RANK_THRESHOLDS = {
  S: 40,
  A: 30,
  B: 20,
  C: 15
} as const;

export const HERO_RARITY: Record<typeof HERO_RANKS[number], number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1
};

export const HERO_ARCHETYPES = ['Attaquant', 'Tank', 'Soutien', 'Rapide', 'Équilibré'] as const;

export const ARCHETYPE_CRITICS = {
  Attaquant: { tauxCritique: 55, degatsCritiques: 190 },
  Tank: { tauxCritique: 60, degatsCritiques: 195 },
  Soutien: { tauxCritique: 60, degatsCritiques: 195 },
  Rapide: { tauxCritique: 60, degatsCritiques: 195 },
  Équilibré: { tauxCritique: 58, degatsCritiques: 195 }
} as const;

export const ARCHETYPE_TALENTS = {
  Attaquant: [{ stat: 'attaque', valeur: 2 }],
  Tank: [{ stat: 'attaque', valeur: 2 }, { stat: 'defense', valeur: 2 }],
  Soutien: [{ stat: 'attaque', valeur: 3 }, { stat: 'soin', valeur: 2 }],
  Rapide: [{ stat: 'esquive', valeur: 2 }, { stat: 'attaque', valeur: 2 }],
  Équilibré: [{ stat: 'attaque', valeur: 2 }, { stat: 'defense', valeur: 2 }]
} as const;

export const ARCHETYPE_STAT_BONUS_PERCENT: Record<
  typeof HERO_ARCHETYPES[number],
  Partial<Record<typeof HERO_STATS[number], number>>
> = {
  Attaquant: { attaque: 12 },
  Tank: { attaque: 10, defense: 8, pv: 5 },
  Soutien: { attaque: 8, defense: 5, pv: 8, soin: 10 },
  Rapide: { attaque: 5, esquive: 10 },
  Équilibré: { attaque: 5, defense: 5, pv: 5, soin: 5, esquive: 5 }
} as const;

export const ARCHETYPE_ALLOCATIONS = {
  Attaquant: { S: [11, 6, 8, 5, 10], A: [8, 5, 6, 4, 7], B: [6, 3, 4, 3, 4], C: [4, 2, 3, 2, 4], D: [3, 2, 2, 1, 2] },
  Tank: { S: [9, 8, 11, 5, 7], A: [7, 6, 8, 4, 5], B: [5, 4, 5, 3, 3], C: [4, 3, 3, 3, 2], D: [3, 2, 2, 1, 2] },
  Soutien: { S: [10, 7, 8, 9, 6], A: [8, 5, 6, 7, 4], B: [6, 3, 4, 5, 2], C: [4, 2, 3, 5, 1], D: [3, 1, 2, 3, 1] },
  Rapide: { S: [11, 5, 8, 4, 12], A: [8, 4, 6, 3, 9], B: [6, 3, 4, 2, 5], C: [4, 2, 3, 2, 4], D: [3, 1, 2, 1, 3] },
  Équilibré: { S: [10, 8, 10, 6, 6], A: [8, 6, 7, 4, 5], B: [6, 4, 4, 3, 3], C: [4, 3, 4, 2, 2], D: [4, 2, 2, 1, 1] }
} as const;
