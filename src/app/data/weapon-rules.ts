import { maxLength, required, schema, validate } from '@angular/forms/signals';
import { HERO_STATS, HERO_WEAPONS, WEAPON_RULES } from './game-constants';
import type { HeroStat } from './hero';
import type { ArmeFormValue, WeaponRarity } from './weapon';

export function isValidWeapon(weapon: ArmeFormValue): boolean {
  if (!Object.hasOwn(WEAPON_RULES.bonusesByRarity, weapon.rarete)) return false;
  const rarityRules = WEAPON_RULES.bonusesByRarity[weapon.rarete];
  return HERO_STATS.includes(weapon.statPrincipale) &&
    HERO_STATS.includes(weapon.statSecondaire) &&
    weapon.statPrincipale !== weapon.statSecondaire &&
    Number.isInteger(weapon.bonusPrincipal) &&
    weapon.bonusPrincipal >= rarityRules.primary.min &&
    weapon.bonusPrincipal <= rarityRules.primary.max &&
    Number.isInteger(weapon.bonusSecondaire) &&
    weapon.bonusSecondaire >= rarityRules.secondary.min &&
    weapon.bonusSecondaire <= rarityRules.secondary.max;
}

export function weaponFormSchemaForRarity(rarete: () => WeaponRarity) {
  return schema<ArmeFormValue>(path => {
    required(path.nom);
    maxLength(path.nom, 60);
    required(path.type);
    required(path.statPrincipale);
    required(path.statSecondaire);
    validate(path, ({ value }) => {
      const weapon = value();
      if (!isValidWeapon(weapon)) {
        return {
          kind: 'weapon-bonuses',
          message: `Choisissez deux caractéristiques différentes et des bonus valides pour la rareté ${rarete()} étoiles.`
        };
      }
      return undefined;
    });
  });
}

export const weaponFormSchema = weaponFormSchemaForRarity(() => 5);
export const weaponStats = HERO_STATS as readonly HeroStat[];
export const weaponTypes = HERO_WEAPONS;
