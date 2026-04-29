"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import type { MenuItem } from "@/lib/types";

const MENU_LOAD_TIMEOUT_MS = 12000;

const TIMEOUT_MESSAGE =
  "Menu took too long to load. Check your internet connection, " +
  "verify Firestore rules are deployed, and confirm Firebase env vars in .env.local.";

const PERMISSION_DENIED_MESSAGE =
  "Menu cannot be loaded right now. Please ask staff for help. " +
  "(Firestore rules need to be deployed.)";

const NOT_CONFIGURED = "Firebase not configured. Check .env.local";

const isDev = process.env.NODE_ENV !== "production";

function describeError(err: unknown): string {
  // Firestore errors expose `code` like "permission-denied", "unavailable" …
  const code = (err as { code?: string } | null)?.code;
  if (code === "permission-denied") return PERMISSION_DENIED_MESSAGE;
  if (code === "unavailable")
    return "Can't reach the menu service. Check your internet connection and retry.";
  if (err instanceof Error) return err.message;
  return "Failed to load menu. Check your connection and try again.";
}

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  // Lazy init avoids `react-hooks/set-state-in-effect` for the missing-config
  // early-return case below.
  const [loading, setLoading] = useState<boolean>(() => Boolean(firestoreDb));
  const [error, setError] = useState<string | null>(() =>
    firestoreDb ? null : NOT_CONFIGURED,
  );
  // Bumping `nonce` re-runs the effect — used by `refresh()` to force a
  // fresh getDocs + new onSnapshot listener (escape hatch for stale IDB cache).
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!firestoreDb) {
      if (isDev) {
        console.warn(
          "[useMenuItems] firestoreDb is null — Firebase env vars missing in .env.local",
        );
      }
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setError(TIMEOUT_MESSAGE);
      setLoading(false);
    }, MENU_LOAD_TIMEOUT_MS);

    const fetchData = async () => {
      try {
        // STEP 1: getDocs — instant, reliable on mobile
        const snapshot = await getDocs(collection(firestoreDb!, "menu"));
        if (cancelled) return;

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<MenuItem, "id">),
        })) as MenuItem[];

        window.clearTimeout(timeoutId);
        setMenuItems(data);
        setError(null);
        setLoading(false);

        if (isDev) {
          console.info(
            `[useMenuItems] getDocs OK — ${data.length} item(s) from Firestore`,
          );
        }

        // STEP 2: onSnapshot — real-time updates after initial load
        unsubscribe = onSnapshot(
          collection(firestoreDb!, "menu"),
          (snap) => {
            const live = snap.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<MenuItem, "id">),
            })) as MenuItem[];
            setMenuItems(live);
          },
          (snapshotError) => {
            // Live updates failed AFTER the initial getDocs already populated
            // UI. We surface a soft warning instead of replacing the list,
            // so the user sees something rather than a blank page.
            if (isDev) {
              console.error("[useMenuItems] onSnapshot error:", snapshotError);
            }
            const friendly = describeError(snapshotError);
            // Only set error when permission-denied — for transient
            // disconnects we keep the cached list visible.
            if ((snapshotError as { code?: string }).code === "permission-denied") {
              setError(friendly);
              setLoading(false);
            }
          },
        );
      } catch (err) {
        if (cancelled) return;
        window.clearTimeout(timeoutId);
        if (isDev) {
          console.error("[useMenuItems] getDocs failed:", err);
        }
        // Always set loading=false alongside error so the skeleton stops.
        setError(describeError(err));
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, [nonce]);

  return { menuItems, loading, error, refresh };
}
