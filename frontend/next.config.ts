import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép các thiết bị trong mạng nội bộ và ngrok truy cập dev server (HMR / Turbopack)
  allowedDevOrigins: [
    "192.168.1.189",
    "192.168.137.1",
    "headcount-ruby-spearfish.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
};

export default nextConfig;
