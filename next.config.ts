import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow any HTTPS host for menu/promo imagery during MVP.
    // TODO: For production, restrict to specific CDNs to harden the surface,
    // e.g. images.unsplash.com, firebasestorage.googleapis.com, lh3.googleusercontent.com.
    remotePatterns: [
      {
        hostname: "**",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
