import { describe, expect, it } from 'vitest';
import {
  LessonAccessState,
} from '@/features/public-curriculum/facades/usePublicCurriculumFacade';
import {
  evaluatePathJourney,
  isChapterQuizPassedByContext,
  resolveChapterQuizPassScore,
} from '@/features/public-curriculum/utils/chapter-progression.util';
import {
  LEARNER_ERROR_CODES,
  type LearningPathItem,
  type LessonProgressionState,
} from '@/services/entities/learner.service';
import { ContentStatus, LearningPathType } from '@/constants/enums';

// Helper matching logic evaluateLessonStates in LearningJourneyRoadmap
function evaluateLessonStates(
  allLessons: Array<{ id: string; slug: string }>,
  isSequential: boolean,
  isCompleted: (id: string) => boolean,
): Record<string, LessonProgressionState> {
  const result: Record<string, LessonProgressionState> = {};
  let reachedFirstIncomplete = false;

  for (let i = 0; i < allLessons.length; i++) {
    const lesson = allLessons[i];
    if (isCompleted(lesson.id)) {
      result[lesson.id] = 'COMPLETED';
    } else if (!isSequential) {
      result[lesson.id] = 'CURRENT_UNLOCKED';
    } else if (!reachedFirstIncomplete) {
      result[lesson.id] = 'CURRENT_UNLOCKED';
      reachedFirstIncomplete = true;
    } else {
      result[lesson.id] = 'LOCKED_PREREQUISITE';
    }
  }

  return result;
}

describe('Learning Journey Progression & Access Control', () => {
  it('xác định đúng LessonAccessState và LEARNER_ERROR_CODES', () => {
    expect(LessonAccessState.GRANTED).toBe('GRANTED');
    expect(LessonAccessState.LOGIN_REQUIRED).toBe('LOGIN_REQUIRED');
    expect(LessonAccessState.NOT_ENROLLED).toBe('NOT_ENROLLED');
    expect(LessonAccessState.LOCKED_SEQUENTIAL).toBe('LOCKED_SEQUENTIAL');
    expect(LEARNER_ERROR_CODES.LESSON_LOCKED_SEQUENTIAL).toBe('LESSON_LOCKED_SEQUENTIAL');
    expect(LEARNER_ERROR_CODES.PREREQUISITE_NOT_MET).toBe('PREREQUISITE_NOT_MET');
  });

  describe('Sequential Progression Logic (isSequential = true)', () => {
    const lessons = [
      { id: 'les-1', slug: 'bai-1-khoi-dau' },
      { id: 'les-2', slug: 'bai-2-cao-trao' },
      { id: 'les-3', slug: 'bai-3-ket-thuc' },
    ];

    it('khi chưa học bài nào: bài 1 mở khóa (CURRENT_UNLOCKED), bài 2 và 3 bị khóa (LOCKED_PREREQUISITE)', () => {
      const isCompleted = () => false;
      const states = evaluateLessonStates(lessons, true, isCompleted);

      expect(states['les-1']).toBe('CURRENT_UNLOCKED');
      expect(states['les-2']).toBe('LOCKED_PREREQUISITE');
      expect(states['les-3']).toBe('LOCKED_PREREQUISITE');
    });

    it('khi đã hoàn thành bài 1: bài 1 COMPLETED, bài 2 mở khóa, bài 3 vẫn khóa', () => {
      const isCompleted = (id: string) => id === 'les-1';
      const states = evaluateLessonStates(lessons, true, isCompleted);

      expect(states['les-1']).toBe('COMPLETED');
      expect(states['les-2']).toBe('CURRENT_UNLOCKED');
      expect(states['les-3']).toBe('LOCKED_PREREQUISITE');
    });

    it('khi đã hoàn thành cả 3 bài: tất cả đều COMPLETED', () => {
      const isCompleted = () => true;
      const states = evaluateLessonStates(lessons, true, isCompleted);

      expect(states['les-1']).toBe('COMPLETED');
      expect(states['les-2']).toBe('COMPLETED');
      expect(states['les-3']).toBe('COMPLETED');
    });
  });

  describe('Free-paced Progression Logic (isSequential = false)', () => {
    const lessons = [
      { id: 'les-1', slug: 'chuyen-de-1' },
      { id: 'les-2', slug: 'chuyen-de-2' },
      { id: 'les-3', slug: 'chuyen-de-3' },
    ];

    it('ở lộ trình tự do: các bài chưa học đều mở khóa (CURRENT_UNLOCKED)', () => {
      const isCompleted = (id: string) => id === 'les-2';
      const states = evaluateLessonStates(lessons, false, isCompleted);

      expect(states['les-1']).toBe('CURRENT_UNLOCKED');
      expect(states['les-2']).toBe('COMPLETED');
      expect(states['les-3']).toBe('CURRENT_UNLOCKED');
    });
  });

  describe('Prerequisite Path Linking (A -> B -> C)', () => {
    it('nhận diện cấu trúc liên kết lộ trình tiên quyết và lộ trình tiếp nối', () => {
      const pathA: LearningPathItem = {
        id: 'path-a',
        title: 'Khóa A: Lịch sử cổ đại',
        slug: 'khoa-a',
        pathType: LearningPathType.CHRONOLOGICAL,
        status: ContentStatus.PUBLISHED,
        displayOrder: 1,
        isSequential: true,
        chapters: [],
      };

      const pathB: LearningPathItem = {
        id: 'path-b',
        title: 'Khóa B: Lịch sử trung đại',
        slug: 'khoa-b',
        pathType: LearningPathType.CHRONOLOGICAL,
        status: ContentStatus.PUBLISHED,
        displayOrder: 2,
        isSequential: true,
        prerequisitePathId: 'path-a',
        prerequisitePath: {
          id: 'path-a',
          title: 'Khóa A: Lịch sử cổ đại',
          slug: 'khoa-a',
        },
        chapters: [],
      };

      expect(pathB.prerequisitePathId).toBe('path-a');
      expect(pathB.prerequisitePath?.title).toBe('Khóa A: Lịch sử cổ đại');
    });
  });

  describe('Chapter Multi-Quiz Progression (evaluatePathJourney)', () => {
    const buildSequentialPathWithQuizzes = (): LearningPathItem => ({
      id: 'path-12',
      title: 'Lịch sử 12 — Kháng chiến chống Pháp',
      slug: 'lich-su-12-kc-phap',
      pathType: LearningPathType.CHRONOLOGICAL,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
      isSequential: true,
      chapters: [
        {
          id: 'ch-1',
          learningPathId: 'path-12',
          title: 'Chương 1: Cách mạng tháng Tám',
          slug: 'chuong-1-cmtt',
          displayOrder: 1,
          chapterLessons: [
            {
              id: 'cl-1',
              chapterId: 'ch-1',
              lessonId: 'les-1',
              displayOrder: 1,
              lesson: {
                id: 'les-1',
                title: 'Bài 1: Tổng khởi nghĩa',
                slug: 'bai-1-tong-khoi-nghia',
                status: ContentStatus.PUBLISHED,
              },
            },
          ],
          chapterQuizzes: [
            {
              id: 'cq-opt',
              chapterId: 'ch-1',
              quizId: 'quiz-opt',
              displayOrder: 1,
              passScore: null,
              isRequired: false,
              quiz: {
                id: 'quiz-opt',
                title: 'Đề ôn tập tự chọn Chương 1',
                passingScorePercent: 60,
                timeLimitMinutes: 15,
              },
            },
            {
              id: 'cq-req',
              chapterId: 'ch-1',
              quizId: 'quiz-req',
              displayOrder: 2,
              passScore: 80,
              isRequired: true,
              quiz: {
                id: 'quiz-req',
                title: 'Kiểm tra cuối Chương 1',
                passingScorePercent: 70,
                timeLimitMinutes: 30,
              },
            },
          ],
        },
        {
          id: 'ch-2',
          learningPathId: 'path-12',
          title: 'Chương 2: Toàn quốc kháng chiến',
          slug: 'chuong-2-tqkc',
          displayOrder: 2,
          chapterLessons: [
            {
              id: 'cl-2',
              chapterId: 'ch-2',
              lessonId: 'les-2',
              displayOrder: 1,
              lesson: {
                id: 'les-2',
                title: 'Bài 2: Lời kêu gọi toàn quốc kháng chiến',
                slug: 'bai-2-toan-quoc-khang-chien',
                status: ContentStatus.PUBLISHED,
              },
            },
          ],
          chapterQuizzes: [],
        },
      ],
    });

    it('mã lỗi CHAPTER_QUIZ_LOCKED và ưu tiên passScore ghi đè trên ChapterQuiz', () => {
      expect(LEARNER_ERROR_CODES.CHAPTER_QUIZ_LOCKED).toBe('CHAPTER_QUIZ_LOCKED');

      const path = buildSequentialPathWithQuizzes();
      const [optQuiz, reqQuiz] = path.chapters![0].chapterQuizzes!;
      expect(resolveChapterQuizPassScore(optQuiz)).toBe(60);
      expect(resolveChapterQuizPassScore(reqQuiz)).toBe(80);

      // Đạt 75% (vượt ngưỡng gốc 70% của Quiz nhưng chưa đạt ngưỡng ghi đè 80% của Chương)
      expect(
        isChapterQuizPassedByContext(reqQuiz, {
          isCompleted: () => true,
          isQuizPassed: () => true,
          bestQuizScores: { 'quiz-req': 75 },
        }),
      ).toBe(false);

      expect(
        isChapterQuizPassedByContext(reqQuiz, {
          isCompleted: () => true,
          isQuizPassed: () => true,
          bestQuizScores: { 'quiz-req': 80 },
        }),
      ).toBe(true);
    });

    it('chặn mở Chương 2 cho đến khi hoàn thành bài học Chương 1 VÀ đạt đề bắt buộc (≥ passScore)', () => {
      const path = buildSequentialPathWithQuizzes();

      // 1. Chưa học bài 1 -> cả đề Chương 1 lẫn bài Chương 2 đều khóa
      const step1 = evaluatePathJourney(path, {
        isCompleted: () => false,
      });
      expect(step1.get('ch-1')?.lessons.get('les-1')?.state).toBe('CURRENT_UNLOCKED');
      expect(step1.get('ch-1')?.quizzes[0].state).toBe('LOCKED');
      expect(step1.get('ch-1')?.quizzes[1].state).toBe('LOCKED');
      expect(step1.get('ch-2')?.lessons.get('les-2')?.state).toBe('LOCKED_PREREQUISITE');

      // 2. Học xong bài 1 nhưng mới đạt 75% đề bắt buộc (< 80%) -> 2 đề Chương 1 UNLOCKED, nhưng Chương 2 vẫn khóa bởi đề bắt buộc
      const step2 = evaluatePathJourney(path, {
        isCompleted: (id) => id === 'les-1',
        isQuizPassed: (qid) => qid === 'quiz-req',
        bestQuizScores: { 'quiz-req': 75 },
      });
      expect(step2.get('ch-1')?.quizzes[0].state).toBe('UNLOCKED');
      expect(step2.get('ch-1')?.quizzes[1].state).toBe('UNLOCKED');
      expect(step2.get('ch-1')?.isChapterFullyComplete).toBe(false);
      expect(step2.get('ch-2')?.lessons.get('les-2')?.state).toBe('LOCKED_PREREQUISITE');
      expect(step2.get('ch-2')?.lessons.get('les-2')?.lockedReason).toContain('Kiểm tra cuối Chương 1');

      // 3. Đạt 85% đề bắt buộc (dù đề tự chọn chưa làm) -> Chương 1 hoàn tất, bài 2 Chương 2 mở khóa!
      const step3 = evaluatePathJourney(path, {
        isCompleted: (id) => id === 'les-1',
        isQuizPassed: (qid) => qid === 'quiz-req',
        bestQuizScores: { 'quiz-req': 85 },
      });
      expect(step3.get('ch-1')?.quizzes[0].state).toBe('UNLOCKED'); // tự chọn vẫn mở để luyện thêm
      expect(step3.get('ch-1')?.quizzes[1].state).toBe('PASSED');
      expect(step3.get('ch-1')?.isChapterFullyComplete).toBe(true);
      expect(step3.get('ch-2')?.lessons.get('les-2')?.state).toBe('CURRENT_UNLOCKED');
    });

    it('hỗ trợ Chương luyện đề thuần túy (0 bài học + N đề thực chiến ĐGNL mở khóa đồng thời)', () => {
      const dgnlPath: LearningPathItem = {
        id: 'path-dgnl',
        title: 'Luyện đề thực chiến ĐGNL V-ACT',
        slug: 'luyen-de-dgnl-vact',
        pathType: LearningPathType.THEMATIC,
        status: ContentStatus.PUBLISHED,
        displayOrder: 1,
        isSequential: true,
        chapters: [
          {
            id: 'ch-exams',
            learningPathId: 'path-dgnl',
            title: 'Bộ 3 đề thực chiến Đợt 1',
            slug: 'bo-3-de-thuc-chien-dot-1',
            displayOrder: 1,
            chapterLessons: [],
            chapterQuizzes: [1, 2, 3].map((idx) => ({
              id: `cq-${idx}`,
              chapterId: 'ch-exams',
              quizId: `dgnl-quiz-${idx}`,
              displayOrder: idx,
              passScore: 70,
              isRequired: idx <= 2, // Đề 1, 2 bắt buộc; Đề 3 nâng cao tự chọn
              quiz: {
                id: `dgnl-quiz-${idx}`,
                title: `Đề thực chiến số ${idx}`,
                passingScorePercent: 70,
                timeLimitMinutes: 45,
              },
            })),
          },
        ],
      };

      const initial = evaluatePathJourney(dgnlPath, {
        isCompleted: () => false,
      });
      const chInitial = initial.get('ch-exams')!;
      // Cả 3 đề trong cùng chương 0 bài học đều UNLOCKED để học sinh làm đề trong chương
      expect(chInitial.quizzes.map((q) => q.state)).toEqual([
        'UNLOCKED',
        'UNLOCKED',
        'UNLOCKED',
      ]);
      expect(chInitial.isChapterFullyComplete).toBe(false);

      const afterRequiredPassed = evaluatePathJourney(dgnlPath, {
        isCompleted: () => false,
        bestQuizScores: { 'dgnl-quiz-1': 80, 'dgnl-quiz-2': 75 },
      });
      const chPassed = afterRequiredPassed.get('ch-exams')!;
      expect(chPassed.quizzes.map((q) => q.state)).toEqual([
        'PASSED',
        'PASSED',
        'UNLOCKED',
      ]);
      expect(chPassed.isChapterFullyComplete).toBe(true);
    });
  });
});
