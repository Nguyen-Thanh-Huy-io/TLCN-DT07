const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Chuyển Date bất kỳ sang chuỗi YYYY-MM-DD theo múi giờ Việt Nam (UTC+7). */
export function toVnDateKey(date: Date = new Date()): string {
  const vn = new Date(date.getTime() + VN_OFFSET_MS);
  return `${vn.getUTCFullYear()}-${pad2(vn.getUTCMonth() + 1)}-${pad2(vn.getUTCDate())}`;
}

function parseDateKeyUtc(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

/** Trả về weekKey chuẩn ISO-8601 (YYYY-Www, Thứ 2 -> Chủ nhật) từ VN dateKey. */
export function dateKeyToIsoWeekKey(dateKey: string): string {
  const d = parseDateKeyUtc(dateKey);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${pad2(weekNo)}`;
}

export function toVnWeekKey(date: Date = new Date()): string {
  return dateKeyToIsoWeekKey(toVnDateKey(date));
}

/** Số ngày chênh lệch (later - earlier) giữa 2 chuỗi YYYY-MM-DD. */
export function diffVnDateKeys(earlierKey: string, laterKey: string): number {
  const a = parseDateKeyUtc(earlierKey).getTime();
  const b = parseDateKeyUtc(laterKey).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

/** Lấy thứ 2 đầu tuần (UTC midnight) của 1 chuỗi YYYY-Www để so khoảng cách tuần qua năm mới. */
function isoWeekMondayMs(weekKey: string): number {
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4.getTime() - (jan4Day - 1) * MS_PER_DAY);
  return week1Monday.getTime() + (week - 1) * 7 * MS_PER_DAY;
}

export function diffIsoWeekKeys(
  earlierWeek: string,
  laterWeek: string,
): number {
  return Math.round(
    (isoWeekMondayMs(laterWeek) - isoWeekMondayMs(earlierWeek)) /
      (7 * MS_PER_DAY),
  );
}

/** Danh sách N ngày VN gần nhất (từ cũ đến mới, kết thúc tại hôm nay). */
export function listRecentVnDateKeys(
  days: number,
  now: Date = new Date(),
): string[] {
  const todayMs = parseDateKeyUtc(toVnDateKey(now)).getTime();
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayMs - i * MS_PER_DAY);
    result.push(
      `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    );
  }
  return result;
}

/** Danh sách 7 ngày Thứ 2 -> Chủ nhật (YYYY-MM-DD) của tuần hiện tại theo VN. */
export function listCurrentWeekVnDateKeys(now: Date = new Date()): string[] {
  const today = parseDateKeyUtc(toVnDateKey(now));
  const dayNum = today.getUTCDay() || 7;
  const mondayMs = today.getTime() - (dayNum - 1) * MS_PER_DAY;
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayMs + i * MS_PER_DAY);
    keys.push(
      `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    );
  }
  return keys;
}
