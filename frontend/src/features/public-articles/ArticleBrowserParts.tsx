'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Landmark,
  MapPin,
  Quote,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { PublicContentFilterSections } from '@/components/filters/PublicContentFilterSections';
import { RemoteImage } from '@/components/common/CommonUi';
import {
  PUBLIC_ROUTES,
  type ArticleCatalogTagFacet,
  type PublicCategory,
} from '@/services/public/public-content.service';
import {
  ARTICLE_PAGE_SIZE_OPTIONS,
  ArticleMetaIconKey,
  getArticleCardMetaStrategy,
  type ArticleFilters,
  type ArticleRow,
} from './article-library.strategy';

const META_ICON_MAP: Record<ArticleMetaIconKey, LucideIcon> = {
  [ArticleMetaIconKey.MAP_PIN]: MapPin,
  [ArticleMetaIconKey.USERS]: Users,
  [ArticleMetaIconKey.LANDMARK]: Landmark,
  [ArticleMetaIconKey.HISTORY]: History,
  [ArticleMetaIconKey.TAG]: Tag,
  [ArticleMetaIconKey.QUOTE]: Quote,
};

/** Nội dung hộp thoại Bộ lọc nâng cao — tái sử dụng 100% PublicContentFilterSections. */
export function ArticleFilterDialogSections({
  draft,
  setDraft,
  categories,
  branchCategoryCounts,
  tagOptions,
}: {
  draft: ArticleFilters;
  setDraft: (update: (d: ArticleFilters) => ArticleFilters) => void;
  categories: PublicCategory[];
  branchCategoryCounts: Map<string, number>;
  tagOptions: ArticleCatalogTagFacet[];
}) {
  return (
    <PublicContentFilterSections
      draft={draft}
      setDraft={setDraft}
      categories={categories}
      branchCategoryCounts={branchCategoryCounts}
      tagOptions={tagOptions}
    />
  );
}

const ELLIPSIS_TOKEN = -1;

function buildPaginationTokens(page: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 3);
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const tokens: number[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      tokens.push(ELLIPSIS_TOKEN);
    }
    tokens.push(sorted[i]);
  }
  return tokens;
}

/** Thanh phân trang số chuẩn thư viện kèm chọn số bài tối đa mỗi trang (24 / 48 / 96) và ô nhảy trang. */
export function ArticleCatalogPagination({
  page,
  limit,
  total,
  totalPages,
  onChangePage,
  onChangeLimit,
}: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onChangePage: (page: number) => void;
  onChangeLimit: (limit: number) => void;
}) {
  const [jumpInput, setJumpInput] = useState('');
  if (total === 0) return null;

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);
  const tokens = buildPaginationTokens(page, totalPages);

  const submitJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(jumpInput, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= totalPages) {
      onChangePage(parsed);
      setJumpInput('');
    }
  };

  return (
    <nav
      aria-label="Phân trang bài viết"
      className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E5F55]">
        <span>
          Hiển thị <strong className="text-[#2D1A10]">{startIdx.toLocaleString('vi-VN')}</strong>–
          <strong className="text-[#2D1A10]">{endIdx.toLocaleString('vi-VN')}</strong> /{' '}
          <strong className="text-[#7A1F24]">{total.toLocaleString('vi-VN')}</strong> bài viết
        </span>

        <div className="inline-flex items-center gap-1 rounded-xl border border-[#E2D5B8] bg-white px-2 py-1">
          <span className="px-1 font-semibold text-[#7A6B57]">Mỗi trang:</span>
          {ARTICLE_PAGE_SIZE_OPTIONS.map((opt) => {
            const active = opt === limit;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChangeLimit(opt)}
                aria-pressed={active}
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                  active ? 'bg-[#7A1F24] text-white' : 'text-[#6E5F55] hover:bg-[#F5EEDC]'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onChangePage(page - 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E2D5B8] bg-white px-2.5 py-1.5 text-xs font-bold text-[#2D1A10] disabled:opacity-40 cursor-pointer hover:border-[#B8893F]"
          >
            <ChevronLeft size={14} /> Trước
          </button>

          {tokens.map((tok, idx) =>
            tok === ELLIPSIS_TOKEN ? (
              <span key={`dots-${idx}`} className="px-1.5 text-xs font-bold text-[#7A6B57]">
                …
              </span>
            ) : (
              <button
                key={tok}
                type="button"
                onClick={() => onChangePage(tok)}
                aria-current={tok === page ? 'page' : undefined}
                className={`min-w-8 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  tok === page
                    ? 'border-[#7A1F24] bg-[#7A1F24] text-white shadow-2xs'
                    : 'border-[#E2D5B8] bg-white text-[#2D1A10] hover:border-[#B8893F]'
                }`}
              >
                {tok}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onChangePage(page + 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E2D5B8] bg-white px-2.5 py-1.5 text-xs font-bold text-[#2D1A10] disabled:opacity-40 cursor-pointer hover:border-[#B8893F]"
          >
            Tiếp <ChevronRight size={14} />
          </button>

          {totalPages > 7 && (
            <form onSubmit={submitJump} className="ml-1 inline-flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder={`1–${totalPages}`}
                aria-label="Nhập số trang cần đến"
                className="w-16 rounded-xl border border-[#E2D5B8] bg-white px-2 py-1.5 text-center text-xs font-semibold text-[#2D1A10]"
              />
              <button
                type="submit"
                className="rounded-xl border border-[#E2D5B8] bg-white px-2.5 py-1.5 text-xs font-bold text-[#7A1F24] hover:border-[#B8893F] cursor-pointer"
              >
                Đi
              </button>
            </form>
          )}
        </div>
      )}
    </nav>
  );
}

export function ArticleGridCard({ row: { item } }: { row: ArticleRow }) {
  const strategy = getArticleCardMetaStrategy(item.kind);
  const href = PUBLIC_ROUTES.ARTICLE(item.slug);
  const primaryBadge = strategy.primaryBadgeOf(item);
  const locationBadge = strategy.locationBadgeOf(item);
  const primaryMeta = strategy.metaRowsOf(item)[0] ?? null;
  const PrimaryMetaIcon = primaryMeta ? META_ICON_MAP[primaryMeta.icon] : null;

  return (
    <article className="el-card">
      <Link href={href} className="el-card-media block">
        {item.imageUrl ? (
          <RemoteImage src={item.imageUrl} alt={item.title} loading="lazy" />
        ) : (
          <div className="el-card-fallback-media">
            <Landmark size={32} className="opacity-30" />
          </div>
        )}
        {(item.dateLabel || locationBadge) && (
          <span className="el-card-year-badge">
            {item.dateLabel ? <Calendar size={12} /> : <MapPin size={12} />}
            {item.dateLabel ?? locationBadge}
          </span>
        )}
      </Link>

      <div className="el-card-body">
        {primaryBadge && (
          <div className="el-card-meta-top">
            <span className="el-tag">{primaryBadge}</span>
          </div>
        )}

        <h3 className="el-card-title">
          <Link href={href}>{item.title}</Link>
        </h3>

        {item.summary && <p className="el-card-desc">{item.summary}</p>}

        <div className="el-card-footer flex items-center justify-between gap-2">
          {primaryMeta && PrimaryMetaIcon ? (
            <span className="el-card-entity-item min-w-0 flex-1 text-xs text-[var(--muted)]" title={primaryMeta.text}>
              <PrimaryMetaIcon size={12} className="shrink-0" />
              <span className="truncate">{primaryMeta.text}</span>
            </span>
          ) : (
            <span />
          )}
          <Link href={href} className="el-card-link shrink-0">
            <span>Đọc</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ArticleListItem({ row: { item } }: { row: ArticleRow }) {
  const strategy = getArticleCardMetaStrategy(item.kind);
  const href = PUBLIC_ROUTES.ARTICLE(item.slug);
  const primaryBadge = strategy.primaryBadgeOf(item);
  const metaRows = strategy.metaRowsOf(item);

  return (
    <li className="el-list-item">
      <div className="el-list-year">
        {item.dateLabel && <strong>{item.dateLabel}</strong>}
        {primaryBadge && <span className="el-tag">{primaryBadge}</span>}
      </div>
      <div className="el-main">
        <Link href={href}>{item.title}</Link>
        {item.summary && <p className="el-list-desc">{item.summary}</p>}
        {metaRows.length > 0 && (
          <div className="el-meta">
            {metaRows.map((meta, idx) => {
              const Icon = META_ICON_MAP[meta.icon];
              return (
                <span key={`${meta.icon}-${idx}`}>
                  <Icon size={12} />
                  {meta.text}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link href={href} className="el-go" aria-label={`Đọc ${item.title}`}>
          <ArrowRight size={16} />
        </Link>
      </div>
    </li>
  );
}
