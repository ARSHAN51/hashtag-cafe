import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type StickyCartBarProps = {
  itemCount: number;
  totalAmount: number;
};

export function StickyCartBar({ itemCount, totalAmount }: StickyCartBarProps) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed inset-x-0 bottom-0 z-30 px-3 pb-safe pb-4"
    >
      <Link
        href="/cart"
        className="flex w-full items-center justify-between rounded-2xl border border-yellow-400/20 bg-[var(--panel-strong)] px-4 py-3.5 shadow-2xl shadow-black/40 backdrop-blur-xl active:scale-[0.98] transition-transform duration-100"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-black shadow-lg shadow-yellow-500/25">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">
              {itemCount} item{itemCount === 1 ? "" : "s"} in cart
            </p>
            <p className="text-xs text-[var(--muted)]">Tap to review order</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-base font-bold text-[var(--primary)]">
            {formatCurrency(totalAmount)}
          </p>
          <span className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-black shadow-md shadow-yellow-500/20">
            View Cart
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
