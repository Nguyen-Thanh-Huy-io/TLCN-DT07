'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Share2 } from 'lucide-react';
import { ArticleKindEnum } from '@/constants/enums';
import { LinkDirection } from '@/features/articles/person-life';
import { ARTICLE_KIND_LABELS } from '@/services/public/article-kind';
import { PublicEntityRelatedArticleDto, PublicEntityStatementDto } from '@/services/entities/landing.service';
import { formatYear } from '@/utils/common';

export const KNOWLEDGE_GRAPH_SECTION_ID = 'mang-luoi-tri-thuc';
export const RELATED_BY_TAG_SECTION_ID = 'bai-viet-cung-chu-diem';

/** Thứ tự nhóm trong mạng lưới. */
const KIND_ORDER: ArticleKindEnum[] = [
  ArticleKindEnum.PERSON,
  ArticleKindEnum.EVENT,
  ArticleKindEnum.LOCATION,
  ArticleKindEnum.DYNASTY,
  ArticleKindEnum.OTHER,
];

const asKind = (value: string | null | undefined): ArticleKindEnum =>
  Object.values(ArticleKindEnum).find((kind) => kind === value) ?? ArticleKindEnum.OTHER;

const entityHref = (slug: string | null): string => (slug ? `/thuc-the/${slug}` : '#');

function yearsLabel(from: number | null, to: number | null): string | null {
  if (from == null) return to == null ? null : formatYear(to);
  return to == null || to === from ? formatYear(from) : `${formatYear(from)} – ${formatYear(to)}`;
}

/**
 * Nhãn là chữ tự do (động từ "chỉ huy" hay danh từ "danh tướng") nên không ghép câu; chiều liên kết
 * nói rõ ở tooltip.
 */
function relationTooltip(stmt: PublicEntityStatementDto, targetName: string): string {
  const label = stmt.roleLabel || stmt.predicateLabel;
  return stmt.direction === LinkDirection.INCOMING
    ? `${targetName} → ${label} → bài đang đọc`
    : `Bài đang đọc → ${label} → ${targetName}`;
}

function RelationCard({ stmt }: { stmt: PublicEntityStatementDto }) {
  const years = yearsLabel(stmt.validFromYear, stmt.validToYear);
  const targetName = stmt.relatedEntityName || 'Bài liên quan';
  return (
    <Link href={entityHref(stmt.relatedEntitySlug)} className="ue-kg-card group">
      <div>
        <span className="ue-kg-badge" title={relationTooltip(stmt, targetName)}>
          {stmt.roleLabel || stmt.predicateLabel}
        </span>
        <h3 className="ue-kg-target group-hover:text-[#8C2D19] transition-colors flex items-center justify-between">
          <span>{targetName}</span>
          <ArrowUpRight size={16} className="text-stone-400 group-hover:text-[#8C2D19] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </h3>
        {stmt.note && <p className="ue-kg-note">{stmt.note}</p>}
      </div>
      {years && <div className="text-xs text-stone-500 font-semibold mt-3 pt-2 border-t border-stone-200">{years}</div>}
    </Link>
  );
}

/** Bài liên kết trực tiếp với bài đang đọc, chia nhóm theo loại bài (Nhân vật, Sự kiện, Di tích…). */
export function EntityKnowledgeGraph({ statements }: { statements: PublicEntityStatementDto[] }) {
  if (statements.length === 0) return null;
  const groups = KIND_ORDER.map((kind) => ({
    kind,
    items: statements.filter((stmt) => asKind(stmt.relatedEntityType) === kind),
  })).filter((group) => group.items.length > 0);

  return (
    <section className="ue-kg-section" id={KNOWLEDGE_GRAPH_SECTION_ID}>
      <div className="flex items-center gap-2 mb-2">
        <Share2 size={22} className="text-[#8C2D19]" />
        <h2 className="ue-kg-title m-0">Mạng lưới Liên kết Tri thức</h2>
      </div>
      <p className="ue-kg-desc">Những nhân vật, sự kiện và địa danh được liên kết trực tiếp với bài này.</p>
      {groups.map((group) => (
        <div key={group.kind} className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
            {ARTICLE_KIND_LABELS[group.kind]} · {group.items.length}
          </h3>
          <div className="ue-kg-grid">
            {group.items.map((stmt) => (
              <RelationCard key={stmt.id} stmt={stmt} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function EntityRelatedByTag({ articles }: { articles: PublicEntityRelatedArticleDto[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="ue-kg-section" id={RELATED_BY_TAG_SECTION_ID}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={20} className="text-[#8C6239]" />
        <h2 className="ue-kg-title m-0">Bài viết cùng chủ điểm</h2>
      </div>
      <p className="ue-kg-desc">Các bài viết chia sẻ cùng chủ điểm (tag) lịch sử để đọc mở rộng:</p>
      <div className="ue-kg-grid">
        {articles.map((item) => (
          <Link key={item.id} href={entityHref(item.slug)} className="ue-kg-card group">
            <div>
              {item.categoryName && <span className="ue-kg-badge">{item.categoryName}</span>}
              <h3 className="ue-kg-target group-hover:text-[#8C2D19] transition-colors flex items-center justify-between">
                <span>{item.name}</span>
                <ArrowUpRight size={16} className="text-stone-400 group-hover:text-[#8C2D19] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </h3>
              {item.summary && <p className="ue-kg-note">{item.summary}</p>}
            </div>
            {item.dateLabel && (
              <div className="text-xs text-stone-500 font-semibold mt-3 pt-2 border-t border-stone-200">
                Niên đại: {item.dateLabel}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
