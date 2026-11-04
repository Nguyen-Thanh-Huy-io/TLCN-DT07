'use client';
import { KeyboardKey, CommonFilterOption } from '@/constants/enums';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, History, Landmark, Loader2, MapPin, Search, Users } from 'lucide-react';
import { normalizeSearch, type SearchEntry, type SearchEntryType } from './search-index';
import { loadSearchIndex } from './search.service';
import './global-search.css';

/** Phát sự kiện này (vd. từ ô tìm kiếm ở hero trang chủ) để mở ô tìm kiếm toàn cục. */
export const OPEN_GLOBAL_SEARCH_EVENT = 'hisgo:open-search';

export function openGlobalSearch() {
  window.dispatchEvent(new Event(OPEN_GLOBAL_SEARCH_EVENT));
}

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

const GROUP_ORDER: SearchEntryType[] = ['EVENT', 'FIGURE', 'PERIOD', 'LESSON', 'LOCATION'];
const TYPE_FILTERS: Array<SearchEntryType | 'ALL'> = ['ALL', ...GROUP_ORDER];
const MAX_RESULTS = 40;
/** Số mục mỗi nhóm ở tab "Tất cả": khi đang gõ / khi chưa gõ (gợi ý). */
const PER_GROUP = 4;
const PER_GROUP_IDLE = 3;

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchEntryType | 'ALL'>('ALL');
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    let alive = true;
    loadSearchIndex().then((e) => alive && setEntries(e));
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => {
    const q = normalizeSearch(query.trim());
    const c = new Map<SearchEntryType | 'ALL', number>();
    for (const e of entries ?? []) {
      if (q && !e.haystack.includes(q)) continue;
      c.set(e.type, (c.get(e.type) ?? 0) + 1);
      c.set('ALL', (c.get('ALL') ?? 0) + 1);
    }
    return c;
  }, [entries, query]);

  // Tab "Tất cả": nhóm theo loại, mỗi nhóm vài mục kèm "Xem tất cả"; tab một loại: danh sách dài.
  const groups = useMemo(() => {
    if (!entries) return [];
    const q = normalizeSearch(query.trim());
    // Khớp ở đầu tiêu đề được ưu tiên trước khớp ở giữa.
    const matched = (q ? entries.filter((e) => e.haystack.includes(q)) : entries)
      .map((e) => ({ e, head: q ? normalizeSearch(e.title).startsWith(q) : false }))
      .sort((a, b) => Number(b.head) - Number(a.head))
      .map((x) => x.e);
    const types = type === CommonFilterOption.ALL ? GROUP_ORDER : [type];
    const limit = type === CommonFilterOption.ALL ? (q ? PER_GROUP : PER_GROUP_IDLE) : MAX_RESULTS;
    return types
      .map((t) => {
        const all = matched.filter((e) => e.type === t);
        return { type: t, total: all.length, items: all.slice(0, limit) };
      })
      .filter((g) => g.items.length);
  }, [entries, query, type]);
  const results = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === KeyboardKey.ARROW_DOWN) {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === KeyboardKey.ARROW_UP) {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === KeyboardKey.ENTER) {
      e.preventDefault();
      go(results[cursor]);
    }
  };

  return (
    <motion.div
      className="gs-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm toàn cục"
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="gs-input">
        <Search size={20} />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Tìm sự kiện, nhân vật, thời kỳ, bài học, năm..."
          aria-label="Từ khóa tìm kiếm"
        />
        <kbd>ESC</kbd>
      </div>
      <div className="gs-types" role="tablist" aria-label="Loại kết quả">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            className={type === t ? 'active' : ''}
            onClick={() => {
              setType(t);
              setCursor(0);
            }}
          >
            {t === CommonFilterOption.ALL ? 'Tất cả' : TYPE_LABELS[t]}
            {entries && <small>{counts.get(t) ?? 0}</small>}
          </button>
        ))}
      </div>
      <div className="gs-body">
        {!entries ? (
          <div className="gs-empty">
            <Loader2 className="gs-spin" />
            <p>Đang tải dữ liệu tìm kiếm...</p>
          </div>
        ) : results.length ? (
          groups.map((g) => {
            const Icon = TYPE_ICONS[g.type];
            return (
              <section key={g.type} className="gs-group">
                <header>
                  <span>
                    {TYPE_LABELS[g.type]}
                    <small>{g.total}</small>
                  </span>
                  {type === CommonFilterOption.ALL && g.total > g.items.length && (
                    <button
                      type="button"
                      onClick={() => {
                        setType(g.type);
                        setCursor(0);
                      }}
                    >
                      Xem tất cả <ArrowRight size={13} />
                    </button>
                  )}
                </header>
                {g.items.map((item) => {
                  const i = results.indexOf(item);
                  return (
                    <button
                      type="button"
                      className={`gs-result ${i === cursor ? 'active' : ''}`}
                      key={item.id}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => go(item)}
                    >
                      <span className="gs-icon">
                        <Icon />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        {item.subtitle && <small>{item.subtitle}</small>}
                      </span>
                      <span className="gs-meta">{item.year}</span>
                    </button>
                  );
                })}
              </section>
            );
          })
        ) : (
          <div className="gs-empty">
            <Search />
            <p>Chưa tìm thấy tư liệu phù hợp</p>
            <small>Thử tên một nhân vật, một thời kỳ hoặc một năm (vd. 938)</small>
          </div>
        )}
      </div>
      <div className="gs-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> di chuyển
        </span>
        <span>
          <kbd>↵</kbd> mở
        </span>
        <span>Gõ không dấu cũng được</span>
      </div>
    </motion.div>
  );
}

const SEARCH_TRIGGER_KEY = 'k';

/** Nút tìm kiếm trên Header + hộp thoại tìm toàn cục (Ctrl/⌘ + K ở mọi trang công khai). */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === SEARCH_TRIGGER_KEY) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === KeyboardKey.ESCAPE) setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
    };
  }, []);

  return (
    <>
      <button type="button" className="gs-trigger" onClick={() => setOpen(true)} aria-label="Tìm kiếm (Ctrl+K)">
        <Search size={16} />
        <span>Tìm kiếm...</span>
        <kbd>Ctrl K</kbd>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="gs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setOpen(false)}
          >
            {/* Mount mới mỗi lần mở → từ khóa và con trỏ tự reset. */}
            <SearchPanel onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
