// ============================================================
// GhostRoom Firebase Configuration
// Replace all placeholder values with your Firebase project
// credentials from console.firebase.google.com
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCCQkLUGcK45PTQJNeckKmplWE6eUseUfA",
  authDomain: "ghostroom-app.firebaseapp.com",
  projectId: "ghostroom-app",
  storageBucket: "ghostroom-app.firebasestorage.app",
  messagingSenderId: "309036531123",
  appId: "1:309036531123:web:fda5c57be3bf96dc8e9fc6",
  measurementId: "G-LC8E79R52S"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
