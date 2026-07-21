import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Required for mongoose on Vercel — prevents broken bundling / hung API routes
  serverExternalPackages: ["mongoose"],
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
