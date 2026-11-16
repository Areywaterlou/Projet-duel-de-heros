import { Injectable, inject, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  type DocumentData,
  type Firestore,
  query,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { ARCHETYPE_ALLOCATIONS, HERO_ARCHETYPES, HERO_RANKS, HERO_STATS, HERO_WEAPONS, HERO_RULES, WEAPON_RARITIES } from '../data/game-constants';
import { rangDepuisPoints, tirerCritiques, toHeroArchetype, toHeroWeapon } from '../data/hero';
import type { Hero, HeroArchetype, HeroFormValue, HeroRank, HeroStat, HeroTalent, HeroWeapon } from '../data/hero';
import { heroTotalPoints, isValidHeroStats } from '../data/hero-rules';
import type { Arme, ArmeFormValue, WeaponRarity } from '../data/weapon';
import { isValidWeapon } from '../data/weapon-rules';
import { FIRESTORE } from '../firebase.config';
import { NotificationService } from './notification.service';

function isRank(value: unknown): value is HeroRank {
  return typeof value === 'string' && HERO_RANKS.some(rank => rank === value);
}

function isWeaponRarity(value: unknown): value is WeaponRarity {
  return typeof value === 'number' && WEAPON_RARITIES.some(rarity => rarity === value);
}

function isHeroStat(value: unknown): value is HeroStat {
  return typeof value === 'string' && HERO_STATS.some(stat => stat === value);
}

function inferArchetypeFromStats(stats: Pick<Hero, HeroStat>): HeroArchetype {
  const rank = rangDepuisPoints(heroTotalPoints(stats));
  return HERO_ARCHETYPES.reduce((closest, candidate) => {
    const candidateStats = ARCHETYPE_ALLOCATIONS[candidate][rank];
    const candidateDistance = HERO_STATS.reduce(
      (distance, stat, index) => distance + Math.abs(stats[stat] - candidateStats[index]),
      0
    );
    const closestStats = ARCHETYPE_ALLOCATIONS[closest][rank];
    const closestDistance = HERO_STATS.reduce(
      (distance, stat, index) => distance + Math.abs(stats[stat] - closestStats[index]),
      0
    );
    return candidateDistance < closestDistance ? candidate : closest;
  }, HERO_ARCHETYPES[0]);
}

function parseTalents(value: unknown): HeroTalent[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 2) {
    throw new Error('Les talents du héros sont invalides.');
  }
  return value.map((item: unknown) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !isHeroStat((item as Record<string, unknown>)['stat']) ||
      !Number.isInteger((item as Record<string, unknown>)['valeur']) ||
      Number((item as Record<string, unknown>)['valeur']) < HERO_RULES.minTalentBonus ||
      Number((item as Record<string, unknown>)['valeur']) > HERO_RULES.maxTalentBonus
    ) {
      throw new Error('Un talent du héros dépasse les bornes autorisées.');
    }
    return {
      stat: (item as Record<string, unknown>)['stat'] as HeroStat,
      valeur: (item as Record<string, unknown>)['valeur'] as number
    };
  });
}

function toHero(id: string, data: DocumentData): Hero {
  const stats = Object.fromEntries(HERO_STATS.map(stat => [stat, data[stat]])) as Pick<Hero, HeroStat>;
  const classe = typeof data['classe'] === 'string' ? toHeroWeapon(data['classe']) : '';
  const total = heroTotalPoints(stats);
  if (
    typeof data['nom'] !== 'string' ||
    !classe ||
    !isValidHeroStats(stats) ||
    !Number.isInteger(data['tauxCritique']) ||
    data['tauxCritique'] < HERO_RULES.minCritRate ||
    data['tauxCritique'] > HERO_RULES.maxCritRate ||
    !Number.isInteger(data['degatsCritiques']) ||
    data['degatsCritiques'] < HERO_RULES.minCritDamage ||
    data['degatsCritiques'] > HERO_RULES.maxCritDamage
  ) {
    throw new Error(`Le document Firestore "${id}" doit être migré vers les nouvelles règles de héros.`);
  }
  return {
    id,
    nom: data['nom'],
    archetype: toHeroArchetype(data['archetype']) ?? inferArchetypeFromStats(stats),
    classe,
    ...stats,
    tauxCritique: data['tauxCritique'],
    degatsCritiques: data['degatsCritiques'],
    talents: parseTalents(data['talents']),
    armeId: typeof data['armeId'] === 'string' ? data['armeId'] : null,
    rang: rangDepuisPoints(total)
  };
}

function toWeapon(id: string, data: DocumentData): Arme {
  const type = typeof data['type'] === 'string' ? toHeroWeapon(data['type']) : '';
  const formValue = {
    nom: data['nom'],
    type,
    rarete: data['rarete'],
    statPrincipale: data['statPrincipale'],
    bonusPrincipal: data['bonusPrincipal'],
    statSecondaire: data['statSecondaire'],
    bonusSecondaire: data['bonusSecondaire']
  } as ArmeFormValue;
  if (
    typeof data['nom'] !== 'string' ||
    !type ||
    !isWeaponRarity(data['rarete']) ||
    !isValidWeapon(formValue)
  ) {
    throw new Error(`Le document Firestore d’arme "${id}" ne respecte pas le nouveau modèle Arme.`);
  }
  return {
    id,
    ...formValue,
    type,
    rarete: data['rarete'],
    rang: data['rarete'] === 5 ? 'S' : data['rarete'] === 4 ? 'A' : 'B',
    statPrincipale: data['statPrincipale'],
    statSecondaire: data['statSecondaire']
  };
}

function toHeroFields(hero: HeroFormValue) {
  if (!hero.nom.trim() || !toHeroArchetype(hero.archetype) || !hero.classe || !isValidHeroStats(hero)) {
    throw new Error('Le héros est invalide : vérifiez son nom, sa classe et ses cinq caractéristiques.');
  }
  return {
    nom: hero.nom.trim(),
    archetype: hero.archetype,
    classe: hero.classe,
    attaque: hero.attaque,
    defense: hero.defense,
    pv: hero.pv,
    soin: hero.soin,
    esquive: hero.esquive,
    armeId: hero.armeId || null
  };
}

function toHeroDocument(hero: HeroFormValue, crits: ReturnType<typeof tirerCritiques>) {
  if (
    !Number.isInteger(crits.tauxCritique) ||
    crits.tauxCritique < HERO_RULES.minCritRate ||
    crits.tauxCritique > HERO_RULES.maxCritRate ||
    !Number.isInteger(crits.degatsCritiques) ||
    crits.degatsCritiques < HERO_RULES.minCritDamage ||
    crits.degatsCritiques > HERO_RULES.maxCritDamage
  ) {
    throw new Error('Les caractéristiques critiques tirées sont invalides.');
  }
  return { ...toHeroFields(hero), ...crits, talents: [] };
}

function toWeaponDocument(weapon: ArmeFormValue): Omit<Arme, 'id' | 'rang'> {
  const type = toHeroWeapon(weapon.type);
  if (!weapon.nom.trim() || !type || !isValidWeapon(weapon)) {
    throw new Error('L’arme est invalide : vérifiez ses deux caractéristiques et ses bonus.');
  }
  return { ...weapon, nom: weapon.nom.trim(), type };
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly firestore = inject(FIRESTORE);
  private readonly notifications = inject(NotificationService);

  readonly herosEnDirect = signal<Hero[] | undefined>(undefined);
  readonly armesEnDirect = signal<Arme[] | undefined>(undefined);
  readonly erreurHerosEnDirect = signal<string | null>(null);
  readonly erreurArmesEnDirect = signal<string | null>(null);
  private stopLiveUpdates: (() => void) | null = null;

  startRealtime(): () => void {
    if (this.stopLiveUpdates) return this.stopLiveUpdates;
    let active = true;
    let initialHeroes = true;
    let initialWeapons = true;
    const unsubscribe: Array<() => void> = [];
    const stop = (): void => {
      active = false;
      unsubscribe.forEach(unsubscribeListener => unsubscribeListener());
      this.stopLiveUpdates = null;
    };
    this.stopLiveUpdates = stop;

    void this.firestore.then(firestore => {
      if (!active) return;
      unsubscribe.push(onSnapshot(collection(firestore, 'heros'), snapshot => {
        try {
          const changes = initialHeroes ? [] : snapshot.docChanges();
          this.herosEnDirect.set(snapshot.docs.map(document => toHero(document.id, document.data())));
          this.erreurHerosEnDirect.set(null);
          initialHeroes = false;
          this.notifyRemoteChanges(changes, 'Héros');
        } catch (error) {
          this.erreurHerosEnDirect.set(this.errorMessage(error));
          console.error('Erreur lors de la lecture temps réel des héros :', error);
        }
      }, error => {
        this.erreurHerosEnDirect.set(this.errorMessage(error));
        console.error('Erreur de synchronisation des héros :', error);
      }));
      unsubscribe.push(onSnapshot(collection(firestore, 'armes'), snapshot => {
        try {
          const changes = initialWeapons ? [] : snapshot.docChanges();
          this.armesEnDirect.set(snapshot.docs.map(document => toWeapon(document.id, document.data())));
          this.erreurArmesEnDirect.set(null);
          initialWeapons = false;
          this.notifyRemoteChanges(changes, 'Arme');
        } catch (error) {
          this.erreurArmesEnDirect.set(this.errorMessage(error));
          console.error('Erreur lors de la lecture temps réel des armes :', error);
        }
      }, error => {
        this.erreurArmesEnDirect.set(this.errorMessage(error));
        console.error('Erreur de synchronisation des armes :', error);
      }));
    }).catch(error => {
      this.erreurHerosEnDirect.set(this.errorMessage(error));
      this.erreurArmesEnDirect.set(this.errorMessage(error));
      console.error('Impossible d’initialiser les listeners Firestore :', error);
    });
    return stop;
  }

  async ajouterHero(hero: HeroFormValue, crits = tirerCritiques(Math.random)): Promise<string> {
    const firestore = await this.firestore;
    const result = await addDoc(collection(firestore, 'heros'), toHeroDocument(hero, crits));
    return result.id;
  }

  async modifierHero(id: string, hero: HeroFormValue): Promise<void> {
    const firestore = await this.firestore;
    await updateDoc(doc(firestore, 'heros', id), toHeroFields(hero));
  }

  async supprimerHero(id: string): Promise<void> {
    const firestore = await this.firestore;
    await deleteDoc(doc(firestore, 'heros', id));
  }

  async ajouterArme(arme: ArmeFormValue): Promise<string> {
    const firestore = await this.firestore;
    return (await addDoc(collection(firestore, 'armes'), toWeaponDocument(arme))).id;
  }

  async modifierArme(id: string, arme: ArmeFormValue): Promise<void> {
    const firestore = await this.firestore;
    await updateDoc(doc(firestore, 'armes', id), toWeaponDocument(arme));
  }

  async supprimerArme(id: string): Promise<void> {
    const firestore = await this.firestore;
    const equipped = await getDocs(query(collection(firestore, 'heros'), where('armeId', '==', id)));
    for (let index = 0; index < equipped.docs.length; index += 499) {
      const batch = writeBatch(firestore);
      equipped.docs.slice(index, index + 499).forEach(document => batch.update(document.ref, { armeId: null }));
      await batch.commit();
    }
    await deleteDoc(doc(firestore, 'armes', id));
  }

  private notifyRemoteChanges(
    changes: Array<{
      type: 'added' | 'modified' | 'removed';
      doc: { metadata: { hasPendingWrites: boolean }; data(): DocumentData };
    }>,
    label: string
  ): void {
    for (const change of changes) {
      if (change.doc.metadata.hasPendingWrites) continue;
      const name = change.doc.data()['nom'];
      const action = change.type === 'added' ? 'ajouté' : change.type === 'removed' ? 'supprimé' : 'modifié';
      this.notifications.info(`${label} ${typeof name === 'string' ? name : ''} ${action} par un autre utilisateur`.trim());
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erreur Firestore inconnue.';
  }
}
