export const ROW_LAYOUT_CONFIG = {
  MIN_COLUMN_COUNT: 1,
  MAX_COLUMN_COUNT: 4,
  MIN_COLUMN_WIDTH_PERCENT: 20,
  MAX_COLUMN_WIDTH_PERCENT: 80,
  SNAP_STEP_PERCENT: 5,
  DEFAULT_GAP_PX: 16,
} as const;

export interface RatioPresetItem {
  id: string;
  label: string;
  values: number[]; // Tổng các phần tử xấp xỉ 100
}

export const ROW_RATIO_PRESETS: Record<number, RatioPresetItem[]> = {
  1: [
    { id: '100', label: '100% (Toàn chiều rộng)', values: [100] },
  ],
  2: [
    { id: '50-50', label: '50 : 50 (Chia đôi đều)', values: [50, 50] },
    { id: '60-40', label: '60 : 40', values: [60, 40] },
    { id: '70-30', label: '70 : 30 (Bài chính + Phụ chú)', values: [70, 30] },
    { id: '30-70', label: '30 : 70 (Phụ chú + Bài chính)', values: [30, 70] },
    { id: '40-60', label: '40 : 60', values: [40, 60] },
  ],
  3: [
    { id: '33-33-33', label: '33 : 33 : 33 (Chia 3 đều)', values: [33.33, 33.33, 33.34] },
    { id: '25-50-25', label: '25 : 50 : 25 (Trung tâm)', values: [25, 50, 25] },
    { id: '50-25-25', label: '50 : 25 : 25', values: [50, 25, 25] },
    { id: '25-25-50', label: '25 : 25 : 50', values: [25, 25, 50] },
  ],
  4: [
    { id: '25-25-25-25', label: '25 : 25 : 25 : 25 (Chia 4 đều)', values: [25, 25, 25, 25] },
  ],
};
