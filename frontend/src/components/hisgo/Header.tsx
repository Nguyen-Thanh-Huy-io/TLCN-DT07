"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PublicAuthService, USER_ROLE_LABELS, isStaffRole } from "@/services/auth/public-auth.service";
import { useAuthSession } from "@/services/auth/useAuthSession";

interface HeaderProps {
  activeSectionId?: string;
  activeTab?: string;
}

export function Header({
  activeSectionId = "explore",
  activeTab: initialActiveTab,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialActiveTab || activeSectionId);
  // undefined lúc SSR/hydrate → hiển thị như chưa đăng nhập.
  const user = useAuthSession() ?? null;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await PublicAuthService.logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    router.refresh();
  };

  const loginHref = `/login?redirect=${encodeURIComponent(pathname || "/")}`;

  const navLinks = [
    { id: "explore", label: "Trang chủ", href: "/" },
    { id: "curriculum", label: "Chương trình học", href: "/chuong-trinh-hoc" },
    { id: "timeline", label: "Dòng thời gian", href: "/dong-thoi-gian" },
    { id: "nhan-vat", label: "Nhân vật", href: "/nhan-vat" },
    { id: "di-tich", label: "Di tích", href: "/di-tich" },
  ];

  // Theo dõi vị trí cuộn bằng IntersectionObserver để active tab tương ứng
  // (các id dưới đây phải khớp đúng với id thật trên frontend/src/app/page.tsx)
  useEffect(() => {
    const sectionToTab: Record<string, string> = {
      top: "explore",
      timeline: "timeline",
      characters: "explore",
      explore: "explore",
    };

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120; // Offset chiều cao header
      for (const [sectionId, tab] of Object.entries(sectionToTab)) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveTab(tab);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Khóa cuộn trang khi menu mobile mở, trap focus và đóng bằng ESC / click ra ngoài
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        toggleButtonRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.replace("#", "");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        targetEl.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
        setActiveTab(id);
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border)] transition-all">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        {/* Left: Logo Hoa Sen + Text HISGO */}
        <Link
          href="/"
          className="flex items-center gap-3 group select-none"
        >
          {/* Lotus Flower SVG 7 cánh thanh thoát (2 sắc độ --gold và --gold-light) */}
          <div className="text-[var(--gold)] flex items-center justify-center transition-transform group-hover:scale-105">
            <svg
              width="36"
              height="36"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-sm"
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
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-extrabold tracking-wider text-[var(--ink)]">
            HISGO
          </span>
        </Link>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.id)}
                className={`relative py-2 text-sm lg:text-base font-medium font-[family-name:var(--font-body)] transition-colors ${
                  isActive
                    ? "text-[var(--primary)] font-semibold"
                    : "text-[var(--text-body)] hover:text-[var(--primary)]"
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--primary)] rounded-full transition-all"
                    aria-hidden="true"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: User Login & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {user ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] text-[var(--ink)] hover:bg-[var(--bg-page)] transition-colors"
                aria-expanded={userMenuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                  {user.username?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate">{user.username || user.email}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-1.5 shadow-xl z-50">
                  <div className="px-3.5 py-2 text-xs text-[var(--text-body)] truncate border-b border-[var(--border)]">
                    {user.email}
                    <span className="mt-0.5 block font-semibold text-[var(--primary)]">
                      {USER_ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                  <Link
                    href="/tai-khoan"
                    className="block px-3.5 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                  >
                    Tài khoản của tôi
                  </Link>
                  {isStaffRole(user.role) && (
                    <Link
                      href="/cms"
                      className="block px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                    >
                      Vào trang quản trị
                    </Link>
                  )}
                  <Link
                    href="/tai-khoan#hoc-tap"
                    className="block px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                  >
                    Lộ trình của tôi
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={loginHref}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium font-[family-name:var(--font-body)] text-[var(--ink)] hover:text-[var(--primary)] transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Đăng nhập</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            ref={toggleButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--ink)] hover:text-[var(--primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu di động"}
            aria-expanded={mobileMenuOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 12h16M4 6h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bg-[var(--overlay-ink)]/60 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={menuRef}
            className="absolute top-full left-0 right-0 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-6 space-y-3 shadow-2xl z-50 md:hidden animate-fadeIn"
          >
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href, link.id)}
                  className={`block py-3 px-4 rounded-[var(--radius-btn)] text-base font-medium font-[family-name:var(--font-body)] transition-colors ${
                    isActive
                      ? "bg-[var(--bg-page)] text-[var(--primary)] font-bold border-l-4 border-[var(--primary)]"
                      : "text-[var(--text-body)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)]"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}

            <div className="pt-4 border-t border-[var(--border)]">
              {user ? (
                <div className="space-y-2">
                  <div className="px-4 text-sm text-[var(--text-body)] truncate">
                    Đang đăng nhập: <strong className="text-[var(--ink)]">{user.username || user.email}</strong>
                  </div>
                  <Link
                    href="/tai-khoan"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 px-4 bg-[var(--primary)] text-white text-center rounded-[var(--radius-btn)] font-medium text-sm"
                  >
                    Tài khoản của tôi
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-3 px-4 border border-[var(--border)] text-[var(--ink)] text-center rounded-[var(--radius-btn)] font-medium text-sm"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  href={loginHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 bg-[var(--primary)] text-white text-center rounded-[var(--radius-btn)] font-medium text-sm flex items-center justify-center gap-2"
                >
                  <span>Đăng nhập tài khoản</span>
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
