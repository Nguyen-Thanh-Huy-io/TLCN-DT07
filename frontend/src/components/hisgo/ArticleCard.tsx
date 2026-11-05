import React from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { PUBLIC_ROUTES, type PublicArticleSummary } from '@/services/public/public-content.service';

/** Thẻ bài viết dùng chung (danh sách chuyên mục, tag, bài liên quan, trang chủ). */
export function ArticleCard({ article, compact = false }: { article: PublicArticleSummary; compact?: boolean }) {
  return (
    <Link
      href={PUBLIC_ROUTES.ARTICLE(article.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A27E] hover:shadow-md"
    >
      {!compact && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#5B2434] via-[#8C3B2A] to-[#D99B66]">
          {article.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-6 text-center font-serif text-2xl font-bold text-white/90">
              {article.title}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider text-[#8C6239]">
          {article.category && <span>{article.category.name}</span>}
          {article.dateLabel && (
            <span className="inline-flex items-center gap-1 normal-case tracking-normal text-stone-500">
              <CalendarDays size={12} />
              {article.dateLabel}
            </span>
          )}
        </div>
        <h3 className="font-serif text-lg font-bold leading-snug text-[#2D1A10] group-hover:text-[#8C2D19]">
          {article.title}
        </h3>
        {article.summary && <p className="line-clamp-3 text-sm leading-relaxed text-stone-600">{article.summary}</p>}
        {article.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
