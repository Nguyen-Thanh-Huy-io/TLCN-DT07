'use client';

import { KeyboardKey, SubStructureType } from '@/constants/enums';
import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Castle, Landmark, Mountain, Tent, X, CalendarDays, Compass, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RemoteImage } from '@/components/common/RemoteImage';
import { CATEGORY_LABELS, type HistoricalHeritage } from '../heritage.adapter';

// === ui.tsx ===
/*
 * Thành phần giao diện theo quy chuẩn shadcn/ui (Button, Badge, Card, Input, Select, Tabs,
 * Sheet, Separator, ScrollArea) viết gọn tại chỗ — dự án chưa cài shadcn/ui nên không thêm
 * phụ thuộc. Màu lấy từ biến --hx-* (heritage.css) để hỗ trợ sáng / tối.
 */


export const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'gold';
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-[var(--hx-primary)] text-white hover:bg-[var(--hx-primary-strong)] shadow-sm',
  outline: 'border border-[var(--hx-line)] bg-[var(--hx-surface)] text-[var(--hx-ink)] hover:border-[var(--hx-primary)]',
  ghost: 'text-[var(--hx-ink)] hover:bg-[var(--hx-surface-2)]',
  gold: 'bg-[var(--hx-gold)] text-[#1c1406] hover:brightness-105 shadow-sm',
};

export function Button({
  variant = 'default',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hx-primary)] disabled:pointer-events-none disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

type BadgeTone = 'default' | 'gold' | 'outline' | 'dark';
const BADGE_TONES: Record<BadgeTone, string> = {
  default: 'bg-[var(--hx-primary-soft)] text-[var(--hx-primary)]',
  gold: 'bg-gradient-to-r from-[#f3d27a] to-[#d4a23c] text-[#2a1a03] shadow-sm',
  outline: 'border border-[var(--hx-line)] text-[var(--hx-muted)]',
  dark: 'bg-black/55 text-white backdrop-blur',
};

export function Badge({ tone = 'default', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', BADGE_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)]', className)}>{children}</div>;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-[var(--hx-line)] bg-[var(--hx-surface)] px-3 text-sm text-[var(--hx-ink)] placeholder:text-[var(--hx-muted)] outline-none focus:border-[var(--hx-primary)] focus:ring-2 focus:ring-[var(--hx-primary-soft)]',
        className,
      )}
      {...props}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        'h-10 rounded-xl border border-[var(--hx-line)] bg-[var(--hx-surface)] px-3 text-sm text-[var(--hx-ink)] outline-none focus:border-[var(--hx-primary)]',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div role="separator" className={cn('h-px w-full bg-[var(--hx-line)]', className)} />;
}

export function ScrollArea({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('hx-scroll overflow-y-auto', className)}>{children}</div>;
}

/** Tabs điều khiển ngoài; gạch chân trượt theo tab bằng layoutId. */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ value: T; label: string; icon?: ReactNode }>;
}) {
  const id = useId();
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[var(--hx-line)]">
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm font-semibold transition-colors',
              active ? 'text-[var(--hx-primary)]' : 'text-[var(--hx-muted)] hover:text-[var(--hx-ink)]',
            )}
          >
            {t.icon}
            {t.label}
            {active && (
              <motion.span layoutId={`tab-underline-${id}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--hx-primary)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Sheet toàn màn hình (trên điện thoại) / bảng trượt phải (màn rộng); Esc để đóng, khóa cuộn nền. */
export function Sheet({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === KeyboardKey.ESCAPE && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120]">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className={cn(
              'absolute inset-y-0 right-0 flex w-full flex-col bg-[var(--hx-bg)] text-[var(--hx-ink)] shadow-2xl outline-none lg:w-[min(1080px,92vw)]',
              className,
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
            >
              <X className="size-5" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const CATEGORY_ICONS: Record<string, typeof Castle> = {
  CITADEL_PALACE: Castle,
  TEMPLE_SHRINE: Mountain,
  REVOLUTIONARY_BASE: Tent,
  MEMORIAL_STELE: Landmark,
};

/** Ảnh di tích; thiếu ảnh hoặc ảnh hỏng thì hiện nền + biểu tượng loại hình (không dùng ảnh ngẫu nhiên). */
export function HeritageImage({
  src,
  alt,
  category,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  category?: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    const Icon = CATEGORY_ICONS[category ?? ''] ?? Landmark;
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'grid place-items-center bg-[radial-gradient(circle_at_75%_20%,rgba(224,182,88,0.3),transparent_45%),linear-gradient(135deg,#1b2e27,#4a201f)] text-[#f0c86c]/70',
          className,
        )}
      >
        <Icon className="size-1/4 max-h-16 max-w-16" />
      </div>
    );
  }
  return <RemoteImage src={src} alt={alt} className={cn('object-cover', className)} onError={() => setBroken(true)} />;
}

// === HeritageCards.tsx ===
/** Khung tâm điểm: 1 di tích nổi bật ở đầu trang. */
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
  const architecture = heritage.subStructures.filter(
    (s) => s.type === SubStructureType.ARCHITECTURE,
  ).length;
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
