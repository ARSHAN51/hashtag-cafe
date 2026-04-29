"use client";

import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { SplashScreen } from "@/components/shared/splash-screen";

function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      closeButton
      position="top-center"
      richColors
      theme={resolvedTheme === "light" ? "light" : "dark"}
      toastOptions={{
        classNames: {
          description: "text-[var(--muted)]",
          toast:
            "border border-[var(--border)] !bg-[var(--panel)] !text-[var(--foreground)] shadow-2xl shadow-black/25",
          title: "text-[var(--foreground)]",
        },
      }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <SplashScreen />
          <AuthProvider>
            <CartProvider>
              {children}
              <AppToaster />
            </CartProvider>
          </AuthProvider>
        </MotionConfig>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
