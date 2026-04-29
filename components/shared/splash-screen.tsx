"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const SPLASH_KEY = "htc-splash-v1";
const SPLASH_DURATION_MS = 2200;

export function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_KEY)) return;
      // Intentional: client-side splash gating reads sessionStorage which
      // isn't available during SSR, so the visibility flip happens here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem(SPLASH_KEY, "1");
      }, SPLASH_DURATION_MS);
      return () => clearTimeout(t);
    } catch {
      // sessionStorage unavailable (iOS private mode) — skip splash
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            background: "#040404",
            overflow: "hidden",
          }}
        >
          {/* Ambient glow blobs */}
          <div
            style={{
              position: "absolute",
              top: "-10%",
              left: "-10%",
              width: "60%",
              height: "60%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,193,7,0.18) 0%, transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-10%",
              right: "-10%",
              width: "50%",
              height: "50%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,193,7,0.1) 0%, transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

          {/* Brand block */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: "center", position: "relative" }}
          >
            {/* Icon ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: "rgba(255,193,7,0.12)",
                border: "1.5px solid rgba(255,193,7,0.28)",
                marginBottom: 24,
                fontSize: 40,
              }}
            >
              ☕
            </motion.div>

            {/* Label */}
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "rgba(255,193,7,0.75)",
                margin: "0 0 10px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              Welcome to
            </p>

            {/* App name */}
            <h1
              style={{
                fontSize: "clamp(36px, 8vw, 52px)",
                fontWeight: 800,
                color: "#f8f3e8",
                margin: "0 0 8px",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              HashTag Cafe
            </h1>

            {/* Tagline */}
            <p
              style={{
                fontSize: 15,
                color: "#aca48e",
                margin: "0 0 40px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              Scan. Order. Enjoy.
            </p>
          </motion.div>

          {/* Animated loader bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              position: "relative",
              width: 120,
              height: 3,
              borderRadius: 99,
              background: "rgba(255,193,7,0.15)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.1,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 0.2,
              }}
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent, #ffc107, transparent)",
                borderRadius: 99,
              }}
            />
          </motion.div>

          {/* Version / tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            style={{
              position: "absolute",
              bottom: 32,
              fontSize: 12,
              color: "rgba(172,164,142,0.5)",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            QR-powered table ordering
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
