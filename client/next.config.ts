import type { NextConfig } from "next";
import path from "path";

const adminOrigin = (
  process.env.ADMIN_ORIGIN?.trim() || "https://thailand-kitchen-admin.vercel.app"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: ["mongodb"],
  images: {
    unoptimized: false,
  },
  // Serve the admin panel (separate Vercel project) at /tomazs-admin on this domain
  async rewrites() {
    return [
      {
        source: "/tomazs-admin",
        destination: `${adminOrigin}/tomazs-admin`,
      },
      {
        source: "/tomazs-admin/:path*",
        destination: `${adminOrigin}/tomazs-admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
