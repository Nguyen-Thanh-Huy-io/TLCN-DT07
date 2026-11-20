import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { LessonService } from '../lesson/lesson.service';
import { LEARNER_ERROR_CODES } from './learner.constant';
import { LearnerService } from './learner.service';

describe('LearnerService', () => {
  let service: LearnerService;
  const prisma = {
    learningPath: { findFirst: jest.fn(), findMany: jest.fn() },
    learningPathEnrollment: {
      findMany: jest.fn().mockResolvedValue([{ learningPathId: 'path-1' }]),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    lessonProgress: {
      findMany: jest.fn().mockResolvedValue([{ lessonId: 'lesson-1' }]),
      upsert: jest.fn(),
    },
    lesson: { findFirst: jest.fn() },
  };
  const lessonService = { findBySlug: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    lessonService.findBySlug.mockResolvedValue({
      id: 'lesson-1',
      status: ContentStatus.PUBLISHED,
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        LearnerService,
        { provide: PrismaService, useValue: prisma },
        { provide: LessonService, useValue: lessonService },
      ],
    }).compile();
    service = moduleRef.get(LearnerService);
  });

  describe('enroll', () => {
    it('chỉ đăng ký được lộ trình đã xuất bản', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(null);

      await expect(service.enroll('u-1', 'path-nhap')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.learningPath.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'path-nhap', status: ContentStatus.PUBLISHED },
        }),
      );
      expect(prisma.learningPathEnrollment.upsert).not.toHaveBeenCalled();
    });

    it('đăng ký dùng upsert (gọi lại không tạo bản ghi trùng) và trả tiến độ', async () => {
      prisma.learningPath.findFirst.mockResolvedValue({ id: 'path-1' });

      const result = await service.enroll('u-1', 'path-1');

      expect(prisma.learningPathEnrollment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_learningPathId: { userId: 'u-1', learningPathId: 'path-1' },
          },
          update: {},
        }),
      );
      expect(result).toEqual({
        enrolledPathIds: ['path-1'],
        completedLessonIds: ['lesson-1'],
      });
    });
  });

  describe('getLessonForReading', () => {
    it('bài thuộc lộ trình mà chưa đăng ký → 403 NOT_ENROLLED kèm id lộ trình', async () => {
      prisma.learningPath.findMany.mockResolvedValue([
        { id: 'path-1', enrollments: [] },
      ]);

      const error = await service
        .getLessonForReading('u-1', 'bai-1')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: LEARNER_ERROR_CODES.NOT_ENROLLED,
        learningPathIds: ['path-1'],
      });
    });

    it('đã đăng ký 1 trong các lộ trình chứa bài thì đọc được', async () => {
      prisma.learningPath.findMany.mockResolvedValue([
        { id: 'path-1', enrollments: [] },
        { id: 'path-2', enrollments: [{ id: 'e-1' }] },
      ]);

      const result = await service.getLessonForReading('u-1', 'bai-1');

      expect(result.lesson.id).toBe('lesson-1');
    });

    it('bài chỉ có trong thư viện (không thuộc lộ trình nào) thì đăng nhập là đọc được', async () => {
      prisma.learningPath.findMany.mockResolvedValue([]);

      await expect(
        service.getLessonForReading('u-1', 'bai-1'),
      ).resolves.toBeDefined();
    });

    it('bài chưa xuất bản → 404, không lộ nội dung nháp', async () => {
      lessonService.findBySlug.mockResolvedValue({
        id: 'lesson-1',
        status: ContentStatus.DRAFT,
      });

      await expect(service.getLessonForReading('u-1', 'bai-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.learningPath.findMany).not.toHaveBeenCalled();
    });
  });

  describe('completeLesson', () => {
    it('bài không tồn tại hoặc chưa xuất bản → 404', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.completeLesson('u-1', 'khong-co')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.lessonProgress.upsert).not.toHaveBeenCalled();
    });

    it('đánh dấu hoàn thành bằng upsert', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'lesson-1' });

      await service.completeLesson('u-1', 'lesson-1');

      expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_lessonId: { userId: 'u-1', lessonId: 'lesson-1' } },
        }),
      );
    });
  });

  it('huỷ đăng ký chỉ xoá bản ghi của chính người học', async () => {
    await service.unenroll('u-1', 'path-1');

    expect(prisma.learningPathEnrollment.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-1', learningPathId: 'path-1' },
    });
  });
});
