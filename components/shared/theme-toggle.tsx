"use client";

import { motion } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className={cn(
        "group relative inline-flex h-12 w-24 items-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-1.5 text-[var(--foreground)] shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400/25 hover:shadow-yellow-500/10",
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className={cn(
          "absolute inset-y-1.5 left-1.5 flex w-10 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg shadow-yellow-500/30",
          isLight && "translate-x-11",
        )}
      >
        {isLight ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      </motion.span>
      <span className="grid w-full grid-cols-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        <span className="pl-1 text-left">Dark</span>
        <span className="pr-1 text-right">Light</span>
      </span>
    </button>
  );
}
