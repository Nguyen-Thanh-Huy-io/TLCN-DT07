export interface NormalizedSavedMaterialSnapshot {
  articleIds: string[];
  lessonIds: string[];
  timelineNodeIds: string[];
}

export const EMPTY_SAVED_MATERIAL_SNAPSHOT: NormalizedSavedMaterialSnapshot = {
  articleIds: [],
  lessonIds: [],
  timelineNodeIds: [],
};

function unwrapPayloadEnvelope(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'data' in raw) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/**
 * Chuẩn hóa payload từ `/saved-materials` (bao gồm cả bọc `{ statusCode, data }`
 * từ NestJS TransformInterceptor lẫn fallback `[]` khi mất kết nối ở `api.ts`).
 */
export function normalizeSavedMaterialSnapshot(
  raw: unknown,
): NormalizedSavedMaterialSnapshot {
  const payload = unwrapPayloadEnvelope(raw);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return EMPTY_SAVED_MATERIAL_SNAPSHOT;
  }

  const record = payload as Record<string, unknown>;
  return {
    articleIds: toStringArray(record.articleIds),
    lessonIds: toStringArray(record.lessonIds),
    timelineNodeIds: toStringArray(record.timelineNodeIds),
  };
}

/** Giải nén kết quả `{ saved: boolean }` từ `/saved-materials/toggle`. */
export function unwrapSavedToggleResult(raw: unknown): boolean {
  const payload = unwrapPayloadEnvelope(raw);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }
  return Boolean((payload as Record<string, unknown>).saved);
}
