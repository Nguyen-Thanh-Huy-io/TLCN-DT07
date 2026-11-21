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
const {
  CalloutBoxStyle,
  CalloutMediaAlign,
  CalloutVariant,
  RowFrameStyle,
  RowGapSize,
  RowLayoutPresetId,
  RowVerticalAlign,
  TimelineSceneStyle,
} = await import('../src/features/lessons/types/block-builder.types.ts');
const {
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
} = await import('../src/features/lessons/constants/lesson.constants.ts');
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
  assert.match(html, /class="hisgo-row-container my-6"/);
  assert.match(html, /class="hisgo-row-section w-full/);
  assert.match(html, /gap-7/);
  assert.match(html, /items-center/);
  assert.match(html, /md:border-l/);
  assert.match(html, /data-columns="2"/);
  assert.match(html, /data-column-widths="33,67"/);
  assert.match(html, /data-gap="LG"/);
  assert.match(html, /data-preset="MAGAZINE_4_8"/);
  assert.doesNotMatch(html, /hisgo-row-frame-icon/);

  const framedHtml = RowLayoutStrategy.compileRowToHtml(
    { ...row, frameStyle: RowFrameStyle.OUTLINED, frameIcon: '📖' },
    (b) => LessonBlockRegistry.blockToHtml(b)
  );
  assert.match(framedHtml, /class="hisgo-row-container hisgo-row-container--outlined my-6"/);
  assert.match(framedHtml, /<span class="hisgo-row-frame-icon" aria-hidden="true">📖<\/span>/);

  const unframedHtml = RowLayoutStrategy.compileRowToHtml(
    { ...row, frameStyle: RowFrameStyle.NONE, frameIcon: '📖' },
    (b) => LessonBlockRegistry.blockToHtml(b)
  );
  assert.doesNotMatch(unframedHtml, /hisgo-row-frame-icon/);
  assert.doesNotMatch(unframedHtml, /hisgo-row-container--outlined/);
});

test('characterBlockPlugin tách header & body và lesson-blocks.css được nạp qua globals.css với đầy đủ @container', () => {
  const charHtml = LessonBlockRegistry.blockToHtml({
    id: 'char_1',
    type: LessonBlockType.CHARACTER,
    name: 'Đại tướng Võ Nguyên Giáp',
    years: '1911 – 2013',
    summary: 'Tổng Tư lệnh Quân đội nhân dân Việt Nam.',
  });
  assert.match(charHtml, /class="hisgo-character-block\b/);
  assert.match(charHtml, /class="hisgo-character-header"/);
  assert.match(charHtml, /class="hisgo-character-meta"/);
  assert.match(charHtml, /class="hisgo-character-body"/);
  assert.doesNotMatch(charHtml, /\sstyle="/);

  const globalsCss = fs.readFileSync(path.join(SRC_ROOT, 'app/globals.css'), 'utf8');
  assert.match(globalsCss, /@import\s+["']\.\.\/features\/lessons\/styles\/lesson-blocks\.css["']/);

  const blocksCss = fs.readFileSync(path.join(SRC_ROOT, 'features/lessons/styles/lesson-blocks.css'), 'utf8');
  assert.match(blocksCss, /@container\s+hisgo-row\s*\(max-width:\s*720px\)/);
  assert.match(blocksCss, /@container\s+hisgo-row\s*\(max-width:\s*540px\)/);
  assert.match(blocksCss, /@container\s+hisgo-col\s*\(max-width:\s*320px\)/);
  assert.match(blocksCss, /@container\s+hisgo-card\s*\(max-width:\s*250px\)/);
  assert.match(blocksCss, /\.hisgo-column\s*\{[\s\S]*?overflow-wrap:\s*break-word/);
  assert.match(blocksCss, /\.hisgo-column\s+table\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(blocksCss, /\.hisgo-callout\s*\{/);
  assert.match(blocksCss, /\.hisgo-callout--neutral\s*\{/);
  assert.match(blocksCss, /\.hisgo-callout--header-bar\s*\{/);
  assert.match(blocksCss, /\.hisgo-callout--outlined\s*\{/);
  assert.match(blocksCss, /\.hisgo-callout-media--right\s*\{/);
  assert.match(blocksCss, /@container\s+hisgo-callout\s*\(max-width:\s*440px\)/);
  assert.match(blocksCss, /\.hisgo-callout--compact\s*\{/);
  assert.match(blocksCss, /\.hisgo-callout--collapsible\s*>\s*\.hisgo-callout-summary/);
  assert.match(blocksCss, /\.hisgo-row-container--outlined\s*\{/);
  assert.match(blocksCss, /\.hisgo-row-container--tinted\s*\{/);
  assert.match(blocksCss, /\.hisgo-timeline-block\s*\{/);
});

test('BLOCK_CATALOG & CALLOUT_VARIANT_OPTIONS đầy đủ và các Block Plugin xuất semantic HTML sạch', () => {
  const allTypes = Object.values(LessonBlockType);
  assert.equal(Object.keys(BLOCK_CATALOG).length, allTypes.length);
  for (const blockType of allTypes) {
    assert.ok(BLOCK_CATALOG[blockType], `Thiếu entry BLOCK_CATALOG cho ${blockType}`);
    const label = getBlockLabel(blockType);
    assert.notEqual(label, 'Khối nội dung', `Nhãn cho ${blockType} không được rơi về fallback`);
  }

  const allVariants = Object.values(CalloutVariant);
  assert.equal(CALLOUT_VARIANT_OPTIONS.length, allVariants.length);
  for (const variant of allVariants) {
    assert.ok(
      CALLOUT_VARIANT_OPTIONS.some((opt) => opt.variant === variant),
      `Thiếu CALLOUT_VARIANT_OPTIONS cho ${variant}`
    );
  }
  assert.equal(CALLOUT_BOX_STYLE_OPTIONS.length, Object.values(CalloutBoxStyle).length);
  assert.equal(CALLOUT_MEDIA_ALIGN_OPTIONS.length, Object.values(CalloutMediaAlign).length);
  assert.equal(ROW_FRAME_STYLE_OPTIONS.length, Object.values(RowFrameStyle).length);
  assert.ok(CALLOUT_EMOJI_PRESETS.length >= 8);

  // resolveCalloutIcon hỗ trợ: mặc định theo variant, ẩn (""), và icon tùy chỉnh độc lập với màu
  assert.equal(resolveCalloutIcon({ variant: CalloutVariant.INFO }), '💡');
  assert.equal(resolveCalloutIcon({ variant: CalloutVariant.INFO, icon: '' }), '');
  assert.equal(resolveCalloutIcon({ variant: CalloutVariant.WARNING, icon: '⚔️' }), '⚔️');

  // 1. Có tiêu đề + icon tùy chỉnh + plain text nhiều dòng
  const calloutHtml = LessonBlockRegistry.blockToHtml({
    id: 'cal_1',
    type: LessonBlockType.CALLOUT,
    variant: CalloutVariant.INFO,
    icon: '⚔️',
    title: 'Lưu ý',
    content: 'Dòng một\nDòng hai',
  });
  assert.match(calloutHtml, /class="hisgo-callout hisgo-callout--info"/);
  assert.match(calloutHtml, /<span class="hisgo-callout-icon" aria-hidden="true">⚔️<\/span>/);
  assert.match(calloutHtml, /Dòng một<br \/>Dòng hai/);
  assert.doesNotMatch(calloutHtml, /\sstyle="/);

  // 2. Không tiêu đề -> compact Notion-style, không tự chèn tiêu đề giả
  const compactCalloutHtml = LessonBlockRegistry.blockToHtml({
    id: 'cal_2',
    type: LessonBlockType.CALLOUT,
    variant: CalloutVariant.NEUTRAL,
    title: '',
    content: 'Chỉ có nội dung ngắn',
  });
  assert.match(compactCalloutHtml, /class="hisgo-callout hisgo-callout--compact hisgo-callout--neutral"/);
  assert.doesNotMatch(compactCalloutHtml, /hisgo-callout-title/);
  assert.doesNotMatch(compactCalloutHtml, /\sstyle="/);

  // 3. Ẩn icon -> không xuất span icon
  const hiddenIconHtml = LessonBlockRegistry.blockToHtml({
    id: 'cal_3',
    type: LessonBlockType.CALLOUT,
    variant: CalloutVariant.HISTORICAL_NOTE,
    icon: '',
    title: 'Ghi chú gọn',
    content: 'Không biểu tượng',
  });
  assert.doesNotMatch(hiddenIconHtml, /hisgo-callout-icon/);
  assert.doesNotMatch(hiddenIconHtml, /\sstyle="/);

  // 4. Rich HTML -> giữ thẻ hợp lệ & lọc XSS script
  const richCalloutHtml = LessonBlockRegistry.blockToHtml({
    id: 'cal_4',
    type: LessonBlockType.CALLOUT,
    variant: CalloutVariant.SUCCESS,
    title: 'Tham khảo',
    content: '<p><strong>Đậm</strong> và <a href="/bai-viet/tran-thu-do">Trần Thủ Độ</a></p><script>alert(1)</script>',
  });
  assert.match(richCalloutHtml, /<strong>Đậm<\/strong>/);
  assert.match(richCalloutHtml, /href="\/bai-viet\/tran-thu-do"/);
  assert.doesNotMatch(richCalloutHtml, /<script>/);
  assert.doesNotMatch(richCalloutHtml, /\sstyle="/);

  // 5. Chế độ thu gọn (collapsible) -> details/summary
  const collapsibleHtml = LessonBlockRegistry.blockToHtml({
    id: 'cal_5',
    type: LessonBlockType.CALLOUT,
    variant: CalloutVariant.WARNING,
    collapsible: true,
    title: 'Xem giải thích chi tiết',
    content: '<p>Nội dung bên trong</p>',
  });
  assert.match(collapsibleHtml, /<details class="hisgo-callout hisgo-callout--collapsible hisgo-callout--warning">/);
  assert.match(collapsibleHtml, /<summary class="hisgo-callout-summary">/);
  assert.doesNotMatch(collapsibleHtml, /\sstyle="/);

  // 6. Kiểu HEADER_BAR (Em có biết?)
  const headerBarHtml = LessonBlockRegistry.blockToHtml({
    id: 'cal_6',
    type: LessonBlockType.CALLOUT,
    variant: CalloutVariant.INFO,
    boxStyle: CalloutBoxStyle.HEADER_BAR,
    title: 'EM CÓ BIẾT?',
    content: '<p>Phương pháp lò cao...</p>',
  });
  assert.match(headerBarHtml, /class="hisgo-callout hisgo-callout--info hisgo-callout--header-bar"/);
  assert.match(headerBarHtml, />EM CÓ BIẾT\?</);
  assert.doesNotMatch(headerBarHtml, /\sstyle="/);

  // 7. Kiểu OUTLINED + Ảnh nổi bên phải kèm chú thích + chặn URI nguy hiểm
  const outlinedMediaHtml = LessonBlockRegistry.blockToHtml({
    id: 'cal_7',
    type: LessonBlockType.CALLOUT,
    variant: CalloutVariant.NEUTRAL,
    boxStyle: CalloutBoxStyle.OUTLINED,
    title: '',
    content: '<p>Từ năm 1896 đến nay...</p>',
    media: {
      src: 'https://example.com/olympic.jpg',
      align: CalloutMediaAlign.RIGHT,
      caption: 'Hình 1. Bảo tàng Ô-lim-píc Nhật Bản',
    },
  });
  assert.match(outlinedMediaHtml, /class="hisgo-callout hisgo-callout--compact hisgo-callout--neutral hisgo-callout--outlined"/);
  assert.match(outlinedMediaHtml, /class="hisgo-callout-media hisgo-callout-media--right"/);
  assert.match(outlinedMediaHtml, /<figcaption class="hisgo-callout-media-caption">Hình 1\. Bảo tàng Ô-lim-píc Nhật Bản<\/figcaption>/);
  assert.doesNotMatch(outlinedMediaHtml, /\sstyle="/);

  const unsafeMediaHtml = LessonBlockRegistry.blockToHtml({
    id: 'cal_8',
    type: LessonBlockType.CALLOUT,
    variant: CalloutVariant.NEUTRAL,
    boxStyle: CalloutBoxStyle.OUTLINED,
    title: '',
    content: '<p>Test XSS URI</p>',
    media: { src: 'javascript:alert(1)', align: CalloutMediaAlign.LEFT },
  });
  assert.match(unsafeMediaHtml, /src="#"/);
  assert.doesNotMatch(unsafeMediaHtml, /javascript:/);

  const eventHtml = LessonBlockRegistry.blockToHtml({
    id: 'ev_1',
    type: LessonBlockType.EVENT,
    title: 'Điện Biên Phủ',
    timeLocation: '1954',
    summary: 'Chiến thắng lịch sử',
  });
  assert.match(eventHtml, /class="hisgo-event-block"/);
  assert.doesNotMatch(eventHtml, /\sstyle="/);

  const quoteHtml = LessonBlockRegistry.blockToHtml({
    id: 'qt_1',
    type: LessonBlockType.QUOTE,
    quoteText: 'Không có gì quý hơn độc lập tự do',
    author: 'Hồ Chí Minh',
  });
  assert.match(quoteHtml, /class="hisgo-quote-block"/);
  assert.doesNotMatch(quoteHtml, /\sstyle="/);

  const tableHtml = LessonBlockRegistry.blockToHtml({
    id: 'tb_1',
    type: LessonBlockType.COMPARISON_TABLE,
    title: 'So sánh',
    colAName: 'Ta',
    colBName: 'Địch',
    rows: [{ criteria: 'Tinh thần', colA: 'Cao', colB: 'Thấp' }],
  });
  assert.match(tableHtml, /class="hisgo-table"/);
  assert.doesNotMatch(tableHtml, /\sstyle="/);

  for (const sceneStyle of [
    TimelineSceneStyle.MUSEUM_SPLIT,
    TimelineSceneStyle.CINEMATIC_BACKDROP,
    TimelineSceneStyle.CHRONO_MINIMAL,
  ]) {
    const tlHtmlNoImg = LessonBlockRegistry.blockToHtml({
      id: `tl_${sceneStyle}`,
      type: LessonBlockType.TIMELINE,
      title: 'Dòng thời gian',
      subtitle: 'Tóm tắt',
      displayConfig: { sceneStyle, showImage: true },
      nodes: [{ id: 'n1', year: '1954', title: 'Mốc', description: 'Mô tả' }],
    });
    assert.match(tlHtmlNoImg, /class="hisgo-timeline-block"/);
    assert.doesNotMatch(tlHtmlNoImg, /\sstyle="/);
  }

  const cinematicWithImg = LessonBlockRegistry.blockToHtml({
    id: 'tl_cinematic_img',
    type: LessonBlockType.TIMELINE,
    title: 'Dòng thời gian',
    subtitle: 'Tóm tắt',
    displayConfig: { sceneStyle: TimelineSceneStyle.CINEMATIC_BACKDROP, showImage: true },
    nodes: [
      {
        id: 'n1',
        year: '1954',
        title: 'Mốc',
        description: 'Mô tả',
        thumbnailUrl: '/uploads/test-bg.jpg',
      },
    ],
  });
  assert.match(cinematicWithImg, /style="background-image:/);
  const withoutBgStyle = cinematicWithImg.replace(/style="background-image:[^"]*"/g, '');
  assert.doesNotMatch(withoutBgStyle, /\sstyle="/);
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
