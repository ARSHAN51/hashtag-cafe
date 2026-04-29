"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { BottomNav } from "@/components/customer/bottom-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { isFirebaseConfigured } from "@/lib/env";
import { placeOrder } from "@/lib/firebase/firestore";
import { formatCurrency, getTableLabel } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=60";

export default function CartPage() {
  const router = useRouter();
  const {
    clearCart,
    decreaseItem,
    hydrated,
    increaseItem,
    itemCount,
    items,
    removeItem,
    tableNumber,
    totalAmount,
  } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const menuHref = tableNumber ? `/menu?table=${tableNumber}` : "/menu?table=1";

  const orderLines = useMemo(
    () => items.map((item) => ({ ...item, lineTotal: item.price * item.quantity })),
    [items],
  );

  const handlePlaceOrder = async () => {
    if (!tableNumber) {
      toast.error("Scan a table QR code before placing an order.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    try {
      setSubmitting(true);
      const orderId = await placeOrder({
        items: items.map((item) => ({
          id: item.id,
          image: item.image,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        tableNumber,
        totalAmount,
      });
      clearCart();
      toast.success("Order sent to kitchen!");
      router.replace(`/order-confirmation/${orderId}?table=${tableNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="phone-frame">
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--panel-strong)] backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href={menuHref}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Menu
          </Link>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Your Order
            </p>
            {tableNumber ? (
              <p className="text-sm font-bold text-[var(--foreground)]">
                {getTableLabel(tableNumber)}
              </p>
            ) : null}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-32">
        {!hydrated ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3"
              >
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-[var(--panel-strong)]" />
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div className="h-4 w-3/4 rounded-full bg-[var(--panel-strong)]" />
                    <div className="flex justify-between">
                      <div className="h-7 w-24 rounded-full bg-[var(--panel-strong)]" />
                      <div className="h-4 w-12 rounded-full bg-[var(--panel-strong)]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              icon={<ShoppingCart className="h-8 w-8" />}
              title="Your cart is empty"
              description="Go back to the menu and add something delicious."
              actionLabel="Browse Menu"
              actionHref={menuHref}
            />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {orderLines.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-3 flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3">
                  {/* Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={item.image || FALLBACK_IMAGE}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
                        {item.name}
                      </h3>
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-[var(--muted)] active:text-[var(--danger)] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty controls */}
                      <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-2 py-1">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => decreaseItem(item.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--foreground)]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[1rem] text-center text-sm font-bold text-[var(--foreground)]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => increaseItem(item.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--foreground)]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-[var(--primary)]">
                        {formatCurrency(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>

      {/* Fixed bottom — bill + place order */}
      {items.length > 0 ? (
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-[var(--border)] bg-[var(--panel-strong)] px-4 pb-safe pb-6 pt-4 backdrop-blur-xl">
          {/* Bill rows */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
              <span className="font-semibold text-[var(--foreground)]">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Taxes & charges</span>
              <span className="font-semibold text-[var(--muted)]">Pay at counter</span>
            </div>
            <div className="h-px bg-[var(--border)]" />
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[var(--foreground)]">Total</span>
              <span className="text-lg font-bold text-[var(--primary)]">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={submitting || !isFirebaseConfigured}
            onClick={handlePlaceOrder}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--primary)] py-4 text-base font-bold text-black shadow-xl shadow-yellow-500/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-black/60" />
                </span>
                Placing order...
              </>
            ) : (
              <>Place Order · {formatCurrency(totalAmount)}</>
            )}
          </motion.button>
        </div>
      ) : null}

      <BottomNav tableNumber={tableNumber} />
    </div>
    </div>
  );
}
