"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CmsAccessGate } from "@/components/layout/CmsAccessGate";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";
import { FigureProfileProvider } from "@/components/figures/FigureProfileProvider";

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
  '/tag/',
  '/dong-thoi-gian',
  '/giai-doan',
  '/thuc-the',
  '/heritage',
  '/nhan-vat',
  '/su-kien',
  '/di-tich',
  '/chuong-su',
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
      <FigureProfileProvider>
        {children}
        <ScrollToTopButton />
      </FigureProfileProvider>
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
    <ScrollToTopButton />
    </CmsAccessGate>
  );
}
