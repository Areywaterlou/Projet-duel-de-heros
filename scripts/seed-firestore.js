const fs = require('node:fs');
const path = require('node:path');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const TYPES = ['Épée', 'Épée lourde', 'Pistolets', 'Gantelets', 'Rectifieur'];
const STATS = ['attaque', 'defense', 'pv', 'soin', 'esquive'];
const BUDGETS = { S: 40, A: 30, B: 20, C: 15, D: 10 };
const HERO_ARCHETYPES = ['Attaquant', 'Tank', 'Soutien', 'Rapide', 'Équilibré'];
const DATA_PATH = path.join(__dirname, 'wuthering-heroes.json');
const KEY_PATH = path.resolve(
  process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json')
);
const VALIDATE_ONLY = process.argv.includes('--validate-only');

function slugify(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function rankFromTotal(total) {
  if (total === 40) return 'S';
  if (total >= 30) return 'A';
  if (total >= 20) return 'B';
  if (total >= 15) return 'C';
  return 'D';
}

function validateHeroes(heroes) {
  if (!Array.isArray(heroes) || heroes.length !== 17) {
    throw new Error('Le seed doit contenir exactement 17 héros.');
  }
  const slugs = new Set();
  for (const [index, hero] of heroes.entries()) {
    const stats = STATS.map(stat => hero?.[stat]);
    const total = stats.reduce((sum, value) => sum + value, 0);
    if (
      !hero ||
      typeof hero.nom !== 'string' ||
      !hero.nom.trim() ||
      !TYPES.includes(hero.classe) ||
      !HERO_ARCHETYPES.includes(hero.archetype) ||
      !Object.hasOwn(BUDGETS, hero.budgetRank) ||
      total !== BUDGETS[hero.budgetRank] ||
      !stats.every(value => Number.isInteger(value) && value >= 1 && value <= 20) ||
      rankFromTotal(total) !== hero.budgetRank ||
      !Number.isInteger(hero.tauxCritique) ||
      hero.tauxCritique < 40 ||
      hero.tauxCritique > 80 ||
      !Number.isInteger(hero.degatsCritiques) ||
      hero.degatsCritiques < 180 ||
      hero.degatsCritiques > 230 ||
      !Array.isArray(hero.talents) ||
      hero.talents.length > 2 ||
      hero.talents.some(talent =>
        !STATS.includes(talent.stat) ||
        !Number.isInteger(talent.valeur) ||
        talent.valeur < 2 ||
        talent.valeur > 5
      ) ||
      typeof hero.armeId !== 'string' ||
      !hero.armeId
    ) {
      throw new Error(`Le héros du seed à l’index ${index} ne respecte pas le nouveau modèle.`);
    }
    const slug = slugify(hero.nom);
    if (!slug || slugs.has(slug)) throw new Error(`Nom vide ou doublon détecté pour "${slug}".`);
    slugs.add(slug);
  }
}

function firestoreHero(profile) {
  const { budgetRank, ...hero } = profile;
  return hero;
}

async function seedHeroes() {
  const heroes = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  validateHeroes(heroes);
  if (VALIDATE_ONLY) {
    console.log(`Seed valide : ${heroes.length} héros, aucune connexion Firestore.`);
    return;
  }
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error('Clé de compte de service absente. Définissez GOOGLE_APPLICATION_CREDENTIALS.');
  }
  const serviceAccount = require(KEY_PATH);
  if (!serviceAccount.project_id) throw new Error('La clé de compte de service ne contient pas de project_id.');
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });

  const database = getFirestore();
  const collection = database.collection('heros');
  const docs = heroes.map(profile => ({
    hero: firestoreHero(profile),
    reference: collection.doc(slugify(profile.nom))
  }));
  const existing = await database.getAll(...docs.map(item => item.reference));
  const missing = docs.filter((_, index) => !existing[index].exists);
  for (let index = 0; index < missing.length; index += 500) {
    const batch = database.batch();
    for (const item of missing.slice(index, index + 500)) batch.create(item.reference, item.hero);
    await batch.commit();
  }
  console.log(`Seed terminé : ${missing.length} héros ajouté(s), ${docs.length - missing.length} déjà présent(s).`);
}

seedHeroes().catch(error => {
  console.error('Échec du seed des héros :', error);
  process.exitCode = 1;
});
