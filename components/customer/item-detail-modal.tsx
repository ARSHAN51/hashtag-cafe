"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=70";

type Props = {
  item: MenuItem | null;
  onClose: () => void;
  onAdd: (item: MenuItem, qty: number) => void;
};

export function ItemDetailModal({ item, onClose, onAdd }: Props) {
  const [qty,      setQty     ] = useState(1);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Intentional: reset transient sheet state when a different item is
    // opened. A `key` prop on the parent would also work but adds churn
    // to the AnimatePresence enter/exit animation.
    if (item) { setQty(1); setExpanded(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  /* Block body scroll while sheet is open */
  useEffect(() => {
    document.body.style.overflow = item ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  const handleAdd = () => {
    if (!item) return;
    onAdd(item, qty);
    onClose();
  };

  const desc      = item?.description ?? "";
  const truncated = desc.slice(0, 100);
  const hasMore   = desc.length > 100;

  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          key="detail"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 34, stiffness: 310, mass: 0.85 }}
          style={{
            position:      "fixed",
            inset:         0,
            zIndex:        1000,
            background:    "#121212",
            display:       "flex",
            flexDirection: "column",
            maxWidth:      480,
            margin:        "0 auto",
            overflowY:     "auto",
          }}
        >
          {/* ── TOP BAR: back · spacer ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 8px" }}>
            <motion.button
              type="button"
              aria-label="Back"
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              style={{
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                width:           40,
                height:          40,
                borderRadius:    12,
                background:      "#1e1e1e",
                border:          "none",
                cursor:          "pointer",
              }}
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </motion.button>

            {/* Spacer balances the flex row */}
            <div style={{ width: 40 }} />
          </div>

          {/* ── LARGE CIRCULAR IMAGE ── */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 20px" }}>
            <motion.div
              initial={{ scale: 0.72, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.06, duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position:     "relative",
                width:        "min(70vw, 240px)",
                height:       "min(70vw, 240px)",
                borderRadius: "50%",
                overflow:     "hidden",
                boxShadow:    "0 24px 56px rgba(0,0,0,0.75), 0 0 0 4px rgba(255,255,255,0.05)",
              }}
            >
              <Image
                src={item.image || FALLBACK}
                alt={item.name}
                fill
                sizes="240px"
                className="object-cover"
                priority
              />
            </motion.div>
          </div>

          {/* ── CONTENT ── */}
          <div style={{ flex: 1, padding: "0 20px 140px" }}>

            {/* Veg indicator + category + popular badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  display:         "inline-flex",
                  alignItems:      "center",
                  gap:             6,
                  padding:         "4px 10px",
                  borderRadius:    20,
                  background:      item.type === "veg" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                }}
              >
                <span
                  style={{
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    width:           14,
                    height:          14,
                    borderRadius:    3,
                    border:          `2px solid ${item.type === "veg" ? "#22c55e" : "#ef4444"}`,
                  }}
                >
                  <span
                    style={{
                      width:        6,
                      height:       6,
                      borderRadius: "50%",
                      background:   item.type === "veg" ? "#22c55e" : "#ef4444",
                    }}
                  />
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: item.type === "veg" ? "#22c55e" : "#ef4444" }}>
                  {item.type === "veg" ? "Veg" : "Non-Veg"}
                </span>
              </span>

              <span style={{ fontSize: 11, fontWeight: 600, color: "#888", padding: "4px 10px", borderRadius: 20, background: "#1e1e1e" }}>
                {item.category}
              </span>

              {item.popular ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#ffc107", background: "rgba(255,193,7,0.12)", borderRadius: 20, padding: "4px 10px" }}>
                  🔥 Popular
                </span>
              ) : null}
            </div>

            {/* Name + Price */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.25, flex: 1, margin: 0 }}>
                {item.name}
              </h2>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#ffc107", whiteSpace: "nowrap", margin: 0 }}>
                {formatCurrency(item.price)}
              </p>
            </div>

            {/* Description (only if real description present) */}
            {desc ? (
              <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: "#888" }}>
                {expanded || !hasMore ? desc : truncated + "…"}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    style={{ marginLeft: 4, color: "#ffc107", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                  >
                    {expanded ? "Show less" : "Read More"}
                  </button>
                )}
              </p>
            ) : null}
          </div>

          {/* ── FIXED BOTTOM: Qty + Add to Cart ── */}
          <div
            style={{
              position:    "fixed",
              bottom:      0,
              left:        "50%",
              transform:   "translateX(-50%)",
              width:       "100%",
              maxWidth:    480,
              zIndex:      1001,
              display:     "flex",
              alignItems:  "center",
              gap:         12,
              padding:     "16px 20px",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
              background:  "#121212",
              borderTop:   "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Quantity */}
            <div
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            12,
                background:     "#1e1e1e",
                borderRadius:   16,
                padding:        "10px 14px",
                border:         "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <motion.button
                type="button"
                aria-label="Decrease"
                whileTap={{ scale: 0.8 }}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, background: "#2a2a2a", border: "none", cursor: "pointer", opacity: qty <= 1 ? 0.3 : 1 }}
              >
                <Minus className="h-3.5 w-3.5 text-white" />
              </motion.button>

              <span style={{ minWidth: 24, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                {qty}
              </span>

              <motion.button
                type="button"
                aria-label="Increase"
                whileTap={{ scale: 0.8 }}
                onClick={() => setQty((q) => q + 1)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, background: "#ffc107", border: "none", cursor: "pointer" }}
              >
                <Plus className="h-3.5 w-3.5 stroke-[3] text-black" />
              </motion.button>
            </div>

            {/* Add to Cart */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={handleAdd}
              disabled={item.isAvailable === false}
              style={{
                flex:            1,
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                gap:             8,
                padding:         "14px 0",
                borderRadius:    16,
                background:      "#ffc107",
                border:          "none",
                cursor:          "pointer",
                fontSize:        14,
                fontWeight:      700,
                color:           "#111",
                boxShadow:       "0 8px 24px rgba(255,193,7,0.35)",
                opacity:         item.isAvailable === false ? 0.4 : 1,
              }}
            >
              <ShoppingBag className="h-5 w-5" />
              Add To Cart · {formatCurrency(item.price * qty)}
            </motion.button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
