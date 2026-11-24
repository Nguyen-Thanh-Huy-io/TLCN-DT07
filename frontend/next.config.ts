import type { NextConfig } from "next";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
    "127.0.0.1",
    "localhost",
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
      { source: "/di-tich", destination: "/danh-muc/di-tich", permanent: true },
      { source: "/su-kien", destination: "/danh-muc/su-kien", permanent: true },
      { source: "/nhan-vat", has: [{ type: "query", key: "nv" }], destination: "/bai-viet/:nv", permanent: true },
      { source: "/nhan-vat", destination: "/danh-muc/nhan-vat", permanent: true },
      { source: "/blog-review", destination: "/review?tab=BLOG", permanent: true },
      { source: "/moderation", destination: "/review?tab=REPORT", permanent: true },
      { source: "/questions", destination: "/quizzes?tab=questions", permanent: true },
      { source: "/chuyen-muc/:slug", destination: "/bai-viet?chuyen-muc=:slug", permanent: true },
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
