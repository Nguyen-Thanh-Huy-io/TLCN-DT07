'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Layers3, MapPin, Users, Compass, GraduationCap, Landmark, BookOpen, Check, Layers, Lightbulb, X, Globe2, History, ShieldCheck } from 'lucide-react';
import { LANDING_ROUTES, type LandingFigure, type LandingLocation, type LandingEra, type LandingStats, type LandingCourse, type LandingQuiz } from '../landing.adapter';
import { HlBadge, HlButton, SectionHead, HlCover, Reveal, HlProgress, cn } from './LandingTopSections';
import { RemoteImage } from '@/components/common/RemoteImage';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonReaderHooks';
import { useAuthSession } from '@/services/auth/use-auth-session';

// === EntitiesSection.tsx ===
export enum EntitySectionTab {
  FIGURES = 'figures',
  LOCATIONS = 'locations',
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : name.slice(0, 2);
}

export function EntitiesSection({ figures, locations }: { figures: LandingFigure[]; locations: LandingLocation[] }) {
  const [tab, setTab] = useState<EntitySectionTab>(EntitySectionTab.FIGURES);
  if (figures.length === 0 && locations.length === 0) return null;

  const isFiguresTab = tab === EntitySectionTab.FIGURES;

  return (
    <section className="hl-section hl-entities-section" id="characters">
      <div className="hl-container">
        <SectionHead
          title="Những con người và không gian còn lưu dấu"
          description="Gặp gỡ những nhân vật làm nên thời đại và các di tích, địa danh lịch sử trường tồn."
          action={
            <HlButton href={isFiguresTab ? LANDING_ROUTES.FIGURES : LANDING_ROUTES.LOCATIONS} variant="ghost">
              {isFiguresTab ? 'Tất cả nhân vật' : 'Tất cả di tích'}
              <ArrowRight />
            </HlButton>
          }
        />
        <div className="hl-tabs">
          <button
            type="button"
            className={isFiguresTab ? 'active' : ''}
            onClick={() => setTab(EntitySectionTab.FIGURES)}
          >
            <Users />
            Nhân vật tiêu biểu
          </button>
          <button
            type="button"
            className={tab === EntitySectionTab.LOCATIONS ? 'active' : ''}
            onClick={() => setTab(EntitySectionTab.LOCATIONS)}
          >
            <MapPin />
            Di tích & Địa danh
          </button>
        </div>
        <AnimatePresence mode="wait">
          {isFiguresTab ? (
            <motion.div className="hl-figure-grid" key={EntitySectionTab.FIGURES} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {figures.map((f) => (
                <article className="hl-figure-card" key={f.id}>
                  <div className="hl-figure-top">
                    {f.imageUrl ? (
                      <RemoteImage src={f.imageUrl} alt={f.name} />
                    ) : (
                      <span className="hl-figure-initials">{initials(f.name)}</span>
                    )}
                    <div>
                      {f.years && <HlBadge>{f.years}</HlBadge>}
                      <h3>{f.name}</h3>
                      {f.roles.length > 0 && (
                        <div>
                          {f.roles.map((r) => (
                            <span key={r}>{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {f.quote && <blockquote>“{f.quote}”</blockquote>}
                  <div className="hl-figure-foot">
                    <span>
                      <Layers3 />
                      {f.eventCount} sự kiện liên quan
                    </span>
                    <Link href={f.href}>
                      Mở hồ sơ
                      <ArrowRight />
                    </Link>
                  </div>
                </article>
              ))}
            </motion.div>
          ) : (
            <motion.div className="hl-location-grid" key={EntitySectionTab.LOCATIONS} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {locations.map((l) => (
                <Link href={l.href} className="hl-location-card" key={l.id}>
                  <HlBadge>{l.eventCount} sự kiện gắn với nơi này</HlBadge>
                  <h3>{l.name}</h3>
                  {l.significance && <p>{l.significance}</p>}
                  {l.address && (
                    <small>
                      <MapPin />
                      {l.address}
                    </small>
                  )}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// === ExploreSections.tsx ===
export function CorePillars({ stats }: { stats: LandingStats }) {
  const pillars = [
    {
      icon: Compass,
      no: '01',
      title: 'Dòng thời gian Đa tầng',
      text: 'Duyệt ngang & dọc, khám phá các mốc lịch sử trong cùng lát cắt thời gian.',
      href: LANDING_ROUTES.TIMELINE,
      meta: `${stats.events} mốc sự kiện`,
      color: 'red',
    },
    {
      icon: Users,
      no: '02',
      title: 'Nhân vật làm nên thời đại',
      text: 'Hồ sơ, vai trò trong từng sự kiện và mạng quan hệ giữa các nhân vật lịch sử.',
      href: LANDING_ROUTES.FIGURES,
      meta: `${stats.figures} hồ sơ nhân vật`,
      color: 'green',
    },
    {
      icon: Landmark,
      no: '03',
      title: 'Di tích & Địa danh',
      text: 'Những không gian còn lưu dấu sự kiện, nơi lịch sử đã thực sự diễn ra.',
      href: LANDING_ROUTES.LOCATIONS,
      meta: `${stats.locations} địa danh`,
      color: 'blue',
    },
    {
      icon: GraduationCap,
      no: '04',
      title: 'Chương trình học',
      text: 'Lộ trình phân chương, bài đọc có trích dẫn nguồn và theo dõi tiến độ của riêng bạn.',
      href: LANDING_ROUTES.CURRICULUM,
      meta: `${stats.paths} lộ trình`,
      color: 'gold',
    },
  ];

  return (
    <section className="hl-section hl-container">
      <SectionHead
        title="Bốn lối vào khám phá lịch sử"
        description="Hệ sinh thái HISGO với đa dạng góc nhìn, phù hợp nhịp học và sự tò mò của riêng bạn."
      />
      <div className="hl-pillar-grid">
        {pillars.map((p) => (
          <Reveal key={p.title}>
            <motion.div whileHover={{ y: -7 }}>
              <Link href={p.href} className={`hl-pillar-card ${p.color}`}>
                <span className="hl-pillar-no">{p.no}</span>
                <span className="hl-pillar-icon">
                  <p.icon />
                </span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <div>
                  <span>{p.meta}</span>
                  <ArrowRight />
                </div>
              </Link>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function EraBento({ eras }: { eras: LandingEra[] }) {
  if (eras.length === 0) return null;
  return (
    <section className="hl-section hl-era-section" id="explore">
      <div className="hl-container">
        <SectionHead
          title={`Hành trình qua ${eras.length} kỷ nguyên lịch sử`}
          description="Việt Nam và thế giới, mỗi thời kỳ là một lớp ký ức với sự kiện, con người và không gian đan cài."
          action={
            <HlButton href={LANDING_ROUTES.TIMELINE} variant="ghost">
              Xem toàn bộ niên biểu
              <ArrowRight />
            </HlButton>
          }
        />
        <div className="hl-bento-grid">
          {eras.map((era) => (
            <Reveal className={`hl-bento-item ${era.size}`} key={era.id}>
              <motion.div whileHover={{ y: -4 }} className="hl-bento-hover">
                <Link className="hl-era-card" href={era.href}>
                  <HlCover src={era.imageUrl} alt="" fallbackText={era.name} />
                  <div className="hl-era-shade" />
                  <div className="hl-era-top">
                    <HlBadge>{era.years}</HlBadge>
                    <span>
                      <ArrowRight />
                    </span>
                  </div>
                  <div className="hl-era-content">
                    <p>
                      {era.eventCount} sự kiện • {era.figureCount} nhân vật
                    </p>
                    <h3>{era.name}</h3>
                    {era.subEras.length > 0 && (
                      <div className="hl-suberas">
                        {era.subEras.map((s) => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// === LearningQuiz.tsx ===
export enum QuizOptionState {
  CORRECT = 'correct',
  WRONG = 'wrong',
  MUTED = 'muted',
}

function CourseCard({ course }: { course: LandingCourse }) {
  const { isEnrolled, isCompleted } = useLessonProgress();
  const enrolled = isEnrolled(course.id);
  const done = course.lessons.filter((l) => isCompleted(l.id)).length;
  const percent = course.lessons.length ? Math.round((done / course.lessons.length) * 100) : 0;
  return (
    <article className="hl-course-card">
      <RemoteImage src={course.imageUrl} alt="" />
      <div className="hl-course-body">
        <HlBadge>{course.kind}</HlBadge>
        <h3>{course.title}</h3>
        <div className="hl-course-meta">
          <span>
            <Layers />
            {course.chapters} chương
          </span>
          <span>
            <BookOpen />
            {course.lessons.length} bài học
          </span>
        </div>
        <div className="hl-course-progress">
          <div>
            <span>{enrolled ? 'Tiến độ của bạn' : 'Miễn phí · cần đăng nhập'}</span>
            {enrolled && <strong>{percent}%</strong>}
          </div>
          <HlProgress value={enrolled ? percent : 0} />
        </div>
        <HlButton href={`${LANDING_ROUTES.CURRICULUM}?pathId=${encodeURIComponent(course.id)}`} variant={enrolled ? 'primary' : 'outline'}>
          {enrolled ? 'Vào lớp học' : 'Xem lộ trình'}
          <ArrowRight />
        </HlButton>
      </div>
    </article>
  );
}

function DailyQuiz({ quiz }: { quiz: LandingQuiz }) {
  const [answer, setAnswer] = useState<number | null>(null);
  const correct = answer === quiz.correctIndex;
  return (
    <aside className="hl-quiz-card">
      <div className="hl-quiz-head">
        <span>
          <Lightbulb />
        </span>
        <div>
          <small>Thử thách mỗi ngày</small>
          <h3>Câu hỏi hôm nay</h3>
        </div>
      </div>
      <p className="hl-quiz-question">{quiz.question}</p>
      <div className="hl-quiz-options">
        {quiz.options.map((option, i) => {
          const state =
            answer === null
              ? ''
              : i === quiz.correctIndex
              ? QuizOptionState.CORRECT
              : i === answer
              ? QuizOptionState.WRONG
              : QuizOptionState.MUTED;
          return (
            <button type="button" className={state} disabled={answer !== null} key={option} onClick={() => setAnswer(i)}>
              <span>{String.fromCharCode(65 + i)}</span>
              {option}
              {state === QuizOptionState.CORRECT && <Check />}
              {state === QuizOptionState.WRONG && <X />}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {answer !== null && (
          <motion.div
            className={cn('hl-quiz-result', correct ? 'success' : 'error')}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <strong>{correct ? 'Chính xác!' : `Chưa đúng: đáp án là ${quiz.options[quiz.correctIndex]}.`}</strong>
            {quiz.explanation && <p>{quiz.explanation}</p>}
            <Link href={quiz.href}>
              Đọc sự kiện <ArrowRight />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="hl-quiz-footer">
        <span>Câu hỏi đổi mỗi ngày</span>
        <button type="button" onClick={() => setAnswer(null)} disabled={answer === null}>
          Làm lại
        </button>
      </div>
    </aside>
  );
}

export function LearningQuiz({ courses, quiz }: { courses: LandingCourse[]; quiz: LandingQuiz | null }) {
  if (courses.length === 0 && !quiz) return null;
  return (
    <section className="hl-section hl-container">
      <SectionHead
        title="Lộ trình học tập dành riêng cho bạn"
        description="Học theo chương trình có cấu trúc, kiểm tra kiến thức ngay sau mỗi chặng để nhớ lâu hơn."
        action={
          <HlButton href={LANDING_ROUTES.CURRICULUM} variant="ghost">
            Tất cả lộ trình
            <ArrowRight />
          </HlButton>
        }
      />
      <div className={cn('hl-learning-grid', !quiz && 'no-quiz')}>
        <div className="hl-course-list">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
        {quiz && <DailyQuiz quiz={quiz} />}
      </div>
    </section>
  );
}

// === JoinBanner.tsx ===
const BENEFITS = [
  'Đăng ký lộ trình học miễn phí',
  'Lưu tiến độ từng bài trên mọi thiết bị',
  'Đọc trọn bài học kèm nguồn tư liệu',
];

export function JoinBanner() {
  const user = useAuthSession();
  return (
    <section className="hl-section hl-container">
      <Reveal className="hl-join">
        <div className="hl-join-grid">
          <div className="hl-join-copy">
            <span className="hl-join-icon">
              <Globe2 />
            </span>
            <HlBadge>Việt Nam trong dòng chảy thế giới</HlBadge>
            <h2>
              Đừng chỉ đọc lịch sử.
              <br />
              <em>Hãy đi cùng nó.</em>
            </h2>
            <p>
              Từ Văn Lang đến thế giới hiện đại: học theo lộ trình, đối sánh các khu vực và hiểu vì sao mỗi sự kiện
              xảy ra đúng lúc ấy.
            </p>
            <div className="hl-join-proof">
              <ShieldCheck />
              <span>
                <strong>Nội dung được biên tập & duyệt bởi hai người</strong>
                <small>Mỗi bài học đều qua biên tập viên và người duyệt độc lập.</small>
              </span>
            </div>
          </div>
          <div className="hl-join-card">
            {user ? (
              <>
                <h3>Chào mừng trở lại, {user.username}</h3>
                <p>Tiếp tục lộ trình đang học hoặc tìm một thời kỳ mới để khám phá.</p>
                <HlButton href="/tai-khoan#hoc-tap" variant="gold">
                  Lộ trình của tôi <ArrowRight />
                </HlButton>
                <HlButton href={LANDING_ROUTES.CURRICULUM} variant="outline" className="hl-join-secondary">
                  Khám phá lộ trình khác
                </HlButton>
              </>
            ) : (
              <>
                <h3>Tài khoản miễn phí mang lại cho bạn</h3>
                <ul>
                  {BENEFITS.map((b) => (
                    <li key={b}>
                      <span>
                        <Check />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <HlButton href="/dang-ky" variant="gold">
                  Tạo tài khoản miễn phí <ArrowRight />
                </HlButton>
                <HlButton href="/login?redirect=%2F" variant="outline" className="hl-join-secondary">
                  Tôi đã có tài khoản
                </HlButton>
              </>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function StatsStrip({ stats }: { stats: LandingStats }) {
  const items = [
    { icon: History, value: stats.events, label: 'Mốc sự kiện' },
    { icon: Users, value: stats.figures, label: 'Nhân vật lịch sử' },
    { icon: MapPin, value: stats.locations, label: 'Di tích & địa danh' },
    { icon: GraduationCap, value: stats.paths, label: 'Lộ trình học' },
  ];
  return (
    <div className="hl-stats-strip">
      <div className="hl-container hl-stats-grid">
        {items.map((s) => (
          <div key={s.label}>
            <span>
              <s.icon />
            </span>
            <div>
              <strong>{s.value.toLocaleString('vi-VN')}</strong>
              <small>{s.label}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
