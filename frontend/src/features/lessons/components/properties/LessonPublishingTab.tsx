'use client';

import React from 'react';
import { Badge } from '@/components/common/Badge';
import { ContentStatus } from '@/constants/enums';
import { ResourceLinkBlockData } from '../../types/block-builder.types';

interface LessonPublishingTabProps {
  status: ContentStatus | any;
  wordCount: number;
  estimatedReadMinutes: number;
  sourceReferenceNote: string;
  setSourceReferenceNote: (v: string) => void;
  resourceLinks: ResourceLinkBlockData[];
  onAddResourceLink: () => void;
  onUpdateResourceLink: (id: string, updates: Partial<ResourceLinkBlockData>) => void;
  onRemoveResourceLink: (id: string) => void;
  saving: boolean;
  lessonId: string | null;
  onSaveLesson: (nextStatus: ContentStatus | any) => void;
}

/** Tab "Xuất bản" trong Panel Thuộc tính: trạng thái bài học, số liệu, nguồn tư liệu
 * tham khảo, danh sách Liên kết tài nguyên (luôn xuất ở cuối bài), và 2 nút lưu chính. */
export function LessonPublishingTab({
  status,
  wordCount,
  estimatedReadMinutes,
  sourceReferenceNote,
  setSourceReferenceNote,
  resourceLinks,
  onAddResourceLink,
  onUpdateResourceLink,
  onRemoveResourceLink,
  saving,
  lessonId,
  onSaveLesson,
}: LessonPublishingTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3.5 animate-in fade-in-50 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Trạng thái bài học</span>
        <Badge tone="gray">{status}</Badge>
      </div>

      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1.5 text-slate-600">
        <div className="flex justify-between">
          <span>Độ dài:</span>
          <span className="font-bold text-slate-800">{wordCount} từ</span>
        </div>
        <div className="flex justify-between">
          <span>Thời lượng đọc:</span>
          <span className="font-bold text-slate-800">~{estimatedReadMinutes} phút</span>
        </div>
        <div className="flex justify-between">
          <span>Tự động lưu:</span>
          <span className="font-medium text-emerald-600">Đang bật</span>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-2.5">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Nguồn tư liệu tham khảo</span>
        <textarea
          rows={3}
          value={sourceReferenceNote}
          onChange={(e) => setSourceReferenceNote(e.target.value)}
          placeholder="Ví dụ: Đại Việt Sử Ký Toàn Thư, Lịch sử Việt Nam tập 10..."
          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
        />
      </div>

      {/* Liên kết tài nguyên tham khảo (luôn hiển thị cố định ở cuối bài học, không chèn giữa nội dung) */}
      <div className="border-t border-slate-100 pt-2.5" data-testid="sidebar-resource-links">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Liên kết tài nguyên ({resourceLinks.length})
          </span>
          <button
            type="button"
            data-testid="btn-add-resource-link"
            onClick={onAddResourceLink}
            disabled={saving}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            + Thêm
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mb-2">Danh sách liên kết/tài liệu đính kèm, luôn xuất ra ở cuối bài học.</p>

        {resourceLinks.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
            Chưa có liên kết tài nguyên nào.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {resourceLinks.map((link, idx) => (
              <div key={link.id} data-testid={`resource-link-item-${idx}`} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => onUpdateResourceLink(link.id, { title: e.target.value })}
                    placeholder="Tên tài liệu/nguồn tham khảo..."
                    className="flex-1 min-w-0 text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveResourceLink(link.id)}
                    disabled={saving}
                    title="Xóa liên kết"
                    className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-1"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => onUpdateResourceLink(link.id, { url: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 bg-white"
                />
                <input
                  type="text"
                  value={link.note || ''}
                  onChange={(e) => onUpdateResourceLink(link.id, { note: e.target.value })}
                  placeholder="Chú thích (tùy chọn)..."
                  className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 bg-white text-slate-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onSaveLesson(ContentStatus.PENDING_REVIEW)}
          disabled={saving}
          className="primary-button !h-8 !text-xs !w-full justify-center cursor-pointer font-bold"
        >
          {lessonId ? 'Lưu cập nhật' : 'Gửi duyệt bài học'}
        </button>
        <button
          type="button"
          onClick={() => onSaveLesson(ContentStatus.DRAFT)}
          disabled={saving}
          className="secondary-button !h-8 !text-xs !w-full justify-center cursor-pointer"
        >
          {saving ? 'Đang lưu...' : 'Lưu bản nháp'}
        </button>
      </div>
    </div>
  );
}
