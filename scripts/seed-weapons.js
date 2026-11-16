const fs = require('node:fs');
const path = require('node:path');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const TYPES = ['Épée', 'Épée lourde', 'Pistolets', 'Gantelets', 'Rectifieur'];
const STATS = ['attaque', 'defense', 'pv', 'soin', 'esquive'];
const BOUNDS = {
  3: { primary: [5, 6], secondary: [2, 3] },
  4: { primary: [7, 8], secondary: [3, 4] },
  5: { primary: [9, 10], secondary: [4, 5] }
};
const DATA_PATH = path.join(__dirname, 'wuthering-armes.json');
const KEY_PATH = path.resolve(
  process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json')
);
const VALIDATE_ONLY = process.argv.includes('--validate-only');

function slugify(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function validateWeapons(weapons) {
  if (!Array.isArray(weapons) || weapons.length !== 20) {
    throw new Error('Le seed doit contenir exactement 20 armes.');
  }
  const slugs = new Set();
  for (const [index, weapon] of weapons.entries()) {
    const rarityBounds = BOUNDS[weapon?.rarete];
    if (
      !weapon ||
      typeof weapon.nom !== 'string' ||
      !weapon.nom.trim() ||
      !TYPES.includes(weapon.type) ||
      !rarityBounds ||
      !STATS.includes(weapon.statPrincipale) ||
      !STATS.includes(weapon.statSecondaire) ||
      weapon.statPrincipale === weapon.statSecondaire ||
      !Number.isInteger(weapon.bonusPrincipal) ||
      weapon.bonusPrincipal < rarityBounds.primary[0] ||
      weapon.bonusPrincipal > rarityBounds.primary[1] ||
      !Number.isInteger(weapon.bonusSecondaire) ||
      weapon.bonusSecondaire < rarityBounds.secondary[0] ||
      weapon.bonusSecondaire > rarityBounds.secondary[1]
    ) {
      throw new Error(`L’arme d’index ${index} ne respecte pas le modèle ou les bornes de rareté.`);
    }
    const slug = slugify(weapon.nom);
    if (!slug || slugs.has(slug)) throw new Error(`Nom vide ou doublon détecté pour "${slug}".`);
    slugs.add(slug);
  }
  for (const type of TYPES) {
    const counts = [5, 4, 3].map(rarity => weapons.filter(item => item.type === type && item.rarete === rarity).length);
    if (counts[0] !== 1 || counts[1] !== 2 || counts[2] !== 1) {
      throw new Error(`${type} doit contenir une arme 5★, deux 4★ et une 3★.`);
    }
  }
}

async function seedWeapons() {
  const weapons = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  validateWeapons(weapons);
  if (VALIDATE_ONLY) {
    console.log(`Seed valide : ${weapons.length} armes, aucune connexion Firestore.`);
    return;
  }
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error('Clé de compte de service absente. Définissez GOOGLE_APPLICATION_CREDENTIALS.');
  }
  const serviceAccount = require(KEY_PATH);
  if (!serviceAccount.project_id) throw new Error('La clé de compte de service ne contient pas de project_id.');
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });

  const database = getFirestore();
  const collection = database.collection('armes');
  const docs = weapons.map(weapon => ({
    weapon,
    reference: collection.doc(slugify(weapon.nom))
  }));
  const existing = await database.getAll(...docs.map(item => item.reference));
  const missing = docs.filter((_, index) => !existing[index].exists);
  for (let index = 0; index < missing.length; index += 500) {
    const batch = database.batch();
    for (const item of missing.slice(index, index + 500)) batch.create(item.reference, item.weapon);
    await batch.commit();
  }
  console.log(`Seed terminé : ${missing.length} arme(s) ajoutée(s), ${docs.length - missing.length} déjà présente(s).`);
}

seedWeapons().catch(error => {
  console.error('Échec du seed des armes :', error);
  process.exitCode = 1;
});
