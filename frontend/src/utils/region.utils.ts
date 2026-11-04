import { HISTORICAL_REGION_OPTIONS, HistoricalRegion } from '@/constants/enums';

/**
 * Một nguồn duy nhất cho tên quốc gia / khu vực hiển thị và dùng để lọc
 * (Trang chủ, Dòng thời gian, Nhân vật, Giai đoạn...).
 */

export const UNKNOWN_REGION = 'Chưa phân vùng';

const DOMESTIC_REGIONS = new Set<string>([HistoricalRegion.VIETNAM, HistoricalRegion.NATIONWIDE]);

/** Tên khu vực để hiển thị / lọc: "Toàn quốc" (cả nước) gộp vào "Việt Nam", thiếu dữ liệu → "Chưa phân vùng". */
export function regionLabel(region: string | null | undefined): string {
  if (!region) return UNKNOWN_REGION;
  return region === HistoricalRegion.NATIONWIDE ? HistoricalRegion.VIETNAM : region;
}

export function isDomesticRegion(region: string | null | undefined): boolean {
  return !region || DOMESTIC_REGIONS.has(region);
}

/**
 * Danh sách khu vực (đã chuẩn hóa, không trùng) để làm bộ lọc:
 * khu vực chuẩn theo thứ tự của HISTORICAL_REGION_OPTIONS, khu vực lạ xếp sau theo ABC,
 * "Chưa phân vùng" luôn cuối.
 */
export function sortedRegions(
  regions: Iterable<string | null | undefined>,
  /** Thứ tự chuẩn (nhãn) — lấy từ danh mục REGION; thiếu thì dùng thứ tự mặc định trong code. */
  order: readonly string[] = HISTORICAL_REGION_OPTIONS,
): string[] {
  const unique = Array.from(new Set(Array.from(regions, regionLabel)));
  const rank = (r: string) => {
    if (r === UNKNOWN_REGION) return Number.MAX_SAFE_INTEGER;
    const i = order.indexOf(r);
    return i === -1 ? order.length : i;
  };
  return unique.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'vi'));
}

/** Thứ tự khu vực theo cây danh mục REGION (cha trước con, mỗi cấp theo thứ tự hiển thị); rỗng → mặc định. */
export function regionOrderFromTerms(terms: Array<{ label: string; displayOrder: number; parentId: string | null; id: string }>): readonly string[] {
  if (!terms.length) return HISTORICAL_REGION_OPTIONS;
  const children = new Map<string | null, typeof terms>();
  for (const t of terms) {
    const parent = t.parentId && terms.some((p) => p.id === t.parentId) ? t.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), t]);
  }
  const out: string[] = [];
  const walk = (parent: string | null) => {
    for (const t of [...(children.get(parent) ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)) {
      if (out.includes(t.label)) continue;
      out.push(t.label);
      walk(t.id);
    }
  };
  walk(null);
  return out;
}
