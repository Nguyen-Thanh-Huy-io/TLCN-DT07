'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, History, Landmark, MapPin, Search, Users } from 'lucide-react';
import { normalizeSearch } from '../landing.adapter';
import type { SearchEntry, SearchEntryType } from '../landing.types';
import { cn } from './LandingUi';

const TYPE_LABELS: Record<SearchEntryType, string> = {
  EVENT: 'Sự kiện',
  FIGURE: 'Nhân vật',
  LOCATION: 'Địa danh',
  LESSON: 'Bài học',
  PERIOD: 'Thời kỳ',
};

const TYPE_ICONS: Record<SearchEntryType, typeof History> = {
  EVENT: History,
  FIGURE: Users,
  LOCATION: MapPin,
  LESSON: BookOpen,
  PERIOD: Landmark,
};

const MAX_RESULTS = 12;

function SearchPanel({ entries, onClose }: { entries: SearchEntry[]; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const results = useMemo(() => {
    const q = normalizeSearch(query.trim());
    if (!q) {
      // Gợi ý mặc định: mỗi loại vài mục để thấy độ phủ nội dung.
      const types: SearchEntryType[] = ['PERIOD', 'EVENT', 'FIGURE', 'LESSON'];
      return types.flatMap((t) => entries.filter((e) => e.type === t).slice(0, 2));
    }
    return entries.filter((e) => e.haystack.includes(q)).slice(0, MAX_RESULTS);
  }, [entries, query]);

  const open = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      open(results[cursor]);
    }
  };

  return (
    <motion.div
      className="hl-command-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm toàn cục"
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="hl-command-input">
        <Search size={20} />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Tìm sự kiện, nhân vật, thời kỳ, năm..."
          aria-label="Từ khóa tìm kiếm"
        />
        <kbd>ESC</kbd>
      </div>
      <div className="hl-command-body">
        <div className="hl-command-caption">{query ? `${results.length} kết quả phù hợp` : 'Gợi ý khám phá'}</div>
        {results.length ? (
          results.map((item, i) => {
            const Icon = TYPE_ICONS[item.type];
            return (
              <button
                type="button"
                className={cn('hl-command-result', i === cursor && 'active')}
                key={item.id}
                onMouseEnter={() => setCursor(i)}
                onClick={() => open(item)}
              >
                <span className="hl-command-icon">
                  <Icon />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {TYPE_LABELS[item.type]}
                    {item.subtitle ? ` • ${item.subtitle}` : ''}
                  </small>
                </span>
                <span className="hl-command-meta">{item.year}</span>
              </button>
            );
          })
        ) : (
          <div className="hl-empty-search">
            <Search />
            <p>Chưa tìm thấy tư liệu phù hợp</p>
            <small>Thử tên một nhân vật, một thời kỳ hoặc một năm</small>
          </div>
        )}
      </div>
      <div className="hl-command-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> để di chuyển
        </span>
        <span>
          <kbd>↵</kbd> để mở
        </span>
        <span>Việt Nam & thế giới</span>
      </div>
    </motion.div>
  );
}

export function CommandSearch({
  open,
  onClose,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  entries: SearchEntry[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="hl-dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          {/* Mount mới mỗi lần mở → từ khóa và con trỏ tự reset. */}
          <SearchPanel entries={entries} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
