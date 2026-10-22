'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  Clock3,
  Gem,
  Hammer,
  History,
  Landmark,
  Loader2,
  MapPin,
  Paintbrush,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import {
  ACTION_LABELS,
  CATEGORY_LABELS,
  RANK_LABELS,
  REGION_LABELS,
  type ConstructionActionType,
  type HistoricalHeritage,
  type SubStructureItem,
} from '../heritage.types';
import { BeforeAfterImageSlider } from './BeforeAfterImageSlider';
import { Badge, Card, HeritageImage, ScrollArea, Separator, Sheet, Tabs, cn } from '../ui';

type TabKey = 'overview' | 'structures' | 'timeline' | 'links';

const ACTION_STYLE: Record<ConstructionActionType, { icon: typeof Sprout; tone: string }> = {
  FOUNDED: { icon: Sprout, tone: 'bg-emerald-600' },
  EXPANDED: { icon: Hammer, tone: 'bg-sky-600' },
  DAMAGED: { icon: ShieldAlert, tone: 'bg-rose-600' },
  RESTORED: { icon: ShieldCheck, tone: 'bg-amber-600' },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="hx-serif mb-3 text-xl font-bold">{children}</h3>;
}

/** Trạng thái trống khi di tích chưa có loại dữ liệu này — nói rõ thay vì để trắng. */
function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--hx-line)] px-5 py-10 text-center text-sm leading-6 text-[var(--hx-muted)]">
      {children}
    </div>
  );
}

/* Tab 1 — Tổng quan & Đối chiếu Xưa – Nay */
function ThenAndNowView({ h }: { h: HistoricalHeritage }) {
  const [zoomed, setZoomed] = useState<number | null>(null);
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--hx-primary)]">Giá trị lịch sử</p>
          <p className="mt-2 text-sm leading-7">{h.shortSummary || 'Chưa có phần giới thiệu cho di tích này.'}</p>
        </Card>
        {h.architecturalStyle && (
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--hx-primary)]">
              <Paintbrush className="size-3.5" /> Phong cách kiến trúc & nghệ thuật
            </p>
            <p className="mt-2 text-sm leading-7">{h.architecturalStyle}</p>
          </Card>
        )}
      </div>

      {h.thenAndNowComparison && (
        <section>
          <SectionTitle>Đối chiếu Xưa – Nay</SectionTitle>
          <BeforeAfterImageSlider {...h.thenAndNowComparison} />
        </section>
      )}

      {h.galleryImages.length > 0 && (
        <section>
          <SectionTitle>Bộ sưu tập ảnh</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {h.galleryImages.map((img, i) => (
              <motion.button
                key={img.url + i}
                type="button"
                layoutId={`gallery-${h.id}-${i}`}
                onClick={() => setZoomed(i)}
                className="group overflow-hidden rounded-xl border border-[var(--hx-line)] bg-[var(--hx-surface)] text-left"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={img.url} alt={img.caption} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs leading-5">{img.caption}</p>
                  {img.periodLabel && <p className="mt-0.5 text-[11px] font-semibold text-[var(--hx-primary)]">{img.periodLabel}</p>}
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {zoomed !== null && (
          <motion.div
            className="fixed inset-0 z-[130] grid place-items-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(null)}
          >
            <motion.figure layoutId={`gallery-${h.id}-${zoomed}`} className="max-w-4xl overflow-hidden rounded-2xl bg-black" onClick={(e) => e.stopPropagation()}>
              <img src={h.galleryImages[zoomed].url} alt={h.galleryImages[zoomed].caption} className="max-h-[75vh] w-full object-contain" />
              <figcaption className="flex items-center justify-between gap-3 p-3 text-sm text-white">
                <span>
                  {h.galleryImages[zoomed].caption}
                  {h.galleryImages[zoomed].periodLabel && <em className="ml-2 text-white/60">· {h.galleryImages[zoomed].periodLabel}</em>}
                </span>
                <button type="button" onClick={() => setZoomed(null)} aria-label="Đóng ảnh" className="rounded-full p-1 hover:bg-white/10">
                  <X className="size-5" />
                </button>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Tab 2 — Hạng mục kiến trúc & Bảo vật */
function SubStructuresExplorer({ items }: { items: SubStructureItem[] }) {
  const [kind, setKind] = useState<'ALL' | SubStructureItem['type']>('ALL');
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = kind === 'ALL' ? items : items.filter((i) => i.type === kind);
  const kinds: Array<{ value: typeof kind; label: string; count: number }> = [
    { value: 'ALL', label: 'Tất cả', count: items.length },
    { value: 'ARCHITECTURE', label: 'Hạng mục kiến trúc', count: items.filter((i) => i.type === 'ARCHITECTURE').length },
    { value: 'NATIONAL_TREASURE', label: 'Bảo vật / Hiện vật', count: items.filter((i) => i.type === 'NATIONAL_TREASURE').length },
  ];

  if (items.length === 0) {
    return <EmptyNote>Chưa có dữ liệu về các hạng mục kiến trúc hay hiện vật bên trong di tích này.</EmptyNote>;
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k.value}
            type="button"
            aria-pressed={kind === k.value}
            onClick={() => setKind(k.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold',
              kind === k.value ? 'border-[var(--hx-primary)] bg-[var(--hx-primary-soft)] text-[var(--hx-primary)]' : 'border-[var(--hx-line)] text-[var(--hx-muted)]',
            )}
          >
            {k.label} <span className="opacity-60">{k.count}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((item) => {
            const open = openId === item.id;
            return (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={cn('overflow-hidden rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)]', open && 'sm:col-span-2')}
              >
                <button type="button" onClick={() => setOpenId(open ? null : item.id)} aria-expanded={open} className={cn('grid w-full text-left', open ? 'sm:grid-cols-2' : '')}>
                  <motion.div layout className={cn('relative overflow-hidden', open ? 'aspect-[4/3]' : 'aspect-[16/9]')}>
                    <HeritageImage src={item.imageUrl} alt={item.name} className="h-full w-full" />
                    <Badge tone={item.type === 'NATIONAL_TREASURE' ? 'gold' : 'dark'} className="absolute left-3 top-3">
                      {item.type === 'NATIONAL_TREASURE' ? <Gem className="size-3" /> : <Landmark className="size-3" />}
                      {item.type === 'NATIONAL_TREASURE' ? 'Bảo vật / Hiện vật' : 'Kiến trúc'}
                    </Badge>
                  </motion.div>
                  <motion.div layout className="space-y-1.5 p-4">
                    <h4 className="hx-serif text-lg font-bold leading-snug">{item.name}</h4>
                    <p className="text-xs font-semibold text-[var(--hx-primary)]">{item.periodBuilt}</p>
                    <p className={cn('text-sm leading-6 text-[var(--hx-muted)]', !open && 'line-clamp-2')}>{item.description}</p>
                    <p className="pt-1 text-xs font-semibold text-[var(--hx-primary)]">{open ? 'Thu gọn' : 'Xem chi tiết'}</p>
                  </motion.div>
                </button>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* Tab 3 — Biên niên sử xây dựng, biến cố & trùng tu */
function ConstructionTimeline({ items }: { items: HistoricalHeritage['constructionTimeline'] }) {
  if (items.length === 0) {
    return <EmptyNote>Chưa có biên niên sử xây dựng, biến cố và trùng tu cho di tích này.</EmptyNote>;
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.keys(ACTION_LABELS) as ConstructionActionType[]).map((a) => {
          const S = ACTION_STYLE[a];
          return (
            <span key={a} className="flex items-center gap-1.5 text-[var(--hx-muted)]">
              <span className={cn('grid size-5 place-items-center rounded-full text-white', S.tone)}>
                <S.icon className="size-3" />
              </span>
              {ACTION_LABELS[a]}
            </span>
          );
        })}
      </div>
      <ol className="relative ml-4 border-l-2 border-[var(--hx-line)]">
        {items.map((m, i) => {
          const S = ACTION_STYLE[m.actionType];
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative pb-7 pl-8 last:pb-0"
            >
              <span className={cn('absolute -left-[15px] top-0 grid size-7 place-items-center rounded-full text-white ring-4 ring-[var(--hx-bg)]', S.tone)}>
                <S.icon className="size-3.5" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="hx-serif text-lg font-bold text-[var(--hx-primary)]">{m.dateLabel}</span>
                <Badge tone="outline">{m.dynasty}</Badge>
                <span className="text-xs font-semibold text-[var(--hx-muted)]">{ACTION_LABELS[m.actionType]}</span>
              </div>
              <p className="mt-1.5 text-sm leading-7">{m.description}</p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/* Tab 4 — Sự kiện, nhân vật & thông tin tham quan */
function LinksAndVisitor({ h }: { h: HistoricalHeritage }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section>
          <SectionTitle>Sự kiện lịch sử gắn liền</SectionTitle>
          {h.linkedEvents.length === 0 && <EmptyNote>Chưa có sự kiện nào được gắn với di tích này.</EmptyNote>}
          <ul className={cn('divide-y divide-[var(--hx-line)] overflow-hidden rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)]', h.linkedEvents.length === 0 && 'hidden')}>
            {h.linkedEvents.map((e) => {
              const body = (
                <>
                  <span className="hx-serif w-24 shrink-0 font-bold text-[var(--hx-primary)]">{e.dateLabel}</span>
                  <span className="flex-1 text-sm font-semibold">{e.title}</span>
                  {e.slug ? <ArrowUpRight className="size-4 text-[var(--hx-muted)]" /> : <span className="text-[11px] text-[var(--hx-muted)]">Chưa có trang</span>}
                </>
              );
              return (
                <li key={e.id}>
                  {e.slug ? (
                    <Link href={`/su-kien/${e.slug}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--hx-surface-2)]">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        <section className={h.linkedFigures.length ? '' : 'hidden'}>
          <SectionTitle>Danh nhân gắn bó</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {h.linkedFigures.map((f) => {
              const body = (
                <>
                  {f.avatarUrl ? (
                    <img src={f.avatarUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--hx-primary-soft)] text-[var(--hx-primary)]">
                      <UserRound className="size-5" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-semibold">{f.name}</span>
                    <span className="block text-xs text-[var(--hx-muted)]">{f.role}</span>
                  </span>
                </>
              );
              return f.slug ? (
                <Link key={f.id} href={`/nhan-vat/${f.slug}`} className="flex items-center gap-3 rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)] p-3 transition hover:border-[var(--hx-primary)]">
                  {body}
                </Link>
              ) : (
                <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)] p-3">
                  {body}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Card className="h-fit space-y-4 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--hx-primary)]">Thông tin tham quan</p>
        <div className="space-y-3 text-sm">
          <p className="flex gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--hx-primary)]" />
            {h.visitorInfo.addressText || 'Chưa có địa chỉ'}
          </p>
          <p className="flex gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-[var(--hx-primary)]" />
            {h.visitorInfo.openingHours || 'Chưa có thông tin giờ mở cửa'}
          </p>
          {h.visitorInfo.preservationStatus && (
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--hx-primary)]" />
              {h.visitorInfo.preservationStatus}
            </p>
          )}
        </div>
        <Separator />
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-[var(--hx-muted)]">Xếp hạng</dt>
            <dd className="font-semibold">{RANK_LABELS[h.rank]}</dd>
          </div>
          <div>
            <dt className="text-[var(--hx-muted)]">Năm công nhận</dt>
            <dd className="font-semibold">{h.recognizedYear || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--hx-muted)]">Vùng</dt>
            <dd className="font-semibold">{REGION_LABELS[h.region]}</dd>
          </div>
          <div>
            <dt className="text-[var(--hx-muted)]">Loại hình</dt>
            <dd className="font-semibold">{CATEGORY_LABELS[h.category]}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}

export function HeritageDetailSheet({ heritage, onClose }: { heritage: HistoricalHeritage | null; onClose: () => void }) {
  const h = heritage;
  // Mở di tích khác thì quay về tab Tổng quan (đặt lại ngay trong render, không cần effect).
  const [view, setView] = useState<{ id: string | null; tab: TabKey }>({ id: h?.id ?? null, tab: 'overview' });
  if (h && view.id !== h.id) setView({ id: h.id, tab: 'overview' });
  const tab = view.tab;
  const setTab = (t: TabKey) => setView((v) => ({ ...v, tab: t }));

  return (
    <Sheet open={Boolean(h)} onClose={onClose} label={h ? `Chi tiết ${h.name}` : 'Chi tiết di tích'}>
      {h && (
        <ScrollArea className="flex-1">
          <header className="relative">
            <HeritageImage src={h.coverImageUrl} alt={h.name} category={h.category} className="h-64 w-full sm:h-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-white sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge tone={h.rank === 'UNESCO' || h.rank === 'SPECIAL_NATIONAL' ? 'gold' : 'dark'}>
                  <Award className="size-3.5" /> {RANK_LABELS[h.rank]}
                </Badge>
                <Badge tone="dark">
                  <MapPin className="size-3.5" /> {h.province}
                </Badge>
                <Badge tone="dark">
                  <History className="size-3.5" /> {h.foundedEra}
                </Badge>
              </div>
              <h2 className="hx-serif text-3xl font-bold sm:text-4xl">{h.name}</h2>
              {h.ancientNames.length > 0 && <p className="text-sm text-white/80">Tên gọi xưa: {h.ancientNames.join(' · ')}</p>}
            </div>
          </header>

          <div className="sticky top-0 z-10 bg-[var(--hx-bg)] px-5 sm:px-8">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: 'overview', label: 'Tổng quan & Xưa – Nay', icon: <BookOpen className="size-4" /> },
                { value: 'structures', label: `Kiến trúc & Bảo vật${h.subStructures.length ? ` (${h.subStructures.length})` : ''}`, icon: <Landmark className="size-4" /> },
                { value: 'timeline', label: 'Biên niên sử', icon: <CalendarDays className="size-4" /> },
                { value: 'links', label: 'Sự kiện, Nhân vật & Tham quan', icon: <Users className="size-4" /> },
              ]}
            />
          </div>

          <div className="px-5 py-6 sm:px-8">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                {!h.detailLoaded && tab !== 'overview' ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--hx-muted)]">
                    <Loader2 className="size-4 animate-spin" /> Đang tải chi tiết di tích...
                  </div>
                ) : null}
                {tab === 'overview' && <ThenAndNowView h={h} />}
                {h.detailLoaded !== false && tab === 'structures' && <SubStructuresExplorer items={h.subStructures} />}
                {h.detailLoaded !== false && tab === 'timeline' && <ConstructionTimeline items={h.constructionTimeline} />}
                {h.detailLoaded !== false && tab === 'links' && <LinksAndVisitor h={h} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </Sheet>
  );
}
