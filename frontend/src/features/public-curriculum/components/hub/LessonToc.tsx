'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ListTree } from 'lucide-react';

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

interface TocGroup {
  head: TocEntry;
  children: TocEntry[];
}

/** Gom mục lục thành nhóm: mỗi mục cấp cao nhất kèm các mục con ngay sau nó. */
function groupEntries(items: TocEntry[]): TocGroup[] {
  const top = Math.min(...items.map((i) => i.level));
  const groups: TocGroup[] = [];
  for (const item of items) {
    if (item.level === top || groups.length === 0) groups.push({ head: item, children: [] });
    else groups[groups.length - 1].children.push(item);
  }
  return groups;
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

const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Mục lục bài học, thu gọn được: cả khối (nút tiêu đề) và từng nhóm mục con
 * (nhóm chứa mục đang đọc tự mở). `compact` = dạng cột phải dính theo khi cuộn.
 */
export function LessonToc({ items, compact = false }: { items: TocEntry[]; compact?: boolean }) {
  const active = useActiveHeading(items.map((i) => i.id));
  const groups = useMemo(() => groupEntries(items), [items]);
  const [open, setOpen] = useState(compact);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  if (items.length < 2) return null;

  const activeGroup = groups.find((g) => g.head.id === active || g.children.some((c) => c.id === active))?.head.id;
  const linkClass = (id: string, child = false) =>
    `-ml-px block border-l-2 py-1.5 pr-1 text-sm leading-snug transition ${child ? 'pl-6 text-[13px]' : 'pl-3'} ${
      active === id ? 'border-lh-brand font-semibold text-lh-brand' : 'border-transparent text-lh-muted hover:text-lh-ink'
    }`;

  return (
    <nav aria-label="Mục lục bài học" className={compact ? '' : 'mb-7 rounded-2xl border border-lh-line bg-lh-surface p-4'}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lh-brand"
      >
        <ListTree className="size-4" /> Mục lục
        <span className="font-semibold normal-case tracking-normal text-lh-muted">({items.length})</span>
        <ChevronDown className={`ml-auto size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ol className="mt-2 grid gap-0.5 border-l border-lh-line">
          {groups.map((g) => {
            const expanded = g.children.length > 0 && (toggled[g.head.id] ?? g.head.id === activeGroup);
            return (
              <li key={g.head.id}>
                <div className="flex items-start">
                  <a href={`#${g.head.id}`} onClick={scrollTo(g.head.id)} className={`${linkClass(g.head.id)} flex-1`}>
                    {g.head.text}
                  </a>
                  {g.children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setToggled((t) => ({ ...t, [g.head.id]: !expanded }))}
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Thu gọn mục con' : `Mở ${g.children.length} mục con`}
                      className="mt-1 grid size-6 shrink-0 place-items-center rounded text-lh-muted hover:bg-lh-surface-2 hover:text-lh-ink"
                    >
                      <ChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {expanded && (
                  <ol>
                    {g.children.map((c) => (
                      <li key={c.id}>
                        <a href={`#${c.id}`} onClick={scrollTo(c.id)} className={linkClass(c.id, true)}>
                          {c.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
