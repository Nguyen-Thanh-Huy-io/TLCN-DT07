'use client';

import { useState, useMemo } from 'react';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';
import { TaxonomySelect } from '@/features/taxonomy/TaxonomySelect';
import { TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import { EntityType, KeyboardKey } from '@/constants/enums';
import { PeriodItem } from '@/types/models/period.type';
import { ENTITY_TYPE_LABELS } from '../entity-editor.constants';
import { FigureProfileFields, type FigureProfileForm } from '../FigureProfileFields';
import { EntityStrategyRegistry } from '../../strategies/entity-type.strategy';

export interface EntityBasicInfoStepProps {
  name: string;
  onNameChange: (v: string) => void;
  type: EntityType;
  onTypeChange: (v: EntityType) => void;
  /** true khi vào form từ 1 lối tạo đã biết trước loại (vd. "Tạo Địa danh") — khoá ô chọn, hiện huy hiệu tĩnh thay vì hỏi lại. */
  isTypeLocked?: boolean;

  tagline: string;
  onTaglineChange: (v: string) => void;

  aliases: string[];
  aliasInput: string;
  onAliasInputChange: (v: string) => void;
  onAddAlias: () => void;
  onRemoveAlias: (alias: string) => void;

  imageUrl: string;
  onImageUrlChange: (v: string) => void;
  imageCaption: string;
  onImageCaptionChange: (v: string) => void;

  // Historical Site fields (chỉ hiện khi type === LOCATION)
  siteTaxonomies: Record<string, TaxonomyGroupItem>;
  address: string;
  onAddressChange: (v: string) => void;
  siteType: string;
  onSiteTypeChange: (v: string) => void;
  latitude: number | '';
  onLatitudeChange: (v: number | '') => void;
  longitude: number | '';
  onLongitudeChange: (v: number | '') => void;
  recognitionLevel: string;
  onRecognitionLevelChange: (v: string) => void;
  preservationStatus: string;
  onPreservationStatusChange: (v: string) => void;
  managingAgency: string;
  onManagingAgencyChange: (v: string) => void;
  statusNote: string;
  onStatusNoteChange: (v: string) => void;

  // Thời kỳ & niên đại
  periods: PeriodItem[];
  periodIds: string[];
  onPeriodIdsChange: (v: string[]) => void;
  periodId: string;
  onPeriodIdChange: (v: string) => void;
  birthYear: number | '';
  onBirthYearChange: (v: number | '') => void;
  deathYear: number | '';
  onDeathYearChange: (v: number | '') => void;
  birthDateLabel: string;
  onBirthDateLabelChange: (v: string) => void;
  deathDateLabel: string;
  onDeathDateLabelChange: (v: string) => void;
  yearValidationError: string | null;

  figureProfile?: FigureProfileForm;
  onFigureProfileChange?: (v: FigureProfileForm) => void;
}

/**
 * Bước 1 — Thông tin chung:
 * Tên, phân loại, mô tả nhận diện, tên gọi khác, ảnh tư liệu, tọa độ di tích (nếu là Location),
 * chọn các thời kỳ liên quan và niên đại (rút gọn còn 2 ô số + nút mở rộng chữ).
 */
export function EntityBasicInfoStep({
  name,
  onNameChange,
  type,
  onTypeChange,
  isTypeLocked,
  tagline,
  onTaglineChange,
  aliases,
  aliasInput,
  onAliasInputChange,
  onAddAlias,
  onRemoveAlias,
  imageUrl,
  onImageUrlChange,
  imageCaption,
  onImageCaptionChange,
  siteTaxonomies,
  address,
  onAddressChange,
  siteType,
  onSiteTypeChange,
  latitude,
  onLatitudeChange,
  longitude,
  onLongitudeChange,
  recognitionLevel,
  onRecognitionLevelChange,
  preservationStatus,
  onPreservationStatusChange,
  managingAgency,
  onManagingAgencyChange,
  statusNote,
  onStatusNoteChange,
  periods,
  periodIds,
  onPeriodIdsChange,
  periodId,
  onPeriodIdChange,
  birthYear,
  onBirthYearChange,
  deathYear,
  onDeathYearChange,
  birthDateLabel,
  onBirthDateLabelChange,
  deathDateLabel,
  onDeathDateLabelChange,
  yearValidationError,
  figureProfile,
  onFigureProfileChange,
}: EntityBasicInfoStepProps) {
  const strategy = EntityStrategyRegistry.get(type);

  // Mở rộng/thu gọn tùy chỉnh niên đại văn bản (chữ)
  const [isCustomDateTextOpen, setIsCustomDateTextOpen] = useState(
    () => Boolean(birthDateLabel.trim()) || Boolean(deathDateLabel.trim()),
  );

  // Tìm kiếm và chọn thời kỳ lịch sử
  const [periodSearch, setPeriodSearch] = useState('');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  const filteredPeriods = useMemo(() => {
    const q = periodSearch.trim().toLowerCase();
    const unselected = periods.filter((p) => !periodIds.includes(p.id));
    if (!q) {
      return unselected.slice(0, 8);
    }
    return unselected
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.startYear && String(p.startYear).includes(q)) ||
          (p.endYear && String(p.endYear).includes(q)),
      )
      .slice(0, 10);
  }, [periods, periodIds, periodSearch]);

  return (
    <div className="space-y-5">
      {/* 1. Tên và Phân loại */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <label className="block mb-1 text-xs font-semibold text-slate-700">
            {strategy.fields.nameLabel} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={strategy.fields.namePlaceholder}
            className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="md:col-span-4">
          <label className="block mb-1 text-xs font-semibold text-slate-700">
            Phân loại thực thể {!isTypeLocked && <span className="text-rose-500">*</span>}
          </label>
          {isTypeLocked ? (
            <div className="w-full flex items-center text-xs font-semibold px-3.5 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
              {strategy.label}
            </div>
          ) : (
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value as EntityType)}
              className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
            >
              {Object.entries(ENTITY_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 2. Danh xưng / Mô tả nhận diện ngắn (1 dòng) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">
            {strategy.fields.taglineLabel}
          </label>
          <span className="text-[11px] text-slate-400">
            {strategy.fields.taglineHint}
          </span>
        </div>
        <input
          type="text"
          value={tagline}
          onChange={(e) => onTaglineChange(e.target.value)}
          placeholder={strategy.fields.taglinePlaceholder}
          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      {/* 3. Tên gọi khác / Tên cổ / Bí danh */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {strategy.fields.aliasLabel}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={aliasInput}
            onChange={(e) => onAliasInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === KeyboardKey.ENTER) {
                e.preventDefault();
                onAddAlias();
              }
            }}
            placeholder={strategy.fields.aliasPlaceholder}
            className="flex-1 text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
          />
          <button
            type="button"
            onClick={onAddAlias}
            className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-2xs"
          >
            Thêm
          </button>
        </div>

        {aliases.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {aliases.map((alias) => (
              <span
                key={alias}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium"
              >
                <span>{alias}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAlias(alias)}
                  className="text-amber-600 hover:text-rose-600 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. Ảnh đại diện & Chú thích ảnh tư liệu */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-1">
        <div className="md:col-span-5">
          <TopicCoverImagePicker
            value={imageUrl}
            onChange={onImageUrlChange}
            title={strategy.fields.avatarTitle}
            compact
          />
        </div>
        <div className="md:col-span-7 space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Chú thích ảnh tư liệu (Caption)
          </label>
          <textarea
            rows={3}
            value={imageCaption}
            onChange={(e) => onImageCaptionChange(e.target.value)}
            placeholder={strategy.fields.avatarCaptionPlaceholder}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
          />
          <p className="text-[11px] text-slate-400">
            Hiển thị nguồn gốc hoặc chi tiết hiện vật khi phóng to ảnh.
          </p>
        </div>
      </div>

      {/* 4.4. Hồ sơ tóm tắt nhân vật (Chỉ hiện khi type = PERSON) */}
      {type === EntityType.PERSON && figureProfile && onFigureProfileChange && (
        <FigureProfileFields value={figureProfile} onChange={onFigureProfileChange} />
      )}

      {/* 4.5. Thông tin chuyên biệt cho Địa danh / Di tích lịch sử (Chỉ hiện khi type = LOCATION) */}
      {type === EntityType.LOCATION && (
        <div className="pt-4 border-t border-slate-200/80 space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/60">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Thông tin Di tích / Địa danh lịch sử
              </h4>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">
                Tọa độ bản đồ, địa chỉ hành chính và cấp bảo tồn di tích văn hóa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Địa chỉ cụ thể / Khu vực
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="VD: 19C Hoàng Diệu, Quận Ba Đình, TP. Hà Nội"
                className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Loại hình di tích
              </label>
              <TaxonomySelect
                group={siteTaxonomies.SITE_TYPE}
                value={siteType}
                onChange={onSiteTypeChange}
                emptyLabel="-- Chọn loại hình di tích --"
              />
            </div>

            <div className="md:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Vĩ độ (Latitude)
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => onLatitudeChange(e.target.value ? Number(e.target.value) : '')}
                placeholder="VD: 21.0347"
                className="w-full text-xs font-mono px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Dùng cắm ghim trên Bản đồ số</span>
            </div>

            <div className="md:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kinh độ (Longitude)
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => onLongitudeChange(e.target.value ? Number(e.target.value) : '')}
                placeholder="VD: 105.8407"
                className="w-full text-xs font-mono px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Dùng cắm ghim trên Bản đồ số</span>
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cấp xếp hạng di tích
              </label>
              <TaxonomySelect
                group={siteTaxonomies.HERITAGE_RANK}
                value={recognitionLevel}
                onChange={onRecognitionLevelChange}
                emptyLabel="Chưa xếp hạng"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tình trạng bảo tồn
              </label>
              <TaxonomySelect
                group={siteTaxonomies.PRESERVATION}
                value={preservationStatus}
                onChange={onPreservationStatusChange}
                emptyLabel="Chưa xác định"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cơ quan quản lý
              </label>
              <input
                type="text"
                value={managingAgency}
                onChange={(e) => onManagingAgencyChange(e.target.value)}
                placeholder="VD: Trung tâm Bảo tồn Di sản..."
                className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="md:col-span-12">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Ghi chú hiện trạng
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => onStatusNoteChange(e.target.value)}
                placeholder="VD: Đang tu bổ khu chính điện, mở cửa một phần..."
                className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Hiển thị kèm nhóm hiện trạng trên trang di tích, không dùng để lọc</span>
            </div>
          </div>
        </div>
      )}

      {/* 4.6. Hướng dẫn & Lưu ý cho Thực thể tùy chỉnh / Khác (OTHER) */}
      {type === EntityType.OTHER && (
        <div className="pt-4 border-t border-slate-200/80 space-y-2 bg-blue-50/40 p-4 rounded-2xl border border-blue-200/60">
          <div className="flex items-start gap-2.5">
            <span className="text-base select-none">💡</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                Thực thể tùy chỉnh / Khác (Chưa có schema cố định)
              </h4>
              <p className="text-[11px] text-blue-800/90 mt-0.5 leading-relaxed">
                Áp dụng cho các văn kiện (Hiệp định, Tuyên ngôn), phong trào, học thuyết, khái niệm hoặc các đối tượng lịch sử chưa có bảng dữ liệu riêng.
                Bạn có thể thiết lập niên đại xuất hiện / kết thúc ở đây; soạn thảo bài viết chuyên sâu ở Bước 2; và gắn liên kết với Sự kiện, Nhân vật hoặc Địa danh ở Bước 3.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Thời kỳ & Niên đại (Tìm kiếm Autocomplete + Khối Niên đại rõ ràng) */}
      <div className="pt-5 border-t border-slate-200/80 space-y-4">
        {/* Header mục thời kỳ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              Thời kỳ & Giai đoạn lịch sử
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tìm kiếm và gắn các thời kỳ lịch sử liên quan đến {strategy.targetName}.
            </p>
          </div>
          {periodIds.length > 0 && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 self-start sm:self-auto">
              Đã chọn {periodIds.length} thời kỳ
            </span>
          )}
        </div>

        {/* Khung Autocomplete tìm kiếm + Danh sách thời kỳ đã chọn */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-3">
          {/* Ô tìm kiếm Autocomplete */}
          <div className="relative">
            <input
              type="text"
              value={periodSearch}
              onChange={(e) => {
                setPeriodSearch(e.target.value);
                setIsPeriodDropdownOpen(true);
              }}
              onFocus={() => setIsPeriodDropdownOpen(true)}
              placeholder="🔍 Gõ tên hoặc năm để tìm thời kỳ (VD: Nhà Trần, 1945, Kháng chiến...)"
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition shadow-2xs"
            />
            {periodSearch && (
              <button
                type="button"
                onClick={() => setPeriodSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}

            {/* Dropdown danh sách thời kỳ tìm được */}
            {isPeriodDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsPeriodDropdownOpen(false)}
                />
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Gợi ý thời kỳ ({filteredPeriods.length})</span>
                    <button
                      type="button"
                      onClick={() => setIsPeriodDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      Đóng ✕
                    </button>
                  </div>
                  {filteredPeriods.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Không tìm thấy thời kỳ nào phù hợp với &quot;{periodSearch}&quot;
                    </div>
                  ) : (
                    filteredPeriods.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const next = [...periodIds, p.id];
                          onPeriodIdsChange(next);
                          if (!periodId) onPeriodIdChange(p.id);
                          setPeriodSearch('');
                          setIsPeriodDropdownOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-amber-50/60 flex items-center justify-between text-xs transition cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{p.name}</span>
                        {p.startYear && (
                          <span className="text-[11px] font-mono text-slate-400 font-normal">
                            {p.startYear} – {p.endYear || '?'}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Danh sách các thời kỳ ĐÃ ĐƯỢC CHỌN (Gọn gàng, không bị phình giao diện) */}
          <div className="pt-1">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Thời kỳ đã liên kết:</span>
              <span className="font-normal text-slate-400">
                (Bấm ★ để chọn làm thời kỳ chính)
              </span>
            </div>

            {periodIds.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-white/50">
                Chưa có thời kỳ nào được chọn. Gõ vào ô tìm kiếm ở trên để gắn thời kỳ cho {strategy.targetName}.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {periodIds.map((pid) => {
                  const p = periods.find((item) => item.id === pid);
                  const isPrimary = periodId === pid;
                  return (
                    <div
                      key={pid}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition shadow-2xs ${
                        isPrimary
                          ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onPeriodIdChange(pid)}
                        className={`text-xs transition cursor-pointer ${
                          isPrimary
                            ? 'text-amber-200 hover:text-white'
                            : 'text-slate-300 hover:text-amber-600'
                        }`}
                        title={isPrimary ? 'Đang là thời kỳ tiêu biểu chính' : 'Bấm để đặt làm thời kỳ chính'}
                      >
                        {isPrimary ? '★' : '☆'}
                      </button>

                      <span className="font-medium">{p?.name || pid}</span>

                      {p?.startYear && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isPrimary
                              ? 'bg-amber-700/80 text-amber-100'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.startYear} - {p.endYear || '?'}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const next = periodIds.filter((id) => id !== pid);
                          onPeriodIdsChange(next);
                          if (periodId === pid) {
                            onPeriodIdChange(next.length > 0 ? next[0] : '');
                          }
                        }}
                        className={`font-bold ml-1 transition cursor-pointer ${
                          isPrimary
                            ? 'text-amber-200 hover:text-white'
                            : 'text-slate-400 hover:text-rose-600'
                        }`}
                        title="Gỡ thời kỳ này"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Khối Niên đại: 2 ô chính (Số năm) + toggle mở rộng chữ */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {strategy.fields.chronologyHeader}
            </span>
            <span className="text-[11px] text-slate-400">
              {strategy.fields.chronologyHint}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50/60 border border-slate-200/60 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {strategy.fields.startYearLabel} <span className="font-normal text-slate-400">(Số năm)</span>
              </label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) =>
                  onBirthYearChange(e.target.value ? Number(e.target.value) : '')
                }
                placeholder={`Ví dụ: ${strategy.fields.startYearPlaceholder}`}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
              />
              <span className="text-[10px] text-slate-400 block">
                Dùng định vị trên trục Timeline & bộ lọc
              </span>
            </div>

            <div className="p-3 bg-slate-50/60 border border-slate-200/60 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {strategy.fields.endYearLabel} <span className="font-normal text-slate-400">(Số năm)</span>
              </label>
              <input
                type="number"
                value={deathYear}
                onChange={(e) =>
                  onDeathYearChange(e.target.value ? Number(e.target.value) : '')
                }
                placeholder={`Ví dụ: ${strategy.fields.endYearPlaceholder || 'Để trống nếu còn tồn tại'}`}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
              />
              <span className="text-[10px] text-slate-400 block">
                {type === EntityType.LOCATION
                  ? 'Để trống nếu công trình vẫn còn tồn tại đến nay (tình trạng bảo tồn chọn ở mục trên)'
                  : 'Để trống nếu chưa rõ hoặc vẫn còn hoạt động'}
              </span>
            </div>
          </div>

          {/* Toggle mở rộng: Tùy chỉnh chữ hiển thị (nếu có niên đại dạng chữ) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsCustomDateTextOpen((prev) => !prev)}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 transition select-none cursor-pointer py-1"
            >
              <span>{isCustomDateTextOpen ? '▾ Thu gọn niên đại văn bản' : '▸ Tùy chỉnh văn bản hiển thị niên đại (dạng chữ)'}</span>
            </button>

            {isCustomDateTextOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2.5 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {strategy.fields.startDateLabel}
                  </label>
                  <input
                    type="text"
                    value={birthDateLabel}
                    onChange={(e) => onBirthDateLabelChange(e.target.value)}
                    placeholder={`Ví dụ: ${strategy.fields.startDatePlaceholder}`}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {strategy.fields.endDateLabel}
                  </label>
                  <input
                    type="text"
                    value={deathDateLabel}
                    onChange={(e) => onDeathDateLabelChange(e.target.value)}
                    placeholder={`Ví dụ: ${strategy.fields.endDatePlaceholder}`}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {yearValidationError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-600 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{yearValidationError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
