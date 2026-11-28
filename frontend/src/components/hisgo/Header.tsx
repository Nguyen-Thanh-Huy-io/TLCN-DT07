'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PublicAuthService, USER_ROLE_LABELS, isStaffRole } from '@/services/auth/public-auth.service';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { GlobalSearch } from '@/features/search/GlobalSearch';
import { NotificationBell } from '@/components/hisgo/NotificationBell';
import { HeaderStreakPopover } from '@/features/gamification/components/ArticleReadCompleteButton';
import { useNavigationCategories } from './category-navigation.facade';
import { HeaderDesktopNav } from './HeaderDesktopNav';
import { HeaderMobileDrawer } from './HeaderMobileDrawer';
import type { PublicCategory } from '@/services/public/public-content.service';
import { KeyboardKey } from '@/constants/enums';

interface HeaderProps {
  activeSectionId?: string;
  activeTab?: string;
  categories?: PublicCategory[];
}

export function Header({
  categories: initialCategories,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { categories: dynamicCategories } = useNavigationCategories(initialCategories);
  const user = useAuthSession() ?? null;
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Đóng user menu khi click ra ngoài hoặc bấm ESC
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await PublicAuthService.logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    router.refresh();
  };

  const isAuthPage = pathname === '/login' || pathname === '/dang-ky';
  const loginHref = isAuthPage ? '/login' : `/login?redirect=${encodeURIComponent(pathname || '/')}`;

  // Khóa cuộn trang khi menu mobile mở, trap focus và đóng bằng ESC
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) {
        setMobileMenuOpen(false);
        toggleButtonRef.current?.focus();
        return;
      }

      if (e.key === KeyboardKey.TAB && menuRef.current) {
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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#4E1015] via-[#65171D] to-[#4E1015] backdrop-blur-md border-b border-[#D4AE67]/35 shadow-[0_4px_24px_rgba(40,8,12,0.22)] transition-all">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-2 xl:gap-3 2xl:gap-4">
        {/* Left: Logo Hoa Sen + Text HISGO */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group select-none"
        >
          <div className="text-[#E7C77E] flex items-center justify-center transition-transform group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(231,199,126,0.35)]">
            <svg
              width="36"
              height="36"
              viewBox="0 0 100 100"
              fill="none"
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
                d="M32 76 C42 84 58 84 68 76 C62 74 38 74 32 76 Z"
                fill="var(--gold)"
              />
            </svg>
          </div>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-extrabold tracking-wider text-[#FFF6E3] drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            HISGO
          </span>
        </Link>

        {/* Center: Desktop Navigation Bar (4 Trụ cột phương án A) */}
        <HeaderDesktopNav dynamicCategories={dynamicCategories} />

        {/* Right: Search, User Login & Mobile Hamburger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <GlobalSearch />
          {user && <HeaderStreakPopover enabled={Boolean(user)} />}
          {user && <NotificationBell />}
          {user ? (
            <div ref={userMenuRef} className="relative hidden xl:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] text-[#F5EEDC] hover:bg-white/10 transition-colors"
                aria-expanded={userMenuOpen}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover border-2 border-[#D4AE67]"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#C99C48] to-[#B8893F] text-xs font-bold text-[#3D0A0E] shadow-sm">
                    {user.username?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="hidden 2xl:inline max-w-[110px] truncate text-[#FFF6E3] font-medium">
                  {user.displayName || user.username || user.email}
                </span>
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
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                  >
                    Hồ sơ tài khoản
                  </Link>
                  {isStaffRole(user.role) && (
                    <Link
                      href="/cms"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                    >
                      Vào trang quản trị
                    </Link>
                  )}
                  <Link
                    href="/tai-khoan?tab=hoc-tap"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                  >
                    Lộ trình của tôi
                  </Link>
                  <Link
                    href="/tai-khoan?tab=the-ghi-nho"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                  >
                    Thẻ ghi nhớ (SM-2)
                  </Link>
                  <Link
                    href="/tai-khoan?tab=so-do-tu-duy"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                  >
                    Sơ đồ tư duy
                  </Link>
                  <Link
                    href="/tai-khoan?tab=tu-lieu"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors"
                  >
                    Tư liệu đã lưu
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg-page)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={loginHref}
              className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold font-[family-name:var(--font-body)] bg-gradient-to-r from-[#C99C48] via-[#B8893F] to-[#A67832] text-[#3D0A0E] hover:brightness-105 shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-[#F3DEAB]/60 transition-all"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
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
            className="xl:hidden p-2 text-[#F5EEDC] hover:text-[#D4AE67] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AE67] cursor-pointer"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu di động'}
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

      {/* Mobile Drawer (4 Trụ cột + Tri thức động từ DB) */}
      {mobileMenuOpen && (
        <HeaderMobileDrawer
          pathname={pathname}
          user={user}
          dynamicCategories={dynamicCategories}
          onClose={() => setMobileMenuOpen(false)}
          onLogout={handleLogout}
          loginHref={loginHref}
          drawerRef={menuRef}
        />
      )}
    </header>
  );
}
