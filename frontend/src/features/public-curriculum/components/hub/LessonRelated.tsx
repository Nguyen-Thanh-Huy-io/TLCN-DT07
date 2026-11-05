'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, GitCommitVertical, Link2 } from 'lucide-react';
import { loadPublicCatalog } from '@/features/search/search.service';
import type { SearchSource } from '@/features/search/search-index';
import { PUBLIC_ROUTES, type PublicArticleSummary } from '@/services/public/public-content.service';

const MAX_PER_GROUP = 6;
/** Tên quá ngắn dễ khớp nhầm khi dò trong văn bản. */
const MIN_MENTION_LENGTH = 6;
/** Thuộc tính HTML do khối Nhân vật / Sự kiện ghi id bài viết đã liên kết. */
const ARTICLE_ID_ATTRS = ['data-article-id', 'data-entity-id', 'data-event-id'];

const idsFromHtml = (html: string, attr: string) =>
  [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map((m) => m[1]).filter(Boolean);

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

/**
 * Bài viết & dòng thời gian liên quan tới bài học: ưu tiên bài đã gắn qua khối, sau đó dò
 * tên bài được nhắc trong nội dung (giữ dấu, khớp nguyên từ để "Phạm Tu" không dính "Phạm Tuân").
 */
function findRelated(html: string, catalog: SearchSource) {
  const text = stripHtml(html).normalize('NFC').toLocaleLowerCase('vi');
  const mentioned = (name: string) => {
    if (name.length < MIN_MENTION_LENGTH) return false;
    const needle = name.normalize('NFC').toLocaleLowerCase('vi').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}])${needle}(?=$|[^\\p{L}\\p{M}\\p{N}])`, 'u').test(text);
  };

  const linkedIds = new Set(ARTICLE_ID_ATTRS.flatMap((attr) => idsFromHtml(html, attr)));
  const articles = catalog.articles.filter((a) => linkedIds.has(a.id) || mentioned(a.title));
  const articleSlugs = new Set(articles.map((a) => a.slug));
  const timelines = catalog.timelines
    .filter((t) => t.nodes.some((n) => n.article && articleSlugs.has(n.article.slug)))
    .slice(0, 3);

  // Nhóm theo chuyên mục (Nhân vật, Sự kiện...) để hiển thị gọn.
  const groups = new Map<string, PublicArticleSummary[]>();
  for (const a of articles) {
    const key = a.category?.name ?? 'Bài viết';
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return {
    groups: [...groups.entries()].map(([name, items]) => ({ name, items: items.slice(0, MAX_PER_GROUP) })),
    timelines,
  };
}

export function LessonRelated({ html, compact = false }: { html: string; compact?: boolean }) {
  const [catalog, setCatalog] = useState<SearchSource | null>(null);

  useEffect(() => {
    let alive = true;
    loadPublicCatalog().then((c) => alive && setCatalog(c));
    return () => {
      alive = false;
    };
  }, []);

  const related = useMemo(() => (catalog && html ? findRelated(html, catalog) : null), [catalog, html]);
  if (!related || related.groups.length + related.timelines.length === 0) return null;

  const heading = 'text-xs font-bold uppercase tracking-[0.14em] text-lh-brand';
  const item = 'flex gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-lh-surface-2';

  return (
    <section
      aria-label="Thông tin liên quan"
      className={compact ? 'grid gap-5' : 'mt-8 grid gap-6 rounded-2xl border border-lh-line bg-lh-surface p-5 sm:grid-cols-2'}
    >
      <div className={`flex items-center gap-2 ${heading} ${compact ? '' : 'sm:col-span-2'}`}>
        <Link2 className="size-4" /> Thông tin liên quan
      </div>

      {related.groups.map((group) => (
        <div key={group.name}>
          <div className="mb-1 text-xs font-semibold text-lh-muted">{group.name}</div>
          {group.items.map((a) => (
            <Link key={a.id} href={PUBLIC_ROUTES.ARTICLE(a.slug)} className={item}>
              {a.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.coverImageUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
              ) : (
                <FileText className="mt-0.5 size-4 shrink-0 text-lh-gold" />
              )}
              <span className="min-w-0">
                <span className="block font-semibold leading-snug text-lh-ink">{a.title}</span>
                {a.dateLabel && <span className="text-xs text-lh-muted">{a.dateLabel}</span>}
              </span>
            </Link>
          ))}
        </div>
      ))}

      {related.timelines.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold text-lh-muted">Dòng thời gian</div>
          {related.timelines.map((t) => (
            <Link key={t.id} href={PUBLIC_ROUTES.TIMELINE(t.slug)} className={item}>
              <GitCommitVertical className="mt-0.5 size-4 shrink-0 text-lh-gold" />
              <span className="block font-semibold leading-snug text-lh-ink">{t.title}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
