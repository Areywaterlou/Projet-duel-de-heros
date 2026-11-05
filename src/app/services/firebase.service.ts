import { Injectable, inject } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  type DocumentData,
  type Firestore,
  writeBatch
} from 'firebase/firestore';
import { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE } from '../firebase.config';
import type { Hero, HeroDocument, HeroRank } from '../data/hero';
import { DEMO_HEROES } from '../data/demo-heroes';

const HERO_RANKS: readonly HeroRank[] = ['S', 'A', 'B', 'C', 'D'];

function isHeroRank(value: unknown): value is HeroRank {
  return typeof value === 'string' && HERO_RANKS.some(rank => rank === value);
}

function toHeroDocument(id: string, data: DocumentData): HeroDocument {
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
    rang: isHeroRank(data['rang']) ? data['rang'] : undefined
  };
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  readonly app: FirebaseApp = inject(FIREBASE_APP);
  readonly auth: Auth = inject(FIREBASE_AUTH);
  readonly firestore: Firestore = inject(FIRESTORE);

  async ajouterHero(hero: Hero): Promise<string> {
    const document = await addDoc(collection(this.firestore, 'heros'), hero);
    return document.id;
  }

  async obtenirHeros(): Promise<HeroDocument[]> {
    const snapshot = await getDocs(collection(this.firestore, 'heros'));
    return snapshot.docs.map(document => toHeroDocument(document.id, document.data()));
  }

  async initialiserHerosSiVide(): Promise<HeroDocument[]> {
    const heroCollection = collection(this.firestore, 'heros');
    let snapshot = await getDocs(heroCollection);

    if (snapshot.empty) {
      const batch = writeBatch(this.firestore);
      for (const { id, hero } of DEMO_HEROES) {
        batch.set(doc(heroCollection, id), hero);
      }
      await batch.commit();
      snapshot = await getDocs(heroCollection);
    }

    const documentsWithoutValidRank = snapshot.docs.filter(
      document => !isHeroRank(document.data()['rang'])
    );

    if (documentsWithoutValidRank.length > 0) {
      const batch = writeBatch(this.firestore);
      for (const document of documentsWithoutValidRank) {
        batch.update(document.ref, { rang: 'C' satisfies HeroRank });
      }
      await batch.commit();
      snapshot = await getDocs(heroCollection);
    }

    return snapshot.docs.map(document => toHeroDocument(document.id, document.data()));
  }

  async obtenirHero(id: string): Promise<HeroDocument | null> {
    const snapshot = await getDoc(doc(this.firestore, 'heros', id));
    return snapshot.exists() ? toHeroDocument(snapshot.id, snapshot.data()) : null;
  }
}
