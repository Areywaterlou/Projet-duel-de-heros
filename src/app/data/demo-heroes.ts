import type { Hero } from './hero';

export const DEMO_HEROES: readonly { id: string; hero: Hero }[] = [
  {
    id: 'aelys-astrelune',
    hero: {
      nom: 'Aelys Astrelune',
      classe: 'Mage astrale',
      pointsDeVie: 760,
      attaque: 96,
      defense: 58,
      rang: 'S'
    }
  },
  {
    id: 'brann-pierreveille',
    hero: {
      nom: 'Brann Pierreveille',
      classe: 'Gardien runique',
      pointsDeVie: 1250,
      attaque: 72,
      defense: 112,
      rang: 'A'
    }
  },
  {
    id: 'nyra-ventdoree',
    hero: {
      nom: 'Nyra Ventdorée',
      classe: 'Rôdeuse céleste',
      pointsDeVie: 840,
      attaque: 105,
      defense: 62,
      rang: 'A'
    }
  },
  {
    id: 'oren-cendrevive',
    hero: {
      nom: 'Oren Cendrevive',
      classe: 'Duelliste flamboyant',
      pointsDeVie: 930,
      attaque: 88,
      defense: 76,
      rang: 'B'
    }
  },
  {
    id: 'mira-mousseclaire',
    hero: {
      nom: 'Mira Mousseclaire',
      classe: 'Druidesse',
      pointsDeVie: 1020,
      attaque: 64,
      defense: 91,
      rang: 'B'
    }
  },
  {
    id: 'tovan-brumefil',
    hero: {
      nom: 'Tovan Brumefil',
      classe: 'Alchimiste errant',
      pointsDeVie: 690,
      attaque: 79,
      defense: 55,
      rang: 'C'
    }
  }
];
