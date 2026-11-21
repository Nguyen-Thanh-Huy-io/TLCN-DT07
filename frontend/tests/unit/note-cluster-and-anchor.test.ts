import { describe, expect, it } from 'vitest';
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
  type NoteItem,
} from '@/features/notes/utils/note-cluster.util';
import { computeFreshAnchor, resolveNoteAnchor } from '@/features/notes/utils/note-anchor.strategy';
import { buildTextIndex } from '@/features/notes/utils/note-anchor.util';
import {
  appendInkPoint,
  buildSmoothInkPath,
  clampInkCanvasBox,
  denormalizeInkPoints,
  normalizeInkPoints,
} from '@/features/notes/utils/note-ink.util';

const baseNote = (overrides: Partial<NoteItem> = {}): NoteItem => ({
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

describe('note-cluster, note-ink & note-anchor.strategy', () => {
  it('nhận diện đúng anchor cụm đoạn & định dạng nhãn đoạn đơn/nhiều đoạn', () => {
    expect(isBlockClusterAnchor({ blockStart: 2 })).toBe(true);
    expect(
      isBlockClusterAnchor({ mode: NOTE_ANCHOR_MODE.BLOCK, blockStart: 0, blockEnd: 0 }),
    ).toBe(true);
    expect(isBlockClusterAnchor({ prefix: 'abc', suffix: 'def' })).toBe(false);

    expect(formatBlockSpanLabel({ blockStart: 0, blockEnd: 0 })).toBe('Đoạn 1');
    expect(formatBlockSpanLabel({ blockStart: 2, blockEnd: 4 })).toBe('Cụm đoạn 3–5');
    expect(formatBlockSpanLabel(null)).toBeNull();
  });

  it('groupNotesByCluster gom nhóm theo nhãn #label và đẩy ghi chú chưa phân nhóm xuống cuối', () => {
    const n1 = baseNote({ id: 'n1', labels: ['Ý nghĩa ĐBP'] });
    const n2 = baseNote({ id: 'n2', labels: ['Bối cảnh 1954', 'Ý nghĩa ĐBP'] });
    const n3 = baseNote({ id: 'n3', labels: [] });

    const groups = groupNotesByCluster([n1, n2, n3]);
    expect(groups).toHaveLength(3);
    expect(groups[0].label).toBe('#Bối cảnh 1954');
    expect(groups[0].notes.map((n) => n.id)).toEqual(['n2']);
    expect(groups[1].label).toBe('#Ý nghĩa ĐBP');
    expect(groups[1].notes.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(groups[2].groupKey).toBe(NOTE_CLUSTER_UNGROUPED_KEY);
    expect(groups[2].isUngrouped).toBe(true);
    expect(groups[2].notes.map((n) => n.id)).toEqual(['n3']);
  });

  it('resolveNoteMarkupHighlightNames ánh xạ chuẩn Highlight/Underline/Strike/Callout và bỏ qua Circle/Block', () => {
    expect(
      resolveNoteMarkupHighlightNames({
        kind: NOTE_KIND.HIGHLIGHT,
        color: NOTE_COLOR.YELLOW,
        anchor: { style: NOTE_MARKUP_STYLE.HIGHLIGHT },
      }),
    ).toEqual(['hisgo-note-yellow']);

    expect(
      resolveNoteMarkupHighlightNames({
        kind: NOTE_KIND.QUESTION,
        color: NOTE_COLOR.PINK,
        anchor: { style: NOTE_MARKUP_STYLE.HIGHLIGHT },
      }),
    ).toEqual(['hisgo-note-pink', 'hisgo-note-kind-question']);

    expect(
      resolveNoteMarkupHighlightNames({
        kind: NOTE_KIND.NOTE,
        color: NOTE_COLOR.BLUE,
        anchor: { style: NOTE_MARKUP_STYLE.UNDERLINE },
      }),
    ).toEqual(['hisgo-note-underline-blue']);

    expect(
      resolveNoteMarkupHighlightNames({
        kind: NOTE_KIND.NOTE,
        color: NOTE_COLOR.GREEN,
        anchor: { style: NOTE_MARKUP_STYLE.STRIKETHROUGH },
      }),
    ).toEqual(['hisgo-note-strike-green']);

    expect(
      resolveNoteMarkupHighlightNames({
        kind: NOTE_KIND.HIGHLIGHT,
        color: NOTE_COLOR.PINK,
        anchor: { style: NOTE_MARKUP_STYLE.CIRCLE },
      }),
    ).toEqual([]);

    expect(
      resolveNoteMarkupHighlightNames({
        kind: NOTE_KIND.NOTE,
        color: NOTE_COLOR.PINK,
        anchor: { style: NOTE_MARKUP_STYLE.CALLOUT },
      }),
    ).toEqual(['hisgo-note-underline-pink']);

    expect(
      resolveNoteMarkupHighlightNames({
        kind: NOTE_KIND.SUMMARY,
        color: NOTE_COLOR.PURPLE,
        anchor: { mode: NOTE_ANCHOR_MODE.BLOCK, blockStart: 1, blockEnd: 3 },
      }),
    ).toEqual([]);
  });

  it('chuẩn hoá/khôi phục toạ độ vẽ tay (INK) và hit-test nét vẽ chính xác', () => {
    const contentBox = { left: 200, top: 100, width: 800, height: 600 };
    const blockBox = { left: 200, top: 250, width: 800, height: 100 };

    const pts = appendInkPoint([{ x: 280, y: 275 }], { x: 281, y: 275 }, 3);
    expect(pts).toHaveLength(1);
    const pts2 = appendInkPoint(pts, { x: 400, y: 300 }, 3);
    expect(pts2).toHaveLength(2);

    const normalized = normalizeInkPoints(pts2, contentBox, blockBox);
    expect(normalized).toEqual([0.1, 0.25, 0.25, 0.5]);

    const restored = denormalizeInkPoints(normalized, contentBox, blockBox);
    expect(restored).toEqual([
      { x: 280, y: 275 },
      { x: 400, y: 300 },
    ]);
    expect(buildSmoothInkPath(restored)).toMatch(/^M 280\.0 275\.0 L 400\.0 300\.0$/);

    const inkItem = {
      id: 'st-1',
      tool: NOTE_INK_TOOL.PEN,
      color: NOTE_COLOR.PINK,
      width: 3,
      pts: normalized,
    };
    expect(hitTestInkItem(inkItem, 282, 276, contentBox, blockBox)).toBe(true);
    expect(hitTestInkItem(inkItem, 600, 400, contentBox, blockBox)).toBe(false);

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
    expect(payload.kind).toBe(NOTE_KIND.NOTE);
    expect(payload.content).toBe('Nền móng');
    expect(isInkAnchor(payload.anchor)).toBe(true);
    expect(isBlockClusterAnchor(payload.anchor)).toBe(false);
    expect(formatBlockSpanLabel(payload.anchor)).toBe('Vẽ · Đoạn 3 (2 nét)');
  });

  it('clampInkCanvasBox giới hạn lớp vẽ trong [0, clientWidth] trên mọi màn hình', () => {
    const narrow = clampInkCanvasBox({ left: 72, top: 200, width: 880, height: 900 }, 1024, 120, 240, 32);
    expect(narrow.left).toBe(0);
    expect(narrow.left + narrow.width).toBeLessThanOrEqual(1024);

    const mobile = clampInkCanvasBox({ left: 16, top: 100, width: 343, height: 500 }, 375, 120, 240, 32);
    expect(mobile.left).toBe(0);
    expect(mobile.left + mobile.width).toBeLessThanOrEqual(375);

    const tiny = clampInkCanvasBox({ left: 50, top: 100, width: 10, height: 100 }, 80, 120, 240, 32);
    expect(tiny.left + tiny.width).toBeLessThanOrEqual(80);
  });

  it('mergeEffectiveBlockInkNotes & applyInkHistoryUndo xử lý optimistic + undo chính xác', () => {
    const stroke1 = { id: 's1', tool: NOTE_INK_TOOL.PEN, color: NOTE_COLOR.PINK, width: 2.5, pts: [0.1, 0.2, 0.3, 0.4] };
    const stroke2 = {
      id: 's2',
      tool: NOTE_INK_TOOL.HIGHLIGHTER,
      color: NOTE_COLOR.YELLOW,
      width: 16,
      pts: [0.2, 0.3, 0.6, 0.3],
    };
    const serverNote = baseNote({
      id: 'n-ink-0',
      anchor: { mode: NOTE_ANCHOR_MODE.INK, blockStart: 0, inkItems: [stroke1] },
    });

    const merged = mergeEffectiveBlockInkNotes([serverNote], {
      0: [stroke1, stroke2],
      4: [stroke2],
    });
    expect(merged).toHaveLength(2);
    expect(merged[0].isOptimistic).toBe(true);
    expect(merged[1].noteId).toBe(`${OPTIMISTIC_INK_NOTE_ID_PREFIX}4`);

    expect(
      applyInkHistoryUndo([stroke1, stroke2], { action: INK_HISTORY_ACTION.ADD, blockStart: 0, item: stroke2 }).map(
        (i) => i.id,
      ),
    ).toEqual(['s1']);

    expect(
      applyInkHistoryUndo([], { action: INK_HISTORY_ACTION.REMOVE, blockStart: 0, item: stroke1 }).map((i) => i.id),
    ).toEqual(['s1']);
  });

  it('resolveNoteAnchor khớp được chiến lược BLOCK, HEADING, INLINE và trả null khi thiếu dữ liệu', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<h2 id="heading-1">Chiến thắng Bạch Đằng</h2><p>Ngô Quyền đánh tan quân Nam Hán năm 938.</p>';
    document.body.appendChild(root);
    const blocks = Array.from(root.querySelectorAll('h2, p')) as HTMLElement[];
    const ctx = { root, index: buildTextIndex(root), blocks };

    const headingHit = resolveNoteAnchor(
      ctx,
      baseNote({
        anchor: { mode: NOTE_ANCHOR_MODE.HEADING, headingId: 'heading-1' },
        highlightText: 'Chiến thắng Bạch Đằng',
      }),
    );
    expect(headingHit?.mode).toBe(NOTE_ANCHOR_MODE.HEADING);

    if (headingHit) {
      expect(
        computeFreshAnchor(
          ctx,
          baseNote({ anchor: { mode: NOTE_ANCHOR_MODE.HEADING, headingId: 'heading-1' } }),
          headingHit,
        )?.headingId,
      ).toBe('heading-1');
    }

    const inlineHit = resolveNoteAnchor(
      ctx,
      baseNote({ anchor: { prefix: 'Ngô Quyền ', suffix: ' năm 938.' }, highlightText: 'đánh tan quân Nam Hán' }),
    );
    expect(inlineHit?.mode).toBe(NOTE_ANCHOR_MODE.INLINE);
    if (inlineHit) {
      const freshInline = computeFreshAnchor(
        ctx,
        baseNote({ anchor: { mode: NOTE_ANCHOR_MODE.INLINE, style: NOTE_MARKUP_STYLE.HIGHLIGHT } }),
        inlineHit,
      );
      expect(freshInline?.mode).toBe(NOTE_ANCHOR_MODE.INLINE);
      expect(freshInline?.style).toBe(NOTE_MARKUP_STYLE.HIGHLIGHT);
      expect(freshInline?.prefix).toContain('Ngô Quyền');
    }

    const blockHit = resolveNoteAnchor(
      ctx,
      baseNote({
        anchor: { mode: NOTE_ANCHOR_MODE.BLOCK, blockStart: 0, blockEnd: 1 },
        highlightText: 'Chiến thắng Bạch Đằng',
      }),
    );
    expect(blockHit?.mode).toBe(NOTE_ANCHOR_MODE.BLOCK);
    if (blockHit) {
      expect(
        computeFreshAnchor(
          ctx,
          baseNote({ anchor: { mode: NOTE_ANCHOR_MODE.BLOCK, blockStart: 0, blockEnd: 1 } }),
          blockHit,
        )?.blockEnd,
      ).toBe(1);
    }

    const inkNote = baseNote({
      anchor: { mode: NOTE_ANCHOR_MODE.INK, blockStart: 1, inkItems: [] },
      highlightText: 'Ngô Quyền đánh tan quân Nam Hán',
    });
    const inkHit = resolveNoteAnchor(ctx, inkNote);
    expect(inkHit?.mode).toBe(NOTE_ANCHOR_MODE.INK);
    if (inkHit) {
      expect(computeFreshAnchor(ctx, inkNote, inkHit)?.blockStart).toBe(1);
    }

    const missing = resolveNoteAnchor(ctx, baseNote({ anchor: null, highlightText: null }));
    expect(missing).toBeNull();

    root.remove();
  });
});
