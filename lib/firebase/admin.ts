import { getApps, getApp, initializeApp, cert } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

type ServiceAccount = { projectId: string; clientEmail: string; privateKey: string };

function getServiceAccount(): ServiceAccount {
  // 1) Prefer FIREBASE_ADMIN_* env vars (e.g. Vercel)
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }

  // 2) Single JSON string (e.g. FIREBASE_SERVICE_ACCOUNT_JSON)
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as ServiceAccount;
      if (parsed.privateKey) parsed.privateKey = parsed.privateKey.replace(/\\n/g, "\n");
      return parsed;
    } catch {
      // fall through to file
    }
  }

  // 3) Key file in project root
  const keyPaths = [
    path.join(process.cwd(), "serviceAccountKey.json"),
    path.join(process.cwd(), "mycollegepath-660df-firebase-adminsdk-fbsvc-2cd7856a32.json"),
  ];
  for (const keyPath of keyPaths) {
    if (fs.existsSync(keyPath)) {
      const parsed = JSON.parse(fs.readFileSync(keyPath, "utf8")) as ServiceAccount;
      if (parsed.privateKey) parsed.privateKey = parsed.privateKey.replace(/\\n/g, "\n");
      return parsed;
    }
  }

  throw new Error(
    "Firebase Admin: set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_JSON, or add serviceAccountKey.json"
  );
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  const credential = cert(getServiceAccount());
  return initializeApp({ credential });
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

export const adminAuth = withLazyInit<Auth>(() => getAuth(getAdminApp()));
export const adminDb = withLazyInit<Firestore>(() => getFirestore(getAdminApp()));
