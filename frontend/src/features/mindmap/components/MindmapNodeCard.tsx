'use client';

import React, { useState } from 'react';
import {
  AlignLeft,
  BookOpen,
  CalendarDays,
  Link2,
  Minus,
  Palette,
  Plus,
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
  MindmapShortcutKey,
  MindmapStructure,
  NODE_SIZE_MAX_WIDTH,
} from '../constants/mindmap.constants';
import type { MindmapArticleRef, MindmapNode, MindmapNodeStyle } from '../services/mindmap.service';
import { type NodeLayoutPlacement, NodeVisualVariant } from '../utils/mindmap-layout.strategy';

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

function resolveRingClass(isDropTarget: boolean, isLinkSource: boolean, isSelected: boolean): string {
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
): { collapseStyle?: React.CSSProperties; addStyle: React.CSSProperties } {
  const collapseOffset = '-11px';
  const addOffset = hasChildren ? '-38px' : '-12px';

  if (structure === MindmapStructure.ORG_CHART) {
    return {
      collapseStyle: { bottom: collapseOffset, ...CENTER_X_BASE },
      addStyle: { bottom: addOffset, ...CENTER_X_BASE },
    };
  }
  if (side === MindmapBranchSide.LEFT) {
    return {
      collapseStyle: { left: collapseOffset, ...CENTER_Y_BASE },
      addStyle: { left: addOffset, ...CENTER_Y_BASE },
    };
  }
  return {
    collapseStyle: { right: collapseOffset, ...CENTER_Y_BASE },
    addStyle: { right: addOffset, ...CENTER_Y_BASE },
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
}) {
  const revealCls = isSelected && !isEditing ? `${ALWAYS_VISIBLE_CLS} pointer-events-auto` : HOVER_REVEAL_CLS;
  const pos = computeBranchControlPositions(structure, side, descendantCount > 0 && !isSticky);

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
    </>
  );
}

function NodeMetadataChips({
  node,
  chipText,
  palette,
  articles,
  onOpenArticleInReader,
}: {
  node: MindmapNode;
  chipText?: string;
  palette: BranchPaletteToken;
  articles: MindmapArticleRef[];
  onOpenArticleInReader: (slug: string) => void;
}) {
  const tags = node.tags ?? [];
  return (
    <>
      {chipText && (
        <div className="mt-1.5 flex justify-center">
          <span
            style={{ backgroundColor: palette.chipBg, color: palette.chipText }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium shadow-2xs"
          >
            <CalendarDays size={10} />
            <span>{chipText}</span>
          </span>
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

function NodeContentBody({
  node,
  variant,
  palette,
  isRoot,
  isEditing,
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
  onChangeTitle: (title: string) => void;
  onStopEditing: () => void;
  onToggleNotePopover: () => void;
  onOpenArticleInReader: (slug: string) => void;
}) {
  const imgHeight = IMAGE_HEIGHT_PX[node.imageHeight ?? MindmapImageHeight.MD];
  const articles = nodeArticlesOf(node);
  const markers = node.markers ?? [];
  const chipText = node.dateLabel || (!isRoot && node.badge ? node.badge : undefined);
  const hasNote = Boolean(node.note && node.note.trim().length > 0);
  const isUnderline = variant === NodeVisualVariant.UNDERLINE;
  const paddingCls = isUnderline ? 'px-1.5 pt-0.5 pb-1.5' : isRoot ? 'px-5 py-2.5' : 'px-3 py-2';
  const typoStyle = buildTypographyStyle(node.style, isRoot, node, variant);
  const alignCls =
    typoStyle.textAlign === TextAlignMode.CENTER
      ? 'justify-center'
      : typoStyle.textAlign === TextAlignMode.RIGHT
        ? 'justify-end'
        : 'justify-start';

  return (
    <div className={node.imageUrl ? 'p-2' : paddingCls}>
      {node.imageUrl && (
        <div className="mb-2 overflow-hidden rounded-md bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.imageUrl}
            alt={node.title}
            style={{ height: imgHeight }}
            className="w-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {isRoot && (node.badge || node.dateLabel) && (
        <div className="mb-1 text-center text-[10px] font-semibold opacity-80">
          {node.dateLabel || node.badge}
        </div>
      )}

      <div className={`flex items-center gap-1.5 ${alignCls}`}>
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
          <span style={typoStyle} className="min-w-0 flex-1 leading-snug break-words">
            {node.title || 'Chưa đặt tên'}
          </span>
        )}

        {hasNote && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleNotePopover();
            }}
            title="Xem / sửa ghi chú"
            aria-label="Xem ghi chú"
            className="shrink-0 rounded p-0.5 opacity-70 hover:bg-black/10 hover:opacity-100 cursor-pointer"
          >
            <AlignLeft size={12} />
          </button>
        )}
      </div>

      {(node.showNoteInline || node.isStickyNote) && hasNote && (
        <p className="mt-1 whitespace-pre-line text-[11px] leading-snug opacity-85 line-clamp-4">
          {node.note}
        </p>
      )}

      <NodeMetadataChips
        node={node}
        chipText={chipText}
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
  onRegisterRef,
  onPointerDown,
  onClick,
  onDoubleClick,
  onChangeTitle,
  onStopEditing,
  onAddChild,
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
  onRegisterRef: (el: HTMLElement | null) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onChangeTitle: (title: string) => void;
  onStopEditing: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onToggleCollapse: () => void;
  onChangeNote: (note: string) => void;
  onOpenInspector: (tab: MindmapInspectorTab) => void;
  onOpenArticleInReader: (slug: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);

  const appearance = resolveContainerAppearance(placement.variant, node, theme, palette);
  const maxWidth = node.size
    ? NODE_SIZE_MAX_WIDTH[node.size]
    : node.imageUrl
      ? NODE_SIZE_MAX_WIDTH[MindmapNodeSize.MD]
      : NODE_SIZE_MAX_WIDTH[MindmapNodeSize.LG];

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
        maxWidth,
        minWidth: isRoot ? 136 : node.imageUrl ? 196 : 82,
        ...appearance.style,
      }}
      className={`group pointer-events-auto absolute overflow-visible select-none transition-shadow cursor-pointer ${appearance.className} ${resolveRingClass(
        isDropTarget,
        isLinkSource,
        isSelected,
      )}`}
    >
      <NodeFloatingControls
        isRoot={isRoot}
        isSelected={isSelected}
        isEditing={isEditing}
        isSticky={Boolean(node.isStickyNote)}
        collapsed={Boolean(node.collapsed)}
        descendantCount={descendantCount}
        structure={structure}
        side={placement.side}
        strokeColor={node.style?.childStrokeColor || palette.stroke}
        onOpenInspector={onOpenInspector}
        onDelete={onDelete}
        onToggleCollapse={onToggleCollapse}
        onAddChild={onAddChild}
      />

      <NodeContentBody
        node={node}
        variant={placement.variant}
        palette={palette}
        isRoot={isRoot}
        isEditing={isEditing}
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
