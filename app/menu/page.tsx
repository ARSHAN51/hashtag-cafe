"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BottomNav } from "@/components/customer/bottom-nav";
import { CategoryTabs } from "@/components/customer/category-tabs";
import { ItemDetailModal } from "@/components/customer/item-detail-modal";
import { MenuItemCard } from "@/components/customer/menu-item-card";
import { SocialLinks } from "@/components/customer/social-links";
import { useCart } from "@/components/providers/cart-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { FirebaseSetupAlert } from "@/components/shared/firebase-setup-alert";
import { useMenuItems } from "@/hooks/use-menu-items";
import { APP_NAME } from "@/lib/constants";
import { isFirebaseConfigured } from "@/lib/env";
import { createWaiterRequest } from "@/lib/firebase/firestore";
import type { MenuItem } from "@/lib/types";

/* ─── Loading skeleton (2-col circular cards) ─── */
function MenuSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ background: "#1e1e1e", borderRadius: 20, padding: 12, height: 200 }}
        >
          <div
            style={{
              width: 108, height: 108, borderRadius: "50%",
              background: "rgba(255,193,7,0.06)", margin: "0 auto 12px",
            }}
          />
          <div style={{ height: 12, width: "70%", margin: "0 auto 10px", borderRadius: 8, background: "#2a2a2a" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ height: 12, width: 48, borderRadius: 8, background: "#2a2a2a" }} />
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,193,7,0.1)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Empty-state for /menu — disambiguates rules/availability/filter cases ─── */
function EmptyTopState({
  search,
  menuCount,
  availableCount,
  onReload,
}: {
  search: string;
  menuCount: number;
  availableCount: number;
  onReload: () => void;
}) {
  if (search) {
    return (
      <EmptyState
        title="No results found"
        description="Try a different search term or clear the filter."
      />
    );
  }

  if (menuCount === 0) {
    return (
      <div>
        <EmptyState
          title="Menu is being prepared"
          description="If this persists, please ask staff for help."
        />
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button
            type="button"
            onClick={onReload}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 999,
              background: "rgba(255,193,7,0.12)", color: "#ffc107",
              border: "1px solid rgba(255,193,7,0.4)", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Reload menu
          </button>
        </div>
      </div>
    );
  }

  if (availableCount === 0) {
    return (
      <EmptyState
        title="All items are currently unavailable"
        description="Please check back shortly or ask staff for the day's specials."
      />
    );
  }

  return (
    <EmptyState
      title="No items in this category"
      description="Try a different category or tap See All."
    />
  );
}

/* ─── Dev-only debug panel ─── */
function DevDebugPanel({
  rawCount,
  availableCount,
  visibleCount,
  activeCategory,
  configured,
}: {
  rawCount: number;
  availableCount: number;
  visibleCount: number;
  activeCategory: string;
  configured: boolean;
}) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      aria-hidden
      style={{
        margin: "16px 20px 80px",
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px dashed rgba(255,255,255,0.08)",
        color: "#888",
        fontSize: 11,
        fontFamily: "var(--font-app-mono, monospace)",
        opacity: 0.65,
        lineHeight: 1.6,
      }}
    >
      <div style={{ fontWeight: 700, color: "#aaa", marginBottom: 4 }}>dev · menu debug</div>
      <div>raw items: {rawCount}</div>
      <div>after available filter: {availableCount}</div>
      <div>after category filter: {visibleCount}</div>
      <div>active category: {activeCategory || "(none)"}</div>
      <div>firebase configured: {configured ? "yes" : "no"}</div>
    </div>
  );
}

/* ─── Main menu content ─── */
function MenuContent() {
  const searchParams = useSearchParams();
  const tableNumber  = searchParams.get("table")?.trim() ?? "";

  const { menuItems, loading, error, refresh } = useMenuItems();
  const { addItem, setActiveTable, tableNumber: activeTable } = useCart();

  const [activeCategory, setActiveCategory] = useState("");
  const [detailItem,     setDetailItem    ] = useState<MenuItem | null>(null);
  const [search,         setSearch        ] = useState("");
  const [waiterLoading,  setWaiterLoading ] = useState(false);

  /* Sync table number from URL into cart. Warn if a different table replaces
     an existing active table — items stored against the old table get cleared. */
  useEffect(() => {
    if (!tableNumber || activeTable === tableNumber) return;
    const hadDifferentTable = Boolean(activeTable) && activeTable !== tableNumber;
    setActiveTable(tableNumber);
    if (hadDifferentTable) {
      toast.warning("Table changed — cart was cleared.");
    }
  }, [tableNumber, activeTable, setActiveTable]);

  // Hide only items explicitly marked unavailable. `undefined` (field missing
  // on the Firestore doc) or `true` both keep the item visible — see
  // `toMenuItem` in lib/firebase/firestore.ts which mirrors this default.
  const available = useMemo(
    () => menuItems.filter((i) => i.isAvailable !== false),
    [menuItems],
  );

  const categoryTabs = useMemo(() => {
    const m = new Map<string, number>();
    available.forEach((i) => m.set(i.category, (m.get(i.category) ?? 0) + 1));
    return Array.from(m.entries()).map(([label, count]) => ({ label, count }));
  }, [available]);

  /* Auto-select first category once data loads */
  useEffect(() => {
    if (!available.length) return;
    setActiveCategory((prev) =>
      !prev || !categoryTabs.some((t) => t.label === prev)
        ? (categoryTabs[0]?.label ?? "")
        : prev,
    );
  }, [available, categoryTabs]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return available.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    );
  }, [search, available]);

  const visible = useMemo(() => {
    if (searchResults) return searchResults;
    if (!activeCategory) return available;
    return available.filter((i) => i.category === activeCategory);
  }, [searchResults, activeCategory, available]);

  /* Handlers */
  const handleAdd = (item: MenuItem) => {
    addItem(item);
    toast.success(`${item.name} added!`, { duration: 1200 });
  };

  const handleAddFromModal = (item: MenuItem, qty: number) => {
    addItem(item, qty);
    toast.success(
      qty > 1 ? `${qty}× ${item.name} added!` : `${item.name} added!`,
      { duration: 1200 },
    );
  };

  const handleCallWaiter = async () => {
    if (!tableNumber) { toast.error("Scan a table QR to call a waiter."); return; }
    if (!isFirebaseConfigured) { toast.error("App not configured."); return; }
    try {
      setWaiterLoading(true);
      await createWaiterRequest(tableNumber);
      toast.success("Waiter is on the way! ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not call waiter.");
    } finally {
      setWaiterLoading(false);
    }
  };

  return (
    <div className="phone-frame">
    <div
      className="menu-shell"
      style={{
        background:    "#121212",
        minHeight:     "100dvh",
        width:         "100%",
        maxWidth:      480,
        margin:        "0 auto",
        display:       "flex",
        flexDirection: "column",
        position:      "relative",
      }}
    >
      {/* ══════════════════════════════════════
          HEADER — hamburger · heading · waiter
      ══════════════════════════════════════ */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Hamburger (☰) */}
          <button
            type="button"
            aria-label="Menu"
            style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              gap:            5,
              width:          40,
              height:         40,
              borderRadius:   12,
              background:     "#1e1e1e",
              border:         "none",
              cursor:         "pointer",
            }}
          >
            <span style={{ display: "block", width: 18, height: 2, borderRadius: 2, background: "#fff" }} />
            <span style={{ display: "block", width: 18, height: 2, borderRadius: 2, background: "#fff" }} />
            <span style={{ display: "block", width: 12, height: 2, borderRadius: 2, background: "#fff" }} />
          </button>

          {/* Call Waiter button — attention-grabbing yellow */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleCallWaiter}
            disabled={waiterLoading || !isFirebaseConfigured}
            style={{
              display:         "flex",
              alignItems:      "center",
              gap:             6,
              background:      "#ffc107",
              border:          "none",
              borderRadius:    20,
              padding:         "9px 16px",
              fontSize:        13,
              fontWeight:      700,
              color:           "#111",
              cursor:          "pointer",
              boxShadow:       "0 4px 16px rgba(255,193,7,0.4)",
              opacity:         waiterLoading ? 0.6 : 1,
            }}
          >
            <BellRing className="h-4 w-4" />
            {waiterLoading ? "Calling…" : "Call Waiter"}
          </motion.button>
        </div>

        {/* Hero heading */}
        <h1
          style={{
            marginTop:    20,
            fontSize:     "clamp(24px,7vw,30px)",
            fontWeight:   800,
            lineHeight:   1.25,
            color:        "#fff",
          }}
        >
          Welcome to{" "}
          <span style={{ color: "#ffc107" }}>{APP_NAME}</span>
        </h1>
        <p style={{ marginTop: 6, fontSize: 13, color: "#888" }}>
          {tableNumber
            ? `Table ${tableNumber} · Ready to order?`
            : "Browse our menu and place your order from your seat."}
        </p>

        {/* Search bar */}
        <div style={{ position: "relative", marginTop: 16 }}>
          <Search
            className="h-4 w-4"
            style={{
              position:   "absolute",
              left:       14,
              top:        "50%",
              transform:  "translateY(-50%)",
              color:      "#777",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            placeholder="Search your favourite food"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width:        "100%",
              background:   "#1e1e1e",
              border:       "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding:      "13px 48px 13px 40px",
              fontSize:     13,
              color:        "#fff",
              outline:      "none",
            }}
          />
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearch("")}
            style={{
              position:       "absolute",
              right:          10,
              top:            "50%",
              transform:      "translateY(-50%)",
              width:          32,
              height:         32,
              borderRadius:   10,
              background:     "#ffc107",
              border:         "none",
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <SlidersHorizontal className="h-4 w-4 text-black" />
          </button>
        </div>
      </div>

      {/* Firebase alert */}
      {!isFirebaseConfigured ? (
        <div style={{ padding: "12px 20px 0" }}>
          <FirebaseSetupAlert />
        </div>
      ) : null}

      {/* ── Sticky category bar ── */}
      {!search && categoryTabs.length > 0 ? (
        <div
          style={{
            position:     "sticky",
            top:          0,
            zIndex:       20,
            background:   "#121212",
            padding:      "16px 20px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Categories</span>
            <button
              type="button"
              onClick={() => setActiveCategory("")}
              style={{ fontSize: 13, fontWeight: 600, color: "#ffc107", background: "none", border: "none", cursor: "pointer" }}
            >
              See All
            </button>
          </div>
          <CategoryTabs
            categories={categoryTabs}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      ) : null}

      {/* ── Food grid ── */}
      <main style={{ flex: 1, padding: "16px 20px 100px" }}>
        {/* Section label */}
        {!loading && !error ? (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              {search ? `Results for "${search}"` : activeCategory || "Popular Picks"}
            </span>
            <span style={{ fontSize: 12, color: "#666" }}>
              {visible.length} item{visible.length === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}

        {loading && <MenuSkeleton />}

        {!loading && error ? (
          <EmptyState
            title="Menu unavailable"
            description={error}
            actionLabel="Retry"
            actionHref={tableNumber ? `/menu?table=${tableNumber}` : "/menu"}
          />
        ) : null}

        {!loading && !error && visible.length === 0 ? (
          <EmptyTopState
            search={search}
            menuCount={menuItems.length}
            availableCount={available.length}
            onReload={refresh}
          />
        ) : null}

        {!loading && !error && visible.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={search || activeCategory || "all"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
              {visible.map((item, i) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  index={i}
                  onAdd={() => handleAdd(item)}
                  onTap={() => setDetailItem(item)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : null}

        {!search ? <SocialLinks /> : null}
      </main>

      {/* ── Item detail (full-screen slide-up) ── */}
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onAdd={handleAddFromModal}
      />

      {/* ── Dev-only data-flow debug ── */}
      <DevDebugPanel
        rawCount={menuItems.length}
        availableCount={available.length}
        visibleCount={visible.length}
        activeCategory={activeCategory}
        configured={isFirebaseConfigured}
      />

      {/* ── Fixed bottom navigation ── */}
      <BottomNav tableNumber={tableNumber} />
    </div>
    </div>
  );
}

/* ─── Suspense wrapper (required for useSearchParams) ─── */
function SkeletonPage() {
  return (
    <div className="phone-frame">
    <div style={{ background: "#121212", minHeight: "100dvh", width: "100%", maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: 12, background: "#1e1e1e" }} />
        <div className="animate-pulse" style={{ width: 120, height: 40, borderRadius: 20, background: "#1e1e1e" }} />
      </div>
      <div className="animate-pulse" style={{ width: "70%", height: 24, borderRadius: 8, background: "#1e1e1e", marginBottom: 12 }} />
      <div className="animate-pulse" style={{ width: "100%", height: 48, borderRadius: 16, background: "#1e1e1e", marginBottom: 20 }} />
      <MenuSkeleton />
    </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <MenuContent />
    </Suspense>
  );
}
