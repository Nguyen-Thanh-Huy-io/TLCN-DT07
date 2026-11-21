'use client';

import Link from 'next/link';
import { BookOpen, CalendarDays, ScrollText } from 'lucide-react';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { formatPublishedDate } from '@/utils/common';
import type { PublishedWorkArticle, PublishedWorkLesson } from '../api';

export interface ProfilePublishedWorksListProps {
  articles: PublishedWorkArticle[];
  lessons: PublishedWorkLesson[];
  searchQuery: string;
  onClearSearch: () => void;
}

export function ProfilePublishedWorksList({
  articles,
  lessons,
  searchQuery,
  onClearSearch,
}: ProfilePublishedWorksListProps) {
  const totalCount = articles.length + lessons.length;

  if (totalCount === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
        <h2 className="text-[16px] font-semibold text-[#14233F]">
          Chưa có bài viết hoặc bài học nào được tìm thấy
        </h2>
        <p className="mt-1.5 text-[14px] text-[#5C4E3C]">
          {searchQuery
            ? 'Hãy thử xóa từ khóa tìm kiếm để xem toàn bộ tác phẩm biên soạn.'
            : 'Tác giả này chưa xuất bản bài viết lịch sử hoặc bài học nào.'}
        </p>
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-3.5 h-9 rounded-[6px] border border-[#D8C8AA] bg-[#F1E6D0] px-4 text-[13px] font-medium text-[#14233F]"
          >
            Hiển thị toàn bộ
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {articles.length > 0 && (
        <section className="rounded-[8px] border border-[#E3D6BE] bg-[#FDF9F0] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-[#14233F]">
            <ScrollText size={16} className="text-[#7A1F24]" />
            <span>Bài viết lịch sử ({articles.length})</span>
          </h2>
          <div className="divide-y divide-[#EDE3CE]">
            {articles.map((article) => {
              const dateText = formatPublishedDate(article.publishedAt ?? article.updatedAt);
              return (
                <Link
                  key={article.id}
                  href={PUBLIC_ROUTES.ARTICLE(article.slug)}
                  className="block py-3.5 first:pt-1 last:pb-1 transition-colors hover:bg-[#FAF5E6]/80"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#6E5D4B]">
                    {article.categoryName && (
                      <span className="rounded bg-[#F1E6D0] px-2 py-0.5 font-semibold text-[#7A1F24]">
                        {article.categoryName}
                      </span>
                    )}
                    {article.dateLabel && <span>{article.dateLabel}</span>}
                    {dateText && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        Đăng {dateText}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-[15px] font-bold text-[#14233F] hover:text-[#7A1F24]">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-[#5C4E3C]">{article.summary}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {lessons.length > 0 && (
        <section className="rounded-[8px] border border-[#E3D6BE] bg-[#FDF9F0] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-[#14233F]">
            <BookOpen size={16} className="text-[#7A1F24]" />
            <span>Bài học chuyên đề ({lessons.length})</span>
          </h2>
          <div className="divide-y divide-[#EDE3CE]">
            {lessons.map((lesson) => {
              const dateText = formatPublishedDate(lesson.publishedAt ?? lesson.updatedAt);
              return (
                <Link
                  key={lesson.id}
                  href={PUBLIC_ROUTES.LESSON(lesson.slug)}
                  className="block py-3.5 first:pt-1 last:pb-1 transition-colors hover:bg-[#FAF5E6]/80"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#6E5D4B]">
                    {lesson.topicName && (
                      <span className="rounded bg-[#E5EFE6] px-2 py-0.5 font-semibold text-[#1E4620]">
                        {lesson.topicName}
                      </span>
                    )}
                    {dateText && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        Đăng {dateText}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-[15px] font-bold text-[#14233F] hover:text-[#7A1F24]">
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-[#5C4E3C]">{lesson.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
