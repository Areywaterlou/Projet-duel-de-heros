# Duel de héros

Application pédagogique Angular de gestion de héros et d’armes avec Firebase Firestore. Elle propose un tableau de bord, une Tier List et un duel tour par tour.

## Inspiration et crédits

L’identité visuelle et les exemples de personnages et d’armes s’inspirent de *Wuthering Waves*, jeu de Kuro Games. Ce projet indépendant est réalisé à des fins pédagogiques ; il n’est ni affilié à Kuro Games ni approuvé par l’éditeur. Les noms, marques et créations du jeu restent la propriété de leurs ayants droit.

## Fonctionnalités et navigation

- `/` : accueil.
- `/dashboard` : recherche, filtres, tris et fiches des héros.
- `/tier-list` : classement par rang.
- `/ajouter` et `/heros/:id` : création, consultation et édition des héros.
- `/armes`, `/armes/nouvelle` et `/armes/:id` : gestion et détail des armes.
- `/duel` : choix des combattants, duel au tour par tour et simulation automatique.

La classe d’arme et l’archétype sont deux notions distinctes, affichées ensemble sous la forme `Classe - Archétype`. Les classes sont Épée, Épée lourde, Pistolets, Gantelets et Rectifieur ; les archétypes sont Attaquant, Tank, Soutien, Rapide et Équilibré.

## Modèle et calcul des statistiques

Un héros répartit ses points entre cinq caractéristiques : attaque, défense, PV, soin et esquive. Chaque caractéristique vaut de 1 à 20 et leur total doit être compris entre 10 et 40.

Le rang n’est pas saisi : il est calculé à partir du total des points.

| Rang | Total |
|---|---:|
| S | 40 |
| A | 30–39 |
| B | 20–29 |
| C | 15–19 |
| D | 10–14 |

Le taux critique (40–80 %) et les dégâts critiques (180–230 %) sont tirés à la création et restent fixes. Les héros inspirés du jeu peuvent avoir jusqu’à deux talents (+2 à +5 par caractéristique) ; les héros créés dans l’application n’en reçoivent pas.

Une arme possède une classe, une rareté de 3 à 5 étoiles et deux bonus positifs sur deux caractéristiques différentes. Selon la rareté, le bonus principal vaut +5 à +6, +7 à +8 ou +9 à +10 ; le bonus secondaire vaut respectivement +2 à +3, +3 à +4 ou +4 à +5. Un héros peut porter n’importe quelle classe d’arme.

Les valeurs finales sont calculées à partir des points du héros, des bonus d’arme et de talent, puis du bonus en pourcentage de son archétype. Les bonus sont affichés séparément pour distinguer leur origine.

## Règles du duel

Le duel utilise toujours les valeurs finales :

- PV maximum : `150 + 40 × PV`.
- Dégâts de base : `6 × attaque`, avec une variation aléatoire de ±10 %.
- Chance de toucher : `50 % + 2,5 % × (attaque - esquive adverse)`, limitée à 25–90 %.
- La défense réduit les dégâts selon `défense / (défense + 39)`.
- Un coup critique applique le multiplicateur de dégâts critiques du héros.
- À la fin de son action, un combattant récupère jusqu’à 6 % de ses PV maximum, selon son soin et les PV manquants.
- Après le 8e tour, la fatigue augmente progressivement les dégâts et réduit les soins.
- Au 40e tour, si personne n’est vaincu, le combattant ayant le plus grand pourcentage de PV restants gagne.

Le joueur peut déclencher chaque tour manuellement ou laisser le bouton Auto terminer le combat. L’adversaire est choisi parmi les héros du même rang si possible.

## Structure du projet

```text
src/app/
  components/       # Accueil, dashboard, Tier List, formulaires, armes et duel
  data/             # Modèles, constantes, validations, calculs et règles de combat
  services/         # Accès Firestore et notifications
  app.routes.ts     # Routes Angular chargées à la demande
  firebase.config.ts
scripts/
  wuthering-heroes.json
  wuthering-armes.json
  seed-firestore.js
  seed-weapons.js
  migrate-heroes.js
```

## Firebase et données

L’application utilise le SDK Firebase côté navigateur. La configuration du projet est dans `src/app/firebase.config.ts`. Firestore contient les collections `heros` et `armes` ; les services écoutent leurs changements en temps réel et exposent les données à l’interface.

Les scripts de seed valident leurs fichiers JSON et ajoutent les documents manquants. La migration des héros est séparée du chargement normal ; elle propose un mode dry-run et sauvegarde les données antérieures dans `scripts/backup/`.

Pour les scripts d’administration, fournissez une clé de compte de service locale via `GOOGLE_APPLICATION_CREDENTIALS` ou `scripts/serviceAccountKey.json`. Ne partagez et ne commitez jamais cette clé. Les règles Firestore doivent protéger les écritures ; elles ne sont pas modifiées par ce projet.

## Installation et commandes utiles

Prérequis : Node.js et npm.

```bash
npm install
npm start
```

Vérifier le projet et préparer le build destiné à GitHub Pages :

```bash
npm test
npx ng build --base-href=/Projet-duel-de-heros/
```

Valider localement les seeds ou prévisualiser la migration sans écriture Firestore :

```bash
npm run seed:heroes -- --validate-only
npm run seed:weapons -- --validate-only
npm run migrate:heroes -- --dry-run
```
