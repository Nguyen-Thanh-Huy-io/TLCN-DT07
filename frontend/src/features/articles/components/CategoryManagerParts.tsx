'use client';

import React, { useState } from 'react';
import {
  Archive,
  Bookmark,
  BookOpen,
  Calendar,
  Castle,
  Check,
  Church,
  Compass,
  Crown,
  Flag,
  FolderOpen,
  Globe,
  GraduationCap,
  Landmark,
  Library,
  MapPin,
  RefreshCw,
  Scroll,
  ScrollText,
  Shield,
  Swords,
  Trophy,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';

export enum CategoryStatusFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  EMPTY = 'EMPTY',
}

export interface CategoryDraft {
  id?: string;
  parentId: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  originalSlug?: string;
  articleCount: number;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export const MAX_CATEGORY_DESC_LENGTH = 200;

export const CATEGORY_ICON_OPTIONS: Array<{
  code: string;
  label: string;
  Icon: LucideIcon;
}> = [
  { code: 'crown', label: 'Crown', Icon: Crown },
  { code: 'user-round', label: 'User Round', Icon: UserRound },
  { code: 'swords', label: 'Swords', Icon: Swords },
  { code: 'map-pin', label: 'Map Pin', Icon: MapPin },
  { code: 'book-open', label: 'Book Open', Icon: BookOpen },
  { code: 'landmark', label: 'Landmark', Icon: Landmark },
  { code: 'scroll', label: 'Scroll', Icon: Scroll },
  { code: 'shield', label: 'Shield', Icon: Shield },
  { code: 'globe', label: 'Globe', Icon: Globe },
  { code: 'flag', label: 'Flag', Icon: Flag },
  { code: 'castle', label: 'Castle', Icon: Castle },
  { code: 'scroll-text', label: 'Scroll Text', Icon: ScrollText },
  { code: 'calendar', label: 'Calendar', Icon: Calendar },
  { code: 'library', label: 'Library', Icon: Library },
  { code: 'compass', label: 'Compass', Icon: Compass },
  { code: 'graduation-cap', label: 'Graduation Cap', Icon: GraduationCap },
  { code: 'church', label: 'Church', Icon: Church },
  { code: 'archive', label: 'Archive', Icon: Archive },
  { code: 'trophy', label: 'Trophy', Icon: Trophy },
  { code: 'users', label: 'Users', Icon: Users },
  { code: 'book-mark', label: 'Bookmark', Icon: Bookmark },
];

const ICON_BY_CODE = new Map<string, { code: string; label: string; Icon: LucideIcon }>(
  CATEGORY_ICON_OPTIONS.map((item) => [item.code, item]),
);

export function renderCategoryIcon(iconName: string | null | undefined, className = 'h-4 w-4 text-slate-600') {
  const key = (iconName || '').trim().toLowerCase();
  const matched = ICON_BY_CODE.get(key);
  if (matched) {
    const IconCmp = matched.Icon;
    return <IconCmp className={className} />;
  }
  return <FolderOpen className={className} />;
}

export function toCategorySlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400';
const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600';

export interface CategoryFormCardProps {
  draft: CategoryDraft;
  rootCategories: Array<{ id: string; name: string }>;
  saving: boolean;
  existingSlugs: Set<string>;
  onChange: (next: CategoryDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CategoryFormCard({
  draft,
  rootCategories,
  saving,
  existingSlugs,
  onChange,
  onSave,
  onCancel,
}: CategoryFormCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const effectiveSlug = (draft.slug.trim() || toCategorySlug(draft.name)).trim();
  const suggestedSlug = toCategorySlug(draft.name);
  const isDuplicateSlug = Boolean(effectiveSlug && existingSlugs.has(effectiveSlug));
  const showSlugSuggestion =
    Boolean(draft.name.trim()) &&
    Boolean(suggestedSlug) &&
    draft.slugTouched &&
    effectiveSlug !== suggestedSlug;
  const isChangingSlugWithArticles =
    Boolean(draft.id) &&
    draft.articleCount > 0 &&
    Boolean(draft.originalSlug) &&
    effectiveSlug !== draft.originalSlug;

  const selectedIconOption = ICON_BY_CODE.get(draft.icon.trim().toLowerCase());

  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">
          {draft.id ? 'Chỉnh sửa chuyên mục' : 'Thêm chuyên mục mới'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="Đóng"
        >
          <X size={16} />
        </button>
      </div>

      {/* Hàng 1: 3 cột (Tên chuyên mục | Đường dẫn Slug | Biểu tượng) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelCls}>Tên chuyên mục *</label>
          <input
            className={inputCls}
            autoFocus
            placeholder="Ví dụ: Triều đại"
            value={draft.name}
            onChange={(e) =>
              onChange({
                ...draft,
                name: e.target.value,
                slug: draft.slugTouched ? draft.slug : toCategorySlug(e.target.value),
              })
            }
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className={`${labelCls} !mb-0`}>Đường dẫn (Slug) *</label>
            {showSlugSuggestion && (
              <button
                type="button"
                onClick={() => onChange({ ...draft, slug: suggestedSlug, slugTouched: false })}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                title={`Cập nhật thành "${suggestedSlug}"`}
              >
                <RefreshCw size={11} />
                <span>Cập nhật theo tên</span>
              </button>
            )}
          </div>
          <input
            className={`${inputCls} ${isDuplicateSlug ? '!border-rose-500 !bg-rose-50/40' : ''}`}
            placeholder="trieu-dai"
            value={draft.slug}
            onChange={(e) =>
              onChange({
                ...draft,
                slug: toCategorySlug(e.target.value),
                slugTouched: Boolean(e.target.value.trim()),
              })
            }
          />
          {isDuplicateSlug ? (
            <span className="mt-1 block text-[11px] font-semibold text-rose-600">
              Slug &ldquo;{effectiveSlug}&rdquo; đã được chuyên mục khác sử dụng.
            </span>
          ) : (
            <span className="mt-1 block font-mono text-[11px] text-slate-400">
              URL: {PUBLIC_ROUTES.CATEGORY(effectiveSlug || 'slug')}
            </span>
          )}
          {isChangingSlugWithArticles && !isDuplicateSlug && (
            <span className="mt-0.5 block text-[11px] text-amber-700">
              Chuyên mục đã có {draft.articleCount} bài viết — đổi slug sẽ thay đổi URL công khai hiện tại.
            </span>
          )}
        </div>

        <div>
          <label className={labelCls}>Biểu tượng</label>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                {renderCategoryIcon(draft.icon, 'h-4 w-4 text-slate-800')}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold text-slate-900">
                    {selectedIconOption?.label ?? (draft.icon || 'Mặc định')}
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                    Đã chọn
                  </span>
                </div>
                <span className="block text-[10px] text-slate-400">Lucide Icon · {draft.icon || 'folder-open'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen((prev) => !prev)}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {pickerOpen ? 'Đóng' : 'Thay đổi'}
            </button>
          </div>
        </div>
      </div>

      {/* Bảng chọn 21 biểu tượng Lucide */}
      {pickerOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Chọn biểu tượng chuyên mục ({CATEGORY_ICON_OPTIONS.length} biểu tượng)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7">
            {CATEGORY_ICON_OPTIONS.map((item) => {
              const IconCmp = item.Icon;
              const isSelected = draft.icon.trim().toLowerCase() === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onChange({ ...draft, icon: item.code });
                    setPickerOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <IconCmp className="h-4 w-4 shrink-0 text-slate-700" />
                  <span className="truncate font-mono text-[11px]">{item.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hàng 2: Chuyên mục cha (1 cột) + Mô tả ngắn (1 cột) + Thứ tự & Trạng thái (1 cột) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelCls}>Chuyên mục cha</label>
          <select
            className={inputCls}
            value={draft.parentId}
            onChange={(e) => onChange({ ...draft, parentId: e.target.value })}
          >
            <option value="">— Chuyên mục gốc (Cấp 1) —</option>
            {rootCategories
              .filter((r) => r.id !== draft.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  ↳ Thuộc: {r.name}
                </option>
              ))}
          </select>
          <span className="mt-1 block text-[11px] text-slate-400">
            {draft.parentId ? 'Chuyên mục con (kế thừa loại bài của cha).' : 'Chuyên mục cấp cao nhất.'}
          </span>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className={`${labelCls} !mb-0`}>Mô tả ngắn</label>
            <span className="font-mono text-[11px] text-slate-400">
              {draft.description.length}/{MAX_CATEGORY_DESC_LENGTH}
            </span>
          </div>
          <input
            className={inputCls}
            maxLength={MAX_CATEGORY_DESC_LENGTH}
            placeholder="Các triều đại trong lịch sử Việt Nam."
            value={draft.description}
            onChange={(e) =>
              onChange({ ...draft, description: e.target.value.slice(0, MAX_CATEGORY_DESC_LENGTH) })
            }
          />
          <span className="mt-1 block text-[11px] text-slate-400">
            Hiển thị trong trang chuyên mục.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Thứ tự hiển thị</label>
            <input
              className={inputCls}
              type="number"
              step={1}
              min={0}
              value={draft.displayOrder}
              onChange={(e) => onChange({ ...draft, displayOrder: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              Số càng nhỏ, vị trí hiển thị càng cao.
            </span>
          </div>

          <div>
            <label className={labelCls}>Trạng thái</label>
            <select
              className={inputCls}
              value={draft.isActive ? CategoryStatusFilter.ACTIVE : CategoryStatusFilter.HIDDEN}
              onChange={(e) => onChange({ ...draft, isActive: e.target.value === CategoryStatusFilter.ACTIVE })}
            >
              <option value={CategoryStatusFilter.ACTIVE}>Đang hoạt động</option>
              <option value={CategoryStatusFilter.HIDDEN}>Đã ẩn</option>
            </select>
            <span className="mt-1 block text-[11px] text-slate-400">
              {draft.isActive ? 'Hiển thị công khai.' : 'Ẩn khỏi danh sách công khai.'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={onCancel} className="secondary-button !h-9 !px-3.5 !text-xs font-semibold">
          Hủy
        </button>
        <button
          type="button"
          disabled={saving || !draft.name.trim() || !effectiveSlug || isDuplicateSlug}
          onClick={onSave}
          className="primary-button !h-9 !px-4 !text-xs font-bold"
        >
          <Check size={14} /> {saving ? 'Đang lưu...' : 'Lưu chuyên mục'}
        </button>
      </div>
    </section>
  );
}
