import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

/**
 * Firebase Configuration — HealthConnect Web
 *
 * Loaded from environment variables (.env) so API keys are not committed to Git.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider (used for Patient/Doctor Google sign-in)
export const googleProvider = new GoogleAuthProvider();

// Cloud Firestore with forced long-polling for network resilience (per architecture.md)
export const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export default app;
