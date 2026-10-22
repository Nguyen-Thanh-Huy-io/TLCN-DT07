'use client';

import { motion } from 'framer-motion';
import { Award, CalendarDays, Compass, Landmark, MapPin } from 'lucide-react';
import { CATEGORY_LABELS, RANK_LABELS, RANK_SHORT_LABELS, type HistoricalHeritage } from '../heritage.types';
import { Badge, Button, HeritageImage } from '../ui';

const isGoldRank = (h: HistoricalHeritage) => h.rank === 'UNESCO' || h.rank === 'SPECIAL_NATIONAL';

/** Khung tâm điểm: 1 di sản UNESCO / Quốc gia Đặc biệt ở đầu trang. */
export function FeaturedHeritageHero({ heritage, onExplore }: { heritage: HistoricalHeritage; onExplore: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-3xl">
      <motion.div
        key={heritage.id}
        initial={{ scale: 1.06, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0"
      >
        <HeritageImage src={heritage.coverImageUrl} alt={heritage.name} category={heritage.category} className="h-full w-full" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
      <div className="relative flex min-h-[420px] max-w-2xl flex-col justify-end gap-4 p-6 text-white sm:p-10">
        <div className="flex flex-wrap gap-2">
          <Badge tone="gold">
            <Award className="size-3.5" /> {RANK_LABELS[heritage.rank]}
            {heritage.recognizedYear && ` · ${heritage.recognizedYear}`}
          </Badge>
          <Badge tone="dark">
            <MapPin className="size-3.5" /> {heritage.province}
          </Badge>
        </div>
        <h2 className="hx-serif text-3xl font-bold leading-tight sm:text-5xl">{heritage.name}</h2>
        {heritage.ancientNames.length > 0 && (
          <p className="text-sm text-white/80">
            <span className="font-semibold text-[#f3d27a]">Tên gọi qua các thời kỳ: </span>
            {heritage.ancientNames.join(' · ')}
          </p>
        )}
        <p className="text-sm leading-7 text-white/85 sm:text-base">{heritage.shortSummary}</p>
        <div>
          <Button variant="gold" onClick={onExplore}>
            <Compass className="size-4" /> Khám phá không gian di tích
          </Button>
        </div>
      </div>
    </section>
  );
}

export function HeritageCard({ heritage, onOpen }: { heritage: HistoricalHeritage; onOpen: () => void }) {
  const architecture = heritage.subStructures.filter((s) => s.type === 'ARCHITECTURE').length;
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -4 }}
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)] text-left shadow-sm transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hx-primary)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <HeritageImage
          src={heritage.coverImageUrl}
          alt={heritage.name}
          category={heritage.category}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Badge tone={isGoldRank(heritage) ? 'gold' : 'dark'} className="absolute left-3 top-3">
          <Award className="size-3" /> {RANK_SHORT_LABELS[heritage.rank]}
        </Badge>
        <Badge tone="dark" className="absolute right-3 top-3">
          <MapPin className="size-3" /> {heritage.province}
        </Badge>
        <span className="absolute bottom-3 left-3 text-xs font-semibold text-white/90">
          {heritage.siteTypeLabel ?? CATEGORY_LABELS[heritage.category]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="hx-serif text-lg font-bold leading-snug">{heritage.name}</h3>
        {heritage.ancientNames.length > 0 && (
          <p className="line-clamp-1 text-xs italic text-[var(--hx-muted)]">Xưa: {heritage.ancientNames.join(', ')}</p>
        )}
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--hx-primary)]">
          <Landmark className="size-3.5" /> Khởi dựng: {heritage.foundedEra}
        </p>
        <p className="line-clamp-3 text-sm leading-6 text-[var(--hx-muted)]">{heritage.shortSummary}</p>
        {(heritage.visitorInfo.preservationStatus || heritage.managingUnit) && (
          <p className="text-xs leading-5 text-[var(--hx-muted)]">
            {heritage.visitorInfo.preservationStatus && (
              <span className="font-semibold text-[var(--hx-ink)]">{heritage.visitorInfo.preservationStatus}</span>
            )}
            {heritage.visitorInfo.preservationStatus && heritage.managingUnit && ' · '}
            {heritage.managingUnit}
          </p>
        )}
        <p className="mt-auto flex items-center gap-1.5 border-t border-[var(--hx-line)] pt-3 text-xs text-[var(--hx-muted)]">
          <CalendarDays className="size-3.5" />
          {architecture > 0 && `${architecture} hạng mục kiến trúc • `}
          {heritage.eventCount ?? heritage.linkedEvents.length} sự kiện lịch sử gắn liền
        </p>
      </div>
    </motion.button>
  );
}
