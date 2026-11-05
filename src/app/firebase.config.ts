import { InjectionToken } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyB5ds_37fOUr4BYUocyZQgVcBbwgT-fjhM',
  authDomain: 'projet-duel-de-heros.firebaseapp.com',
  projectId: 'projet-duel-de-heros',
  storageBucket: 'projet-duel-de-heros.firebasestorage.app',
  messagingSenderId: '1055457994326',
  appId: '1:1055457994326:web:3ee0b92ddd1365d02bbdf7'
};

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');