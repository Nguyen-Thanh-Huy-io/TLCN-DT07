"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ScrollToTopButtonProps {
  /** Khoảng cách cuộn tối thiểu (pixel) để nút xuất hiện. Mặc định 350px */
  threshold?: number;
  /** Tùy chọn vị trí hoặc class tùy biến nếu cần */
  className?: string;
}

/**
 * Shared Global UI Component: Nút cuộn nhanh lên đầu trang (Back to Top).
 * Tự động theo dõi vị trí cuộn trang, hiển thị hiệu ứng fade/scale mượt mà,
 * hoạt động trên toàn bộ các trang của hệ thống HISGO.
 */
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className={`sk-scroll-top-btn ${className}`}
          onClick={scrollToTop}
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
