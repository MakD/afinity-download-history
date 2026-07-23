/** @type {import('next').NextConfig} */
const nextConfig = {
  // Same-origin API: /svg and /healthz are served by pages/api/*
  async rewrites() {
    return [
      { source: "/svg", destination: "/api/svg" },
      { source: "/healthz", destination: "/api/healthz" },
    ];
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://downloadhistory.varunaditya.xyz",
  },
};

export default nextConfig;
