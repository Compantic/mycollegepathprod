import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * When NEXT_PUBLIC_FIREBASE_* is missing (e.g. GitHub Actions without secrets),
 * a format-valid placeholder allows `next build` to complete; real deployments must set env vars.
 */
const BUILD_PLACEHOLDER_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyCiBuildPlaceholder00000000000000000000",
  authDomain: "ci-build-placeholder.firebaseapp.com",
  projectId: "ci-build-placeholder",
  storageBucket: "ci-build-placeholder.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:ci00000000000000000000",
};

function resolveFirebaseConfig(): FirebaseOptions {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (apiKey) {
    return {
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
  }
  return BUILD_PLACEHOLDER_CONFIG;
}

function getOrCreateApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0] as FirebaseApp;
  }
  return initializeApp(resolveFirebaseConfig());
}

/**
 * Do not wrap `db` or `storage` in Proxy: Firestore `collection(db, ...)` requires a real
 * Firestore instance (instanceof check), not a Proxy.
 */
const app = getOrCreateApp();
export { app };
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

/** False when NEXT_PUBLIC_FIREBASE_API_KEY is missing — real sign-in will not work (build placeholder only). */
export function isFirebaseClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim());
}
