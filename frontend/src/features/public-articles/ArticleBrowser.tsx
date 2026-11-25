'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownUp,
  BookOpen,
  Landmark,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { FilterDialog, toggleValue } from '@/components/filters/ChipFilter';
import {
  TocDrawer,
  TopicBlockSection,
  TopicLeafHeading,
  buildTopicTocNodes,
} from '@/components/common/TocDrawer';
import { normalizeSearch } from '@/features/search/search-index';
import { findRootTopic, groupByTopic } from '@/services/entities/landing-graph';
import { fetchArticleLibrary, type PublicArticleLibraryItemDto } from '@/services/entities/landing.service';
import { findRootCategory, type PublicCategory, type PublicTopicRef } from '@/services/public/public-content.service';
import {
  ARTICLE_SORT_LABELS,
  ArticleFilterKey,
  ArticleSortOption,
  ArticleViewMode,
  EMPTY_ARTICLE_FILTERS,
  buildArticleJsonbFacets,
  buildArticleRows,
  countActiveArticleFilters,
  expandSelectedCategoryIds,
  matchesArticleRow,
  preservationTextOf,
  resolveActiveFilterKind,
  sortArticleRows,
  type ArticleFilters,
} from './article-library.strategy';
import {
  ArticleAdaptiveSubFilters,
  ArticleFilterDialogSections,
  ArticleGridCard,
  ArticleListItem,
} from './ArticleBrowserParts';
import '@/components/timeline/sk-timeline.css';
import './events-library.css';

interface TagBucket {
  id: string;
  name: string;
  count: number;
  ids: Set<string>;
  articleIds: Set<string>;
}

function upsertTagBucket(
  buckets: Map<string, TagBucket>,
  articleId: string,
  tag: { id: string; name: string },
): void {
  const trimmed = tag.name.trim();
  const norm = trimmed.toLocaleLowerCase('vi');
  const cur = buckets.get(norm);
  if (!cur) {
    buckets.set(norm, {
      id: tag.id,
      name: trimmed,
      count: 1,
      ids: new Set([tag.id]),
      articleIds: new Set([articleId]),
    });
    return;
  }
  cur.ids.add(tag.id);
  if (!cur.articleIds.has(articleId)) {
    cur.articleIds.add(articleId);
    cur.count += 1;
  }
  if (cur.name === cur.name.toLocaleLowerCase('vi') && trimmed !== cur.name) {
    cur.name = trimmed;
  }
}

function buildDeduplicatedTagFacet(rows: ReturnType<typeof buildArticleRows>) {
  const byNormName = new Map<string, TagBucket>();
  for (const row of rows) {
    for (const tag of row.item.tags) {
      upsertTagBucket(byNormName, row.item.id, tag);
    }
  }
  const siblingMap = new Map<string, string[]>();
  const options = [...byNormName.values()]
    .map((entry) => {
      siblingMap.set(entry.id, [...entry.ids]);
      return { id: entry.id, name: entry.name, count: entry.count };
    })
    .sort((a, b) => b.count - a.count);
  return { tagOptions: options, tagSiblingIdsByCanonicalId: siblingMap };
}

export interface ArticleBrowserProps {
  articles: PublicArticleLibraryItemDto[];
  categories: PublicCategory[];
  topics: PublicTopicRef[];
  initialCategorySlug?: string;
  initialQuery?: string;
  initialTag?: string;
}

export function ArticleBrowser({
  articles,
  categories,
  topics,
  initialCategorySlug,
  initialQuery,
  initialTag,
}: ArticleBrowserProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [serverArticles, setServerArticles] = useState<PublicArticleLibraryItemDto[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Khi người dùng nhập từ khóa tìm kiếm, truy vấn trực tiếp server trên toàn bộ 6,281+ bài (cả tên, tag & năm)
  useEffect(() => {
    const trimmed = query.trim();
    const initialTrimmed = (initialQuery ?? '').trim();
    if (!trimmed || trimmed === initialTrimmed) {
      setServerArticles(null);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(() => {
      fetchArticleLibrary({ q: trimmed, tag: initialTag })
        .then((res) => {
          if (active) setServerArticles(res);
        })
        .catch(() => {
          if (active) setServerArticles([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, initialQuery, initialTag]);

  const effectiveArticles = serverArticles ?? articles;
  const allRows = useMemo(() => buildArticleRows(effectiveArticles), [effectiveArticles]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Chuyên mục gốc được chọn từ Menu Khám phá (?chuyen-muc=...).
  const scopedCategory = useMemo(
    () => (initialCategorySlug ? (categories.find((c) => c.slug === initialCategorySlug) ?? null) : null),
    [categories, initialCategorySlug],
  );

  // Khoanh vùng dữ liệu theo chuyên mục đang xem (gồm cả chuyên mục con của nó).
  const scopedRows = useMemo(() => {
    if (!scopedCategory) return allRows;
    const allowedIds = expandSelectedCategoryIds([scopedCategory.id], categories);
    return allRows.filter((r) => Boolean(r.item.categoryId && allowedIds.has(r.item.categoryId)));
  }, [allRows, scopedCategory, categories]);

  const [filters, setFilters] = useState<ArticleFilters>(EMPTY_ARTICLE_FILTERS);
  const [sort, setSort] = useState<ArticleSortOption>(ArticleSortOption.YEAR_ASC);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ArticleViewMode>(ArticleViewMode.GRID);
  const [tocOpen, setTocOpen] = useState(false);
  const [focusedTocId, setFocusedTocId] = useState<string | null>(null);

  const needle = serverArticles !== null ? '' : normalizeSearch(query.trim());

  const toggleFilterValue = useCallback((key: ArticleFilterKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: toggleValue(prev[key], value) }));
  }, []);

  const { tagOptions, tagSiblingIdsByCanonicalId } = useMemo(
    () => buildDeduplicatedTagFacet(scopedRows),
    [scopedRows],
  );

  const dialogCategoryOptions = useMemo(() => {
    const targetCategories = scopedCategory
      ? categories.filter((c) => c.parentId === scopedCategory.id)
      : categories.filter((c) => !c.parentId);
    return targetCategories
      .map((cat) => {
        const expanded = expandSelectedCategoryIds([cat.id], categories);
        const count = scopedRows.filter((r) => Boolean(r.item.categoryId && expanded.has(r.item.categoryId))).length;
        return { cat, count };
      })
      .filter((entry) => entry.count > 0);
  }, [categories, scopedCategory, scopedRows]);

  const childCategoryPills = useMemo(
    () => (scopedCategory ? dialogCategoryOptions : []),
    [scopedCategory, dialogCategoryOptions],
  );

  const activeKind = useMemo(() => {
    if (scopedCategory) return findRootCategory(categories, scopedCategory.id)?.slug ?? scopedCategory.slug;
    return resolveActiveFilterKind(filters.categories, categories);
  }, [scopedCategory, filters.categories, categories]);

  const jsonbFacets = useMemo(() => buildArticleJsonbFacets(scopedRows), [scopedRows]);

  const expandTagIds = useCallback(
    (selectedTagIds: string[]): string[] => {
      if (selectedTagIds.length === 0) return selectedTagIds;
      const expanded = new Set<string>();
      for (const id of selectedTagIds) {
        for (const sib of tagSiblingIdsByCanonicalId.get(id) ?? [id]) {
          expanded.add(sib);
        }
      }
      return [...expanded];
    },
    [tagSiblingIdsByCanonicalId],
  );

  const visible = useMemo(() => {
    const expandedCats = expandSelectedCategoryIds(filters.categories, categories);
    const effectiveFilters =
      filters.tags.length > 0 ? { ...filters, tags: expandTagIds(filters.tags) } : filters;
    const matched = scopedRows.filter((r) => matchesArticleRow(r, effectiveFilters, expandedCats, needle));
    return sortArticleRows(matched, sort);
  }, [scopedRows, filters, categories, expandTagIds, needle, sort]);

  const allTopicBlocks = useMemo(
    () =>
      groupByTopic(visible, (r) => r.item.topicId, {
        topics,
        rootTopicOf: (id) => findRootTopic(topics, id),
      }),
    [visible, topics],
  );

  const tocNodes = useMemo(() => buildTopicTocNodes(allTopicBlocks), [allTopicBlocks]);

  const focusedTopicLabel = useMemo(() => {
    if (!focusedTocId) return null;
    for (const block of allTopicBlocks) {
      if (`topic-${block.id}` === focusedTocId) return block.name;
      const leaf = block.leaves.find((l) => `topic-leaf-${l.id}` === focusedTocId);
      if (leaf) return leaf.name;
    }
    return null;
  }, [allTopicBlocks, focusedTocId]);

  const topicBlocks = useMemo(() => {
    if (!focusedTocId) return allTopicBlocks;
    return allTopicBlocks
      .map((block) => {
        if (`topic-${block.id}` === focusedTocId) return block;
        const matchedLeaves = block.leaves.filter((l) => `topic-leaf-${l.id}` === focusedTocId);
        return matchedLeaves.length > 0 ? { ...block, leaves: matchedLeaves } : null;
      })
      .filter((b): b is (typeof allTopicBlocks)[number] => b !== null);
  }, [allTopicBlocks, focusedTocId]);

  const displayedCount = useMemo(
    () => topicBlocks.reduce((sum, b) => sum + b.leaves.reduce((s, l) => s + l.items.length, 0), 0),
    [topicBlocks],
  );

  const handleSelectToc = useCallback((id: string) => {
    setFocusedTocId(id);
    document.getElementById('el-content-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const chips = [
    ...filters.categories.map((id) => ({
      key: ArticleFilterKey.CATEGORIES,
      value: id,
      label: categoryById.get(id)?.name ?? id,
    })),
    ...filters.siteTypes.map((code) => ({
      key: ArticleFilterKey.SITE_TYPES,
      value: code,
      label: jsonbFacets.siteTypes.find((s) => s.value === code)?.label ?? code,
    })),
    ...filters.preservations.map((code) => ({
      key: ArticleFilterKey.PRESERVATIONS,
      value: code,
      label: preservationTextOf(code) ?? code,
    })),
    ...filters.personRoles.map((role) => ({
      key: ArticleFilterKey.PERSON_ROLES,
      value: role,
      label: role,
    })),
    ...filters.tags.map((id) => ({
      key: ArticleFilterKey.TAGS,
      value: id,
      label: tagOptions.find((t) => t.id === id)?.name ?? id,
    })),
  ];

  const activeCount =
    countActiveArticleFilters(filters) + (focusedTocId ? 1 : 0) + (initialTag ? 1 : 0);

  const resetAll = () => {
    setQuery('');
    setFilters(EMPTY_ARTICLE_FILTERS);
    setFocusedTocId(null);
    if (initialTag) {
      router.push(
        initialCategorySlug
          ? `/bai-viet?chuyen-muc=${encodeURIComponent(initialCategorySlug)}`
          : '/bai-viet',
      );
    }
  };

  return (
    <div className="sk-app el-app">
      <section className="el-intro">
        <span className="sk-section-eyebrow">THƯ VIỆN TRI THỨC LỊCH SỬ</span>
        <h1>{scopedCategory ? scopedCategory.name : 'Tất cả bài viết lịch sử'}</h1>
        <p>
          {scopedCategory?.description ??
            `Khám phá ${scopedRows.length} bài viết chuyên sâu về sự kiện, nhân vật, di tích, địa danh, triều đại và tư liệu lịch sử.`}
        </p>
        <ArticleAdaptiveSubFilters
          activeKind={activeKind}
          childCategories={childCategoryPills}
          jsonbFacets={jsonbFacets}
          filters={filters}
          onToggleFilter={toggleFilterValue}
        />
      </section>

      <div className="el-wrap" id="el-content-anchor">
        <div className="sk-filter-bar">
          <div className="sk-search-field">
            <Search size={17} />
            <input
              aria-label="Tìm bài viết lịch sử"
              placeholder={
                scopedCategory
                  ? `Tìm trong ${scopedCategory.name.toLowerCase()}...`
                  : 'Tìm tên bài viết, nhân vật, sự kiện, di tích, triều đại...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="sk-button" aria-label="Xóa tìm kiếm" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`sk-button sk-filter-open ${activeCount ? 'sk-is-on' : ''}`}
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal size={16} />
            <span>Bộ lọc</span>
            {activeCount > 0 && <span className="sk-badge">{activeCount}</span>}
          </button>

          <div className="sk-split-segment" role="group" aria-label="Sắp xếp bài viết">
            <ArrowDownUp size={13} />
            {(Object.keys(ARTICLE_SORT_LABELS) as ArticleSortOption[]).map((s) => (
              <button
                key={s}
                type="button"
                className={sort === s ? 'sk-selected' : ''}
                aria-pressed={sort === s}
                onClick={() => setSort(s)}
              >
                {ARTICLE_SORT_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="el-view-mode-toggle" role="group" aria-label="Chế độ hiển thị">
            <button
              type="button"
              className={`el-view-btn ${viewMode === ArticleViewMode.GRID ? 'sk-active' : ''}`}
              onClick={() => setViewMode(ArticleViewMode.GRID)}
              title="Xem dạng lưới thẻ tạp chí"
              aria-label="Xem dạng lưới"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`el-view-btn ${viewMode === ArticleViewMode.LIST ? 'sk-active' : ''}`}
              onClick={() => setViewMode(ArticleViewMode.LIST)}
              title="Xem dạng danh sách"
              aria-label="Xem dạng danh sách"
            >
              <List size={16} />
            </button>
          </div>

          {(chips.length > 0 || focusedTopicLabel || initialTag) && (
            <div className="sk-active-filters">
              {initialTag && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      initialCategorySlug
                        ? `/bai-viet?chuyen-muc=${encodeURIComponent(initialCategorySlug)}`
                        : '/bai-viet',
                    )
                  }
                  aria-label={`Bỏ lọc thẻ ${initialTag}`}
                >
                  Thẻ: #{initialTag}
                  <X size={13} />
                </button>
              )}
              {focusedTopicLabel && (
                <button
                  type="button"
                  onClick={() => setFocusedTocId(null)}
                  aria-label={`Bỏ lọc chủ đề ${focusedTopicLabel}`}
                >
                  Chủ đề: {focusedTopicLabel}
                  <X size={13} />
                </button>
              )}
              {chips.map((c) => (
                <button
                  key={`${c.key}-${c.value}`}
                  type="button"
                  onClick={() =>
                    setFilters({ ...filters, [c.key]: filters[c.key].filter((v) => v !== c.value) })
                  }
                  aria-label={`Bỏ lọc ${c.label}`}
                >
                  {c.label}
                  <X size={13} />
                </button>
              ))}
              {(chips.length + (focusedTopicLabel ? 1 : 0)) > 1 && (
                <button type="button" className="sk-active-clear" onClick={resetAll}>
                  Xóa tất cả
                </button>
              )}
            </div>
          )}
        </div>

        <FilterDialog
          open={sheetOpen}
          value={filters}
          empty={EMPTY_ARTICLE_FILTERS}
          countFor={(draft) => {
            const expanded = expandSelectedCategoryIds(draft.categories, categories);
            const effectiveDraft =
              draft.tags.length > 0 ? { ...draft, tags: expandTagIds(draft.tags) } : draft;
            return scopedRows.filter((r) => matchesArticleRow(r, effectiveDraft, expanded, needle)).length;
          }}
          onApply={(f) => {
            setFilters(f);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        >
          {(draft, setDraft) => (
            <ArticleFilterDialogSections
              draft={draft}
              setDraft={setDraft}
              activeKind={activeKind}
              isScopedCategory={Boolean(scopedCategory)}
              categoryOptions={dialogCategoryOptions}
              tagOptions={tagOptions}
              jsonbFacets={jsonbFacets}
            />
          )}
        </FilterDialog>

        <div className="el-toolbar">
          <span>
            {searching ? (
              'Đang tìm kiếm trên toàn kho dữ liệu…'
            ) : (
              <>
                Tìm thấy <strong>{displayedCount}</strong> bài viết lịch sử
              </>
            )}
          </span>
          {(activeCount > 0 || query) && visible.length > 0 && (
            <button type="button" className="el-reset-link" onClick={resetAll}>
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {visible.length > 0 ? (
          topicBlocks.map((block) => (
            <TopicBlockSection key={block.id} block={block} itemLabel="bài viết">
              {block.leaves.map((leaf) => (
                <div key={leaf.id} id={`topic-leaf-${leaf.id}`} className="sk-sub-era">
                  {block.leaves.length > 1 && <TopicLeafHeading leaf={leaf} itemLabel="bài viết" />}
                  {viewMode === ArticleViewMode.GRID ? (
                    <div className="el-grid">
                      {leaf.items.map((row) => (
                        <ArticleGridCard key={row.item.id} row={row} />
                      ))}
                    </div>
                  ) : (
                    <ol className="el-list">
                      {leaf.items.map((row) => (
                        <ArticleListItem key={row.item.id} row={row} />
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </TopicBlockSection>
          ))
        ) : (
          <div className="sk-empty">
            <Landmark size={36} />
            <h2>Chưa tìm thấy bài viết</h2>
            <p>Thử từ khóa khác hoặc xóa bớt các tiêu chí lọc đang chọn.</p>
            {(activeCount > 0 || query) && (
              <button type="button" className="sk-button sk-primary" onClick={resetAll}>
                Xóa bộ lọc <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="fixed bottom-4 left-3 z-40 flex items-center gap-1.5 rounded-full border border-[#E2D5B8] bg-[#FFFCF5]/95 px-3.5 py-2 text-xs font-bold text-[#7A1F24] shadow-lg backdrop-blur-xs transition hover:bg-[#F5EEDC] cursor-pointer md:bottom-auto md:left-auto md:right-0 md:top-1/2 md:-translate-y-1/2 md:rounded-l-xl md:rounded-r-none md:border-r-0 md:px-3 md:py-2.5 md:hover:pr-4"
        onClick={() => setTocOpen(true)}
        title="Mục lục chủ đề bài viết"
        aria-label="Mở mục lục chủ đề"
      >
        <BookOpen size={15} />
        <span>Mục lục</span>
      </button>

      <TocDrawer
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        heading="Mục lục chủ đề"
        itemLabel="bài viết"
        nodes={tocNodes}
        activeId={focusedTocId ?? undefined}
        totalCount={visible.length}
        onJump={handleSelectToc}
        onClearActive={() => setFocusedTocId(null)}
        allLabel="Tất cả chủ đề"
      />
    </div>
  );
}
