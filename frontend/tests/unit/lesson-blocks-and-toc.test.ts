import fs from 'node:fs';
import path from 'node:path';
import { getSchema, createNodeFromContent } from '@tiptap/core';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import {
  BLOCK_CATALOG,
  CALLOUT_BOX_STYLE_OPTIONS,
  CALLOUT_EMOJI_PRESETS,
  CALLOUT_MEDIA_ALIGN_OPTIONS,
  CALLOUT_VARIANT_OPTIONS,
  LEGACY_BLOCK_TYPE_STORY_CHAPTER,
  LESSON_BLOCK_ITEMS,
  ROW_FRAME_STYLE_OPTIONS,
  getBlockLabel,
  resolveCalloutIcon,
} from '@/features/lessons/constants/lesson.constants';
import {
  BULLET_LIST_STYLE_OPTIONS,
  BlockTypographyExtension,
  InlineTypographyMark,
  LIST_NODE_TYPES,
  ListStyleType,
  ORDERED_LIST_STYLE_OPTIONS,
} from '@/features/lessons/extensions/typography.extension';
import {
  RICH_TABLE_NODE_NAMES,
  RichTableExtensionKit,
  TableActionType,
  executeTableAction,
  insertRichTable,
} from '@/features/lessons/extensions/table.extension';
import { LessonBlockRegistry } from '@/features/lessons/plugins/block-plugin.registry';
import {
  BlockPlacementRuleEngine,
  PlacementLocation,
  RowLayoutPresetRegistry,
  RowLayoutStrategy,
  migrateLegacyStoryChapterToBlocks,
} from '@/features/lessons/strategies/row-layout.strategy';
import {
  CalloutBoxStyle,
  CalloutMediaAlign,
  CalloutVariant,
  RowFrameStyle,
  RowGapSize,
  RowLayoutPresetId,
  RowVerticalAlign,
  TimelineSceneStyle,
  type RowSectionBlockData,
} from '@/features/lessons/types/block-builder.types';
import { LessonBlockType } from '@/features/lessons/types/editor.types';
import { buildLessonTocAndHtml, normalizeContentToBlocks } from '@/features/lessons/utils/lesson-toc.util';
import { sanitizeRichHtml } from '@/utils/common';

const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src');

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  BlockTypographyExtension,
  InlineTypographyMark,
  ...RichTableExtensionKit,
];

describe('Lesson blocks, Row layout, Rich Text extensions & TOC compiler', () => {
  it('RowLayoutPresetRegistry hỗ trợ đủ 6 preset và bảo toàn khối con khi đổi số cột', () => {
    const presets = RowLayoutPresetRegistry.getAll();
    expect(presets).toHaveLength(6);

    const baseRow = LessonBlockRegistry.createDefaultBlock(LessonBlockType.SECTION_ROW) as RowSectionBlockData;
    expect(baseRow.type).toBe(LessonBlockType.SECTION_ROW);
    expect(baseRow.columnCount).toBe(2);
    expect(RowLayoutPresetRegistry.detectMatchingPreset(baseRow)).toBe(RowLayoutPresetId.SYMMETRIC_6_6);

    const magRow = RowLayoutPresetRegistry.applyPreset(baseRow, RowLayoutPresetId.MAGAZINE_4_8);
    expect(magRow.columns.map((c) => c.widthPercent)).toEqual([33.33, 66.67]);
    expect(magRow.showColumnDivider).toBe(true);

    const threeColRow = RowLayoutPresetRegistry.applyPreset(magRow, RowLayoutPresetId.THREE_COLUMNS);
    expect(threeColRow.columnCount).toBe(3);

    const singleColRow = RowLayoutPresetRegistry.applyPreset(threeColRow, RowLayoutPresetId.SINGLE_COLUMN);
    expect(singleColRow.columns[0].blocks).toHaveLength(2);
    expect(RowLayoutPresetRegistry.detectMatchingPreset(singleColRow)).toBe(RowLayoutPresetId.SINGLE_COLUMN);

    const featureRow = RowLayoutPresetRegistry.applyPreset(singleColRow, RowLayoutPresetId.THREE_COL_FEATURE);
    expect(featureRow.showColumnDivider).toBe(true);

    const mediaLeadRow = RowLayoutPresetRegistry.applyPreset(featureRow, RowLayoutPresetId.MEDIA_LEAD_7_5);
    expect(mediaLeadRow.columns.map((c) => c.widthPercent)).toEqual([60, 40]);
  });

  it('RowLayoutStrategy tính snap, grid template và biên dịch HTML khung dòng đầy đủ', () => {
    expect(RowLayoutStrategy.computeTwoColumnSnap(12)).toEqual([20, 80]);
    expect(RowLayoutStrategy.computeTwoColumnSnap(67)).toEqual([65, 35]);

    const row: RowSectionBlockData = {
      id: 'row_test',
      type: LessonBlockType.SECTION_ROW,
      columnCount: 2,
      gapSize: RowGapSize.LG,
      verticalAlign: RowVerticalAlign.CENTER,
      showColumnDivider: true,
      layoutPreset: RowLayoutPresetId.MAGAZINE_4_8,
      columns: [
        { id: 'c1', widthPercent: 33.33, blocks: [{ id: 't1', type: LessonBlockType.TEXT, content: '<p>Dẫn nhập</p>' }] },
        { id: 'c2', widthPercent: 66.67, blocks: [{ id: 't2', type: LessonBlockType.TEXT, content: '<p>Nội dung</p>' }] },
      ],
    };

    expect(RowLayoutStrategy.getGridTemplateColumns(row.columns)).toBe(
      'minmax(0, 33.33fr) minmax(0, 66.67fr)',
    );
    const html = RowLayoutStrategy.compileRowToHtml(row, (b) => LessonBlockRegistry.blockToHtml(b));
    expect(html).toContain('data-preset="MAGAZINE_4_8"');
    expect(html).not.toContain('hisgo-row-frame-icon');

    const framedHtml = RowLayoutStrategy.compileRowToHtml(
      { ...row, frameStyle: RowFrameStyle.OUTLINED, frameIcon: '📖' },
      (b) => LessonBlockRegistry.blockToHtml(b),
    );
    expect(framedHtml).toContain('hisgo-row-container--outlined');
    expect(framedHtml).toContain('hisgo-row-frame-icon');
  });

  it('BLOCK_CATALOG, Callout & Block Plugins xuất semantic HTML sạch và lọc XSS URI', () => {
    const allTypes = Object.values(LessonBlockType);
    expect(Object.keys(BLOCK_CATALOG)).toHaveLength(allTypes.length);
    for (const blockType of allTypes) {
      expect(getBlockLabel(blockType)).not.toBe('Khối nội dung');
    }

    expect(CALLOUT_VARIANT_OPTIONS).toHaveLength(Object.values(CalloutVariant).length);
    expect(CALLOUT_BOX_STYLE_OPTIONS).toHaveLength(Object.values(CalloutBoxStyle).length);
    expect(CALLOUT_MEDIA_ALIGN_OPTIONS).toHaveLength(Object.values(CalloutMediaAlign).length);
    expect(ROW_FRAME_STYLE_OPTIONS).toHaveLength(Object.values(RowFrameStyle).length);
    expect(CALLOUT_EMOJI_PRESETS.length).toBeGreaterThanOrEqual(8);

    expect(resolveCalloutIcon({ variant: CalloutVariant.INFO })).toBe('💡');
    expect(resolveCalloutIcon({ variant: CalloutVariant.INFO, icon: '' })).toBe('');
    expect(resolveCalloutIcon({ variant: CalloutVariant.WARNING, icon: '⚔️' })).toBe('⚔️');

    const unsafeMediaHtml = LessonBlockRegistry.blockToHtml({
      id: 'cal_unsafe',
      type: LessonBlockType.CALLOUT,
      variant: CalloutVariant.NEUTRAL,
      boxStyle: CalloutBoxStyle.OUTLINED,
      title: '',
      content: '<p>Test XSS</p><script>alert(1)</script>',
      media: { src: 'javascript:alert(1)', align: CalloutMediaAlign.LEFT },
    });
    expect(unsafeMediaHtml).toContain('src="#"');
    expect(unsafeMediaHtml).not.toContain('javascript:');
    expect(unsafeMediaHtml).not.toContain('<script>');

    for (const sceneStyle of Object.values(TimelineSceneStyle)) {
      const tl = LessonBlockRegistry.blockToHtml({
        id: `tl_${sceneStyle}`,
        type: LessonBlockType.TIMELINE,
        title: 'Dòng thời gian',
        subtitle: 'Tóm tắt',
        displayConfig: { sceneStyle, showImage: true },
        nodes: [{ id: 'n1', year: '1954', title: 'Mốc', description: 'Mô tả' }],
      });
      expect(tl).toContain('hisgo-timeline-block');
    }
  });

  it('BlockPlacementRuleEngine chặn lồng SECTION_ROW và giới hạn chiều rộng cột tối thiểu', () => {
    expect(
      BlockPlacementRuleEngine.validate(LessonBlockType.SECTION_ROW, {
        location: PlacementLocation.COLUMN,
        columnWidthPercent: 50,
      }).allowed,
    ).toBe(false);
    expect(
      BlockPlacementRuleEngine.validate(LessonBlockType.TIMELINE, {
        location: PlacementLocation.COLUMN,
        columnWidthPercent: 40,
      }).allowed,
    ).toBe(false);
    expect(
      BlockPlacementRuleEngine.validate(LessonBlockType.TIMELINE, {
        location: PlacementLocation.COLUMN,
        columnWidthPercent: 50,
      }).allowed,
    ).toBe(true);
  });

  it('normalizeContentToBlocks & buildLessonTocAndHtml xử lý JSON chuỗi, bảng cũ, chú thích & STORY_CHAPTER cũ', () => {
    expect('STORY_CHAPTER' in LessonBlockType).toBe(false);
    expect(
      LESSON_BLOCK_ITEMS.some((item) => String(item.type) === LEGACY_BLOCK_TYPE_STORY_CHAPTER),
    ).toBe(false);

    const migrated = migrateLegacyStoryChapterToBlocks({
      id: 'story_flat',
      type: LEGACY_BLOCK_TYPE_STORY_CHAPTER,
      title: 'Trận Bạch Đằng 938',
      leadText: '<p>Ngô Quyền bày trận cọc ngầm.</p>',
      contentHtml: '<p>Thủy triều rút.</p>',
    });
    expect(migrated[0].type).toBe(LessonBlockType.HEADING);
    expect(migrated[1].type).toBe(LessonBlockType.SECTION_ROW);

    const { blocks, resourceLinks } = normalizeContentToBlocks(
      JSON.stringify([
        { id: 'h1', type: 'HEADING', level: 2, text: 'Bối cảnh<sup data-footnote="1">[1]</sup>' },
        { id: 'tb1', type: 'TABLE', title: 'Bảng cũ', colAName: 'A', colBName: 'B', rows: [] },
        { id: 'rl1', type: LessonBlockType.RESOURCE_LINK, title: 'Đọc thêm', url: '/bai-viet/tran-hung-dao' },
      ]),
    );
    expect(resourceLinks).toHaveLength(1);
    expect(blocks[1].type).toBe(LessonBlockType.COMPARISON_TABLE);

    const { tocItems, html } = buildLessonTocAndHtml(blocks);
    expect(tocItems.map((t) => t.text)).toEqual(['Bối cảnh', 'Bảng cũ']);
    expect(html).toContain('id="heading-1"');
    expect(html).toContain('id="block-anchor-1"');

    // Fallback chuỗi HTML thuần khi parse JSON lỗi
    const plainFallback = normalizeContentToBlocks('<p>Văn bản thuần</p>');
    expect(plainFallback.blocks[0].type).toBe(LessonBlockType.TEXT);
    expect(normalizeContentToBlocks(null).blocks).toEqual([]);
  });

  it('TipTap RichTable & BlockTypography extensions thao tác thêm/xóa hàng cột trên ProseMirror EditorState', () => {
    expect(BULLET_LIST_STYLE_OPTIONS).toHaveLength(3);
    expect(ORDERED_LIST_STYLE_OPTIONS).toHaveLength(3);

    const schema = getSchema(extensions);
    expect(schema.nodes[LIST_NODE_TYPES.BULLET].spec.attrs?.listStyleType).toBeTruthy();
    expect(schema.nodes[RICH_TABLE_NODE_NAMES.TABLE].spec.tableRole).toBe('table');

    expect(insertRichTable(null)).toBe(false);
    expect(executeTableAction(null, TableActionType.ADD_ROW_AFTER)).toBe(false);

    const captured: { content?: Record<string, unknown> } = {};
    const mockEditor = {
      chain: () => ({
        focus: () => ({
          insertContent: (content: Record<string, unknown>) => {
            captured.content = content;
            return { run: () => true };
          },
        }),
      }),
    } as unknown as Parameters<typeof insertRichTable>[0];

    expect(insertRichTable(mockEditor, { rows: 3, cols: 3, withHeaderRow: true })).toBe(true);
    expect(captured.content).toBeDefined();
    const docNode = createNodeFromContent(
      { type: 'doc', content: [captured.content ?? {}] },
      schema,
    );
    let state = EditorState.create({
      doc: docNode as NonNullable<Parameters<typeof EditorState.create>[0]['doc']>,
    });
    state = state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(4))));

    const liveEditor = {
      get state() {
        return state;
      },
      commands: { focus: () => true },
      view: {
        dispatch: (tr: Parameters<typeof state.apply>[0]) => {
          state = state.apply(tr);
        },
      },
    } as unknown as Parameters<typeof executeTableAction>[0];

    expect(executeTableAction(liveEditor, TableActionType.ADD_ROW_AFTER)).toBe(true);
    expect(state.doc.firstChild?.childCount).toBe(4);
    expect(executeTableAction(liveEditor, TableActionType.ADD_COL_AFTER)).toBe(true);
    expect(executeTableAction(liveEditor, TableActionType.DELETE_ROW)).toBe(true);
    expect(executeTableAction(liveEditor, TableActionType.DELETE_COL)).toBe(true);
    expect(executeTableAction(liveEditor, TableActionType.DELETE_TABLE)).toBe(true);

    const sanitizedList = sanitizeRichHtml(
      `<ul data-list-style="${ListStyleType.SQUARE}"><li><p>Mục 1</p></li></ul>`,
    );
    expect(sanitizedList).toContain('data-list-style="square"');
    expect(fs.existsSync(path.join(SRC_ROOT, 'features/lessons/styles/lesson-blocks.css'))).toBe(true);
  });
});
