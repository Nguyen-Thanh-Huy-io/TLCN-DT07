'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Compass,
  ExternalLink,
  Globe,
  GraduationCap,
  History,
  Landmark,
  Newspaper,
  Search,
  Swords,
  User,
} from 'lucide-react';
import { URL_PROTOCOLS } from '@/constants/routes';
import {
  ASSISTANT_LINK_KIND_META,
  AssistantChatRole,
  AssistantEngine,
  AssistantLinkKind,
} from '../constants/ai-assistant.constants';
import type {
  AssistantQuickAction,
  AssistantSourceCitation,
  AssistantSuggestedLink,
  AssistantWebSource,
} from '../services/ai-assistant.service';

export interface ChatMessageItem {
  id: string;
  role: AssistantChatRole;
  content: string;
  engine?: AssistantEngine;
  suggestGoogleFallback?: boolean;
  retryPrompt?: string;
  suggestedLinks?: AssistantSuggestedLink[];
  sourceCitations?: AssistantSourceCitation[];
  webSources?: AssistantWebSource[];
  webSearchQueries?: string[];
  quickActions?: AssistantQuickAction[];
}

const SECTION_LABEL_CLASS =
  'block text-[11px] font-bold uppercase tracking-wider text-stone-500';

const LINK_CARD_CLASS =
  'flex items-center justify-between gap-2.5 rounded-xl border border-[var(--border,#E2D5B8)] bg-[#FFFCF5] px-3 py-2 text-left transition hover:border-[var(--gold,#B8893F)] hover:bg-[var(--bg-page,#F5EEDC)]';

export function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>
        {segments.map((seg, sIdx) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return (
              <strong key={sIdx} className="font-bold text-[#7A1F24]">
                {seg.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={sIdx}>{seg}</React.Fragment>;
        })}
      </p>
    );
  });
}

function isExternalUrl(link: AssistantSuggestedLink): boolean {
  return (
    Boolean(link.external) ||
    link.href.startsWith(URL_PROTOCOLS.HTTPS) ||
    link.href.startsWith(URL_PROTOCOLS.HTTP)
  );
}

function renderLinkKindIcon(kind: AssistantLinkKind, className: string) {
  switch (kind) {
    case AssistantLinkKind.EVENT:
      return <Swords size={15} className={className} />;
    case AssistantLinkKind.PERSON:
      return <User size={15} className={className} />;
    case AssistantLinkKind.LOCATION:
      return <Landmark size={15} className={className} />;
    case AssistantLinkKind.LESSON:
      return <GraduationCap size={15} className={className} />;
    case AssistantLinkKind.BLOG:
      return <Newspaper size={15} className={className} />;
    case AssistantLinkKind.TIMELINE:
      return <History size={15} className={className} />;
    case AssistantLinkKind.WIKIPEDIA:
      return <Globe size={15} className={className} />;
    case AssistantLinkKind.ROUTE:
      return <Compass size={15} className={className} />;
    case AssistantLinkKind.ARTICLE:
    default:
      return <BookOpen size={15} className={className} />;
  }
}

function AssistantLinkCard({
  link,
  onNavigate,
}: {
  link: AssistantSuggestedLink;
  onNavigate: () => void;
}) {
  const meta =
    ASSISTANT_LINK_KIND_META[link.kind] ??
    ASSISTANT_LINK_KIND_META[AssistantLinkKind.ARTICLE];
  const external = isExternalUrl(link);

  const innerContent = (
    <>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`shrink-0 ${meta.iconColorClass}`}>
          {renderLinkKindIcon(link.kind, 'shrink-0')}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-none ${meta.badgeClass}`}
            >
              {meta.label}
            </span>
            <span className="truncate text-sm font-bold text-stone-800">
              {link.title}
            </span>
          </div>
          {link.subtitle && (
            <div className="mt-0.5 truncate text-xs text-stone-500">
              {link.subtitle}
            </div>
          )}
        </div>
      </div>
      {external ? (
        <ExternalLink size={14} className="shrink-0 text-sky-700" />
      ) : (
        <ArrowRight size={14} className="shrink-0 text-[#7A1F24]" />
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CARD_CLASS}
      >
        {innerContent}
      </a>
    );
  }

  return (
    <Link href={link.href} onClick={onNavigate} className={LINK_CARD_CLASS}>
      {innerContent}
    </Link>
  );
}

export function AssistantMessageAttachments({
  links,
  citations,
  webSources,
  webSearchQueries,
  actions,
  suggestGoogleFallback,
  retryPrompt,
  onRetryWithGoogle,
  onNavigate,
}: {
  links?: AssistantSuggestedLink[];
  citations?: AssistantSourceCitation[];
  webSources?: AssistantWebSource[];
  webSearchQueries?: string[];
  actions?: AssistantQuickAction[];
  suggestGoogleFallback?: boolean;
  retryPrompt?: string;
  onRetryWithGoogle?: (prompt: string) => void;
  onNavigate: () => void;
}) {
  const internalLinks = (links ?? []).filter((l) => !isExternalUrl(l));
  const externalLinks = (links ?? []).filter((l) => isExternalUrl(l));
  const hasInternalLinks = internalLinks.length > 0;
  const hasExternalLinks = externalLinks.length > 0;
  const hasCitations = Boolean(citations && citations.length > 0);
  const hasWeb =
    Boolean(webSources && webSources.length > 0) ||
    Boolean(webSearchQueries && webSearchQueries.length > 0);
  const hasActions = Boolean(actions && actions.length > 0);
  const showGoogleRetry = Boolean(
    suggestGoogleFallback && retryPrompt && onRetryWithGoogle,
  );
  if (
    !hasInternalLinks &&
    !hasExternalLinks &&
    !hasCitations &&
    !hasWeb &&
    !hasActions &&
    !showGoogleRetry
  ) {
    return null;
  }

  return (
    <div className="mt-3.5 space-y-2.5 border-t border-[var(--border,#E2D5B8)]/60 pt-3">
      {showGoogleRetry && (
        <button
          type="button"
          onClick={() => onRetryWithGoogle!(retryPrompt!)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-600 bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-sky-700 cursor-pointer"
        >
          <Globe size={14} />
          <span>Bật Google &amp; tra cứu câu này</span>
        </button>
      )}

      {hasInternalLinks && (
        <div className="space-y-1.5">
          <span className={SECTION_LABEL_CLASS}>
            Bài viết &amp; Đường dẫn HISGO liên quan
          </span>
          {internalLinks.map((link) => (
            <AssistantLinkCard
              key={link.href}
              link={link}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {hasExternalLinks && (
        <div className="space-y-1.5">
          <span className={SECTION_LABEL_CLASS}>
            Tài liệu tham khảo bên ngoài
          </span>
          {externalLinks.map((link) => (
            <AssistantLinkCard
              key={link.href}
              link={link}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {hasCitations && (
        <div className="space-y-1.5">
          <span className={SECTION_LABEL_CLASS}>
            Nguồn sách &amp; Tư liệu tham khảo
          </span>
          <div className="flex flex-wrap gap-1.5">
            {citations!.map((cit) => (
              <div
                key={cit.title}
                title={cit.note || cit.authorOrPublisher || cit.title}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/70 px-2.5 py-1 text-xs text-stone-700"
              >
                <BookMarked size={12} className="shrink-0 text-amber-800" />
                <span className="truncate font-semibold">{cit.title}</span>
                {cit.authorOrPublisher && (
                  <span className="truncate text-[11px] text-stone-500">
                    · {cit.authorOrPublisher}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasWeb && (
        <div className="space-y-1.5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-sky-900">
            Tài liệu &amp; Bài viết từ Google Search
          </span>

          {webSearchQueries && webSearchQueries.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {webSearchQueries.slice(0, 3).map((q, qIdx) => (
                <span
                  key={`chat-wq-${qIdx}`}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[10.5px] font-medium text-stone-600"
                >
                  <Search size={10} className="shrink-0 text-stone-500" />
                  <span className="max-w-[240px] truncate">{q}</span>
                </span>
              ))}
            </div>
          )}

          {webSources && webSources.length > 0 && (
            <div className="space-y-1.5">
              {webSources.map((src, idx) => (
                <a
                  key={`${src.uri}-${idx}`}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-0.5 rounded-xl border border-sky-200 bg-sky-50/40 px-3 py-2 text-left transition hover:border-sky-500 hover:bg-sky-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Globe size={13} className="shrink-0 text-sky-700" />
                      <span className="truncate text-xs font-bold text-stone-900">
                        {src.title}
                      </span>
                      {src.domain && src.domain !== src.title && (
                        <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">
                          {src.domain}
                        </span>
                      )}
                    </div>
                    <ExternalLink size={12} className="shrink-0 text-sky-700" />
                  </div>
                  {src.snippet && (
                    <p className="line-clamp-2 pl-5 text-[11px] leading-snug text-stone-600">
                      {src.snippet}
                    </p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {hasActions && (
        <div className="flex flex-wrap gap-2">
          {actions!.map((act) => (
            <Link
              key={`${act.href}-${act.label}`}
              href={act.href}
              onClick={onNavigate}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AE67]/80 bg-[#FAF5E6] px-3 py-1.5 text-xs font-bold text-[#7A1F24] transition hover:bg-[#F3E6C8]"
            >
              <span>{act.label}</span>
              <ArrowRight size={12} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
