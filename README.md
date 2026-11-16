# Duel de héros

Application Angular standalone de gestion de héros et d’armes, avec listes en temps réel depuis Firebase Firestore et un mode de duel.

## Pages

- `/` : accueil.
- `/dashboard` : héros marquants et accès à leur fiche.
- `/tier-list` : héros groupés par rang, avec recherche et tri.
- `/ajouter` et `/heros/:id` : création et fiche/édition des héros.
- `/armes`, `/armes/nouvelle`, `/armes/:id` et `/armes/:id/edit` : liste, création, détail, édition et suppression des armes.
- `/duel` : combat standard, avec un mode Wuthering optionnel.

## Modèle et règles métier

Firestore utilise les collections `heros` et `armes`. Les quatre caractéristiques de base sont `attaque`, `esquive`, `degats` et `pv` :

- un héros doit avoir au moins 1 dans chaque caractéristique et un total maximal de 40 ;
- une arme a des bonus entiers de -5 à 5 dont la somme est exactement 0 ;
- un équipement est refusé si une caractéristique base + bonus d’arme passe sous 1 ;
- les talents sont optionnels et hors budget : bonus de 0 à 5 sur une caractéristique de base, ou régénération de 0 à 10 ;
- les bonus Wuthering `defense` (0–20), `tauxCritique` (0–50 %) et `degatsCritiques` (100–200 %) sont indépendants du budget et de l’arme.

Les services exposent les snapshots `onSnapshot` en signaux. Les lectures ne migrent ni ne modifient les documents. Le script de migration est distinct et sauvegarde les anciennes valeurs dans `legacy`.

## Prérequis et développement

Utilisez Node.js 22.22.3 ou une version compatible avec Angular 22.

```bash
npm install
npm start
npm test
npx ng build --base-href=/Projet-duel-de-heros/
```

Le test est exécuté par Vitest avec un environnement DOM. Il couvre le budget héros, les limites de talents et d’armes, les règles d’équipement, le calcul base + arme + talent et le mode de duel.

## Données de démonstration et migration Firestore

Les fichiers `scripts/wuthering-heroes.json` et `scripts/wuthering-armes.json` contiennent les exemples de données. Les seeds valident les règles localement avant toute connexion et ignorent les identifiants déjà présents.

```bash
npm run seed:heroes -- --validate-only
npm run seed:weapons -- --validate-only
npm run migrate:heroes -- --dry-run
```

Pour une exécution réelle, placez votre clé de compte de service dans `scripts/serviceAccountKey.json` (ce fichier est ignoré par Git) ou définissez `GOOGLE_APPLICATION_CREDENTIALS`, puis lancez explicitement la commande voulue sans option de validation. Les seeds écrivent dans `heros` et `armes`; la migration met à jour les documents historiques de `heros`. Vérifiez le projet Firebase ciblé avant chaque exécution. Aucun script ne doit être lancé contre la base réelle sans sauvegarde et autorisation.

## Règles Firestore

Les règles ne sont pas modifiées par ce dépôt. À adapter dans la console Firebase. Le minimum raisonnable est d’autoriser la lecture publique si nécessaire et de réserver les écritures aux utilisateurs authentifiés :

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /heros/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /armes/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

L’application n’ayant pas encore d’authentification, ces règles bloquent les écritures depuis son interface jusqu’à l’ajout d’un parcours d’authentification. N’ouvrez pas les écritures publiques sur une base de production.

## Déploiement GitHub Pages

La compilation compatible avec le chemin du site est :

```bash
npx ng build --base-href=/Projet-duel-de-heros/
```

La commande de déploiement n’est volontairement pas exécutée. Vérifiez que le dépôt Git distant, le nom du paquet dans `package.json` et les URL/instructions du présent README désignent le même dépôt GitHub.
