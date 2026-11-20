import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_SAVED_MATERIAL_SNAPSHOT,
  normalizeSavedMaterialSnapshot,
  unwrapSavedToggleResult,
} from '../src/features/saved-materials/utils/saved-material.normalizer.ts';

test('normalizeSavedMaterialSnapshot giải nén đúng envelope TransformInterceptor của NestJS', () => {
  const result = normalizeSavedMaterialSnapshot({
    statusCode: 200,
    message: 'Success',
    data: {
      articleIds: ['art-1', 'art-2'],
      lessonIds: ['les-1'],
      timelineNodeIds: ['tl-1'],
    },
  });

  assert.deepEqual(result, {
    articleIds: ['art-1', 'art-2'],
    lessonIds: ['les-1'],
    timelineNodeIds: ['tl-1'],
  });
});

test('normalizeSavedMaterialSnapshot trả về snapshot rỗng an toàn khi nhận fallback [] hoặc dữ liệu lỗi', () => {
  assert.deepEqual(normalizeSavedMaterialSnapshot([]), EMPTY_SAVED_MATERIAL_SNAPSHOT);
  assert.deepEqual(normalizeSavedMaterialSnapshot(null), EMPTY_SAVED_MATERIAL_SNAPSHOT);
  assert.deepEqual(normalizeSavedMaterialSnapshot({ data: null }), EMPTY_SAVED_MATERIAL_SNAPSHOT);
  assert.deepEqual(
    normalizeSavedMaterialSnapshot({ data: { articleIds: [123, 'art-ok', ''] } }),
    {
      articleIds: ['art-ok'],
      lessonIds: [],
      timelineNodeIds: [],
    },
  );
});

test('unwrapSavedToggleResult đọc đúng trạng thái saved từ cả envelope và payload trực tiếp', () => {
  assert.equal(unwrapSavedToggleResult({ statusCode: 201, data: { saved: true } }), true);
  assert.equal(unwrapSavedToggleResult({ statusCode: 201, data: { saved: false } }), false);
  assert.equal(unwrapSavedToggleResult({ saved: true }), true);
  assert.equal(unwrapSavedToggleResult([]), false);
});
