import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { routes } from './app.routes';
import { FIREBASE_APP, FIREBASE_AUTH, firebaseConfig, FIRESTORE } from './firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: FIREBASE_APP,
      useFactory: () => initializeApp(firebaseConfig)
    },
    {
      provide: FIREBASE_AUTH,
      useFactory: getAuth,
      deps: [FIREBASE_APP]
    },
    {
      provide: FIRESTORE,
      useFactory: getFirestore,
      deps: [FIREBASE_APP]
    }
  ]
};
