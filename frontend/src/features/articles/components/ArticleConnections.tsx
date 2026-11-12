'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, GitCommitVertical, Link2, Milestone, UserRound } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import type { ArticleItem, ArticleLinkView, CategoryItem } from '@/services/entities/article.service';
import { resolveCategoryKind, type ArticleKind } from '@/services/public/article-kind';
import {
  buildPersonLife,
  LIFE_SOURCE_LABELS,
  type LifeItem,
  type LifeMilestoneInput,
} from '@/features/articles/person-life';
import { LifeSource, LinkDirection, nodeDateLabel } from '@/features/articles/person-life';

/**
 * Các khung "nhận biết liên kết" trong tab Hồ sơ & liên kết — để biết rõ bài đang gắn với gì
 * trước khi xuất bản. Đọc dữ liệu ĐÃ LƯU (GET /articles/:id) + mốc đời riêng đang soạn.
 */

const box = 'space-y-3 rounded-xl border border-slate-200 bg-white p-5';
const SOURCE_TONE: Record<LifeItem['source'], string> = {
  LINK: 'bg-sky-50 text-sky-800',
  OWN_NODE: 'bg-amber-50 text-amber-800',
  MILESTONE: 'bg-violet-50 text-violet-800',
};

/** Liên kết 2 chiều của bài, lọc theo loại bài ở đầu kia. */
function linksOfKind(article: ArticleItem, categories: CategoryItem[], kind: ArticleKind) {
  const all: Array<ArticleLinkView & { direction: 'OUTGOING' | 'INCOMING' }> = [
    ...(article.linksOut ?? []).map((l) => ({ ...l, direction: 'OUTGOING' as const })),
    ...(article.linksIn ?? []).map((l) => ({ ...l, direction: 'INCOMING' as const })),
  ];
  return all.filter((l) => resolveCategoryKind(categories, l.article.category?.id) === kind);
}

/** Bài NHÂN VẬT: xem trước đúng dòng đời sẽ hiện ở /nhan-vat (cùng quy tắc với trang công khai). */
export function PersonLifePreview({
  article,
  categories,
  milestones,
  linksDirty,
}: {
  article: ArticleItem;
  categories: CategoryItem[];
  milestones: LifeMilestoneInput[];
  linksDirty: boolean;
}) {
  const life = buildPersonLife({
    ownNodes: article.timelineNodes ?? [],
    eventLinks: linksOfKind(article, categories, 'EVENT').map((l) => ({
      article: { ...l.article, nodes: l.article.timelineNodes ?? [] },
      label: l.label,
      direction: l.direction,
    })),
    milestones,
  });

  return (
    <section className={box}>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Milestone size={16} /> Xem trước dòng đời ({life.length})
        </h3>
        <p className="text-xs text-slate-500">
          Đúng danh sách tab &ldquo;Dòng thời gian&rdquo; ở hồ sơ nhân vật công khai. Mỗi dòng ghi rõ lấy từ đâu — sửa ở đó.
        </p>
      </div>
      {linksDirty && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Bạn vừa đổi liên kết — lưu bài để xem trước cập nhật theo liên kết mới.
        </p>
      )}
      {life.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có gì. Thêm liên kết tới bài sự kiện (nhãn = vai trò), mốc đời riêng, hoặc gắn mốc trong một dòng thời gian
          vào bài này.
        </p>
      ) : (
        <ol className="space-y-2">
          {life.map((it) => (
            <li key={it.key} className="rounded-lg border border-slate-100 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`font-bold ${it.year === null ? 'text-red-600' : 'text-slate-900'}`}>
                  {it.dateLabel ?? 'Chưa có năm'}
                </span>
                <span className="font-medium text-slate-800">{it.title}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{it.role}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${SOURCE_TONE[it.source]}`}>
                  {LIFE_SOURCE_LABELS[it.source]}
                </span>
                {it.article && (
                  <Link href={APP_ROUTES.ARTICLES.DETAIL(it.article.id)} className="text-sky-700 hover:underline">
                    Bài: {it.article.title}
                  </Link>
                )}
                {it.timeline ? (
                  <Link href={APP_ROUTES.TIMELINES.DETAIL(it.timeline.id)} className="text-amber-700 hover:underline">
                    Dòng thời gian: {it.timeline.title}
                  </Link>
                ) : (
                  it.source === LifeSource.LINK && (
                    <span className="text-slate-500">Chưa nằm trong dòng thời gian nào (dùng năm của bài sự kiện)</span>
                  )
                )}
                {it.source === LifeSource.MILESTONE && <span className="text-slate-500">Sửa ở mục &ldquo;Mốc đời riêng&rdquo;</span>}
              </div>
              {it.year === null && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle size={12} /> Không có năm → không hiện trên trang công khai. Nhập năm cho bài sự kiện hoặc gắn nó
                  vào một mốc.
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Bài SỰ KIỆN: nhân vật nào đang gắn với sự kiện này (2 chiều) + vai trò. */
export function EventPeoplePanel({ article, categories }: { article: ArticleItem; categories: CategoryItem[] }) {
  const people = linksOfKind(article, categories, 'PERSON');
  const places = linksOfKind(article, categories, 'LOCATION');
  return (
    <section className={box}>
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <UserRound size={16} /> Nhân vật gắn với sự kiện này ({people.length})
      </h3>
      {people.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có. Gắn từ bài nhân vật (tab Hồ sơ & liên kết → liên kết tới bài này, nhãn = vai trò) hoặc thêm liên kết ở đây.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {people.map((l) => (
            <li key={`${l.id}-${l.direction}`} className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={APP_ROUTES.ARTICLES.DETAIL(l.article.id)} className="font-medium text-slate-800 hover:underline">
                {l.article.title}
              </Link>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{l.label ?? 'Tham gia'}</span>
              <span className="text-xs text-slate-400">
                {l.direction === LinkDirection.INCOMING ? '(khai báo ở bài nhân vật)' : '(khai báo ở bài này)'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {places.length > 0 && (
        <p className="text-xs text-slate-600">
          Nơi diễn ra: {places.map((l) => l.article.title).join(', ')}
        </p>
      )}
    </section>
  );
}

/** Mọi loại bài: những mốc dòng thời gian đang trỏ tới bài này. */
export function InTimelinesPanel({ article }: { article: ArticleItem }) {
  const nodes = article.timelineNodes ?? [];
  return (
    <section className={box}>
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <GitCommitVertical size={16} /> Có trong dòng thời gian ({nodes.length})
      </h3>
      {nodes.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có mốc nào trỏ tới bài này. Thêm ở trang{' '}
          <Link href={APP_ROUTES.TIMELINES.LIST} className="text-sky-700 hover:underline">
            Dòng thời gian
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-1.5">
          {nodes.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-slate-900">{nodeDateLabel(n) ?? '—'}</span>
              <span className="text-slate-800">{n.title}</span>
              <Link href={APP_ROUTES.TIMELINES.DETAIL(n.timeline.id)} className="text-xs text-amber-700 hover:underline">
                <Link2 size={11} className="mr-0.5 inline" />
                {n.timeline.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
