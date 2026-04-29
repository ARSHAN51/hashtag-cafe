"use client";

import { useEffect, useState } from "react";
import { subscribeToTables } from "@/lib/firebase/firestore";
import type { TableRecord } from "@/lib/types";

export function useTables() {
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToTables(
      (nextTables) => {
        setTables(nextTables);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    error,
    loading,
    tables,
  };
}
