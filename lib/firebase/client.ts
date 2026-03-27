import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * When NEXT_PUBLIC_FIREBASE_* is missing (e.g. GitHub Actions without secrets),
 * Firebase Auth throws auth/invalid-api-key during static generation. A format-valid
 * placeholder config allows `next build` to complete; real deployments must set env vars.
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

function withLazyInit<T>(factory: () => T): T {
  return new Proxy({} as object, {
    get(_target, prop, receiver) {
      const instance = factory() as Record<string | symbol, unknown>;
      const value = Reflect.get(instance, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  }) as T;
}

export const app = withLazyInit<FirebaseApp>(() => getOrCreateApp());
export const auth = withLazyInit<Auth>(() => getAuth(getOrCreateApp()));
export const db = withLazyInit<Firestore>(() => getFirestore(getOrCreateApp()));
export const storage = withLazyInit<FirebaseStorage>(() => getStorage(getOrCreateApp()));
