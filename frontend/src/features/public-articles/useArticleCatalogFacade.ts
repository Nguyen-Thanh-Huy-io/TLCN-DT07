'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api, { extractErrorMessage } from '@/services/api';
import { toggleValue } from '@/components/filters/ChipFilter';
import { buildServerTopicTocNodes } from '@/components/common/TocDrawer';
import { mapSummaryToLibraryItem } from '@/services/entities/landing.service';
import {
  buildArticleCatalogSearchParams,
  PUBLIC_ROUTES,
  type PublicArticleCatalogParams,
  type PublicArticleCatalogResponse,
  type PublicCategory,
  type PublicTopicRef,
} from '@/services/public/public-content.service';
import {
  ArticleFilterKey,
  ArticleSortOption,
  ArticleViewMode,
  buildInitialCategorySelection,
  CatalogUrlParamKey,
  computeBranchCategoryCounts,
  countActiveArticleFilters,
  DEFAULT_ARTICLE_PAGE_SIZE,
  EMPTY_ARTICLE_FILTERS,
  getDeepestSelectedCategoryIds,
  parseCatalogPageSize,
  parseCatalogSort,
  resolveActiveTopicIds,
  resolveEffectiveCategoryIds,
  selectRootCategory,
  toggleSubCategorySelection,
  type ArticleFilters,
  type ArticleRow,
} from './article-library.strategy';

export interface ArticleCatalogInitialParams {
  categorySlug?: string;
  topicSlug?: string;
  query?: string;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

function buildCatalogRequestParams(input: {
  page: number;
  limit: number;
  sort: ArticleSortOption;
  q: string;
  filters: ArticleFilters;
  categories: PublicCategory[];
  topics: PublicTopicRef[];
  focusedTopicId: string | null;
}): PublicArticleCatalogParams {
  const categoryIds = resolveEffectiveCategoryIds(input.filters, input.categories);
  const topicIds = resolveActiveTopicIds(input.topics, input.focusedTopicId);
  return {
    page: input.page,
    limit: input.limit,
    sort: input.sort,
    q: input.q.trim() || undefined,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    topicIds: topicIds.length > 0 ? topicIds : undefined,
    tags: input.filters.tags.length > 0 ? input.filters.tags : undefined,
  };
}

function resolveSingleActiveCategorySlug(
  filters: ArticleFilters,
  categories: PublicCategory[],
): string | null {
  const deepestSubs = getDeepestSelectedCategoryIds(filters.subCategoryIds, categories);
  if (deepestSubs.length === 1) {
    return categories.find((c) => c.id === deepestSubs[0])?.slug ?? null;
  }
  if (deepestSubs.length === 0 && filters.rootCategoryId) {
    return categories.find((c) => c.id === filters.rootCategoryId)?.slug ?? null;
  }
  return null;
}

function buildBrowserUrl(input: {
  filters: ArticleFilters;
  categories: PublicCategory[];
  topics: PublicTopicRef[];
  focusedTopicId: string | null;
  q: string;
  sort: ArticleSortOption;
  page: number;
  limit: number;
}): string {
  const qs = new URLSearchParams();
  const singleCatSlug = resolveSingleActiveCategorySlug(input.filters, input.categories);
  if (singleCatSlug) qs.set(CatalogUrlParamKey.CATEGORY, singleCatSlug);

  if (input.focusedTopicId) {
    const topicSlug = input.topics.find((t) => t.id === input.focusedTopicId)?.slug;
    if (topicSlug) qs.set(CatalogUrlParamKey.TOPIC, topicSlug);
  }
  if (input.q.trim()) qs.set(CatalogUrlParamKey.QUERY, input.q.trim());
  if (input.filters.tags.length === 1) qs.set(CatalogUrlParamKey.TAG, input.filters.tags[0]);
  if (input.sort !== ArticleSortOption.FEATURED) qs.set(CatalogUrlParamKey.SORT, input.sort);
  if (input.page > 1) qs.set(CatalogUrlParamKey.PAGE, String(input.page));
  if (input.limit !== DEFAULT_ARTICLE_PAGE_SIZE) qs.set(CatalogUrlParamKey.LIMIT, String(input.limit));

  const queryStr = qs.toString();
  return queryStr ? `${PUBLIC_ROUTES.ARTICLES}?${queryStr}` : PUBLIC_ROUTES.ARTICLES;
}

export function useArticleCatalogFacade({
  initialCatalog,
  categories,
  topics,
  initialParams,
}: {
  initialCatalog: PublicArticleCatalogResponse;
  categories: PublicCategory[];
  topics: PublicTopicRef[];
  initialParams: ArticleCatalogInitialParams;
}) {
  const [filters, setFilters] = useState<ArticleFilters>(() => ({
    ...EMPTY_ARTICLE_FILTERS,
    ...buildInitialCategorySelection(initialParams.categorySlug, categories),
    tags: initialParams.tag?.trim() ? [initialParams.tag.trim()] : [],
  }));

  const [focusedTopicId, setFocusedTopicId] = useState<string | null>(() => {
    if (!initialParams.topicSlug) return null;
    return topics.find((t) => t.slug === initialParams.topicSlug)?.id ?? null;
  });

  const [queryInput, setQueryInput] = useState<string>(() => initialParams.query ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState<string>(() => initialParams.query ?? '');
  const [sort, setSortState] = useState<ArticleSortOption>(() => parseCatalogSort(initialParams.sort));
  const [page, setPageState] = useState<number>(() => Math.max(1, initialParams.page ?? 1));
  const [limit, setLimitState] = useState<number>(() =>
    parseCatalogPageSize(initialParams.limit ? String(initialParams.limit) : undefined),
  );
  const [viewMode, setViewMode] = useState<ArticleViewMode>(ArticleViewMode.GRID);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const [catalog, setCatalog] = useState<PublicArticleCatalogResponse>(initialCatalog);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const requestParams = useMemo(
    () =>
      buildCatalogRequestParams({
        page,
        limit,
        sort,
        q: debouncedQuery,
        filters,
        categories,
        topics,
        focusedTopicId,
      }),
    [page, limit, sort, debouncedQuery, filters, categories, topics, focusedTopicId],
  );

  const requestSignature = useMemo(
    () => buildArticleCatalogSearchParams(requestParams).toString(),
    [requestParams],
  );
  const initialSignatureRef = useRef<string>(requestSignature);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery((prev) => {
        if (prev === queryInput) return prev;
        setPageState(1);
        return queryInput;
      });
    }, 260);
    return () => clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    if (reloadTick === 0 && requestSignature === initialSignatureRef.current) {
      return;
    }
    initialSignatureRef.current = '__fetched__';
    let alive = true;
    void Promise.resolve().then(() => {
      if (!alive) return;
      setLoading(true);
      setError(null);
    });

    const paramsObj = Object.fromEntries(buildArticleCatalogSearchParams(requestParams).entries());
    api
      .get<{ data?: PublicArticleCatalogResponse } & Partial<PublicArticleCatalogResponse>>(
        '/public/articles/catalog',
        { params: paramsObj },
      )
      .then((res) => {
        if (!alive) return;
        const payload = res.data?.data ?? (res.data as PublicArticleCatalogResponse);
        if (payload && Array.isArray(payload.items)) {
          setCatalog(payload);
        }
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(extractErrorMessage(err, 'Không tải được danh sách bài viết lịch sử.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [requestParams, requestSignature, reloadTick]);

  // Đồng bộ URL thanh địa chỉ bằng History API (0ms, không kích hoạt Next.js Server Component re-render lặp).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextUrl = buildBrowserUrl({
      filters,
      categories,
      topics,
      focusedTopicId,
      q: debouncedQuery,
      sort,
      page,
      limit,
    });
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [filters, categories, topics, focusedTopicId, debouncedQuery, sort, page, limit]);

  const rows: ArticleRow[] = useMemo(
    () => catalog.items.map((a) => ({ item: mapSummaryToLibraryItem(a, categories) })),
    [catalog.items, categories],
  );

  const branchCategoryCounts = useMemo(
    () => computeBranchCategoryCounts(categories, catalog.facets.categoryCounts),
    [categories, catalog.facets.categoryCounts],
  );

  const tocNodes = useMemo(
    () => buildServerTopicTocNodes(topics, catalog.facets.topicCounts),
    [topics, catalog.facets.topicCounts],
  );

  const totalTopicArticles = useMemo(
    () => Object.values(catalog.facets.topicCounts).reduce((s, n) => s + n, 0),
    [catalog.facets.topicCounts],
  );

  const scrollToListTop = useCallback(() => {
    document.getElementById('el-content-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleRemoveCategoryChip = useCallback(
    (categoryId: string) => {
      setFilters((prev) => {
        if (prev.rootCategoryId === categoryId && prev.subCategoryIds.length === 0) {
          return selectRootCategory(prev, categoryId);
        }
        return toggleSubCategorySelection(prev, categoryId, categories);
      });
      setPageState(1);
    },
    [categories],
  );

  const handleToggleSimpleFilter = useCallback((key: ArticleFilterKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: toggleValue(prev[key], value) }));
    setPageState(1);
  }, []);

  const handleApplyDialogFilters = useCallback((next: ArticleFilters) => {
    setFilters(next);
    setPageState(1);
    setSheetOpen(false);
  }, []);

  const handleSelectTocNode = useCallback(
    (tocNodeId: string) => {
      const stripped = tocNodeId.replace(/^topic-(?:leaf-)?/, '');
      setFocusedTopicId(stripped || null);
      setPageState(1);
      scrollToListTop();
    },
    [scrollToListTop],
  );

  const handleChangeSort = useCallback((nextSort: ArticleSortOption) => {
    setSortState(nextSort);
    setPageState(1);
  }, []);

  const handleChangePageSize = useCallback((nextLimit: number) => {
    setLimitState(nextLimit);
    setPageState(1);
  }, []);

  const handleChangePage = useCallback(
    (nextPage: number) => {
      const clamped = Math.max(1, Math.min(nextPage, catalog.totalPages));
      setPageState(clamped);
      scrollToListTop();
    },
    [catalog.totalPages, scrollToListTop],
  );

  const resetAll = useCallback(() => {
    setQueryInput('');
    setDebouncedQuery('');
    setFilters(EMPTY_ARTICLE_FILTERS);
    setFocusedTopicId(null);
    setPageState(1);
  }, []);

  const retryLoad = useCallback(() => setReloadTick((n) => n + 1), []);

  const activeFilterCount =
    countActiveArticleFilters(filters, categories) + (focusedTopicId ? 1 : 0);

  return {
    catalog,
    rows,
    loading,
    error,
    retryLoad,
    filters,
    focusedTopicId,
    setFocusedTopicId,
    queryInput,
    setQueryInput,
    sort,
    page,
    limit,
    viewMode,
    setViewMode,
    sheetOpen,
    setSheetOpen,
    tocOpen,
    setTocOpen,
    branchCategoryCounts,
    tocNodes,
    totalTopicArticles,
    activeFilterCount,
    handleRemoveCategoryChip,
    handleToggleSimpleFilter,
    handleApplyDialogFilters,
    handleSelectTocNode,
    handleChangeSort,
    handleChangePageSize,
    handleChangePage,
    resetAll,
  };
}
