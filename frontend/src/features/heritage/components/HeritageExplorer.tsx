'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Landmark, Moon, SearchX, Sun } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import api from '@/services/api';
import type {
  PublicEventSummaryDto,
  PublicLocationDetailDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import { toHeritageSummaries, withHeritageDetail } from '../heritage.adapter';
import type { HistoricalHeritage } from '../heritage.types';
import { EMPTY_HERITAGE_FILTERS, HeritageFilterBar, matchesHeritage, type HeritageFilters } from './HeritageFilterBar';
import { FeaturedHeritageHero, HeritageCard } from './HeritageCards';
import { HeritageDetailSheet } from './HeritageDetailSheet';
import { Button, Select, cn } from '../ui';
import '../heritage.css';

const THEME_KEY = 'hisgo:heritage:theme';
const LIST_PATH = '/di-tich';

const RANK_ORDER = ['UNESCO', 'SPECIAL_NATIONAL', 'NATIONAL', 'PROVINCIAL', 'UNRANKED'];

/**
 * Trang Di tích (/di-tich, /di-tich/[slug]): tâm điểm + bộ lọc + lưới di tích + khung chi tiết 4 tab.
 * Chưa dùng bản đồ. Chi tiết (sự kiện, nhân vật, hồ sơ di sản) tải khi mở một di tích.
 */
export function HeritageExplorer({
  sites,
  events,
  periods,
  initialSlug,
}: {
  sites: PublicLocationSummaryDto[];
  events: PublicEventSummaryDto[];
  periods: PublicPeriodDto[];
  initialSlug?: string;
}) {
  const summaries = useMemo(
    () =>
      toHeritageSummaries(sites, events, periods).sort(
        (a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank) || (b.eventCount ?? 0) - (a.eventCount ?? 0),
      ),
    [sites, events, periods],
  );
  const [details, setDetails] = useState<Record<string, PublicLocationDetailDto>>({});
  const [filters, setFilters] = useState<HeritageFilters>(EMPTY_HERITAGE_FILTERS);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug ?? null);
  const [dark, setDark] = useState(false);

  // Nhớ chế độ sáng / tối trên trình duyệt này (đọc sau khi mount để SSR khớp).
  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === 'dark') setDark(true);
    } catch {
      // Không dùng được storage → giữ chế độ sáng.
    }
  }, []);
  const toggleTheme = () =>
    setDark((d) => {
      try {
        localStorage.setItem(THEME_KEY, d ? 'light' : 'dark');
      } catch {
        // Bỏ qua: chỉ là tiện ích nhớ lựa chọn.
      }
      return !d;
    });

  // Tải chi tiết di tích đang mở (một lần cho mỗi di tích).
  useEffect(() => {
    if (!selectedSlug || details[selectedSlug]) return;
    let alive = true;
    api
      .get(`/public/locations/${encodeURIComponent(selectedSlug)}`)
      .then((res) => {
        const detail = (res.data?.data ?? res.data) as PublicLocationDetailDto;
        if (alive && detail?.id) setDetails((d) => ({ ...d, [selectedSlug]: detail }));
      })
      .catch(() => {
        // Không tải được: khung vẫn hiện phần tóm tắt, các tab chi tiết hiện trạng thái trống.
        if (alive) setDetails((d) => d);
      });
    return () => {
      alive = false;
    };
  }, [selectedSlug, details]);

  // Giữ di tích đang mở trên URL (/di-tich/[slug]) để chia sẻ được; đóng thì về /di-tich.
  const select = useCallback((slug: string | null) => {
    setSelectedSlug(slug);
    window.history.replaceState(null, '', slug ? `${LIST_PATH}/${slug}` : LIST_PATH);
  }, []);

  const visible = useMemo(() => summaries.filter((h) => matchesHeritage(h, filters)), [summaries, filters]);
  const featured = summaries.find((h) => h.coverImageUrl && (h.rank === 'UNESCO' || h.rank === 'SPECIAL_NATIONAL')) ?? summaries[0];
  const selectedBase = summaries.find((h) => h.slug === selectedSlug) ?? null;
  const selected: HistoricalHeritage | null =
    selectedBase && details[selectedBase.slug] ? withHeritageDetail(selectedBase, details[selectedBase.slug]) : selectedBase;

  return (
    <div className={cn('hx-app', dark && 'hx-dark')}>
      <Header activeTab="di-tich" />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--hx-primary)]">
              <Landmark className="size-4" /> Di tích & Bảo tàng số
            </p>
            <h1 className="hx-serif mt-1 text-3xl font-bold sm:text-4xl">Di tích, kiến trúc & hiện vật</h1>
            <p className="mt-1 text-sm text-[var(--hx-muted)]">
              {summaries.length} di tích — mỗi nơi gắn với những sự kiện và con người cụ thể.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              label="Chuyển nhanh tới di tích"
              value=""
              onChange={(slug) => slug && select(slug)}
              options={[{ value: '', label: 'Chuyển nhanh tới di tích…' }, ...summaries.map((h) => ({ value: h.slug, label: h.name }))]}
              className="min-w-[230px]"
            />
            <Button variant="outline" onClick={toggleTheme} aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </div>

        {featured && <FeaturedHeritageHero heritage={featured} onExplore={() => select(featured.slug)} />}

        <HeritageFilterBar filters={filters} onChange={setFilters} heritages={summaries} resultCount={visible.length} />

        {visible.length ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((h) => (
                <HeritageCard key={h.id} heritage={h} onOpen={() => select(h.slug)} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--hx-line)] py-16 text-center text-[var(--hx-muted)]">
            <SearchX className="size-8" />
            <p>{summaries.length ? 'Không có di tích nào khớp bộ lọc.' : 'Chưa có di tích nào được xuất bản.'}</p>
            {summaries.length > 0 && (
              <Button variant="outline" onClick={() => setFilters(EMPTY_HERITAGE_FILTERS)}>
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />
      <HeritageDetailSheet heritage={selected} onClose={() => select(null)} />
    </div>
  );
}
