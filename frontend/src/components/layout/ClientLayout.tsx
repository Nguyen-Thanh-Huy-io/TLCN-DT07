"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar, PageHeader } from "@/components/layout/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { ScrollToTopButton, HeritageAmbientBackground } from "@/components/hisgo/Footer";
import { HisgoAiChatWidget } from "@/features/ai-assistant/components/HisgoAiChatWidget";
import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/common/CommonUi";
import { IconName } from "@/constants/enums";
import { navigationFacade } from "@/services/navigation/navigation-strategy.service";
import { useAuthSession } from "@/services/auth/use-auth-session";
import {
  isReviewerRole,
  isStaffRole,
  isSuperadminRole,
  USER_ROLE_LABELS,
} from "@/services/auth/public-auth.service";
import { NavigationPageKey } from "@/constants/routes";
import { NotificationBell } from "@/components/hisgo/NotificationBell";

const PAGE_ACCESS: Partial<Record<NavigationPageKey, (role: string) => boolean>> = {
  [NavigationPageKey.REVIEW]: isReviewerRole,
  [NavigationPageKey.BLOG_REVIEW]: isReviewerRole,
  [NavigationPageKey.MODERATION]: isReviewerRole,
  [NavigationPageKey.USERS]: isSuperadminRole,
  [NavigationPageKey.GAMIFICATION]: isReviewerRole,
};

export function canAccessCmsPage(page: string, role?: string | null): boolean {
  if (!isStaffRole(role)) return false;
  const rule = PAGE_ACCESS[page as NavigationPageKey];
  return rule ? rule(role as string) : true;
}

function GateMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export function CmsAccessGate({ page, children }: { page: string; children: React.ReactNode }) {
  const user = useAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      const back = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(back)}`);
    }
  }, [user, router]);

  if (user === undefined || user === null) {
    return <GateMessage title="Đang kiểm tra phiên đăng nhập...">Vui lòng chờ trong giây lát.</GateMessage>;
  }

  if (!isStaffRole(user.role)) {
    return (
      <GateMessage title="Khu vực dành cho nhân sự biên soạn">
        Tài khoản <strong>{user.username || user.email}</strong> ({USER_ROLE_LABELS[user.role] ?? user.role}) không có
        quyền vào CMS.{" "}
        <Link href="/" className="font-semibold text-red-800 underline">
          Về trang chủ
        </Link>
      </GateMessage>
    );
  }

  if (!canAccessCmsPage(page, user.role)) {
    return (
      <GateMessage title="Không đủ quyền">
        Vai trò {USER_ROLE_LABELS[user.role] ?? user.role} không truy cập được trang này.{" "}
        <Link href="/cms" className="font-semibold text-red-800 underline">
          Về Dashboard
        </Link>
      </GateMessage>
    );
  }

  return <>{children}</>;
}

export function Topbar({ page, openNav }: { page: string; openNav: () => void }) {
  const { groupTitle, parentLabel, parentRoute, pageTitle } =
    navigationFacade.resolveBreadcrumb(page);
  const isRootDashboard = page === NavigationPageKey.DASHBOARD || !page;
  const user = useAuthSession();

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          type="button"
          className="menu-btn lg:hidden"
          onClick={openNav}
          aria-label="Mở menu di động"
        >
          <Icon name={IconName.MENU} size={15} />
        </button>
        <Link href="/" className="text-slate-700 hover:text-slate-900 transition-colors font-medium text-xs">
          HISGO CMS
        </Link>
        <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
        {!isRootDashboard && parentLabel && parentRoute ? (
          <>
            <Link href={parentRoute} className="text-slate-600 hover:text-slate-900 transition-colors text-xs">
              {parentLabel}
            </Link>
            <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
          </>
        ) : !isRootDashboard && groupTitle !== 'HISGO CMS' ? (
          <>
            <span className="text-slate-600 text-xs">{groupTitle}</span>
            <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
          </>
        ) : null}
        <strong className="text-slate-900 text-xs font-semibold">{pageTitle}</strong>
      </div>

      <div className="top-actions">
        <label className="global-search">
          <Icon name={IconName.SEARCH} size={14} className="text-slate-400" />
          <input placeholder="Tìm nhanh (⌘K)..." />
          <kbd>⌘K</kbd>
        </label>
        <NotificationBell variant="topbar" />
        <span className="top-divider" />
        <Avatar text={(user?.username || user?.email || '').slice(0, 2).toUpperCase()} small />
        <div className="top-user">
          <strong>{user?.username || user?.email}</strong>
          <span>{user ? USER_ROLE_LABELS[user.role] ?? user.role : ''}</span>
        </div>
      </div>
    </header>
  );
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'hisgo_sidebar_collapsed';
const STORAGE_VALUE_TRUE = 'true';
const DASHBOARD_PAGE_KEY = 'dashboard';

/** Trang công khai (không khung CMS). Thêm route công khai mới thì thêm tiền tố vào đây. */
const PUBLIC_ROUTE_PREFIXES = [
  '/login',
  '/dang-ky',
  '/tai-khoan',
  '/chuong-trinh-hoc',
  '/bai-hoc',
  '/bai-viet',
  '/blog',
  '/chuyen-muc',
  '/dong-thoi-gian',
  '/giai-doan',
  '/thuc-the',
  '/nhan-vat',
  '/su-kien',
  '/di-tich',
  '/luyen-tap',
  '/cong-dong',
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapsed state from localStorage on client-side mount
  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
        if (savedState !== null) {
          setCollapsed(savedState === STORAGE_VALUE_TRUE);
        }
      } catch {
        // Ignore localStorage errors in SSR or restricted environments
      }
    });
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // If public HISGO route (Home, Styleguide, Login, or public user-facing pages), render standalone without CMS Admin Sidebar/Topbar
  const isPublicBlogRoute = pathname === "/blog" || pathname.startsWith("/blog/");
  const isHisgoPublicRoute =
    pathname === "/" ||
    (!pathname.startsWith("/blog-review") &&
      PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) ||
    isPublicBlogRoute;

  if (isHisgoPublicRoute) {
    return (
      <>
        <HeritageAmbientBackground />
        {children}
        <HisgoAiChatWidget />
        <ScrollToTopButton />
      </>
    );
  }

  // Derive the 'page' identifier from the first path segment only
  let page = DASHBOARD_PAGE_KEY;
  if (pathname !== "/") {
    page = pathname.replace(/^\//, "").split("/")[0];
  }

  // Handle setPage triggered by Sidebar
  const setPage = (newPage: string) => {
    if (newPage === DASHBOARD_PAGE_KEY) {
      router.push("/cms");
    } else {
      router.push(`/${newPage}`);
    }
    setMobileNav(false);
  };

  return (
    <CmsAccessGate page={page}>
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        page={page}
        setPage={setPage}
        open={mobileNav}
        close={() => setMobileNav(false)}
        collapsed={collapsed}
        toggleCollapse={toggleCollapse}
      />
      <div className="main-shell">
        <Topbar
          page={page}
          openNav={() => setMobileNav(true)}
        />
        <main className="page">
          <PageHeader pathname={pathname} />
          {children}
        </main>
      </div>
    </div>
    <HisgoAiChatWidget />
    <ScrollToTopButton />
    </CmsAccessGate>
  );
}
