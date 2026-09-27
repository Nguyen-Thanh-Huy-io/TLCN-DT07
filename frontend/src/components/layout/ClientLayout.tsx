"use client";
import React, { useState } from "react";
import { Sidebar, Topbar } from "@/components/FigmaUI";
import { usePathname, useRouter } from "next/navigation";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);

  // Derive the 'page' identifier from the first path segment only
  // e.g. /lessons/create → 'lessons', /periods → 'periods', / → 'dashboard'
  let page = "dashboard";
  if (pathname !== "/") {
    page = pathname.replace(/^\//, "").split("/")[0];
  }

  // Handle setPage triggered by Sidebar
  const setPage = (newPage: string) => {
    if (newPage === "dashboard") {
      router.push("/");
    } else {
      router.push(`/${newPage}`);
    }
    setMobileNav(false);
  };

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        open={mobileNav}
        close={() => setMobileNav(false)}
      />
      <div className="main-shell">
        <Topbar page={page} openNav={() => setMobileNav(true)} />
        {children}
      </div>
    </div>
  );
}
