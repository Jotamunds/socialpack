import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./content/**/*"],
    "/*": ["./content/**/*"],
  },
  serverExternalPackages: ["@resvg/resvg-js"],
};

export default nextConfig;
