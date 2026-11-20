import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src');

const LOADER_HOOK_SOURCE = `
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(${JSON.stringify(path.join(FRONTEND_ROOT, 'package.json'))});
const ts = require(${JSON.stringify(path.join(FRONTEND_ROOT, 'node_modules/typescript/lib/typescript.js'))});
const SRC_ROOT = ${JSON.stringify(SRC_ROOT)};
const EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs'];

function resolveWithExtension(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return pathToFileURL(basePath).href;
  }
  for (const ext of EXTENSIONS) {
    const candidate = basePath + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  for (const ext of EXTENSIONS) {
    const indexCandidate = path.join(basePath, 'index' + ext);
    if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
      return pathToFileURL(indexCandidate).href;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const target = path.join(SRC_ROOT, specifier.slice(2));
    const resolvedUrl = resolveWithExtension(target);
    if (resolvedUrl) {
      return { url: resolvedUrl, shortCircuit: true };
    }
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const target = path.resolve(parentDir, specifier);
    const resolvedUrl = resolveWithExtension(target);
    if (resolvedUrl) {
      return { url: resolvedUrl, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && (url.endsWith('.ts') || url.endsWith('.tsx'))) {
    const filePath = fileURLToPath(url);
    const source = fs.readFileSync(filePath, 'utf8');
    const transpiled = ts.transpileModule(source, {
      fileName: filePath,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    return { format: 'module', shortCircuit: true, source: transpiled.outputText };
  }
  return nextLoad(url, context);
}
`;

register(`data:text/javascript;base64,${Buffer.from(LOADER_HOOK_SOURCE, 'utf8').toString('base64')}`);

const { LessonBlockType } = await import('../src/features/lessons/types/editor.types.ts');
const { RowGapSize, RowLayoutPresetId, RowVerticalAlign } = await import(
  '../src/features/lessons/types/block-builder.types.ts'
);
const { LEGACY_BLOCK_TYPE_STORY_CHAPTER, LESSON_BLOCK_ITEMS } = await import(
  '../src/features/lessons/constants/lesson.constants.ts'
);
const {
  RowLayoutStrategy,
  RowLayoutPresetRegistry,
  BlockPlacementRuleEngine,
  PlacementLocation,
  migrateLegacyStoryChapterToBlocks,
} = await import('../src/features/lessons/strategies/row-layout.strategy.ts');
const { LessonBlockRegistry } = await import('../src/features/lessons/plugins/block-plugin.registry.ts');
const { buildLessonTocAndHtml, normalizeContentToBlocks } = await import(
  '../src/features/lessons/utils/lesson-toc.util.ts'
);

test('RowLayoutPresetRegistry hỗ trợ đủ 6 preset và bảo toàn khối con khi đổi số cột', () => {
  const presets = RowLayoutPresetRegistry.getAll();
  assert.equal(presets.length, 6);

  const baseRow = LessonBlockRegistry.createDefaultBlock(LessonBlockType.SECTION_ROW);
  assert.equal(baseRow.type, LessonBlockType.SECTION_ROW);
  assert.equal(baseRow.columnCount, 2);
  assert.equal(RowLayoutPresetRegistry.detectMatchingPreset(baseRow), RowLayoutPresetId.SYMMETRIC_6_6);

  const magRow = RowLayoutPresetRegistry.applyPreset(baseRow, RowLayoutPresetId.MAGAZINE_4_8);
  assert.equal(magRow.columnCount, 2);
  assert.deepEqual(
    magRow.columns.map((c) => c.widthPercent),
    [33.33, 66.67]
  );
  assert.equal(magRow.gapSize, RowGapSize.LG);
  assert.equal(magRow.showColumnDivider, true);
  assert.equal(RowLayoutPresetRegistry.detectMatchingPreset(magRow), RowLayoutPresetId.MAGAZINE_4_8);

  // Chuyển sang 3 cột rồi gộp về 1 cột phải giữ nguyên toàn bộ khối con
  const threeColRow = RowLayoutPresetRegistry.applyPreset(magRow, RowLayoutPresetId.THREE_COLUMNS);
  assert.equal(threeColRow.columnCount, 3);
  assert.equal(threeColRow.columns[0].blocks.length, 1);
  assert.equal(threeColRow.columns[1].blocks.length, 1);
  assert.equal(threeColRow.columns[2].blocks.length, 0);

  const singleColRow = RowLayoutPresetRegistry.applyPreset(threeColRow, RowLayoutPresetId.SINGLE_COLUMN);
  assert.equal(singleColRow.columnCount, 1);
  assert.equal(singleColRow.columns[0].blocks.length, 2);
  assert.equal(RowLayoutPresetRegistry.detectMatchingPreset(singleColRow), RowLayoutPresetId.SINGLE_COLUMN);

  const featureRow = RowLayoutPresetRegistry.applyPreset(singleColRow, RowLayoutPresetId.THREE_COL_FEATURE);
  assert.equal(featureRow.columnCount, 3);
  assert.equal(featureRow.showColumnDivider, true);
  assert.equal(RowLayoutPresetRegistry.detectMatchingPreset(featureRow), RowLayoutPresetId.THREE_COL_FEATURE);

  const mediaLeadRow = RowLayoutPresetRegistry.applyPreset(featureRow, RowLayoutPresetId.MEDIA_LEAD_7_5);
  assert.equal(mediaLeadRow.columnCount, 2);
  assert.deepEqual(
    mediaLeadRow.columns.map((c) => c.widthPercent),
    [60, 40]
  );
  assert.equal(RowLayoutPresetRegistry.detectMatchingPreset(mediaLeadRow), RowLayoutPresetId.MEDIA_LEAD_7_5);
});

test('RowLayoutStrategy tính snap, grid minmax(0, ...fr) và compileRowToHtml đủ thuộc tính', () => {
  assert.deepEqual(RowLayoutStrategy.computeTwoColumnSnap(12), [20, 80]);
  assert.deepEqual(RowLayoutStrategy.computeTwoColumnSnap(67), [65, 35]);

  const row = {
    id: 'row_test',
    type: LessonBlockType.SECTION_ROW,
    columnCount: 2,
    gapSize: RowGapSize.LG,
    verticalAlign: RowVerticalAlign.CENTER,
    showColumnDivider: true,
    layoutPreset: RowLayoutPresetId.MAGAZINE_4_8,
    columns: [
      {
        id: 'c1',
        widthPercent: 33.33,
        blocks: [{ id: 't1', type: LessonBlockType.TEXT, content: '<p>Dẫn nhập</p>' }],
      },
      {
        id: 'c2',
        widthPercent: 66.67,
        blocks: [{ id: 't2', type: LessonBlockType.TEXT, content: '<p>Nội dung chính</p>' }],
      },
    ],
  };

  assert.equal(RowLayoutStrategy.getGridTemplateColumns(row.columns), 'minmax(0, 33.33fr) minmax(0, 66.67fr)');
  const html = RowLayoutStrategy.compileRowToHtml(row, (b) => LessonBlockRegistry.blockToHtml(b));
  assert.match(html, /gap-7/);
  assert.match(html, /items-center/);
  assert.match(html, /md:border-l/);
  assert.match(html, /data-columns="2"/);
  assert.match(html, /data-column-widths="33,67"/);
  assert.match(html, /data-gap="LG"/);
  assert.match(html, /data-preset="MAGAZINE_4_8"/);
});

test('BlockPlacementRuleEngine giữ nguyên toàn bộ luật lồng khối và giới hạn độ rộng cột', () => {
  assert.equal(
    BlockPlacementRuleEngine.validate(LessonBlockType.SECTION_ROW, {
      location: PlacementLocation.COLUMN,
      columnWidthPercent: 50,
    }).allowed,
    false
  );
  assert.equal(
    BlockPlacementRuleEngine.validate(LessonBlockType.QUIZ, {
      location: PlacementLocation.COLUMN,
      columnWidthPercent: 67,
    }).allowed,
    false
  );
  assert.equal(
    BlockPlacementRuleEngine.validate(LessonBlockType.TIMELINE, {
      location: PlacementLocation.COLUMN,
      columnWidthPercent: 40,
    }).allowed,
    false
  );
  assert.equal(
    BlockPlacementRuleEngine.validate(LessonBlockType.TIMELINE, {
      location: PlacementLocation.COLUMN,
      columnWidthPercent: 50,
    }).allowed,
    true
  );
  assert.equal(
    BlockPlacementRuleEngine.validate(LessonBlockType.COMPARISON_TABLE, {
      location: PlacementLocation.COLUMN,
      columnWidthPercent: 33,
    }).allowed,
    false
  );
  assert.equal(
    BlockPlacementRuleEngine.validate(LessonBlockType.COMPARISON_TABLE, {
      location: PlacementLocation.COLUMN,
      columnWidthPercent: 50,
    }).allowed,
    true
  );
});

test('migrateLegacyStoryChapterToBlocks chuyển đổi chuẩn cả dạng chapters[] lẫn dạng phẳng cũ', () => {
  const structuredLegacy = {
    id: 'story_1',
    type: LEGACY_BLOCK_TYPE_STORY_CHAPTER,
    chapters: [
      {
        id: 'ch2',
        order: 2,
        title: 'Chiến thắng quyết định',
        config: { layout: { columnRatio: '8_4' } },
        blocks: [
          { id: 'b3', type: 'TEXT', zone: 'LEFT', content: '<p>Diễn biến chính</p>' },
          { id: 'b4', type: 'IMAGE', zone: 'RIGHT', src: '/uploads/test-a.jpg', alt: 'Ảnh A' },
        ],
      },
      {
        id: 'ch1',
        order: 1,
        title: 'Bối cảnh mở đầu',
        config: { layout: { columnRatio: '4_8' } },
        blocks: [
          { id: 'full1', type: 'CALLOUT', zone: 'FULL', variant: 'INFO', title: 'Bối cảnh', content: 'Ghi chú toàn hàng' },
          { id: 'b1', type: 'TEXT', zone: 'LEFT', content: '<p>Dẫn nhập trái</p>' },
          { id: 'b2', type: 'TEXT', zone: 'RIGHT', content: '<p>Nội dung phải</p>' },
        ],
      },
    ],
  };

  const migratedChapters = migrateLegacyStoryChapterToBlocks(structuredLegacy);
  assert.equal(migratedChapters[0].type, LessonBlockType.HEADING);
  assert.equal(migratedChapters[0].text, 'Bối cảnh mở đầu');
  assert.equal(migratedChapters[1].type, LessonBlockType.CALLOUT);
  assert.equal(migratedChapters[2].type, LessonBlockType.SECTION_ROW);
  assert.deepEqual(
    migratedChapters[2].columns.map((c) => c.widthPercent),
    [33.33, 66.67]
  );
  assert.equal(migratedChapters[2].showColumnDivider, true);
  assert.equal('zone' in migratedChapters[2].columns[0].blocks[0], false);

  assert.equal(migratedChapters[3].type, LessonBlockType.HEADING);
  assert.equal(migratedChapters[3].text, 'Chiến thắng quyết định');
  assert.equal(migratedChapters[4].type, LessonBlockType.SECTION_ROW);
  assert.deepEqual(
    migratedChapters[4].columns.map((c) => c.widthPercent),
    [66.67, 33.33]
  );

  const flatLegacy = {
    id: 'story_flat',
    type: LEGACY_BLOCK_TYPE_STORY_CHAPTER,
    title: 'Trận Bạch Đằng 938',
    leadText: '<p>Ngô Quyền bày trận cọc ngầm.</p>',
    pullQuoteText: 'Không để một mảnh giáp trở về',
    pullQuoteAuthor: 'Sử cũ',
    contentHtml: '<p>Thủy triều rút làm thuyền địch mắc cạn.</p>',
    imageUrl: '/uploads/bach-dang.jpg',
    imageCaption: 'Bãi cọc Bạch Đằng',
    nestedBlocks: [{ id: 'n1', type: 'DIVIDER' }],
  };

  const migratedFlat = migrateLegacyStoryChapterToBlocks(flatLegacy);
  assert.equal(migratedFlat[0].type, LessonBlockType.HEADING);
  assert.equal(migratedFlat[0].text, 'Trận Bạch Đằng 938');
  assert.equal(migratedFlat[1].type, LessonBlockType.SECTION_ROW);
  assert.equal(migratedFlat[1].columns[0].blocks.length, 2);
  assert.equal(migratedFlat[1].columns[1].blocks.length, 2);
  assert.equal(migratedFlat[2].type, LessonBlockType.DIVIDER);
});

test('LessonBlockType/Palette đã bỏ STORY_CHAPTER và TOC/Registry đọc & biên dịch được dữ liệu cũ', () => {
  assert.equal('STORY_CHAPTER' in LessonBlockType, false);
  assert.equal(
    LESSON_BLOCK_ITEMS.some((item) => String(item.type) === LEGACY_BLOCK_TYPE_STORY_CHAPTER),
    false
  );

  const rawContent = [
    {
      id: 'legacy_1',
      type: LEGACY_BLOCK_TYPE_STORY_CHAPTER,
      title: 'Khởi nghĩa Lam Sơn',
      leadText: '<p>Lê Lợi dựng cờ khởi nghĩa.</p>',
      contentHtml: '<p>Kháng chiến kéo dài 10 năm.</p>',
    },
  ];

  const { blocks } = normalizeContentToBlocks(rawContent);
  assert.equal(blocks[0].type, LessonBlockType.HEADING);
  assert.equal(blocks[1].type, LessonBlockType.SECTION_ROW);

  const { tocItems, html } = buildLessonTocAndHtml(blocks);
  assert.equal(tocItems.length, 1);
  assert.equal(tocItems[0].text, 'Khởi nghĩa Lam Sơn');
  assert.match(html, /Khởi nghĩa Lam Sơn/);
  assert.match(html, /hisgo-row-section/);
  assert.match(html, /Lê Lợi dựng cờ khởi nghĩa/);

  const registryFallbackHtml = LessonBlockRegistry.blockToHtml(rawContent[0]);
  assert.match(registryFallbackHtml, /Khởi nghĩa Lam Sơn/);
  assert.match(registryFallbackHtml, /hisgo-row-section/);
});

test('Kiểm tra tĩnh: toàn bộ 17 file STORY_CHAPTER cũ đã bị xóa và không còn tham chiếu chết', () => {
  const deletedPaths = [
    'src/constants/lesson-builder.constant.ts',
    'src/features/lessons/components/builder/StoryChapterBlockEditor.tsx',
    'src/features/lessons/components/builder/story-chapter',
    'src/features/lessons/components/builder/inspectors/StoryChapterBlockInspector.tsx',
    'src/features/lessons/components/builder/inspectors/StoryChapterLayoutPanels.tsx',
    'src/features/lessons/components/builder/inspectors/StoryChapterStylePanels.tsx',
    'src/features/lessons/components/builder/inspectors/StorySubElementInspector.tsx',
    'src/features/lessons/components/builder/inspectors/StorySubElementMediaPanels.tsx',
    'src/features/lessons/components/builder/inspectors/StorySubElementTextPanels.tsx',
    'src/features/lessons/components/builder/inspectors/useStorySubElementInspector.ts',
    'src/features/lessons/strategies/story-chapter-layout.strategy.ts',
    'src/features/lessons/strategies/story-chapter-layout.constants.ts',
    'src/features/lessons/plugins/story-chapter-block.plugin.ts',
  ];

  for (const rel of deletedPaths) {
    assert.equal(fs.existsSync(path.join(FRONTEND_ROOT, rel)), false, `${rel} phải được xóa`);
  }
});
