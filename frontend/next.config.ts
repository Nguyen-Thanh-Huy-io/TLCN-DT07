import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép các thiết bị trong mạng nội bộ truy cập dev server (HMR)
  allowedDevOrigins: ["192.168.1.189"],
};

export default nextConfig;
