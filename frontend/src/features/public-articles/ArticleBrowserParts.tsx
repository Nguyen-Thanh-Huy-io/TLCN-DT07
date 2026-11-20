'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  History,
  Landmark,
  MapPin,
  Quote,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ChipGroup, FilterSection, PickedCount, toggleValue } from '@/components/filters/ChipFilter';
import { RemoteImage } from '@/components/common/RemoteImage';
import { useFigureProfile } from '@/components/figures/FigureProfileParts';
import { ArticleKindEnum } from '@/constants/enums';
import type { ArticleKind } from '@/services/public/article-kind';
import { PUBLIC_ROUTES, type PublicCategory } from '@/services/public/public-content.service';
import {
  ArticleFilterKey,
  ArticleMetaIconKey,
  getArticleCardMetaStrategy,
  type ArticleFilters,
  type ArticleJsonbFacets,
  type ArticleRow,
  type JsonbFacetOption,
} from './article-library.strategy';

const INLINE_PILL_LIMIT = 5;

const META_ICON_MAP: Record<ArticleMetaIconKey, LucideIcon> = {
  [ArticleMetaIconKey.MAP_PIN]: MapPin,
  [ArticleMetaIconKey.USERS]: Users,
  [ArticleMetaIconKey.LANDMARK]: Landmark,
  [ArticleMetaIconKey.HISTORY]: History,
  [ArticleMetaIconKey.TAG]: Tag,
  [ArticleMetaIconKey.QUOTE]: Quote,
};

function CollapsibleQuickFacetRow({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: JsonbFacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (options.length === 0) return null;

  const visibleOptions =
    expanded || options.length <= INLINE_PILL_LIMIT
      ? options
      : options.filter((opt, idx) => idx < INLINE_PILL_LIMIT || selected.includes(opt.value));
  const hiddenCount = options.length - visibleOptions.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="mr-1 font-semibold text-stone-500">{label}:</span>
      {visibleOptions.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`sk-button !px-2.5 !py-1 !text-xs ${active ? 'sk-primary' : ''}`}
          >
            {opt.label} ({opt.count})
          </button>
        );
      })}
      {(hiddenCount > 0 || (expanded && options.length > INLINE_PILL_LIMIT)) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-[#8C2D19] hover:underline"
        >
          <span>{expanded ? 'Thu gọn' : `+${hiddenCount} xem thêm`}</span>
          <ChevronDown size={13} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      )}
    </div>
  );
}

/**
 * Bộ lọc nhanh theo thuộc tính: chỉ hiển thị những thuộc tính thực sự thuộc về loại bài viết đang xem.
 */
export function ArticleAdaptiveSubFilters({
  activeKind,
  childCategories,
  jsonbFacets,
  filters,
  onToggleFilter,
}: {
  activeKind: ArticleKind | null;
  childCategories: Array<{ cat: PublicCategory; count: number }>;
  jsonbFacets: ArticleJsonbFacets;
  filters: ArticleFilters;
  onToggleFilter: (key: ArticleFilterKey, value: string) => void;
}) {
  const showLocationFacets =
    activeKind === ArticleKindEnum.LOCATION &&
    (jsonbFacets.siteTypes.length > 0 || jsonbFacets.preservations.length > 0);
  const showPersonFacets = activeKind === ArticleKindEnum.PERSON && jsonbFacets.personRoles.length > 0;
  const showChildCategories = childCategories.length > 0;

  if (!showLocationFacets && !showPersonFacets && !showChildCategories) return null;

  const childOptions: JsonbFacetOption[] = childCategories.map(({ cat, count }) => ({
    value: cat.id,
    label: cat.name,
    count,
  }));

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-stone-200/80 bg-white/60 p-3">
      {showChildCategories && (
        <CollapsibleQuickFacetRow
          label="Phân nhóm"
          options={childOptions}
          selected={filters.categories}
          onToggle={(v) => onToggleFilter(ArticleFilterKey.CATEGORIES, v)}
        />
      )}
      {showLocationFacets && (
        <>
          <CollapsibleQuickFacetRow
            label="Loại hình di tích"
            options={jsonbFacets.siteTypes}
            selected={filters.siteTypes}
            onToggle={(v) => onToggleFilter(ArticleFilterKey.SITE_TYPES, v)}
          />
          <CollapsibleQuickFacetRow
            label="Hiện trạng bảo tồn"
            options={jsonbFacets.preservations}
            selected={filters.preservations}
            onToggle={(v) => onToggleFilter(ArticleFilterKey.PRESERVATIONS, v)}
          />
        </>
      )}
      {showPersonFacets && (
        <CollapsibleQuickFacetRow
          label="Vai trò & Danh hiệu"
          options={jsonbFacets.personRoles}
          selected={filters.personRoles}
          onToggle={(v) => onToggleFilter(ArticleFilterKey.PERSON_ROLES, v)}
        />
      )}
    </div>
  );
}

/**
 * Nội dung hộp thoại Bộ lọc nâng cao:
 * - Đã bỏ hẳn mục lọc "Thời kỳ" (trùng lặp với phân nhóm Chủ đề Topic).
 * - Chỉ hiển thị các nhóm thuộc tính đúng với loại bài viết đang xem (`activeKind`).
 */
export function ArticleFilterDialogSections({
  draft,
  setDraft,
  activeKind,
  isScopedCategory,
  categoryOptions,
  tagOptions,
  jsonbFacets,
}: {
  draft: ArticleFilters;
  setDraft: (update: (d: ArticleFilters) => ArticleFilters) => void;
  activeKind: ArticleKind | null;
  isScopedCategory: boolean;
  categoryOptions: Array<{ cat: PublicCategory; count: number }>;
  tagOptions: Array<{ id: string; name: string; count: number }>;
  jsonbFacets: ArticleJsonbFacets;
}) {
  const toggle = (key: ArticleFilterKey, v: string) =>
    setDraft((d) => ({ ...d, [key]: toggleValue(d[key], v) }));

  const isLocationKind = activeKind === ArticleKindEnum.LOCATION;
  const isPersonKind = activeKind === ArticleKindEnum.PERSON;

  return (
    <>
      {categoryOptions.length > 0 && (
        <FilterSection
          card
          title={isScopedCategory ? 'Phân nhóm chuyên mục' : 'Chuyên mục'}
          aside={<PickedCount count={draft.categories.length} />}
        >
          <ChipGroup
            options={categoryOptions.map(({ cat, count }) => ({
              value: cat.id,
              label: cat.name,
              hint: `${count} bài viết`,
            }))}
            selected={draft.categories}
            onToggle={(v) => toggle(ArticleFilterKey.CATEGORIES, v)}
            searchLabel="Tìm chuyên mục..."
          />
        </FilterSection>
      )}

      {isLocationKind && jsonbFacets.siteTypes.length > 0 && (
        <FilterSection
          card={categoryOptions.length === 0}
          title="Loại hình di tích"
          aside={<PickedCount count={draft.siteTypes.length} />}
        >
          <ChipGroup
            options={jsonbFacets.siteTypes.map((s) => ({
              value: s.value,
              label: s.label,
              hint: `${s.count} di tích`,
            }))}
            selected={draft.siteTypes}
            onToggle={(v) => toggle(ArticleFilterKey.SITE_TYPES, v)}
            searchLabel="Tìm loại hình di tích..."
          />
        </FilterSection>
      )}

      {isLocationKind && jsonbFacets.preservations.length > 0 && (
        <FilterSection title="Hiện trạng bảo tồn" aside={<PickedCount count={draft.preservations.length} />}>
          <ChipGroup
            options={jsonbFacets.preservations.map((p) => ({
              value: p.value,
              label: p.label,
              hint: `${p.count} di tích`,
            }))}
            selected={draft.preservations}
            onToggle={(v) => toggle(ArticleFilterKey.PRESERVATIONS, v)}
            searchLabel="Tìm hiện trạng..."
          />
        </FilterSection>
      )}

      {isPersonKind && jsonbFacets.personRoles.length > 0 && (
        <FilterSection
          card={categoryOptions.length === 0}
          title="Vai trò & Danh hiệu"
          aside={<PickedCount count={draft.personRoles.length} />}
        >
          <ChipGroup
            options={jsonbFacets.personRoles.map((r) => ({
              value: r.value,
              label: r.label,
              hint: `${r.count} nhân vật`,
            }))}
            selected={draft.personRoles}
            onToggle={(v) => toggle(ArticleFilterKey.PERSON_ROLES, v)}
            searchLabel="Tìm vai trò..."
          />
        </FilterSection>
      )}

      {tagOptions.length > 0 && (
        <FilterSection title="Chủ điểm (Tag)" aside={<PickedCount count={draft.tags.length} />}>
          <ChipGroup
            options={tagOptions.map((t) => ({
              value: t.id,
              label: t.name,
              hint: `${t.count} bài viết`,
            }))}
            selected={draft.tags}
            onToggle={(v) => toggle(ArticleFilterKey.TAGS, v)}
            searchLabel="Tìm chủ điểm..."
          />
        </FilterSection>
      )}
    </>
  );
}

export function ArticleGridCard({ row: { item } }: { row: ArticleRow }) {
  const figureProfile = useFigureProfile();
  const strategy = getArticleCardMetaStrategy(item.kind);
  const href = PUBLIC_ROUTES.ARTICLE(item.slug);
  const primaryBadge = strategy.primaryBadgeOf(item);
  const locationBadge = strategy.locationBadgeOf(item);
  const metaRows = strategy.metaRowsOf(item);
  const isPerson = item.kind === ArticleKindEnum.PERSON;

  return (
    <article className="el-card">
      <div className="el-card-media">
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
      </div>

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

        {metaRows.length > 0 && (
          <div className="el-card-entities">
            {metaRows.map((meta, idx) => {
              const Icon = META_ICON_MAP[meta.icon];
              return (
                <div key={`${meta.icon}-${idx}`} className="el-card-entity-item" title={meta.text}>
                  <Icon size={13} />
                  <span>{meta.text}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="el-card-footer flex items-center justify-between gap-2">
          <Link href={href} className="el-card-link">
            <span>{strategy.ctaLabel}</span>
            <ArrowRight size={14} />
          </Link>
          {isPerson && figureProfile && (
            <button
              type="button"
              onClick={() => figureProfile.openFigure(item.slug)}
              className="sk-button !px-2.5 !py-1 !text-xs"
              title={`Xem nhanh dòng đời và quan hệ của ${item.title}`}
            >
              <History size={12} />
              <span>Tóm tắt dòng đời</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ArticleListItem({ row: { item } }: { row: ArticleRow }) {
  const figureProfile = useFigureProfile();
  const strategy = getArticleCardMetaStrategy(item.kind);
  const href = PUBLIC_ROUTES.ARTICLE(item.slug);
  const primaryBadge = strategy.primaryBadgeOf(item);
  const metaRows = strategy.metaRowsOf(item);
  const isPerson = item.kind === ArticleKindEnum.PERSON;

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
        {isPerson && figureProfile && (
          <button
            type="button"
            onClick={() => figureProfile.openFigure(item.slug)}
            className="sk-button !px-2.5 !py-1.5 !text-xs"
            title={`Xem nhanh dòng đời của ${item.title}`}
          >
            <History size={12} />
            <span>Dòng đời</span>
          </button>
        )}
        <Link href={href} className="el-go" aria-label={`Đọc ${item.title}`}>
          <ArrowRight size={16} />
        </Link>
      </div>
    </li>
  );
}
