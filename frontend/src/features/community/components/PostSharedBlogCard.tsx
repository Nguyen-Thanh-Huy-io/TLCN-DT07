'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ExternalLink } from 'lucide-react';
import type { SharedBlogEmbed } from '../api';

interface PostSharedBlogCardProps {
  sharedBlog: SharedBlogEmbed;
  authorName: string;
  onTrackView: () => void;
}

export function PostSharedBlogCard({
  sharedBlog,
  authorName,
  onTrackView,
}: PostSharedBlogCardProps) {
  const [sharedImgError, setSharedImgError] = useState(false);

  const sharedCoverImage =
    !sharedImgError &&
    sharedBlog.coverImageUrl &&
    !sharedBlog.coverImageUrl.includes('cld-sample-6.jpg')
      ? sharedBlog.coverImageUrl
      : null;

  return (
    <Link
      href={`/blog/${sharedBlog.slug}`}
      onClick={onTrackView}
      className="group mt-4 block overflow-hidden rounded-[10px] border border-[#D8C8AA] bg-[#F4ECDA] transition-colors hover:border-[#8A5A19]"
    >
      {sharedCoverImage ? (
        <div className="relative aspect-[16/8.5] max-h-[340px] w-full overflow-hidden bg-[#EADBC0]">
          <Image
            src={sharedCoverImage}
            alt={sharedBlog.title}
            width={800}
            height={340}
            unoptimized
            onError={() => setSharedImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-[5px] bg-[#14233F]/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#FAF5E6]">
            <BookOpen size={12} />
            <span>HISGO BLOG</span>
          </span>
        </div>
      ) : (
        <div className="relative flex h-36 w-full items-center justify-between overflow-hidden bg-[#2C1E16] px-6 py-5 text-[#FAF5E6]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#FAF5E6]">
              <BookOpen size={12} />
              <span>HISGO BLOG · CHUYÊN KHẢO LỊCH SỬ</span>
            </span>
            <p className="mt-2 line-clamp-1 text-[15px] font-medium text-[#F5EEDC]/90">
              Tác giả: {sharedBlog.authorName || authorName}
            </p>
          </div>
          <ExternalLink
            size={24}
            className="shrink-0 opacity-75 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      )}

      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A5A19]">
          <span>
            HISGO.VN/BLOG · {sharedBlog.authorName ? `TÁC GIẢ: ${sharedBlog.authorName}` : 'CHUYÊN KHẢO'}
          </span>
          <span className="inline-flex items-center gap-1 text-[#7A1F24] group-hover:underline">
            <span>Đọc toàn văn trên Blog</span>
            <ExternalLink size={12} />
          </span>
        </div>

        <h4 className="mt-1.5 text-[18px] font-bold leading-snug text-[#14233F] transition-colors group-hover:text-[#7A1F24] md:text-[20px]">
          {sharedBlog.title}
        </h4>

        {sharedBlog.excerpt ? (
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-[#5C4E3C]">
            {sharedBlog.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
