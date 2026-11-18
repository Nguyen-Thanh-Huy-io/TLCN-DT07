'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Info, ListChecks, ListTree, MapPin, User, X } from 'lucide-react';
import { ArticleKindEnum, KeyboardKey } from '@/constants/enums';
import type { ArticleKind } from '@/services/public/article-kind';
import { ANNOTATION_DATA_ATTRS } from '@/features/lessons/extensions/annotation.extension';
import type { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';

/** Bài viết / nhân vật / địa danh được nhắc tới trong bài. */
export interface ReadingEntity {
  id: string;
  name: string;
  href: string;
  kind: ArticleKind;
  /** Vai trò / nhãn liên kết hoặc ngày tháng, hiện nhỏ cạnh tên. */
  note?: string | null;
  /** Tóm tắt của bài (trường Tóm tắt trong CMS), hiện tối đa 3 dòng dưới tên. */
  summary?: string | null;
}

interface EntityLetterGroup {
  letter: string;
  items: ReadingEntity[];
}

/** Chữ cái đầu để gom nhóm: bỏ dấu thanh / mũ (Â, Ơ → A, O) nhưng giữ Đ là một chữ riêng. */
const initialOf = (name: string) =>
  (name.trim()[0] ?? '#').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('vi');

/** Sắp theo thứ tự tiếng Việt rồi gom theo chữ cái đầu, như mục lục tra cứu. */
function groupByInitial(entities: ReadingEntity[]): EntityLetterGroup[] {
  const unique = [...new Map(entities.map((e) => [e.id, e])).values()];
  const sorted = unique.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const groups: EntityLetterGroup[] = [];
  sorted.forEach((entity) => {
    const letter = initialOf(entity.name);
    const last = groups[groups.length - 1];
    if (last?.letter === letter) last.items.push(entity);
    else groups.push({ letter, items: [entity] });
  });
  return groups;
}

function EntityGroups({ entities }: { entities: ReadingEntity[] }) {
  return (
    <div>
      {groupByInitial(entities).map((group) => (
        <section key={group.letter}>
          <div className="px-3 py-2.5 border-b border-stone-200">
            <span className="inline-flex w-6 h-6 rounded-full bg-stone-500 text-white text-[11px] font-bold items-center justify-center">
              {group.letter}
            </span>
          </div>
          <ul className="divide-y divide-stone-200 border-b border-stone-200">
            {group.items.map((entity) => (
              <li key={entity.id} className="px-3 py-3">
                <Link href={entity.href} className="text-[15px] text-[#2B6CB0] hover:underline">
                  {entity.name}
                </Link>
                {entity.note && <span className="ml-2 text-xs text-stone-500">· {entity.note}</span>}
                {entity.summary && (
                  <p className="mt-1 text-sm leading-relaxed text-stone-700 line-clamp-3">{entity.summary}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

interface FootnoteEntry {
  index: string;
  text: string;
}

enum ReadingAidsTab {
  TOC = 'TOC',
  FOOTNOTES = 'FOOTNOTES',
  PEOPLE = 'PEOPLE',
  PLACES = 'PLACES',
  EVENTS = 'EVENTS',
}

const ENTITY_TABS: { tab: ReadingAidsTab; kind: ArticleKind; label: string; icon: React.ReactNode }[] = [
  { tab: ReadingAidsTab.PEOPLE, kind: ArticleKindEnum.PERSON, label: 'Nhân vật', icon: <User size={15} /> },
  { tab: ReadingAidsTab.PLACES, kind: ArticleKindEnum.LOCATION, label: 'Địa danh', icon: <MapPin size={15} /> },
  { tab: ReadingAidsTab.EVENTS, kind: ArticleKindEnum.EVENT, label: 'Sự kiện', icon: <CalendarDays size={15} /> },
];

const FOOTNOTE_SELECTOR = `sup[${ANNOTATION_DATA_ATTRS.FOOTNOTE}]`;
/** Thuộc tính số thứ tự do useLessonAnnotations gắn lên từng chú thích. */
const FOOTNOTE_INDEX_ATTR = 'data-footnote-index';

/** Chú thích trong bài theo thứ tự xuất hiện; đọc sau khi useLessonAnnotations đã đánh số. */
function useFootnotes(contentRef: React.RefObject<HTMLElement | null>, htmlTrigger: string): FootnoteEntry[] {
  const [footnotes, setFootnotes] = useState<FootnoteEntry[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const root = contentRef.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOOTNOTE_SELECTOR)].map((el, idx) => ({
        index: el.getAttribute(FOOTNOTE_INDEX_ATTR) ?? String(idx + 1),
        text: el.getAttribute(ANNOTATION_DATA_ATTRS.FOOTNOTE)?.trim() ?? '',
      }));
      setFootnotes(items.filter((item) => item.text));
    });
    return () => clearTimeout(timer);
  }, [contentRef, htmlTrigger]);
  return footnotes;
}

function scrollToElement(el: Element | null) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (el instanceof HTMLElement) el.focus({ preventScroll: true });
}

interface ReadingAidsPanelProps {
  contentRef: React.RefObject<HTMLElement | null>;
  htmlTrigger: string;
  toc: LessonTocEntry[];
  entities: ReadingEntity[];
  /** Viết ghi chú tóm tắt cho một mục; không truyền thì mục lục không có nút "Tóm tắt". */
  onSummarizeSection?: (headingId: string, headingText: string) => void;
}

/**
 * Nút "Mục lục / Chú thích" mở bảng tra cứu nhanh trong bài: mục lục, chú thích đánh số, nhân vật,
 * địa danh, sự kiện được nhắc tới. Tab nào không có dữ liệu thì ẩn; không có gì thì ẩn cả nút.
 */
export function ReadingAidsPanel({ contentRef, htmlTrigger, toc, entities, onSummarizeSection }: ReadingAidsPanelProps) {
  const footnotes = useFootnotes(contentRef, htmlTrigger);
  const [open, setOpen] = useState(false);
  const [chosenTab, setChosenTab] = useState<ReadingAidsTab | null>(null);

  const entityTabs = ENTITY_TABS.map((t) => ({ ...t, items: entities.filter((e) => e.kind === t.kind) })).filter(
    (t) => t.items.length > 0,
  );
  const tabs = [
    ...(toc.length > 0 ? [{ tab: ReadingAidsTab.TOC, label: 'Mục lục', icon: <ListTree size={15} /> }] : []),
    ...(footnotes.length > 0 ? [{ tab: ReadingAidsTab.FOOTNOTES, label: 'Chú thích', icon: <Info size={15} /> }] : []),
    ...entityTabs,
  ];
  const activeTab = tabs.some((t) => t.tab === chosenTab) ? chosenTab : tabs[0]?.tab;

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  if (tabs.length === 0) return null;

  const jumpTo = (el: Element | null) => {
    setOpen(false);
    // Đợi bảng đóng để cuộn không bị khoá bởi lớp phủ.
    setTimeout(() => scrollToElement(el));
  };

  const renderBody = () => {
    if (activeTab === ReadingAidsTab.TOC) {
      return (
        <ol className="divide-y divide-stone-100">
          {toc.map((item) => (
            <li key={item.id} className="flex items-center hover:bg-stone-50">
              <button
                type="button"
                onClick={() => jumpTo(document.getElementById(item.id))}
                style={{ paddingLeft: `${(item.level - 1) * 14 + 12}px` }}
                className="flex-1 text-left py-2.5 pr-3 text-sm text-stone-700 hover:text-[#8B261E] cursor-pointer"
              >
                {item.text}
              </button>
              {onSummarizeSection && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSummarizeSection(item.id, item.text);
                  }}
                  className="mr-2 shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-stone-500 hover:bg-[#8B261E]/10 hover:text-[#8B261E] cursor-pointer"
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
    if (activeTab === ReadingAidsTab.FOOTNOTES) {
      return (
        <ol className="divide-y divide-stone-200">
          {footnotes.map((fn) => (
            <li key={fn.index}>
              <button
                type="button"
                onClick={() =>
                  jumpTo(contentRef.current?.querySelector(`${FOOTNOTE_SELECTOR}[${FOOTNOTE_INDEX_ATTR}="${fn.index}"]`) ?? null)
                }
                className="w-full text-left flex gap-2.5 py-3 px-3 text-sm leading-relaxed text-stone-700 hover:bg-stone-50 cursor-pointer"
                title="Xem chỗ chú thích trong bài"
              >
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-stone-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {fn.index}
                </span>
                <span>{fn.text}</span>
              </button>
            </li>
          ))}
        </ol>
      );
    }
    return <EntityGroups entities={entityTabs.find((t) => t.tab === activeTab)?.items ?? []} />;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-4 sm:left-6 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F3EAD8] border border-[#E5D3B0] text-[#5C2A1E] text-sm font-bold shadow-lg hover:bg-[#EBDDC2] cursor-pointer"
      >
        <Info size={16} /> Mục lục / Chú thích
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/40 backdrop-blur-xs" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Trong bài"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-xl max-h-[85vh] flex flex-col bg-[#FFFCF5] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <h2 className="text-lg font-bold text-[#5C2A1E]">Trong bài</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer">
                <X size={22} />
              </button>
            </div>

            <div role="tablist" className="flex shrink-0 gap-1 px-3 pt-3 border-b border-stone-200 overflow-x-auto overflow-y-hidden">
              {tabs.map((t) => (
                <button
                  key={t.tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.tab}
                  onClick={() => setChosenTab(t.tab)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-sm font-semibold border border-b-0 cursor-pointer ${
                    activeTab === t.tab
                      ? 'bg-white border-[#E8A0B4] text-stone-900'
                      : 'border-transparent text-[#5C2A1E] hover:bg-stone-100'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">{renderBody()}</div>

            <div className="px-5 py-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-2 rounded-full bg-[#F3EAD8] text-[#5C2A1E] font-bold text-sm hover:bg-[#EBDDC2] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
