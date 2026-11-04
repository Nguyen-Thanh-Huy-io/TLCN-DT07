'use client';

import React from 'react';
import { EntityType, ContentStatus } from '@/constants/enums';
import { ENTITY_TYPE_LABELS } from '../entity-editor.constants';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface EntityPublishStepProps {
  name: string;
  type: EntityType;
  tagline: string;
  imageUrl: string;
  periodName?: string;
  birthYear?: number | '';
  deathYear?: number | '';
  isFeatured: boolean;
  displayOrder: number;
  timelineNodesCount: number;
  relationsCount: number;
  status: ContentStatus;
  savingAction: 'DRAFT' | 'PUBLISH' | null;
  onSaveDraft: () => void;
  onPublish: () => void;
}

/**
 * Bước 4 — Kiểm tra & Xuất bản:
 * Bảng tổng kết trạng thái hoàn thiện của thực thể, loại bỏ hoàn toàn ô nhập code JSON và tải file trùng lặp.
 */
export function EntityPublishStep({
  name,
  type,
  tagline,
  imageUrl,
  periodName,
  birthYear,
  deathYear,
  isFeatured,
  displayOrder,
  timelineNodesCount,
  relationsCount,
  status,
  savingAction,
  onSaveDraft,
  onPublish,
}: EntityPublishStepProps) {
  const isNameFilled = Boolean(name.trim());
  const isImageFilled = Boolean(imageUrl.trim());
  const isPeriodFilled = Boolean(periodName);

  const checklist = [
    { label: 'Tên thực thể lịch sử', ok: isNameFilled, required: true },
    { label: 'Phân loại thực thể', ok: true, required: true },
    { label: 'Ảnh đại diện / tư liệu chính', ok: isImageFilled, required: false },
    { label: 'Gắn thời kỳ lịch sử', ok: isPeriodFilled, required: false },
    { label: 'Dòng thời gian / Diễn biến', ok: timelineNodesCount > 0, required: false },
    { label: 'Mạng lưới liên kết tri thức', ok: relationsCount > 0, required: false },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* 1. Thẻ tóm tắt thông tin (Preview Card) */}
      <div className="bg-gradient-to-br from-amber-50/60 via-white to-slate-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name || 'Ảnh thực thể'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-amber-200 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
              <Icon name={IconName.IMAGE} size={24} />
              <span className="text-[10px] mt-1">Chưa có ảnh</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {ENTITY_TYPE_LABELS[type]}
              </span>
              {isFeatured && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span>★ Nổi bật</span>
                  {displayOrder > 0 && <span className="opacity-75">#{displayOrder}</span>}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-mono">
                Trạng thái hiện tại: {status === ContentStatus.PUBLISHED ? 'Đã xuất bản' : 'Bản nháp'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-2 truncate">
              {name || <span className="text-slate-400 italic font-normal">Chưa đặt tên thực thể</span>}
            </h3>

            {tagline ? (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{tagline}</p>
            ) : (
              <p className="text-xs text-slate-400 italic mt-1">Chưa có danh xưng hoặc mô tả nhận diện ngắn</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
              {periodName && (
                <div>
                  <span className="text-slate-400">Thời kỳ:</span>{' '}
                  <strong className="text-slate-700">{periodName}</strong>
                </div>
              )}
              {(birthYear || deathYear) && (
                <div>
                  <span className="text-slate-400">Niên đại:</span>{' '}
                  <strong className="text-slate-700">
                    {birthYear || '?'} – {deathYear || '?'}
                  </strong>
                </div>
              )}
              <div>
                <span className="text-slate-400">Mốc timeline:</span>{' '}
                <strong className="text-slate-700">{timelineNodesCount} mốc</strong>
              </div>
              <div>
                <span className="text-slate-400">Liên kết tri thức:</span>{' '}
                <strong className="text-slate-700">{relationsCount} mục</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bảng kiểm tra mức độ sẵn sàng (Readiness Checklist) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Tiêu chuẩn hoàn thiện nội dung
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {checklist.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                item.ok
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-medium'
                  : item.required
                  ? 'bg-rose-50/50 border-rose-200 text-rose-800 font-semibold'
                  : 'bg-slate-50/60 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    item.ok
                      ? 'bg-emerald-500 text-white'
                      : item.required
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-300 text-white'
                  }`}
                >
                  {item.ok ? '✓' : item.required ? '!' : '–'}
                </span>
                <span>{item.label}</span>
                {item.required && !item.ok && (
                  <span className="text-[10px] text-rose-600 font-bold">(Bắt buộc)</span>
                )}
              </div>
              <span className="text-[11px] opacity-80">{item.ok ? 'Đã có' : 'Chưa có'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Lựa chọn thao tác xuất bản */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Sẵn sàng lưu trữ hoặc công bố?</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Bạn có thể lưu dưới dạng bản nháp để tiếp tục chỉnh sửa sau hoặc xuất bản lên Hisgo ngay.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={Boolean(savingAction) || !isNameFilled}
            className="text-xs px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {savingAction === 'DRAFT' ? 'Đang lưu...' : 'Lưu làm Bản nháp'}
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={Boolean(savingAction) || !isNameFilled}
            className="text-xs px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-1.5"
          >
            {savingAction === 'PUBLISH' ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <Icon name={IconName.CHECK} size={15} />
            )}
            <span>Xuất bản ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
