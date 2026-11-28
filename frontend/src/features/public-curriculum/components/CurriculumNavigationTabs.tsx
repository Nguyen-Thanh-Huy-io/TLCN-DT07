'use client';

import React from 'react';
import { Layers, Sparkles, BookOpen } from 'lucide-react';

export const CURRICULUM_TAB_KEYS = {
  CORE_TRACKS: 'tien-trinh',
  THEMATIC: 'chuyen-de',
  LIBRARY: 'thu-vien',
} as const;

export type CurriculumTabKey = (typeof CURRICULUM_TAB_KEYS)[keyof typeof CURRICULUM_TAB_KEYS];

interface CurriculumNavigationTabsProps {
  activeTab: CurriculumTabKey;
  onTabChange: (tab: CurriculumTabKey) => void;
  counts: {
    coreTracks: number;
    thematic: number;
    library: number;
  };
}

export function CurriculumNavigationTabs({
  activeTab,
  onTabChange,
  counts,
}: CurriculumNavigationTabsProps) {
  const tabs = [
    {
      key: CURRICULUM_TAB_KEYS.CORE_TRACKS,
      label: 'Mạch tiến trình cốt lõi',
      sublabel: 'Chuỗi niên biểu A → B → C',
      icon: Layers,
      count: counts.coreTracks,
    },
    {
      key: CURRICULUM_TAB_KEYS.THEMATIC,
      label: 'Chuyên đề chuyên sâu',
      sublabel: 'Khám phá tự do theo chủ đề',
      icon: Sparkles,
      count: counts.thematic,
    },
    {
      key: CURRICULUM_TAB_KEYS.LIBRARY,
      label: 'Thư viện bài học',
      sublabel: 'Kho tri thức tra cứu tự do',
      icon: BookOpen,
      count: counts.library,
    },
  ];

  return (
    <div className="border-b border-lh-line bg-lh-surface/60 backdrop-blur-sm">
      <div className="flex flex-wrap gap-2 py-2 sm:gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`group flex flex-1 min-w-[200px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? 'border-lh-brand/40 bg-lh-surface shadow-sm ring-1 ring-lh-brand/20'
                  : 'border-transparent bg-lh-surface-2/60 hover:border-lh-line hover:bg-lh-surface'
              }`}
            >
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl transition ${
                  isActive
                    ? 'bg-lh-brand text-white shadow-sm'
                    : 'bg-lh-surface text-lh-muted group-hover:text-lh-brand'
                }`}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold leading-tight ${
                      isActive ? 'text-lh-brand' : 'text-lh-ink'
                    }`}
                  >
                    {tab.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive
                        ? 'bg-lh-brand-soft text-lh-brand'
                        : 'bg-lh-surface text-lh-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-lh-muted">
                  {tab.sublabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
