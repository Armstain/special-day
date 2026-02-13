import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  basePath: "/special-day",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/special-day",
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
