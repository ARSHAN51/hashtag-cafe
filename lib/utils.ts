import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { MenuItem, OrderRecord, OrderStatus } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

export function formatDateTime(value: Date | null) {
  if (!value) {
    return "Just now";
  }

  return format(value, "dd MMM, hh:mm a");
}

export function getTableLabel(tableNumber: string) {
  return tableNumber ? `Table ${tableNumber}` : "Table unavailable";
}

export function sortMenuItems(menuItems: MenuItem[]) {
  return [...menuItems].sort((left, right) => {
    const categoryCompare = left.category.localeCompare(right.category);

    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return left.name.localeCompare(right.name);
  });
}

export function sortOrders(orders: OrderRecord[]) {
  return [...orders].sort(
    (left, right) =>
      (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0),
  );
}

export function getStatusClasses(status: OrderStatus) {
  if (status === "served") {
    return "inline-flex w-fit rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300";
  }

  if (status === "preparing") {
    return "inline-flex w-fit rounded-full bg-yellow-400/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-yellow-300";
  }

  return "inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]";
}
