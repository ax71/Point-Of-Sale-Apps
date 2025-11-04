import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  devIndicators: false,
  images: {
    domains: ["https://wycsjuukxisicgvswnhw.supabase.co"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wycsjuukxisicgvswnhw.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
