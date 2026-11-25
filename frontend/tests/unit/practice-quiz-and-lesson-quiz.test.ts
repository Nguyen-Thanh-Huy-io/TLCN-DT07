import { describe, expect, it } from 'vitest';
import {
  LESSON_QUIZ_DEFAULT_TITLE,
  LESSON_QUIZ_MAX_QUESTIONS,
  collectQuizBlocks,
  copyBankQuestion,
  isLessonAnswerCorrect,
  quizBlockQuestions,
} from '@/features/lessons/utils/lesson-quiz.util';
import type { LessonBlockItem, QuizBlockData } from '@/features/lessons/types/block-builder.types';
import { LessonBlockType, QuizQuestionType, type QuizQuestion } from '@/features/lessons/types/editor.types';
import {
  buildTopicFilterOptions,
  filterPracticeQuizzes,
  formatExamTime,
  isQuestionAnswered,
  pickAnsweredAnswers,
  revealAnswers,
  topicLabelOf,
  topicWithDescendants,
} from '@/features/quiz/utils/practice-quiz.helper';
import type { PracticeQuizItem } from '@/services/entities/quiz.service';

const makeQuiz = (
  id: string,
  title: string,
  topics: Array<{ id: string; name: string; slug: string }>,
  description: string | null = null,
): PracticeQuizItem => ({
  id,
  title,
  description,
  passingScorePercent: 70,
  timeLimitMinutes: 15,
  topics,
  questions: [],
});

describe('practice-quiz.helper', () => {
  const topicsTree = [
    { id: 't-root', name: 'Lịch sử Việt Nam', parentId: null },
    { id: 't-tran', name: 'Nhà Trần', parentId: 't-root' },
    { id: 't-bach-dang', name: 'Bạch Đằng 1288', parentId: 't-tran' },
    { id: 't-empty', name: 'Nhánh chưa có đề', parentId: 't-root' },
  ];

  const quizzes: PracticeQuizItem[] = [
    makeQuiz('q1', 'Đại phá quân Nguyên Mông', [{ id: 't-bach-dang', name: 'Bạch Đằng 1288', slug: 'bd' }]),
    makeQuiz('q2', 'Đề tổng hợp Nhà Trần', [{ id: 't-tran', name: 'Nhà Trần', slug: 'tran' }]),
    makeQuiz('q3', 'Đề ngoài cây chủ đề', [{ id: 't-orphan', name: 'Ngoài cây', slug: 'orphan' }], 'Chiến dịch Điên Biên'),
  ];

  it('xây dựng cây lọc chủ đề chỉ giữ nhánh có đề và gom số lượng đệ quy + orphan', () => {
    const options = buildTopicFilterOptions(topicsTree, quizzes);
    expect(options.map((o) => [o.id, o.depth, o.count])).toEqual([
      ['t-root', 0, 2],
      ['t-tran', 1, 2],
      ['t-bach-dang', 2, 1],
      ['t-orphan', 0, 1],
    ]);
  });

  it('lọc đề theo cây chủ đề con cháu và tìm kiếm tiếng Việt không phân biệt dấu / đ', () => {
    const tranBranch = topicWithDescendants(topicsTree, 't-tran');
    expect(Array.from(tranBranch)).toEqual(['t-tran', 't-bach-dang']);

    const byTopic = filterPracticeQuizzes(quizzes, { query: '', topicIds: tranBranch });
    expect(byTopic.map((q) => q.id)).toEqual(['q1', 'q2']);

    const byDiacritic = filterPracticeQuizzes(quizzes, { query: 'dai pha quan nguyen', topicIds: null });
    expect(byDiacritic.map((q) => q.id)).toEqual(['q1']);

    const byDescriptionD = filterPracticeQuizzes(quizzes, { query: 'dien bien', topicIds: null });
    expect(byDescriptionD.map((q) => q.id)).toEqual(['q3']);
    expect(topicLabelOf(makeQuiz('q0', 'Trống', []))).toBe('Chủ đề Lịch sử');
  });

  it('revealAnswers giữ nguyên thứ tự lựa chọn đã trộn trên client và ghép đáp án server', () => {
    const shown: QuizQuestion[] = [
      {
        id: 'qs-1',
        type: QuizQuestionType.SINGLE_CHOICE,
        prompt: 'Năm 938?',
        options: [
          { id: 'o2', text: '981', isCorrect: false },
          { id: 'o1', text: '938', isCorrect: false },
        ],
      },
      {
        id: 'qs-match',
        type: QuizQuestionType.MATCHING,
        prompt: 'Ghép cặp',
        leftItems: [{ id: 'l1', label: 'Ngô Quyền' }],
        rightItems: [{ id: 'r-shuffled', label: 'Bạch Đằng' }],
        correctPairs: [],
      },
    ];
    const answered: QuizQuestion[] = [
      {
        id: 'qs-1',
        type: QuizQuestionType.SINGLE_CHOICE,
        prompt: 'Năm 938?',
        explanation: 'Chiến thắng Bạch Đằng',
        options: [
          { id: 'o1', text: '938', isCorrect: true },
          { id: 'o2', text: '981', isCorrect: false },
        ],
      },
      {
        id: 'qs-match',
        type: QuizQuestionType.MATCHING,
        prompt: 'Ghép cặp',
        leftItems: [{ id: 'l1', label: 'Ngô Quyền' }],
        rightItems: [{ id: 'r-server', label: 'Bạch Đằng' }],
        correctPairs: [{ leftId: 'l1', rightId: 'r-shuffled' }],
      },
    ];

    const revealed = revealAnswers(shown, answered);
    expect((revealed[0] as Extract<QuizQuestion, { options: unknown }>).options.map((o) => [o.id, o.isCorrect])).toEqual([
      ['o2', false],
      ['o1', true],
    ]);
    expect((revealed[1] as Extract<QuizQuestion, { rightItems: unknown }>).rightItems[0].id).toBe('r-shuffled');
  });

  it('kiểm tra câu đã làm (ca biên chuỗi trắng, mảng rỗng, chưa chạm) & định dạng giờ thi', () => {
    const touched = new Set(['a-str', 'a-empty', 'a-bool', 'a-obj']);
    const answers = {
      'a-str': '938',
      'a-empty': '   ',
      'a-untouched-order': ['1', '2'],
      'a-bool': false,
      'a-obj': { l1: 'r1' },
    };

    expect(isQuestionAnswered('a-untouched-order', touched, answers)).toBe(false);
    expect(isQuestionAnswered('a-empty', touched, answers)).toBe(false);
    expect(isQuestionAnswered('a-bool', touched, answers)).toBe(true);
    expect(Object.keys(pickAnsweredAnswers(answers, touched))).toEqual(['a-str', 'a-bool', 'a-obj']);
    expect(formatExamTime(65)).toBe('01:05');
    expect(formatExamTime(0)).toBe('00:00');
  });
});

describe('lesson-quiz.util', () => {
  it('chuyển đổi khối quiz cũ, thu thập khối lồng trong SECTION_ROW và clone câu ngân hàng', () => {
    expect(LESSON_QUIZ_MAX_QUESTIONS).toBe(5);
    expect(LESSON_QUIZ_DEFAULT_TITLE).toBe('Kiểm tra nhanh');

    const legacyBlock: QuizBlockData = {
      id: 'qb-legacy',
      type: LessonBlockType.QUIZ,
      question: 'Ai chỉ huy trận Bạch Đằng 938?',
      options: [
        { id: 'o1', text: 'Ngô Quyền', isCorrect: true },
        { id: 'o2', text: 'Lê Lợi', isCorrect: false },
      ],
      explanation: 'Năm 938',
    };
    const qs = quizBlockQuestions(legacyBlock);
    expect(qs).toHaveLength(1);
    expect(qs[0].type).toBe(QuizQuestionType.SINGLE_CHOICE);
    expect(quizBlockQuestions({ id: 'empty', type: LessonBlockType.QUIZ })).toEqual([]);

    const blocks: LessonBlockItem[] = [
      {
        id: 'row-1',
        type: LessonBlockType.SECTION_ROW,
        columnCount: 1,
        columns: [{ id: 'c1', widthPercent: 100, blocks: [legacyBlock] }],
      },
    ];
    expect(collectQuizBlocks(blocks).get('qb-legacy')).toBe(legacyBlock);

    const cloned = copyBankQuestion(qs[0]);
    expect(cloned.id).not.toBe(qs[0].id);
    expect(cloned.sourceQuestionId).toBe(qs[0].id);
  });

  it('tự chấm chính xác tất cả 6 dạng câu hỏi bài học (cả ca âm & ca biên)', () => {
    const single: QuizQuestion = {
      id: 's',
      type: QuizQuestionType.SINGLE_CHOICE,
      prompt: '?',
      options: [
        { id: '1', text: 'A', isCorrect: true },
        { id: '2', text: 'B', isCorrect: false },
      ],
    };
    expect(isLessonAnswerCorrect(single, '1')).toBe(true);
    expect(isLessonAnswerCorrect(single, '2')).toBe(false);

    const multi: QuizQuestion = {
      id: 'm',
      type: QuizQuestionType.MULTIPLE_CHOICE,
      prompt: '?',
      options: [
        { id: '1', text: 'A', isCorrect: true },
        { id: '2', text: 'B', isCorrect: true },
        { id: '3', text: 'C', isCorrect: false },
      ],
    };
    expect(isLessonAnswerCorrect(multi, ['2', '1'])).toBe(true);
    expect(isLessonAnswerCorrect(multi, ['1'])).toBe(false);

    const tf: QuizQuestion = {
      id: 'tf',
      type: QuizQuestionType.TRUE_FALSE,
      prompt: '?',
      correctAnswer: false,
    };
    expect(isLessonAnswerCorrect(tf, false)).toBe(true);
    expect(isLessonAnswerCorrect(tf, 'false')).toBe(false);

    const fib: QuizQuestion = {
      id: 'fib',
      type: QuizQuestionType.FILL_IN_BLANK,
      prompt: '?',
      acceptedAnswers: ['Điện Biên Phủ'],
      caseSensitive: false,
    };
    expect(isLessonAnswerCorrect(fib, '  điện biên phủ  ')).toBe(true);
    expect(isLessonAnswerCorrect(fib, '')).toBe(false);

    const ord: QuizQuestion = {
      id: 'ord',
      type: QuizQuestionType.ORDERING,
      prompt: '?',
      items: [
        { id: 'a', label: '1' },
        { id: 'b', label: '2' },
      ],
      correctOrder: ['a', 'b'],
    };
    expect(isLessonAnswerCorrect(ord, ['a', 'b'])).toBe(true);
    expect(isLessonAnswerCorrect(ord, ['b', 'a'])).toBe(false);

    const mat: QuizQuestion = {
      id: 'mat',
      type: QuizQuestionType.MATCHING,
      prompt: '?',
      leftItems: [{ id: 'l1', label: '1945' }],
      rightItems: [{ id: 'r1', label: 'Cách mạng tháng Tám' }],
      correctPairs: [{ leftId: 'l1', rightId: 'r1' }],
    };
    expect(isLessonAnswerCorrect(mat, { l1: 'r1' })).toBe(true);
    expect(isLessonAnswerCorrect(mat, { l1: 'wrong' })).toBe(false);
  });
});
