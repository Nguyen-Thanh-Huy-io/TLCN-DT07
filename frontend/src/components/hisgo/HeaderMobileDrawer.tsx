'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, BookOpen, ChevronRight, Home } from 'lucide-react';
import {
  NAVIGATION_PILLARS,
  MOBILE_HOME_LINK,
  isTimelineActive,
} from './header-navigation.config';
import {
  EXPLORE_STATIC_ROUTES,
  EXPLORE_STATIC_LABELS,
  type ResolvedExploreCategory,
} from './category-navigation.facade';
import type { CurrentUser } from '@/services/auth/public-auth.service';
import { NavigationPillarId } from '@/constants/enums';

const DRAWER_LINK_IDLE_CLS = 'text-[#F5EEDC]/90 hover:bg-white/10 hover:text-white';
const DRAWER_ACTIVE_GRADIENT_CLS =
  'bg-gradient-to-r from-[#C99C48] to-[#B8893F] text-[#3D0A0E] font-bold shadow-md';

interface HeaderMobileDrawerProps {
  pathname: string | null;
  user: CurrentUser | null;
  dynamicCategories: ResolvedExploreCategory[];
  onClose: () => void;
  onLogout: () => void;
  loginHref: string;
  drawerRef: React.RefObject<HTMLDivElement | null>;
}

export function HeaderMobileDrawer({
  pathname,
  user,
  dynamicCategories,
  onClose,
  onLogout,
  loginHref,
  drawerRef,
}: HeaderMobileDrawerProps) {
  const isHomeActive = pathname === '/';
  const timelineActive = isTimelineActive(pathname);

  const learningPillar = NAVIGATION_PILLARS.find((p) => p.id === NavigationPillarId.LEARNING);
  const communityPillar = NAVIGATION_PILLARS.find((p) => p.id === NavigationPillarId.COMMUNITY);
  const timelinePillar = NAVIGATION_PILLARS.find((p) => p.id === NavigationPillarId.TIMELINE);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 top-16 bg-[var(--overlay-ink,#0f0708)]/60 backdrop-blur-xs z-40 xl:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng di động"
        className="absolute top-full left-0 right-0 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[#D4AE67]/35 bg-[#521217] px-4 py-4 space-y-3 shadow-2xl z-50 xl:hidden animate-fadeIn"
      >
        {/* 1. Trang chủ */}
        <Link
          href={MOBILE_HOME_LINK.href}
          onClick={onClose}
          className={`flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl text-sm font-medium font-[family-name:var(--font-body)] transition-colors ${
            isHomeActive ? DRAWER_ACTIVE_GRADIENT_CLS : DRAWER_LINK_IDLE_CLS
          }`}
        >
          <Home size={16} className={isHomeActive ? 'text-[#3D0A0E]' : 'text-[#E7C77E]'} />
          <span>{MOBILE_HOME_LINK.label}</span>
        </Link>

        {/* 2. Nhóm: Học tập */}
        <div className="rounded-xl bg-black/15 p-2 border border-[#D4AE67]/20 space-y-1">
          <p className="px-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#E7C77E]/80">
            {learningPillar?.label ?? 'Học tập'}
          </p>
          {learningPillar?.subItems?.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#C99C48]/30 text-[#FFF6E3] font-bold'
                    : DRAWER_LINK_IDLE_CLS
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-[#E7C77E]" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-[#D4AE67] px-1.5 py-0.5 text-[9px] font-bold text-[#3D0A0E]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* 3. Dòng thời gian */}
        {timelinePillar?.href && (
          <Link
            href={timelinePillar.href}
            onClick={onClose}
            className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-medium font-[family-name:var(--font-body)] transition-colors ${
              timelineActive ? DRAWER_ACTIVE_GRADIENT_CLS : DRAWER_LINK_IDLE_CLS
            }`}
          >
            <span>{timelinePillar.label}</span>
            <ChevronRight size={14} className="opacity-70" />
          </Link>
        )}

        {/* 4. Nhóm: Cộng đồng */}
        <div className="rounded-xl bg-black/15 p-2 border border-[#D4AE67]/20 space-y-1">
          <p className="px-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#E7C77E]/80">
            {communityPillar?.label ?? 'Cộng đồng'}
          </p>
          {communityPillar?.subItems?.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#C99C48]/30 text-[#FFF6E3] font-bold'
                    : DRAWER_LINK_IDLE_CLS
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-[#E7C77E]" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={12} className="opacity-60" />
              </Link>
            );
          })}
        </div>

        {/* 5. Khám phá kho tri thức */}
        <div className="pt-2 border-t border-[#D4AE67]/25 space-y-2">
          <p className="px-2 text-xs font-bold uppercase tracking-wider text-[#E7C77E]/85">
            Khám phá kho tri thức
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <Link
              href={EXPLORE_STATIC_ROUTES.CONCEPT_MAP}
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#FFF6E3] bg-white/10 hover:bg-white/15 transition-colors border border-[#D4AE67]/30"
            >
              <Sparkles size={14} className="shrink-0 text-[#E7C77E]" />
              <span className="font-semibold">{EXPLORE_STATIC_LABELS.CONCEPT_MAP}</span>
              <span className="ml-auto rounded bg-[#D4AE67] px-1.5 py-0.5 text-[9px] font-bold text-[#3D0A0E]">
                {EXPLORE_STATIC_LABELS.CONCEPT_MAP_BADGE}
              </span>
            </Link>

            <Link
              href={EXPLORE_STATIC_ROUTES.ALL_ARTICLES}
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#FFF6E3] bg-white/10 hover:bg-white/15 transition-colors border border-[#D4AE67]/30"
            >
              <BookOpen size={14} className="shrink-0 text-[#E7C77E]" />
              <span className="font-semibold">{EXPLORE_STATIC_LABELS.ALL_ARTICLES}</span>
            </Link>
          </div>

          {/* Chuyên mục CSDL */}
          <div className="pt-1">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#E7C77E]/60">
              {EXPLORE_STATIC_LABELS.CATEGORY_SECTION_TITLE}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {dynamicCategories.map((cat) => {
                const IconComp = cat.icon;
                return (
                  <Link
                    key={cat.id}
                    href={cat.href}
                    onClick={onClose}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#F5EEDC]/90 hover:bg-white/10 hover:text-white transition-colors truncate"
                  >
                    <IconComp size={13} className="shrink-0 text-[#E7C77E]" />
                    <span className="truncate">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6. Khu vực Tài khoản / Đăng nhập */}
        <div className="pt-3 border-t border-[#D4AE67]/25">
          {user ? (
            <div className="space-y-2">
              <div className="px-3 text-xs text-[#F5EEDC]/80 truncate">
                Đang đăng nhập:{' '}
                <strong className="text-[#FFF6E3]">
                  {user.displayName || user.username || user.email}
                </strong>
              </div>
              <Link
                href="/tai-khoan"
                onClick={onClose}
                className="block w-full py-2.5 px-3 bg-gradient-to-r from-[#C99C48] via-[#B8893F] to-[#A67832] text-[#3D0A0E] text-center rounded-xl font-bold text-xs shadow-md"
              >
                Tài khoản của tôi
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2 px-3 border border-[#D4AE67]/40 text-[#F5EEDC] text-center rounded-xl font-medium text-xs hover:bg-white/10 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href={loginHref}
              onClick={onClose}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-[#C99C48] via-[#B8893F] to-[#A67832] text-[#3D0A0E] text-center rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <span>Đăng nhập tài khoản</span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
