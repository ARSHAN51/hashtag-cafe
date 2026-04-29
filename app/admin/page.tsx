"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, ArrowRight, ShieldCheck, Sparkles, Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { FirebaseSetupAlert } from "@/components/shared/firebase-setup-alert";
import { PageLoader } from "@/components/shared/page-loader";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

// IMPORTANT: When testing on mobile via your laptop's local IP (e.g.
// http://192.168.1.5:3000), Firebase Auth will reject the request with
// "auth/unauthorized-domain". Add the IP to:
//   Firebase Console → Authentication → Settings → Authorized domains
function firebaseAuthMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Unable to sign in. Please try again.";
  const code = (error as { code?: string }).code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential":    "Incorrect email or password.",
    "auth/invalid-email":         "Enter a valid email address.",
    "auth/user-not-found":        "No account found with this email.",
    "auth/wrong-password":        "Incorrect password.",
    "auth/too-many-requests":     "Too many attempts. Wait a few minutes and try again.",
    "auth/user-disabled":         "This account has been disabled.",
    "auth/network-request-failed":"Network error — check your internet connection.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.",
    "auth/configuration-not-found":"Firebase Auth is not configured for this project.",
    "auth/unauthorized-domain":   "This domain is not authorized. If testing on mobile via local IP, add the IP to Firebase Console → Authentication → Settings → Authorized domains.",
  };
  return map[code] ?? error.message;
}

const AUTH_LOADING_TIMEOUT_MS = 8000;

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin/dashboard";
  const { isConfigured, loading, signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, nextPath, router, user]);

  // Surface a clear timeout error if the auth provider stays in `loading`
  // for too long — almost always a missing/incorrect Firebase config.
  useEffect(() => {
    if (!loading || !isConfigured) return;
    const timer = window.setTimeout(() => {
      setFormError(
        "Firebase connection timed out. Check your .env.local configuration and refresh.",
      );
    }, AUTH_LOADING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loading, isConfigured]);

  const handleSubmit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    setFormError("");

    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }
    if (!password) {
      setFormError("Please enter your password.");
      return;
    }

    try {
      setSubmitting(true);
      await signIn(email.trim(), password);
      toast.success("Welcome back.");
      router.replace(nextPath);
    } catch (signInError) {
      const message = firebaseAuthMessage(signInError);
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-yellow-300/80">
            {APP_NAME}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Premium admin workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/menu?table=1"
            className={buttonVariants({
              variant: "ghost",
              className: "justify-center",
            })}
          >
            <Store className="h-4 w-4" />
            View Menu
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="grid flex-1 items-stretch gap-6 lg:grid-cols-[0.96fr_1.04fr]">
        <div className="panel soft-grid relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-yellow-500/18 via-transparent to-yellow-300/16 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <span className="accent-chip inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Admin secure zone
              </span>

              <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
                Run the floor with a sharper live operations view.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
                Sign in to manage incoming orders, keep the kitchen queue moving,
                and refresh the menu in real time.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold text-yellow-300/85">
                {["#RealtimeOrders", "#MenuControl", "#CafeOps"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-yellow-400/18 bg-yellow-400/10 px-3 py-1.5"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Live Firestore order feed",
                "Status flow for kitchen staff",
                "Menu create, edit, and delete",
                "Waiter-request visibility in one place",
              ].map((item) => (
                <div
                  key={item}
                  className="surface-card rounded-[1.5rem] p-4 text-sm font-medium text-[var(--foreground)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel rounded-[2rem] p-6 sm:p-8">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-yellow-300/75">
              Admin Login
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Use the email and password you created in Firebase Authentication
              to access the cafe control center.
            </p>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-yellow-400/16 bg-yellow-400/10 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
              <p className="text-sm leading-6 text-[var(--foreground)]">
                Go to{" "}
                <strong>Firebase Console → Authentication → Sign-in method</strong>{" "}
                and enable <strong>Email/Password</strong>. Then add a user under{" "}
                <strong>Users</strong> tab.
              </p>
            </div>
          </div>

          <FirebaseSetupAlert className="mt-4" />

          {formError ? (
            <div className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
              <p className="text-sm leading-6 text-[var(--foreground)]">{formError}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormError(""); }}
                className="field"
                placeholder="owner@hashtagcafe.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormError(""); }}
                className="field"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={!isConfigured || loading || submitting}
              className={buttonVariants({ className: "mt-2 w-full justify-center" })}
            >
              {submitting ? (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-black/60" />
                  </span>
                  Signing in...
                </>
              ) : loading ? (
                "Connecting..."
              ) : (
                <>
                  Enter Admin Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <Link
            href="/menu?table=1"
            className={buttonVariants({
              variant: "ghost",
              className: "mt-4 w-full justify-center",
            })}
          >
            View customer menu
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading..." />}>
      <AdminLoginContent />
    </Suspense>
  );
}
