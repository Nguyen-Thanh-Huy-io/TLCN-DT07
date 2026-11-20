import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LearningPathType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { LearningPathService } from './learning-path.service';

describe('LearningPathService', () => {
  let service: LearningPathService;
  const prisma = {
    learningPath: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(({ data }: { data: object }) => ({
        id: 'path-1',
        ...data,
      })),
      findUnique: jest.fn(),
    },
    chapter: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(({ data }: { data: object }) => ({
        id: 'ch-1',
        ...data,
      })),
      delete: jest.fn(),
    },
    chapterLesson: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(({ create }: { create: object }) => create),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.chapter.findUnique.mockResolvedValue({ id: 'ch-1' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        LearningPathService,
        SlugService,
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
  });
});
