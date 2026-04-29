"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import type { OrderRecord } from "@/lib/types";
import { sortOrders } from "@/lib/utils";

const TODAY_LIMIT = 200;

function toOrder(doc: { id: string; data: () => Record<string, unknown> }): OrderRecord {
  const d = doc.data();
  const rawItems = Array.isArray(d.items) ? d.items : [];
  return {
    id: doc.id,
    tableNumber: String(d.tableNumber ?? ""),
    totalAmount: Number(d.totalAmount ?? 0),
    status: (d.status === "preparing" || d.status === "served") ? d.status : "pending",
    createdAt: d.createdAt && typeof (d.createdAt as { toDate?: unknown }).toDate === "function"
      ? (d.createdAt as { toDate: () => Date }).toDate()
      : null,
    items: rawItems.map((item: unknown, i: number) => {
      const it = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return {
        id: String(it.id ?? `${doc.id}-${i}`),
        name: String(it.name ?? "Item"),
        quantity: Number(it.quantity ?? 1),
        price: Number(it.price ?? 0),
        image: typeof it.image === "string" ? it.image : undefined,
      };
    }),
  };
}

// Today-only window: orders created since 00:00 local time, newest first,
// capped at 200. Requires a composite index on `createdAt` — Firebase will
// auto-prompt to create it on first query (link appears in the console error).
function buildTodayQuery() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return query(
    collection(firestoreDb!, "orders"),
    where("createdAt", ">=", startOfToday),
    orderBy("createdAt", "desc"),
    limit(TODAY_LIMIT),
  );
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(() => Boolean(firestoreDb));
  const [error, setError] = useState<string | null>(() =>
    firestoreDb ? null : "Firebase not configured. Check .env.local",
  );

  useEffect(() => {
    if (!firestoreDb) return;

    let unsubscribe: (() => void) | undefined;

    const fetchData = async () => {
      try {
        const todayQuery = buildTodayQuery();
        const snapshot = await getDocs(todayQuery);
        const data = sortOrders(snapshot.docs.map(toOrder));
        setOrders(data);
        setLoading(false);

        unsubscribe = onSnapshot(
          todayQuery,
          (snap) => setOrders(sortOrders(snap.docs.map(toOrder))),
          (err) => console.warn("[useOrders] snapshot error:", err.message),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders.");
        setLoading(false);
      }
    };

    fetchData();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  return { orders, loading, error };
}
