'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  GitBranchPlus,
  Globe,
  Milestone,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { RemoteImage } from '@/components/common/CommonUi';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import {
  ConceptCanvasEngine,
  SPATIAL_LAYOUT,
  type SpatialCanvasNode,
  type SpatialMatchedArticle,
  type SpatialNodeVersion,
} from '../services/concept-canvas.service';

enum TokenKind {
  TEXT = 'TEXT',
  BOLD = 'BOLD',
  CONCEPT = 'CONCEPT',
}

interface RichToken {
  kind: TokenKind;
  label: string;
  query?: string;
  trailingPunct?: string;
}

const ENGINE_LABELS: Record<ConceptCanvasEngine, string> = {
  [ConceptCanvasEngine.VERTEX_RAG]: 'HISGO RAG',
  [ConceptCanvasEngine.GOOGLE_GROUNDED]: 'GOOGLE SEARCH',
  [ConceptCanvasEngine.GEMINI_AI]: 'AI SỬ HỌC',
  [ConceptCanvasEngine.HISGO_DB_FALLBACK]: 'TƯ LIỆU HISGO',
  [ConceptCanvasEngine.OUT_OF_CORPUS]: 'NGOÀI KHO HISGO',
};

function findClosingParen(text: string, openParenIdx: number): number {
  let depth = 0;
  for (let i = openParenIdx; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function tryReadConceptToken(
  text: string,
  pos: number,
): { token: RichToken; nextPos: number } | null {
  const hasBoldWrap = text.startsWith('**[', pos);
  if (!hasBoldWrap && text[pos] !== '[') return null;

  const labelStart = hasBoldWrap ? pos + 3 : pos + 1;
  const closeBracket = text.indexOf(']', labelStart);
  if (closeBracket <= labelStart || text[closeBracket + 1] !== '(') return null;

  const closeParen = findClosingParen(text, closeBracket + 1);
  if (closeParen < 0) return null;

  const label = text.slice(labelStart, closeBracket).trim();
  const query = text.slice(closeBracket + 2, closeParen).trim() || label;
  const hasTrailingBold = hasBoldWrap && text.startsWith('**', closeParen + 1);
  const nextPos = hasTrailingBold ? closeParen + 3 : closeParen + 1;

  return { token: { kind: TokenKind.CONCEPT, label, query }, nextPos };
}

function tryReadBoldToken(
  text: string,
  pos: number,
): { token: RichToken; nextPos: number } | null {
  if (!text.startsWith('**', pos)) return null;
  const closeBold = text.indexOf('**', pos + 2);
  if (closeBold <= pos + 2) return null;
  return {
    token: { kind: TokenKind.BOLD, label: text.slice(pos + 2, closeBold) },
    nextPos: closeBold + 2,
  };
}

const TRAILING_PUNCT_RE = /^([,.;:!?）”"')\]}]+)([\s\S]*)$/;

function cleanStreamingTail(raw: string, isStreaming: boolean): string {
  if (!isStreaming) return raw;
  return raw
    .replace(/(?:\*\*)?\[([^\]]+)\]\([^)]*$/, '**$1**')
    .replace(/(?:\*\*)?\[([^\]]*)$/, '$1')
    .replace(/\*+$/, '');
}

function attachPunctuationToConcepts(tokens: RichToken[]): RichToken[] {
  const merged: RichToken[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const cur = tokens[i];
    const next = tokens[i + 1];
    if (cur.kind === TokenKind.CONCEPT && next?.kind === TokenKind.TEXT) {
      const m = TRAILING_PUNCT_RE.exec(next.label);
      if (m) {
        merged.push({ ...cur, trailingPunct: m[1] });
        if (m[2]) {
          tokens[i + 1] = { kind: TokenKind.TEXT, label: m[2] };
        } else {
          i += 1;
        }
        continue;
      }
    }
    merged.push(cur);
  }
  return merged;
}

function tokenizeParagraph(paragraph: string): RichToken[] {
  const tokens: RichToken[] = [];
  let plainStart = 0;
  let cursor = 0;

  while (cursor < paragraph.length) {
    const match =
      tryReadConceptToken(paragraph, cursor) ??
      tryReadBoldToken(paragraph, cursor);

    if (match) {
      if (cursor > plainStart) {
        tokens.push({
          kind: TokenKind.TEXT,
          label: paragraph.slice(plainStart, cursor),
        });
      }
      tokens.push(match.token);
      cursor = match.nextPos;
      plainStart = cursor;
    } else {
      cursor += 1;
    }
  }

  if (plainStart < paragraph.length) {
    tokens.push({ kind: TokenKind.TEXT, label: paragraph.slice(plainStart) });
  }
  return attachPunctuationToConcepts(tokens);
}

function useTypewriterChars(fullText: string, animate: boolean): string {
  const [charCount, setCharCount] = useState<number>(() =>
    animate ? 0 : fullText.length,
  );

  useEffect(() => {
    if (!animate) return undefined;
    const step = Math.max(5, Math.ceil(fullText.length / 40));
    const timer = window.setInterval(() => {
      setCharCount((prev) => {
        if (prev >= fullText.length) {
          window.clearInterval(timer);
          return fullText.length;
        }
        return Math.min(fullText.length, prev + step);
      });
    }, 20);
    return () => window.clearInterval(timer);
  }, [animate, fullText]);

  return animate ? fullText.slice(0, charCount) : fullText;
}

function ConceptParagraphs({
  text,
  animate,
  onBranchConcept,
  onReadConceptInDrawer,
}: {
  text: string;
  animate: boolean;
  onBranchConcept: (concept: string) => void;
  onReadConceptInDrawer: (concept: string) => void;
}) {
  const rawVisibleText = useTypewriterChars(text, animate);
  const isStreaming = animate && rawVisibleText.length < text.length;
  const visibleText = useMemo(
    () => cleanStreamingTail(rawVisibleText, isStreaming),
    [isStreaming, rawVisibleText],
  );
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  const paragraphs = useMemo(
    () =>
      visibleText
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [visibleText],
  );

  return (
    <div
      onClick={() => setOpenMenuKey(null)}
      className="space-y-3 text-[14.5px] leading-[1.72] text-[#1E1610]"
    >
      {paragraphs.map((para, pIdx) => (
        <p key={`p-${pIdx}`}>
          {tokenizeParagraph(para).map((tok, tIdx) => {
            const tokenKey = `${pIdx}-${tIdx}`;
            if (tok.kind === TokenKind.CONCEPT) {
              const conceptQuery = tok.query ?? tok.label;
              const isMenuOpen = openMenuKey === tokenKey;
              return (
                <span key={tokenKey} className="relative inline">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuKey(isMenuOpen ? null : tokenKey);
                    }}
                    className="inline cursor-pointer rounded-xs px-0.5 font-bold text-[#1A120B] underline decoration-[#1A120B] decoration-2 underline-offset-4 transition-colors hover:bg-[#FDE68A]"
                  >
                    {tok.label}
                  </button>
                  {tok.trailingPunct ?? null}
                  {isMenuOpen && (
                    <span
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-full left-0 z-40 mb-1.5 flex items-center gap-1 rounded-md border-2 border-[#1A120B] bg-[#FFFDF8] p-1 whitespace-nowrap shadow-[3px_3px_0px_#1A120B]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuKey(null);
                          onBranchConcept(conceptQuery);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-[#1A120B] transition hover:bg-[#FDE68A]"
                      >
                        <GitBranchPlus size={12} /> Mở Node mới
                      </button>
                      <span className="h-3.5 w-px bg-[#D6C5A9]" />
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuKey(null);
                          onReadConceptInDrawer(conceptQuery);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-[#7A1F24] transition hover:bg-[#F5E6D3]"
                      >
                        <BookOpen size={12} /> Đọc góc bên
                      </button>
                    </span>
                  )}
                </span>
              );
            }
            if (tok.kind === TokenKind.BOLD) {
              return (
                <strong key={tokenKey} className="font-bold text-[#1A120B]">
                  {tok.label}
                </strong>
              );
            }
            return <React.Fragment key={tokenKey}>{tok.label}</React.Fragment>;
          })}
        </p>
      ))}
    </div>
  );
}

function NodeMediaHeader({
  prompt,
  version,
}: {
  prompt: string;
  version: SpatialNodeVersion | undefined;
}) {
  const resolvedImg = resolveBackendAssetUrl(version?.imageUrl);
  const engineBadge = version ? ENGINE_LABELS[version.engine] : 'ĐANG TRA CỨU';

  if (resolvedImg) {
    return (
      <div className="relative h-44 w-full overflow-hidden border-b-2 border-[#1A120B] bg-[#24160E]">
        <RemoteImage
          src={resolvedImg}
          alt={prompt}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute right-3 bottom-2.5 left-3 flex items-center justify-between gap-2 font-mono text-[11px] text-white">
          <span className="truncate font-semibold text-[#FDE68A]">
            {version?.periodLabel}
          </span>
          <span className="shrink-0 rounded border border-white/50 bg-black/75 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            {engineBadge}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b-2 border-[#1A120B] bg-[#1A120B] px-3.5 py-2 font-mono text-[11px] text-[#FAF5E6]">
      <span className="inline-flex items-center gap-1.5 truncate font-semibold text-[#FDE68A]">
        <Compass size={13} />
        {version?.periodLabel || 'Lịch sử'}
      </span>
      <span className="shrink-0 rounded border border-[#FDE68A]/50 bg-[#7A1F24] px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
        {engineBadge}
      </span>
    </div>
  );
}

function MatchedSourcesFooter({
  version,
  onOpenArticleInDrawer,
  onSearchTimelineInDrawer,
}: {
  version: SpatialNodeVersion;
  onOpenArticleInDrawer: (art: SpatialMatchedArticle) => void;
  onSearchTimelineInDrawer: (title: string) => void;
}) {
  const hasHisgo =
    version.matchedArticles.length > 0 ||
    version.matchedTimelineNodes.length > 0 ||
    (version.ragCitations?.length ?? 0) > 0;
  const hasWeb =
    version.webSources.length > 0 ||
    (version.webSearchQueries?.length ?? 0) > 0;
  if (!hasHisgo && !hasWeb) return null;

  return (
    <div className="mt-4 space-y-3 border-t-2 border-dashed border-[#D5C4A6] pt-3">
      {hasHisgo && (
        <div className="space-y-1.5">
          <span className="block font-mono text-[10.5px] font-bold tracking-wider text-[#6E5337] uppercase">
            Bài viết &amp; Tư liệu kho HISGO
          </span>
          <div className="flex flex-wrap gap-1.5">
            {version.matchedArticles.map((art) => (
              <div
                key={art.id}
                className="inline-flex max-w-full items-center overflow-hidden rounded border border-[#1A120B] bg-[#FAF3E0] shadow-[2px_2px_0px_#1A120B]"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenArticleInDrawer(art);
                  }}
                  title="Đọc nhanh trong ngăn bên cạnh"
                  className="inline-flex max-w-[290px] cursor-pointer items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#1A120B] transition hover:bg-[#FDE68A]"
                >
                  <BookOpen size={12} className="shrink-0 text-[#7A1F24]" />
                  <span className="truncate">{art.title}</span>
                </button>
                <Link
                  href={PUBLIC_ROUTES.ARTICLE(art.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={`Mở bài viết: ${art.title}`}
                  aria-label={`Mở trang bài viết ${art.title}`}
                  className="inline-flex items-center border-l border-[#1A120B]/30 px-2 py-1 text-[#7A1F24] transition hover:bg-[#FDE68A]"
                >
                  <ExternalLink size={11} />
                </Link>
              </div>
            ))}

            {version.matchedTimelineNodes.map((tl) => (
              <button
                key={tl.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSearchTimelineInDrawer(tl.title);
                }}
                className="inline-flex max-w-full cursor-pointer items-center gap-1 rounded border border-[#8a6828] bg-[#FFFDF8] px-2 py-1 text-xs font-semibold text-[#4A3520] transition hover:bg-[#FAF3E0]"
              >
                <Milestone size={12} className="shrink-0 text-[#8a6828]" />
                <span className="truncate">{tl.title}</span>
              </button>
            ))}

            {(version.ragCitations ?? []).map((cit, idx) =>
              cit.href ? (
                <a
                  key={`rag-cit-${idx}`}
                  href={cit.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex max-w-full items-center gap-1 rounded border border-sky-700/40 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-900 transition hover:bg-sky-100"
                >
                  <Globe size={11} className="shrink-0 text-sky-700" />
                  <span className="truncate">{cit.title}</span>
                  <ExternalLink size={10} className="shrink-0 opacity-75" />
                </a>
              ) : (
                <span
                  key={`rag-cit-${idx}`}
                  title={cit.subtitle || cit.title}
                  className="inline-flex max-w-full items-center gap-1 rounded border border-amber-700/35 bg-amber-50 px-2 py-1 text-xs font-semibold text-stone-800"
                >
                  <BookMarked size={11} className="shrink-0 text-amber-800" />
                  <span className="truncate">{cit.title}</span>
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {hasWeb && (
        <div className="space-y-1.5">
          <span className="block font-mono text-[10.5px] font-bold tracking-wider text-sky-900 uppercase">
            Tài liệu &amp; Bài viết từ Google Search
          </span>

          {(version.webSearchQueries?.length ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {(version.webSearchQueries ?? []).slice(0, 3).map((q, qIdx) => (
                <span
                  key={`wq-${qIdx}`}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[10.5px] font-medium text-stone-600"
                >
                  <Search size={10} className="shrink-0 text-stone-500" />
                  <span className="max-w-[260px] truncate">{q}</span>
                </span>
              ))}
            </div>
          )}

          {version.webSources.length > 0 && (
            <div className="space-y-1.5">
              {version.webSources.map((src, idx) => (
                <a
                  key={`${src.uri}-${idx}`}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-col gap-0.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-left transition hover:border-blue-600 hover:bg-sky-50/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Globe size={12} className="shrink-0 text-blue-700" />
                      <span className="truncate text-xs font-bold text-slate-900">
                        {src.title}
                      </span>
                      {src.domain && src.domain !== src.title && (
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {src.domain}
                        </span>
                      )}
                    </div>
                    <ExternalLink size={11} className="shrink-0 text-blue-700" />
                  </div>
                  {src.snippet && (
                    <p className="line-clamp-2 pl-4 text-[11px] leading-snug text-slate-600">
                      {src.snippet}
                    </p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface SpatialNodeCardProps {
  index: number;
  node: SpatialCanvasNode;
  canDelete: boolean;
  onBranchPrompt: (parentId: string, prompt: string, slotIndex: number) => void;
  onRegenerate: (nodeId: string) => void;
  onSwitchVersion: (nodeId: string, nextIndex: number) => void;
  onDeleteSubtree: (nodeId: string) => void;
  onStartNodeDrag: (nodeId: string, e: React.PointerEvent) => void;
  onOpenArticleInDrawer: (nodeId: string, art: SpatialMatchedArticle) => void;
  onSearchConceptInDrawer: (nodeId: string, conceptQuery: string) => void;
}

export function SpatialNodeCard({
  index,
  node,
  canDelete,
  onBranchPrompt,
  onRegenerate,
  onSwitchVersion,
  onDeleteSubtree,
  onStartNodeDrag,
  onOpenArticleInDrawer,
  onSearchConceptInDrawer,
}: SpatialNodeCardProps) {
  const activeVersion = node.versions[node.versionIndex];
  const totalVersions = node.versions.length;
  const charCount = activeVersion?.text.length ?? 0;

  return (
    <div
      data-spatial-node="true"
      data-testid={`spatial-node-${node.id}`}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: `${SPATIAL_LAYOUT.CARD_WIDTH}px`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute top-0 left-0 z-10 flex flex-col gap-2 select-text"
    >
      <div
        onPointerDown={(e) => onStartNodeDrag(node.id, e)}
        className="flex w-fit cursor-grab touch-none items-center gap-2.5 rounded-full border-2 border-[#1A120B] bg-[#FFFDF8] px-3 py-1 font-mono text-[11px] text-[#1A120B] shadow-[2px_2px_0px_#1A120B] select-none active:cursor-grabbing"
      >
        <span className="font-bold">
          NODE {index + 1}.{node.versionIndex}
        </span>
        <span className="h-3 w-px bg-[#CBB692]" />
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Phiên bản trước"
            disabled={node.versionIndex <= 0 || node.loading}
            onClick={() => onSwitchVersion(node.id, node.versionIndex - 1)}
            className="cursor-pointer rounded p-0.5 hover:bg-[#F2E6CC] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="min-w-[28px] text-center font-bold">
            {totalVersions > 0 ? `${node.versionIndex + 1}/${totalVersions}` : '1/1'}
          </span>
          <button
            type="button"
            aria-label="Phiên bản tiếp"
            disabled={node.versionIndex >= totalVersions - 1 || node.loading}
            onClick={() => onSwitchVersion(node.id, node.versionIndex + 1)}
            className="cursor-pointer rounded p-0.5 hover:bg-[#F2E6CC] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={13} />
          </button>
        </div>
        <span className="h-3 w-px bg-[#CBB692]" />
        <span className="text-[10px] text-[#5C4430]">
          {node.loading ? '---' : `${charCount} KT`}
        </span>
        <span className="h-3 w-px bg-[#CBB692]" />
        <button
          type="button"
          title="Phân tích lại góc nhìn khác"
          aria-label="Tạo lại nội dung khái niệm"
          disabled={node.loading}
          onClick={() => onRegenerate(node.id)}
          className="cursor-pointer p-0.5 hover:text-[#7A1F24] disabled:opacity-40"
        >
          <RefreshCw size={13} className={node.loading ? 'animate-spin' : ''} />
        </button>
        {canDelete && (
          <button
            type="button"
            title="Xóa nhánh này"
            aria-label="Xóa nhánh khái niệm"
            disabled={node.loading}
            onClick={() => onDeleteSubtree(node.id)}
            className="cursor-pointer p-0.5 hover:text-red-700 disabled:opacity-40"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="relative">
        {totalVersions > 1 && (
          <>
            <div className="pointer-events-none absolute top-1.5 -right-1.5 -z-10 h-full w-full rounded-lg border-2 border-[#1A120B] bg-[#FAF3E0] shadow-[2px_2px_0px_#1A120B]" />
            <div className="pointer-events-none absolute top-3 -right-3 -z-20 h-full w-full rounded-lg border-2 border-[#1A120B] bg-[#F2E6CC] shadow-[2px_2px_0px_#1A120B]" />
          </>
        )}

        <article className="overflow-visible rounded-lg border-2 border-[#1A120B] bg-[#FFFDF8] shadow-[5px_5px_0px_#1A120B]">
          <NodeMediaHeader prompt={node.prompt} version={activeVersion} />

          <div className="p-4">
            <h3
              onPointerDown={(e) => onStartNodeDrag(node.id, e)}
              className="mb-3 cursor-grab touch-none font-serif text-lg leading-snug font-bold text-[#1A120B] select-none active:cursor-grabbing"
            >
              {node.prompt}
            </h3>

            {node.loading && (
              <div className="space-y-3 py-5" role="status" aria-live="polite">
                <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-[#7A1F24] uppercase">
                  <Sparkles size={14} className="animate-spin" />
                  <span>Đang kết nối mạch sử liệu...</span>
                </div>
                <div className="h-3 w-11/12 animate-pulse rounded bg-[#E6D8BE]" />
                <div className="h-3 w-full animate-pulse rounded bg-[#E6D8BE]" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-[#E6D8BE]" />
              </div>
            )}

            {!node.loading && node.error && (
              <div className="rounded border-2 border-[#7A1F24] bg-[#FDF1F2] p-3 text-xs text-[#7A1F24]">
                <p className="font-semibold">{node.error}</p>
                <button
                  type="button"
                  onClick={() => onRegenerate(node.id)}
                  className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded border border-[#1A120B] bg-[#7A1F24] px-2.5 py-1 font-bold text-[#FAF5E6] shadow-[2px_2px_0px_#1A120B]"
                >
                  <RefreshCw size={12} /> Thử lại
                </button>
              </div>
            )}

            {!node.loading && activeVersion && (
              <>
                <ConceptParagraphs
                  key={`${node.id}-v-${node.versionIndex}`}
                  text={activeVersion.text}
                  animate={activeVersion.animateText}
                  onBranchConcept={(concept) => onBranchPrompt(node.id, concept, 1)}
                  onReadConceptInDrawer={(concept) =>
                    onSearchConceptInDrawer(node.id, concept)
                  }
                />
                <MatchedSourcesFooter
                  version={activeVersion}
                  onOpenArticleInDrawer={(art) => onOpenArticleInDrawer(node.id, art)}
                  onSearchTimelineInDrawer={(title) =>
                    onSearchConceptInDrawer(node.id, title)
                  }
                />
              </>
            )}
          </div>
        </article>
      </div>

      {!node.loading && activeVersion && activeVersion.prompts.length > 0 && (
        <div
          style={{ width: `${SPATIAL_LAYOUT.PROMPT_CLUSTER_WIDTH}px` }}
          className="mt-2.5 flex flex-col gap-2.5 md:absolute md:top-10 md:left-[466px] md:mt-0"
        >
          {activeVersion.prompts.map((followUp, idx) => (
            <button
              key={`${node.id}-p-${idx}`}
              type="button"
              data-testid={`spatial-followup-${node.id}-${idx}`}
              onClick={() => onBranchPrompt(node.id, followUp, idx)}
              className="group flex cursor-pointer items-start gap-2 rounded-lg border-2 border-[#1A120B] bg-[#FFFDF8] px-3 py-2.5 text-left text-xs font-bold text-[#1A120B] shadow-[3px_3px_0px_#1A120B] transition hover:-translate-y-0.5 hover:bg-[#FEF3C7]"
            >
              <Sparkles
                size={13}
                className="mt-0.5 shrink-0 text-[#7A1F24] transition group-hover:scale-110"
              />
              <span className="leading-snug">{followUp}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
