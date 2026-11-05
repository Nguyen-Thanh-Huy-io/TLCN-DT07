import React from 'react';
import Link from 'next/link';
import { PublicNotFound, PublicPageHeading, PublicShell } from '@/components/hisgo/PublicShell';
import { fetchCategory, PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { ArticleBrowser } from './ArticleBrowser';

/**
 * Trang một chuyên mục (Server Component). Dùng cho /chuyen-muc/[slug] và các lối tắt
 * /nhan-vat, /su-kien, /di-tich, /trieu-dai (slug chuyên mục cố định).
 */
export async function CategoryPage({ slug }: { slug: string }) {
  const category = await fetchCategory(slug);
  if (!category) {
    return (
      <PublicShell>
        <PublicNotFound
          eyebrow="Chuyên mục"
          title="Không tìm thấy chuyên mục"
          message={`Chuyên mục “${slug}” chưa được tạo trong CMS.`}
        />
      </PublicShell>
    );
  }

  return (
    <PublicShell activeTab={category.slug}>
      <PublicPageHeading
        eyebrow={category.parent ? category.parent.name : 'Chuyên mục'}
        title={category.name}
        description={category.description}
      >
        {category.children.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={PUBLIC_ROUTES.CATEGORY(child.slug)}
                className="rounded-full border border-[#C9A27E] bg-white px-4 py-1.5 text-sm font-semibold text-[#8C2D19] hover:bg-[#F5E6DC]"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </PublicPageHeading>
      <ArticleBrowser articles={category.articles} emptyText="Chuyên mục chưa có bài viết đã xuất bản." />
    </PublicShell>
  );
}
