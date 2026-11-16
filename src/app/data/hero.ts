import { HERO_ARCHETYPES, HERO_RANKS, HERO_STATS, HERO_WEAPONS } from './game-constants';

export { HERO_ARCHETYPES, HERO_RANKS, HERO_WEAPONS } from './game-constants';
export type HeroRank = typeof HERO_RANKS[number];
export type HeroArchetype = typeof HERO_ARCHETYPES[number];
export type HeroStat = typeof HERO_STATS[number];
export type HeroBaseStat = HeroStat;
export type HeroWeapon = typeof HERO_WEAPONS[number];

export interface HeroTalent {
  stat: HeroStat;
  valeur: number;
}

export interface Hero {
  id: string;
  nom: string;
  archetype: HeroArchetype;
  classe: HeroWeapon | null;
  attaque: number;
  defense: number;
  pv: number;
  soin: number;
  esquive: number;
  tauxCritique: number;
  degatsCritiques: number;
  talents: HeroTalent[];
  armeId: string | null;
  rang: HeroRank;
}

export interface HeroFormValue {
  nom: string;
  archetype: HeroArchetype;
  classe: HeroWeapon | '';
  attaque: number;
  defense: number;
  pv: number;
  soin: number;
  esquive: number;
  armeId: string;
}

export type HeroCrits = Pick<Hero, 'tauxCritique' | 'degatsCritiques'>;

const WEAPON_ALIASES: Record<string, HeroWeapon> = {
  Sword: 'Épée',
  Broadblade: 'Épée lourde',
  Pistols: 'Pistolets',
  Gauntlets: 'Gantelets',
  Rectifier: 'Rectifieur'
};

export function toHeroWeapon(value: string): HeroWeapon | '' {
  return HERO_WEAPONS.find(weapon => weapon === value) ?? WEAPON_ALIASES[value] ?? '';
}

export function toHeroArchetype(value: unknown): HeroArchetype | null {
  return typeof value === 'string'
    ? HERO_ARCHETYPES.find(archetype => archetype === value) ?? null
    : null;
}

export function rangDepuisPoints(total: number): HeroRank {
  if (total === 40) return 'S';
  if (total >= 30) return 'A';
  if (total >= 20) return 'B';
  if (total >= 15) return 'C';
  return 'D';
}

export function tirerCritiques(rng: () => number): HeroCrits {
  const critRateRoll = rng();
  const critDamageRoll = rng();
  if (
    !Number.isFinite(critRateRoll) || critRateRoll < 0 || critRateRoll >= 1 ||
    !Number.isFinite(critDamageRoll) || critDamageRoll < 0 || critDamageRoll >= 1
  ) {
    throw new RangeError('Le générateur aléatoire doit retourner des valeurs dans [0, 1).');
  }
  return {
    tauxCritique: 40 + Math.floor(critRateRoll * 41),
    degatsCritiques: 180 + Math.floor(critDamageRoll * 51)
  };
}
