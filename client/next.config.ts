import type { NextConfig } from "next";
import path from "path";

const apiTarget = (
  process.env.BACKEND_URL?.trim() || "http://127.0.0.1:5000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["mongodb"],
  images: {
    unoptimized: false,
  },
  async rewrites() {
    return [
      {
        source: "/cms-api/:path*",
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiTarget}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
