import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  basePath: "/special-day",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
