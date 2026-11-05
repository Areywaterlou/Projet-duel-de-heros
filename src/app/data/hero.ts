export type HeroRank = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Hero {
  id: string;
  nom: string;
  pointsDeVie: number;
  attaque: number;
  defense: number;
  classe: string;
  rang: HeroRank;
}

export type HeroFormValue = Omit<Hero, 'id'>;
