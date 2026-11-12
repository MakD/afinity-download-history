/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { externalDir: true },
  async rewrites() {
    return [
      { source: "/svg", destination: "/api/svg" },
      { source: "/healthz", destination: "/api/healthz" },
    ];
  },
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://afinity-downloads.vercel.app",
  },
};

export default nextConfig;