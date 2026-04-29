"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BellRing, Home, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { isFirebaseConfigured } from "@/lib/env";
import { createWaiterRequest } from "@/lib/firebase/firestore";

type BottomNavProps = { tableNumber: string };

export function BottomNav({ tableNumber }: BottomNavProps) {
  const pathname  = usePathname();
  const { itemCount } = useCart();
  const [waiterLoading, setWaiterLoading] = useState(false);

  const menuHref = tableNumber ? `/menu?table=${tableNumber}` : "/menu";

  const handleCallWaiter = async () => {
    if (!tableNumber) {
      toast.error("Scan a table QR to call a waiter.");
      return;
    }
    if (!isFirebaseConfigured) {
      toast.error("App not configured.");
      return;
    }
    try {
      setWaiterLoading(true);
      await createWaiterRequest(tableNumber);
      toast.success("Waiter is on the way! ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not call waiter.");
    } finally {
      setWaiterLoading(false);
    }
  };

  const homeActive = pathname.startsWith("/menu");
  const cartActive = pathname === "/cart";

  return (
    /* Inline position:fixed guarantees mobile stickiness — class-based fixed
       can be overridden by parent transforms on some mobile browsers */
    <nav
      style={{
        position:        "fixed",
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          999,
        background:      "#1a1a1a",
        borderTop:       "1px solid rgba(255,255,255,0.06)",
        paddingBottom:   "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-around",
          height:         60,
          width:          "100%",
          maxWidth:       480,
          margin:         "0 auto",
          paddingLeft:    8,
          paddingRight:   8,
        }}
      >
        <Link
          href={menuHref}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 20px" }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40 }}>
            {homeActive && (
              <motion.div
                layoutId="nav-active"
                style={{ position: "absolute", inset: 0, borderRadius: 12, background: "rgba(255,193,7,0.12)" }}
              />
            )}
            <span style={{ position: "relative", color: homeActive ? "#ffc107" : "#666" }}>
              <Home className="h-[22px] w-[22px]" />
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: homeActive ? "#ffc107" : "#666" }}>Menu</span>
        </Link>

        <Link
          href="/cart"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 20px" }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40 }}>
            {cartActive && (
              <motion.div
                layoutId="nav-active"
                style={{ position: "absolute", inset: 0, borderRadius: 12, background: "rgba(255,193,7,0.12)" }}
              />
            )}
            <span style={{ position: "relative", color: cartActive ? "#ffc107" : "#666" }}>
              <div className="relative">
                <ShoppingBag className="h-[22px] w-[22px]" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-0.5 text-[9px] font-black text-black"
                    style={{ background: "#ffc107" }}
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </div>
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: cartActive ? "#ffc107" : "#666" }}>Cart</span>
        </Link>

        <button
          type="button"
          onClick={handleCallWaiter}
          disabled={waiterLoading}
          style={{
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            gap:            3,
            padding:        "8px 20px",
            background:     "transparent",
            border:         "none",
            cursor:         "pointer",
            opacity:        waiterLoading ? 0.6 : 1,
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40 }}>
            <span style={{ position: "relative", color: "#666" }}>
              <BellRing className="h-[22px] w-[22px]" />
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#666" }}>
            {waiterLoading ? "Calling…" : "Waiter"}
          </span>
        </button>
      </div>
    </nav>
  );
}
