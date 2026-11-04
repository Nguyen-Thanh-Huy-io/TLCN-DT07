'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X, Check } from 'lucide-react';
import { TimelineNode } from '../blocks/HistoricalTimelineBlock';
import { TipTapContent } from '../TipTapContent';

interface TimelineNodeCanvasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: TimelineNode | null;
  onSaveNode?: (updated: TimelineNode) => void;
  isReadOnly?: boolean;
}

export function TimelineNodeCanvasDrawer({
  isOpen,
  onClose,
  node,
  onSaveNode,
  isReadOnly = false,
}: TimelineNodeCanvasDrawerProps) {
  const [localNode, setLocalNode] = useState<TimelineNode | null>(node);
  const [detailHtml, setDetailHtml] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (node) {
      setLocalNode(node);
      setTitle(node.title || '');
      setYear(node.year || '');
      setDetailHtml(node.detailContent || '');
    }
  }, [node]);

  if (!isOpen || !localNode || !mounted) return null;

  const handleContentChange = (newHtml: string) => {
    setDetailHtml(newHtml);
    if (onSaveNode && localNode) {
      onSaveNode({
        ...localNode,
        title,
        year,
        detailContent: newHtml,
      });
    }
  };

  const handleTitleBlur = () => {
    if (onSaveNode && localNode) {
      onSaveNode({
        ...localNode,
        title,
        year,
        detailContent: detailHtml,
      });
    }
  };

  const drawerContent = (
    <div
      data-testid="timeline-node-canvas-drawer"
      className="fixed inset-0 z-[150] overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-stone-950/60 font-sans"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-lg flex flex-col max-h-[90vh] z-10 overflow-hidden">
        {/* 1. Đầu trang soạn thảo tư liệu */}
        <header className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center text-white shrink-0">
              <BookOpen className="w-5 h-5" />
            </span>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={year}
                  disabled={isReadOnly}
                  onChange={(e) => setYear(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Năm..."
                  className="w-24 text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-stone-900"
                />
                <span className="text-stone-400">—</span>
                <input
                  type="text"
                  value={title}
                  disabled={isReadOnly}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Tiêu đề bài phân tích mốc sự kiện..."
                  className="flex-1 text-base font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-900 focus:bg-white focus:outline-none px-1.5 py-1 truncate"
                />
              </div>
              <span className="text-xs text-stone-600 mt-1">
                Trang soạn thảo tư liệu chuyên sâu cho mốc sự kiện
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Hoàn tất &amp; Đóng</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng"
              className="p-2 rounded-lg text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. Vùng soạn thảo */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
          <div className="max-w-3xl mx-auto min-h-[540px] flex flex-col">
            <div className="border-b border-stone-200 pb-4 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                TƯ LIỆU CHUYÊN SÂU • NĂM {year || '...'}
              </span>
              <h2 className="text-[28px] font-bold font-serif text-stone-900 mt-2 leading-snug">
                {title || 'Chưa có tiêu đề mốc'}
              </h2>
              {localNode.description && (
                <p className="text-base text-stone-600 italic mt-2 leading-relaxed max-w-[65ch]">
                  <strong>Tóm tắt sơ lược: </strong>
                  {localNode.description}
                </p>
              )}
            </div>

            <div className="flex-1 flex flex-col" data-testid="tiptap-timeline-node-canvas">
              {isReadOnly ? (
                <div
                  className="tiptap-content-box flex-1 leading-relaxed text-stone-800"
                  dangerouslySetInnerHTML={{
                    __html:
                      detailHtml ||
                      '<p class="text-stone-600 italic">Chưa có nội dung chuyên sâu cho mốc này.</p>',
                  }}
                />
              ) : (
                <TipTapContent
                  value={detailHtml}
                  onChange={handleContentChange}
                  placeholder="Bắt đầu soạn thảo bài tư liệu chi tiết tại đây..."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
