'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Link2,
  MessageSquareQuote,
  Search,
  X,
  Check,
  Unlink,
  Trash2,
} from 'lucide-react';
import { ArticleApiService } from '@/services/entities/article.service';
import { TimelineApiService } from '@/services/entities/topic.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { dateLabelOf } from '@/utils/common';
import { KeyboardKey } from '@/constants/enums';
import { FOOTNOTE_NODE_NAME, WIKI_LINK_ROUTES } from '../../hooks/useLessonAnnotations';

export { WIKI_LINK_ROUTES };

export enum WikiLinkTargetType {
  INTERNAL_ENTITY = 'INTERNAL_ENTITY',
  INTERNAL_EVENT = 'INTERNAL_EVENT',
  EXTERNAL_URL = 'EXTERNAL_URL',
}

export interface IWikiLinkCandidate { id: string; title: string; subtitle: string; href: string; targetType: WikiLinkTargetType }
export interface IWikiLinkTargetStrategy { readonly type: WikiLinkTargetType; readonly label: string; readonly placeholder: string; searchCandidates(query: string): Promise<IWikiLinkCandidate[]>; resolveHref(rawUrl: string): string }

class InternalArticleLinkStrategy implements IWikiLinkTargetStrategy {
  public readonly type = WikiLinkTargetType.INTERNAL_ENTITY;
  public readonly label = 'Bài viết';
  public readonly placeholder = 'Tìm bài viết: nhân vật, sự kiện, di tích...';
  public async searchCandidates(query: string): Promise<IWikiLinkCandidate[]> {
    const res = await ArticleApiService.list({ search: query.trim() || undefined, limit: 8, sort: 'title' });
    return res.items.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: [item.category?.name, dateLabelOf(item)].filter(Boolean).join(' · ') || 'Bài viết',
      href: PUBLIC_ROUTES.ARTICLE(item.slug),
      targetType: WikiLinkTargetType.INTERNAL_ENTITY,
    }));
  }
  public resolveHref(rawUrl: string): string { return rawUrl.trim(); }
}

class InternalTimelineLinkStrategy implements IWikiLinkTargetStrategy {
  public readonly type = WikiLinkTargetType.INTERNAL_EVENT;
  public readonly label = 'Dòng thời gian';
  public readonly placeholder = 'Tìm dòng thời gian (VD: Nhà Trần)...';
  public async searchCandidates(query: string): Promise<IWikiLinkCandidate[]> {
    const res = await TimelineApiService.list({ search: query.trim() || undefined, limit: 8 });
    return res.items.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: `${t._count?.nodes ?? 0} mốc`,
      href: PUBLIC_ROUTES.TIMELINE(t.slug),
      targetType: WikiLinkTargetType.INTERNAL_EVENT,
    }));
  }
  public resolveHref(rawUrl: string): string { return rawUrl.trim(); }
}

class ExternalUrlLinkStrategy implements IWikiLinkTargetStrategy {
  public readonly type = WikiLinkTargetType.EXTERNAL_URL;
  public readonly label = 'Trang web';
  public readonly placeholder = 'Nhập địa chỉ liên kết (VD: https://vi.wikipedia.org/...)';
  public async searchCandidates(): Promise<IWikiLinkCandidate[]> { return []; }
  public resolveHref(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith(WIKI_LINK_ROUTES.HTTP_PREFIX) || trimmed.startsWith(WIKI_LINK_ROUTES.HTTPS_PREFIX) || trimmed.startsWith('/')) return trimmed;
    return `${WIKI_LINK_ROUTES.HTTPS_PREFIX}${trimmed}`;
  }
}

export class WikiLinkTargetStrategyFactory {
  private static readonly strategies: Record<WikiLinkTargetType, IWikiLinkTargetStrategy> = {
    [WikiLinkTargetType.INTERNAL_ENTITY]: new InternalArticleLinkStrategy(),
    [WikiLinkTargetType.INTERNAL_EVENT]: new InternalTimelineLinkStrategy(),
    [WikiLinkTargetType.EXTERNAL_URL]: new ExternalUrlLinkStrategy(),
  };
  public static getStrategy(type: WikiLinkTargetType): IWikiLinkTargetStrategy { return this.strategies[type] || this.strategies[WikiLinkTargetType.INTERNAL_ENTITY]; }
  public static getAllStrategies(): IWikiLinkTargetStrategy[] {
    return [this.strategies[WikiLinkTargetType.INTERNAL_ENTITY], this.strategies[WikiLinkTargetType.INTERNAL_EVENT], this.strategies[WikiLinkTargetType.EXTERNAL_URL]];
  }
  public static detectTargetTypeFromHref(href?: string | null): WikiLinkTargetType {
    if (!href) return WikiLinkTargetType.INTERNAL_ENTITY;
    if (href.startsWith(WIKI_LINK_ROUTES.ARTICLE_PREFIX)) return WikiLinkTargetType.INTERNAL_ENTITY;
    if (href.startsWith(WIKI_LINK_ROUTES.TIMELINE_PREFIX)) return WikiLinkTargetType.INTERNAL_EVENT;
    return WikiLinkTargetType.EXTERNAL_URL;
  }
}

export enum AnnotationModalTab {
  LINK = 'LINK',
  FOOTNOTE = 'FOOTNOTE',
}

interface TextAnnotationModalProps {
  editor: Editor | null;
  isOpen: boolean;
  initialTab: AnnotationModalTab;
  onClose: () => void;
}

const TAB_BTN_BASE =
  'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer';
const TAB_BTN_ACTIVE = 'bg-white text-slate-900 shadow-2xs';
const TAB_BTN_INACTIVE = 'text-slate-600 hover:text-slate-900';
const SEARCH_DEBOUNCE_MS = 250;

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function resolveInitialSearchQuery(editor: Editor, activeHref: string): string {
  if (activeHref) return '';
  const { from, to } = editor.state.selection;
  const selected = editor.state.doc.textBetween(from, to, ' ').trim();
  return selected.length <= 60 ? selected : '';
}

function LinkTabSection({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const activeHref = (editor.getAttributes('link').href as string) || '';
  const activeTooltip = (editor.getAttributes('link').tooltip as string) || '';
  const isLinkActive = Boolean(editor.isActive('link') && activeHref);

  const initialTargetType = activeHref
    ? WikiLinkTargetStrategyFactory.detectTargetTypeFromHref(activeHref)
    : WikiLinkTargetType.INTERNAL_ENTITY;

  const [targetType, setTargetType] = useState<WikiLinkTargetType>(initialTargetType);
  const [searchQuery, setSearchQuery] = useState(() =>
    resolveInitialSearchQuery(editor, activeHref),
  );
  const [externalUrl, setExternalUrl] = useState(() =>
    initialTargetType === WikiLinkTargetType.EXTERNAL_URL ? activeHref : '',
  );
  const [tooltipText, setTooltipText] = useState(activeTooltip);
  const [alsoInsertFootnote, setAlsoInsertFootnote] = useState(false);
  const [footnoteText, setFootnoteText] = useState('');
  const [candidates, setCandidates] = useState<IWikiLinkCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const strategies = WikiLinkTargetStrategyFactory.getAllStrategies();
  const currentStrategy = WikiLinkTargetStrategyFactory.getStrategy(targetType);

  const fetchCandidates = useCallback(async (q: string, type: WikiLinkTargetType) => {
    if (type === WikiLinkTargetType.EXTERNAL_URL) {
      setCandidates([]);
      return;
    }
    try {
      setLoading(true);
      const strategy = WikiLinkTargetStrategyFactory.getStrategy(type);
      const list = await strategy.searchCandidates(q);
      setCandidates(list);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (targetType === WikiLinkTargetType.EXTERNAL_URL) return;
    const timer = setTimeout(() => {
      void fetchCandidates(searchQuery, targetType);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, targetType, fetchCandidates]);

  const applyLink = (href: string, fallbackLabel?: string) => {
    const cleanHref = href.trim();
    if (!cleanHref) return;

    const { from, to } = editor.state.selection;
    const hasSelection = to > from;
    const cleanTooltip = tooltipText.trim() || null;

    if (hasSelection || editor.isActive('link')) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: cleanHref })
        .updateAttributes('link', { tooltip: cleanTooltip })
        .run();
    } else {
      const label = fallbackLabel || cleanHref;
      const tipAttr = cleanTooltip ? ` data-tooltip="${escapeHtmlAttr(cleanTooltip)}"` : '';
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${escapeHtmlAttr(cleanHref)}"${tipAttr}>${label}</a> `)
        .run();
    }

    if (alsoInsertFootnote && footnoteText.trim()) {
      const endPos = editor.state.selection.to;
      editor.chain().focus().setTextSelection(endPos).insertFootnote(footnoteText.trim()).run();
    }
    onClose();
  };

  const handleUnlink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  return (
    <>
      {isLinkActive && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs">
          <span className="text-slate-700 truncate">
            Đang gắn: <strong className="font-mono text-blue-800">{activeHref}</strong>
          </span>
          <button
            type="button"
            onClick={handleUnlink}
            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold shrink-0 cursor-pointer"
          >
            <Unlink className="w-3.5 h-3.5" />
            <span>Gỡ</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        {strategies.map((strat) => (
          <button
            key={strat.type}
            type="button"
            onClick={() => setTargetType(strat.type)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              targetType === strat.type
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {strat.label}
          </button>
        ))}
      </div>

      {targetType !== WikiLinkTargetType.EXTERNAL_URL ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentStrategy.placeholder}
              className="w-full text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {loading ? (
              <div className="py-5 text-center text-xs text-slate-500">
                Đang tìm trong kho tri thức...
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-5 text-center text-xs text-slate-500">
                Không tìm thấy mục phù hợp.
              </div>
            ) : (
              candidates.map((cand) => (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => applyLink(cand.href, cand.title)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 transition flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {cand.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{cand.subtitle}</div>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 shrink-0">
                    {activeHref === cand.href ? 'Đang gắn' : 'Chọn'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            autoFocus
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === KeyboardKey.ENTER) {
                e.preventDefault();
                const resolved = currentStrategy.resolveHref(externalUrl);
                if (resolved) applyLink(resolved);
              }
            }}
            placeholder={currentStrategy.placeholder}
            className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => {
              const resolved = currentStrategy.resolveHref(externalUrl);
              if (resolved) applyLink(resolved);
            }}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Áp dụng liên kết ngoài</span>
          </button>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 space-y-2">
        <input
          type="text"
          value={tooltipText}
          onChange={(e) => setTooltipText(e.target.value)}
          placeholder="Mô tả nhanh khi rê chuột (để trống nếu tự lấy từ bài viết)..."
          className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white text-slate-800 placeholder:text-slate-400"
        />
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={alsoInsertFootnote}
            onChange={(e) => setAlsoInsertFootnote(e.target.checked)}
            className="rounded border-slate-300 text-slate-900 focus:ring-0"
          />
          <span>Kèm chú thích đánh số ngay sau liên kết</span>
        </label>
        {alsoInsertFootnote && (
          <textarea
            rows={2}
            value={footnoteText}
            onChange={(e) => setFootnoteText(e.target.value)}
            placeholder="Nhập nội dung chú thích kèm theo..."
            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-800"
          />
        )}
      </div>
    </>
  );
}

function FootnoteTabSection({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const activeFootnoteNote =
    (editor.getAttributes(FOOTNOTE_NODE_NAME).note as string) || '';
  const isFootnoteActive = Boolean(editor.isActive(FOOTNOTE_NODE_NAME));
  const [footnoteText, setFootnoteText] = useState(activeFootnoteNote);

  const handleSaveFootnote = () => {
    const trimmed = footnoteText.trim();
    if (!trimmed) return;
    if (isFootnoteActive) {
      editor.chain().focus().updateAttributes(FOOTNOTE_NODE_NAME, { note: trimmed }).run();
      onClose();
      return;
    }
    const { from, to } = editor.state.selection;
    if (to > from) {
      editor.chain().focus().setTextSelection(to).insertFootnote(trimmed).run();
    } else {
      editor.chain().focus().insertFootnote(trimmed).run();
    }
    onClose();
  };

  const handleRemoveFootnote = () => {
    if (!isFootnoteActive) return;
    editor.chain().focus().deleteSelection().run();
    onClose();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Nội dung chú thích (số thứ tự 1, 2, 3... tự cộng dần khi hiển thị)
        </label>
        <textarea
          rows={4}
          autoFocus
          value={footnoteText}
          onChange={(e) => setFootnoteText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === KeyboardKey.ENTER) {
              e.preventDefault();
              handleSaveFootnote();
            }
          }}
          placeholder="Ví dụ: Nhà Thương (商朝) hay nhà Ân, triều đại đầu tiên có sử liệu ghi chép..."
          className="w-full text-sm px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 leading-relaxed"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Mẹo: Nhấn Ctrl + Enter để lưu nhanh.
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        {isFootnoteActive ? (
          <button
            type="button"
            onClick={handleRemoveFootnote}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa chú thích</span>
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!footnoteText.trim()}
            onClick={handleSaveFootnote}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isFootnoteActive ? 'Cập nhật' : 'Chèn chú thích'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TextAnnotationModalDialog({
  editor,
  initialTab,
  onClose,
}: {
  editor: Editor;
  initialTab: AnnotationModalTab;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<AnnotationModalTab>(initialTab);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Liên kết & Chú thích văn bản"
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl flex-1">
            <button
              type="button"
              onClick={() => setActiveTab(AnnotationModalTab.LINK)}
              className={`${TAB_BTN_BASE} ${
                activeTab === AnnotationModalTab.LINK ? TAB_BTN_ACTIVE : TAB_BTN_INACTIVE
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Liên kết</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(AnnotationModalTab.FOOTNOTE)}
              className={`${TAB_BTN_BASE} ${
                activeTab === AnnotationModalTab.FOOTNOTE ? TAB_BTN_ACTIVE : TAB_BTN_INACTIVE
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Chú thích</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {activeTab === AnnotationModalTab.LINK ? (
            <LinkTabSection editor={editor} onClose={onClose} />
          ) : (
            <FootnoteTabSection editor={editor} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

export function TextAnnotationModal({
  editor,
  isOpen,
  initialTab,
  onClose,
}: TextAnnotationModalProps) {
  if (!isOpen || !editor) return null;
  return (
    <TextAnnotationModalDialog
      key={initialTab}
      editor={editor}
      initialTab={initialTab}
      onClose={onClose}
    />
  );
}
