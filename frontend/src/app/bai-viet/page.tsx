import { Footer } from '@/components/hisgo/Footer';
import { Header } from '@/components/hisgo/Header';
import { ArticleBrowser } from '@/features/public-articles/ArticleBrowser';
import { fetchArticleLibrary } from '@/services/entities/landing.service';
import { fetchCategories, fetchTopics } from '@/services/public/public-content.service';
import '@/components/timeline/sk-timeline.css';

export default async function BaiVietArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ 'chuyen-muc'?: string; q?: string; tag?: string }>;
}) {
  const resolved = await searchParams;
  const activeCategorySlug = resolved['chuyen-muc'];
  const q = resolved.q;
  const activeTag = resolved.tag;
  const [articles, categories, topics] = await Promise.all([
    fetchArticleLibrary({ tag: activeTag, q }),
    fetchCategories(),
    fetchTopics(),
  ]);

  return (
    <main>
      <Header activeTab="bai-viet" />
      <ArticleBrowser
        key={`${activeCategorySlug ?? ''}:${q ?? ''}:${activeTag ?? ''}`}
        articles={articles}
        categories={categories}
        topics={topics}
        initialCategorySlug={activeCategorySlug}
        initialQuery={q}
        initialTag={activeTag}
      />
      <Footer />
    </main>
  );
}
