"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChefHat, ChevronLeft, Clock, Soup } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { OrderRecord, OrderStatus } from "@/lib/types";
import { subscribeToOrder } from "@/lib/firebase/firestore";
import { formatCurrency, getTableLabel } from "@/lib/utils";

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: "pending",   label: "Pending",   icon: <Clock   className="h-4 w-4" /> },
  { key: "preparing", label: "Preparing", icon: <ChefHat className="h-4 w-4" /> },
  { key: "served",    label: "Served",    icon: <Soup    className="h-4 w-4" /> },
];

function statusIndex(status: OrderStatus) {
  return STATUS_STEPS.findIndex((step) => step.key === status);
}

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const orderId = params?.orderId ?? "";
  const tableFromQuery = searchParams.get("table") ?? "";

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const unsubscribe = subscribeToOrder(
      orderId,
      (next) => {
        setOrder(next);
        setLoading(false);
        if (!next) setError("We couldn't find this order. It may have been removed.");
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [orderId]);

  const tableNumber = order?.tableNumber || tableFromQuery;
  const menuHref    = tableNumber ? `/menu?table=${tableNumber}` : "/menu";
  const orderShort  = orderId.slice(-6).toUpperCase();
  const stepIndex   = order ? statusIndex(order.status) : 0;

  return (
    <div className="phone-frame">
      <div
        style={{
          background:    "#121212",
          minHeight:     "100dvh",
          width:         "100%",
          maxWidth:      480,
          margin:        "0 auto",
          display:       "flex",
          flexDirection: "column",
          color:         "#fff",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 8px" }}>
          <Link
            href={menuHref}
            aria-label="Back to menu"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: 12, background: "#1e1e1e",
            }}
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Order Confirmed
          </p>
          <div style={{ width: 40 }} />
        </div>

        {/* Success animation */}
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0 8px" }}>
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 14, stiffness: 220, delay: 0.05 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 96, height: 96, borderRadius: "50%",
              background: "rgba(255,193,7,0.12)",
              border: "2px solid rgba(255,193,7,0.4)",
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", damping: 12, stiffness: 260 }}
            >
              <Check className="h-10 w-10" style={{ color: "#ffc107" }} strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          style={{ padding: "0 20px", textAlign: "center" }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Thank you!</h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#888" }}>
            Order <span style={{ color: "#ffc107", fontWeight: 700 }}>#{orderShort}</span>
            {tableNumber ? ` · ${getTableLabel(tableNumber)}` : ""}
          </p>
        </motion.div>

        {/* Content */}
        <div style={{ flex: 1, padding: "24px 20px 32px" }}>
          {loading ? (
            <div className="animate-pulse" style={{ background: "#1e1e1e", borderRadius: 20, height: 220 }} />
          ) : error ? (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 16, padding: 16, color: "#ef4444", fontSize: 13,
            }}>
              {error}
            </div>
          ) : order ? (
            <>
              {/* Live status tracker */}
              <div
                style={{
                  background: "#1e1e1e", borderRadius: 20, padding: 16, marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
                  Live Status
                </p>
                <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 8 }}>
                  {STATUS_STEPS.map((step, i) => {
                    const reached = i <= stepIndex;
                    const current = i === stepIndex;
                    return (
                      <div key={step.key} style={{ flex: 1 }}>
                        <motion.div
                          animate={{ background: reached ? "rgba(255,193,7,0.18)" : "#0e0e0e" }}
                          transition={{ duration: 0.3 }}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            padding: "10px 6px", borderRadius: 12,
                            border: current ? "1px solid rgba(255,193,7,0.6)" : "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <span style={{ color: reached ? "#ffc107" : "#555" }}>{step.icon}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: reached ? "#ffc107" : "#666" }}>
                            {step.label}
                          </span>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, color: "#888", marginTop: 12, lineHeight: 1.5 }}>
                  {order.status === "served"
                    ? "Enjoy your meal! 🍽️"
                    : order.status === "preparing"
                      ? "The kitchen is preparing your order."
                      : "We've received your order. Hang tight!"}
                </p>
              </div>

              {/* Items */}
              <div style={{ background: "#1e1e1e", borderRadius: 20, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0, marginBottom: 12 }}>
                  Order Summary
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>
                          {item.quantity} × {item.name}
                        </p>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#ffc107", margin: 0, whiteSpace: "nowrap" }}>
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Total</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#ffc107" }}>
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <p style={{ marginTop: 10, fontSize: 11, color: "#666" }}>Pay at counter when leaving.</p>
              </div>
            </>
          ) : null}

          <Link
            href={menuHref}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 20, padding: "14px 0", borderRadius: 16,
              background: "#ffc107", color: "#111", fontWeight: 700, fontSize: 14,
              boxShadow: "0 8px 24px rgba(255,193,7,0.35)",
            }}
          >
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
