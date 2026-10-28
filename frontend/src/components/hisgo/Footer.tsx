import React from "react";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 w-full bg-[var(--bg-surface)] border-t border-[var(--border)] pt-12 pb-8 text-[var(--text-body)] font-[family-name:var(--font-body)]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* 4 Columns Grid với đường kẻ dọc phân cách màu border-gold mảnh trên desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 pb-10 border-b border-[var(--border)]">
          {/* Cột 1: Logo & Slogan */}
          <div className="space-y-3 lg:pr-8">
            <div className="flex items-center gap-3">
              {/* Mini Lotus SVG 7 cánh thanh thoát (2 sắc độ --gold và --gold-light) */}
              <div className="text-[var(--gold)] flex-shrink-0">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M50 12 C44 28 42 52 50 70 C58 52 56 28 50 12 Z"
                    fill="var(--gold)"
                  />
                  <path
                    d="M48 24 C36 34 32 48 40 68 C46 68 49 54 48 24 Z"
                    fill="var(--gold-light)"
                  />
                  <path
                    d="M52 24 C64 34 68 48 60 68 C54 68 51 54 52 24 Z"
                    fill="var(--gold-light)"
                  />
                  <path
                    d="M36 38 C22 48 20 62 30 72 C40 72 43 62 36 38 Z"
                    fill="var(--gold)"
                  />
                  <path
                    d="M64 38 C78 48 80 62 70 72 C60 72 57 62 64 38 Z"
                    fill="var(--gold)"
                  />
                  <path
                    d="M26 54 C14 62 14 74 24 80 C34 80 37 72 26 54 Z"
                    fill="var(--gold-light)"
                  />
                  <path
                    d="M74 54 C86 62 86 74 76 80 C66 80 63 72 74 54 Z"
                    fill="var(--gold-light)"
                  />
                  <path
                    d="M32 76 C42 84 58 84 68 76 C62 74 38 74 32 76 Z"
                    fill="var(--gold)"
                  />
                </svg>
              </div>
              <span className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-wider text-[var(--ink)]">
                HISGO
              </span>
            </div>
            <p className="text-sm font-medium tracking-normal text-[var(--text-body)] leading-relaxed">
              Lịch sử Việt Nam — Hành trình của dân tộc
            </p>
          </div>

          {/* Cột 2: Mô tả */}
          <div className="space-y-2 lg:px-8 lg:border-l lg:border-[var(--border-gold)]/30">
            <p className="text-sm text-[var(--text-body)] leading-relaxed font-normal">
              HISGO là nền tảng khám phá lịch sử Việt Nam dành cho mọi người,
              giúp bạn hiểu hơn về cội nguồn, trân trọng hiện tại và hướng tới
              tương lai.
            </p>
          </div>

          {/* Cột 3: Bỏ tiêu đề "Liên kết nhanh", chỉ còn 4 links khớp mẫu */}
          <div className="space-y-2 lg:px-8 lg:border-l lg:border-[var(--border-gold)]/30 flex flex-col justify-center">
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link
                  href="/"
                  className="text-[var(--ink)] hover:text-[var(--primary)] transition-colors inline-block py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                >
                  Khám phá lịch sử
                </Link>
              </li>
              <li>
                <Link
                  href="#timeline"
                  className="text-[var(--ink)] hover:text-[var(--primary)] transition-colors inline-block py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                >
                  Dòng thời gian
                </Link>
              </li>
              <li>
                <Link
                  href="#nhan-vat"
                  className="text-[var(--ink)] hover:text-[var(--primary)] transition-colors inline-block py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                >
                  Nhân vật
                </Link>
              </li>
              <li>
                <Link
                  href="#dang-ky"
                  className="text-[var(--ink)] hover:text-[var(--primary)] transition-colors inline-block py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                >
                  Tài khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Kết nối với chúng tôi (3 icon tròn 32px: SVG Facebook, YouTube, Link lucide) */}
          <div className="space-y-3 lg:pl-8 lg:border-l lg:border-[var(--border-gold)]/30">
            <h4 className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--ink)] tracking-wide">
              Kết nối với chúng tôi
            </h4>
            <div className="flex items-center gap-3 pt-1">
              {/* Facebook - SVG Inline chuẩn */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[var(--ink)] text-white flex items-center justify-center hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                aria-label="Facebook HISGO"
              >
                <svg
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* YouTube - SVG Inline chuẩn */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[var(--ink)] text-white flex items-center justify-center hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                aria-label="Kênh YouTube HISGO"
              >
                <svg
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Liên kết - Lucide Link Icon */}
              <a
                href="https://hisgo.vn"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[var(--ink)] text-white flex items-center justify-center hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                aria-label="Liên kết ngoài HISGO"
              >
                <LinkIcon size={16} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>

        {/* Dòng dưới cùng */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-[var(--ink)] font-medium gap-3 text-center md:text-left">
          <p>© {currentYear} HISGO. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <Link
              href="#terms"
              className="hover:text-[var(--primary)] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] rounded px-1"
            >
              Điều khoản sử dụng
            </Link>
            <span className="hidden sm:inline text-[var(--border)]">|</span>
            <Link
              href="#privacy"
              className="hover:text-[var(--primary)] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] rounded px-1"
            >
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
