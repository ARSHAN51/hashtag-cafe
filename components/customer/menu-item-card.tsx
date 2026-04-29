"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=65";

type MenuItemCardProps = {
  index?: number;
  item: MenuItem;
  onAdd: () => void;
  onTap: () => void;
};

export function MenuItemCard({ index = 0, item, onAdd, onTap }: MenuItemCardProps) {
  const unavailable = item.isAvailable === false;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay:    Math.min(index * 0.055, 0.25),
        duration: 0.34,
        ease:     [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: unavailable ? 1 : 0.96 }}
      onClick={unavailable ? undefined : onTap}
      style={{
        background:  "#1e1e1e",
        borderRadius: 20,
        padding:      12,
        boxShadow:   "0 4px 20px rgba(0,0,0,0.45)",
        cursor:       unavailable ? "not-allowed" : "pointer",
      }}
    >
      {/* ── Circular plate image ── */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 4, marginBottom: 12 }}>
        <div
          style={{
            position:     "relative",
            width:        108,
            height:       108,
            borderRadius: "50%",
            overflow:     "hidden",
            opacity:      unavailable ? 0.4 : 1,
            boxShadow:    "0 10px 28px rgba(0,0,0,0.6)",
          }}
        >
          <Image
            src={item.image || FALLBACK}
            alt={item.name}
            fill
            sizes="108px"
            className="object-cover"
          />
        </div>
      </div>

      {/* ── Name ── */}
      <h3
        className="line-clamp-2 text-center text-[13px] font-bold"
        style={{ color: unavailable ? "#555" : "#fff", lineHeight: "1.3" }}
      >
        {item.name}
      </h3>

      {/* ── Price + Add button ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#ffc107" }}>
          {formatCurrency(item.price)}
        </p>

        <motion.button
          type="button"
          aria-label={`Add ${item.name}`}
          whileTap={{ scale: 0.8 }}
          disabled={unavailable}
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            width:           30,
            height:          30,
            borderRadius:    "50%",
            background:      unavailable ? "#333" : "#ffc107",
            border:          "none",
            cursor:          unavailable ? "not-allowed" : "pointer",
            boxShadow:       unavailable ? "none" : "0 4px 12px rgba(255,193,7,0.4)",
          }}
        >
          <Plus className="h-4 w-4 stroke-[3]" style={{ color: unavailable ? "#666" : "#111" }} />
        </motion.button>
      </div>
    </motion.article>
  );
}
