'use client';

import { useEffect, useState } from 'react';
import { ListTree } from 'lucide-react';

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/** Theo dõi tiêu đề đang đọc để tô sáng trong mục lục. */
function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');
  useEffect(() => {
    if (!key) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    for (const id of key.split('|')) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);
  return active;
}

/** Mục lục bài học. `compact` = dạng gọn cho cột phải (dính theo khi cuộn). */
export function LessonToc({ items, compact = false }: { items: TocEntry[]; compact?: boolean }) {
  const active = useActiveHeading(items.map((i) => i.id));
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Mục lục bài học"
      className={compact ? '' : 'mb-7 rounded-2xl border border-lh-line bg-lh-surface p-4'}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lh-brand">
        <ListTree className="size-4" /> Mục lục
      </div>
      <ol className={compact ? 'grid gap-0.5 border-l border-lh-line' : 'grid gap-1 sm:grid-cols-2'}>
        {items.map((item, idx) => {
          const isActive = active === item.id;
          return (
            <li key={item.id} style={{ paddingLeft: `${Math.max(0, item.level - 1) * 12}px` }}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={
                  compact
                    ? `-ml-px block border-l-2 py-1.5 pl-3 pr-1 text-sm leading-snug transition ${
                        isActive ? 'border-lh-brand font-semibold text-lh-brand' : 'border-transparent text-lh-muted hover:text-lh-ink'
                      }`
                    : 'flex gap-2 rounded-lg px-2 py-1.5 text-sm text-lh-ink transition hover:bg-lh-surface-2 hover:text-lh-brand'
                }
              >
                {!compact && <span className="font-bold text-lh-gold">{idx + 1}.</span>}
                {item.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
