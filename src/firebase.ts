import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Defensive validation to prevent "The string did not match the expected pattern"
const requiredFields: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingFields = requiredFields.filter((field) => !firebaseConfig[field] || firebaseConfig[field].includes('YOUR_'));

export const isFirebaseConfigured = missingFields.length === 0;
export const firebaseMissingError = isFirebaseConfigured
  ? null
  : `Configuração Firebase incompleta: ${missingFields.join(', ')}.`;

if (!isFirebaseConfigured && import.meta.env.DEV) {
  console.error(firebaseMissingError);
}

// Initialize Firebase SDK
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Enable local persistence so session remains between refreshes and device sync
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Could not set auth persistence:', err);
  });
} catch {
  // Ignore in environments where window is unavailable
}

// Connect to specific firestore database if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export default app;
