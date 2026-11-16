const fs = require('node:fs');
const path = require('node:path');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const TYPES = ['Épée', 'Épée lourde', 'Pistolets', 'Gantelets', 'Rectifieur'];
const STATS = ['attaque', 'defense', 'pv', 'soin', 'esquive'];
const RANKS = ['S', 'A', 'B', 'C', 'D'];
const HERO_ARCHETYPES = ['Attaquant', 'Tank', 'Soutien', 'Rapide', 'Équilibré'];
const ALLOCATIONS = {
  Attaquant: { S: [11, 6, 8, 5, 10], A: [8, 5, 6, 4, 7], B: [6, 3, 4, 3, 4], C: [4, 2, 3, 2, 4], D: [3, 2, 2, 1, 2] },
  Tank: { S: [9, 8, 11, 5, 7], A: [7, 6, 8, 4, 5], B: [5, 4, 5, 3, 3], C: [4, 3, 3, 3, 2], D: [3, 2, 2, 1, 2] },
  Soutien: { S: [10, 7, 8, 9, 6], A: [8, 5, 6, 7, 4], B: [6, 3, 4, 5, 2], C: [4, 2, 3, 5, 1], D: [3, 1, 2, 3, 1] },
  Rapide: { S: [11, 5, 8, 4, 12], A: [8, 4, 6, 3, 9], B: [6, 3, 4, 2, 5], C: [4, 2, 3, 2, 4], D: [3, 1, 2, 1, 3] },
  Équilibré: { S: [10, 8, 10, 6, 6], A: [8, 6, 7, 4, 5], B: [6, 4, 4, 3, 3], C: [4, 3, 4, 2, 2], D: [4, 2, 2, 1, 1] }
};
const CRITICS = {
  Attaquant: { tauxCritique: 55, degatsCritiques: 190 },
  Tank: { tauxCritique: 60, degatsCritiques: 195 },
  Soutien: { tauxCritique: 60, degatsCritiques: 195 },
  Rapide: { tauxCritique: 60, degatsCritiques: 195 },
  Équilibré: { tauxCritique: 58, degatsCritiques: 195 }
};
const TALENTS = {
  Attaquant: [{ stat: 'attaque', valeur: 2 }],
  Tank: [{ stat: 'attaque', valeur: 2 }, { stat: 'defense', valeur: 2 }],
  Soutien: [{ stat: 'attaque', valeur: 3 }, { stat: 'soin', valeur: 2 }],
  Rapide: [{ stat: 'esquive', valeur: 2 }, { stat: 'attaque', valeur: 2 }],
  Équilibré: [{ stat: 'attaque', valeur: 2 }, { stat: 'defense', valeur: 2 }]
};
const LEGACY_TYPES = {
  Sword: 'Épée',
  Broadblade: 'Épée lourde',
  Pistols: 'Pistolets',
  Gauntlets: 'Gantelets',
  Rectifier: 'Rectifieur',
  Guerrier: 'Épée lourde',
  Mage: 'Rectifieur',
  Archer: 'Pistolets',
  Voleur: 'Épée',
  Soigneur: 'Rectifieur'
};
const NAME_ARCHETYPES = {
  jiyan: 'Attaquant',
  changli: 'Attaquant',
  jinhsi: 'Attaquant',
  camellya: 'Attaquant',
  calcharo: 'Attaquant',
  encore: 'Attaquant',
  mortefi: 'Attaquant',
  yinlin: 'Équilibré',
  rover: 'Équilibré',
  shorekeeper: 'Soutien',
  verina: 'Soutien',
  baizhi: 'Soutien',
  jianxin: 'Tank',
  lingyang: 'Rapide',
  sanhua: 'Rapide'
};
const DATA_PATH = path.join(__dirname, 'wuthering-heroes.json');
const WEAPONS_PATH = path.join(__dirname, 'wuthering-armes.json');
const BACKUP_DIR = path.join(__dirname, 'backup');
const KEY_PATH = path.resolve(
  process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json')
);
const APPLY = process.argv.includes('--apply');

function slugify(name) {
  return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function total(stats) {
  return STATS.reduce((sum, stat) => sum + stats[stat], 0);
}

function isAlreadyMigrated(data, migration) {
  return data.archetype === migration.archetype &&
    data.classe === migration.classe &&
    STATS.every(stat => data[stat] === migration.stats[stat]) &&
    data.tauxCritique === migration.tauxCritique &&
    data.degatsCritiques === migration.degatsCritiques &&
    JSON.stringify(data.talents) === JSON.stringify(migration.next.talents) &&
    data.armeId === migration.next.armeId &&
    !['rang', 'degats', 'pointsDeVie', 'talent', 'legacy'].some(key => Object.hasOwn(data, key));
}

function deriveRank(points) {
  if (points === 40) return 'S';
  if (points >= 30) return 'A';
  if (points >= 20) return 'B';
  if (points >= 15) return 'C';
  return 'D';
}

function inferArchetype(name, data, profile) {
  if (profile) return { value: profile.archetype, source: 'profil seed' };
  if (HERO_ARCHETYPES.includes(data.archetype)) return { value: data.archetype, source: 'champ archétype' };
  const explicit = NAME_ARCHETYPES[slugify(name)];
  if (explicit) return { value: explicit, source: 'nom reconnu' };
  const lower = String(name).toLocaleLowerCase();
  if (/(verina|baizhi|shorekeeper)/.test(lower)) return { value: 'Soutien', source: 'nom reconnu' };
  const oldAttack = Number(data.attaque) || 0;
  const oldHp = Number(data.pointsDeVie) || 0;
  const oldDefense = Number(data.defense) || 0;
  const oldClass = String(data.classe || '');
  if (oldClass === 'Soigneur' || oldAttack < 330) return { value: 'Soutien', source: 'heuristique' };
  if (oldHp >= 12000 || oldDefense >= 1350) return { value: 'Tank', source: 'heuristique' };
  if (oldAttack >= 400 && oldHp < 11000) return { value: 'Rapide', source: 'heuristique' };
  if (oldClass === 'Pistolets' || oldClass === 'Pistols') return { value: 'Rapide', source: 'heuristique' };
  return { value: 'Attaquant', source: 'heuristique' };
}

function inferType(name, data, profile) {
  const direct = TYPES.includes(data.classe) ? data.classe : LEGACY_TYPES[data.classe];
  if (profile) return profile.classe;
  if (direct) return direct;
  const normalized = slugify(name);
  return 'Épée';
}

function makeMigration(document, profiles, signatures) {
  const data = document.data;
  const name = typeof data.nom === 'string' && data.nom.trim() ? data.nom.trim() : document.id;
  const profile = profiles.get(slugify(name));
  const archetype = inferArchetype(name, data, profile);
  const classType = inferType(name, data, profile);
  const sourceRank = RANKS.includes(data.rang)
    ? data.rang
    : profile?.budgetRank && RANKS.includes(profile.budgetRank)
      ? profile.budgetRank
      : 'D';
  const values = ALLOCATIONS[archetype.value][sourceRank];
  const stats = Object.fromEntries(STATS.map((stat, index) => [stat, values[index]]));
  const weapon = signatures.get(classType);
  if (!weapon) throw new Error(`Aucune arme signature disponible pour ${classType} (${name}).`);
  const keep = {};
  if (typeof data.imageUrl === 'string') keep.imageUrl = data.imageUrl;
  if (typeof data.description === 'string') keep.description = data.description;
  const next = {
    ...keep,
    nom: name,
    archetype: archetype.value,
    classe: classType,
    ...stats,
    ...CRITICS[archetype.value],
    talents: TALENTS[archetype.value],
    armeId: weapon.id
  };
  const rank = deriveRank(total(stats));
  return {
    id: document.id,
    name,
    archetype: archetype.value,
    archetypeSource: archetype.source,
    classe: classType,
    stats,
    total: total(stats),
    tauxCritique: next.tauxCritique,
    degatsCritiques: next.degatsCritiques,
    talents: next.talents.map(talent => `+${talent.valeur} ${talent.stat}`).join(', '),
    arme: weapon.nom,
    rang: rank,
    next
  };
}

function makeBackupPath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(BACKUP_DIR, `heroes-before-migration-${stamp}.json`);
}

async function migrateHeroes() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error('Clé de compte de service absente. Définissez GOOGLE_APPLICATION_CREDENTIALS.');
  }
  const profilesData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const weaponsData = JSON.parse(fs.readFileSync(WEAPONS_PATH, 'utf8'));
  const profiles = new Map(profilesData.map(profile => [slugify(profile.nom), profile]));
  const signatures = new Map();
  for (const weapon of weaponsData) {
    if (weapon.rarete === 5 && !signatures.has(weapon.type)) {
      signatures.set(weapon.type, { id: slugify(weapon.nom), nom: weapon.nom });
    }
  }

  const serviceAccount = require(KEY_PATH);
  if (!serviceAccount.project_id) throw new Error('La clé de compte de service ne contient pas de project_id.');
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  const firestore = getFirestore();
  const snapshot = await firestore.collection('heros').get();
  const documents = snapshot.docs.map(document => ({
    id: document.id,
    reference: document.ref,
    data: document.data()
  }));
  const backupPath = makeBackupPath();
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(documents.map(({ id, data }) => ({ id, data })), null, 2));

  const updates = documents
    .map(document => ({ document, migration: makeMigration(document, profiles, signatures) }))
    .filter(({ document, migration }) => !isAlreadyMigrated(document.data, migration));
  const table = updates.map(({ migration }) => ({
    Héros: migration.name,
    Classe: migration.classe,
    Profil: migration.archetype,
    Origine: migration.archetypeSource,
    ATK: migration.stats.attaque,
    DEF: migration.stats.defense,
    PV: migration.stats.pv,
    Soin: migration.stats.soin,
    ESQ: migration.stats.esquive,
    Total: migration.total,
    Rang: migration.rang,
    'Crit %': migration.tauxCritique,
    'Dégâts crit %': migration.degatsCritiques,
    Talent: migration.talents,
    Arme: migration.arme
  }));
  console.log(`Héros Firestore : ${documents.length}. À migrer : ${updates.length}. Déjà au nouveau format : ${documents.length - updates.length}.`);
  console.table(table);
  console.log(`Sauvegarde locale préparée : scripts/backup/${path.basename(backupPath)}`);

  if (!APPLY) {
    console.log('Simulation seulement. Aucune écriture Firestore. Ajoutez --apply après validation des tableaux.');
    return;
  }

  for (let index = 0; index < updates.length; index += 500) {
    const batch = firestore.batch();
    for (const { document, migration } of updates.slice(index, index + 500)) {
      batch.set(document.reference, migration.next);
    }
    await batch.commit();
  }
  console.log(`Migration appliquée : ${updates.length} héros mis à jour.`);
}

migrateHeroes().catch(error => {
  console.error('Échec de la migration des héros :', error);
  process.exitCode = 1;
});
