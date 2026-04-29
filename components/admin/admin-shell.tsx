"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  LayoutDashboard,
  LogOut,
  MenuSquare,
  ScrollText,
  Store,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminDataProvider } from "@/components/providers/admin-data-provider";
import { PageTransition } from "@/components/shared/page-transition";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { useAdminLiveAlerts } from "@/hooks/use-admin-live-alerts";
import { ADMIN_LINKS, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  menu: MenuSquare,
  orders: ScrollText,
};

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOutUser, user } = useAuth();
  const { alertsEnabled, notificationSupported, setAlertsEnabled } =
    useAdminLiveAlerts();

  const handleLogout = async () => {
    await signOutUser();
    toast.success("Signed out.");
    router.replace("/admin");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="panel soft-grid relative overflow-hidden rounded-[1.9rem] px-5 py-5 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-yellow-500/14 via-transparent to-yellow-300/14 blur-3xl" />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-yellow-300/80">
                {APP_NAME}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Admin control center
              </h1>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Signed in as {user?.email ?? "admin"} with live control over
                orders, menu changes, and table-side service.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void setAlertsEnabled(!alertsEnabled);
                }}
                className={buttonVariants({
                  variant: alertsEnabled ? "primary" : "ghost",
                  className: "justify-center",
                })}
              >
                {alertsEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
                {alertsEnabled ? "Alerts On" : "Enable Alerts"}
              </button>
              <Link
                href="/menu?table=1"
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-center",
                })}
              >
                <Store className="h-4 w-4" />
                View Customer Menu
              </Link>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className={buttonVariants({
                  variant: "secondary",
                  className: "justify-center",
                })}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">
            {notificationSupported
              ? "Order and waiter-call alerts can now show popups and unique sounds while you work."
              : "This browser does not support system notifications, but in-app alert popups will still appear."}
          </div>

          <nav className="flex flex-wrap gap-2">
            {ADMIN_LINKS.map((link) => {
              const key = link.href.split("/").at(-1) as
                | "dashboard"
                | "orders"
                | "menu";
              const Icon = iconMap[key];
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-[var(--primary)] text-black shadow-lg shadow-yellow-500/20"
                      : "border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] hover:-translate-y-0.5 hover:border-yellow-400/20 hover:bg-yellow-400/10",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <PageTransition className="py-6">{children}</PageTransition>
    </main>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminDataProvider>
  );
}
