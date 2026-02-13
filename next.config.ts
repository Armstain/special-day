import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  basePath: isProd ? "/special-day" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
