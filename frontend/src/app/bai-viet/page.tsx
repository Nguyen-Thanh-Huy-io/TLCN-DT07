import { Footer } from '@/components/hisgo/Footer';
import { Header } from '@/components/hisgo/Header';
import { ArticleBrowser } from '@/features/public-articles/ArticleBrowser';
import {
  buildInitialCategorySelection,
  parseCatalogPageSize,
  parseCatalogSort,
  resolveActiveTopicIds,
  resolveEffectiveCategoryIds,
} from '@/features/public-articles/article-library.strategy';
import {
  fetchArticleCatalog,
  fetchCategories,
  fetchTopics,
} from '@/services/public/public-content.service';
import '@/components/timeline/sk-timeline.css';

interface BaiVietSearchParams {
  'chuyen-muc'?: string;
  'chu-de'?: string;
  q?: string;
  tag?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export default async function BaiVietArchivePage({
  searchParams,
}: {
  searchParams: Promise<BaiVietSearchParams>;
}) {
  const resolved = await searchParams;
  const categorySlug = resolved['chuyen-muc'];
  const topicSlug = resolved['chu-de'];
  const q = resolved.q;
  const tag = resolved.tag;
  const sort = parseCatalogSort(resolved.sort);
  const page = Math.max(1, Number.parseInt(resolved.page ?? '1', 10) || 1);
  const limit = parseCatalogPageSize(resolved.limit);

  const [categories, topics] = await Promise.all([fetchCategories(), fetchTopics()]);

  const initialCatSelection = buildInitialCategorySelection(categorySlug, categories);
  const categoryIds = resolveEffectiveCategoryIds(initialCatSelection, categories);

  const focusedTopicId = topicSlug
    ? (topics.find((t) => t.slug === topicSlug)?.id ?? null)
    : null;
  const topicIds = resolveActiveTopicIds(topics, focusedTopicId);

  const initialCatalog = await fetchArticleCatalog({
    page,
    limit,
    sort,
    q,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    topicIds: topicIds.length > 0 ? topicIds : undefined,
    tags: tag?.trim() ? [tag.trim()] : undefined,
  });

  const remountKey = [categorySlug ?? '', topicSlug ?? '', tag ?? ''].join(':');

  return (
    <main>
      <Header activeTab="bai-viet" />
      <ArticleBrowser
        key={remountKey}
        initialCatalog={initialCatalog}
        categories={categories}
        topics={topics}
        initialParams={{
          categorySlug,
          topicSlug,
          query: q,
          tag,
          sort,
          page,
          limit,
        }}
      />
      <Footer />
    </main>
  );
}
