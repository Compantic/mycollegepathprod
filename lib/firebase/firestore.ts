import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "./client";

const USERS = "users";
const STUDENT_PROFILES = "studentProfiles";
const SAVED_COLLEGES = "savedColleges";
const CHAT_SESSIONS = "chatSessions";
const USER_FAVORITES_SUBCOLLECTION = "favorites";
const USER_COLLEGE_NOTES_SUBCOLLECTION = "collegeNotes";
const USER_ESSAYS_SUBCOLLECTION = "essays";
const USER_CHAT_SESSIONS_SUBCOLLECTION = "chatSessions";

export interface EssayDoc {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  /** Last analysis result (optional), stored when user runs AI Coach */
  analysis?: unknown;
}

export interface StudentProfile {
  userId: string;
  displayName?: string;
  /** Profile photo URL (from Firebase Storage users/{uid}/profile.jpg). */
  profilePhotoUrl?: string;
  graduationYear?: number;
  gpa?: number;
  satScore?: number;
  actScore?: number;
  preferredMajors?: string[];
  preferredStates?: string[];
  preferredSize?: "small" | "medium" | "large";
  createdAt: string;
  updatedAt: string;
}

export interface SavedCollege {
  userId: string;
  collegeId: string;
  name: string;
  savedAt: string;
}

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const ref = doc(db, STUDENT_PROFILES, userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as StudentProfile) : null;
}

/** Firestore does not accept undefined; strip undefined keys before write. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: T[K] } {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out as { [K in keyof T]: T[K] };
}

export async function setStudentProfile(userId: string, data: Partial<StudentProfile>): Promise<void> {
  const ref = doc(db, STUDENT_PROFILES, userId);
  const existing = await getDoc(ref);
  const now = new Date().toISOString();
  const clean = stripUndefined({ ...data, updatedAt: now });
  if (existing.exists()) {
    await updateDoc(ref, clean);
  } else {
    await setDoc(ref, stripUndefined({ userId, ...clean, createdAt: now }));
  }
}

export async function getSavedColleges(userId: string): Promise<SavedCollege[]> {
  const q = query(collection(db, SAVED_COLLEGES), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => d.data() as SavedCollege);
  list.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
  return list;
}

export async function saveCollege(userId: string, collegeId: string, name: string): Promise<void> {
  const id = `${userId}_${collegeId}`;
  const ref = doc(db, SAVED_COLLEGES, id);
  await setDoc(ref, { userId, collegeId, name, savedAt: new Date().toISOString() });
}

export async function unsaveCollege(userId: string, collegeId: string): Promise<void> {
  const ref = doc(db, SAVED_COLLEGES, `${userId}_${collegeId}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
  }
}

export async function addFavoriteCollege(userId: string, collegeId: number, name: string): Promise<void> {
  const ref = doc(db, USERS, userId, USER_FAVORITES_SUBCOLLECTION, String(collegeId));
  await setDoc(ref, {
    collegeId,
    name,
    createdAt: new Date().toISOString(),
  }, { merge: true });
}

export async function removeFavoriteCollege(userId: string, collegeId: number): Promise<void> {
  const ref = doc(db, USERS, userId, USER_FAVORITES_SUBCOLLECTION, String(collegeId));
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
  }
}

export async function getFavoriteColleges(userId: string): Promise<{ collegeId: number; name: string }[]> {
  const colRef = collection(db, USERS, userId, USER_FAVORITES_SUBCOLLECTION);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({
    collegeId: Number(d.data().collegeId),
    name: String(d.data().name ?? ""),
  }));
}

export async function getCollegeNote(userId: string, collegeId: number): Promise<{ content: string; updatedAt: string } | null> {
  const ref = doc(db, USERS, userId, USER_COLLEGE_NOTES_SUBCOLLECTION, String(collegeId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return { content: String(d?.content ?? ""), updatedAt: String(d?.updatedAt ?? "") };
}

export async function setCollegeNote(userId: string, collegeId: number, content: string): Promise<void> {
  const ref = doc(db, USERS, userId, USER_COLLEGE_NOTES_SUBCOLLECTION, String(collegeId));
  await setDoc(ref, { content, updatedAt: new Date().toISOString() }, { merge: true });
}

// ——— Essays (subcollection: users/{userId}/essays/{essayId}) ———
export async function listEssays(userId: string): Promise<EssayDoc[]> {
  const colRef = collection(db, USERS, userId, USER_ESSAYS_SUBCOLLECTION);
  const q = query(colRef, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EssayDoc));
}

export async function getEssay(userId: string, essayId: string): Promise<EssayDoc | null> {
  const ref = doc(db, USERS, userId, USER_ESSAYS_SUBCOLLECTION, essayId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as EssayDoc;
}

export async function createEssay(
  userId: string,
  name: string,
  content: string,
  analysis?: unknown
): Promise<string> {
  const colRef = collection(db, USERS, userId, USER_ESSAYS_SUBCOLLECTION);
  const ref = doc(colRef);
  const now = new Date().toISOString();
  await setDoc(ref, stripUndefined({ name, content, analysis, createdAt: now, updatedAt: now }));
  return ref.id;
}

export async function updateEssay(
  userId: string,
  essayId: string,
  data: { name?: string; content?: string; analysis?: unknown }
): Promise<void> {
  const ref = doc(db, USERS, userId, USER_ESSAYS_SUBCOLLECTION, essayId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const now = new Date().toISOString();
  const payload = stripUndefined({ ...data, updatedAt: now });
  await updateDoc(ref, payload);
}

export async function deleteEssay(userId: string, essayId: string): Promise<void> {
  const ref = doc(db, USERS, userId, USER_ESSAYS_SUBCOLLECTION, essayId);
  await deleteDoc(ref);
}

// ——— Chat sessions (AI Consultant): users/{userId}/chatSessions/{sessionId} ———
export interface ChatSessionDoc {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  createdAt: string;
  updatedAt: string;
}

export async function listChatSessions(userId: string): Promise<ChatSessionDoc[]> {
  const colRef = collection(db, USERS, userId, USER_CHAT_SESSIONS_SUBCOLLECTION);
  const snap = await getDocs(colRef);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatSessionDoc));
  list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return list;
}

export async function getChatSession(userId: string, sessionId: string): Promise<ChatSessionDoc | null> {
  const ref = doc(db, USERS, userId, USER_CHAT_SESSIONS_SUBCOLLECTION, sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ChatSessionDoc;
}

export async function createChatSession(
  userId: string,
  title: string,
  messages: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const colRef = collection(db, USERS, userId, USER_CHAT_SESSIONS_SUBCOLLECTION);
  const ref = doc(colRef);
  const now = new Date().toISOString();
  await setDoc(ref, { title, messages, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateChatSession(
  userId: string,
  sessionId: string,
  data: { title?: string; messages?: { role: "user" | "assistant"; content: string }[] }
): Promise<void> {
  const ref = doc(db, USERS, userId, USER_CHAT_SESSIONS_SUBCOLLECTION, sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const now = new Date().toISOString();
  const payload = stripUndefined({ ...data, updatedAt: now });
  await updateDoc(ref, payload);
}

export async function deleteChatSession(userId: string, sessionId: string): Promise<void> {
  const ref = doc(db, USERS, userId, USER_CHAT_SESSIONS_SUBCOLLECTION, sessionId);
  await deleteDoc(ref);
}

export { db, USERS, STUDENT_PROFILES, SAVED_COLLEGES, CHAT_SESSIONS };
