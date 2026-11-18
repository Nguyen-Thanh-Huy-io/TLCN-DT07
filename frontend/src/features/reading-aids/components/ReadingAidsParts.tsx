'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Eye,
  Highlighter,
  Info,
  ListChecks,
  ListTree,
  MapPin,
  Moon,
  Printer,
  Sun,
  Sunset,
  User,
  X,
} from 'lucide-react';
import { ArticleKindEnum } from '@/constants/enums';
import type { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';
import type { NoteItem } from '@/features/notes/services/note.service';
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
  TOC = 'toc',
  ANNOTATIONS = 'annotations',
  DISPLAY = 'display',
}

export interface ReadingPreferences {
  textSize: ReadingTextSize;
  lineSpacing: ReadingLineSpacing;
  contentWidth: ReadingContentWidth;
  theme: ReadingThemeMode;
}

export const DEFAULT_READING_PREFS: ReadingPreferences = {
  textSize: ReadingTextSize.MD,
  lineSpacing: ReadingLineSpacing.NORMAL,
  contentWidth: ReadingContentWidth.MEDIUM,
  theme: ReadingThemeMode.SEPIA,
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
      className="w-68 sm:w-72 rounded-2xl border border-stone-200/90 bg-[#FFFCF5] p-3.5 text-stone-800 shadow-2xl"
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

        {onToggleFocusMode && (
          <div className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-[#8B261E]" />
              <div>
                <span className="block font-bold text-stone-800">Chế độ tập trung</span>
                <span className="block text-[10px] text-stone-500">Ẩn thành phần phụ & làm mờ thanh công cụ</span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(focusMode)}
              onClick={onToggleFocusMode}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                focusMode ? 'bg-[#8B261E]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                  focusMode ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
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

export function ReadingTocModal({
  toc,
  readProgress,
  onJumpToHeading,
  onSummarizeSection,
  onClose,
}: {
  toc: LessonTocEntry[];
  readProgress?: number;
  onJumpToHeading: (headingId: string) => void;
  onSummarizeSection?: (headingId: string, headingText: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 backdrop-blur-xs sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mục lục bài viết"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full flex-col rounded-t-2xl border border-stone-200 bg-[#FFFCF5] shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5">
          <div className="flex items-center gap-2 text-[#5C2A1E]">
            <ListTree size={18} />
            <h2 className="text-base font-bold">Mục lục bài viết</h2>
            <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-xs font-semibold text-stone-700">
              {toc.length} đề mục
            </span>
            {typeof readProgress === 'number' && (
              <span className="rounded-full bg-[#8B261E]/10 px-2 py-0.5 text-xs font-bold text-[#8B261E]">
                Đã đọc {readProgress}%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng mục lục"
            className="cursor-pointer rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {toc.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-stone-500">
              Bài viết này ngắn nên không chia đề mục.
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

enum AnnotationTabKey {
  FOOTNOTES = 'FOOTNOTES',
  HIGHLIGHTS = 'HIGHLIGHTS',
  PEOPLE = 'PEOPLE',
  PLACES = 'PLACES',
  EVENTS = 'EVENTS',
}

const ENTITY_TABS: ReadonlyArray<{
  tab: AnnotationTabKey;
  kind: ArticleKind;
  label: string;
  icon: React.ReactNode;
}> = [
  { tab: AnnotationTabKey.PEOPLE, kind: ArticleKindEnum.PERSON, label: 'Nhân vật', icon: <User size={14} /> },
  { tab: AnnotationTabKey.PLACES, kind: ArticleKindEnum.LOCATION, label: 'Địa danh', icon: <MapPin size={14} /> },
  { tab: AnnotationTabKey.EVENTS, kind: ArticleKindEnum.EVENT, label: 'Sự kiện', icon: <CalendarDays size={14} /> },
];

export function ReadingAnnotationsModal({
  footnotes,
  highlightedNotes,
  entities,
  onJumpToFootnote,
  onOpenNoteDrawer,
  onClose,
}: {
  footnotes: FootnoteEntry[];
  highlightedNotes: NoteItem[];
  entities: ReadingEntity[];
  onJumpToFootnote: (index: string) => void;
  onOpenNoteDrawer?: () => void;
  onClose: () => void;
}) {
  const entityTabs = ENTITY_TABS.map((t) => ({
    ...t,
    items: entities.filter((e) => e.kind === t.kind),
  })).filter((t) => t.items.length > 0);

  const tabs = [
    ...(footnotes.length > 0
      ? [{ tab: AnnotationTabKey.FOOTNOTES, label: `Chú giải (${footnotes.length})`, icon: <Info size={14} /> }]
      : []),
    ...(highlightedNotes.length > 0
      ? [
          {
            tab: AnnotationTabKey.HIGHLIGHTS,
            label: `Đã đánh dấu (${highlightedNotes.length})`,
            icon: <Highlighter size={14} />,
          },
        ]
      : []),
    ...entityTabs.map((t) => ({ ...t, label: `${t.label} (${t.items.length})` })),
  ];

  const [chosenTab, setChosenTab] = useState<AnnotationTabKey | null>(null);
  const activeTab = tabs.some((t) => t.tab === chosenTab) ? chosenTab : (tabs[0]?.tab ?? AnnotationTabKey.FOOTNOTES);

  const renderContent = () => {
    if (tabs.length === 0) {
      return (
        <div className="px-6 py-12 text-center text-sm text-stone-500">
          Chưa có chú thích hoặc đoạn đánh dấu nào trong bài viết này. Bôi đen văn bản trên bài để đánh dấu nhanh.
        </div>
      );
    }
    if (activeTab === AnnotationTabKey.FOOTNOTES) {
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
    if (activeTab === AnnotationTabKey.HIGHLIGHTS) {
      return (
        <ul className="divide-y divide-stone-200">
          {highlightedNotes.map((note) => (
            <li key={note.id} className="px-4 py-3">
              {note.highlightText && (
                <blockquote className="border-l-2 border-[#8B261E] pl-2.5 text-xs italic text-stone-600">
                  “{note.highlightText}”
                </blockquote>
              )}
              {note.content && <p className="mt-1.5 text-sm text-stone-800">{note.content}</p>}
              {onOpenNoteDrawer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNoteDrawer();
                  }}
                  className="mt-1.5 cursor-pointer text-xs font-semibold text-[#8B261E] hover:underline"
                >
                  Mở trong sổ ghi chú →
                </button>
              )}
            </li>
          ))}
        </ul>
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
        aria-label="Chú thích & Đánh dấu"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full flex-col rounded-t-2xl border border-stone-200 bg-[#FFFCF5] shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5">
          <div className="flex items-center gap-2 text-[#5C2A1E]">
            <Info size={18} />
            <h2 className="text-base font-bold">Chú thích & Đánh dấu</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chú thích"
            className="cursor-pointer rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            <X size={20} />
          </button>
        </div>

        {tabs.length > 0 && (
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
        )}

        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
