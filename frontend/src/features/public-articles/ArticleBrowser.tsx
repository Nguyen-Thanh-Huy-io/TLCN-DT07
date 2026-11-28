'use client';

import { useMemo } from 'react';
import {
  AlertCircle,
  ArrowDownUp,
  BookOpen,
  Landmark,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { FilterDialog } from '@/components/filters/ChipFilter';
import { TocDrawer } from '@/components/common/TocDrawer';
import type {
  PublicArticleCatalogResponse,
  PublicCategory,
  PublicTopicRef,
} from '@/services/public/public-content.service';
import {
  ARTICLE_SORT_LABELS,
  ArticleFilterKey,
  ArticleSortOption,
  ArticleViewMode,
  EMPTY_ARTICLE_FILTERS,
  estimateDraftCategoryCount,
  getDeepestSelectedCategoryIds,
  hasSecondaryDraftFilters,
  type ArticleFilters,
} from './article-library.strategy';
import {
  ArticleCatalogPagination,
  ArticleFilterDialogSections,
  ArticleGridCard,
  ArticleListItem,
} from './ArticleBrowserParts';
import {
  useArticleCatalogFacade,
  type ArticleCatalogInitialParams,
} from './useArticleCatalogFacade';
import '@/components/timeline/sk-timeline.css';
import './events-library.css';

export interface ArticleBrowserProps {
  initialCatalog: PublicArticleCatalogResponse;
  categories: PublicCategory[];
  topics: PublicTopicRef[];
  initialParams: ArticleCatalogInitialParams;
}

interface ActiveChipItem {
  id: string;
  label: string;
  onRemove: () => void;
}

function buildActiveFilterChips(input: {
  filters: ArticleFilters;
  categories: PublicCategory[];
  topics: PublicTopicRef[];
  focusedTopicId: string | null;
  tagNamesById: Map<string, string>;
  onRemoveCategory: (id: string) => void;
  onToggleSimple: (key: ArticleFilterKey, val: string) => void;
  onClearFocusedTopic: () => void;
}): ActiveChipItem[] {
  const catById = new Map(input.categories.map((c) => [c.id, c]));
  const deepestSubs = getDeepestSelectedCategoryIds(input.filters.subCategoryIds, input.categories);
  const activeCatIds =
    deepestSubs.length > 0
      ? deepestSubs
      : input.filters.rootCategoryId
        ? [input.filters.rootCategoryId]
        : [];
  const chips: ActiveChipItem[] = [];

  if (input.focusedTopicId) {
    const tName = input.topics.find((t) => t.id === input.focusedTopicId)?.name ?? input.focusedTopicId;
    chips.push({ id: `topic-${input.focusedTopicId}`, label: `Chủ đề: ${tName}`, onRemove: input.onClearFocusedTopic });
  }
  for (const cid of activeCatIds) {
    const label = catById.get(cid)?.name ?? cid;
    chips.push({ id: `cat-${cid}`, label, onRemove: () => input.onRemoveCategory(cid) });
  }
  for (const tagVal of input.filters.tags) {
    const label = input.tagNamesById.get(tagVal) ?? `#${tagVal}`;
    chips.push({
      id: `tag-${tagVal}`,
      label,
      onRemove: () => input.onToggleSimple(ArticleFilterKey.TAGS, tagVal),
    });
  }
  return chips;
}

function resolveHeroHeading(
  filters: ArticleFilters,
  categories: PublicCategory[],
  totalCount: number,
): { title: string; subtitle: string } {
  const deepestSubs = getDeepestSelectedCategoryIds(filters.subCategoryIds, categories);
  const singleId =
    deepestSubs.length === 1
      ? deepestSubs[0]
      : deepestSubs.length === 0 && filters.rootCategoryId
        ? filters.rootCategoryId
        : null;
  if (singleId) {
    const cat = categories.find((c) => c.id === singleId);
    if (cat) {
      return {
        title: cat.name,
        subtitle:
          cat.description ??
          `Khám phá ${totalCount.toLocaleString('vi-VN')} bài viết chuyên sâu thuộc mục ${cat.name.toLowerCase()}.`,
      };
    }
  }
  return {
    title: 'Tất cả bài viết lịch sử',
    subtitle: `Khám phá ${totalCount.toLocaleString('vi-VN')} bài viết chuyên sâu về sự kiện, nhân vật, di tích, triều đại, thể chế và sử liệu.`,
  };
}

export function ArticleBrowser({
  initialCatalog,
  categories,
  topics,
  initialParams,
}: ArticleBrowserProps) {
  const f = useArticleCatalogFacade({
    initialCatalog,
    categories,
    topics,
    initialParams,
  });

  const {
    filters,
    focusedTopicId,
    handleRemoveCategoryChip,
    handleToggleSimpleFilter,
    setFocusedTopicId,
  } = f;

  const tagNamesById = useMemo(
    () => new Map(f.catalog.facets.tags.map((t) => [t.id, t.name])),
    [f.catalog.facets.tags],
  );

  const chips = useMemo(
    () =>
      buildActiveFilterChips({
        filters,
        categories,
        topics,
        focusedTopicId,
        tagNamesById,
        onRemoveCategory: handleRemoveCategoryChip,
        onToggleSimple: handleToggleSimpleFilter,
        onClearFocusedTopic: () => setFocusedTopicId(null),
      }),
    [
      filters,
      categories,
      topics,
      focusedTopicId,
      tagNamesById,
      handleRemoveCategoryChip,
      handleToggleSimpleFilter,
      setFocusedTopicId,
    ],
  );

  const hero = resolveHeroHeading(filters, categories, f.catalog.total);
  const allCategoriesTotal = useMemo(
    () => Object.values(f.catalog.facets.categoryCounts).reduce((sum, n) => sum + n, 0),
    [f.catalog.facets.categoryCounts],
  );

  return (
    <div className="sk-app el-app">
      <section className="el-intro">
        <span className="sk-section-eyebrow">THƯ VIỆN TRI THỨC LỊCH SỬ</span>
        <h1>{hero.title}</h1>
        <p>{hero.subtitle}</p>
      </section>

      <div className="el-wrap" id="el-content-anchor">
        <div className="sk-filter-bar">
          <div className="sk-search-field">
            <Search size={17} />
            <input
              aria-label="Tìm bài viết lịch sử"
              placeholder="Tìm tên bài viết, nhân vật, sự kiện, di tích, năm lịch sử..."
              value={f.queryInput}
              onChange={(e) => f.setQueryInput(e.target.value)}
            />
            {f.queryInput && (
              <button
                type="button"
                className="sk-button"
                aria-label="Xóa tìm kiếm"
                onClick={() => f.setQueryInput('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`sk-button sk-filter-open ${f.activeFilterCount > 0 ? 'sk-is-on' : ''}`}
            onClick={() => f.setSheetOpen(true)}
          >
            <SlidersHorizontal size={16} />
            <span>Bộ lọc</span>
            {f.activeFilterCount > 0 && <span className="sk-badge">{f.activeFilterCount}</span>}
          </button>

          <div className="sk-split-segment" role="group" aria-label="Sắp xếp bài viết">
            <ArrowDownUp size={13} />
            {(Object.keys(ARTICLE_SORT_LABELS) as ArticleSortOption[]).map((s) => (
              <button
                key={s}
                type="button"
                className={f.sort === s ? 'sk-selected' : ''}
                aria-pressed={f.sort === s}
                onClick={() => f.handleChangeSort(s)}
              >
                {ARTICLE_SORT_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="el-view-mode-toggle" role="group" aria-label="Chế độ hiển thị">
            <button
              type="button"
              className={`el-view-btn ${f.viewMode === ArticleViewMode.GRID ? 'sk-active' : ''}`}
              onClick={() => f.setViewMode(ArticleViewMode.GRID)}
              title="Xem dạng lưới thẻ tạp chí"
              aria-label="Xem dạng lưới"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`el-view-btn ${f.viewMode === ArticleViewMode.LIST ? 'sk-active' : ''}`}
              onClick={() => f.setViewMode(ArticleViewMode.LIST)}
              title="Xem dạng danh sách"
              aria-label="Xem dạng danh sách"
            >
              <List size={16} />
            </button>
          </div>

          {chips.length > 0 && (
            <div className="sk-active-filters">
              {chips.map((c) => (
                <button key={c.id} type="button" onClick={c.onRemove} aria-label={`Bỏ lọc ${c.label}`}>
                  {c.label}
                  <X size={13} />
                </button>
              ))}
              {chips.length > 1 && (
                <button type="button" className="sk-active-clear" onClick={f.resetAll}>
                  Xóa tất cả
                </button>
              )}
            </div>
          )}
        </div>

        <FilterDialog
          open={f.sheetOpen}
          value={filters}
          empty={EMPTY_ARTICLE_FILTERS}
          countFor={(draft) =>
            estimateDraftCategoryCount(
              draft,
              categories,
              f.catalog.facets.categoryCounts,
              allCategoriesTotal,
            )
          }
          applyLabelFor={(draft) => (hasSecondaryDraftFilters(draft) ? 'Áp dụng bộ lọc' : undefined)}
          onApply={f.handleApplyDialogFilters}
          onClose={() => f.setSheetOpen(false)}
        >
          {(draft, setDraft) => (
            <ArticleFilterDialogSections
              draft={draft}
              setDraft={setDraft}
              categories={categories}
              branchCategoryCounts={f.branchCategoryCounts}
              tagOptions={f.catalog.facets.tags}
            />
          )}
        </FilterDialog>

        <div className="el-toolbar">
          <span>
            {f.loading ? (
              'Đang tải danh sách bài viết…'
            ) : (
              <>
                Tìm thấy <strong>{f.catalog.total.toLocaleString('vi-VN')}</strong> bài viết lịch sử
                {f.catalog.totalPages > 1 && (
                  <>
                    {' '}
                    · Trang <strong>{f.page}</strong>/{f.catalog.totalPages}
                  </>
                )}
              </>
            )}
          </span>
          {(f.activeFilterCount > 0 || Boolean(f.queryInput)) && (
            <button type="button" className="el-reset-link" onClick={f.resetAll}>
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <ArticleCatalogBody
          loading={f.loading}
          error={f.error}
          rows={f.rows}
          viewMode={f.viewMode}
          hasActiveCriteria={f.activeFilterCount > 0 || Boolean(f.queryInput)}
          onRetry={f.retryLoad}
          onReset={f.resetAll}
        />

        <ArticleCatalogPagination
          page={f.page}
          limit={f.limit}
          total={f.catalog.total}
          totalPages={f.catalog.totalPages}
          onChangePage={f.handleChangePage}
          onChangeLimit={f.handleChangePageSize}
        />
      </div>

      {!f.tocOpen && !f.sheetOpen && (
        <button
          type="button"
          className="fixed bottom-4 left-3 z-40 flex items-center gap-1.5 rounded-full border border-[#E2D5B8] bg-[#FFFCF5]/95 px-3.5 py-2 text-xs font-bold text-[#7A1F24] shadow-lg backdrop-blur-xs transition hover:bg-[#F5EEDC] cursor-pointer md:bottom-auto md:left-auto md:right-0 md:top-1/2 md:-translate-y-1/2 md:rounded-l-xl md:rounded-r-none md:border-r-0 md:px-3 md:py-2.5 md:hover:pr-4"
          onClick={() => f.setTocOpen(true)}
          title="Mục lục chủ đề bài viết"
          aria-label="Mở mục lục chủ đề"
        >
          <BookOpen size={15} />
          <span>Mục lục</span>
        </button>
      )}

      <TocDrawer
        open={f.tocOpen}
        onClose={() => f.setTocOpen(false)}
        heading="Mục lục chủ đề"
        itemLabel="bài viết"
        nodes={f.tocNodes}
        activeId={focusedTopicId ? `topic-leaf-${focusedTopicId}` : undefined}
        totalCount={f.totalTopicArticles}
        onJump={f.handleSelectTocNode}
        onClearActive={() => setFocusedTopicId(null)}
        allLabel="Tất cả chủ đề"
      />
    </div>
  );
}

function ArticleCatalogBody({
  loading,
  error,
  rows,
  viewMode,
  hasActiveCriteria,
  onRetry,
  onReset,
}: {
  loading: boolean;
  error: string | null;
  rows: ReturnType<typeof useArticleCatalogFacade>['rows'];
  viewMode: ArticleViewMode;
  hasActiveCriteria: boolean;
  onRetry: () => void;
  onReset: () => void;
}) {
  if (error) {
    return (
      <div className="sk-empty">
        <AlertCircle size={36} className="text-red-700" />
        <h2>Không thể tải danh sách bài viết</h2>
        <p>{error}</p>
        <button type="button" className="sk-button sk-primary" onClick={onRetry}>
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  if (loading && rows.length === 0) {
    return (
      <div className="el-grid" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-[#EAE0CB]/70" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="sk-empty">
        <Landmark size={36} />
        <h2>Chưa tìm thấy bài viết</h2>
        <p>Thử từ khóa khác hoặc xóa bớt các tiêu chí lọc đang chọn.</p>
        {hasActiveCriteria && (
          <button type="button" className="sk-button sk-primary" onClick={onReset}>
            Xóa bộ lọc <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {viewMode === ArticleViewMode.GRID ? (
        <div className="el-grid">
          {rows.map((row) => (
            <ArticleGridCard key={row.item.id} row={row} />
          ))}
        </div>
      ) : (
        <ol className="el-list">
          {rows.map((row) => (
            <ArticleListItem key={row.item.id} row={row} />
          ))}
        </ol>
      )}
    </div>
  );
}
