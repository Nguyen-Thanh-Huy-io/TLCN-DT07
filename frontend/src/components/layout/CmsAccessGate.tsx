"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/services/auth/useAuthSession";
import {
  isReviewerRole,
  isStaffRole,
  isSuperadminRole,
  USER_ROLE_LABELS,
} from "@/services/auth/public-auth.service";

/** Trang CMS chỉ một số vai trò được vào (mặc định: mọi nhân sự). */
const PAGE_ACCESS: Record<string, (role: string) => boolean> = {
  review: isReviewerRole,
  users: isSuperadminRole,
};

export function canAccessCmsPage(page: string, role?: string | null): boolean {
  if (!isStaffRole(role)) return false;
  const rule = PAGE_ACCESS[page];
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

/**
 * Bảo vệ toàn bộ CMS: chưa đăng nhập → về trang đăng nhập; người học (USER) → không có quyền.
 * Backend vẫn kiểm tra lại quyền ở từng API — cổng này chỉ để giao diện không mở nhầm.
 */
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
