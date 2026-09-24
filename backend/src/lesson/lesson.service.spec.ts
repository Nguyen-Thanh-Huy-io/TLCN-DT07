import { Test, TestingModule } from '@nestjs/testing';
import { LessonService } from './lesson.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentStatus, DifficultyLevel } from '@prisma/client';

describe('LessonService', () => {
  let service: LessonService;
  let prisma: PrismaService;

  const mockTopic = {
    id: 'topic-uuid-1',
    periodId: 'period-uuid-1',
    name: 'Khởi nghĩa Hai Bà Trưng',
  };

  const mockLesson = {
    id: 'lesson-uuid-1',
    topicId: 'topic-uuid-1',
    title: 'Chiến thắng Bạch Đằng năm 938',
    contentRichText: '<p>Năm 938 Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng</p>',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    difficulty: DifficultyLevel.MEDIUM,
    sourceReferenceNote: 'Đại Việt Sử Ký',
    displayOrder: 1,
    status: ContentStatus.DRAFT,
    rejectionReason: null,
    publishedAt: null,
    createdBy: 'user-uuid-creator',
    approvedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    topic: {
      findUnique: jest.fn().mockResolvedValue(mockTopic),
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
    set: jest.fn().mockResolvedValue('OK'),
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
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create lesson successfully when topic exists', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValueOnce(mockTopic);
      const dto = {
        topicId: 'topic-uuid-1',
        title: 'Chiến thắng Bạch Đằng năm 938',
      };

      const result = await service.create(dto, 'user-uuid-creator');
      expect(result.id).toBe('lesson-uuid-1');
      expect(result.estimatedReadMinutes).toBe(1);
    });

    it('should throw NotFoundException if topic does not exist', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValueOnce(null);
      const dto = {
        topicId: 'non-existent-topic',
        title: 'Bài học lỗi',
      };

      await expect(service.create(dto, 'user-uuid-creator')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('review', () => {
    it('should publish lesson when status is PUBLISHED', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.lesson.findUnique.mockResolvedValueOnce(mockLesson);
      mockPrismaService.lesson.update.mockResolvedValueOnce({
        ...mockLesson,
        status: ContentStatus.PUBLISHED,
        approvedBy: 'admin-uuid-1',
      });

      const result = await service.review(
        'lesson-uuid-1',
        { status: ContentStatus.PUBLISHED },
        'admin-uuid-1',
      );

      expect(result.status).toBe(ContentStatus.PUBLISHED);
      expect(mockPrismaService.lesson.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if REJECTED without rejectionReason', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.lesson.findUnique.mockResolvedValueOnce(mockLesson);

      await expect(
        service.review(
          'lesson-uuid-1',
          { status: ContentStatus.REJECTED },
          'admin-uuid-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete lesson successfully', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.lesson.findUnique.mockResolvedValueOnce(mockLesson);
      mockPrismaService.lesson.delete.mockResolvedValueOnce(mockLesson);

      const result = await service.remove('lesson-uuid-1');
      expect(result.success).toBe(true);
    });
  });
});
