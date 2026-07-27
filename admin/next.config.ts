import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const apiTarget = (
  process.env.BACKEND_URL?.trim() || "http://127.0.0.1:5000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  // Allow LAN access to Next.js HMR /dev resources in development
  allowedDevOrigins: ["192.168.1.26", "localhost", "127.0.0.1"],
  // Same-origin /api → Express (works for localhost AND LAN IP like 192.168.x.x)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
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
