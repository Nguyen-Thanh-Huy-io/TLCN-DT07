import { Test, TestingModule } from '@nestjs/testing';
import { LessonService } from './lesson.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LessonStatus, DifficultyLevel } from '@prisma/client';

describe('LessonService', () => {
  let service: LessonService;

  const mockLesson = {
    id: 'lesson-uuid-1',
    title: 'Chiến thắng Bạch Đằng năm 938',
    slug: 'chien-thang-bach-dang-nam-938',
    description: 'Tóm tắt trận Bạch Đằng',
    content: '<p>Năm 938 Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng</p>',
    contentRichText:
      '<p>Năm 938 Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng</p>',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    difficulty: DifficultyLevel.MEDIUM,
    sourceReferenceNote: 'Đại Việt Sử Ký',
    displayOrder: 1,
    status: LessonStatus.DRAFT,
    rejectionReason: null,
    publishedAt: null,
    createdBy: 'user-uuid-creator',
    approvedBy: null,
    lessonTags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    authUser: {
      findUnique: jest.fn().mockResolvedValue({ id: 'admin-uuid-1' }),
    },
    lesson: {
      create: jest.fn().mockResolvedValue(mockLesson),
      findMany: jest.fn().mockResolvedValue([mockLesson]),
      findUnique: jest.fn().mockResolvedValue(mockLesson),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue(mockLesson),
      delete: jest.fn().mockResolvedValue(mockLesson),
    },
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(1),
    deleteByPattern: jest.fn().mockResolvedValue(1),
  };

  const mockCustomLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CustomLoggerService, useValue: mockCustomLogger },
      ],
    }).compile();

    service = module.get<LessonService>(LessonService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create lesson successfully without topic dependency', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValueOnce(null);
      const dto = {
        title: 'Chiến thắng Bạch Đằng năm 938',
      };

      const result = await service.create(dto, 'user-uuid-creator');
      expect(result.id).toBe('lesson-uuid-1');
      expect(result.estimatedReadMinutes).toBe(1);
      expect(mockPrismaService.lesson.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should fall back to DB query if Redis returns corrupted string', async () => {
      mockRedisService.get.mockResolvedValueOnce('{corrupted-json');
      mockPrismaService.lesson.findMany.mockResolvedValueOnce([mockLesson]);
      mockPrismaService.lesson.count.mockResolvedValueOnce(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(mockPrismaService.lesson.findMany).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update lesson fields and invalidate cache', async () => {
      mockPrismaService.lesson.findUnique
        .mockResolvedValueOnce(mockLesson)
        .mockResolvedValueOnce(null);
      mockPrismaService.lesson.update.mockResolvedValueOnce({
        ...mockLesson,
        title: 'Bài học cập nhật',
      });

      const result = await service.update('lesson-uuid-1', {
        title: 'Bài học cập nhật',
      });

      expect(result.title).toBe('Bài học cập nhật');
      expect(mockPrismaService.lesson.update).toHaveBeenCalled();
    });
  });

  describe('review', () => {
    it('should publish lesson when status is PUBLISHED', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValueOnce(mockLesson);
      mockPrismaService.lesson.update.mockResolvedValueOnce({
        ...mockLesson,
        status: LessonStatus.PUBLISHED,
        approvedBy: 'admin-uuid-1',
      });

      const result = await service.review(
        'lesson-uuid-1',
        { status: LessonStatus.PUBLISHED },
        'admin-uuid-1',
      );

      expect(result.status).toBe(LessonStatus.PUBLISHED);
      expect(mockPrismaService.lesson.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if REJECTED without rejectionReason', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValueOnce(mockLesson);

      await expect(
        service.review(
          'lesson-uuid-1',
          { status: LessonStatus.REJECTED },
          'admin-uuid-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should persist REJECTED status and rejectionReason when valid reason provided', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValueOnce(mockLesson);
      mockPrismaService.lesson.update.mockResolvedValueOnce({
        ...mockLesson,
        status: LessonStatus.REJECTED,
        rejectionReason: 'Thiếu nguồn sử liệu',
      });

      const result = await service.review(
        'lesson-uuid-1',
        {
          status: LessonStatus.REJECTED,
          rejectionReason: 'Thiếu nguồn sử liệu',
        },
        'admin-uuid-1',
      );

      expect(result.status).toBe(LessonStatus.REJECTED);
      expect(result.rejectionReason).toBe('Thiếu nguồn sử liệu');
      expect(mockPrismaService.lesson.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: LessonStatus.REJECTED,
            rejectionReason: 'Thiếu nguồn sử liệu',
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete lesson successfully', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValueOnce(mockLesson);
      mockPrismaService.lesson.delete.mockResolvedValueOnce(mockLesson);

      const result = await service.remove('lesson-uuid-1');
      expect(result.message).toBeDefined();
    });
  });
});
