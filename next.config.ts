import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use empty turbopack config since Next.js 16 defaults to Turbopack
  turbopack: {},
  async rewrites() {
    return [
      {
        source: "/finance",
        destination: "/finance/index.html",
      },
    ];
  },
};

export default nextConfig;
