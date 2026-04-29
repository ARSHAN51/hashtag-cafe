"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import {
  BellRing,
  Coffee,
  Copy,
  Download,
  ExternalLink,
  NotebookPen,
  QrCode,
  TimerReset,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { FirebaseSetupAlert } from "@/components/shared/firebase-setup-alert";
import { buttonVariants } from "@/components/ui/button";
import { useAdminData } from "@/components/providers/admin-data-provider";
import { useTables } from "@/hooks/use-tables";
import { isFirebaseConfigured } from "@/lib/env";
import {
  createTables,
  deleteTable,
  updateWaiterRequestStatus,
} from "@/lib/firebase/firestore";
import { formatCurrency, formatDateTime, getStatusClasses } from "@/lib/utils";

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="panel interactive-lift rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
          <h2 className="text-3xl font-semibold tracking-tight">{value}</h2>
          <p className="text-sm text-[var(--muted)]">{hint}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
          {icon}
        </div>
      </div>
    </article>
  );
}

function TableQRCard({
  table,
  onCopy,
  onDelete,
  deleting,
}: {
  table: { id: string; tableNumber: string; menuUrl: string };
  onCopy: (url: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");

    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `table-${table.tableNumber}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article className="surface-card rounded-[1.5rem] p-4">
      <div
        ref={qrRef}
        className="mx-auto flex h-44 w-44 items-center justify-center rounded-[1.25rem] bg-white p-3"
      >
        <QRCode value={table.menuUrl} size={152} />
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Table {table.tableNumber}</h3>
        <p className="mt-1 truncate text-sm text-[var(--muted)]">
          {table.menuUrl}
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={() => onCopy(table.menuUrl)}
          className={buttonVariants({
            variant: "secondary",
            className: "justify-center",
          })}
        >
          <Copy className="h-4 w-4" />
          Copy Link
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className={buttonVariants({
            variant: "secondary",
            className: "justify-center",
          })}
        >
          <Download className="h-4 w-4" />
          Download QR
        </button>
        <a
          href={table.menuUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({
            variant: "ghost",
            className: "justify-center",
          })}
        >
          <ExternalLink className="h-4 w-4" />
          Open Menu
        </a>
        <button
          type="button"
          onClick={() => onDelete(table.id)}
          disabled={deleting}
          className={buttonVariants({
            variant: "danger",
            className: "justify-center",
          })}
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

export default function AdminDashboardPage() {
  const { menuItems, orders, ordersLoading, requests, requestsLoading } = useAdminData();
  const { error: tablesError, loading: tablesLoading, tables } = useTables();
  const [updatingWaiterId, setUpdatingWaiterId] = useState("");
  const [tableCount, setTableCount] = useState("12");
  const [siteUrl, setSiteUrl] = useState("");
  const [generatingTables, setGeneratingTables] = useState(false);
  const [deletingTableId, setDeletingTableId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setSiteUrl(window.location.origin);
  }, []);

  const activeOrders = orders.filter((order) => order.status !== "served");
  const pendingWaiterRequests = requests.filter(
    (request) => request.status === "pending",
  );
  // `orders` is already scoped to today (see hooks/use-orders.ts), so summing
  // here gives today's revenue rather than all-time.
  const todaysRevenue = orders.reduce((total, order) => total + order.totalAmount, 0);

  const handleResolveWaiterRequest = async (requestId: string) => {
    try {
      setUpdatingWaiterId(requestId);
      await updateWaiterRequestStatus(requestId, "completed");
      toast.success("Waiter request marked as completed.");
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Unable to update the waiter request.";
      toast.error(message);
    } finally {
      setUpdatingWaiterId("");
    }
  };

  const handleGenerateTables = async () => {
    try {
      setGeneratingTables(true);
      await createTables(Number(tableCount), siteUrl);
      toast.success("Table QR set generated.");
    } catch (tableError) {
      const message =
        tableError instanceof Error
          ? tableError.message
          : "Unable to generate the table QR set.";
      toast.error(message);
    } finally {
      setGeneratingTables(false);
    }
  };

  const handleCopyTableLink = async (menuUrl: string) => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast.success("Table menu link copied.");
    } catch {
      toast.error("Unable to copy the table link.");
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      setDeletingTableId(tableId);
      await deleteTable(tableId);
      toast.success(`Table ${tableId} removed.`);
    } catch (tableError) {
      const message =
        tableError instanceof Error
          ? tableError.message
          : "Unable to delete the table.";
      toast.error(message);
    } finally {
      setDeletingTableId("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-yellow-300/75">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Live cafe overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Monitor order flow, waiter calls, and menu coverage from one place.
        </p>
      </div>

      {!isFirebaseConfigured ? <FirebaseSetupAlert /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's orders"
          value={ordersLoading ? "—" : String(orders.length)}
          hint="Orders received since midnight"
          icon={<NotebookPen className="h-5 w-5" />}
        />
        <StatCard
          title="Active orders"
          value={ordersLoading ? "—" : String(activeOrders.length)}
          hint="Pending or preparing"
          icon={<TimerReset className="h-5 w-5" />}
        />
        <StatCard
          title="Menu items"
          value={String(menuItems.length)}
          hint="Currently published dishes"
          icon={<Coffee className="h-5 w-5" />}
        />
        <StatCard
          title="Waiter calls"
          value={requestsLoading ? "—" : String(pendingWaiterRequests.length)}
          hint="Pending table assistance"
          icon={<BellRing className="h-5 w-5" />}
        />
      </section>

      <section className="panel rounded-[1.75rem] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-yellow-300/75">
              Table QR Manager
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Generate QR codes for every table
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Create or refresh your table set in one click, then copy links or
              download the QR codes to print for your cafe floor.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[160px_minmax(260px,1fr)_auto]">
            <input
              value={tableCount}
              onChange={(event) => setTableCount(event.target.value)}
              className="field"
              type="number"
              min="1"
              placeholder="12"
            />
            <input
              value={siteUrl}
              onChange={(event) => setSiteUrl(event.target.value)}
              className="field"
              type="url"
              placeholder="https://your-cafe.vercel.app"
            />
            <button
              type="button"
              onClick={handleGenerateTables}
              disabled={generatingTables}
              className={buttonVariants({ className: "justify-center" })}
            >
              <QrCode className="h-4 w-4" />
              {generatingTables ? "Generating..." : "Generate QRs"}
            </button>
          </div>
        </div>

        {tablesError ? (
          <div className="mt-4 rounded-[1.25rem] border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {tablesError}
          </div>
        ) : null}

        {tablesLoading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="surface-card animate-pulse rounded-[1.5rem] p-4"
              >
                <div className="mx-auto h-44 w-44 rounded-[1.25rem] bg-yellow-400/10" />
                <div className="mt-4 h-5 w-24 rounded-full bg-yellow-400/10" />
                <div className="mt-2 h-4 w-full rounded-full bg-yellow-400/8" />
              </div>
            ))}
          </div>
        ) : tables.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No table QRs yet"
              description="Generate a table set above and the dashboard will create QR cards for every table."
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tables.map((table) => (
              <TableQRCard
                key={table.id}
                table={table}
                onCopy={handleCopyTableLink}
                onDelete={handleDeleteTable}
                deleting={deletingTableId === table.id}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.36fr]">
        <article className="panel rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recent orders</h2>
              <p className="text-sm text-[var(--muted)]">
                Updated live from Firestore
              </p>
            </div>
            <div className="rounded-full bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
              Today&apos;s Revenue {formatCurrency(todaysRevenue)}
            </div>
          </div>

          {ordersLoading ? (
            <div className="mt-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="surface-card animate-pulse rounded-[1.5rem] p-4"
                >
                  <div className="h-5 w-32 rounded-full bg-yellow-400/10" />
                  <div className="mt-2 h-4 w-24 rounded-full bg-yellow-400/8" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-7 w-20 rounded-full bg-yellow-400/10" />
                    <div className="h-7 w-24 rounded-full bg-yellow-400/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No orders yet"
                description="Place an order from the customer menu to see it appear here."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {orders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="surface-card rounded-[1.5rem] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Table {order.tableNumber}
                      </h3>
                      <p className="text-sm text-[var(--muted)]">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <span className={getStatusClasses(order.status)}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span
                        key={`${order.id}-${item.id}`}
                        className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-[var(--foreground)]"
                      >
                        {item.quantity} x {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel rounded-[1.75rem] p-5">
          <h2 className="text-xl font-semibold">Pending waiter calls</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Quick view of guest service requests
          </p>

          {requestsLoading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="surface-card animate-pulse rounded-[1.25rem] p-4"
                >
                  <div className="h-5 w-20 rounded-full bg-yellow-400/10" />
                  <div className="mt-2 h-4 w-28 rounded-full bg-yellow-400/8" />
                </div>
              ))}
            </div>
          ) : pendingWaiterRequests.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No waiter calls"
                description="Guests can trigger a call from the menu screen."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {pendingWaiterRequests.map((request) => (
                <div
                  key={request.id}
                  className="surface-card rounded-[1.25rem] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">
                        Table {request.tableNumber}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResolveWaiterRequest(request.id)}
                      disabled={updatingWaiterId === request.id}
                      className={buttonVariants({
                        variant: "secondary",
                        className: "min-w-[122px] justify-center px-4 py-2.5 text-xs sm:w-auto",
                      })}
                    >
                      {updatingWaiterId === request.id
                        ? "Updating..."
                        : "Mark Complete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
