import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LearningPathType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { PathPrerequisitePolicy } from './policies/path-prerequisite.policy';
import { LearningPathService } from './learning-path.service';

describe('LearningPathService', () => {
  let service: LearningPathService;
  const mockPrerequisitePolicy = {
    assertNoCircularDependency: jest.fn().mockResolvedValue(undefined),
    validateEnrollmentEligibility: jest
      .fn()
      .mockResolvedValue({ isEligible: true }),
  };
  const prisma = {
    learningPath: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn(),
      create: jest.fn(({ data }: { data: object }) => ({
        id: 'path-1',
        ...data,
      })),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chapter: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(({ data }: { data: object }) => ({
        id: 'ch-1',
        ...data,
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chapterLesson: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(({ create }: { create: object }) => create),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    chapterQuiz: {
      deleteMany: jest.fn(),
      create: jest.fn(({ data }: { data: object }) => ({
        id: 'cq-1',
        ...data,
      })),
    },
    quiz: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown) =>
      typeof ops === 'function'
        ? (ops as (tx: unknown) => Promise<unknown>)(prisma)
        : Promise.all(ops as Promise<unknown>[]),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.chapter.findUnique.mockResolvedValue({ id: 'ch-1' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        LearningPathService,
        SlugService,
        { provide: PathPrerequisitePolicy, useValue: mockPrerequisitePolicy },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(LearningPathService);
  });

  it('tạo lộ trình: sinh slug tiếng Việt, mặc định không tuần tự, thứ tự 0', async () => {
    await service.createPath({
      title: ' Đại Việt thời Trần ',
      pathType: LearningPathType.CHRONOLOGICAL,
    });

    expect(prisma.learningPath.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Đại Việt thời Trần',
          slug: 'dai-viet-thoi-tran',
          isSequential: false,
          displayOrder: 0,
        }),
      }),
    );
  });

  describe('chương', () => {
    it('tạo chương trong lộ trình không tồn tại → 404', async () => {
      prisma.learningPath.findUnique.mockResolvedValue(null);

      await expect(
        service.createChapter({
          learningPathId: 'khong-co',
          title: 'Chương 1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('không truyền thứ tự thì xếp sau chương cuối', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({ id: 'path-1' });
      prisma.chapter.findFirst.mockResolvedValue({ displayOrder: 3 });

      await service.createChapter({
        learningPathId: 'path-1',
        title: 'Chương 4',
      });

      expect(prisma.chapter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayOrder: 4, slug: 'chuong-4' }),
        }),
      );
    });

    it('xoá chương không tồn tại → 404', async () => {
      prisma.chapter.findUnique.mockResolvedValue(null);

      await expect(service.deleteChapter('khong-co')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('gom bài vào chương', () => {
    it('xếp bài mới tiếp sau bài cuối, ghi tất cả trong 1 transaction', async () => {
      prisma.chapterLesson.findFirst.mockResolvedValue({ displayOrder: 2 });

      const result = await service.addLessonsToChapter('ch-1', ['l-a', 'l-b']);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(
        prisma.chapterLesson.upsert.mock.calls.map(
          ([arg]: [{ create: { lessonId: string; displayOrder: number } }]) => [
            arg.create.lessonId,
            arg.create.displayOrder,
          ],
        ),
      ).toEqual([
        ['l-a', 3],
        ['l-b', 4],
      ]);
      expect(result.count).toBe(2);
    });

    it('bài đã có trong chương thì giữ nguyên (upsert không cập nhật)', async () => {
      prisma.chapterLesson.findFirst.mockResolvedValue(null);

      await service.addLessonsToChapter('ch-1', ['l-a']);

      expect(prisma.chapterLesson.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { chapterId_lessonId: { chapterId: 'ch-1', lessonId: 'l-a' } },
          update: {},
        }),
      );
    });

    it('danh sách rỗng → 400', async () => {
      await expect(service.addLessonsToChapter('ch-1', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('gỡ bài không nằm trong chương → 404', async () => {
      prisma.chapterLesson.findUnique.mockResolvedValue(null);

      await expect(
        service.removeLessonFromChapter('ch-1', 'l-x'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.chapterLesson.delete).not.toHaveBeenCalled();
    });

    it('sắp xếp lại chỉ đụng bài thuộc đúng chương, trong 1 transaction', async () => {
      await service.reorderChapterLessons('ch-1', {
        items: [
          { lessonId: 'l-a', displayOrder: 2 },
          { lessonId: 'l-b', displayOrder: 1 },
        ],
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.chapterLesson.updateMany).toHaveBeenCalledWith({
        where: { chapterId: 'ch-1', lessonId: 'l-a' },
        data: { displayOrder: 2 },
      });
    });

    it('gỡ bài thuộc chương thành công và chặn reorder khi chương không tồn tại', async () => {
      prisma.chapterLesson.findUnique.mockResolvedValueOnce({
        chapterId: 'ch-1',
        lessonId: 'l-a',
      });
      await expect(
        service.removeLessonFromChapter('ch-1', 'l-a'),
      ).resolves.toMatchObject({ success: true });
      expect(prisma.chapterLesson.delete).toHaveBeenCalled();

      prisma.chapter.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.reorderChapterLessons('missing-ch', { items: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('truy vấn, cập nhật & xoá lộ trình/chương', () => {
    it('findAllPaths & findPathById trả về danh sách hoặc báo 404', async () => {
      prisma.learningPath.findMany.mockResolvedValueOnce([{ id: 'path-1' }]);
      await expect(service.findAllPaths()).resolves.toEqual([{ id: 'path-1' }]);

      prisma.learningPath.findUnique.mockResolvedValueOnce(null);
      await expect(service.findPathById('missing')).rejects.toThrow(
        NotFoundException,
      );

      prisma.learningPath.findUnique.mockResolvedValueOnce({ id: 'path-1' });
      await expect(service.findPathById('path-1')).resolves.toEqual({
        id: 'path-1',
      });
    });

    it('updatePath, deletePath & updateChapter hoạt động đúng cả ca hợp lệ lẫn 404', async () => {
      prisma.learningPath.findUnique.mockResolvedValueOnce({ id: 'path-1' });
      prisma.learningPath.update.mockResolvedValueOnce({
        id: 'path-1',
        title: 'Lộ trình mới',
      });
      await expect(
        service.updatePath('path-1', { title: ' Lộ trình mới ' }),
      ).resolves.toMatchObject({ title: 'Lộ trình mới' });

      prisma.learningPath.findUnique.mockResolvedValueOnce({ id: 'path-1' });
      await expect(service.deletePath('path-1')).resolves.toMatchObject({
        success: true,
      });

      prisma.chapter.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.updateChapter('missing-ch', { title: 'Mới' }),
      ).rejects.toThrow(NotFoundException);

      prisma.chapter.findUnique.mockResolvedValueOnce({ id: 'ch-1' });
      prisma.chapter.update.mockResolvedValueOnce({
        id: 'ch-1',
        title: 'Chương mới',
      });
      await expect(
        service.updateChapter('ch-1', { title: ' Chương mới ' }),
      ).resolves.toMatchObject({ title: 'Chương mới' });
    });
  });

  describe('đề kiểm tra chương (setChapterQuizzes)', () => {
    it('đồng bộ nhiều đề kiểm tra theo đúng thứ tự, khử trùng quizId trong 1 transaction', async () => {
      prisma.chapter.findUnique.mockResolvedValueOnce({ id: 'ch-1' });
      prisma.quiz.findMany.mockResolvedValueOnce([
        { id: 'quiz-1' },
        { id: 'quiz-2' },
      ]);

      const res = await service.setChapterQuizzes('ch-1', [
        { quizId: 'quiz-1', passScore: 75, isRequired: true },
        { quizId: 'quiz-1', passScore: 90, isRequired: false },
        { quizId: 'quiz-2', passScore: null, isRequired: false },
      ]);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.chapterQuiz.deleteMany).toHaveBeenCalledWith({
        where: { chapterId: 'ch-1' },
      });
      expect(res.count).toBe(2);
      expect(res.items).toEqual([
        expect.objectContaining({
          quizId: 'quiz-1',
          displayOrder: 1,
          passScore: 75,
          isRequired: true,
        }),
        expect.objectContaining({
          quizId: 'quiz-2',
          displayOrder: 2,
          passScore: null,
          isRequired: false,
        }),
      ]);
    });

    it('báo 404 khi quizId không tồn tại trong ngân hàng đề', async () => {
      prisma.chapter.findUnique.mockResolvedValueOnce({ id: 'ch-1' });
      prisma.quiz.findMany.mockResolvedValueOnce([{ id: 'quiz-1' }]);

      await expect(
        service.setChapterQuizzes('ch-1', [
          { quizId: 'quiz-1' },
          { quizId: 'quiz-ghost' },
        ]),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.chapterQuiz.deleteMany).not.toHaveBeenCalled();
    });
  });
});
