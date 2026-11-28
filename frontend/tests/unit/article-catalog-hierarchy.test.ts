import { describe, expect, it } from 'vitest';
import {
  buildInitialCategorySelection,
  collectCategoryLineage,
  computeBranchCategoryCounts,
  EMPTY_ARTICLE_FILTERS,
  parseCatalogPageSize,
  resolveEffectiveCategoryIds,
  selectRootCategory,
  toggleSubCategorySelection,
} from '@/features/public-articles/article-library.strategy';
import { countPickedSubtreeDescendants } from '@/components/filters/CategoryHierarchyFilterSection';
import { buildServerTopicTocNodes } from '@/components/common/TocDrawer';
import {
  computeTagFacetsFromItems,
  matchesSelectedTags,
} from '@/components/filters/PublicContentFilterSections';
import { buildEraDataset } from '@/components/timeline/sk-adapter';
import { buildPeriods } from '@/services/entities/landing-graph';
import type {
  PublicCategory,
  PublicTimeline,
  PublicTopicRef,
} from '@/services/public/public-content.service';

const SAMPLE_CATEGORIES: PublicCategory[] = [
  {
    id: 'root-gov',
    parentId: null,
    name: 'Thể chế, Kinh tế & Xã hội',
    slug: 'the-che-xa-hoi',
    icon: null,
    description: null,
    displayOrder: 1,
    articleCount: 10,
  },
  {
    id: 'lvl2-diplomacy',
    parentId: 'root-gov',
    name: 'Quan hệ đối ngoại',
    slug: 'quan-he-doi-ngoai',
    icon: null,
    description: null,
    displayOrder: 2,
    articleCount: 20,
  },
  {
    id: 'lvl3-asean',
    parentId: 'lvl2-diplomacy',
    name: 'Hội nhập ASEAN',
    slug: 'hoi-nhap-asean',
    icon: null,
    description: null,
    displayOrder: 3,
    articleCount: 5,
  },
  {
    id: 'lvl3-un',
    parentId: 'lvl2-diplomacy',
    name: 'Liên Hợp Quốc',
    slug: 'lien-hop-quoc',
    icon: null,
    description: null,
    displayOrder: 4,
    articleCount: 8,
  },
  {
    id: 'lvl2-military',
    parentId: 'root-gov',
    name: 'Quân sự & Quốc phòng',
    slug: 'quan-su-quoc-phong',
    icon: null,
    description: null,
    displayOrder: 5,
    articleCount: 30,
  },
  {
    id: 'root-site',
    parentId: null,
    name: 'Địa danh & Di tích lịch sử',
    slug: 'di-tich',
    icon: null,
    description: null,
    displayOrder: 6,
    articleCount: 54,
  },
];

describe('Single-Root + Breadcrumb N-level Sub-Category Selection Strategy', () => {
  const counts: Record<string, number> = {
    'root-gov': 10,
    'lvl2-diplomacy': 20,
    'lvl3-asean': 5,
    'lvl3-un': 8,
    'lvl2-military': 30,
    'root-site': 54,
  };

  it('computes recursive branch counts across N levels accurately', () => {
    const branchMap = computeBranchCategoryCounts(SAMPLE_CATEGORIES, counts);
    expect(branchMap.get('lvl3-asean')).toBe(5);
    expect(branchMap.get('lvl2-diplomacy')).toBe(20 + 5 + 8);
    expect(branchMap.get('root-gov')).toBe(10 + 20 + 5 + 8 + 30);
  });

  it('selects full root branch when no sub-category is picked, and narrows when sub-categories are toggled', () => {
    // 1. Select Root -> includes entire 3-level subtree automatically (no "Tất cả nhánh" button needed)
    let f = selectRootCategory(EMPTY_ARTICLE_FILTERS, 'root-gov');
    expect(new Set(resolveEffectiveCategoryIds(f, SAMPLE_CATEGORIES))).toEqual(
      new Set(['root-gov', 'lvl2-diplomacy', 'lvl3-asean', 'lvl3-un', 'lvl2-military']),
    );

    // 2. Toggle Level-2 "Quan hệ đối ngoại" -> narrows to diplomacy subtree
    f = toggleSubCategorySelection(f, 'lvl2-diplomacy', SAMPLE_CATEGORIES);
    expect(new Set(resolveEffectiveCategoryIds(f, SAMPLE_CATEGORIES))).toEqual(
      new Set(['lvl2-diplomacy', 'lvl3-asean', 'lvl3-un']),
    );

    // 3. Drill down & toggle Level-3 "Hội nhập ASEAN" -> replaces ancestor lvl2-diplomacy with deeper lvl3-asean
    f = toggleSubCategorySelection(f, 'lvl3-asean', SAMPLE_CATEGORIES);
    expect(resolveEffectiveCategoryIds(f, SAMPLE_CATEGORIES)).toEqual(['lvl3-asean']);
    expect(countPickedSubtreeDescendants('lvl2-diplomacy', f.subCategoryIds, SAMPLE_CATEGORIES)).toBe(1);

    // 4. Uncheck Level-3 "Hội nhập ASEAN" -> subCategoryIds becomes empty, naturally restores full root-gov branch
    f = toggleSubCategorySelection(f, 'lvl3-asean', SAMPLE_CATEGORIES);
    expect(f.subCategoryIds).toEqual([]);
    expect(new Set(resolveEffectiveCategoryIds(f, SAMPLE_CATEGORIES))).toEqual(
      new Set(['root-gov', 'lvl2-diplomacy', 'lvl3-asean', 'lvl3-un', 'lvl2-military']),
    );

    // 5. Switch to another Root -> switches cleanly and clears old sub selections
    f = selectRootCategory(f, 'root-site');
    expect(f.rootCategoryId).toBe('root-site');
    expect(f.subCategoryIds).toEqual([]);
    expect(resolveEffectiveCategoryIds(f, SAMPLE_CATEGORIES)).toEqual(['root-site']);
  });

  it('initializes root + deep subCategoryId and lineage from URL slug', () => {
    const sel = buildInitialCategorySelection('hoi-nhap-asean', SAMPLE_CATEGORIES);
    expect(sel).toEqual({
      rootCategoryId: 'root-gov',
      subCategoryIds: ['lvl3-asean'],
    });
    expect(collectCategoryLineage('lvl3-asean', SAMPLE_CATEGORIES).map((c) => c.id)).toEqual([
      'root-gov',
      'lvl2-diplomacy',
      'lvl3-asean',
    ]);
  });

  it('validates allowed page sizes and server topic TOC nodes', () => {
    expect(parseCatalogPageSize('48')).toBe(48);
    expect(parseCatalogPageSize('96')).toBe(96);
    expect(parseCatalogPageSize('999')).toBe(24);

    const topics: PublicTopicRef[] = [
      { id: 't-vn', name: 'Lịch sử Việt Nam', slug: 'vn', parentId: null },
      { id: 't-modern', name: 'Cận - Hiện đại', slug: 'modern', parentId: 't-vn' },
    ];
    const toc = buildServerTopicTocNodes(topics, { 't-modern': 3525 });
    expect(toc).toHaveLength(1);
    expect(toc[0]?.count).toBe(3525);
    expect(toc[0]?.children?.[0]?.count).toBe(3525);
  });

  it('sorts Timelines strictly by CMS displayOrder, uses only topic.eyebrow, and preserves 3-level TOC groups', () => {
    const timelines: PublicTimeline[] = [
      {
        id: 'tl-world',
        slug: 'lich-su-the-gioi',
        title: 'Lịch sử & Văn minh Thế giới',
        description: null,
        coverImageUrl: null,
        displayOrder: 100,
        topicId: 'tp-world',
        topic: { id: 'tp-world', name: 'Thế giới', slug: 'tg', eyebrow: null, parentId: null },
        nodes: [],
      },
      {
        id: 'tl-world-pre',
        slug: 'tien-su-the-gioi',
        title: 'Tiền sử Thế giới',
        description: null,
        coverImageUrl: null,
        displayOrder: 110,
        topicId: 'tp-world-pre',
        topic: { id: 'tp-world-pre', name: 'Tiền sử TG', slug: 'ts-tg', eyebrow: null, parentId: 'tp-world' },
        nodes: [
          {
            id: 'n-world-1',
            title: 'Người tối cổ',
            description: null,
            imageUrl: null,
            dateText: null,
            year: -4000000,
            month: null,
            day: null,
            endYear: null,
            displayOrder: 1,
            dateLabel: '4000000 TCN',
            article: null,
          },
        ],
      },
      {
        id: 'tl-vn',
        slug: 'lich-su-viet-nam',
        title: 'Lịch sử Việt Nam',
        description: null,
        coverImageUrl: null,
        displayOrder: 1,
        topicId: 'tp-vn',
        topic: { id: 'tp-vn', name: 'Việt Nam', slug: 'vn', eyebrow: null, parentId: null },
        nodes: [],
      },
      {
        id: 'tl-vn-ancient',
        slug: 'co-dai-trung-dai',
        title: 'Lịch sử Cổ đại & Trung đại',
        description: null,
        coverImageUrl: null,
        displayOrder: 2,
        topicId: 'tp-vn-ancient',
        topic: {
          id: 'tp-vn-ancient',
          name: 'Cổ đại & Trung đại',
          slug: 'co-trung-dai',
          eyebrow: 'Khởi thủy – TK XVIII',
          parentId: 'tp-vn',
        },
        nodes: [],
      },
      {
        id: 'tl-vn-primitive',
        slug: 'thoi-ky-nguyen-thuy',
        title: 'Thời kỳ Nguyên thủy',
        description: null,
        coverImageUrl: null,
        displayOrder: 4,
        topicId: 'tp-vn-primitive',
        topic: {
          id: 'tp-vn-primitive',
          name: 'Thời kỳ Nguyên thủy',
          slug: 'nguyen-thuy',
          eyebrow: null,
          parentId: 'tp-vn-ancient',
        },
        nodes: [
          {
            id: 'n-vn-1',
            title: 'Văn hóa Sơn Vi',
            description: null,
            imageUrl: null,
            dateText: null,
            year: -20000,
            month: null,
            day: null,
            endYear: null,
            displayOrder: 1,
            dateLabel: '20000 TCN',
            article: null,
          },
        ],
      },
    ];

    const periods = buildPeriods(timelines);
    expect(periods.find((p) => p.id === 'tl-world')?.timeLabel).toBe('');
    expect(periods.find((p) => p.id === 'tl-vn-ancient')?.timeLabel).toBe('Khởi thủy – TK XVIII');

    const eras = buildEraDataset(periods, [
      {
        id: 'n-world-1',
        slug: null,
        title: 'Người tối cổ',
        startYear: -4000000,
        eventDateNote: null,
        location: null,
        description: null,
        imageUrl: null,
        category: 'su-kien',
        periodSlug: 'tien-su-the-gioi',
        figures: [],
        locations: [],
      },
      {
        id: 'n-vn-1',
        slug: null,
        title: 'Văn hóa Sơn Vi',
        startYear: -20000,
        eventDateNote: null,
        location: null,
        description: null,
        imageUrl: null,
        category: 'su-kien',
        periodSlug: 'thoi-ky-nguyen-thuy',
        figures: [],
        locations: [],
      },
    ]);

    expect(eras.map((e) => e.id)).toEqual(['tl-vn', 'tl-world']);
    expect(eras[0].subEras.map((s) => s.id)).toEqual(['tl-vn-primitive']);
    expect(eras[0].tocSubEras?.map((s) => s.id)).toEqual(['tl-vn-ancient', 'tl-vn-primitive']);
  });

  it('aggregates and matches shared Tag facets accurately', () => {
    const items = [
      { tagItems: [{ id: 'tg-1', name: 'Quân sự', colorHex: null }] },
      {
        tagItems: [
          { id: 'tg-1', name: 'Quân sự', colorHex: null },
          { id: 'tg-2', name: 'Khảo cổ', colorHex: null },
        ],
      },
    ];
    const facets = computeTagFacetsFromItems(items);
    expect(facets).toEqual([
      { id: 'tg-1', name: 'Quân sự', count: 2 },
      { id: 'tg-2', name: 'Khảo cổ', count: 1 },
    ]);
    expect(matchesSelectedTags(items[0], ['tg-2'])).toBe(false);
    expect(matchesSelectedTags(items[1], ['tg-2'])).toBe(true);
  });
});
