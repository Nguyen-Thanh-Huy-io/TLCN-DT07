import type { NextConfig } from "next";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5000" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000" },
      { protocol: "http", hostname: "localhost", port: "5001" },
      { protocol: "http", hostname: "127.0.0.1", port: "5001" },
      { protocol: "https", hostname: "**" },
    ],
  },
  // Cho phép các thiết bị trong mạng nội bộ và ngrok truy cập dev server (HMR / Turbopack)
  allowedDevOrigins: [
    "192.168.1.189",
    "192.168.137.1",
    "headcount-ruby-spearfish.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${BACKEND_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
