'use client';

import React from 'react';
import { HistoricalDateRangeField } from '@/components/common/HistoricalDateRangeField';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';
import { EventCategoryPanel } from '../EventCategoryPanel';
import { HistoricalCombobox } from './HistoricalCombobox';
import type { LocationOption } from './editor.types';
import type { TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import { ContentStatus } from '@/constants/enums';
import type { TimelineMode, FlexibleDateParseResult } from '@/utils/history-year.utils';

export interface EventOverviewStepProps {
  isEditMode: boolean;
  status: ContentStatus;
  lastDraftSavedAt: string | null;

  // Tên & Slug
  title: string;
  onTitleChange: (val: string) => void;
  titleTouched: boolean;
  onTitleBlur: () => void;
  activeSlug: string;
  customSlug: string;
  onCustomSlugChange: (val: string) => void;
  isCustomSlugMode: boolean;
  onToggleCustomSlugMode: () => void;

  // Taxonomy Loại sự kiện & Metadata đặc thù
  categoryGroup?: TaxonomyGroupItem;
  categoryIds: string[];
  onCategoryIdsChange: (ids: string[]) => void;
  metadata: Record<string, any>;
  onMetadataChange: (meta: Record<string, any>) => void;

  // Tóm tắt ngắn
  summary: string;
  onSummaryChange: (val: string) => void;

  // Ảnh đại diện DUY NHẤT
  thumbnailUrl: string;
  onThumbnailUrlChange: (url: string) => void;

  // Niên đại & Thời gian
  timelineMode: TimelineMode;
  onTimelineModeChange: (mode: TimelineMode) => void;
  startDateInput: string;
  onStartDateInputChange: (val: string) => void;
  startIsBce: boolean;
  onStartIsBceChange: (bce: boolean) => void;
  parsedStart: FlexibleDateParseResult;
  endDateInput: string;
  onEndDateInputChange: (val: string) => void;
  endIsBce: boolean;
  onEndIsBceChange: (bce: boolean) => void;
  parsedEnd: FlexibleDateParseResult;
  eventDateNote: string;
  onEventDateNoteChange: (val: string) => void;
  isCustomDisplayMode: boolean;
  onToggleCustomDisplayMode: () => void;

  // Địa danh & Di tích
  locations: LocationOption[];
  locationId: string;
  onLocationSelect: (id: string) => void;
  locationLabel: string;
  onLocationLabelChange: (label: string) => void;
}

export function EventOverviewStep({
  isEditMode,
  status,
  lastDraftSavedAt,
  title,
  onTitleChange,
  titleTouched,
  onTitleBlur,
  activeSlug,
  customSlug,
  onCustomSlugChange,
  isCustomSlugMode,
  onToggleCustomSlugMode,
  categoryGroup,
  categoryIds,
  onCategoryIdsChange,
  metadata,
  onMetadataChange,
  summary,
  onSummaryChange,
  thumbnailUrl,
  onThumbnailUrlChange,
  timelineMode,
  onTimelineModeChange,
  startDateInput,
  onStartDateInputChange,
  startIsBce,
  onStartIsBceChange,
  parsedStart,
  endDateInput,
  onEndDateInputChange,
  endIsBce,
  onEndIsBceChange,
  parsedEnd,
  eventDateNote,
  onEventDateNoteChange,
  isCustomDisplayMode,
  onToggleCustomDisplayMode,
  locations,
  locationId,
  onLocationSelect,
  locationLabel,
  onLocationLabelChange,
}: EventOverviewStepProps) {
  const isLockedSlug = isEditMode && status === ContentStatus.PUBLISHED;

  const locationComboboxOptions = React.useMemo(() => {
    return locations.map((loc) => ({
      id: loc.id,
      label: loc.name,
      subLabel: loc.address || undefined,
      badge: 'Di tích / Địa danh',
    }));
  }, [locations]);

  return (
    <div className="space-y-6">
      {/* Thông báo trạng thái lưu nháp */}
      {lastDraftSavedAt && (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Đã lưu bản nháp tự động lúc {lastDraftSavedAt}</span>
        </div>
      )}

      {/* 1. Tên sự kiện lịch sử & Đường dẫn tĩnh */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Tên sự kiện lịch sử <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onBlur={onTitleBlur}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ví dụ: Chiến dịch Điện Biên Phủ, Phong trào Đồng Khởi Bến Tre..."
          required
          className={`w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition ${
            titleTouched && !title.trim()
              ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
              : 'border-slate-200 focus:border-amber-500'
          }`}
        />
        {titleTouched && !title.trim() && (
          <span className="text-[11px] text-rose-500 font-medium mt-1 block">
            ⚠️ Vui lòng nhập tên sự kiện lịch sử (trường bắt buộc).
          </span>
        )}

        {/* Slug URL */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <span>🔗 Đường dẫn tĩnh (Slug):</span>
              <code className="text-amber-800 font-mono font-semibold">
                /su-kien/{activeSlug || 'chua-co-slug'}
              </code>
            </span>

            {!isLockedSlug ? (
              <button
                type="button"
                onClick={onToggleCustomSlugMode}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                {isCustomSlugMode ? 'Tự động theo tên' : 'Tùy chỉnh slug'}
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 italic">
                (Đã xuất bản - Khóa URL để bảo vệ SEO)
              </span>
            )}
          </div>

          {isCustomSlugMode && !isLockedSlug && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-slate-400 font-mono">/su-kien/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) =>
                  onCustomSlugChange(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-'),
                  )
                }
                placeholder="tuy-chinh-duong-dan"
                className="flex-1 text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Phân loại sự kiện (Danh mục dùng chung & metadata đặc thù) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Phân loại sự kiện <span className="text-rose-500">*</span>
        </label>
        <EventCategoryPanel
          group={categoryGroup}
          value={categoryIds}
          onChange={onCategoryIdsChange}
          metadata={metadata}
          onMetadataChange={onMetadataChange}
        />
      </div>

      {/* 3. Niên đại & Thời gian diễn ra */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Niên đại & Thời gian diễn ra <span className="text-rose-500">*</span>
        </label>
        <HistoricalDateRangeField
          timelineMode={timelineMode}
          onTimelineModeChange={onTimelineModeChange}
          startDateInput={startDateInput}
          onStartDateInputChange={onStartDateInputChange}
          startIsBce={startIsBce}
          onStartIsBceChange={onStartIsBceChange}
          parsedStart={parsedStart}
          endDateInput={endDateInput}
          onEndDateInputChange={onEndDateInputChange}
          endIsBce={endIsBce}
          onEndIsBceChange={onEndIsBceChange}
          parsedEnd={parsedEnd}
          displayValue={eventDateNote}
          onDisplayValueChange={onEventDateNoteChange}
          isCustomDisplayMode={isCustomDisplayMode}
          onToggleCustomDisplayMode={onToggleCustomDisplayMode}
        />
      </div>

      {/* 4. Địa điểm diễn ra chính */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Địa điểm diễn ra chính
        </label>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <span className="block text-[11px] text-slate-500 mb-1">
              Liên kết Địa danh / Di tích từ Từ điển
            </span>
            <HistoricalCombobox
              options={locationComboboxOptions}
              value={locationId}
              onChange={onLocationSelect}
              placeholder="Tìm kiếm địa danh / di tích lịch sử..."
              emptyText="Không tìm thấy địa danh phù hợp"
            />
          </div>

          <div className="md:col-span-6">
            <span className="block text-[11px] text-slate-500 mb-1">
              Tên địa danh hiển thị tùy chỉnh (nếu có)
            </span>
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => onLocationLabelChange(e.target.value)}
              placeholder="Ví dụ: Mỏ Cày, Bến Tre; Rừng Trần Hưng Đạo..."
              className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {/* 5. Tóm tắt ngắn (Preview Card) */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">
            Tóm tắt ngắn (Preview Card)
          </label>
          <span
            className={`text-[11px] font-mono ${
              summary.length > 300
                ? 'text-amber-700 font-bold'
                : 'text-slate-400'
            }`}
          >
            {summary.length}/300 ký tự gợi ý
          </span>
        </div>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="Tóm tắt 2-3 dòng khái quát sự kiện, hiển thị trên thẻ card danh sách và kết quả tìm kiếm..."
          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition leading-relaxed resize-y"
        />
        <span className="text-[10px] text-slate-400 mt-1 block">
          💡 Giữ cô đọng từ 100 - 250 ký tự để card hiển thị đẹp nhất trên di động và màn hình lớn.
        </span>
      </div>

      {/* 6. Ảnh đại diện / Ảnh bìa sự kiện duy nhất (Giống hệt khung figures/create) */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Ảnh đại diện / Ảnh bìa sự kiện (tùy chọn)
        </label>
        <TopicCoverImagePicker
          value={thumbnailUrl}
          onChange={onThumbnailUrlChange}
          title="Ảnh đại diện"
        />
      </div>
    </div>
  );
}
