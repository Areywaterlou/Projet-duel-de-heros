export type HeroRank = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Hero {
  nom: string;
  pointsDeVie: number;
  attaque: number;
  defense: number;
  classe: string;
  rang: HeroRank;
}

export interface HeroDocument extends Omit<Hero, 'rang'> {
  id: string;
  rang?: HeroRank;
}
