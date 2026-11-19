export const SAVED_MATERIAL_ROUTES = {
  ROOT: 'saved-materials',
  TOGGLE: 'toggle',
  BY_KIND_AND_TARGET: ':kind/:targetId',
} as const;

export const SAVED_MATERIAL_MESSAGES = {
  INVALID_TARGET_ID: 'Thiếu mã tư liệu cần lưu.',
} as const;
