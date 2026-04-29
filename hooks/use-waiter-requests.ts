"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import type { WaiterRequest } from "@/lib/types";

function toWaiter(doc: { id: string; data: () => Record<string, unknown> }): WaiterRequest {
  const d = doc.data();
  return {
    id: doc.id,
    tableNumber: String(d.tableNumber ?? ""),
    status: d.status === "completed" ? "completed" : "pending",
    createdAt: d.createdAt && typeof (d.createdAt as { toDate?: unknown }).toDate === "function"
      ? (d.createdAt as { toDate: () => Date }).toDate()
      : null,
  };
}

export function useWaiterRequests() {
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(() => Boolean(firestoreDb));
  const [error, setError] = useState<string | null>(() =>
    firestoreDb ? null : "Firebase not configured. Check .env.local",
  );

  useEffect(() => {
    if (!firestoreDb) return;

    let unsubscribe: (() => void) | undefined;

    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(firestoreDb!, "waiterRequests"));
        const sorted = snapshot.docs.map(toWaiter)
          .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setRequests(sorted);
        setLoading(false);

        unsubscribe = onSnapshot(
          collection(firestoreDb!, "waiterRequests"),
          (snap) => {
            const live = snap.docs.map(toWaiter)
              .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
            setRequests(live);
          },
          (err) => console.warn("[useWaiterRequests] snapshot error:", err.message),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load waiter requests.");
        setLoading(false);
      }
    };

    fetchData();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  return { requests, loading, error };
}
