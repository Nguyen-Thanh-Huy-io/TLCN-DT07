'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Eye,
  Info,
  ListChecks,
  ListTree,
  MapPin,
  Moon,
  Printer,
  StickyNote,
  Sun,
  Sunset,
  User,
  X,
} from 'lucide-react';
import { ArticleKindEnum } from '@/constants/enums';
import type { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';
import type { ArticleKind } from '@/services/public/article-kind';

export enum ReadingTextSize {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
}

export enum ReadingLineSpacing {
  TIGHT = 'tight',
  NORMAL = 'normal',
  RELAXED = 'relaxed',
}

export enum ReadingContentWidth {
  NARROW = 'narrow',
  MEDIUM = 'medium',
  WIDE = 'wide',
}

export enum ReadingThemeMode {
  LIGHT = 'light',
  SEPIA = 'sepia',
  DARK = 'dark',
}

export enum ReadingActivePanel {
  EXPLORE = 'explore',
  DISPLAY = 'display',
}

export interface ReadingPreferences {
  textSize: ReadingTextSize;
  lineSpacing: ReadingLineSpacing;
  contentWidth: ReadingContentWidth;
  theme: ReadingThemeMode;
  marginSticky: boolean;
}

export const DEFAULT_READING_PREFS: ReadingPreferences = {
  textSize: ReadingTextSize.MD,
  lineSpacing: ReadingLineSpacing.NORMAL,
  contentWidth: ReadingContentWidth.MEDIUM,
  theme: ReadingThemeMode.SEPIA,
  marginSticky: true,
};

export const READING_PREFS_STORAGE_KEY = 'hisgo:reading-prefs';

export function readSavedReadingPrefs(): ReadingPreferences {
  if (typeof window === 'undefined') return DEFAULT_READING_PREFS;
  try {
    const raw = localStorage.getItem(READING_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_READING_PREFS;
    const parsed = JSON.parse(raw) as Partial<ReadingPreferences>;
    return {
      textSize: parsed.textSize ?? DEFAULT_READING_PREFS.textSize,
      lineSpacing: parsed.lineSpacing ?? DEFAULT_READING_PREFS.lineSpacing,
      contentWidth: parsed.contentWidth ?? DEFAULT_READING_PREFS.contentWidth,
      theme: parsed.theme ?? DEFAULT_READING_PREFS.theme,
      marginSticky: parsed.marginSticky ?? DEFAULT_READING_PREFS.marginSticky,
    };
  } catch {
    return DEFAULT_READING_PREFS;
  }
}

export interface ReadingDisplayControls {
  prefs: ReadingPreferences;
  onChangePrefs: (next: Partial<ReadingPreferences>) => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  readProgress?: number;
  onPrint?: () => void;
}

/** Bài viết / nhân vật / địa danh được nhắc tới trong bài. */
export interface ReadingEntity {
  id: string;
  name: string;
  href: string;
  kind: ArticleKind;
  note?: string | null;
  summary?: string | null;
}

export interface FootnoteEntry {
  index: string;
  text: string;
}

const TEXT_SIZE_OPTIONS: ReadonlyArray<readonly [ReadingTextSize, string, string]> = [
  [ReadingTextSize.SM, 'A−', 'Cỡ chữ nhỏ'],
  [ReadingTextSize.MD, 'A', 'Cỡ chữ vừa'],
  [ReadingTextSize.LG, 'A+', 'Cỡ chữ lớn'],
];

const LINE_SPACING_OPTIONS: ReadonlyArray<readonly [ReadingLineSpacing, string]> = [
  [ReadingLineSpacing.TIGHT, 'Gọn'],
  [ReadingLineSpacing.NORMAL, 'Vừa'],
  [ReadingLineSpacing.RELAXED, 'Thoáng'],
];

const CONTENT_WIDTH_OPTIONS: ReadonlyArray<readonly [ReadingContentWidth, string]> = [
  [ReadingContentWidth.NARROW, 'Hẹp'],
  [ReadingContentWidth.MEDIUM, 'Vừa'],
  [ReadingContentWidth.WIDE, 'Rộng'],
];

const THEME_OPTIONS: ReadonlyArray<{
  value: ReadingThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: ReadingThemeMode.LIGHT, label: 'Sáng', icon: Sun },
  { value: ReadingThemeMode.SEPIA, label: 'Giấy ngà', icon: Sunset },
  { value: ReadingThemeMode.DARK, label: 'Tối', icon: Moon },
];

function DisplaySwitchRow({
  icon: Icon,
  title,
  subtitle,
  checked,
  onToggle,
}: {
  icon: typeof Eye;
  title: string;
  subtitle: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-[#8B261E]" />
        <div>
          <span className="block font-bold text-stone-800">{title}</span>
          <span className="block text-[10px] text-stone-500">{subtitle}</span>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
          checked ? 'bg-[#8B261E]' : 'bg-stone-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function ReadingDisplayPopover({
  controls,
  onClose,
}: {
  controls: ReadingDisplayControls;
  onClose: () => void;
}) {
  const { prefs, onChangePrefs, focusMode, onToggleFocusMode, onPrint } = controls;
  const segmentBtnClass = (active: boolean) =>
    `cursor-pointer rounded-lg py-1.5 font-bold transition ${
      active ? 'bg-[#8B261E] text-white shadow-xs' : 'text-stone-700 hover:bg-stone-300/60'
    }`;

  return (
    <div
      role="dialog"
      aria-label="Tùy chỉnh hiển thị"
      className="w-68 rounded-2xl border border-stone-200/90 bg-[#FFFCF5] p-3.5 text-stone-800 shadow-2xl sm:w-72"
    >
      <div className="mb-3 flex items-center justify-between border-b border-stone-200/80 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5C2A1E]">Tùy chỉnh hiển thị</span>
      </div>

      <div className="space-y-3.5 text-xs">
        <div>
          <span className="mb-1.5 block font-semibold text-stone-600">Cỡ chữ</span>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-stone-200/60 p-1">
            {TEXT_SIZE_OPTIONS.map(([size, symbol, title]) => (
              <button
                key={size}
                type="button"
                title={title}
                onClick={() => onChangePrefs({ textSize: size })}
                className={segmentBtnClass(prefs.textSize === size)}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block font-semibold text-stone-600">Khoảng cách dòng</span>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-stone-200/60 p-1">
            {LINE_SPACING_OPTIONS.map(([spacing, label]) => (
              <button
                key={spacing}
                type="button"
                onClick={() => onChangePrefs({ lineSpacing: spacing })}
                className={segmentBtnClass(prefs.lineSpacing === spacing)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block font-semibold text-stone-600">Độ rộng nội dung</span>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-stone-200/60 p-1">
            {CONTENT_WIDTH_OPTIONS.map(([width, label]) => (
              <button
                key={width}
                type="button"
                onClick={() => onChangePrefs({ contentWidth: width })}
                className={segmentBtnClass(prefs.contentWidth === width)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block font-semibold text-stone-600">Giao diện đọc</span>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-stone-200/60 p-1">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChangePrefs({ theme: value })}
                className={`inline-flex items-center justify-center gap-1 ${segmentBtnClass(prefs.theme === value)}`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <DisplaySwitchRow
          icon={StickyNote}
          title="Sticky ghi chú lề phải"
          subtitle="Hiện thẻ ghi chú cụm ngoài lề khi màn hình rộng"
          checked={prefs.marginSticky}
          onToggle={() => onChangePrefs({ marginSticky: !prefs.marginSticky })}
        />

        {onToggleFocusMode && (
          <DisplaySwitchRow
            icon={Eye}
            title="Chế độ tập trung"
            subtitle="Ẩn thành phần phụ & làm mờ thanh công cụ"
            checked={Boolean(focusMode)}
            onToggle={onToggleFocusMode}
          />
        )}

        {onPrint && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onPrint();
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white py-2 font-semibold text-[#5C2A1E] hover:bg-stone-100"
          >
            <Printer size={13} />
            <span>In / Xuất PDF</span>
          </button>
        )}
      </div>
    </div>
  );
}

enum ExploreTabKey {
  TOC = 'TOC',
  FOOTNOTES = 'FOOTNOTES',
  PEOPLE = 'PEOPLE',
  PLACES = 'PLACES',
  EVENTS = 'EVENTS',
}

const ENTITY_TABS: ReadonlyArray<{
  tab: ExploreTabKey;
  kind: ArticleKind;
  label: string;
  icon: React.ReactNode;
}> = [
  { tab: ExploreTabKey.PEOPLE, kind: ArticleKindEnum.PERSON, label: 'Nhân vật', icon: <User size={14} /> },
  { tab: ExploreTabKey.PLACES, kind: ArticleKindEnum.LOCATION, label: 'Địa danh', icon: <MapPin size={14} /> },
  { tab: ExploreTabKey.EVENTS, kind: ArticleKindEnum.EVENT, label: 'Sự kiện', icon: <CalendarDays size={14} /> },
];

/** Hộp thoại thống nhất "Trong bài": gộp Mục lục & Chú giải / Thực thể liên quan. */
export function ReadingExploreModal({
  toc,
  readProgress,
  footnotes,
  entities,
  onJumpToHeading,
  onSummarizeSection,
  onJumpToFootnote,
  onClose,
}: {
  toc: LessonTocEntry[];
  readProgress?: number;
  footnotes: FootnoteEntry[];
  entities: ReadingEntity[];
  onJumpToHeading: (headingId: string) => void;
  onSummarizeSection?: (headingId: string, headingText: string) => void;
  onJumpToFootnote: (index: string) => void;
  onClose: () => void;
}) {
  const entityTabs = ENTITY_TABS.map((t) => ({
    ...t,
    items: entities.filter((e) => e.kind === t.kind),
  })).filter((t) => t.items.length > 0);

  const tabs = [
    { tab: ExploreTabKey.TOC, label: `Mục lục (${toc.length})`, icon: <ListTree size={14} /> },
    ...(footnotes.length > 0
      ? [{ tab: ExploreTabKey.FOOTNOTES, label: `Chú giải (${footnotes.length})`, icon: <Info size={14} /> }]
      : []),
    ...entityTabs.map((t) => ({ ...t, label: `${t.label} (${t.items.length})` })),
  ];

  const [chosenTab, setChosenTab] = useState<ExploreTabKey>(ExploreTabKey.TOC);
  const activeTab = tabs.some((t) => t.tab === chosenTab) ? chosenTab : ExploreTabKey.TOC;

  const renderContent = () => {
    if (activeTab === ExploreTabKey.TOC) {
      if (toc.length === 0) {
        return (
          <div className="px-6 py-12 text-center text-sm text-stone-500">
            Bài viết này ngắn nên không chia đề mục.
          </div>
        );
      }
      return (
        <ol className="divide-y divide-stone-100">
          {toc.map((item, idx) => (
            <li key={item.id} className="flex items-center hover:bg-stone-50">
              <button
                type="button"
                onClick={() => onJumpToHeading(item.id)}
                style={{ paddingLeft: `${(item.level - 1) * 14 + 16}px` }}
                className="flex-1 cursor-pointer py-3 pr-3 text-left text-sm text-stone-700 hover:text-[#8B261E]"
              >
                <span className="mr-2 text-xs font-semibold text-stone-400">{idx + 1}.</span>
                <span className={item.level <= 2 ? 'font-semibold' : ''}>{item.text}</span>
              </button>
              {onSummarizeSection && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSummarizeSection(item.id, item.text);
                  }}
                  className="mr-3 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-stone-500 hover:bg-[#8B261E]/10 hover:text-[#8B261E]"
                  title="Viết tóm tắt cho mục này"
                >
                  <ListChecks size={12} /> Tóm tắt
                </button>
              )}
            </li>
          ))}
        </ol>
      );
    }

    if (activeTab === ExploreTabKey.FOOTNOTES) {
      return (
        <ol className="divide-y divide-stone-200">
          {footnotes.map((fn) => (
            <li key={fn.index}>
              <button
                type="button"
                onClick={() => onJumpToFootnote(fn.index)}
                className="flex w-full cursor-pointer gap-2.5 px-4 py-3 text-left text-sm leading-relaxed text-stone-700 hover:bg-stone-50"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8B261E] text-[11px] font-bold text-white">
                  {fn.index}
                </span>
                <span>{fn.text}</span>
              </button>
            </li>
          ))}
        </ol>
      );
    }

    const activeEntities = entityTabs.find((t) => t.tab === activeTab)?.items ?? [];
    return (
      <ul className="divide-y divide-stone-200">
        {activeEntities.map((entity) => (
          <li key={entity.id} className="px-4 py-3">
            <Link href={entity.href} onClick={onClose} className="text-sm font-semibold text-[#8B261E] hover:underline">
              {entity.name}
            </Link>
            {entity.note && <span className="ml-2 text-xs text-stone-500">· {entity.note}</span>}
            {entity.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">{entity.summary}</p>}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 backdrop-blur-xs sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Trong bài"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full flex-col rounded-t-2xl border border-stone-200 bg-[#FFFCF5] shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5">
          <div className="flex items-center gap-2 text-[#5C2A1E]">
            <ListTree size={18} />
            <h2 className="text-base font-bold">Trong bài</h2>
            {typeof readProgress === 'number' && (
              <span className="rounded-full bg-[#8B261E]/10 px-2 py-0.5 text-xs font-bold text-[#8B261E]">
                Đã đọc {readProgress}%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng trong bài"
            className="cursor-pointer rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            <X size={20} />
          </button>
        </div>

        <div
          role="tablist"
          className="flex shrink-0 gap-1 overflow-x-auto overflow-y-hidden border-b border-stone-200 px-3 pt-2.5"
        >
          {tabs.map((t) => (
            <button
              key={t.tab}
              type="button"
              role="tab"
              aria-selected={activeTab === t.tab}
              onClick={() => setChosenTab(t.tab)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-semibold ${
                activeTab === t.tab
                  ? 'border-stone-300 bg-white text-stone-900'
                  : 'border-transparent text-[#5C2A1E] hover:bg-stone-100'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
