'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Link2,
  Unlink,
  ExternalLink,
  Search,
  Check,
  X,
} from 'lucide-react';
import {
  WikiLinkTargetType,
  WikiLinkTargetStrategyFactory,
  IWikiLinkCandidate,
} from '../../strategies/wiki-link-target.strategy';
import { KeyboardKey } from '@/constants/enums';

interface WikiLinkInspectorSectionProps {
  editor: Editor | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WikiLinkInspectorSection({
  editor,
  isOpen,
  onOpenChange,
}: WikiLinkInspectorSectionProps) {
  const activeHref = (editor?.getAttributes('link').href as string) || '';
  const isLinkActive = Boolean(editor?.isActive('link') && activeHref);

  const [targetType, setTargetType] = useState<WikiLinkTargetType>(
    WikiLinkTargetType.INTERNAL_ENTITY
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [candidates, setCandidates] = useState<IWikiLinkCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const strategies = WikiLinkTargetStrategyFactory.getAllStrategies();
  const currentStrategy = WikiLinkTargetStrategyFactory.getStrategy(targetType);

  // Khi con trỏ đặt vào chữ đã có link hoặc mở bảng liên kết, đồng bộ dữ liệu
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (!editor) return;
      if (activeHref) {
        const detected = WikiLinkTargetStrategyFactory.detectTargetTypeFromHref(activeHref);
        setTargetType(detected);
        if (detected === WikiLinkTargetType.EXTERNAL_URL) {
          setExternalUrl(activeHref);
        }
      } else if (isOpen) {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();
        if (selectedText && selectedText.length <= 60) {
          setSearchQuery(selectedText);
        }
      }
    });
  }, [editor, activeHref, isOpen]);

  // Hỗ trợ phím tắt Ctrl + K / Cmd + K để mở nhanh khung gắn liên kết
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (editor?.isFocused) {
          e.preventDefault();
          onOpenChange(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, onOpenChange]);

  // Tìm kiếm Thực thể / Sự kiện nội bộ theo chiến lược đang chọn
  const fetchCandidates = useCallback(
    async (q: string, type: WikiLinkTargetType) => {
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
    },
    []
  );

  useEffect(() => {
    if (!isOpen && !isLinkActive) return;
    if (targetType === WikiLinkTargetType.EXTERNAL_URL) return;

    const timer = setTimeout(() => {
      fetchCandidates(searchQuery, targetType);
    }, 280);

    return () => clearTimeout(timer);
  }, [isOpen, isLinkActive, searchQuery, targetType, fetchCandidates]);

  const applyHrefToEditor = (href: string, fallbackLabel?: string) => {
    if (!editor || !href.trim()) return;
    const { from, to } = editor.state.selection;
    const hasSelection = to > from;

    if (hasSelection || editor.isActive('link')) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: href.trim() })
        .run();
    } else if (fallbackLabel) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${href.trim()}">${fallbackLabel}</a> `)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${href.trim()}">${href.trim()}</a> `)
        .run();
    }
    onOpenChange(false);
  };

  const handleUnlink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setExternalUrl('');
    onOpenChange(false);
  };

  const handleApplyExternalUrl = () => {
    const resolved = currentStrategy.resolveHref(externalUrl);
    if (!resolved) {
      handleUnlink();
      return;
    }
    applyHrefToEditor(resolved);
  };

  if (!isOpen && !isLinkActive) {
    return null;
  }

  return (
    <div
      data-testid="wiki-link-inspector-section"
      className="pt-3 border-t border-stone-200 space-y-3"
    >
      {/* Tiêu đề mục Liên kết */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          <span>Gắn liên kết văn bản</span>
        </span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-stone-600 hover:text-stone-950 p-1 rounded cursor-pointer"
          title="Đóng khung liên kết"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Nếu văn bản đang chọn đã có liên kết: Hiện trạng thái + Nút mở thử & Gỡ liên kết */}
      {isLinkActive && (
        <div className="space-y-2 pb-2 border-b border-stone-200">
          <div className="text-xs text-stone-600 truncate">
            Đích hiện tại: <strong className="text-stone-900 font-mono">{activeHref}</strong>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={activeHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-1.5 px-2.5 text-sm font-medium text-stone-800 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở thử</span>
            </a>
            <button
              type="button"
              data-testid="btn-unlink-text"
              onClick={handleUnlink}
              className="flex-1 py-1.5 px-2.5 text-sm font-semibold text-rose-700 bg-white border border-stone-300 hover:bg-rose-50 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Gỡ liên kết</span>
            </button>
          </div>
        </div>
      )}

      {/* Chọn loại đích liên kết: Thực thể | Sự kiện | Trang web */}
      <div className="grid grid-cols-3 gap-1.5">
        {strategies.map((strat) => {
          const active = targetType === strat.type;
          return (
            <button
              key={strat.type}
              type="button"
              data-testid={`btn-link-mode-${strat.type}`}
              onClick={() => setTargetType(strat.type)}
              className={`py-1.5 px-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
              }`}
            >
              {strat.label}
            </button>
          );
        })}
      </div>

      {/* Nhánh 1 & 2: Tra cứu Thực thể hoặc Sự kiện nội bộ */}
      {targetType !== WikiLinkTargetType.EXTERNAL_URL ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentStrategy.placeholder}
              data-testid="input-wiki-link-search"
              className="w-full text-sm pl-9 pr-8 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 text-stone-900 placeholder:text-stone-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-950 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-stone-200 border-t border-b border-stone-200">
            {loading ? (
              <div className="py-4 text-center text-sm text-stone-600">
                Đang tìm trong kho tri thức...
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-4 text-center text-sm text-stone-600">
                Không tìm thấy mục phù hợp.
              </div>
            ) : (
              candidates.map((cand) => {
                const isCurrent = activeHref === cand.href;
                return (
                  <button
                    key={cand.id}
                    type="button"
                    data-testid={`wiki-link-candidate-${cand.id}`}
                    onClick={() => applyHrefToEditor(cand.href, cand.title)}
                    className={`w-full py-2 px-2 text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isCurrent ? 'bg-stone-100' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-stone-900 truncate">
                        {cand.title}
                      </div>
                      <div className="text-xs text-stone-600 truncate">
                        {cand.subtitle}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-stone-800 shrink-0">
                      {isCurrent ? 'Đang gắn' : 'Gắn'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Nhánh 3: Nhập địa chỉ trang web ngoài */
        <div className="space-y-2">
          <input
            type="text"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === KeyboardKey.ENTER) {
                e.preventDefault();
                handleApplyExternalUrl();
              }
            }}
            placeholder={currentStrategy.placeholder}
            data-testid="input-external-link-url"
            className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 text-stone-900 placeholder:text-stone-600"
          />
          <button
            type="button"
            data-testid="btn-apply-external-link"
            onClick={handleApplyExternalUrl}
            className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Áp dụng liên kết</span>
          </button>
        </div>
      )}
    </div>
  );
}
