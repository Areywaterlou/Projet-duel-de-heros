import type { HeroRank, HeroStat, HeroWeapon } from './hero';
import type { WEAPON_RARITIES } from './game-constants';

export type WeaponRarity = typeof WEAPON_RARITIES[number];

export interface Arme {
  id: string;
  nom: string;
  type: HeroWeapon;
  rarete: WeaponRarity;
  rang: HeroRank;
  statPrincipale: HeroStat;
  bonusPrincipal: number;
  statSecondaire: HeroStat;
  bonusSecondaire: number;
}

export interface ArmeFormValue {
  nom: string;
  type: HeroWeapon | '';
  rarete: WeaponRarity;
  statPrincipale: HeroStat;
  bonusPrincipal: number;
  statSecondaire: HeroStat;
  bonusSecondaire: number;
}
