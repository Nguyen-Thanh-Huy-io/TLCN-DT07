'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuizQuestionType, type QuizQuestion } from '@/features/lessons/types/editor.types';
import { MoveDirection } from '@/features/lessons/components/quiz/QuizQuestionEditors';
import {
  prepareQuizSessionForLearner,
  type UserQuizAnswer,
} from '@/features/public-curriculum/strategies/public-curriculum.strategies';
import {
  QuizApiService,
  type PracticeQuizItem,
  type QuizAttemptResult,
} from '@/services/entities/quiz.service';
import { extractErrorMessage } from '@/services/api';
import { emitGamificationRefresh } from '@/features/gamification/services/gamification.service';
import {
  isQuestionAnswered,
  pickAnsweredAnswers,
  revealAnswers,
} from '../utils/practice-quiz.helper';

export const DEFAULT_TIME_LIMIT_MINUTES = 15;

const SECONDS_PER_MINUTE = 60;
const TICK_MS = 1000;

/** Hộp thoại của phòng thi; không có `cancelLabel` = chỉ thông báo, một nút. */
export interface ExamDialog {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone: 'warning' | 'danger';
  onConfirm: () => void;
}

interface UsePracticeExamOptions {
  quiz: PracticeQuizItem | undefined;
  /** Câu hỏi của đề ở dạng hiển thị (chưa xáo), dùng cho màn chuẩn bị. */
  briefingQuestions: QuizQuestion[];
  /** Chỉ khách mới gửi tên; đã đăng nhập thì server lấy tài khoản từ token. */
  guestLearnerName: string | undefined;
}

const timeLimitSecondsOf = (quiz: PracticeQuizItem | undefined) =>
  (quiz?.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES) * SECONDS_PER_MINUTE;

/** Link nội bộ (cùng origin, mở tại tab hiện tại) mà người học bấm khi đang làm bài. */
function internalLinkOf(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
  // Có `target` (mở tab / khung khác) thì trang hiện tại không bị rời đi.
  if (!(anchor instanceof HTMLAnchorElement) || anchor.target) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  return url.pathname + url.search + url.hash;
}

/**
 * Phòng thi luyện tập: đồng hồ, bài làm, nộp bài, xem lại câu sai và chặn rời trang khi
 * đang làm dở (đóng tab / tải lại qua `beforeunload`, bấm link trong trang qua hộp thoại).
 */
export function usePracticeExam({ quiz, briefingQuestions, guestLearnerName }: UsePracticeExamOptions) {
  const router = useRouter();
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserQuizAnswer>>({});
  const [touchedIds, setTouchedIds] = useState<ReadonlySet<string>>(() => new Set());
  // Câu hỏi đã xáo lựa chọn / thứ tự cho lượt làm hiện tại (giống trang đọc bài học).
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[] | null>(null);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [dialog, setDialog] = useState<ExamDialog | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef<() => void>(() => {});

  const submitted = result !== null;
  const inProgress = examStarted && !submitted;
  const questions = sessionQuestions ?? briefingQuestions;
  const answered = useMemo(
    () => questions.map((q) => isQuestionAnswered(q.id, touchedIds, answers)),
    [questions, touchedIds, answers],
  );
  const unansweredCount = answered.filter((isDone) => !isDone).length;
  const wrongCount = result ? questions.filter((q) => !result.results[q.id]).length : 0;

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = useCallback(() => {
    stopTimer();
    setExamStarted(false);
    setTimeLeft(timeLimitSecondsOf(quiz));
    setAnswers({});
    setTouchedIds(new Set());
    setSessionQuestions(null);
    setResult(null);
    setSubmitError(null);
    setShowWrongOnly(false);
  }, [quiz]);

  const start = () => {
    setTimeLeft(timeLimitSecondsOf(quiz));
    setExamStarted(true);
    setResult(null);
    const { preparedQuiz, initialAnswers } = prepareQuizSessionForLearner({ questions: briefingQuestions });
    setSessionQuestions(preparedQuiz.questions);
    setAnswers(initialAnswers);
    setTouchedIds(new Set());
  };

  const submit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setSubmitError(null);
    stopTimer();
    try {
      const graded = await QuizApiService.submitQuizAttempt(quiz.id, {
        learnerName: guestLearnerName,
        timeSpentSeconds: Math.max(1, timeLimitSecondsOf(quiz) - timeLeft),
        answers: pickAnsweredAnswers(answers, touchedIds),
      });
      setResult(graded);
      setSessionQuestions(revealAnswers(questions, graded.questions));
      emitGamificationRefresh();
    } catch (err) {
      setSubmitError(extractErrorMessage(err, 'Nộp bài không thành công. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const closeDialog = () => setDialog(null);

  const requestSubmit = () => {
    if (unansweredCount === 0) {
      void submit();
      return;
    }
    setDialog({
      title: 'Nộp bài khi chưa làm hết?',
      message: `Bạn còn ${unansweredCount}/${questions.length} câu chưa làm. Câu bỏ trống sẽ tính là sai.`,
      confirmLabel: 'Vẫn nộp bài',
      cancelLabel: 'Làm tiếp',
      tone: 'warning',
      onConfirm: () => void submit(),
    });
  };

  /** Chạy `action` ngay nếu không làm dở; đang làm thì hỏi trước vì bài làm sẽ mất. */
  const confirmDiscard = useCallback(
    (action: () => void, confirmLabel = 'Bỏ bài đang làm') => {
      if (!inProgress) {
        action();
        return;
      }
      setDialog({
        title: 'Bỏ bài đang làm?',
        message: 'Bài đang làm dở sẽ không được lưu và không được chấm điểm.',
        confirmLabel,
        cancelLabel: 'Ở lại làm tiếp',
        tone: 'danger',
        onConfirm: action,
      });
    },
    [inProgress],
  );

  const setAnswer = (questionId: string, answer: UserQuizAnswer) => {
    if (submitted) return;
    if (!examStarted) start();
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setTouchedIds((prev) => (prev.has(questionId) ? prev : new Set(prev).add(questionId)));
  };

  const moveOrderingItem = (questionId: string, fromIdx: number, direction: 'UP' | 'DOWN') => {
    const question = questions.find((q) => q.id === questionId);
    if (submitted || !question || question.type !== QuizQuestionType.ORDERING) return;
    const current = answers[questionId];
    const order = Array.isArray(current) ? [...current] : question.items.map((item) => item.id);
    const targetIdx = direction === MoveDirection.UP ? fromIdx - 1 : fromIdx + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const [moved] = order.splice(fromIdx, 1);
    order.splice(targetIdx, 0, moved);
    setAnswer(questionId, order);
  };

  useEffect(() => {
    onTimeUpRef.current = () => {
      void submit();
      setDialog({
        title: 'Hết giờ làm bài',
        message: 'Hệ thống đã tự thu bài và chấm điểm. Câu chưa làm được tính là sai.',
        confirmLabel: 'Xem kết quả',
        tone: 'warning',
        onConfirm: () => {},
      });
    };
  });

  useEffect(() => {
    if (!inProgress) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;
        stopTimer();
        onTimeUpRef.current();
        return 0;
      });
    }, TICK_MS);
    return stopTimer;
  }, [inProgress]);

  useEffect(() => {
    if (!inProgress) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const guardLinkClick = (event: MouseEvent) => {
      const href = internalLinkOf(event);
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      confirmDiscard(() => router.push(href), 'Rời trang');
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    // Pha capture để chặn trước khi <Link> của Next điều hướng phía client.
    document.addEventListener('click', guardLinkClick, true);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      document.removeEventListener('click', guardLinkClick, true);
    };
  }, [inProgress, confirmDiscard, router]);

  return {
    examStarted,
    timeLeft,
    questions,
    answers,
    answered,
    result,
    submitted,
    submitting,
    submitError,
    wrongCount,
    showWrongOnly,
    setShowWrongOnly,
    dialog,
    closeDialog,
    start,
    reset,
    requestSubmit,
    confirmDiscard,
    setAnswer,
    moveOrderingItem,
  };
}

export type PracticeExam = ReturnType<typeof usePracticeExam>;
