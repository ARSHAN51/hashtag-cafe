import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";
import { firebasePublicConfig, isFirebaseConfigured } from "@/lib/env";

// ─── Firebase app ───────────────────────────────────────────────────────────
const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebasePublicConfig)
  : null;

export const firebaseApp  = app;
export const firebaseAuth = app ? getAuth(app) : null;

// ─── Firestore ───────────────────────────────────────────────────────────────
// Primary: persistentLocalCache (IndexedDB) for offline-first reads.
// Fallback: in-memory getFirestore(app) — used when IndexedDB is unavailable
// (iOS private mode, locked storage, broken IDB) so onSnapshot keeps working.
//
// NOTE: once initializeFirestore has been called for an app you cannot call
// it again — the second call throws "already initialized". The fallback path
// must use getFirestore(app), which returns whatever instance exists or a
// fresh in-memory one.
function createFirestore() {
  if (!app) return null;

  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({}),
      }),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[firestore] persistent cache unavailable, falling back to in-memory:",
        err,
      );
    }
    return getFirestore(app);
  }
}

export const firestoreDb = createFirestore();

if (process.env.NODE_ENV !== "production" && !firestoreDb) {
  console.warn(
    "[firestore] firestoreDb is null — Firebase env vars are missing. " +
      "Check .env.local for NEXT_PUBLIC_FIREBASE_* keys.",
  );
}
