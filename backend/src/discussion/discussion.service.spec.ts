import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DiscussionService } from './discussion.service';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { DiscussionTargetType, UserRole } from '@prisma/client';

describe('DiscussionService', () => {
  let service: DiscussionService;

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const mockPrisma = {
    discussionThread: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    discussionReply: {
      create: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn().mockResolvedValue({ slug: 'bai-hoc-mau' }),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<DiscussionService>(DiscussionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('tạo câu hỏi thắc mắc mới thành công', async () => {
      const dto = {
        targetType: DiscussionTargetType.LESSON,
        targetId: 'lesson-uuid',
        title: 'Hỏi về chiến thắng Bạch Đằng',
        content: 'Cho em hỏi thời gian cụ thể',
      };
      mockPrisma.discussionThread.create.mockResolvedValue({
        id: 'thread-1',
        ...dto,
      });

      const result = await service.create('user-1', dto);
      expect(result.id).toBe('thread-1');
      expect(mockPrisma.discussionThread.create).toHaveBeenCalled();
    });
  });

  describe('createReply', () => {
    it('BTV/Admin trả lời sẽ được gắn isOfficial = true và isAnswered = true', async () => {
      mockPrisma.discussionThread.findUnique.mockResolvedValue({
        id: 'thread-1',
        title: 'Hỏi',
        userId: 'learner-1',
        targetType: DiscussionTargetType.LESSON,
        targetId: 'lesson-1',
      });
      mockPrisma.discussionReply.create.mockResolvedValue({
        id: 'reply-1',
        content: 'Trả lời từ Admin',
        isOfficial: true,
      });

      const result = await service.createReply(
        'admin-1',
        UserRole.ADMIN,
        'thread-1',
        {
          content: 'Trả lời từ Admin',
        },
      );

      expect(result.isOfficial).toBe(true);
      expect(mockPrisma.discussionThread.update).toHaveBeenCalledWith({
        where: { id: 'thread-1' },
        data: { isAnswered: true },
      });
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        'learner-1',
        expect.anything(),
        expect.any(String),
        'Trả lời từ Admin',
        '/bai-hoc/bai-hoc-mau',
      );
    });

    it('nội dung gốc đã bị xoá thì thông báo không kèm link', async () => {
      mockPrisma.discussionThread.findUnique.mockResolvedValue({
        id: 'thread-3',
        title: 'Hỏi',
        userId: 'learner-1',
        targetType: DiscussionTargetType.LESSON,
        targetId: 'lesson-da-xoa',
      });
      mockPrisma.lesson.findUnique.mockResolvedValueOnce(null);
      mockPrisma.discussionReply.create.mockResolvedValue({
        id: 'reply-4',
        content: 'Trả lời',
        isOfficial: true,
      });

      await service.createReply('admin-1', UserRole.ADMIN, 'thread-3', {
        content: 'Trả lời',
      });

      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        'learner-1',
        expect.anything(),
        expect.any(String),
        'Trả lời',
        undefined,
      );
    });

    it('Học viên bình thường trả lời thì isOfficial = false', async () => {
      mockPrisma.discussionThread.findUnique.mockResolvedValue({
        id: 'thread-1',
        title: 'Hỏi',
      });
      mockPrisma.discussionReply.create.mockResolvedValue({
        id: 'reply-2',
        content: 'Ý kiến bạn học',
        isOfficial: false,
      });

      const result = await service.createReply(
        'user-2',
        UserRole.USER,
        'thread-1',
        {
          content: 'Ý kiến bạn học',
        },
      );

      expect(result.isOfficial).toBe(false);
      expect(mockPrisma.discussionThread.update).not.toHaveBeenCalled();
    });

    it('người hỏi tự trả lời chính câu hỏi của mình thì không gửi thông báo', async () => {
      mockPrisma.discussionThread.findUnique.mockResolvedValue({
        id: 'thread-1',
        title: 'Hỏi',
        userId: 'user-1',
        targetType: DiscussionTargetType.LESSON,
        targetId: 'lesson-1',
      });
      mockPrisma.discussionReply.create.mockResolvedValue({
        id: 'reply-5',
        content: 'Tự trả lời',
        isOfficial: false,
      });

      await service.createReply('user-1', UserRole.USER, 'thread-1', {
        content: 'Tự trả lời',
      });

      expect(mockNotificationService.notify).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('lọc theo targetType/targetId/isAnswered/search và trả kèm phân trang', async () => {
      mockPrisma.discussionThread.findMany.mockResolvedValue([
        { id: 'thread-1' },
      ]);
      mockPrisma.discussionThread.count.mockResolvedValue(1);

      const res = await service.findAll({
        page: 1,
        limit: 20,
        targetType: DiscussionTargetType.LESSON,
        targetId: 'lesson-1',
        isAnswered: true,
        search: 'Bạch Đằng',
      } as any);

      expect(mockPrisma.discussionThread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            targetType: DiscussionTargetType.LESSON,
            targetId: 'lesson-1',
            isAnswered: true,
            OR: expect.any(Array),
          }),
          skip: 0,
          take: 20,
        }),
      );
      expect(res).toEqual({
        items: [{ id: 'thread-1' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('không truyền bộ lọc nào thì where rỗng, vẫn phân trang đúng', async () => {
      mockPrisma.discussionThread.findMany.mockResolvedValue([]);
      mockPrisma.discussionThread.count.mockResolvedValue(0);

      const res = await service.findAll({ page: 2, limit: 10 } as any);

      expect(mockPrisma.discussionThread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 10, take: 10 }),
      );
      expect(res.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('báo NotFoundException khi không tìm thấy chủ đề', async () => {
      mockPrisma.discussionThread.findUnique.mockResolvedValue(null);

      await expect(service.findOne('thread-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('chủ sở hữu xoá được chủ đề của chính mình', async () => {
      mockPrisma.discussionThread.findUnique.mockResolvedValue({
        id: 'thread-1',
        userId: 'user-1',
      });

      const res = await service.remove('user-1', UserRole.USER, 'thread-1');

      expect(mockPrisma.discussionThread.delete).toHaveBeenCalledWith({
        where: { id: 'thread-1' },
      });
      expect(res).toEqual({ success: true });
    });

    it('BTV/Admin xoá được chủ đề của người khác', async () => {
      mockPrisma.discussionThread.findUnique.mockResolvedValue({
        id: 'thread-1',
        userId: 'learner-1',
      });

      const res = await service.remove('admin-1', UserRole.ADMIN, 'thread-1');

      expect(mockPrisma.discussionThread.delete).toHaveBeenCalledWith({
        where: { id: 'thread-1' },
      });
      expect(res).toEqual({ success: true });
    });

    it('người dùng thường không được xoá chủ đề của người khác (403)', async () => {
      mockPrisma.discussionThread.findUnique.mockResolvedValue({
        id: 'thread-1',
        userId: 'learner-1',
      });

      await expect(
        service.remove('user-2', UserRole.USER, 'thread-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.discussionThread.delete).not.toHaveBeenCalled();
    });
  });
});
