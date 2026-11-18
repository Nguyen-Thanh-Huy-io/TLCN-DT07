import { Footer } from '@/components/hisgo/Footer';
import { Header } from '@/components/hisgo/Header';
import { ArticleBrowser } from '@/features/public-articles/ArticleBrowser';
import { fetchArticleLibrary } from '@/services/entities/landing.service';
import { fetchCategories, fetchTopics } from '@/services/public/public-content.service';
import '@/components/timeline/sk-timeline.css';

export default async function BaiVietArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ 'chuyen-muc'?: string; q?: string }>;
}) {
  const [{ 'chuyen-muc': activeCategorySlug, q }, articles, categories, topics] = await Promise.all([
    searchParams,
    fetchArticleLibrary(),
    fetchCategories(),
    fetchTopics(),
  ]);

  return (
    <main>
      <Header activeTab="bai-viet" />
      <ArticleBrowser
        key={`${activeCategorySlug ?? ''}:${q ?? ''}`}
        articles={articles}
        categories={categories}
        topics={topics}
        initialCategorySlug={activeCategorySlug}
        initialQuery={q}
      />
      <Footer />
    </main>
  );
}
