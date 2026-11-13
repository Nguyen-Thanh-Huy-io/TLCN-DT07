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
  async redirects() {
    return [
      // Trang cá nhân cộng đồng đã gộp vào trang thành viên (định danh "me").
      { source: "/cong-dong/ca-nhan", destination: "/cong-dong/thanh-vien/me", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${BACKEND_INTERNAL_URL}/:path*`,
      },
      // Trang đọc chung: giữ URL theo lối vào, dồn về 1 trang /bai-viet/[slug] (?nguon= đổi chữ & link quay lại)
      ...["nhan-vat", "su-kien", "di-tich", "thuc-the"].map((source) => ({
        source: `/${source}/:slug`,
        destination: `/bai-viet/:slug?nguon=${source}`,
      })),
    ];
  },
};

export default nextConfig;
