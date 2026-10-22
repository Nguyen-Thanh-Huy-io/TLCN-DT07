'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Landmark, Moon, SearchX, Sun } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import type { HistoricalHeritage } from '../heritage.types';
import { EMPTY_HERITAGE_FILTERS, HeritageFilterBar, matchesHeritage, type HeritageFilters } from './HeritageFilterBar';
import { FeaturedHeritageHero, HeritageCard } from './HeritageCards';
import { HeritageDetailSheet } from './HeritageDetailSheet';
import { Button, Select, cn } from '../ui';
import '../heritage.css';

const THEME_KEY = 'hisgo:heritage:theme';

/** Trang Khám phá Di sản: tâm điểm + bộ lọc + lưới di tích + khung chi tiết 4 tab (không dùng bản đồ). */
export function HeritageExplorer({ heritages, isSample = false }: { heritages: HistoricalHeritage[]; isSample?: boolean }) {
  const [filters, setFilters] = useState<HeritageFilters>(EMPTY_HERITAGE_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const visible = useMemo(() => heritages.filter((h) => matchesHeritage(h, filters)), [heritages, filters]);
  const featured = useMemo(
    () => heritages.find((h) => h.rank === 'UNESCO') ?? heritages.find((h) => h.rank === 'SPECIAL_NATIONAL') ?? heritages[0],
    [heritages],
  );
  const selected = heritages.find((h) => h.id === selectedId) ?? null;

  return (
    <div className={cn('hx-app', dark && 'hx-dark')}>
      <Header activeTab="di-tich" />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Thanh tiêu đề trang + chuyển nhanh tới một di tích */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--hx-primary)]">
              <Landmark className="size-4" /> Bảo tàng số di sản
            </p>
            <h1 className="hx-serif mt-1 text-3xl font-bold sm:text-4xl">Di tích, kiến trúc & hiện vật</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              label="Chuyển nhanh tới di tích"
              value=""
              onChange={(id) => id && setSelectedId(id)}
              options={[{ value: '', label: 'Chuyển nhanh tới di tích…' }, ...heritages.map((h) => ({ value: h.id, label: h.name }))]}
              className="min-w-[230px]"
            />
            <Button variant="outline" onClick={toggleTheme} aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </div>

        {isSample && (
          <p className="flex items-start gap-2 rounded-xl border border-[var(--hx-line)] bg-[var(--hx-surface-2)] px-4 py-3 text-xs leading-5 text-[var(--hx-muted)]">
            <Info className="mt-0.5 size-4 shrink-0" />
            Dữ liệu mẫu để thử nghiệm giao diện: ảnh là ảnh minh họa, các mốc lịch sử chỉ gồm những mốc phổ biến và cần đối chiếu
            nguồn trước khi xuất bản. Danh sách di tích đầy đủ từ hệ thống xem tại{' '}
            <Link href="/di-tich" className="font-semibold text-[var(--hx-primary)] underline">
              trang Di tích
            </Link>
            .
          </p>
        )}

        {featured && <FeaturedHeritageHero heritage={featured} onExplore={() => setSelectedId(featured.id)} />}

        <HeritageFilterBar filters={filters} onChange={setFilters} heritages={heritages} resultCount={visible.length} />

        {visible.length ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((h) => (
                <HeritageCard key={h.id} heritage={h} onOpen={() => setSelectedId(h.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--hx-line)] py-16 text-center text-[var(--hx-muted)]">
            <SearchX className="size-8" />
            <p>Không có di tích nào khớp bộ lọc.</p>
            <Button variant="outline" onClick={() => setFilters(EMPTY_HERITAGE_FILTERS)}>
              Đặt lại bộ lọc
            </Button>
          </div>
        )}
      </main>
      <Footer />
      <HeritageDetailSheet heritage={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
