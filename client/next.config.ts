import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: ["mongodb"],
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
