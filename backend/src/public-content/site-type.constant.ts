/**
 * Loại di tích chuẩn hóa. Dữ liệu cũ ghi lẫn mã tiếng Anh (CITADEL...) và chữ tiếng Việt
 * tự do ("Thành cổ", "Kinh đô cổ"...) — mọi giá trị được quy về một mã trong danh sách này.
 */
export const SITE_TYPES = {
  ANCIENT_CAPITAL: 'Cố đô / Kinh thành',
  CITADEL: 'Thành lũy',
  PALACE: 'Cung điện / Dinh thự',
  BATTLEFIELD: 'Chiến trường',
  RESISTANCE_BASE: 'Căn cứ kháng chiến',
  TEMPLE: 'Đền / Chùa',
  ARCHAEOLOGICAL_SITE: 'Di chỉ khảo cổ',
  MONUMENT: 'Di tích / Địa danh lịch sử',
  OTHER: 'Khác',
} as const;

export type SiteTypeCode = keyof typeof SITE_TYPES;

/** Chữ tự do đã gặp trong dữ liệu → mã chuẩn (so khớp sau khi chữ thường, bỏ khoảng trắng thừa). */
const SITE_TYPE_ALIASES: Record<string, SiteTypeCode> = {
  'kinh đô cổ': 'ANCIENT_CAPITAL',
  'cố đô': 'ANCIENT_CAPITAL',
  'thành cổ': 'CITADEL',
  'thành lũy / trị sở lịch sử': 'CITADEL',
  'đền thờ lịch sử': 'TEMPLE',
  'chùa cổ': 'TEMPLE',
  'căn cứ kháng chiến': 'RESISTANCE_BASE',
  'di chỉ khảo cổ': 'ARCHAEOLOGICAL_SITE',
  'địa vực lịch sử': 'MONUMENT',
  'địa danh lịch sử': 'MONUMENT',
  'khu di tích lịch sử': 'MONUMENT',
};

export function normalizeSiteType(
  raw: string | null | undefined,
): SiteTypeCode {
  if (!raw) return 'OTHER';
  const value = raw.trim();
  if (value in SITE_TYPES) return value as SiteTypeCode;
  return (
    SITE_TYPE_ALIASES[value.toLocaleLowerCase('vi').replace(/\s+/g, ' ')] ??
    'OTHER'
  );
}
