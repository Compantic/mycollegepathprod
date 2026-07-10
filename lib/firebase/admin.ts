import { getApps, getApp, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import * as fs from "fs";

type ServiceAccount = { projectId: string; clientEmail: string; privateKey: string };

function normalizeServiceAccount(input: Record<string, unknown>): ServiceAccount | null {
  const projectId = (input.projectId ?? input.project_id) as string | undefined;
  const clientEmail = (input.clientEmail ?? input.client_email) as string | undefined;
  const privateKey = (input.privateKey ?? input.private_key) as string | undefined;

  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function getServiceAccount(): ServiceAccount | null {
  console.log("Firebase Admin: Checking for credentials...");

  // 1) Prefer base64-encoded service account JSON
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    try {
      const decoded = Buffer.from(base64, "base64").toString("utf8");
      const parsed = JSON.parse(decoded) as Record<string, unknown>;
      const normalized = normalizeServiceAccount(parsed);
      if (normalized) {
        console.log("Firebase Admin: Found FIREBASE_SERVICE_ACCOUNT_BASE64 env var");
        return normalized;
      }
      console.error("Firebase Admin: FIREBASE_SERVICE_ACCOUNT_BASE64 is missing required fields");
    } catch {
      console.error("Firebase Admin: Failed to decode or parse FIREBASE_SERVICE_ACCOUNT_BASE64");
    }
  }

  // 2) Single JSON string (e.g. FIREBASE_SERVICE_ACCOUNT_JSON)
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>;
      const normalized = normalizeServiceAccount(parsed);
      if (normalized) {
        console.log("Firebase Admin: Found FIREBASE_SERVICE_ACCOUNT_JSON env var");
        return normalized;
      }
      console.error("Firebase Admin: FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields");
    } catch {
      console.error("Firebase Admin: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON");
    }
  }

  // 3) Individual env vars (common on Vercel / Azure Container Apps)
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();
  if (projectId && clientEmail && privateKey) {
    const normalized = normalizeServiceAccount({
      projectId,
      clientEmail,
      privateKey,
    });
    if (normalized) {
      console.log("Firebase Admin: Found FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY");
      return normalized;
    }
    console.error("Firebase Admin: FIREBASE_ADMIN_* vars are present but invalid");
  }

  // 4) Local development fallback: key file in project root
  if (process.env.NODE_ENV === "production") {
    console.warn("Firebase Admin: No env-based service account found in production.");
    return null;
  }

  const keyPath = "serviceAccountKey.json";
  if (fs.existsSync(keyPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(keyPath, "utf8")) as Record<string, unknown>;
      const normalized = normalizeServiceAccount(parsed);
      if (normalized) {
        console.log("Firebase Admin: Found local service account file");
        return normalized;
      }
      console.error("Firebase Admin: Local service account file is missing required fields");
    } catch {
      console.error("Firebase Admin: Error reading local service account file");
    }
  }

  console.warn("Firebase Admin: No service account credentials found in environment or files.");
  return null;
}

function initApp() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log("Firebase Admin: Reusing existing app instance");
    return existingApps[0];
  }
  
  console.log("Firebase Admin: Starting fresh initialization...");
  try {
    const serviceAccount = getServiceAccount();
    if (serviceAccount) {
      console.log("Firebase Admin: Initializing with service account cert");
      return initializeApp({ credential: cert(serviceAccount) });
    }
  } catch (e) {
    console.error("Firebase Admin: Service account initialization failed", e);
  }

  console.log("Firebase Admin: Falling back to Application Default Credentials...");
  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId: "mycollegepath-660df", 
    });
  } catch (e) {
    console.error("Firebase Admin: Application Default Credentials fallback failed", e);
    // If we're here, initialization completely failed.
    // We return a "null" app or re-throw based on whether we want to crash the module load.
    // In Next.js, it's often better to throw so the 500 has a clear message in logs.
    throw new Error("Firebase Admin could not be initialized. Check your environment variables and service account key.");
  }
}

// Ensure app is initialized exactly once
const app = initApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
