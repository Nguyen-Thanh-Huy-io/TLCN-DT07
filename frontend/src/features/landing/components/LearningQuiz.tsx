'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, Check, Layers, Lightbulb, X } from 'lucide-react';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonProgress';
import { LANDING_ROUTES } from '../landing.adapter';
import type { LandingCourse, LandingQuiz } from '../landing.types';
import { HlBadge, HlButton, HlProgress, SectionHead, cn } from './LandingUi';

function CourseCard({ course }: { course: LandingCourse }) {
  const { isEnrolled, isCompleted } = useLessonProgress();
  const enrolled = isEnrolled(course.id);
  const done = course.lessons.filter((l) => isCompleted(l.id)).length;
  const percent = course.lessons.length ? Math.round((done / course.lessons.length) * 100) : 0;
  return (
    <article className="hl-course-card">
      <img src={course.imageUrl} alt="" />
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
          const state = answer === null ? '' : i === quiz.correctIndex ? 'correct' : i === answer ? 'wrong' : 'muted';
          return (
            <button type="button" className={state} disabled={answer !== null} key={option} onClick={() => setAnswer(i)}>
              <span>{String.fromCharCode(65 + i)}</span>
              {option}
              {state === 'correct' && <Check />}
              {state === 'wrong' && <X />}
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
            <strong>{correct ? 'Chính xác!' : `Chưa đúng — đáp án là ${quiz.options[quiz.correctIndex]}.`}</strong>
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
        eyebrow="Học sâu — Nhớ lâu"
        title="Lộ trình dành riêng cho bạn"
        description="Học theo chương trình có cấu trúc, kiểm tra kiến thức ngay sau mỗi chặng."
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
