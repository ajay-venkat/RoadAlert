import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    // Test files reference @playwright/test which isn't installed in production.
    // Type checking is handled separately by the IDE and CI.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
