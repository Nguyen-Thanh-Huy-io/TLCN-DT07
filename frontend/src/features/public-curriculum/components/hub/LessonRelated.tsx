'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Landmark, Link2, UserRound } from 'lucide-react';
import { loadPublicCatalog } from '@/features/search/search.service';
import { formatYear, shortPeriodName, type SearchSource } from '@/features/search/search-index';

const MAX_PER_GROUP = 6;
/** Tên quá ngắn dễ khớp nhầm khi dò trong văn bản. */
const MIN_MENTION_LENGTH = 6;

const idsFromHtml = (html: string, attr: string) =>
  [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map((m) => m[1]).filter(Boolean);

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

interface Related {
  events: SearchSource['events'];
  figures: SearchSource['figures'];
  periods: SearchSource['periods'];
}

/**
 * Sự kiện, nhân vật, thời kỳ liên quan tới bài học: ưu tiên các khối đã gắn trong bài
 * (khối sự kiện / nhân vật), sau đó dò tên được nhắc tới trong nội dung.
 */
function findRelated(html: string, catalog: SearchSource): Related {
  // So khớp GIỮ dấu và đúng nguyên từ: bỏ dấu / khớp chuỗi con làm "Phạm Tu" dính vào
  // "Phạm Tuân", "Lữ Gia" dính vào cụm khác.
  const text = stripHtml(html).normalize('NFC').toLocaleLowerCase('vi');
  const mentioned = (name: string) => {
    if (name.length < MIN_MENTION_LENGTH) return false;
    const needle = name.normalize('NFC').toLocaleLowerCase('vi').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}])${needle}(?=$|[^\\p{L}\\p{M}\\p{N}])`, 'u').test(text);
  };

  const eventIds = new Set(idsFromHtml(html, 'data-event-id'));
  const entityIds = new Set(idsFromHtml(html, 'data-entity-id'));

  const events = catalog.events.filter((e) => eventIds.has(e.id) || mentioned(e.title));
  const figures = catalog.figures.filter((f) => entityIds.has(f.id) || mentioned(f.name));

  const periodSlugs = new Set([...events.map((e) => e.periodSlug), ...figures.map((f) => f.periodSlug)].filter(Boolean));
  const periods = catalog.periods.filter((p) => periodSlugs.has(p.slug));

  return {
    events: events.sort((a, b) => a.startYear - b.startYear).slice(0, MAX_PER_GROUP),
    figures: figures.slice(0, MAX_PER_GROUP),
    periods: periods.slice(0, 3),
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
  if (!related || related.events.length + related.figures.length + related.periods.length === 0) return null;

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

      {related.periods.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold text-lh-muted">Thời kỳ</div>
          {related.periods.map((p) => (
            <Link key={p.id} href={`/giai-doan/${p.slug}`} className={item}>
              <Landmark className="mt-0.5 size-4 shrink-0 text-lh-gold" />
              <span className="min-w-0">
                <span className="block font-semibold leading-snug text-lh-ink">{shortPeriodName(p.name)}</span>
                <span className="text-xs text-lh-muted">{p.timeLabel}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {related.events.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold text-lh-muted">Sự kiện</div>
          {related.events.map((e) => (
            <Link key={e.id} href={e.slug ? `/su-kien/${e.slug}` : '/su-kien'} className={item}>
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-lh-gold" />
              <span className="min-w-0">
                <span className="block font-semibold leading-snug text-lh-ink">{e.title}</span>
                <span className="text-xs text-lh-muted">{formatYear(e.startYear)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {related.figures.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold text-lh-muted">Nhân vật</div>
          {related.figures.map((f) => (
            <Link key={f.id} href={`/nhan-vat/${f.slug}`} className={item}>
              {f.imageUrl ? (
                <img src={f.imageUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
              ) : (
                <UserRound className="mt-0.5 size-4 shrink-0 text-lh-gold" />
              )}
              <span className="min-w-0">
                <span className="block font-semibold leading-snug text-lh-ink">{f.name}</span>
                {f.tagline && <span className="line-clamp-1 text-xs text-lh-muted">{f.tagline}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
