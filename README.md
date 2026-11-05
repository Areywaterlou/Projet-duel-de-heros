# Angular — Duel de Héros

Application de démonstration réalisée pendant l’apprentissage d’Angular.

## Développement

Installez les dépendances puis démarrez le serveur local :

```bash
npm install
npm start
```

L’application est disponible sur `http://localhost:4200/`.

Pour compiler le projet ou lancer les tests Angular :

```bash
npx ng build
npx ng test
```

## Intégration Firebase

Firebase est configuré avec le SDK JavaScript modulaire, directement dans l’application Angular standalone :

- `src/app/firebase.config.ts` contient la configuration du projet et les tokens d’injection Firebase.
- `src/app/app.config.ts` initialise l’application Firebase et enregistre les providers pour Firebase App, Authentication et Cloud Firestore.
- `src/app/services/firebase.service.ts` expose les instances et les opérations Firestore pour la collection `heros`.
- `src/app/data/hero.ts` définit les données d’un héros et les rangs `S`, `A`, `B`, `C` et `D`.

## Pages de l’application

- `/` et `/tier-list` affichent les héros chargés depuis Firestore, classés par rang. Les noms mènent à leur page de détails.
- `/heros/:id` affiche les caractéristiques détaillées d’un héros.
- `/ajouter` propose un formulaire réactif pour créer un héros. Après l’enregistrement, l’application redirige vers la Tier List.
- Si la collection Firestore `heros` est vide à l’ouverture de la Tier List, six héros de démonstration sont insérés une seule fois depuis `src/app/data/demo-heroes.ts`.

Pour Authentication, utilisez `this.firebase.auth` avec les fonctions correspondantes de `firebase/auth`.

La configuration Firebase inclut une clé API destinée à l’application cliente ; elle ne remplace pas les contrôles d’accès. Restreignez cette clé dans Google Cloud lorsque c’est possible et configurez les règles de sécurité Firestore ainsi que les méthodes autorisées dans Firebase Authentication.
