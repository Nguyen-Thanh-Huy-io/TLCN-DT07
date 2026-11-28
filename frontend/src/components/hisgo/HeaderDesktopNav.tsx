'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Sparkles, BookOpen } from 'lucide-react';
import {
  NAVIGATION_PILLARS,
  DESKTOP_NAV_ACTIVE_CLS,
  DESKTOP_NAV_IDLE_CLS,
  isLearningActive,
  isTimelineActive,
  isCommunityActive,
  isExploreActive,
} from './header-navigation.config';
import {
  EXPLORE_STATIC_ROUTES,
  EXPLORE_STATIC_LABELS,
  type ResolvedExploreCategory,
} from './category-navigation.facade';
import { KeyboardKey, NavigationPillarId } from '@/constants/enums';

const DROPDOWN_PANEL_BASE_CLS =
  'rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] shadow-2xl z-50 text-sm animate-in fade-in zoom-in-95 duration-150';
const CHEVRON_TRANSITION_CLS = 'transition-transform duration-200';
const CHEVRON_ROTATE_CLS = 'rotate-180';

interface HeaderDesktopNavProps {
  dynamicCategories: ResolvedExploreCategory[];
}

export function HeaderDesktopNav({ dynamicCategories }: HeaderDesktopNavProps) {
  const pathname = usePathname();
  const [learningOpen, setLearningOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);

  const learningRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);

  const closeAll = () => {
    setLearningOpen(false);
    setExploreOpen(false);
    setCommunityOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        learningRef.current &&
        !learningRef.current.contains(target) &&
        exploreRef.current &&
        !exploreRef.current.contains(target) &&
        communityRef.current &&
        !communityRef.current.contains(target)
      ) {
        closeAll();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) {
        closeAll();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const learningPillar = NAVIGATION_PILLARS.find((p) => p.id === NavigationPillarId.LEARNING);
  const communityPillar = NAVIGATION_PILLARS.find((p) => p.id === NavigationPillarId.COMMUNITY);
  const timelinePillar = NAVIGATION_PILLARS.find((p) => p.id === NavigationPillarId.TIMELINE);

  const learningActive = isLearningActive(pathname);
  const timelineActive = isTimelineActive(pathname);
  const exploreRouteActive = isExploreActive(pathname);
  const communityActive = isCommunityActive(pathname);

  return (
    <nav
      className="hidden xl:flex items-center gap-1.5 2xl:gap-2 p-1 rounded-full bg-black/20 border border-[#D4AE67]/25 backdrop-blur-sm"
      aria-label="Thanh điều hướng chính"
    >
      {/* 1. Trụ cột: Học tập (Dropdown) */}
      <div ref={learningRef} className="relative">
        <button
          type="button"
          aria-expanded={learningOpen}
          onClick={() => {
            setLearningOpen((v) => !v);
            setExploreOpen(false);
            setCommunityOpen(false);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] whitespace-nowrap transition-all duration-200 cursor-pointer ${
            learningActive ? DESKTOP_NAV_ACTIVE_CLS : DESKTOP_NAV_IDLE_CLS
          }`}
        >
          <span>{learningPillar?.label ?? 'Học tập'}</span>
          <ChevronDown
            size={14}
            className={`${CHEVRON_TRANSITION_CLS} ${learningOpen ? CHEVRON_ROTATE_CLS : ''}`}
          />
        </button>

        {learningOpen && (
          <div className={`absolute left-0 mt-2 w-72 p-2 ${DROPDOWN_PANEL_BASE_CLS}`}>
            <div className="space-y-1">
              {learningPillar?.subItems?.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={closeAll}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-[#F0E6CF]"
                  >
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EFE3C7] text-[#7A1F24]">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs font-bold text-[var(--ink,#14233F)]">
                          {item.label}
                        </strong>
                        {item.badge && (
                          <span className="rounded bg-[#7A1F24]/10 px-1.5 py-0.2 text-[9px] font-bold text-[#7A1F24]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-[var(--text-muted,#7A6B57)] leading-tight mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Trụ cột: Dòng thời gian */}
      {timelinePillar?.href && (
        <Link
          href={timelinePillar.href}
          onClick={closeAll}
          className={`relative px-3 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] whitespace-nowrap transition-all duration-200 ${
            timelineActive ? DESKTOP_NAV_ACTIVE_CLS : DESKTOP_NAV_IDLE_CLS
          }`}
        >
          {timelinePillar.label}
        </Link>
      )}

      {/* 3. Trụ cột: Khám phá tri thức (Dropdown) */}
      <div ref={exploreRef} className="relative">
        <button
          type="button"
          aria-expanded={exploreOpen}
          onClick={() => {
            setExploreOpen((v) => !v);
            setLearningOpen(false);
            setCommunityOpen(false);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] whitespace-nowrap transition-all duration-200 cursor-pointer ${
            exploreRouteActive ? DESKTOP_NAV_ACTIVE_CLS : DESKTOP_NAV_IDLE_CLS
          }`}
        >
          <span>Khám phá</span>
          <ChevronDown
            size={14}
            className={`${CHEVRON_TRANSITION_CLS} ${exploreOpen ? CHEVRON_ROTATE_CLS : ''}`}
          />
        </button>

        {exploreOpen && (
          <div className={`absolute left-0 mt-2 w-80 p-2.5 ${DROPDOWN_PANEL_BASE_CLS}`}>
            {/* 1. Tính năng nổi bật */}
            <div className="space-y-1">
              <Link
                href={EXPLORE_STATIC_ROUTES.CONCEPT_MAP}
                onClick={closeAll}
                className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-[#F0E6CF]"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7A1F24] to-[#521217] text-[#FFF6E3] shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-bold text-[var(--ink,#14233F)]">
                      {EXPLORE_STATIC_LABELS.CONCEPT_MAP}
                    </strong>
                    <span className="rounded bg-[#7A1F24]/10 px-1 py-0.2 text-[9px] font-bold text-[#7A1F24]">
                      {EXPLORE_STATIC_LABELS.CONCEPT_MAP_BADGE}
                    </span>
                  </div>
                  <span className="block text-[11px] text-[var(--text-muted,#7A6B57)] leading-tight mt-0.5">
                    {EXPLORE_STATIC_LABELS.CONCEPT_MAP_DESC}
                  </span>
                </div>
              </Link>

              <Link
                href={EXPLORE_STATIC_ROUTES.ALL_ARTICLES}
                onClick={closeAll}
                className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-[#F0E6CF]"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EFE3C7] text-[#7A1F24]">
                  <BookOpen size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="block text-xs font-bold text-[var(--ink,#14233F)]">
                    {EXPLORE_STATIC_LABELS.ALL_ARTICLES}
                  </strong>
                  <span className="block text-[11px] text-[var(--text-muted,#7A6B57)] leading-tight mt-0.5">
                    {EXPLORE_STATIC_LABELS.ALL_ARTICLES_DESC}
                  </span>
                </div>
              </Link>
            </div>

            {/* 2. Chuyên mục lịch sử từ CSDL */}
            <div className="mt-2 pt-2 border-t border-[var(--border,#E2D5B8)]/80">
              <div className="px-2 pb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted,#7A6B57)]">
                  {EXPLORE_STATIC_LABELS.CATEGORY_SECTION_TITLE}
                </span>
                <Link
                  href={EXPLORE_STATIC_ROUTES.ALL_ARTICLES}
                  onClick={closeAll}
                  className="text-[10px] font-semibold text-[#7A1F24] hover:underline"
                >
                  Tất cả →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {dynamicCategories.map((cat) => {
                  const IconComp = cat.icon;
                  return (
                    <Link
                      key={cat.id}
                      href={cat.href}
                      onClick={closeAll}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--ink,#14233F)] hover:bg-[#F0E6CF] transition font-medium truncate"
                      title={cat.description}
                    >
                      <IconComp size={13} className="shrink-0 text-[#7A1F24]" />
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Trụ cột: Cộng đồng (Dropdown) */}
      <div ref={communityRef} className="relative">
        <button
          type="button"
          aria-expanded={communityOpen}
          onClick={() => {
            setCommunityOpen((v) => !v);
            setLearningOpen(false);
            setExploreOpen(false);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium font-[family-name:var(--font-body)] whitespace-nowrap transition-all duration-200 cursor-pointer ${
            communityActive ? DESKTOP_NAV_ACTIVE_CLS : DESKTOP_NAV_IDLE_CLS
          }`}
        >
          <span>{communityPillar?.label ?? 'Cộng đồng'}</span>
          <ChevronDown
            size={14}
            className={`${CHEVRON_TRANSITION_CLS} ${communityOpen ? CHEVRON_ROTATE_CLS : ''}`}
          />
        </button>

        {communityOpen && (
          <div className={`absolute right-0 mt-2 w-72 p-2 ${DROPDOWN_PANEL_BASE_CLS}`}>
            <div className="space-y-1">
              {communityPillar?.subItems?.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={closeAll}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-[#F0E6CF]"
                  >
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EFE3C7] text-[#7A1F24]">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="block text-xs font-bold text-[var(--ink,#14233F)]">
                        {item.label}
                      </strong>
                      <span className="block text-[11px] text-[var(--text-muted,#7A6B57)] leading-tight mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
