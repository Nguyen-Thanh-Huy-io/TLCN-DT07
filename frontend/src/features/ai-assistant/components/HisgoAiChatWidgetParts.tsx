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
  Swords,
  User,
} from 'lucide-react';
import { URL_PROTOCOLS } from '@/constants/routes';
import {
  ASSISTANT_LINK_KIND_META,
  AssistantChatRole,
  AssistantLinkKind,
} from '../constants/ai-assistant.constants';
import type {
  AssistantQuickAction,
  AssistantSourceCitation,
  AssistantSuggestedLink,
} from '../services/ai-assistant.service';

export interface ChatMessageItem {
  id: string;
  role: AssistantChatRole;
  content: string;
  suggestedLinks?: AssistantSuggestedLink[];
  sourceCitations?: AssistantSourceCitation[];
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
  actions,
  onNavigate,
}: {
  links?: AssistantSuggestedLink[];
  citations?: AssistantSourceCitation[];
  actions?: AssistantQuickAction[];
  onNavigate: () => void;
}) {
  const hasLinks = Boolean(links && links.length > 0);
  const hasCitations = Boolean(citations && citations.length > 0);
  const hasActions = Boolean(actions && actions.length > 0);
  if (!hasLinks && !hasCitations && !hasActions) return null;

  return (
    <div className="mt-3.5 space-y-2.5 border-t border-[var(--border,#E2D5B8)]/60 pt-3">
      {hasLinks && (
        <div className="space-y-1.5">
          <span className={SECTION_LABEL_CLASS}>Đường dẫn liên quan</span>
          {links!.map((link) => (
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
            Nguồn sách & Tư liệu tham khảo
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

      {hasActions && (
        <div className="flex flex-wrap gap-2">
          {actions!.map((act) => (
            <Link
              key={`${act.href}-${act.label}`}
              href={act.href}
              onClick={onNavigate}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#B8893F]/60 bg-white px-3.5 py-1.5 text-xs font-bold text-[#7A1F24] shadow-2xs transition hover:bg-[#7A1F24] hover:text-white"
            >
              <Compass size={13} />
              <span>{act.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
