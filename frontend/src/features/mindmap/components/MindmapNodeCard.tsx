'use client';

import React, { useState } from 'react';
import {
  AlignLeft,
  BookOpen,
  CalendarDays,
  Check,
  Eye,
  Link2,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { TextAlignMode, TextCaseMode } from '@/components/common/TextStyleControls';
import {
  type BranchPaletteToken,
  IMAGE_HEIGHT_PX,
  MINDMAP_MARKERS,
  type MapThemeConfig,
  MindmapBorderStyle,
  MindmapBranchSide,
  MindmapImageHeight,
  MindmapInspectorTab,
  MindmapMarkerId,
  MindmapNodeShape,
  MindmapNodeSize,
  MindmapRecallRating,
  MindmapShortcutKey,
  MindmapStructure,
  NODE_SIZE_MAX_WIDTH,
} from '../constants/mindmap.constants';
import type { MindmapArticleRef, MindmapNode, MindmapNodeStyle } from '../services/mindmap.service';
import { type NodeLayoutPlacement, NodeVisualVariant } from '../utils/mindmap-layout.strategy';
import type { NodeRecallMask } from '../utils/mindmap-recall.strategy';

const ALWAYS_VISIBLE_CLS = 'opacity-100';
const HOVER_REVEAL_CLS = 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto';

export function nodeArticlesOf(node: MindmapNode): MindmapArticleRef[] {
  const list = Array.isArray(node.articleRefs) ? [...node.articleRefs] : [];
  if (node.articleRef && !list.some((a) => a.id === node.articleRef?.id)) {
    list.unshift(node.articleRef);
  }
  return list;
}

function borderStyleCss(borderStyle?: MindmapBorderStyle): string {
  if (borderStyle === MindmapBorderStyle.DASHED) return 'dashed';
  if (borderStyle === MindmapBorderStyle.DOTTED) return 'dotted';
  if (borderStyle === MindmapBorderStyle.NONE) return 'none';
  return 'solid';
}

function resolveBaseColors(
  variant: NodeVisualVariant,
  node: MindmapNode,
  theme: MapThemeConfig,
  palette: BranchPaletteToken,
): { bg: string; text: string; border: string; radiusClass: string; hasDefaultBorder: boolean } {
  if (variant === NodeVisualVariant.STICKY) {
    return { bg: '#FEF3C7', text: '#451A03', border: '#F59E0B', radiusClass: 'rounded-xl', hasDefaultBorder: true };
  }
  if (variant === NodeVisualVariant.ROOT) {
    return {
      bg: node.colorOverride ? palette.nodeBg : theme.rootBg,
      text: node.colorOverride ? palette.nodeText : theme.rootText,
      border: node.colorOverride ? palette.nodeBorder : theme.rootBorder,
      radiusClass: 'rounded-xl',
      hasDefaultBorder: true,
    };
  }
  if (variant === NodeVisualVariant.UNDERLINE || variant === NodeVisualVariant.PLAIN) {
    return { bg: 'transparent', text: palette.leafText, border: 'transparent', radiusClass: 'rounded-md', hasDefaultBorder: false };
  }
  const radiusClass =
    variant === NodeVisualVariant.PILL || variant === NodeVisualVariant.CIRCLE
      ? 'rounded-full'
      : 'rounded-lg';
  return { bg: palette.nodeBg, text: palette.nodeText, border: palette.nodeBorder, radiusClass, hasDefaultBorder: true };
}

function resolveContainerAppearance(
  variant: NodeVisualVariant,
  node: MindmapNode,
  theme: MapThemeConfig,
  palette: BranchPaletteToken,
): { className: string; style: React.CSSProperties } {
  const base = resolveBaseColors(variant, node, theme, palette);
  const custom = node.style;
  const customBorderActive = custom?.borderStyle && custom.borderStyle !== MindmapBorderStyle.NONE;
  const borderWidth = custom?.borderStyle === MindmapBorderStyle.NONE
    ? 0
    : custom?.borderWidth ?? (base.hasDefaultBorder ? 1 : 0);

  const shapeExtra =
    variant === NodeVisualVariant.CIRCLE
      ? 'aspect-square flex flex-col justify-center text-center'
      : variant === NodeVisualVariant.PILL
        ? 'px-4'
        : '';

  return {
    className: `${base.radiusClass} ${shapeExtra} ${base.hasDefaultBorder || custom?.fillColor ? 'shadow-xs' : ''}`,
    style: {
      backgroundColor: custom?.fillColor || base.bg,
      color: custom?.textColor || base.text,
      borderColor: custom?.borderColor || (customBorderActive ? palette.stroke : base.border),
      borderStyle: custom?.borderStyle ? borderStyleCss(custom.borderStyle) : 'solid',
      borderWidth: `${borderWidth}px`,
      ...(custom?.borderRadius !== undefined ? { borderRadius: `${custom.borderRadius}px` } : {}),
    },
  };
}

function resolveRingClass(
  isDropTarget: boolean,
  isLinkSource: boolean,
  isSelected: boolean,
  recallRating?: MindmapRecallRating,
): string {
  if (recallRating === MindmapRecallRating.REMEMBERED) {
    return 'ring-2 ring-emerald-500 ring-offset-1';
  }
  if (recallRating === MindmapRecallRating.NEEDS_REVIEW) {
    return 'ring-2 ring-amber-500 ring-offset-1';
  }
  if (isDropTarget) return 'ring-2 ring-emerald-500 ring-offset-2';
  if (isLinkSource) return 'ring-2 ring-amber-500 animate-pulse';
  if (isSelected) return 'ring-2 ring-[#3B82F6] ring-offset-2';
  return '';
}

const CENTER_Y_BASE: React.CSSProperties = { top: '50%', transform: 'translateY(-50%)' };
const CENTER_X_BASE: React.CSSProperties = { left: '50%', transform: 'translateX(-50%)' };

function computeBranchControlPositions(
  structure: MindmapStructure,
  side: MindmapBranchSide,
  hasChildren: boolean,
  isRoot: boolean,
  isSticky: boolean,
): {
  collapseStyle?: React.CSSProperties;
  addStyle: React.CSSProperties;
  siblingStyle?: React.CSSProperties;
} {
  const collapseOffset = '-11px';
  const addOffset = hasChildren ? '-38px' : '-12px';

  if (structure === MindmapStructure.ORG_CHART) {
    return {
      collapseStyle: { bottom: collapseOffset, ...CENTER_X_BASE },
      addStyle: { bottom: addOffset, ...CENTER_X_BASE },
      siblingStyle: !isRoot && !isSticky ? { right: '-12px', ...CENTER_Y_BASE } : undefined,
    };
  }
  const siblingStyle = !isRoot && !isSticky ? { bottom: '-12px', ...CENTER_X_BASE } : undefined;
  if (side === MindmapBranchSide.LEFT) {
    return {
      collapseStyle: { left: collapseOffset, ...CENTER_Y_BASE },
      addStyle: { left: addOffset, ...CENTER_Y_BASE },
      siblingStyle,
    };
  }
  return {
    collapseStyle: { right: collapseOffset, ...CENTER_Y_BASE },
    addStyle: { right: addOffset, ...CENTER_Y_BASE },
    siblingStyle,
  };
}

function buildTypographyStyle(
  custom: MindmapNodeStyle | undefined,
  isRoot: boolean,
  node: MindmapNode,
  variant: NodeVisualVariant,
): React.CSSProperties {
  const defaultSize = isRoot
    ? 15
    : node.shape === MindmapNodeShape.CARD || variant === NodeVisualVariant.BRANCH_CARD
      ? 13
      : 12.5;
  return {
    fontFamily: custom?.fontFamily,
    fontSize: `${custom?.fontSize ?? defaultSize}px`,
    fontWeight: custom?.bold !== undefined ? (custom.bold ? 700 : 400) : isRoot ? 700 : 600,
    fontStyle: custom?.italic ? 'italic' : 'normal',
    textDecoration: custom?.strike ? 'line-through' : undefined,
    textTransform: custom?.textTransform && custom.textTransform !== TextCaseMode.NONE ? custom.textTransform : undefined,
    textAlign: custom?.textAlign ?? (isRoot ? TextAlignMode.CENTER : TextAlignMode.LEFT),
  };
}

function NodeMarkerBadges({ markers }: { markers: MindmapMarkerId[] }) {
  if (markers.length === 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {markers.map((markerId) => {
        const meta = MINDMAP_MARKERS[markerId];
        if (!meta) return null;
        return (
          <span
            key={markerId}
            title={meta.label}
            style={{ backgroundColor: meta.bg, color: meta.fg }}
            className="grid size-[19px] place-items-center rounded-full text-[10px] font-extrabold leading-none shadow-2xs"
          >
            {meta.glyph}
          </span>
        );
      })}
    </span>
  );
}

function NoteQuickPopover({
  note,
  onChangeNote,
  onClose,
}: {
  note: string;
  onChangeNote: (next: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 shadow-lg"
    >
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
        <span>Ghi chú chi tiết</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>
      <textarea
        rows={4}
        value={note}
        onChange={(e) => onChangeNote(e.target.value)}
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-400"
      />
    </div>
  );
}

function NodeFloatingControls({
  isRoot,
  isSelected,
  isEditing,
  isSticky,
  collapsed,
  descendantCount,
  structure,
  side,
  strokeColor,
  onOpenInspector,
  onDelete,
  onToggleCollapse,
  onAddChild,
  onAddSibling,
}: {
  isRoot: boolean;
  isSelected: boolean;
  isEditing: boolean;
  isSticky: boolean;
  collapsed: boolean;
  descendantCount: number;
  structure: MindmapStructure;
  side: MindmapBranchSide;
  strokeColor: string;
  onOpenInspector: (tab: MindmapInspectorTab) => void;
  onDelete: () => void;
  onToggleCollapse: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
}) {
  const revealCls = isSelected && !isEditing ? `${ALWAYS_VISIBLE_CLS} pointer-events-auto` : HOVER_REVEAL_CLS;
  const pos = computeBranchControlPositions(
    structure,
    side,
    descendantCount > 0 && !isSticky,
    isRoot,
    isSticky,
  );

  return (
    <>
      {/* Thanh thao tác pill nổi bên trên card để không bao giờ đè vào chữ hay nút nhánh */}
      <div
        className={`absolute bottom-full left-1/2 z-30 -translate-x-1/2 pb-2 transition-opacity ${revealCls}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 shadow-md">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInspector(MindmapInspectorTab.NODE);
            }}
            title="Kiểu dáng, văn bản & ảnh"
            className="grid size-6 place-items-center rounded-full text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
          >
            <Palette size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInspector(MindmapInspectorTab.MARKERS);
            }}
            title="Nhãn đánh dấu, niên đại & thẻ"
            className="grid size-6 place-items-center rounded-full text-slate-600 hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
          >
            <Star size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInspector(MindmapInspectorTab.NOTES);
            }}
            title="Ghi chú & Tư liệu HISGO"
            className="grid size-6 place-items-center rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
          >
            <BookOpen size={12} />
          </button>
          {!isRoot && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Xoá node này (Del)"
              className="grid size-6 place-items-center rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {descendantCount > 0 && !isSticky && (
        <button
          type="button"
          style={{
            ...pos.collapseStyle,
            ...(collapsed ? { backgroundColor: strokeColor, color: '#FFFFFF', borderColor: '#FFFFFF' } : {}),
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          title={collapsed ? `Mở rộng ${descendantCount} nhánh con` : 'Thu gọn nhánh con'}
          className={`absolute z-20 grid size-5 place-items-center rounded-full border text-[10px] font-bold shadow-xs transition cursor-pointer ${
            collapsed
              ? `${ALWAYS_VISIBLE_CLS} pointer-events-auto`
              : `${revealCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`
          }`}
        >
          {collapsed ? descendantCount : <Minus size={10} />}
        </button>
      )}

      {!isSticky && (
        <button
          type="button"
          style={pos.addStyle}
          onClick={(e) => {
            e.stopPropagation();
            onAddChild();
          }}
          title="Thêm nhánh con (Tab)"
          aria-label="Thêm nhánh con"
          className={`absolute z-20 grid size-5 place-items-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-xs transition hover:scale-110 hover:bg-blue-600 hover:text-white cursor-pointer ${revealCls}`}
        >
          <Plus size={11} />
        </button>
      )}

      {pos.siblingStyle && (
        <button
          type="button"
          style={pos.siblingStyle}
          onClick={(e) => {
            e.stopPropagation();
            onAddSibling();
          }}
          title={
            structure === MindmapStructure.ORG_CHART
              ? 'Thêm nhánh cùng cấp bên phải (Enter)'
              : 'Thêm nhánh cùng cấp bên dưới (Enter)'
          }
          aria-label="Thêm nhánh cùng cấp"
          className={`absolute z-20 grid size-5 place-items-center rounded-full border border-emerald-300 bg-white text-emerald-600 shadow-xs transition hover:scale-110 hover:bg-emerald-600 hover:text-white cursor-pointer ${revealCls}`}
        >
          <Plus size={11} />
        </button>
      )}
    </>
  );
}

function NodeStudyRatingPill({
  rating,
  isSelected,
  onRate,
}: {
  rating?: MindmapRecallRating;
  isSelected: boolean;
  onRate: (rating: MindmapRecallRating) => void;
}) {
  const visCls =
    isSelected || rating !== undefined
      ? `${ALWAYS_VISIBLE_CLS} pointer-events-auto`
      : HOVER_REVEAL_CLS;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className={`absolute bottom-full left-1/2 z-30 -translate-x-1/2 pb-1.5 transition-opacity ${visCls}`}
    >
      <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10.5px] font-bold shadow-md whitespace-nowrap">
        <button
          type="button"
          title="Đánh dấu đã nhớ"
          onClick={(e) => {
            e.stopPropagation();
            onRate(MindmapRecallRating.REMEMBERED);
          }}
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 transition cursor-pointer ${
            rating === MindmapRecallRating.REMEMBERED
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <Check size={11} />
          <span>Đã nhớ</span>
        </button>
        <button
          type="button"
          title="Cần ôn lại ý này"
          onClick={(e) => {
            e.stopPropagation();
            onRate(MindmapRecallRating.NEEDS_REVIEW);
          }}
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 transition cursor-pointer ${
            rating === MindmapRecallRating.NEEDS_REVIEW
              ? 'bg-amber-500 text-white'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <RotateCcw size={10} />
          <span>Ôn lại</span>
        </button>
      </div>
    </div>
  );
}

function NodeMetadataChips({
  node,
  chipText,
  maskDateAndBadge,
  palette,
  articles,
  onOpenArticleInReader,
}: {
  node: MindmapNode;
  chipText?: string;
  maskDateAndBadge: boolean;
  palette: BranchPaletteToken;
  articles: MindmapArticleRef[];
  onOpenArticleInReader: (slug: string) => void;
}) {
  const tags = node.tags ?? [];
  return (
    <>
      {chipText && (
        <div className="mt-1.5 flex justify-center">
          {maskDateAndBadge ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-900">
              <CalendarDays size={10} />
              <span>??? · Nhấn mở mốc</span>
            </span>
          ) : (
            <span
              style={{ backgroundColor: palette.chipBg, color: palette.chipText }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium shadow-2xs"
            >
              <CalendarDays size={10} />
              <span>{chipText}</span>
            </span>
          )}
        </div>
      )}

      {tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-black/6 px-1.5 py-0.5 text-[10px] font-semibold opacity-90"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {node.externalUrl && (
        <div className="mt-1">
          <a
            href={node.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex max-w-full items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 hover:underline"
          >
            <Link2 size={9} className="shrink-0" />
            <span className="truncate">{node.externalUrl.replace(/^https?:\/\//i, '')}</span>
          </a>
        </div>
      )}

      {articles.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {articles.map((art) => (
            <button
              key={art.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenArticleInReader(art.slug);
              }}
              title="Mở đọc ngay trong Studio để vừa xem vừa làm"
              className="inline-flex max-w-full items-center gap-1 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold underline hover:bg-black/10 cursor-pointer"
            >
              <BookOpen size={9} className="shrink-0" />
              <span className="truncate">{art.title}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function resolveAlignFlexClass(textAlign?: React.CSSProperties['textAlign']): string {
  if (textAlign === TextAlignMode.CENTER) return 'justify-center';
  if (textAlign === TextAlignMode.RIGHT) return 'justify-end';
  return 'justify-start';
}

function resolveBodyPaddingClass(variant: NodeVisualVariant, isRoot: boolean, hasImage: boolean): string {
  if (hasImage) return 'p-2';
  if (variant === NodeVisualVariant.UNDERLINE) return 'px-1.5 pt-0.5 pb-1.5';
  return isRoot ? 'px-5 py-2.5' : 'px-3 py-2';
}

function computeNodeBoxWidthLimits(node: MindmapNode, isRoot: boolean): { maxWidth: number; minWidth: number } {
  const maxWidth = node.size
    ? NODE_SIZE_MAX_WIDTH[node.size]
    : node.imageUrl
      ? NODE_SIZE_MAX_WIDTH[MindmapNodeSize.MD]
      : NODE_SIZE_MAX_WIDTH[MindmapNodeSize.LG];

  const titleLen = (node.title || '').trim().length;
  if (isRoot) return { maxWidth, minWidth: 140 };
  if (node.imageUrl) return { maxWidth, minWidth: 196 };
  if (titleLen > 35) return { maxWidth, minWidth: Math.min(maxWidth, 210) };
  return { maxWidth, minWidth: titleLen > 18 ? 130 : 82 };
}

function StudyModeOverlayControls({
  node,
  structure,
  side,
  isRoot,
  isSelected,
  descendantCount,
  strokeColor,
  recallMask,
  onRateRecall,
  onToggleCollapse,
}: {
  node: MindmapNode;
  structure: MindmapStructure;
  side: MindmapBranchSide;
  isRoot: boolean;
  isSelected: boolean;
  descendantCount: number;
  strokeColor: string;
  recallMask?: NodeRecallMask;
  onRateRecall?: (rating: MindmapRecallRating) => void;
  onToggleCollapse: () => void;
}) {
  const showRating = Boolean(recallMask?.isTestable && !recallMask.isMasked && onRateRecall);
  const showCollapse = descendantCount > 0 && !node.isStickyNote;
  const collapsePos = computeBranchControlPositions(structure, side, true, isRoot, false).collapseStyle;

  return (
    <>
      {showRating && onRateRecall && (
        <NodeStudyRatingPill
          rating={recallMask?.rating}
          isSelected={isSelected}
          onRate={onRateRecall}
        />
      )}
      {showCollapse && (
        <button
          type="button"
          style={{
            ...collapsePos,
            ...(node.collapsed
              ? { backgroundColor: strokeColor, color: '#FFFFFF', borderColor: '#FFFFFF' }
              : {}),
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          title={node.collapsed ? `Mở ${descendantCount} nhánh con` : 'Thu gọn nhánh con'}
          className={`absolute z-20 grid size-5 place-items-center rounded-full border text-[10px] font-bold shadow-xs transition cursor-pointer ${ALWAYS_VISIBLE_CLS} pointer-events-auto ${
            node.collapsed ? '' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          {node.collapsed ? descendantCount : <Minus size={10} />}
        </button>
      )}
    </>
  );
}

function NodeContentBody({
  node,
  variant,
  palette,
  isRoot,
  isEditing,
  recallMask,
  onChangeTitle,
  onStopEditing,
  onToggleNotePopover,
  onOpenArticleInReader,
}: {
  node: MindmapNode;
  variant: NodeVisualVariant;
  palette: BranchPaletteToken;
  isRoot: boolean;
  isEditing: boolean;
  recallMask?: NodeRecallMask;
  onChangeTitle: (title: string) => void;
  onStopEditing: () => void;
  onToggleNotePopover: () => void;
  onOpenArticleInReader: (slug: string) => void;
}) {
  const imgHeight = IMAGE_HEIGHT_PX[node.imageHeight ?? MindmapImageHeight.MD];
  const articles = nodeArticlesOf(node);
  const markers = node.markers ?? [];
  const chipText = node.dateLabel || (!isRoot && node.badge ? node.badge : undefined);
  const hasNote = Boolean(node.note?.trim());
  const maskTitle = Boolean(recallMask?.maskTitle);
  const maskDateAndBadge = Boolean(recallMask?.maskDateAndBadge);
  const maskNote = Boolean(recallMask?.maskNote);
  const typoStyle = buildTypographyStyle(node.style, isRoot, node, variant);
  const showInlineNote = Boolean((node.showNoteInline || node.isStickyNote) && hasNote && !maskNote);

  return (
    <div className={resolveBodyPaddingClass(variant, isRoot, Boolean(node.imageUrl))}>
      {node.imageUrl && (
        <div className="mb-2 overflow-hidden rounded-md bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.imageUrl}
            alt={node.title}
            style={{ height: imgHeight }}
            className={`w-full object-cover transition ${maskTitle ? 'blur-md' : ''}`}
            draggable={false}
          />
        </div>
      )}

      {isRoot && (node.badge || node.dateLabel) && (
        <div className="mb-1 text-center text-[10px] font-semibold opacity-80">
          {node.dateLabel || node.badge}
        </div>
      )}

      <div className={`flex items-center gap-1.5 ${resolveAlignFlexClass(typoStyle.textAlign)}`}>
        <NodeMarkerBadges markers={markers} />

        {isEditing ? (
          <input
            autoFocus
            value={node.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            onBlur={onStopEditing}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === MindmapShortcutKey.ENTER || e.key === MindmapShortcutKey.ESCAPE) {
                onStopEditing();
              }
            }}
            className="min-w-[80px] flex-1 rounded bg-white px-1.5 py-0.5 text-xs font-bold text-slate-900 outline-none ring-1 ring-blue-400"
          />
        ) : (
          <span
            style={typoStyle}
            className={`min-w-0 flex-1 leading-snug break-words transition ${
              maskTitle ? 'blur-[5px] select-none opacity-65' : 'line-clamp-3'
            }`}
          >
            {node.title || 'Chưa đặt tên'}
          </span>
        )}

        {maskTitle && (
          <span
            title="Nhấn để mở nội dung"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold"
          >
            <Eye size={10} />
          </span>
        )}

        {hasNote && !maskNote && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleNotePopover();
            }}
            title="Xem chi tiết ghi chú"
            aria-label="Xem ghi chú"
            className="shrink-0 rounded p-0.5 opacity-70 hover:bg-black/10 hover:opacity-100 cursor-pointer"
          >
            <AlignLeft size={12} />
          </button>
        )}
      </div>

      {hasNote && maskNote && (
        <div className="mt-1 text-[10.5px] font-semibold italic opacity-75">
          Ghi chú đang ẩn · Nhấn để kiểm tra
        </div>
      )}

      {showInlineNote && (
        <p className="mt-1 whitespace-pre-line text-[11px] leading-snug opacity-85 line-clamp-3">
          {node.note}
        </p>
      )}

      <NodeMetadataChips
        node={node}
        chipText={chipText}
        maskDateAndBadge={maskDateAndBadge}
        palette={palette}
        articles={articles}
        onOpenArticleInReader={onOpenArticleInReader}
      />
    </div>
  );
}

export function MindmapNodeCard({
  node,
  placement,
  structure,
  theme,
  palette,
  isRoot,
  isSelected,
  isEditing,
  isLinkSource,
  isDropTarget,
  descendantCount,
  isStudyMode = false,
  recallMask,
  onRateRecall,
  onRegisterRef,
  onPointerDown,
  onClick,
  onDoubleClick,
  onChangeTitle,
  onStopEditing,
  onAddChild,
  onAddSibling,
  onDelete,
  onToggleCollapse,
  onChangeNote,
  onOpenInspector,
  onOpenArticleInReader,
}: {
  node: MindmapNode;
  placement: NodeLayoutPlacement;
  structure: MindmapStructure;
  theme: MapThemeConfig;
  palette: BranchPaletteToken;
  isRoot: boolean;
  isSelected: boolean;
  isEditing: boolean;
  isLinkSource: boolean;
  isDropTarget: boolean;
  descendantCount: number;
  isStudyMode?: boolean;
  recallMask?: NodeRecallMask;
  onRateRecall?: (rating: MindmapRecallRating) => void;
  onRegisterRef: (el: HTMLElement | null) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onChangeTitle: (title: string) => void;
  onStopEditing: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onDelete: () => void;
  onToggleCollapse: () => void;
  onChangeNote: (note: string) => void;
  onOpenInspector: (tab: MindmapInspectorTab) => void;
  onOpenArticleInReader: (slug: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const appearance = resolveContainerAppearance(placement.variant, node, theme, palette);
  const { maxWidth, minWidth: computedMinWidth } = computeNodeBoxWidthLimits(node, isRoot);
  const strokeColor = node.style?.childStrokeColor || palette.stroke;

  return (
    <div
      ref={onRegisterRef}
      data-mindmap-node-id={node.id}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        left: placement.x,
        top: placement.y,
        width: 'max-content',
        maxWidth,
        minWidth: computedMinWidth,
        ...appearance.style,
      }}
      className={`group pointer-events-auto absolute overflow-visible select-none transition-shadow cursor-pointer ${appearance.className} ${resolveRingClass(
        isDropTarget,
        isLinkSource,
        isSelected,
        recallMask?.rating,
      )}`}
    >
      {isStudyMode ? (
        <StudyModeOverlayControls
          node={node}
          structure={structure}
          side={placement.side}
          isRoot={isRoot}
          isSelected={isSelected}
          descendantCount={descendantCount}
          strokeColor={strokeColor}
          recallMask={recallMask}
          onRateRecall={onRateRecall}
          onToggleCollapse={onToggleCollapse}
        />
      ) : (
        <NodeFloatingControls
          isRoot={isRoot}
          isSelected={isSelected}
          isEditing={isEditing}
          isSticky={Boolean(node.isStickyNote)}
          collapsed={Boolean(node.collapsed)}
          descendantCount={descendantCount}
          structure={structure}
          side={placement.side}
          strokeColor={strokeColor}
          onOpenInspector={onOpenInspector}
          onDelete={onDelete}
          onToggleCollapse={onToggleCollapse}
          onAddChild={onAddChild}
          onAddSibling={onAddSibling}
        />
      )}

      <NodeContentBody
        node={node}
        variant={placement.variant}
        palette={palette}
        isRoot={isRoot}
        isEditing={isEditing}
        recallMask={recallMask}
        onChangeTitle={onChangeTitle}
        onStopEditing={onStopEditing}
        onToggleNotePopover={() => setNoteOpen((v) => !v)}
        onOpenArticleInReader={onOpenArticleInReader}
      />

      {noteOpen && (
        <NoteQuickPopover
          note={node.note ?? ''}
          onChangeNote={onChangeNote}
          onClose={() => setNoteOpen(false)}
        />
      )}
    </div>
  );
}
