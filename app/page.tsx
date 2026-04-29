import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  QrCode,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

const featureCards = [
  {
    description: "Table-aware ordering with a polished mobile flow guests actually enjoy using.",
    icon: QrCode,
    title: "Scan, scroll, order",
  },
  {
    description: "Firestore-powered live order tracking keeps the kitchen board and service team in sync.",
    icon: Zap,
    title: "Live operations",
  },
  {
    description: "A premium guest menu, sticky cart bar, trending moments, and admin controls in one MVP.",
    icon: ShieldCheck,
    title: "Production-ready stack",
  },
  {
    description: "Dark-first visuals, bright accent moments, and clean spacing inspired by food delivery apps.",
    icon: Sparkles,
    title: "Premium cafe vibe",
  },
];

const launchSteps = [
  "Add your Firebase web config to .env.local.",
  "Create one admin account in Firebase Authentication.",
  "Publish a few menu items from the admin panel.",
  "Open /menu?table=1 and run the guest ordering flow.",
];

const previewItems = [
  {
    image:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80",
    name: "Cold Brew Tonic",
    price: 220,
    tag: "#Trending",
  },
  {
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    name: "Butter Croffle",
    price: 190,
    tag: "#Bakery",
  },
  {
    image:
      "https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1200&q=80",
    name: "Loaded Nachos",
    price: 260,
    tag: "#Snacks",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-yellow-300/80">
            {APP_NAME}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            QR ordering with a modern cafe app feel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/admin"
            className={buttonVariants({
              variant: "ghost",
              className: "justify-center",
            })}
          >
            Admin Login
          </Link>
        </div>
      </header>

      <section className="panel soft-grid relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12">
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-yellow-500/18 via-transparent to-yellow-300/18 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <span className="accent-chip inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              Premium ordering, not just another menu page
            </span>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-yellow-300/80">
                Dark-first cafe UI
              </p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                The QR menu that feels like a food app, not a boring form.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                Guests scan a table QR, browse image-first dishes, hit a sticky
                cart bar, and send orders straight to the kitchen. Staff get a
                live dashboard for orders, menu changes, and waiter requests.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm font-semibold text-yellow-300/85">
              {["#Coffee", "#Snacks", "#Desserts", "#LateNightBites"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-yellow-400/18 bg-yellow-400/10 px-3 py-1.5"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/menu?table=1"
                className={buttonVariants({ className: "justify-center px-6" })}
              >
                Launch Demo Table
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/dashboard"
                className={buttonVariants({
                  variant: "secondary",
                  className: "justify-center px-6",
                })}
              >
                Open Admin Dashboard
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <article className="surface-card rounded-[1.5rem] p-4">
                <p className="text-sm text-[var(--muted)]">Guest flow</p>
                <h2 className="mt-2 text-2xl font-bold">Menu to kitchen</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Scan, add, review, send.
                </p>
              </article>
              <article className="surface-card rounded-[1.5rem] p-4">
                <p className="text-sm text-[var(--muted)]">Realtime sync</p>
                <h2 className="mt-2 text-2xl font-bold">Firestore live</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Orders and service calls update instantly.
                </p>
              </article>
              <article className="surface-card rounded-[1.5rem] p-4">
                <p className="text-sm text-[var(--muted)]">Admin control</p>
                <h2 className="mt-2 text-2xl font-bold">Menu CRUD</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Publish, edit, and retire dishes on the fly.
                </p>
              </article>
            </div>
          </div>

          <div className="grid gap-4">
            <article className="panel interactive-lift overflow-hidden rounded-[2rem] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.26em] text-yellow-300/75">
                    Guest preview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    {"What's Trending \u{1F374}"}
                  </h2>
                </div>
                <span className="rounded-full bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-300">
                  Table 12
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {previewItems.map((item) => (
                  <div
                    key={item.name}
                    className="surface-card flex items-center gap-4 rounded-[1.5rem] p-3"
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-[1.2rem]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300/75">
                        {item.tag}
                      </p>
                      <h3 className="truncate text-lg font-semibold">{item.name}</h3>
                      <p className="text-sm text-[var(--muted)]">
                        Crafted for cafe hangs and fast cravings.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-[var(--primary)]">
                        {formatCurrency(item.price)}
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black">
                        Add +
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel interactive-lift rounded-[2rem] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.26em] text-yellow-300/75">
                    Admin pulse
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    Kitchen queue in motion
                  </h2>
                </div>
                <ChartNoAxesCombined className="h-5 w-5 text-yellow-300" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Total orders", value: "128" },
                  { label: "Active", value: "9" },
                  { label: "Waiter calls", value: "2" },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="surface-card rounded-[1.35rem] p-4"
                  >
                    <p className="text-sm text-[var(--muted)]">{metric.label}</p>
                    <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-yellow-400/16 bg-yellow-400/10 p-4">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="h-5 w-5 text-yellow-300" />
                  <p className="text-sm leading-6 text-[var(--foreground)]">
                    Order statuses update live from pending to preparing to
                    served, so the front counter and kitchen stay aligned.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="panel interactive-lift rounded-[1.75rem] p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/12 text-yellow-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-bold tracking-tight">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>

        <aside className="panel rounded-[1.9rem] p-6 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-yellow-300/75">
            Quick start
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Launch the full MVP in minutes
          </h2>
          <div className="mt-6 space-y-3">
            {launchSteps.map((step, index) => (
              <div
                key={step}
                className="surface-card flex items-start gap-4 rounded-[1.4rem] p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-black">
                  {index + 1}
                </span>
                <p className="text-sm leading-7 text-[var(--foreground)]">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link
              href="/menu?table=1"
              className={buttonVariants({ className: "justify-center" })}
            >
              Try Customer Menu
            </Link>
            <Link
              href="/admin"
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className: "justify-center",
                }),
              )}
            >
              Enter Admin Space
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
