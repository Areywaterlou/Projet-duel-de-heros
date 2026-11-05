import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { firebaseConfig, FIRESTORE } from './firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: FIRESTORE,
      useFactory: async () => {
        const [firebaseApp, firestoreSdk] = await Promise.all([
          import('firebase/app'),
          import('firebase/firestore')
        ]);
        const app = firebaseApp.getApps().length
          ? firebaseApp.getApp()
          : firebaseApp.initializeApp(firebaseConfig);
        return firestoreSdk.getFirestore(app);
      }
    }
  ]
};
