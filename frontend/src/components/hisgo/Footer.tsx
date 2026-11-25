'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, Link as LinkIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SOCIAL_LINKS } from "@/constants/routes";

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
                  href="/kham-pha-khai-niem"
                  className="text-[var(--ink)] hover:text-[var(--primary)] transition-colors inline-block py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                >
                  Bản đồ Khái niệm AI
                </Link>
              </li>
              <li>
                <Link
                  href="/dong-thoi-gian"
                  className="text-[var(--ink)] hover:text-[var(--primary)] transition-colors inline-block py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                >
                  Dòng thời gian
                </Link>
              </li>
              <li>
                <Link
                  href="/bai-viet?chuyen-muc=nhan-vat"
                  className="text-[var(--ink)] hover:text-[var(--primary)] transition-colors inline-block py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                >
                  Nhân vật lịch sử
                </Link>
              </li>
              <li>
                <Link
                  href="/tai-khoan"
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
                href={SOCIAL_LINKS.FACEBOOK}
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
                href={SOCIAL_LINKS.YOUTUBE}
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
                href={SOCIAL_LINKS.HOMEPAGE}
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
              href="/bai-viet"
              className="hover:text-[var(--primary)] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] rounded px-1"
            >
              Thư viện bài viết
            </Link>
            <span className="hidden sm:inline text-[var(--border)]">|</span>
            <Link
              href="/chuong-trinh-hoc"
              className="hover:text-[var(--primary)] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] rounded px-1"
            >
              Chương trình học
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Merged from ScrollToTopButton.tsx ---
export interface ScrollToTopButtonProps {
  threshold?: number;
  className?: string;
}

export function ScrollToTopButton({
  threshold = 350,
  className = "",
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;
      setVisible(currentScroll > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className={`sk-scroll-top-btn ${className}`}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.75, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.75, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          aria-label="Cuộn lên đầu trang"
          title="Cuộn lên đầu trang"
        >
          <ArrowUp size={20} className="sk-scroll-top-icon" />
          <span className="sk-sr-only">Lên đầu trang</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// --- Merged from HeritageAmbientBackground.tsx ---
export function HeritageAmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <div className="absolute -top-32 -right-32 sm:-top-48 sm:-right-48 w-[500px] h-[500px] sm:w-[750px] sm:h-[750px] opacity-[0.038] text-[var(--primary,#7A1F24)]">
        <DongSonDrumSvg className="w-full h-full animate-[spin_360s_linear_infinite]" />
      </div>
      <div className="absolute -bottom-40 -left-40 sm:-bottom-56 sm:-left-56 w-[450px] h-[450px] sm:w-[680px] sm:h-[680px] opacity-[0.032] text-[var(--gold,#B8893F)]">
        <DongSonDrumSvg className="w-full h-full animate-[spin_420s_linear_infinite_reverse]" />
      </div>
    </div>
  );
}

function DongSonDrumSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 600" fill="none" stroke="currentColor" className={className}>
      <circle cx="300" cy="300" r="290" strokeWidth="2.5" />
      <circle cx="300" cy="300" r="282" strokeWidth="1.2" strokeDasharray="3 4" />
      <circle cx="300" cy="300" r="270" strokeWidth="2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 300 300)`}>
          <path d="M 300 48 Q 308 65 315 85 Q 295 80 280 88 Q 292 72 300 48 Z" fill="currentColor" opacity="0.9" />
          <path d="M 315 85 Q 330 92 345 95 Q 320 100 310 102 Z" fill="currentColor" opacity="0.8" />
        </g>
      ))}
      <circle cx="300" cy="300" r="200" strokeWidth="1.8" />
      <circle cx="300" cy="300" r="192" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="300" cy="300" r="180" strokeWidth="2" />
      {[...Array(36)].map((_, i) => (
        <line key={i} x1="300" y1="180" x2="300" y2="192" strokeWidth="1.5" transform={`rotate(${i * 10} 300 300)`} />
      ))}
      <circle cx="300" cy="300" r="140" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="132" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="300" cy="300" r="120" strokeWidth="2" />
      <circle cx="300" cy="300" r="48" fill="currentColor" opacity="0.15" />
      {[...Array(14)].map((_, i) => (
        <g key={i} transform={`rotate(${i * (360 / 14)} 300 300)`}>
          <polygon points="300,195 292,252 308,252" fill="currentColor" opacity="0.85" />
          <line x1="300" y1="252" x2="300" y2="300" strokeWidth="1" opacity="0.4" />
        </g>
      ))}
      <circle cx="300" cy="300" r="22" strokeWidth="2" fill="none" />
      <circle cx="300" cy="300" r="8" fill="currentColor" />
    </svg>
  );
}
