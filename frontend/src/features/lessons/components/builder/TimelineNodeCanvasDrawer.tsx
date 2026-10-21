'use client';

import React, { useState, useEffect } from 'react';
import { TimelineNode } from '../blocks/HistoricalTimelineBlock';
import { TipTapContent } from '../TipTapContent';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

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

  useEffect(() => {
    if (node) {
      setLocalNode(node);
      setTitle(node.title || '');
      setYear(node.year || '');
      setDetailHtml(node.detailContent || '');
    }
  }, [node]);

  if (!isOpen || !localNode) return null;

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

  return (
    <div
      data-testid="timeline-node-canvas-drawer"
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop mờ — che toàn màn hình (không hở nội dung phía sau để tạo ngữ cảnh),
          nên bản chất đây đã vận hành như 1 modal; trước đây dock sát lề phải tạo ra
          khoảng tối trống vô nghĩa bên trái. Đổi thành modal căn giữa cho đúng với bản
          chất: viết nội dung dài (TipTap, ảnh/video) cần không gian tập trung, không phải
          1 panel phụ xem lướt. */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* DOCUMENT CANVAS CONTAINER (Phóng to dạng Google Docs Sheet, căn giữa) */}
      <div className="relative w-full max-w-5xl bg-slate-100 rounded-2xl shadow-2xl flex flex-col max-h-full z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-300 overflow-hidden">
        {/* 1. Header chuẩn Google Docs */}
        <header className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icon tài liệu Google Docs */}
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Icon name={IconName.BOOK} size={16} />
            </div>

            {/* Tiêu đề tài liệu mốc lịch sử */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={year}
                  disabled={isReadOnly}
                  onChange={(e) => setYear(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Năm..."
                  className="w-16 text-xs font-bold text-blue-700 bg-blue-50/70 border border-blue-200/70 rounded px-1.5 py-0.5 focus:bg-white focus:outline-none"
                />
                <span className="text-slate-300">—</span>
                <input
                  type="text"
                  value={title}
                  disabled={isReadOnly}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Tiêu đề tài liệu chi tiết..."
                  className="flex-1 text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 truncate"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Trang tư liệu chi tiết mốc lịch sử (Google Docs Canvas)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              Hoàn tất & Đóng
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </header>

        {/* 2. VÙNG LÀM VIỆC TÀI LIỆU DẠNG TRANG GIẤY GOOGLE DOCS (A4 DOCUMENT CANVAS) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-editor-scrollbar">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200/90 p-6 md:p-10 min-h-[750px] flex flex-col">
            {/* Header trang tài liệu */}
            <div className="border-b border-slate-100 pb-4 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                TƯ LIỆU CHUYÊN SÂU • NĂM {year || '...'}
              </span>
              <h1 className="text-2xl font-bold font-serif text-slate-900 mt-2 leading-snug">
                {title || 'Chưa có tiêu đề mốc'}
              </h1>
              {localNode.description && (
                <p className="text-xs text-slate-500 italic mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <strong>Tóm tắt sơ lược: </strong>
                  {localNode.description}
                </p>
              )}
            </div>

            {/* Trình soạn thảo TipTap Rich-Text Canvas (Google Docs style) */}
            <div className="flex-1 flex flex-col" data-testid="tiptap-timeline-node-canvas">
              {isReadOnly ? (
                <div
                  className="tiptap-content-box flex-1 leading-relaxed text-slate-800"
                  dangerouslySetInnerHTML={{
                    __html:
                      detailHtml ||
                      '<p class="text-slate-400 italic">Chưa có nội dung chuyên sâu cho mốc này.</p>',
                  }}
                />
              ) : (
                <TipTapContent
                  value={detailHtml}
                  onChange={handleContentChange}
                  placeholder="Bắt đầu soạn thảo bài tư liệu chi tiết tại đây (hỗ trợ tiêu đề H1/H2, danh sách, trích dẫn, chèn ảnh, nhúng video YouTube)..."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
