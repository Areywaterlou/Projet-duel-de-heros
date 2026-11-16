import type { Arme } from './weapon';
import type { Hero, HeroStat } from './hero';
import { ARCHETYPE_STAT_BONUS_PERCENT } from './game-constants';

export interface HeroStatBreakdown {
  base: number;
  arme: number;
  talent: number;
  archetype: number;
  total: number;
}

export function heroStatBreakdown(hero: Hero, stat: HeroStat, armes: readonly Arme[]): HeroStatBreakdown {
  const base = hero[stat];
  const arme = armes.find(item => item.id === hero.armeId);
  const weaponBonus = arme
    ? (arme.statPrincipale === stat ? arme.bonusPrincipal : 0) +
      (arme.statSecondaire === stat ? arme.bonusSecondaire : 0)
    : 0;
  const talentBonus = hero.talents
    .filter(talent => talent.stat === stat)
    .reduce((sum, talent) => sum + talent.valeur, 0);
  const classBonusPercent = ARCHETYPE_STAT_BONUS_PERCENT[hero.archetype][stat] ?? 0;
  const archetypeBonus = Math.round((base + weaponBonus + talentBonus) * classBonusPercent / 100);
  return {
    base,
    arme: weaponBonus,
    talent: talentBonus,
    archetype: archetypeBonus,
    total: base + weaponBonus + talentBonus + archetypeBonus
  };
}

export function heroStatTotal(hero: Hero, stat: HeroStat, armes: readonly Arme[]): number {
  return heroStatBreakdown(hero, stat, armes).total;
}

export function formatHeroStat(hero: Hero, stat: HeroStat, armes: readonly Arme[]): string {
  const breakdown = heroStatBreakdown(hero, stat, armes);
  return [
    breakdown.base,
    ...(breakdown.arme ? [`+${breakdown.arme}`] : []),
    ...(breakdown.talent ? [`+${breakdown.talent}`] : []),
    ...(breakdown.archetype ? [`+${breakdown.archetype}`] : [])
  ].join(' ');
}
