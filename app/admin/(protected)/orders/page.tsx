"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { FirebaseSetupAlert } from "@/components/shared/firebase-setup-alert";
import { useAdminData } from "@/components/providers/admin-data-provider";
import { isFirebaseConfigured } from "@/lib/env";
import { deleteOrder, updateOrderStatus } from "@/lib/firebase/firestore";
import type { OrderStatus } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  getStatusClasses,
} from "@/lib/utils";

const statusOptions: OrderStatus[] = ["pending", "preparing", "served"];

export default function AdminOrdersPage() {
  const { orders, ordersLoading, ordersError } = useAdminData();
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "served">("active");

  const visibleOrders = orders.filter((order) => {
    if (filter === "active") return order.status !== "served";
    if (filter === "served") return order.status === "served";
    return true;
  });

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, status);
      toast.success(`Order moved to ${status}.`);
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Unable to update the order status.";
      toast.error(message);
    } finally {
      setUpdatingId("");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingId(orderId);
      await deleteOrder(orderId);
      toast.success("Order removed from the board.");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the order.";
      toast.error(message);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-yellow-300/75">
          Orders
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Real-time order board
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Every new order appears here automatically with live Firestore
          snapshots.
        </p>
      </div>

      {!isFirebaseConfigured ? (
        <FirebaseSetupAlert />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["active", "all", "served"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={
              filter === option
                ? "rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-black"
                : "rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-yellow-400/20 hover:bg-yellow-400/10"
            }
          >
            {option === "active" ? "Active" : option === "served" ? "Served" : "All orders"}
          </button>
        ))}
        <span className="ml-auto self-center rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--muted)]">
          {visibleOrders.length} order{visibleOrders.length === 1 ? "" : "s"}
        </span>
      </div>

      {ordersError ? (
        <EmptyState title="Unable to load orders" description={ordersError} />
      ) : null}

      {!ordersError && ordersLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="panel animate-pulse rounded-[1.75rem] p-5"
            >
              <div className="h-6 w-32 rounded-full bg-yellow-400/10" />
              <div className="mt-2 h-8 w-24 rounded-full bg-yellow-400/10" />
              <div className="mt-2 h-4 w-28 rounded-full bg-yellow-400/8" />
              <div className="surface-card mt-5 rounded-[1.5rem] p-4 space-y-3">
                <div className="h-4 w-full rounded-full bg-yellow-400/10" />
                <div className="h-4 w-3/4 rounded-full bg-yellow-400/8" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!ordersError && !ordersLoading && visibleOrders.length === 0 ? (
        <EmptyState
          title={filter === "active" ? "No active orders" : "No orders yet"}
          description={
            filter === "active"
              ? "All orders have been served. Switch to All or Served to review history."
              : "Guest orders placed from the menu will stream in here."
          }
        />
      ) : null}

      {!ordersError && !ordersLoading && visibleOrders.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleOrders.map((order) => (
            <article
              key={order.id}
              className="panel interactive-lift rounded-[1.75rem] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-300/75">
                    Table {order.tableNumber}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {formatCurrency(order.totalAmount)}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <span className={getStatusClasses(order.status)}>
                  {order.status}
                </span>
              </div>

              <div className="surface-card mt-5 space-y-3 rounded-[1.5rem] p-4">
                {order.items.map((item) => (
                  <div
                    key={`${order.id}-${item.id}`}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">
                        {item.name}
                      </p>
                      <p className="text-[var(--muted)]">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-[var(--primary)]">
                      {formatCurrency(item.quantity * item.price)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusUpdate(order.id, status)}
                    disabled={updatingId === order.id || deletingId === order.id}
                    className={
                      order.status === status
                        ? "rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-black"
                        : "rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-yellow-400/20 hover:bg-yellow-400/10"
                    }
                  >
                    {updatingId === order.id && order.status !== status
                      ? "Updating..."
                      : status}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(order.id)}
                  disabled={deletingId === order.id || updatingId === order.id}
                  className="ml-auto rounded-full border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)]/20"
                >
                  {deletingId === order.id ? (
                    "Removing..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </span>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
