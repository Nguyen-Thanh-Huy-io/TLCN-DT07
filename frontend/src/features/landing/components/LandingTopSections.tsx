'use client';

import { useState, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { RemoteImage } from '@/components/common/RemoteImage';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, Play, Search, Sparkles, BookOpen, CheckCircle2, Clock3, UserRound, Zap, Crown, ExternalLink, MapPin } from 'lucide-react';
import { LANDING_ROUTES, spreadEvenly, type LandingSpotlight, type LandingStats, type LandingCourse, type LandingTimelineNode } from '../landing.adapter';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonReaderHooks';
import { PUBLIC_CURRICULUM_ROUTES } from '@/features/public-curriculum/constants/public-curriculum.constants';

// === LandingUi.tsx ===
export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'gold';

export function HlButton({
  children,
  variant = 'primary',
  className,
  onClick,
  type = 'button',
  disabled,
  href,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  href?: string;
}) {
  const cls = cn('hl-button', `hl-button-${variant}`, className);
  if (href) {
    return (
      <Link className={cls} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}

export function HlBadge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('hl-badge', className)}>{children}</span>;
}

export function HlProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('hl-progress-track', className)}>
      <span className="hl-progress-bar" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="hl-section-head">
      <div>
        {eyebrow && (
          <div className="hl-eyebrow">
            <span />
            {eyebrow}
          </div>
        )}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
    >
      {children}
    </motion.div>
  );
}

/** Ảnh có fallback: thiếu ảnh thì hiện nền chuyển sắc + chữ trang trí thay vì ảnh không liên quan. */
export function HlCover({ src, alt, fallbackText }: { src: string | null; alt: string; fallbackText: string }) {
  if (src) return <RemoteImage src={src} alt={alt} />;
  return (
    <div className="hl-cover-fallback" aria-hidden="true">
      <span>{fallbackText}</span>
    </div>
  );
}

// === LandingHero.tsx ===
export function LandingHero({
  spotlights,
  stats,
  suggestions,
  openSearch,
}: {
  spotlights: LandingSpotlight[];
  stats: LandingStats;
  suggestions: Array<{ label: string; href: string }>;
  openSearch: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const item = spotlights[slide];
  const change = (delta: number) => setSlide((s) => (s + delta + spotlights.length) % spotlights.length);

  return (
    <section className="hl-hero" id="top">
      <div className="hl-container hl-hero-grid">
        <motion.div
          className="hl-hero-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <p className="hl-hero-lead">Nền tảng khám phá lịch sử tương tác</p>
          <h1>
            Chạm vào quá khứ.
            <br />
            <em>Hiểu sâu hiện tại.</em>
          </h1>
          <p>
            Khám phá dòng chảy lịch sử Việt Nam và thế giới qua niên biểu đa tầng, những nhân vật làm nên thời
            đại và các lộ trình học có cấu trúc.
          </p>
          <button className="hl-hero-search" onClick={openSearch} type="button">
            <Search />
            <span>Tìm kiếm sự kiện, nhân vật, thời kỳ, năm...</span>
            <kbd>Ctrl K</kbd>
          </button>
          {suggestions.length > 0 && (
            <div className="hl-suggestions">
              <span>Gợi ý:</span>
              {suggestions.map((s) => (
                <Link key={s.href} href={s.href}>
                  #{s.label}
                </Link>
              ))}
            </div>
          )}
          <div className="hl-hero-ctas">
            <HlButton href={LANDING_ROUTES.TIMELINE}>
              <Compass />
              Khám phá Dòng thời gian
              <ArrowRight />
            </HlButton>
            <HlButton href={LANDING_ROUTES.CURRICULUM} variant="outline">
              <Play />
              Bắt đầu lộ trình học
            </HlButton>
          </div>
          <div className="hl-trust-row">
            <span>
              <strong>
                {stats.events} sự kiện · {stats.figures} nhân vật · {stats.locations} địa danh
              </strong>
              <br />
              được hệ thống hóa và liên kết trực quan
            </span>
          </div>
        </motion.div>

        {item && (
          <motion.div
            className="hl-spotlight-shell"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="hl-spotlight-top">
              <h2 className="hl-spotlight-heading">
                <Sparkles size={14} />
                Tâm điểm lịch sử
              </h2>
            </div>
            <AnimatePresence mode="wait">
              <motion.article
                key={item.id}
                className="hl-spotlight-card"
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.3 }}
              >
                <HlCover src={item.imageUrl} alt={item.title} fallbackText={item.yearLabel} />
                <div className="hl-spotlight-overlay" />
                <div className="hl-spotlight-year">
                  <strong>{item.yearLabel}</strong>
                  <span>{item.era}</span>
                </div>
                <div className="hl-spotlight-content">
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  {item.figures.length > 0 && (
                    <div className="hl-spotlight-figures">
                      <span>Nhân vật:</span>
                      {item.figures.map((f) => (
                        <HlBadge key={f}>{f}</HlBadge>
                      ))}
                    </div>
                  )}
                  <Link href={item.href}>
                    Đọc diễn biến chi tiết <ArrowRight />
                  </Link>
                </div>
              </motion.article>
            </AnimatePresence>
            {spotlights.length > 1 && (
              <div className="hl-spotlight-nav">
                <span>
                  {String(slide + 1).padStart(2, '0')} / {String(spotlights.length).padStart(2, '0')}
                </span>
                <div className="hl-dots">
                  {spotlights.map((s, i) => (
                    <button
                      type="button"
                      aria-label={`Chuyển đến mục ${i + 1}`}
                      className={i === slide ? 'active' : ''}
                      key={s.id}
                      onClick={() => setSlide(i)}
                    />
                  ))}
                </div>
                <div>
                  <button type="button" onClick={() => change(-1)} aria-label="Trước">
                    <ChevronLeft />
                  </button>
                  <button type="button" onClick={() => change(1)} aria-label="Sau">
                    <ChevronRight />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// === ResumeBar.tsx ===
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/** Thanh "tiếp tục học" — dữ liệu tiến độ thật của người học; khách thấy lời mời tạo tài khoản. */
export function ResumeBar({ courses }: { courses: LandingCourse[] }) {
  const { user, loggedIn, ready, completedIds, enrolledPathIds, isCompleted } = useLessonProgress();

  if (user === undefined) return <section className="hl-container hl-resume-wrap" aria-hidden="true" />;

  if (!loggedIn) {
    return (
      <section className="hl-container hl-resume-wrap">
        <Reveal className="hl-resume-bar hl-resume-guest">
          <div className="hl-resume-title">
            <span>
              <Zap />
            </span>
            <div>
              <small>Học miễn phí</small>
              <h3>Tạo tài khoản để lưu tiến độ và đăng ký lộ trình</h3>
            </div>
          </div>
          <div className="hl-resume-guest-actions">
            <HlButton href="/dang-ky">
              Đăng ký miễn phí <ArrowRight />
            </HlButton>
            <HlButton href="/login?redirect=%2F" variant="outline">
              Đăng nhập
            </HlButton>
          </div>
        </Reveal>
      </section>
    );
  }

  const enrolled = courses.filter((c) => enrolledPathIds.includes(c.id));
  const current = enrolled.find((c) => c.lessons.some((l) => !isCompleted(l.id))) ?? enrolled[0];
  const done = current ? current.lessons.filter((l) => isCompleted(l.id)).length : 0;
  const percent = current?.lessons.length ? Math.round((done / current.lessons.length) * 100) : 0;
  const next = current?.lessons.find((l) => !isCompleted(l.id)) ?? current?.lessons[0];

  return (
    <section className="hl-container hl-resume-wrap">
      <Reveal className="hl-resume-bar">
        <div className="hl-resume-title">
          <span>
            <Zap />
          </span>
          <div>
            <small>
              {greeting()}, {user?.username}
            </small>
            <h3>Tiếp tục hành trình của bạn</h3>
          </div>
          <HlBadge>
            <CheckCircle2 />
            {completedIds.length} bài đã học
          </HlBadge>
        </div>
        <div className="hl-resume-items">
          <div className="hl-resume-item">
            <span className="hl-resume-icon">
              <BookOpen />
            </span>
            {!ready ? (
              <div className="hl-resume-skeleton" />
            ) : current ? (
              <>
                <div>
                  <small>Lộ trình đang học</small>
                  <strong>{current.title}</strong>
                  <HlProgress value={percent} />
                  <em>
                    {done}/{current.lessons.length} bài · {percent}% hoàn thành
                  </em>
                </div>
                {next && (
                  <HlButton href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(next.slug, current.id)}>
                    {done ? 'Học tiếp' : 'Bắt đầu'}
                    <ArrowRight />
                  </HlButton>
                )}
              </>
            ) : (
              <>
                <div>
                  <small>Chưa có lộ trình</small>
                  <strong>Chọn một lộ trình để bắt đầu</strong>
                  <p>Đăng ký miễn phí, học theo từng chương</p>
                </div>
                <HlButton href={LANDING_ROUTES.CURRICULUM}>
                  Xem lộ trình <ArrowRight />
                </HlButton>
              </>
            )}
          </div>
          <Link className="hl-resume-item compact" href={LANDING_ROUTES.TIMELINE}>
            <span className="hl-resume-icon">
              <Clock3 />
            </span>
            <div>
              <small>Tra cứu nhanh</small>
              <strong>Dòng thời gian đa tầng</strong>
              <p>Lọc theo quốc gia / khu vực</p>
            </div>
            <ArrowRight />
          </Link>
          <Link className="hl-resume-item compact" href="/tai-khoan#hoc-tap">
            <span className="hl-resume-icon">
              <UserRound />
            </span>
            <div>
              <small>Tài khoản của tôi</small>
              <strong>{enrolledPathIds.length} lộ trình đã đăng ký</strong>
              <p>Xem toàn bộ tiến độ học tập</p>
            </div>
            <ArrowRight />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

// === InteractivePreview.tsx ===
const MAX_NODES = 8;

function MiniTimeline({ nodes }: { nodes: LandingTimelineNode[] }) {
  const visible = useMemo(() => spreadEvenly(nodes, MAX_NODES), [nodes]);
  const [index, setIndex] = useState(0);
  const selected = visible[Math.min(index, visible.length - 1)];

  if (!selected) return <p className="hl-preview-empty">Chưa có sự kiện để hiển thị.</p>;

  return (
    <div className="hl-timeline-preview">
      <div className="hl-timeline-track">
        <div className="hl-timeline-line" />
        {visible.map((n, i) => (
          <button type="button" key={n.id} onClick={() => setIndex(i)} className={n.id === selected.id ? 'active' : ''}>
            <span>{n.yearLabel}</span>
            <i />
            <small>{n.title}</small>
          </button>
        ))}
      </div>
      <motion.div key={selected.id} className="hl-timeline-detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hl-big-year">{selected.yearLabel}</div>
        <div>
          <h3>{selected.title}</h3>
          <p>{selected.summary}</p>
          <div className="hl-detail-meta">
            {selected.figure && (
              <span>
                <Crown />
                {selected.figure}
              </span>
            )}
            {selected.location && (
              <span>
                <MapPin />
                {selected.location}
              </span>
            )}
          </div>
        </div>
        <HlButton href={selected.href}>
          Đọc sự kiện
          <ExternalLink />
        </HlButton>
      </motion.div>
    </div>
  );
}

export function InteractivePreview({ nodes }: { nodes: LandingTimelineNode[] }) {
  return (
    <section className="hl-section hl-container">
      <SectionHead
        title="Lịch sử không chỉ để đọc, mà để trải nghiệm"
        description="Tương tác trực quan cùng niên biểu đa tầng và những dấu mốc quan trọng theo dòng thời gian."
      />
      <div className="hl-preview-shell">
        <MiniTimeline nodes={nodes} />
      </div>
      <p className="hl-preview-note">
        Muốn xem đầy đủ? <Link href={LANDING_ROUTES.TIMELINE}>Mở trang Dòng thời gian</Link> để khám phá toàn bộ niên biểu.
      </p>
    </section>
  );
}
