'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  ImagePlus,
  Link2,
  Plus,
  Search,
  Trash2,
  Unlink,
  X,
} from 'lucide-react';
import { PUBLIC_ROUTES, type PublicArticleSummary } from '@/services/public/public-content.service';
import {
  BRANCH_COLOR_STYLES,
  MindmapBranchColor,
  MindmapNodeShape,
  MindmapNodeSize,
} from '../constants/mindmap.constants';
import {
  MindmapApiService,
  type MindmapArticleRef,
  type MindmapEdge,
  type MindmapNode,
} from '../services/mindmap.service';

export function nodeArticlesOf(node: MindmapNode): MindmapArticleRef[] {
  const list = Array.isArray(node.articleRefs) ? [...node.articleRefs] : [];
  if (node.articleRef && !list.some((a) => a.id === node.articleRef?.id)) {
    list.unshift(node.articleRef);
  }
  return list;
}

const SHAPE_OPTIONS: ReadonlyArray<{ id: MindmapNodeShape; label: string }> = [
  { id: MindmapNodeShape.CARD, label: 'Thẻ' },
  { id: MindmapNodeShape.PILL, label: 'Viên thuốc' },
  { id: MindmapNodeShape.CIRCLE, label: 'Bong bóng' },
  { id: MindmapNodeShape.PLAIN, label: 'Chữ trơn' },
];

const SIZE_OPTIONS: ReadonlyArray<{ id: MindmapNodeSize; label: string }> = [
  { id: MindmapNodeSize.SM, label: 'Nhỏ' },
  { id: MindmapNodeSize.MD, label: 'Vừa' },
  { id: MindmapNodeSize.LG, label: 'Lớn' },
];

/** Bảng thuộc tính bên phải khi bấm chọn 1 Node trên canvas (tuỳ biến hình dáng, kích thước, ảnh, nhiều tư liệu). */
export function MindmapNodeInspector({
  node,
  edges,
  nodeMap,
  canDelete,
  onChange,
  onAddChild,
  onDelete,
  onUpdateEdge,
  onDeleteEdge,
  onClose,
}: {
  node: MindmapNode;
  edges: MindmapEdge[];
  nodeMap: Map<string, MindmapNode>;
  canDelete: boolean;
  onChange: (patch: Partial<MindmapNode>) => void;
  onAddChild: () => void;
  onDelete: () => void;
  onUpdateEdge: (edgeId: string, label: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onClose: () => void;
}) {
  const [articleQuery, setArticleQuery] = useState('');
  const [results, setResults] = useState<PublicArticleSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const attachedArticles = nodeArticlesOf(node);
  const connectedEdges = edges.filter((e) => e.fromId === node.id || e.toId === node.id);

  const runSearch = async (q: string) => {
    setArticleQuery(q);
    setSearching(true);
    try {
      setResults(await MindmapApiService.searchArticles(q));
    } finally {
      setSearching(false);
    }
  };

  const addArticle = (art: PublicArticleSummary) => {
    if (attachedArticles.some((a) => a.id === art.id)) return;
    const nextList: MindmapArticleRef[] = [
      ...attachedArticles,
      {
        id: art.id,
        slug: art.slug,
        title: art.title,
        coverImageUrl: art.coverImageUrl,
      },
    ];
    onChange({
      articleRefs: nextList,
      articleRef: undefined,
      ...(!node.imageUrl && art.coverImageUrl ? { imageUrl: art.coverImageUrl } : {}),
    });
    setArticleQuery('');
    setResults([]);
  };

  const removeArticle = (articleId: string) => {
    const nextList = attachedArticles.filter((a) => a.id !== articleId);
    onChange({ articleRefs: nextList, articleRef: undefined });
  };

  return (
    <aside
      aria-label="Thuộc tính Node"
      className="flex max-h-[580px] w-full shrink-0 flex-col overflow-y-auto rounded-2xl border border-[var(--border,#E2D5B8)] bg-white p-4 shadow-sm lg:w-80"
    >
      <div className="mb-3 flex items-center justify-between border-b border-[var(--border,#E2D5B8)] pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary,#7A1F24)]">
          {node.isStickyNote ? 'Ghi chú dán' : 'Thuộc tính Node'}
        </h4>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thuộc tính"
          className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3.5 text-xs">
        <label className="block space-y-1">
          <span className="font-bold text-stone-700">Tiêu đề / Từ khoá</span>
          <input
            type="text"
            value={node.title}
            onChange={(e) => onChange({ title: e.target.value })}
            maxLength={100}
            className="w-full rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 px-2.5 py-1.5 font-semibold text-stone-900 outline-none focus:border-[var(--gold,#B8893F)]"
          />
        </label>

        <label className="block space-y-1">
          <span className="font-bold text-stone-700">Nhãn phụ / Niên đại</span>
          <input
            type="text"
            value={node.badge ?? ''}
            onChange={(e) => onChange({ badge: e.target.value })}
            placeholder="VD: 1225 – 1400 hoặc Nhánh 1"
            maxLength={60}
            className="w-full rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 px-2.5 py-1.5 text-stone-800 outline-none focus:border-[var(--gold,#B8893F)]"
          />
        </label>

        {/* Hình ảnh đầu Node */}
        <div className="space-y-1.5">
          <span className="flex items-center gap-1 font-bold text-stone-700">
            <ImagePlus size={12} className="text-[var(--gold,#B8893F)]" /> Hình ảnh minh hoạ (URL)
          </span>
          <div className="flex gap-1.5">
            <input
              type="url"
              value={node.imageUrl ?? ''}
              onChange={(e) => onChange({ imageUrl: e.target.value || undefined })}
              placeholder="https://... (tự điền khi gắn bài có ảnh)"
              className="min-w-0 flex-1 rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 px-2.5 py-1.5 text-xs outline-none focus:border-[var(--gold,#B8893F)]"
            />
            {node.imageUrl && (
              <button
                type="button"
                onClick={() => onChange({ imageUrl: undefined })}
                title="Gỡ ảnh"
                className="rounded-lg border border-[var(--border,#E2D5B8)] px-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Phối màu thẻ */}
        <div className="space-y-1.5">
          <span className="block font-bold text-stone-700">Phối màu nhánh</span>
          <div className="flex flex-wrap gap-2">
            {Object.values(MindmapBranchColor).map((color) => {
              const meta = BRANCH_COLOR_STYLES[color];
              const active = node.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange({ color })}
                  title={meta.label}
                  aria-label={meta.label}
                  className={`size-6 rounded-full ${meta.dot} transition cursor-pointer ${
                    active ? 'ring-2 ring-offset-2 ring-stone-900 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Tuỳ biến hình dáng & kích thước kiểu Block Builder */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="block font-bold text-stone-700">Hình dáng</span>
            <div className="grid grid-cols-2 gap-1">
              {SHAPE_OPTIONS.map((opt) => {
                const active = (node.shape ?? MindmapNodeShape.CARD) === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ shape: opt.id })}
                    className={`rounded-lg border px-1.5 py-1 text-[10px] font-semibold cursor-pointer ${
                      active
                        ? 'border-[#7A1F24] bg-[#7A1F24] text-white'
                        : 'border-[var(--border,#E2D5B8)] bg-white text-stone-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <span className="block font-bold text-stone-700">Kích thước</span>
            <div className="grid grid-cols-3 gap-1">
              {SIZE_OPTIONS.map((opt) => {
                const active = (node.size ?? MindmapNodeSize.MD) === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ size: opt.id })}
                    className={`rounded-lg border px-1 py-1 text-[10px] font-semibold cursor-pointer ${
                      active
                        ? 'border-[#7A1F24] bg-[#7A1F24] text-white'
                        : 'border-[var(--border,#E2D5B8)] bg-white text-stone-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="font-bold text-stone-700">Ghi chú chi tiết</span>
          <textarea
            rows={3}
            value={node.note ?? ''}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="Ý chính, năm diễn ra hoặc nhận xét ngắn…"
            maxLength={600}
            className="w-full resize-none rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-2 text-xs leading-relaxed text-stone-800 outline-none focus:border-[var(--gold,#B8893F)]"
          />
        </label>

        {/* Tư liệu HISGO đính kèm (cho phép gắn nhiều bài viết) */}
        <div className="space-y-2 border-t border-[var(--border,#E2D5B8)] pt-3">
          <span className="flex items-center gap-1 font-bold text-stone-700">
            <Link2 size={12} className="text-[var(--gold,#B8893F)]" /> Tư liệu HISGO đính kèm ({attachedArticles.length})
          </span>

          {attachedArticles.length > 0 && (
            <ul className="space-y-1.5">
              {attachedArticles.map((art) => (
                <li
                  key={art.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/60 px-2.5 py-1.5"
                >
                  <Link
                    href={PUBLIC_ROUTES.ARTICLE(art.slug)}
                    target="_blank"
                    className="inline-flex min-w-0 items-center gap-1 font-semibold text-[var(--primary,#7A1F24)] hover:underline"
                  >
                    <span className="truncate">{art.title}</span>
                    <ExternalLink size={11} className="shrink-0" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeArticle(art.id)}
                    title="Gỡ tư liệu"
                    className="shrink-0 rounded p-1 text-stone-500 hover:bg-white hover:text-rose-700 cursor-pointer"
                  >
                    <Unlink size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1.5">
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={articleQuery}
                onFocus={() => {
                  if (results.length === 0) void runSearch(articleQuery);
                }}
                onChange={(e) => void runSearch(e.target.value)}
                placeholder="Tìm hoặc bấm để chọn nhiều bài viết…"
                className="w-full rounded-lg border border-[var(--border,#E2D5B8)] bg-white py-1.5 pl-7 pr-2 text-xs outline-none focus:border-[var(--gold,#B8893F)]"
              />
            </div>
            {searching && <p className="text-[11px] text-stone-400">Đang tìm…</p>}
            {results.length > 0 && (
              <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-[var(--border,#E2D5B8)] bg-white p-1">
                {results.map((art) => {
                  const alreadyAdded = attachedArticles.some((a) => a.id === art.id);
                  return (
                    <li key={art.id}>
                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addArticle(art)}
                        className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-[11px] font-medium text-stone-800 hover:bg-[var(--bg-page,#F5EEDC)] disabled:opacity-45 cursor-pointer"
                      >
                        <span className="truncate">{art.title}</span>
                        <span className="shrink-0 text-[10px] font-bold text-[#7A1F24]">
                          {alreadyAdded ? 'Đã gắn' : '+ Gắn'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Các đường nối của Node */}
        {connectedEdges.length > 0 && (
          <div className="space-y-1.5 border-t border-[var(--border,#E2D5B8)] pt-3">
            <span className="block font-bold text-stone-700">Đường nối ({connectedEdges.length})</span>
            <ul className="space-y-1.5">
              {connectedEdges.map((edge) => {
                const otherId = edge.fromId === node.id ? edge.toId : edge.fromId;
                const other = nodeMap.get(otherId);
                return (
                  <li key={edge.id} className="flex items-center gap-1.5 rounded-lg border border-[var(--border,#E2D5B8)] bg-stone-50 px-2 py-1">
                    <span className="max-w-[90px] truncate text-[11px] font-semibold text-stone-700">
                      {other?.title ?? 'Node'}
                    </span>
                    <input
                      type="text"
                      value={edge.label ?? ''}
                      onChange={(e) => onUpdateEdge(edge.id, e.target.value)}
                      placeholder="Nhãn nối…"
                      className="min-w-0 flex-1 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[11px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onDeleteEdge(edge.id)}
                      title="Ngắt đường nối"
                      className="shrink-0 rounded p-1 text-stone-400 hover:text-rose-700 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-[var(--border,#E2D5B8)] pt-3">
          <button
            type="button"
            onClick={onAddChild}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#7A1F24] px-3 py-2 font-bold text-white hover:brightness-110 cursor-pointer"
          >
            <Plus size={13} /> Thêm nhánh con
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Xoá node"
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
