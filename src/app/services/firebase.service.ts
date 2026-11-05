import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  type DocumentData,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { FIRESTORE } from '../firebase.config';
import type { Hero, HeroFormValue, HeroRank } from '../data/hero';

const HERO_RANKS: readonly HeroRank[] = ['S', 'A', 'B', 'C', 'D'];

function isHeroRank(value: unknown): value is HeroRank {
  return typeof value === 'string' && HERO_RANKS.some(rank => rank === value);
}

function toHero(id: string, data: DocumentData): Hero {
  if (
    typeof data['nom'] !== 'string' ||
    typeof data['pointsDeVie'] !== 'number' ||
    typeof data['attaque'] !== 'number' ||
    typeof data['defense'] !== 'number' ||
    typeof data['classe'] !== 'string'
  ) {
    throw new Error(`Le document Firestore "${id}" ne respecte pas le format Hero attendu.`);
  }

  return {
    id,
    nom: data['nom'],
    pointsDeVie: data['pointsDeVie'],
    attaque: data['attaque'],
    defense: data['defense'],
    classe: data['classe'],
    rang: isHeroRank(data['rang']) ? data['rang'] : 'C'
  };
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly firestore = inject(FIRESTORE);

  async ajouterHero(hero: HeroFormValue): Promise<string> {
    const firestore = await this.firestore;
    const document = await addDoc(collection(firestore, 'heros'), hero);
    return document.id;
  }

  async obtenirHeros(): Promise<Hero[]> {
    const firestore = await this.firestore;
    const heroCollection = collection(firestore, 'heros');
    let snapshot = await getDocs(heroCollection);

    const documentsWithoutValidRank = snapshot.docs.filter(
      document => !isHeroRank(document.data()['rang'])
    );

    if (documentsWithoutValidRank.length > 0) {
      for (let index = 0; index < documentsWithoutValidRank.length; index += 500) {
        const batch = writeBatch(firestore);
        const batchDocuments = documentsWithoutValidRank.slice(index, index + 500);
        for (const document of batchDocuments) {
          batch.update(document.ref, { rang: 'C' });
        }
        await batch.commit();
      }
      snapshot = await getDocs(heroCollection);
    }

    return snapshot.docs.map(document => toHero(document.id, document.data()));
  }

  async obtenirHero(id: string): Promise<Hero | null> {
    const firestore = await this.firestore;
    const snapshot = await getDoc(doc(firestore, 'heros', id));
    return snapshot.exists() ? toHero(snapshot.id, snapshot.data()) : null;
  }

  async modifierHero(id: string, hero: HeroFormValue): Promise<void> {
    const firestore = await this.firestore;
    await updateDoc(doc(firestore, 'heros', id), hero);
  }

  async supprimerHero(id: string): Promise<void> {
    const firestore = await this.firestore;
    await deleteDoc(doc(firestore, 'heros', id));
  }
}
