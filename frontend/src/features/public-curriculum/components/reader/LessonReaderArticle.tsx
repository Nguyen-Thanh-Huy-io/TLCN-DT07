'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { sanitizeRichHtml } from '@/utils/sanitize-html';
import { ResourceLinkBlockData } from '@/features/lessons/types/block-builder.types';

interface LessonReaderArticleProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  compiledHtml: string;
  resourceLinks: ResourceLinkBlockData[];
}

export function LessonReaderArticle({
  contentRef,
  compiledHtml,
  resourceLinks,
}: LessonReaderArticleProps) {
  return (
    <article className="rounded-2xl border border-lh-line bg-lh-surface p-6 md:p-9">
      <div
        ref={contentRef}
        className="tiptap-content-box !p-0 leading-relaxed text-lh-ink"
        dangerouslySetInnerHTML={{
          __html: sanitizeRichHtml(
            compiledHtml ||
              '<p class="italic">Nội dung bài học đang được biên tập viên cập nhật.</p>',
          ),
        }}
      />
      {resourceLinks.length > 0 && (
        <div className="mt-8 border-t border-lh-line pt-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-lh-ink">
            Sử liệu & liên kết tham khảo
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {resourceLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-lh-line bg-lh-surface-2 p-4 transition hover:border-lh-brand/40"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold text-lh-brand">
                  {link.title} <ExternalLink className="size-3.5" />
                </span>
                {link.note && <p className="mt-1 text-xs leading-5 text-lh-muted">{link.note}</p>}
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
