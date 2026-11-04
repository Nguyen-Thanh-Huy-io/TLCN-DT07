'use client';

import React from 'react';
import { EntityType, ContentStatus } from '@/constants/enums';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { EntityStrategyRegistry } from '../../strategies/entity-type.strategy';

export interface EntityPublishStepProps {
  name: string;
  type: EntityType;
  tagline: string;
  imageUrl: string;
  periodName?: string;
  birthYear?: number | '';
  deathYear?: number | '';
  isFeatured: boolean;
  onIsFeaturedChange: (v: boolean) => void;
  displayOrder: number;
  onDisplayOrderChange: (v: number) => void;
  timelineNodesCount: number;
  relationsCount: number;
  status: ContentStatus;
  onNavigateToStep?: (stepIndex: number) => void;
}

/**
 * Bước 4 — Kiểm tra & Xuất bản:
 * Bảng tổng kết trạng thái hoàn thiện của thực thể, cài đặt hiển thị ưu tiên.
 * Loại bỏ các nút lưu/xuất bản thừa ở giữa trang, giữ thanh điều hướng dưới cùng làm điểm kích hoạt duy nhất.
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
  onIsFeaturedChange,
  displayOrder,
  onDisplayOrderChange,
  timelineNodesCount,
  relationsCount,
  status,
  onNavigateToStep,
}: EntityPublishStepProps) {
  const strategy = EntityStrategyRegistry.get(type);
  const isNameFilled = Boolean(name.trim());
  const isImageFilled = Boolean(imageUrl.trim());
  const isPeriodFilled = Boolean(periodName);

  const checklist = [
    { label: strategy.fields.nameLabel, ok: isNameFilled, required: true, step: 1 },
    { label: 'Phân loại thực thể', ok: true, required: true, step: 1 },
    { label: strategy.fields.avatarTitle, ok: isImageFilled, required: false, step: 1 },
    { label: 'Thời kỳ / Giai đoạn lịch sử', ok: isPeriodFilled, required: false, step: 1 },
    { label: 'Nội dung & Diễn biến chi tiết', ok: timelineNodesCount > 0, required: false, step: 2 },
    { label: strategy.relationsConfig.sectionTitle, ok: relationsCount > 0, required: false, step: 3 },
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
                {strategy.label}
              </span>
              {isFeatured && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span>★ Nổi bật</span>
                  {displayOrder > 0 && <span className="opacity-75">#{displayOrder}</span>}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-mono">
                Trạng thái: {status === ContentStatus.PUBLISHED ? 'Đã xuất bản' : 'Bản nháp'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-2 truncate">
              {name || <span className="text-slate-400 italic font-normal">Chưa đặt tên {strategy.targetName}</span>}
            </h3>

            {tagline ? (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{tagline}</p>
            ) : (
              <p className="text-xs text-slate-400 italic mt-1">Chưa có mô tả nhận diện ngắn</p>
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
                <span className="text-slate-400">Khối nội dung:</span>{' '}
                <strong className="text-slate-700">{timelineNodesCount} mục</strong>
              </div>
              <div>
                <span className="text-slate-400">Mạng lưới liên kết:</span>{' '}
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
          Tiêu chuẩn hoàn thiện dữ liệu
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {checklist.map((item, i) => (
            <div
              key={i}
              role={onNavigateToStep ? 'button' : undefined}
              tabIndex={onNavigateToStep ? 0 : undefined}
              onClick={() => onNavigateToStep?.(item.step)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                onNavigateToStep ? 'cursor-pointer hover:shadow-2xs' : ''
              } ${
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

      {/* 3. Cài đặt hiển thị & Độ ưu tiên (Được chuyển từ Mục 1 sang Mục 4) */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Cài đặt hiển thị & Độ ưu tiên
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cấu hình vị trí ưu tiên và gắn cờ nổi bật trên trang chủ và danh mục HISGO.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => onIsFeaturedChange(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            <span>★ Đánh dấu nổi bật (Hiển thị tại Landing Page)</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Thứ tự ưu tiên:</span>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => onDisplayOrderChange(Number(e.target.value) || 0)}
              className="w-20 text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center focus:outline-none focus:border-amber-500"
            />
            <span className="text-[11px] text-slate-400">(Số nhỏ hơn hiển thị trước)</span>
          </div>
        </div>
      </div>

      {/* 4. Thông báo điều hướng thân thiện (Loại bỏ 2 nút Lưu/Xuất bản lặp lại ở giữa trang) */}
      <div className="bg-amber-950 text-amber-50 rounded-2xl p-5 text-xs space-y-2 border border-amber-900/50 shadow-sm">
        <div className="font-bold text-white flex items-center gap-2">
          <span>✨</span>
          <span>Sẵn sàng lưu trữ và công bố</span>
        </div>
        <p className="text-amber-200/90 leading-relaxed">
          Sau khi kiểm tra đầy đủ các mục, bạn có thể bấm <strong>Lưu bản nháp</strong> để tiếp tục cập nhật sau hoặc bấm <strong>✓ Hoàn tất & Xuất bản</strong> ở thanh điều hướng chân trang để đưa {strategy.targetName} lên Timeline và Bản đồ số.
        </p>
      </div>
    </div>
  );
}
