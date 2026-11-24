'use client';

import { useCallback, useMemo, useState } from 'react';
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
  jumpToTopicElement,
} from '@/components/common/TocDrawer';
import { normalizeSearch } from '@/features/search/search-index';
import { findRootTopic, groupByTopic } from '@/services/entities/landing-graph';
import type { PublicArticleLibraryItemDto } from '@/services/entities/landing.service';
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
import '@/features/events-library/events-library.css';

export interface ArticleBrowserProps {
  articles: PublicArticleLibraryItemDto[];
  categories: PublicCategory[];
  topics: PublicTopicRef[];
  initialCategorySlug?: string;
  initialQuery?: string;
}

export function ArticleBrowser({
  articles,
  categories,
  topics,
  initialCategorySlug,
  initialQuery,
}: ArticleBrowserProps) {
  const allRows = useMemo(() => buildArticleRows(articles), [articles]);
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

  const [query, setQuery] = useState(initialQuery ?? '');
  const [filters, setFilters] = useState<ArticleFilters>(EMPTY_ARTICLE_FILTERS);
  const [sort, setSort] = useState<ArticleSortOption>(ArticleSortOption.YEAR_ASC);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ArticleViewMode>(ArticleViewMode.GRID);
  const [tocOpen, setTocOpen] = useState(false);

  const needle = normalizeSearch(query.trim());

  const toggleFilterValue = useCallback((key: ArticleFilterKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: toggleValue(prev[key], value) }));
  }, []);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>();
    for (const r of scopedRows) {
      for (const t of r.item.tags) {
        const cur = counts.get(t.id) ?? { id: t.id, name: t.name, count: 0 };
        cur.count += 1;
        counts.set(t.id, cur);
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [scopedRows]);

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

  const visible = useMemo(() => {
    const expandedCats = expandSelectedCategoryIds(filters.categories, categories);
    const matched = scopedRows.filter((r) => matchesArticleRow(r, filters, expandedCats, needle));
    return sortArticleRows(matched, sort);
  }, [scopedRows, filters, categories, needle, sort]);

  const topicBlocks = useMemo(
    () =>
      groupByTopic(visible, (r) => r.item.topicId, {
        topics,
        rootTopicOf: (id) => findRootTopic(topics, id),
      }),
    [visible, topics],
  );

  const tocNodes = useMemo(() => buildTopicTocNodes(topicBlocks), [topicBlocks]);

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

  const activeCount = countActiveArticleFilters(filters);

  const resetAll = () => {
    setQuery('');
    setFilters(EMPTY_ARTICLE_FILTERS);
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

          {chips.length > 0 && (
            <div className="sk-active-filters">
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
              {chips.length > 1 && (
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
            return scopedRows.filter((r) => matchesArticleRow(r, draft, expanded, needle)).length;
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
            Tìm thấy <strong>{visible.length}</strong> bài viết lịch sử
          </span>
          {(activeCount > 0 || query) && (
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
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-1.5 rounded-l-xl border border-r-0 border-[#E2D5B8] bg-[#FFFCF5]/95 px-3 py-2.5 text-xs font-bold text-[#7A1F24] shadow-lg backdrop-blur-xs transition hover:bg-[#F5EEDC] hover:pr-4 cursor-pointer"
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
        totalCount={visible.length}
        onJump={jumpToTopicElement}
      />
    </div>
  );
}
