export type HeroClasse = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SS+';

export const CLASSES_ORDRE: HeroClasse[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SS+'];

export function rangClasse(classe?: HeroClasse): number {
  return classe ? CLASSES_ORDRE.indexOf(classe) : -1;
}

export interface HeroInterface {
  id: number;
  name: string;
  actif: boolean;
  pouvoir?: string;
  debutActivite?: string; // format 'AAAA-MM-JJ'
  classe?: HeroClasse;
}