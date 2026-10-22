'use client';

import type { ReactNode } from 'react';

export const FIELD_CLASS =
  'h-11 w-full rounded-xl border border-lh-line bg-lh-surface px-3.5 text-sm text-lh-ink outline-none transition focus:border-lh-brand/50 focus:ring-2 focus:ring-lh-brand/10';

export type NoticeState = { tone: 'ok' | 'error'; text: string } | null;

export function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null;
  return (
    <p role="status" className={`mt-2 text-sm ${notice.tone === 'ok' ? 'text-lh-brand' : 'text-lh-red'}`}>
      {notice.text}
    </p>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-lh-ink">
      {children}
    </label>
  );
}

export function AccountCard({
  id,
  eyebrow,
  title,
  action,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-lh-line bg-lh-surface p-5 shadow-lh-card sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-lh-brand">{eyebrow}</div>
          <h2 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold text-lh-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
