import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function buttonVariants({
  className,
  variant = "primary",
}: {
  className?: string;
  variant?: ButtonVariant;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold tracking-[0.01em] shadow-lg shadow-black/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" &&
      "bg-[var(--primary)] text-black hover:scale-[1.02] hover:bg-[var(--primary-strong)] hover:shadow-yellow-500/20",
    variant === "secondary" &&
      "border border-yellow-400/20 bg-yellow-400/10 text-[var(--foreground)] hover:scale-[1.02] hover:bg-yellow-400/16",
    variant === "ghost" &&
      "border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] hover:scale-[1.02] hover:border-yellow-400/25 hover:bg-yellow-400/10",
    variant === "danger" &&
      "bg-[var(--danger)] text-white hover:scale-[1.02] hover:bg-red-500",
    className,
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button {...props} className={buttonVariants({ className, variant })}>
      {children}
    </button>
  );
}
