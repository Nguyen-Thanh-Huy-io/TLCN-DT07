'use client';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/common/CommonUi';
import { IconName } from '@/constants/enums';
import { DifficultyLevel, MediaType } from '@/constants/enums';
import { DIFFICULTY_LABEL_MAP } from '@/constants/ui-theme';
import { TagItem } from '@/types/models';
import { LessonMediaItem } from '../types/editor.types';
import { TocItem } from '../types/editor.types';
import { sanitizeRichHtml } from '@/utils/common';

export type { TocItem };

interface LessonPreviewContentProps {
  /** Dùng khi nhúng vào pane hẹp của Chế độ Chia đôi — ẩn cột Mục lục riêng (vì cột soạn
   * thảo bên cạnh đã đủ điều hướng) để nội dung không bị bóp vỡ layout. */
  compact?: boolean;
  tocItems: TocItem[];
  isTocCollapsed: boolean;
  onToggleTocCollapsed: () => void;
  thumbnailUrl: string;
  title: string;
  topicName?: string;
  difficulty: DifficultyLevel;
  wordCount: number;
  estimatedReadMinutes: number;
  selectedTags: TagItem[];
  enrichedPreviewHtml: string;
  visualMediaItems: LessonMediaItem[];
  documentMediaItems: LessonMediaItem[];
  sourceReferenceNote: string;
}

/** Bản xem trước trực quan của bài học theo giao diện Wiki & Khóa học (Mục lục đặt bên
 * trái) — dùng ở cả tab "Xem trước" toàn màn hình và pane bên phải của "Chế độ Chia đôi". */
export function LessonPreviewContent({
  compact = false,
  tocItems,
  isTocCollapsed,
  onToggleTocCollapsed,
  thumbnailUrl,
  title,
  topicName,
  difficulty,
  wordCount,
  estimatedReadMinutes,
  selectedTags,
  enrichedPreviewHtml,
  visualMediaItems,
  documentMediaItems,
  sourceReferenceNote,
}: LessonPreviewContentProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs h-full overflow-y-auto">
      <div className={`flex flex-col gap-6 items-start ${compact ? '' : 'lg:flex-row'}`}>
        {/* CỘT BÊN TRÁI: MỤC LỤC BÀI HỌC WIKI (STICKY SIDEBAR TOC - ĐẶT BÊN TRÁI)
            — ẩn khi compact (nhúng trong pane hẹp của Chế độ Chia đôi) */}
        {!compact && tocItems.length > 0 && (
          <aside className="w-full lg:w-60 xl:w-64 shrink-0 lg:sticky lg:top-0 self-start">
            <div className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2 gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon name={IconName.BOOK} size={13} className="text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 tracking-wide truncate">Mục lục</span>
                </div>
                <button
                  type="button"
                  onClick={onToggleTocCollapsed}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-1.5 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer transition shrink-0"
                >
                  [{isTocCollapsed ? 'hiện' : 'ẩn'}]
                </button>
              </div>
              {!isTocCollapsed && (
                <nav className="space-y-1.5 text-xs max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {tocItems.map((item, idx) => {
                    const displayText = item.text.replace(/^(\d+(\.\d+)*\s*[-–.]?\s*)/, '');
                    return (
                      <div
                        key={item.id}
                        style={{ paddingLeft: `${(item.level - 1) * 10}px` }}
                        className="flex items-baseline gap-1.5 py-0.5 group rounded px-1 hover:bg-white transition"
                      >
                        <span className="text-slate-400 group-hover:text-blue-600 font-mono text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <a
                          href={`#${item.id}`}
                          className="text-slate-700 group-hover:text-blue-700 hover:underline leading-snug break-words transition"
                          onClick={(e) => {
                            e.preventDefault();
                            const targetEl = document.getElementById(item.id);
                            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {displayText}
                        </a>
                      </div>
                    );
                  })}
                </nav>
              )}
            </div>
          </aside>
        )}

        {/* CỘT CHÍNH (BÊN PHẢI MỤC LỤC): NỘI DUNG BÀI HỌC VÀ TƯ LIỆU */}
        <div className="flex-1 min-w-0 flex flex-col">
          {thumbnailUrl && (
            <div className="mb-5 rounded-xl overflow-hidden border border-slate-200 shadow-xs relative max-h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt={title || 'Ảnh bìa bài học'}
                className="w-full h-full object-cover max-h-72"
              />
            </div>
          )}

          <div className="border-b border-slate-200 pb-4 mb-5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge tone="blue">Wiki Bài học</Badge>
              <span className="text-xs text-slate-500 font-medium">Chủ đề: {topicName || 'Chưa gắn'}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">Độ khó: {DIFFICULTY_LABEL_MAP[difficulty]}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-medium">{wordCount} từ</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-medium">~{estimatedReadMinutes} phút đọc</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {title || 'Chưa có tiêu đề bài học'}
            </h1>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-[11px] px-2 py-0.5 rounded-md font-medium border"
                    style={{
                      backgroundColor: tag.colorHex ? `${tag.colorHex}15` : '#EFF6FF',
                      color: tag.colorHex || '#1D4ED8',
                      borderColor: tag.colorHex ? `${tag.colorHex}40` : '#BFDBFE',
                    }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            className="tiptap-content-box !p-0 flex-1 leading-relaxed text-slate-800"
            dangerouslySetInnerHTML={{
              __html: sanitizeRichHtml(
                enrichedPreviewHtml ||
                  '<p class="text-slate-400 italic">Chưa có nội dung văn bản. Hãy soạn thảo ở cột bên cạnh.</p>',
              ),
            }}
          />

          {visualMediaItems.length > 0 && (
            <div className="mt-8 pt-5 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Icon name={IconName.GRID} size={14} />
                <span>Tư liệu lịch sử đính kèm ({visualMediaItems.length})</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visualMediaItems.map((m, idx) => (
                  <div
                    key={idx}
                    className="group relative border border-slate-200 rounded-md p-2 bg-slate-50 hover:bg-white transition-all"
                  >
                    <div className="text-[10px] font-semibold text-slate-600 uppercase mb-1">
                      {m.type === MediaType.VIDEO ? 'Video tài liệu' : 'Hiện vật / Ảnh'}
                    </div>
                    {m.type === MediaType.IMAGE ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt={m.caption || ''}
                        className="w-full h-24 object-cover rounded border border-slate-200"
                      />
                    ) : (
                      <div className="h-24 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-600 font-medium">
                        Video Player
                      </div>
                    )}
                    <p className="mt-1.5 text-xs text-slate-700 line-clamp-2 leading-tight">
                      {m.caption || 'Chưa có chú thích'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documentMediaItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span>📄 Tài liệu tham khảo đính kèm ({documentMediaItems.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documentMediaItems.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition group"
                  >
                    <span className="text-xl">📄</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                        {doc.caption || 'Tài liệu nghiên cứu'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{doc.url}</div>
                    </div>
                    <span className="text-xs text-blue-600 font-medium shrink-0">Mở xem ↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-500 italic bg-slate-50 p-3 rounded-md border border-slate-200">
            <strong className="text-slate-800 not-italic">Nguồn tư liệu tham khảo: </strong>
            <span>{sourceReferenceNote || 'Chưa cập nhật nguồn sử liệu'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
