'use client';

import React, { useEffect, useState, useRef } from 'react';
import api from '@/services/api';
import { ANNOTATION_DATA_ATTRS, FOOTNOTE_REF_CLASS } from '../extensions/annotation.extension';
import { WIKI_LINK_ROUTES } from '../strategies/wiki-link-target.strategy';

interface TooltipState {
  title?: string;
  body: string;
  x: number;
  y: number;
  loading?: boolean;
}

const MAX_TOOLTIP_LENGTH = 260;
const TOOLTIP_HIDE_DELAY_MS = 120;
const articleSummaryCache = new Map<string, { title: string; body: string } | null>();

function truncateText(text: string, maxLen: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen).trimEnd()}...`;
}

function extractArticleSlug(href: string): string | null {
  if (!href.startsWith(WIKI_LINK_ROUTES.ARTICLE_PREFIX)) return null;
  const rawSlug = href.slice(WIKI_LINK_ROUTES.ARTICLE_PREFIX.length).split(/[?#]/)[0];
  return rawSlug ? decodeURIComponent(rawSlug) : null;
}

function computeAnchorCoords(el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top,
  };
}

async function fetchArticleTooltip(slug: string): Promise<{ title: string; body: string } | null> {
  if (articleSummaryCache.has(slug)) {
    return articleSummaryCache.get(slug) ?? null;
  }
  try {
    const res = await api.get<{
      data?: { title?: string; excerpt?: string | null; summary?: string | null };
      title?: string;
      excerpt?: string | null;
      summary?: string | null;
    }>(`/public/articles/${encodeURIComponent(slug)}`);
    const payload = res.data?.data ?? res.data;
    const rawBody = payload?.excerpt || payload?.summary || '';
    const title = payload?.title || '';
    if (!title && !rawBody) {
      articleSummaryCache.set(slug, null);
      return null;
    }
    const entry = {
      title,
      body: rawBody ? truncateText(rawBody, MAX_TOOLTIP_LENGTH) : 'Bài viết lịch sử trong hệ thống',
    };
    articleSummaryCache.set(slug, entry);
    return entry;
  } catch {
    articleSummaryCache.set(slug, null);
    return null;
  }
}

/**
 * Hook gắn tự động đánh số chú thích (`1, 2, 3...`) và hiển thị Hover Tooltip
 * cho cả chú thích (`[data-footnote]`) lẫn liên kết Wiki (`a[data-tooltip]`, `/bai-viet/...`).
 */
export function useLessonAnnotations(
  contentRef: React.RefObject<HTMLDivElement | null>,
  htmlTrigger: string,
): React.ReactNode {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const footnoteEls = root.querySelectorAll<HTMLElement>(
      `sup[${ANNOTATION_DATA_ATTRS.FOOTNOTE}]`,
    );
    footnoteEls.forEach((el, idx) => {
      el.textContent = String(idx + 1);
      el.classList.add(FOOTNOTE_REF_CLASS);
      el.setAttribute('data-footnote-index', String(idx + 1));
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
    });
  }, [contentRef, htmlTrigger]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const scheduleHide = () => {
      clearHideTimer();
      hideTimerRef.current = setTimeout(() => {
        activeTargetRef.current = null;
        setTooltip(null);
      }, TOOLTIP_HIDE_DELAY_MS);
    };

    const showForFootnote = (el: HTMLElement) => {
      const note = el.getAttribute(ANNOTATION_DATA_ATTRS.FOOTNOTE)?.trim();
      if (!note) return;
      const idx = el.getAttribute('data-footnote-index');
      const coords = computeAnchorCoords(el);
      activeTargetRef.current = el;
      setTooltip({
        title: idx ? `Chú thích ${idx}` : 'Chú thích',
        body: truncateText(note, MAX_TOOLTIP_LENGTH),
        ...coords,
      });
    };

    const showForLink = async (el: HTMLAnchorElement) => {
      const customTip = el.getAttribute(ANNOTATION_DATA_ATTRS.TOOLTIP)?.trim();
      const href = el.getAttribute('href') || '';
      const coords = computeAnchorCoords(el);

      if (customTip) {
        activeTargetRef.current = el;
        setTooltip({ body: truncateText(customTip, MAX_TOOLTIP_LENGTH), ...coords });
        return;
      }

      const slug = extractArticleSlug(href);
      if (!slug) return;

      activeTargetRef.current = el;
      const cached = articleSummaryCache.get(slug);
      if (cached) {
        setTooltip({ title: cached.title, body: cached.body, ...coords });
        return;
      }

      setTooltip({ body: 'Đang tải tóm tắt...', loading: true, ...coords });
      const fetched = await fetchArticleTooltip(slug);
      if (activeTargetRef.current !== el) return;
      if (!fetched) {
        setTooltip(null);
        return;
      }
      setTooltip({ title: fetched.title, body: fetched.body, ...computeAnchorCoords(el) });
    };

    const handleTargetEnter = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return;
      const footnoteEl = target.closest<HTMLElement>(
        `sup[${ANNOTATION_DATA_ATTRS.FOOTNOTE}]`,
      );
      if (footnoteEl) {
        clearHideTimer();
        showForFootnote(footnoteEl);
        return;
      }
      const linkEl = target.closest<HTMLAnchorElement>('a[href]');
      if (linkEl) {
        clearHideTimer();
        void showForLink(linkEl);
      }
    };

    const handleMouseOver = (e: MouseEvent) => handleTargetEnter(e.target);
    const handleFocusIn = (e: FocusEvent) => handleTargetEnter(e.target);
    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget;
      if (related instanceof HTMLElement && activeTargetRef.current?.contains(related)) {
        return;
      }
      scheduleHide();
    };
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const footnoteEl = e.target.closest<HTMLElement>(
        `sup[${ANNOTATION_DATA_ATTRS.FOOTNOTE}]`,
      );
      if (footnoteEl) {
        e.preventDefault();
        clearHideTimer();
        showForFootnote(footnoteEl);
      }
    };

    root.addEventListener('mouseover', handleMouseOver);
    root.addEventListener('mouseout', handleMouseOut);
    root.addEventListener('focusin', handleFocusIn);
    root.addEventListener('focusout', scheduleHide);
    root.addEventListener('click', handleClick);

    return () => {
      clearHideTimer();
      root.removeEventListener('mouseover', handleMouseOver);
      root.removeEventListener('mouseout', handleMouseOut);
      root.removeEventListener('focusin', handleFocusIn);
      root.removeEventListener('focusout', scheduleHide);
      root.removeEventListener('click', handleClick);
    };
  }, [contentRef, htmlTrigger]);

  if (!tooltip) return null;

  return (
    <div
      role="tooltip"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y - 10}px`,
      }}
      className="fixed z-[90] -translate-x-1/2 -translate-y-full w-max max-w-[300px] pointer-events-none"
    >
      <div className="relative rounded-xl bg-stone-900 text-stone-50 px-3.5 py-2.5 text-xs leading-relaxed shadow-xl border border-stone-700/70">
        {tooltip.title && (
          <div className="font-bold text-amber-300 mb-0.5">{tooltip.title}</div>
        )}
        <div className={tooltip.loading ? 'italic text-stone-300' : 'text-stone-100'}>
          {tooltip.body}
        </div>
        <span
          aria-hidden="true"
          className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-stone-900 border-r border-b border-stone-700/70"
        />
      </div>
    </div>
  );
}
