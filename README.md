# Tour of Heroes

Application Angular standalone dont les héros sont stockés dans la collection Firestore `heros`.

## Pages

- `/` redirige vers `/tier-list`, qui charge et groupe les héros par rang.
- `/ajouter` permet de créer un héros et ouvre sa fiche après l’enregistrement.
- `/heros/:id` permet de consulter, modifier ou supprimer un héros.

## Développement

```bash
npm install
npm start
```

Compiler avec `npx ng build` et lancer les tests avec `npx ng test`.

La configuration Firebase est dans `src/app/firebase.config.ts`. Les règles Firestore doivent autoriser les lectures et écritures nécessaires. Les documents historiques sans rang valide sont migrés au rang `C` lors du chargement de la Tier List.
