import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH (e.g. /tools/profit-loss-calculator) when serving under a sub-path of another domain.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
