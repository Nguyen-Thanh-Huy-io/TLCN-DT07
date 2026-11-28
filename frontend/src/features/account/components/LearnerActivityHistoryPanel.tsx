'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { LearnerHistoryKindEnum } from '@/constants/enums';
import { PUBLIC_CURRICULUM_ROUTES } from '@/features/public-curriculum/facades/usePublicCurriculumFacade';
import { formatExamTime } from '@/features/quiz/utils/practice-quiz.helper';
import { extractErrorMessage } from '@/services/api';
import {
  LearnerApiService,
  type LearnerCompletedLessonHistoryItem,
  type LearnerQuizAttemptHistoryItem,
  type LearnerReadArticleHistoryItem,
} from '@/services/entities/learner.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { AccountCard } from './AccountSections';
import { QuizAttemptReviewModal } from './QuizAttemptReviewModal';

const PAGE_LIMIT = 8;

const HISTORY_TABS: ReadonlyArray<{
  kind: LearnerHistoryKindEnum;
  label: string;
  icon: typeof ClipboardCheck;
}> = [
  {
    kind: LearnerHistoryKindEnum.QUIZ_ATTEMPTS,
    label: 'Lịch sử làm đề',
    icon: ClipboardCheck,
  },
  {
    kind: LearnerHistoryKindEnum.COMPLETED_LESSONS,
    label: 'Bài học đã xong',
    icon: BookOpen,
  },
  {
    kind: LearnerHistoryKindEnum.READ_ARTICLES,
    label: 'Bài viết đã đọc',
    icon: FileText,
  },
];

function formatShortDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function QuizAttemptsList({
  items,
  onInspectAttempt,
}: {
  items: LearnerQuizAttemptHistoryItem[];
  onInspectAttempt: (attemptId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2D5B8] bg-white/50 p-8 text-center">
        <ClipboardCheck size={28} className="mx-auto text-[#B8893F]" />
        <p className="mt-2 text-sm font-bold text-[#2D1A10]">
          Chưa có lượt nộp đề thi nào
        </p>
        <p className="mt-1 text-xs text-[#7A6B57]">
          Khi bạn làm đề tại phòng Luyện tập hoặc kiểm tra cuối Chương, mọi kết quả và câu trả lời sẽ lưu tại đây.
        </p>
        <Link
          href="/luyen-tap"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#7A1F24] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#5E161A]"
        >
          Vào phòng Luyện tập <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#E2D5B8]/60 rounded-2xl border border-[#E2D5B8] bg-white">
      {items.map((item) => {
        const topicLabel = item.topics.map((t) => t.name).join(' · ');
        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-[#FAF7F2]/70"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                    item.isPassed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.isPassed ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <XCircle size={12} />
                  )}
                  {item.scorePercent}% ({item.correctCount}/{item.totalQuestions})
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#7A6B57]">
                  <Clock size={11} /> {formatExamTime(item.timeSpentSeconds)}
                </span>
                <span className="text-[11px] text-[#7A6B57]">
                  · {formatShortDateTime(item.createdAt)}
                </span>
              </div>

              <div className="mt-1 font-[family-name:var(--font-heading)] text-sm font-bold text-[#2D1A10]">
                {item.quizTitle}
              </div>

              {topicLabel && (
                <div className="mt-0.5 line-clamp-1 text-xs text-[#7A6B57]">
                  {topicLabel}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onInspectAttempt(item.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2D5B8] bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#2D1A10] transition hover:border-[#B8893F] hover:bg-[#F5EEDC] cursor-pointer"
              >
                <Eye size={13} className="text-[#7A1F24]" />
                <span>Xem đáp án</span>
              </button>

              <Link
                href={`/luyen-tap?quizId=${encodeURIComponent(item.quizId)}`}
                className="inline-flex items-center gap-1 rounded-xl bg-[#7A1F24] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#5E161A]"
              >
                Thi lại <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompletedLessonsList({
  items,
}: {
  items: LearnerCompletedLessonHistoryItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2D5B8] bg-white/50 p-8 text-center">
        <BookOpen size={28} className="mx-auto text-[#B8893F]" />
        <p className="mt-2 text-sm font-bold text-[#2D1A10]">
          Chưa có bài học nào được đánh dấu hoàn thành
        </p>
        <p className="mt-1 text-xs text-[#7A6B57]">
          Các bài học bạn hoàn tất trong Chương trình học sẽ được lưu mốc thời gian tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#E2D5B8]/60 rounded-2xl border border-[#E2D5B8] bg-white">
      {items.map((lesson) => (
        <div
          key={lesson.lessonId}
          className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-[#FAF7F2]/70"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#7A6B57]">
              {lesson.topic && (
                <span className="rounded-md bg-[#F5EEDC] px-2 py-0.5 font-bold text-[#7A1F24]">
                  {lesson.topic.name}
                </span>
              )}
              <span>~{lesson.estimatedReadMinutes} phút đọc</span>
              <span>· Hoàn thành {formatShortDateTime(lesson.completedAt)}</span>
            </div>
            <div className="mt-1 font-[family-name:var(--font-heading)] text-sm font-bold text-[#2D1A10]">
              {lesson.title}
            </div>
          </div>

          <Link
            href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(lesson.slug)}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#E2D5B8] bg-white px-3 py-1.5 text-xs font-bold text-[#7A1F24] transition hover:bg-[#F5EEDC]"
          >
            Ôn lại bài <ChevronRight size={13} />
          </Link>
        </div>
      ))}
    </div>
  );
}

function ReadArticlesList({
  items,
}: {
  items: LearnerReadArticleHistoryItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2D5B8] bg-white/50 p-8 text-center">
        <FileText size={28} className="mx-auto text-[#B8893F]" />
        <p className="mt-2 text-sm font-bold text-[#2D1A10]">
          Chưa có bài viết tư liệu nào đánh dấu đã đọc
        </p>
        <p className="mt-1 text-xs text-[#7A6B57]">
          Khi đọc Nhân vật, Sự kiện hoặc Di tích và bấm nút &ldquo;Đánh dấu đã đọc&rdquo;, bài viết sẽ lưu vào nhật ký này.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#E2D5B8]/60 rounded-2xl border border-[#E2D5B8] bg-white">
      {items.map((art) => (
        <div
          key={art.activityId}
          className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-[#FAF7F2]/70"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#7A6B57]">
              {art.categoryName && (
                <span className="rounded-md bg-[#F5EEDC] px-2 py-0.5 font-bold text-[#7A1F24]">
                  {art.categoryName}
                </span>
              )}
              {art.xpEarned > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                  +{art.xpEarned} XP
                </span>
              )}
              <span>· Đã đọc {formatShortDateTime(art.readAt)}</span>
            </div>
            <div className="mt-1 font-[family-name:var(--font-heading)] text-sm font-bold text-[#2D1A10]">
              {art.title}
            </div>
            {art.summary && (
              <p className="mt-0.5 line-clamp-1 text-xs text-[#7A6B57]">
                {art.summary}
              </p>
            )}
          </div>

          {art.slug && (
            <Link
              href={PUBLIC_ROUTES.ARTICLE(art.slug)}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#E2D5B8] bg-white px-3 py-1.5 text-xs font-bold text-[#7A1F24] transition hover:bg-[#F5EEDC]"
            >
              Đọc lại <ChevronRight size={13} />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

export function LearnerActivityHistoryPanel() {
  const [activeKind, setActiveKind] = useState<LearnerHistoryKindEnum>(
    LearnerHistoryKindEnum.QUIZ_ATTEMPTS,
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [inspectAttemptId, setInspectAttemptId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    LearnerApiService.getHistory({
      kind: activeKind,
      page,
      limit: PAGE_LIMIT,
    })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotalPages(Math.max(1, res.totalPages));
        setTotalItems(res.total);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            extractErrorMessage(
              err,
              'Không tải được nhật ký học tập. Vui lòng thử lại.',
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeKind, page, reloadTick]);

  const handleSelectKind = (nextKind: LearnerHistoryKindEnum) => {
    if (nextKind === activeKind) return;
    setLoading(true);
    setItems([]);
    setActiveKind(nextKind);
    setPage(1);
  };

  return (
    <>
      <AccountCard
        id="lich-su-hoc-tap"
        eyebrow="Nhật ký cá nhân"
        title="Lịch sử làm bài & Đọc tư liệu"
        action={
          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#E2D5B8] bg-[#FAF7F2] p-1">
            {HISTORY_TABS.map((tab) => {
              const IconComp = tab.icon;
              const selected = activeKind === tab.kind;
              return (
                <button
                  key={tab.kind}
                  type="button"
                  onClick={() => handleSelectKind(tab.kind)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    selected
                      ? 'bg-[#7A1F24] text-white shadow-2xs'
                      : 'text-[#7A6B57] hover:text-[#2D1A10]'
                  }`}
                >
                  <IconComp size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-[#EFE7D3]/70"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <AlertCircle size={26} className="mx-auto text-rose-500" />
            <p className="mt-2 text-xs font-semibold text-rose-800">{error}</p>
            <button
              type="button"
              onClick={() => setReloadTick((n) => n + 1)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-rose-800 shadow-2xs hover:bg-rose-100 cursor-pointer"
            >
              <RotateCcw size={12} /> Thử lại
            </button>
          </div>
        ) : (
          <>
            {activeKind === LearnerHistoryKindEnum.QUIZ_ATTEMPTS && (
              <QuizAttemptsList
                items={items as LearnerQuizAttemptHistoryItem[]}
                onInspectAttempt={setInspectAttemptId}
              />
            )}
            {activeKind === LearnerHistoryKindEnum.COMPLETED_LESSONS && (
              <CompletedLessonsList
                items={items as LearnerCompletedLessonHistoryItem[]}
              />
            )}
            {activeKind === LearnerHistoryKindEnum.READ_ARTICLES && (
              <ReadArticlesList
                items={items as LearnerReadArticleHistoryItem[]}
              />
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-xs text-[#7A6B57]">
                <span>Tổng cộng {totalItems} mục</span>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E2D5B8] bg-white px-2.5 py-1 font-semibold text-[#2D1A10] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={13} /> Trước
                  </button>
                  <span className="px-2 font-bold text-[#2D1A10]">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E2D5B8] bg-white px-2.5 py-1 font-semibold text-[#2D1A10] disabled:opacity-40 cursor-pointer"
                  >
                    Sau <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </AccountCard>

      <QuizAttemptReviewModal
        attemptId={inspectAttemptId}
        onClose={() => setInspectAttemptId(null)}
      />
    </>
  );
}
