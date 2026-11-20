/** Hiện trạng chuẩn hóa — đúng 5 nhóm, đồng bộ SITE_PRESERVATION_CODES ở backend/src/article/article-metadata.ts. */
export type PreservationCategory = 'INTACT' | 'MUSEUM_MEMORIAL' | 'ARCHAEOLOGICAL_RUIN' | 'RESTORED' | 'ACTIVE_SITE';

export const PRESERVATION_LABELS: Record<PreservationCategory, string> = {
  INTACT: '🏛️ Bảo tồn nguyên vẹn',
  MUSEUM_MEMORIAL: '🕯️ Bảo tàng & Khu tưởng niệm',
  ARCHAEOLOGICAL_RUIN: '🏺 Phế tích & Khảo cổ',
  RESTORED: '🛠️ Đã trùng tu / Phục dựng',
  ACTIVE_SITE: '🚀 Công trình đang hoạt động',
};
