'use client';

import type { TaxonomyGroupItem } from '@/services/entities/taxonomy.service';

interface TaxonomySelectProps {
  group?: TaxonomyGroupItem;
  /** Mã giá trị đang chọn (hoặc chữ tự do kiểu cũ chưa quy đổi được). */
  value: string;
  onChange: (value: string) => void;
  /** Giá trị lưu: mã (mặc định) hoặc nhãn — với cột chữ cũ như periods.region. */
  valueKey?: 'code' | 'label';
  /** Nhãn cho lựa chọn rỗng; null = bắt buộc chọn. */
  emptyLabel?: string | null;
  className?: string;
}

const SELECT_CLASS =
  'w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition';

/** Ô chọn một giá trị trong "Danh mục dùng chung"; giá trị đang ẩn chỉ hiện khi bản ghi đang dùng nó. */
export function TaxonomySelect({
  group,
  value,
  onChange,
  valueKey = 'code',
  emptyLabel = 'Chưa xác định',
  className,
}: TaxonomySelectProps) {
  const lower = value.toLocaleLowerCase('vi');
  // Chữ cũ trùng alias (vd. "Toàn quốc" → Việt Nam) thì chọn đúng giá trị tương ứng.
  const matched = group?.terms.find(
    (t) => t.code === value || t.label === value || t.aliases.includes(lower),
  );
  const selected = matched ? matched[valueKey] : value;
  const terms = (group?.terms ?? []).filter((t) => t.isActive || t.id === matched?.id);
  // Dữ liệu cũ nhập chữ tự do chưa khớp giá trị nào — vẫn hiện để biên tập viên thấy và chọn lại.
  const isLegacy = Boolean(value) && group !== undefined && !matched;

  return (
    <select value={selected} onChange={(e) => onChange(e.target.value)} className={className ?? SELECT_CLASS} disabled={!group}>
      {!group && <option value={value}>Đang tải danh mục...</option>}
      {emptyLabel !== null && <option value="">{emptyLabel}</option>}
      {isLegacy && <option value={value}>{value} (chưa quy đổi — hãy chọn lại)</option>}
      {terms.map((t) => (
        <option key={t.id} value={t[valueKey]}>
          {t.icon && t.icon.length <= 3 ? `${t.icon} ` : ''}
          {t.label}
          {t.isActive ? '' : ' (đang ẩn)'}
        </option>
      ))}
    </select>
  );
}
