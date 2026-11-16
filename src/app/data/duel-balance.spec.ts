import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_ALLOCATIONS,
  ARCHETYPE_CRITICS,
  ARCHETYPE_TALENTS,
  HERO_ARCHETYPES,
  HERO_RANKS,
  HERO_STATS,
  HERO_WEAPONS,
  WEAPON_RARITIES
} from './game-constants';
import { rangDepuisPoints, type Hero, type HeroRank } from './hero';
import { simulerDuel } from './duel-rules';
import type { Arme } from './weapon';
import weaponSeeds from '../../../scripts/wuthering-armes.json';

type Archetype = typeof HERO_ARCHETYPES[number];
const weapons: Arme[] = weaponSeeds.map(weapon => {
  const type = HERO_WEAPONS.find(value => value === weapon.type);
  const rarete = WEAPON_RARITIES.find(value => value === weapon.rarete);
  const statPrincipale = HERO_STATS.find(value => value === weapon.statPrincipale);
  const statSecondaire = HERO_STATS.find(value => value === weapon.statSecondaire);
  if (!type || !rarete || !statPrincipale || !statSecondaire) {
    throw new Error(`L’arme ${weapon.nom} contient des données invalides.`);
  }
  return {
    id: slugify(weapon.nom),
    nom: weapon.nom,
    type,
    rarete,
    rang: rarete === 5 ? 'S' : rarete === 4 ? 'A' : 'B',
    statPrincipale,
    bonusPrincipal: weapon.bonusPrincipal,
    statSecondaire,
    bonusSecondaire: weapon.bonusSecondaire
  };
});

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createHero(archetype: Archetype, rank: HeroRank, id: string): Hero {
  const [attaque, defense, pv, soin, esquive] = ARCHETYPE_ALLOCATIONS[archetype][rank];
  const crits = ARCHETYPE_CRITICS[archetype];
  return {
    id,
    nom: id,
    archetype,
    classe: 'Épée',
    attaque,
    defense,
    pv,
    soin,
    esquive,
    tauxCritique: crits.tauxCritique,
    degatsCritiques: crits.degatsCritiques,
    talents: ARCHETYPE_TALENTS[archetype].map(talent => ({ ...talent })),
    armeId: null,
    rang: rangDepuisPoints(HERO_STATS.reduce((total, stat) => total + ({ attaque, defense, pv, soin, esquive })[stat], 0))
  };
}

describe('combat balance simulation', () => {
  it('simulates 2,000 duels per archetype pair and rank with randomly equipped seed weapons', () => {
    const report: Array<Record<string, string | number>> = [];

    HERO_RANKS.forEach((rank, rankIndex) => {
      HERO_ARCHETYPES.forEach((firstArchetype, firstIndex) => {
        HERO_ARCHETYPES.slice(firstIndex).forEach((secondArchetype, offset) => {
          const secondIndex = firstIndex + offset;
          const rng = createRng(9301 + rankIndex * 1000 + firstIndex * 100 + secondIndex);
          const first = createHero(firstArchetype, rank, `${rank}-${firstArchetype}-one`);
          const second = createHero(secondArchetype, rank, `${rank}-${secondArchetype}-two`);
          let firstWins = 0;
          let secondWins = 0;
          let draws = 0;
          let capped = 0;
          let turns = 0;

          for (let duel = 0; duel < 2000; duel++) {
            const firstWeapon = weapons[Math.floor(rng() * weapons.length)];
            const secondWeapon = weapons[Math.floor(rng() * weapons.length)];
            const result = simulerDuel(
              { ...first, armeId: firstWeapon.id },
              { ...second, armeId: secondWeapon.id },
              [firstWeapon, secondWeapon],
              rng
            );
            turns += result.tours;
            if (result.termineParLimite) capped++;
            if (result.vainqueurId === first.id) firstWins++;
            else if (result.vainqueurId === second.id) secondWins++;
            else draws++;
          }

          const decided = 2000 - draws;
          const firstRate = decided ? firstWins / decided * 100 : 50;
          const secondRate = decided ? secondWins / decided * 100 : 50;
          const averageTurns = turns / 2000;
          report.push({
            Rang: rank,
            Archétypes: `${firstArchetype} / ${secondArchetype}`,
            'Victoires 1 (%)': Number(firstRate.toFixed(1)),
            'Victoires 2 (%)': Number(secondRate.toFixed(1)),
            'Durée moy.': Number(averageTurns.toFixed(2)),
            'Limite 40 tours': capped
          });

        });
      });
    });

    console.table(report);
    expect(weapons).toHaveLength(20);
    expect(report).toHaveLength(75);
  }, 60000);
});
