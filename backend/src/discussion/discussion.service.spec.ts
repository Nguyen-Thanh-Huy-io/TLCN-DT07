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
  });
});
