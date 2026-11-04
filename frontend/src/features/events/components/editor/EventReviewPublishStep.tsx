'use client';

import React from 'react';
import { ContentStatus } from '@/constants/enums';

export interface CompletenessCheckItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  required?: boolean;
  targetStepIndex?: number;
}

export interface EventReviewPublishStepProps {
  checklist: CompletenessCheckItem[];
  onNavigateToStep: (stepIndex: number) => void;
  status: ContentStatus;
  onStatusChange: (status: ContentStatus) => void;
  createdAt?: string;
  updatedAt?: string;
  isSaving: boolean;
  onPublish: () => void;
}

export function EventReviewPublishStep({
  checklist,
  onNavigateToStep,
  status,
  onStatusChange,
  createdAt,
  updatedAt,
  isSaving,
  onPublish,
}: EventReviewPublishStepProps) {
  const completedCount = checklist.filter((i) => i.completed).length;
  const isAllRequiredDone = checklist
    .filter((i) => i.required)
    .every((i) => i.completed);

  return (
    <div className="space-y-6">
      {/* Khung tiến độ hoàn thiện & Checklist kiểm duyệt */}
      <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Danh mục kiểm tra chất lượng dữ liệu ({completedCount}/{checklist.length})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Bấm vào các mục chưa hoàn thành (!) để chuyển nhanh đến màn hình cần bổ sung thông tin.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isAllRequiredDone
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {isAllRequiredDone ? 'Đủ điều kiện xuất bản' : 'Cần bổ sung'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {checklist.map((item) => (
            <div
              key={item.id}
              role={item.targetStepIndex !== undefined ? 'button' : undefined}
              tabIndex={item.targetStepIndex !== undefined ? 0 : undefined}
              onClick={() => {
                if (item.targetStepIndex !== undefined) {
                  onNavigateToStep(item.targetStepIndex);
                }
              }}
              onKeyDown={(e) => {
                if (
                  (e.key === 'Enter' || e.key === ' ') &&
                  item.targetStepIndex !== undefined
                ) {
                  onNavigateToStep(item.targetStepIndex);
                }
              }}
              className={`py-3 flex items-start justify-between gap-3 group transition ${
                item.targetStepIndex !== undefined
                  ? 'cursor-pointer hover:bg-white/80 px-2 rounded-xl'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border transition-transform group-hover:scale-105 ${
                    item.completed
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {item.completed ? '✓' : '!'}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.required && (
                      <span className="text-[10px] text-rose-500 font-normal">
                        (Bắt buộc)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {item.description}
                  </div>
                </div>
              </div>

              {item.targetStepIndex !== undefined && !item.completed && (
                <span className="text-xs font-semibold text-amber-800 group-hover:text-amber-950 underline shrink-0">
                  Bổ sung ngay →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trạng thái công bố */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Trạng thái bài viết
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              value: ContentStatus.DRAFT,
              title: 'Bản nháp',
              desc: 'Chỉ lưu trong hệ thống quản trị, chưa hiển thị ra ngoài.',
            },
            {
              value: ContentStatus.PENDING_REVIEW,
              title: 'Chờ kiểm duyệt',
              desc: 'Gửi ban biên tập thẩm định niên đại và nguồn sử liệu.',
            },
            {
              value: ContentStatus.PUBLISHED,
              title: 'Đã xuất bản',
              desc: 'Công khai trên Timeline, Bản đồ và Từ điển HISGO.',
            },
          ].map((opt) => {
            const isSelected = status === opt.value;
            return (
              <label
                key={opt.value}
                className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition select-none ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    type="radio"
                    name="event_review_status"
                    checked={isSelected}
                    onChange={() => onStatusChange(opt.value)}
                    className="w-4 h-4 text-amber-700 focus:ring-amber-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    {opt.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pl-6">
                  {opt.desc}
                </p>
              </label>
            );
          })}
        </div>
      </div>

      {/* Thông báo thân thiện (THAY ĐỔI CÂU THÔNG BÁO KỸ THUẬT THEO GÓP Ý CỦA NGƯỜI DÙNG) */}
      <div className="bg-amber-950 text-amber-50 rounded-2xl p-5 text-xs space-y-2 border border-amber-900/50 shadow-sm">
        <div className="font-bold text-white flex items-center gap-2">
          <span>✨</span>
          <span>Lưu ý xuất bản</span>
        </div>
        <p className="text-amber-200/90 leading-relaxed">
          Sau khi xuất bản, sự kiện sẽ hiển thị ngay trên dòng thời gian (Timeline), bản đồ lịch sử và thư viện tri thức HISGO để độc giả và học sinh tra cứu.
        </p>
        {(createdAt || updatedAt) && (
          <div className="pt-2 text-[11px] text-amber-300/70 font-mono border-t border-amber-900/80 flex items-center gap-4 flex-wrap">
            {createdAt && (
              <span>Khởi tạo: {new Date(createdAt).toLocaleDateString('vi-VN')}</span>
            )}
            {updatedAt && (
              <span>Cập nhật gần nhất: {new Date(updatedAt).toLocaleString('vi-VN')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
