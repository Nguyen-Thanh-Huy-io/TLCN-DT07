'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, UserRound, Zap } from 'lucide-react';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonProgress';
import { PUBLIC_CURRICULUM_ROUTES } from '@/features/public-curriculum/constants/public-curriculum.constants';
import { LANDING_ROUTES } from '../landing.adapter';
import type { LandingCourse } from '../landing.types';
import { HlBadge, HlButton, HlProgress, Reveal } from './LandingUi';

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
