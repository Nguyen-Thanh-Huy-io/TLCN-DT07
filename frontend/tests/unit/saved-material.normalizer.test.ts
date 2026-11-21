import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/services/api';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import { refetchSavedMaterials } from '@/features/saved-materials/services/saved-material.service';
import {
  EMPTY_SAVED_MATERIAL_SNAPSHOT,
  normalizeSavedMaterialSnapshot,
  unwrapSavedToggleResult,
} from '@/features/saved-materials/utils/saved-material.normalizer';

describe('saved-material.normalizer', () => {
  it('giải nén đúng envelope TransformInterceptor của NestJS', () => {
    const result = normalizeSavedMaterialSnapshot({
      statusCode: 200,
      message: 'Success',
      data: {
        articleIds: ['art-1', 'art-2'],
        lessonIds: ['les-1'],
        timelineNodeIds: ['tl-1'],
      },
    });

    expect(result).toEqual({
      articleIds: ['art-1', 'art-2'],
      lessonIds: ['les-1'],
      timelineNodeIds: ['tl-1'],
    });
  });

  it('trả về snapshot rỗng an toàn khi nhận fallback [] hoặc dữ liệu lỗi (ca âm & biên)', () => {
    expect(normalizeSavedMaterialSnapshot([])).toEqual(EMPTY_SAVED_MATERIAL_SNAPSHOT);
    expect(normalizeSavedMaterialSnapshot(null)).toEqual(EMPTY_SAVED_MATERIAL_SNAPSHOT);
    expect(normalizeSavedMaterialSnapshot({ data: null })).toEqual(EMPTY_SAVED_MATERIAL_SNAPSHOT);
    expect(
      normalizeSavedMaterialSnapshot({ data: { articleIds: [123, 'art-ok', ''] } }),
    ).toEqual({
      articleIds: ['art-ok'],
      lessonIds: [],
      timelineNodeIds: [],
    });
  });

  it('đọc đúng trạng thái saved từ cả envelope và payload trực tiếp', () => {
    expect(unwrapSavedToggleResult({ statusCode: 201, data: { saved: true } })).toBe(true);
    expect(unwrapSavedToggleResult({ statusCode: 201, data: { saved: false } })).toBe(false);
    expect(unwrapSavedToggleResult({ saved: true })).toBe(true);
    expect(unwrapSavedToggleResult([])).toBe(false);
  });

  describe('regression: guest reader không gọi /saved-materials gây kick sang /login', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('refetchSavedMaterials trả về snapshot rỗng và bỏ qua GET API khi chưa đăng nhập', async () => {
      vi.spyOn(PublicAuthService, 'getAccessToken').mockReturnValue(null);
      const getSpy = vi.spyOn(api, 'get');

      const result = await refetchSavedMaterials();

      expect(result).toEqual(EMPTY_SAVED_MATERIAL_SNAPSHOT);
      expect(getSpy).not.toHaveBeenCalled();
    });
  });
});
