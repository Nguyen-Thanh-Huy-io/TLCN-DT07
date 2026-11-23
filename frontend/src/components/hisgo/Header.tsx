"use client";
import { KeyboardKey } from '@/constants/enums';
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PublicAuthService, USER_ROLE_LABELS, isStaffRole } from "@/services/auth/public-auth.service";
import { useAuthSession } from "@/services/auth/use-auth-session";
import { GlobalSearch } from "@/features/search/GlobalSearch";
import { NotificationBell } from "@/components/hisgo/NotificationBell";
import { HeaderStreakPopover } from "@/features/gamification/components/HeaderStreakPopover";
import { BookOpen, ChevronDown, Crown, Landmark, ScrollText, Swords, User } from "lucide-react";

enum NavLinkId {
  EXPLORE = 'explore',
  CURRICULUM = 'curriculum',
  TIMELINE = 'timeline',
  BLOG = 'blog',
  COMMUNITY = 'community',
  QUIZ = 'quiz',
}

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
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
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
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) { setExploreOpen(false); }
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
    { id: NavLinkId.EXPLORE, label: "Trang chủ", href: "/" },
    { id: NavLinkId.CURRICULUM, label: "Chương trình học", href: "/chuong-trinh-hoc" },
    { id: NavLinkId.TIMELINE, label: "Dòng thời gian", href: "/dong-thoi-gian" },
    { id: NavLinkId.BLOG, label: "Blog", href: "/blog" },
    { id: NavLinkId.COMMUNITY, label: "Cộng đồng", href: "/cong-dong" },
    { id: NavLinkId.QUIZ, label: "Luyện tập", href: "/luyen-tap" },
  ];

  const exploreItems = [
    { label: "Tất cả bài viết", href: "/bai-viet", icon: BookOpen, desc: "Toàn bộ kho bài viết & tư liệu lịch sử" },
    { label: "Sự kiện lịch sử", href: "/bai-viet?chuyen-muc=su-kien", icon: Swords, desc: "Các trận đánh, biến cố và hiệp định" },
    { label: "Nhân vật lịch sử", href: "/bai-viet?chuyen-muc=nhan-vat", icon: User, desc: "Vua chúa, tướng lĩnh, anh hùng dân tộc" },
    { label: "Di tích & Địa danh", href: "/bai-viet?chuyen-muc=di-tich", icon: Landmark, desc: "Chiến trường xưa, đền thờ, di sản" },
    { label: "Triều đại lịch sử", href: "/bai-viet?chuyen-muc=trieu-dai", icon: Crown, desc: "Các vương triều và kỷ nguyên trị vì" },
    { label: "Tác phẩm & Tư liệu", href: "/bai-viet?chuyen-muc=tac-pham-tu-lieu", icon: ScrollText, desc: "Tác phẩm văn học, quân sự và sử liệu" },
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
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#4E1015] via-[#65171D] to-[#4E1015] backdrop-blur-md border-b border-[#D4AE67]/35 shadow-[0_4px_24px_rgba(40,8,12,0.22)] transition-all">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-2 xl:gap-3 2xl:gap-4">
        {/* Left: Logo Hoa Sen + Text HISGO */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group select-none"
        >
          {/* Lotus Flower SVG 7 cánh thanh thoát (2 sắc độ --gold và --gold-light) */}
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
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-extrabold tracking-wider text-[#FFF6E3] drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            HISGO
          </span>
        </Link>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-2 p-1 rounded-full bg-black/20 border border-[#D4AE67]/25 backdrop-blur-sm">
          {navLinks.slice(0, 5).map((link) => {
            const isActive =
              link.id === NavLinkId.BLOG
                ? pathname?.startsWith("/blog")
                : link.id === NavLinkId.COMMUNITY
                  ? pathname?.startsWith("/cong-dong")
                  : activeTab === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.id)}
                className={`relative px-2.5 2xl:px-3.5 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#C99C48] via-[#B8893F] to-[#A67832] text-[#3D0A0E] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-[#F3DEAB]/60"
                    : "text-[#F5EEDC]/85 hover:text-[#FFF9ED] hover:bg-white/10"
                }`}
              >
                {link.label}
              </a>
            );
          })}

          {/* Dropdown Khám phá */}
          <div ref={exploreRef} className="relative">
            <button
              type="button"
              onClick={() => setExploreOpen((v) => !v)}
              className="flex items-center gap-1 px-2.5 2xl:px-3.5 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] whitespace-nowrap text-[#F5EEDC]/85 hover:text-[#FFF9ED] hover:bg-white/10 transition-all duration-200"
            >
              <span>Khám phá</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${exploreOpen ? "rotate-180" : ""}`} />
            </button>
            {exploreOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] p-2 shadow-2xl z-50 text-sm animate-in fade-in zoom-in-95 duration-150">
                {exploreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setExploreOpen(false)}
                      className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-[#F0E6CF]"
                    >
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#EFE3C7] text-[#7A1F24]">
                        <Icon size={15} />
                      </div>
                      <div>
                        <strong className="block text-xs font-bold text-[var(--ink,#14233F)]">{item.label}</strong>
                        <span className="block text-[11px] text-[var(--text-muted,#7A6B57)] leading-tight">{item.desc}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link Luyện tập */}
          <Link
            href="/luyen-tap"
            className={`relative px-2.5 2xl:px-3.5 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] whitespace-nowrap transition-all duration-200 ${
              pathname?.startsWith("/luyen-tap")
                ? "bg-gradient-to-r from-[#C99C48] via-[#B8893F] to-[#A67832] text-[#3D0A0E] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-[#F3DEAB]/60"
                : "text-[#F5EEDC]/85 hover:text-[#FFF9ED] hover:bg-white/10"
            }`}
          >
            Luyện tập
          </Link>
        </nav>

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
                <span className="hidden 2xl:inline max-w-[110px] truncate text-[#FFF6E3] font-medium">{user.displayName || user.username || user.email}</span>
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
            className="xl:hidden p-2 text-[#F5EEDC] hover:text-[#D4AE67] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AE67]"
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
            className="fixed inset-0 top-16 bg-[var(--overlay-ink)]/60 backdrop-blur-xs z-40 xl:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={menuRef}
            className="absolute top-full left-0 right-0 border-b border-[#D4AE67]/35 bg-[#521217] px-6 py-6 space-y-3 shadow-2xl z-50 xl:hidden animate-fadeIn"
          >
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href, link.id)}
                  className={`block py-3 px-4 rounded-xl text-base font-medium font-[family-name:var(--font-body)] transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-[#C99C48] to-[#B8893F] text-[#3D0A0E] font-bold border-l-4 border-[#F3DEAB] shadow-md"
                      : "text-[#F5EEDC]/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}

            <div className="pt-4 border-t border-[#D4AE67]/25">
              {user ? (
                <div className="space-y-2">
                  <div className="px-4 text-sm text-[#F5EEDC]/80 truncate">
                    Đang đăng nhập: <strong className="text-[#FFF6E3]">{user.displayName || user.username || user.email}</strong>
                  </div>
                  <Link
                    href="/tai-khoan"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 px-4 bg-gradient-to-r from-[#C99C48] via-[#B8893F] to-[#A67832] text-[#3D0A0E] text-center rounded-xl font-bold text-sm shadow-md"
                  >
                    Tài khoản của tôi
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-3 px-4 border border-[#D4AE67]/40 text-[#F5EEDC] text-center rounded-xl font-medium text-sm hover:bg-white/10 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  href={loginHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#C99C48] via-[#B8893F] to-[#A67832] text-[#3D0A0E] text-center rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md"
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
