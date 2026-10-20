"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'hisgo_sidebar_collapsed';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapsed state from localStorage on client-side mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (savedState !== null) {
        setCollapsed(savedState === 'true');
      }
    } catch {
      // Ignore localStorage errors in SSR or restricted environments
    }
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

  // If public HISGO route (landing page, styleguide...), render standalone without CMS Admin Sidebar/Topbar
  const isHisgoPublicRoute = !pathname.startsWith("/admin");
  if (isHisgoPublicRoute) {
    return <>{children}</>;
  }

  // Derive the 'page' identifier from the first path segment after /admin/
  // e.g. /admin/lessons/create → 'lessons', /admin → 'dashboard'
  let page = "dashboard";
  const rest = pathname.replace(/^\/admin\/?/, "");
  if (rest) {
    page = rest.split("/")[0];
  }

  // Handle setPage triggered by Sidebar
  const setPage = (newPage: string) => {
    if (newPage === "dashboard") {
      router.push("/admin");
    } else {
      router.push(`/admin/${newPage}`);
    }
    setMobileNav(false);
  };

  return (
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
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
        />
        <main className="page">
          <PageHeader pathname={pathname} />
          {children}
        </main>
      </div>
    </div>
  );
}
