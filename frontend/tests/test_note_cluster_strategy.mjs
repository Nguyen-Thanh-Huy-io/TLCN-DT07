import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INK_HISTORY_ACTION,
  NOTE_ANCHOR_MODE,
  NOTE_CLUSTER_UNGROUPED_KEY,
  NOTE_COLOR,
  NOTE_INK_TOOL,
  NOTE_KIND,
  NOTE_MARKUP_STYLE,
  NOTE_TARGET_TYPE,
  OPTIMISTIC_INK_NOTE_ID_PREFIX,
  applyInkHistoryUndo,
  buildInkNotePayload,
  formatBlockSpanLabel,
  groupNotesByCluster,
  hitTestInkItem,
  isBlockClusterAnchor,
  isInkAnchor,
  mergeEffectiveBlockInkNotes,
  resolveNoteMarkupHighlightNames,
} from '../src/features/notes/utils/note-cluster.util.ts';
import {
  appendInkPoint,
  buildSmoothInkPath,
  clampInkCanvasBox,
  denormalizeInkPoints,
  normalizeInkPoints,
} from '../src/features/notes/utils/note-ink.util.ts';

const baseNote = (overrides) => ({
  id: 'n-1',
  targetType: NOTE_TARGET_TYPE.ARTICLE,
  targetId: 'art-1',
  userId: 'u-1',
  guestId: null,
  title: null,
  content: 'Nội dung ghi chú',
  highlightText: null,
  anchor: null,
  kind: NOTE_KIND.NOTE,
  labels: [],
  resolvedAt: null,
  contentVersion: 1,
  color: NOTE_COLOR.YELLOW,
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
  ...overrides,
});

test('formatBlockSpanLabel và isBlockClusterAnchor nhận diện đúng đoạn đơn & cụm nhiều đoạn', () => {
  assert.equal(isBlockClusterAnchor({ blockStart: 2 }), true);
  assert.equal(isBlockClusterAnchor({ mode: NOTE_ANCHOR_MODE.BLOCK, blockStart: 0, blockEnd: 0 }), true);
  assert.equal(isBlockClusterAnchor({ prefix: 'abc', suffix: 'def' }), false);

  assert.equal(formatBlockSpanLabel({ blockStart: 0, blockEnd: 0 }), 'Đoạn 1');
  assert.equal(formatBlockSpanLabel({ blockStart: 2, blockEnd: 4 }), 'Cụm đoạn 3–5');
  assert.equal(formatBlockSpanLabel(null), null);
});

test('groupNotesByCluster gom nhóm theo nhãn #label và đẩy ghi chú chưa phân nhóm xuống cuối', () => {
  const n1 = baseNote({ id: 'n1', labels: ['Ý nghĩa ĐBP'] });
  const n2 = baseNote({ id: 'n2', labels: ['Bối cảnh 1954', 'Ý nghĩa ĐBP'] });
  const n3 = baseNote({ id: 'n3', labels: [] });

  const groups = groupNotesByCluster([n1, n2, n3]);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].label, '#Bối cảnh 1954');
  assert.deepEqual(groups[0].notes.map((n) => n.id), ['n2']);

  assert.equal(groups[1].label, '#Ý nghĩa ĐBP');
  assert.deepEqual(groups[1].notes.map((n) => n.id), ['n1', 'n2']);

  assert.equal(groups[2].groupKey, NOTE_CLUSTER_UNGROUPED_KEY);
  assert.equal(groups[2].isUngrouped, true);
  assert.deepEqual(groups[2].notes.map((n) => n.id), ['n3']);
});

test('resolveNoteMarkupHighlightNames ánh xạ chuẩn Highlight / Underline / Strikethrough và bỏ qua Block/Summary', () => {
  assert.deepEqual(
    resolveNoteMarkupHighlightNames({
      kind: NOTE_KIND.HIGHLIGHT,
      color: NOTE_COLOR.YELLOW,
      anchor: { style: NOTE_MARKUP_STYLE.HIGHLIGHT },
    }),
    ['hisgo-note-yellow'],
  );

  assert.deepEqual(
    resolveNoteMarkupHighlightNames({
      kind: NOTE_KIND.QUESTION,
      color: NOTE_COLOR.PINK,
      anchor: { style: NOTE_MARKUP_STYLE.HIGHLIGHT },
    }),
    ['hisgo-note-pink', 'hisgo-note-kind-question'],
  );

  assert.deepEqual(
    resolveNoteMarkupHighlightNames({
      kind: NOTE_KIND.NOTE,
      color: NOTE_COLOR.BLUE,
      anchor: { style: NOTE_MARKUP_STYLE.UNDERLINE },
    }),
    ['hisgo-note-underline-blue'],
  );

  assert.deepEqual(
    resolveNoteMarkupHighlightNames({
      kind: NOTE_KIND.NOTE,
      color: NOTE_COLOR.GREEN,
      anchor: { style: NOTE_MARKUP_STYLE.STRIKETHROUGH },
    }),
    ['hisgo-note-strike-green'],
  );

  assert.deepEqual(
    resolveNoteMarkupHighlightNames({
      kind: NOTE_KIND.HIGHLIGHT,
      color: NOTE_COLOR.PINK,
      anchor: { style: NOTE_MARKUP_STYLE.CIRCLE },
    }),
    [],
  );

  assert.deepEqual(
    resolveNoteMarkupHighlightNames({
      kind: NOTE_KIND.NOTE,
      color: NOTE_COLOR.PINK,
      anchor: { style: NOTE_MARKUP_STYLE.CALLOUT },
    }),
    ['hisgo-note-underline-pink'],
  );

  assert.deepEqual(
    resolveNoteMarkupHighlightNames({
      kind: NOTE_KIND.SUMMARY,
      color: NOTE_COLOR.PURPLE,
      anchor: { mode: NOTE_ANCHOR_MODE.BLOCK, blockStart: 1, blockEnd: 3 },
    }),
    [],
  );
});

test('toạ độ vẽ tay (INK) chuẩn hoá / khôi phục chính xác & hit-test tẩy đúng nét', () => {
  const contentBox = { left: 200, top: 100, width: 800, height: 600 };
  const blockBox = { left: 200, top: 250, width: 800, height: 100 };

  const pts = appendInkPoint([{ x: 280, y: 275 }], { x: 281, y: 275 }, 3);
  assert.equal(pts.length, 1); // bỏ điểm quá sát
  const pts2 = appendInkPoint(pts, { x: 400, y: 300 }, 3);
  assert.equal(pts2.length, 2);

  const normalized = normalizeInkPoints(pts2, contentBox, blockBox);
  assert.deepEqual(normalized, [0.1, 0.25, 0.25, 0.5]);

  const restored = denormalizeInkPoints(normalized, contentBox, blockBox);
  assert.deepEqual(restored, [
    { x: 280, y: 275 },
    { x: 400, y: 300 },
  ]);

  const svgPath = buildSmoothInkPath(restored);
  assert.match(svgPath, /^M 280\.0 275\.0 L 400\.0 300\.0$/);

  const inkItem = {
    id: 'st-1',
    tool: NOTE_INK_TOOL.PEN,
    color: NOTE_COLOR.PINK,
    width: 3,
    pts: normalized,
  };
  assert.equal(hitTestInkItem(inkItem, 282, 276, contentBox, blockBox), true);
  assert.equal(hitTestInkItem(inkItem, 600, 400, contentBox, blockBox), false);

  const payload = buildInkNotePayload(
    2,
    'Đoạn bắt đầu',
    'Chiến dịch Điện Biên Phủ',
    [
      inkItem,
      { id: 'tx-1', tool: NOTE_INK_TOOL.TEXT, color: NOTE_COLOR.BLUE, text: 'Nền móng', nx: 1.05, ny: 0.4 },
    ],
    NOTE_COLOR.PINK,
  );
  assert.equal(payload.kind, NOTE_KIND.NOTE);
  assert.equal(payload.content, 'Nền móng');
  assert.equal(isInkAnchor(payload.anchor), true);
  assert.equal(isBlockClusterAnchor(payload.anchor), false);
  assert.equal(formatBlockSpanLabel(payload.anchor), 'Vẽ · Đoạn 3 (2 nét)');
});

test('clampInkCanvasBox giới hạn lớp vẽ tuyệt đối trong [0, clientWidth] trên mọi kích thước màn hình', () => {
  const narrow = clampInkCanvasBox({ left: 72, top: 200, width: 880, height: 900 }, 1024, 120, 240, 32);
  assert.equal(narrow.left, 0);
  assert.equal(narrow.left + narrow.width <= 1024, true);

  const mobile = clampInkCanvasBox({ left: 16, top: 100, width: 343, height: 500 }, 375, 120, 240, 32);
  assert.equal(mobile.left, 0);
  assert.equal(mobile.left + mobile.width <= 375, true);

  const tiny = clampInkCanvasBox({ left: 50, top: 100, width: 10, height: 100 }, 80, 120, 240, 32);
  assert.equal(tiny.left + tiny.width <= 80, true);
});

test('mergeEffectiveBlockInkNotes & applyInkHistoryUndo giữ nét lạc quan tức thì và hoàn tác đúng chiến lược', () => {
  const stroke1 = { id: 's1', tool: NOTE_INK_TOOL.PEN, color: NOTE_COLOR.PINK, width: 2.5, pts: [0.1, 0.2, 0.3, 0.4] };
  const stroke2 = { id: 's2', tool: NOTE_INK_TOOL.HIGHLIGHTER, color: NOTE_COLOR.YELLOW, width: 16, pts: [0.2, 0.3, 0.6, 0.3] };

  const serverNote = baseNote({
    id: 'n-ink-0',
    anchor: { mode: NOTE_ANCHOR_MODE.INK, blockStart: 0, inkItems: [stroke1] },
  });

  // Đang lưu đồng bộ block 0 thêm stroke2 và block 4 mới tinh chưa có bản ghi server
  const merged = mergeEffectiveBlockInkNotes([serverNote], {
    0: [stroke1, stroke2],
    4: [stroke2],
  });

  assert.equal(merged.length, 2);
  assert.equal(merged[0].noteId, 'n-ink-0');
  assert.equal(merged[0].items.length, 2);
  assert.equal(merged[0].isOptimistic, true);
  assert.equal(merged[1].noteId, `${OPTIMISTIC_INK_NOTE_ID_PREFIX}4`);
  assert.equal(merged[1].items.length, 1);

  const afterUndoAdd = applyInkHistoryUndo([stroke1, stroke2], {
    action: INK_HISTORY_ACTION.ADD,
    blockStart: 0,
    item: stroke2,
  });
  assert.deepEqual(afterUndoAdd.map((i) => i.id), ['s1']);

  const afterUndoRemove = applyInkHistoryUndo([], {
    action: INK_HISTORY_ACTION.REMOVE,
    blockStart: 0,
    item: stroke1,
  });
  assert.deepEqual(afterUndoRemove.map((i) => i.id), ['s1']);
});
