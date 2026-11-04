/**
 * Tiện ích Chuyển đổi Số La Mã (Roman Numerals Utility)
 * Hỗ trợ chuyển đổi hai chiều cho các thế kỷ lịch sử (I đến XXI, và mở rộng đến XXX).
 */

const ROMAN_MAP: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

const NUM_TO_ROMAN_ENTRIES: Array<[number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/**
 * Chuyển một chuỗi số La Mã (VD: "XIX", "x", "IV") thành số nguyên.
 * Trả về null nếu không phải chuỗi La Mã hợp lệ.
 */
export function parseRomanNumeral(input: string): number | null {
  if (!input) return null;
  const upper = input.trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(upper)) {
    return null;
  }

  let total = 0;
  let prevValue = 0;

  for (let i = upper.length - 1; i >= 0; i--) {
    const char = upper[i];
    const currentValue = ROMAN_MAP[char];
    if (!currentValue) return null;

    if (currentValue < prevValue) {
      total -= currentValue;
    } else {
      total += currentValue;
      prevValue = currentValue;
    }
  }

  return total > 0 ? total : null;
}

/**
 * Chuyển số nguyên dương (VD: 19, 10, 3) thành số La Mã chuẩn (VD: "XIX", "X", "III").
 */
export function toRomanNumeral(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) return String(num);

  let current = num;
  let result = '';

  for (const [val, roman] of NUM_TO_ROMAN_ENTRIES) {
    while (current >= val) {
      result += roman;
      current -= val;
    }
  }

  return result;
}
