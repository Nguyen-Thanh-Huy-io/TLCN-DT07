'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Landmark, Moon, SearchX, Sun } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import type {
  PublicEventSummaryDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import { toHeritageSummaries } from '../heritage.adapter';
import { FeaturedHeritageHero, HeritageCard } from './HeritageParts';
import { Button, Select, cn } from './HeritageParts';
import '@/components/timeline/sk-timeline.css';
import '../heritage.css';

export enum AppThemeMode {
  DARK = 'dark',
  LIGHT = 'light',
}

const THEME_KEY = 'hisgo:heritage:theme';
const LIST_PATH = '/di-tich';

/**
 * Trang danh mục Di tích (/di-tich): tâm điểm + lưới di tích. Mở 1 di tích điều hướng
 * sang trang đọc đầy đủ dùng chung (/di-tich/[slug] → EntityHero + EntityReader, như
 * /thuc-the, /su-kien, /nhan-vat) thay vì mở khung chi tiết tại chỗ.
 */
export function HeritageExplorer({
  sites,
  events,
  periods,
}: {
  sites: PublicLocationSummaryDto[];
  events: PublicEventSummaryDto[];
  periods: PublicPeriodDto[];
}) {
  const router = useRouter();
  const summaries = useMemo(
    () => toHeritageSummaries(sites, events, periods).sort((a, b) => (b.eventCount ?? 0) - (a.eventCount ?? 0)),
    [sites, events, periods],
  );
  const [dark, setDark] = useState(false);

  // Nhớ chế độ sáng / tối trên trình duyệt này (đọc sau khi mount để SSR khớp).
  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === AppThemeMode.DARK) void Promise.resolve().then(() => setDark(true));
    } catch {
      // Không dùng được storage → giữ chế độ sáng.
    }
  }, []);
  const toggleTheme = () =>
    setDark((d) => {
      try {
        localStorage.setItem(THEME_KEY, d ? AppThemeMode.LIGHT : AppThemeMode.DARK);
      } catch {
        // Bỏ qua: chỉ là tiện ích nhớ lựa chọn.
      }
      return !d;
    });

  const openDetail = (slug: string) => router.push(`${LIST_PATH}/${slug}`);

  const featured = summaries.find((h) => h.coverImageUrl) ?? summaries[0];

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
              onChange={(slug) => slug && openDetail(slug)}
              options={[{ value: '', label: 'Chuyển nhanh tới di tích…' }, ...summaries.map((h) => ({ value: h.slug, label: h.name }))]}
              className="min-w-[230px]"
            />
            <Button variant="outline" onClick={toggleTheme} aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </div>

        {featured && <FeaturedHeritageHero heritage={featured} onExplore={() => openDetail(featured.slug)} />}

        {summaries.length ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {summaries.map((h) => (
                <HeritageCard key={h.id} heritage={h} onOpen={() => openDetail(h.slug)} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--hx-line)] py-16 text-center text-[var(--hx-muted)]">
            <SearchX className="size-8" />
            <p>Chưa có di tích nào được xuất bản.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
