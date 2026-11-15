import Link from 'next/link';
import { PublicPageHeading, PublicShell } from '@/components/hisgo/PublicShell';
import { ArticleBrowser } from '@/features/public-articles/ArticleBrowser';
import { fetchArticles, fetchCategories, PUBLIC_ROUTES } from '@/services/public/public-content.service';

export default async function BaiVietArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ 'chuyen-muc'?: string; q?: string }>;
}) {
  const { 'chuyen-muc': activeCategorySlug, q } = await searchParams;
  const [categories, articles] = await Promise.all([
    fetchCategories(),
    fetchArticles({ category: activeCategorySlug || undefined, q: q || undefined }),
  ]);

  const activeCategory = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug) ?? null
    : null;

  return (
    <PublicShell activeTab="bai-viet">
      <PublicPageHeading
        eyebrow="Thư viện tri thức"
        title={activeCategory ? activeCategory.name : 'Tất cả bài viết lịch sử'}
        description={
          activeCategory?.description ??
          'Khám phá hệ thống bài viết lịch sử theo chuyên mục, niên đại và chủ đề.'
        }
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={PUBLIC_ROUTES.ARTICLES}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              !activeCategorySlug
                ? 'border-[#8C2D19] bg-[#8C2D19] text-white'
                : 'border-[#C9A27E] bg-white text-[#8C2D19] hover:bg-[#F5E6DC]'
            }`}
          >
            Tất cả
          </Link>
          {categories.map((cat) => {
            const active = activeCategorySlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`${PUBLIC_ROUTES.ARTICLES}?chuyen-muc=${encodeURIComponent(cat.slug)}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  active
                    ? 'border-[#8C2D19] bg-[#8C2D19] text-white'
                    : 'border-[#C9A27E] bg-white text-[#8C2D19] hover:bg-[#F5E6DC]'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </PublicPageHeading>
      <ArticleBrowser
        articles={articles}
        emptyText="Chưa có bài viết đã xuất bản phù hợp với chuyên mục này."
      />
    </PublicShell>
  );
}
