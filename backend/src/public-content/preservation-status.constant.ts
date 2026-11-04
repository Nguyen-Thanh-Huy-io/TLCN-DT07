/**
 * Hiện trạng di tích chuẩn hóa — bộ lọc luôn cố định đúng 5 nhóm dù dữ liệu tăng lên.
 * Cột preservation_status đang là chữ tự do (tên khu tưởng niệm, tên bảo tàng, ghi chú...):
 * quy về một nhóm, phần chữ có ích còn lại giữ thành ghi chú (statusNote) để hiển thị,
 * không bao giờ đưa lên bộ lọc.
 */
export const PRESERVATION_CATEGORIES = {
  INTACT: 'Bảo tồn nguyên vẹn',
  MUSEUM_MEMORIAL: 'Bảo tàng & Khu tưởng niệm',
  ARCHAEOLOGICAL_RUIN: 'Phế tích & Khảo cổ',
  RESTORED: 'Đã trùng tu / Phục dựng',
  ACTIVE_SITE: 'Công trình đang hoạt động',
} as const;

export type PreservationCategory = keyof typeof PRESERVATION_CATEGORIES;

/**
 * Quy tắc theo thứ tự ưu tiên (khớp đầu tiên thắng): "đang hoạt động & bảo tàng" là công trình
 * đang hoạt động; "bảo tồn nguyên vẹn (thuộc bảo tàng X)" là bảo tàng.
 */
const RULES: Array<{ category: PreservationCategory; pattern: RegExp }> = [
  {
    category: 'ACTIVE_SITE',
    pattern: /đang hoạt động|đang sử dụng|đang vận hành/,
  },
  {
    category: 'ARCHAEOLOGICAL_RUIN',
    pattern: /khảo cổ|phế tích|di chỉ|tàn tích/,
  },
  {
    category: 'RESTORED',
    pattern: /trùng tu|phục dựng|dựng lại|xây lại|tu bổ|phục hồi/,
  },
  { category: 'MUSEUM_MEMORIAL', pattern: /bảo tàng|tưởng niệm|nghĩa trang/ },
  {
    category: 'INTACT',
    pattern: /nguyên vẹn|nguyên trạng|bảo tồn đặc biệt|bảo tồn tốt/,
  },
];

export interface PreservationInfo {
  category: PreservationCategory | null;
  /** Ghi chú hiển thị trên thẻ / trang chi tiết (không dùng để lọc). */
  note: string | null;
}

export function normalizePreservation(
  raw: string | null | undefined,
): PreservationInfo {
  const text = raw?.trim();
  if (!text) return { category: null, note: null };
  const lower = text.toLocaleLowerCase('vi');
  if (lower in PRESERVATION_CATEGORIES)
    return { category: lower as PreservationCategory, note: null };
  if (text in PRESERVATION_CATEGORIES)
    return { category: text as PreservationCategory, note: null };

  const category = RULES.find((r) => r.pattern.test(lower))?.category ?? null;
  if (!category) return { category: null, note: text };

  // Chữ trùng đúng tên nhóm thì không cần ghi chú lặp lại.
  if (lower === PRESERVATION_CATEGORIES[category].toLocaleLowerCase('vi'))
    return { category, note: null };
  if (category === 'INTACT' && lower.includes('đặc biệt'))
    return { category, note: 'Chế độ bảo tồn đặc biệt' };
  // "Bảo tồn nguyên vẹn (thuộc Bảo tàng X)": tên bảo tàng đã có ở đơn vị quản lý, ghi chú giữ phần hiện trạng.
  if (category === 'MUSEUM_MEMORIAL' && lower.startsWith('bảo tồn nguyên vẹn'))
    return { category, note: 'Bảo tồn nguyên vẹn' };
  // Tên khu tưởng niệm / bảo tàng chỉ là tên địa danh — đã có ở tiêu đề, không lặp thành ghi chú.
  if (category === 'MUSEUM_MEMORIAL') return { category, note: null };
  return { category, note: text };
}
