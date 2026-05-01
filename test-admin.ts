import { adminAuth, adminDb } from "./lib/firebase/admin";
async function run() {
  try {
    console.log("Calling verifyIdToken...");
    await adminAuth.verifyIdToken("invalid-token");
  } catch (e) {
    console.error("verifyIdToken threw:", e);
  }
}
run();
