import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  QUIZ_QUESTIONS_INCLUDE,
  toQuizQuestions,
} from './quiz-question.mapper';
import { QuizQuestion, QuizQuestionType } from './types/quiz-question.types';

const RECENT_ATTEMPTS_LIMIT = 50;
const ANONYMOUS_LEARNER = 'Thí sinh tự do';
const TRUE_FALSE_LABELS = { true: 'Đúng', false: 'Sai' } as const;

const STATS_QUIZ_INCLUDE = {
  topics: { select: { name: true } },
  ...QUIZ_QUESTIONS_INCLUDE,
} satisfies Prisma.QuizInclude;

interface WrongAnswerRow {
  question_id: string;
  answer: Prisma.JsonValue;
  n: number;
}

export interface QuestionStatistics {
  questionId: string;
  type: string;
  prompt: string;
  answered: number;
  correct: number;
  correctRatePercent: number;
  /** Câu trả lời sai bị chọn nhiều nhất; null khi chưa ai sai hoặc dạng câu không có nhãn ngắn gọn. */
  topWrongAnswer: { label: string; count: number } | null;
}

export interface QuizStatistics {
  quizId: string;
  quizTitle: string | null;
  topicTitle: string;
  summary: {
    totalAttempts: number;
    passedAttempts: number;
    passRatePercent: number;
    averageScore: number;
    averageTimeMinutes: string;
  };
  questions: QuestionStatistics[];
  recentAttempts: {
    id: string;
    learnerName: string;
    scorePercent: number;
    correctCount: number;
    totalQuestions: number;
    timeSpentSeconds: number;
    isPassed: boolean;
    submittedAt: Date;
  }[];
}

const percent = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const plainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Nhãn đọc được của 1 câu trả lời; chỉ dạng câu có đáp án ngắn (chọn, đúng/sai, điền). */
function answerLabel(q: QuizQuestion, answer: Prisma.JsonValue): string | null {
  switch (q.type) {
    case QuizQuestionType.SINGLE_CHOICE:
      return q.options.find((o) => o.id === answer)?.text ?? null;
    case QuizQuestionType.MULTIPLE_CHOICE:
      return Array.isArray(answer)
        ? answer
            .map((id) => q.options.find((o) => o.id === id)?.text)
            .filter(Boolean)
            .join(' + ') || null
        : null;
    case QuizQuestionType.TRUE_FALSE:
      return typeof answer === 'boolean'
        ? TRUE_FALSE_LABELS[`${answer}`]
        : null;
    case QuizQuestionType.FILL_IN_BLANK:
      return typeof answer === 'string' ? answer : null;
    default:
      return null;
  }
}

/** Thống kê đề thi cho CMS: tổng hợp trên MỌI lượt làm, kèm tỷ lệ đúng từng câu. */
@Injectable()
export class QuizStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuizStatistics(quizId: string): Promise<QuizStatistics> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: STATS_QUIZ_INCLUDE,
    });
    if (!quiz) throw new NotFoundException('Không tìm thấy đề thi');

    const [totals, passedAttempts, recent, perQuestion, wrongAnswers] =
      await Promise.all([
        this.prisma.quizAttempt.aggregate({
          where: { quizId },
          _count: { _all: true },
          _avg: { scorePercent: true, timeSpentSeconds: true },
        }),
        this.prisma.quizAttempt.count({ where: { quizId, isPassed: true } }),
        this.prisma.quizAttempt.findMany({
          where: { quizId },
          orderBy: { createdAt: 'desc' },
          take: RECENT_ATTEMPTS_LIMIT,
          select: {
            id: true,
            learnerName: true,
            scorePercent: true,
            correctCount: true,
            totalQuestions: true,
            timeSpentSeconds: true,
            isPassed: true,
            createdAt: true,
            user: { select: { username: true } },
          },
        }),
        this.prisma.quizAttemptAnswer.groupBy({
          by: ['questionId', 'isCorrect'],
          where: { attempt: { quizId } },
          _count: { _all: true },
        }),
        this.prisma.$queryRaw<WrongAnswerRow[]>`
          SELECT a.question_id, a.answer, count(*)::int AS n
          FROM quiz_attempt_answers a
          JOIN quiz_attempts t ON t.id = a.attempt_id
          WHERE t.quiz_id = ${quizId} AND a.is_correct = false AND a.answer IS NOT NULL
          GROUP BY a.question_id, a.answer
          ORDER BY n DESC`,
      ]);

    const totalAttempts = totals._count._all;
    const questions = toQuizQuestions(quiz.quizQuestions).map(
      (q): QuestionStatistics => {
        const rows = perQuestion.filter((r) => r.questionId === q.id);
        const answered = rows.reduce((n, r) => n + r._count._all, 0);
        const correct = rows.find((r) => r.isCorrect)?._count._all ?? 0;
        const wrong = wrongAnswers
          .filter((w) => w.question_id === q.id)
          .map((w) => ({ label: answerLabel(q, w.answer), count: w.n }))
          .find((w): w is { label: string; count: number } => Boolean(w.label));
        return {
          questionId: q.id,
          type: q.type,
          prompt: plainText(q.prompt),
          answered,
          correct,
          correctRatePercent: percent(correct, answered),
          topWrongAnswer: wrong ?? null,
        };
      },
    );

    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      topicTitle: quiz.topics.map((t) => t.name).join(', '),
      summary: {
        totalAttempts,
        passedAttempts,
        passRatePercent: percent(passedAttempts, totalAttempts),
        averageScore: Math.round(totals._avg.scorePercent ?? 0),
        averageTimeMinutes: ((totals._avg.timeSpentSeconds ?? 0) / 60).toFixed(
          1,
        ),
      },
      questions,
      recentAttempts: recent.map((a) => ({
        id: a.id,
        learnerName: a.user?.username || a.learnerName || ANONYMOUS_LEARNER,
        scorePercent: a.scorePercent,
        correctCount: a.correctCount,
        totalQuestions: a.totalQuestions,
        timeSpentSeconds: a.timeSpentSeconds,
        isPassed: a.isPassed,
        submittedAt: a.createdAt,
      })),
    };
  }
}
