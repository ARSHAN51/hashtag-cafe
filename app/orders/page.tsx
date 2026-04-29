"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { BottomNav } from "@/components/customer/bottom-nav";
import { useOrders } from "@/hooks/use-orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";

/* ─── Status badge colours ─── */
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "rgba(255,193,7,0.15)",  color: "#ffc107", label: "⏳ Pending"   },
  preparing: { bg: "rgba(255,165,0,0.15)",  color: "#ffa500", label: "👨‍🍳 Preparing" },
  served:    { bg: "rgba(34,197,94,0.15)",  color: "#22c55e", label: "✅ Served"    },
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const tableNumber  = searchParams.get("table")?.trim() ?? "";
  const { orders, loading, error } = useOrders();
  const [, forceRefresh] = useState(0);

  const menuHref = tableNumber ? `/menu?table=${tableNumber}` : "/menu";

  /* Filter to this table only */
  const tableOrders = useMemo(
    () => orders.filter((o) => !tableNumber || o.tableNumber === tableNumber),
    [orders, tableNumber],
  );

  return (
    <div
      style={{
        background:    "#121212",
        minHeight:     "100dvh",
        maxWidth:      420,
        margin:        "0 auto",
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 20px 16px" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ffc107" }}>
            HashTag Cafe
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginTop: 2 }}>
            {tableNumber ? `Table ${tableNumber} — Orders` : "My Orders"}
          </h1>
        </div>

        {/* Refresh */}
        <button
          type="button"
          aria-label="Refresh"
          onClick={() => forceRefresh((n) => n + 1)}
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            width:          40,
            height:         40,
            borderRadius:   12,
            background:     "#1e1e1e",
            border:         "none",
            cursor:         "pointer",
          }}
        >
          <RefreshCw className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ padding: "0 20px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{ background: "#1e1e1e", borderRadius: 16, padding: 16, marginBottom: 12, height: 120 }}
            />
          ))}
        </div>
      ) : null}

      {/* Error */}
      {!loading && error ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>
          <Link
            href={menuHref}
            style={{
              display:      "inline-block",
              marginTop:    16,
              background:   "#ffc107",
              color:        "#111",
              borderRadius: 16,
              padding:      "10px 24px",
              fontWeight:   700,
              fontSize:     14,
            }}
          >
            Back to Menu
          </Link>
        </div>
      ) : null}

      {/* Empty */}
      {!loading && !error && tableOrders.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 56, marginBottom: 16 }}>🍽️</span>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>No orders yet</p>
          <p style={{ fontSize: 14, color: "#777", marginBottom: 24 }}>
            {tableNumber ? `Orders for Table ${tableNumber} will appear here.` : "Your orders will appear here."}
          </p>
          <Link
            href={menuHref}
            style={{
              background:   "#ffc107",
              color:        "#111",
              borderRadius: 16,
              padding:      "12px 28px",
              fontWeight:   700,
              fontSize:     14,
            }}
          >
            Browse Menu
          </Link>
        </div>
      ) : null}

      {/* Order list */}
      {!loading && !error && tableOrders.length > 0 ? (
        <AnimatePresence initial={false}>
          <div style={{ padding: "0 20px" }}>
            {tableOrders.map((order, i) => {
              const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  style={{
                    background:   "#1e1e1e",
                    borderRadius: 18,
                    padding:      16,
                    marginBottom: 12,
                  }}
                >
                  {/* Order header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                        Table {order.tableNumber}
                      </p>
                      <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize:     11,
                        fontWeight:   700,
                        color:        s.color,
                        background:   s.bg,
                        borderRadius: 20,
                        padding:      "4px 10px",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                    {order.items.map((item) => (
                      <div
                        key={`${order.id}-${item.id}`}
                        style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                      >
                        <span style={{ fontSize: 13, color: "#ccc" }}>
                          {item.quantity}× {item.name}
                        </span>
                        <span style={{ fontSize: 13, color: "#ffc107", fontWeight: 600 }}>
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div
                    style={{
                      display:       "flex",
                      justifyContent:"space-between",
                      marginTop:     10,
                      paddingTop:    10,
                      borderTop:     "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#888" }}>Total</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#ffc107" }}>
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      ) : null}

      <BottomNav tableNumber={tableNumber} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: "#121212", minHeight: "100dvh" }}>
          <div style={{ padding: "24px 20px" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ background: "#1e1e1e", borderRadius: 16, height: 120, marginBottom: 12 }}
              />
            ))}
          </div>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
