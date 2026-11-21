import { Test } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const prisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const gateway = {
    emitNewNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: gateway },
      ],
    }).compile();

    service = moduleRef.get(NotificationService);
  });

  it('getUserNotifications trả về danh sách thông báo và số lượng chưa đọc', async () => {
    const items = [{ id: 'n-1', title: 'Mới' }];
    prisma.notification.findMany.mockResolvedValue(items);
    prisma.notification.count.mockResolvedValue(3);

    const res = await service.getUserNotifications('u-1', 15);
    expect(res).toEqual({ items, unreadCount: 3 });
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'u-1' },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
  });

  it('markAsRead đánh dấu từng thông báo khi truyền id hoặc toàn bộ khi bỏ trống id', async () => {
    await expect(service.markAsRead('u-1', 'n-1')).resolves.toEqual({
      success: true,
    });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'n-1', userId: 'u-1' },
      data: { isRead: true },
    });

    await expect(service.markAsRead('u-1')).resolves.toEqual({ success: true });
    expect(prisma.notification.updateMany).toHaveBeenLastCalledWith({
      where: { userId: 'u-1', isRead: false },
      data: { isRead: true },
    });
  });

  it('notify lưu thông báo, phát realtime qua gateway và nuốt lỗi nếu gateway lỗi', async () => {
    const created = { id: 'n-2', userId: 'u-1', title: 'Theo dõi mới' };
    prisma.notification.create.mockResolvedValue(created);

    const res = await service.notify(
      'u-1',
      NotificationType.NEW_FOLLOWER,
      'Theo dõi mới',
      'Nội dung',
      '/cong-dong',
    );
    expect(res).toEqual(created);
    expect(gateway.emitNewNotification).toHaveBeenCalledWith('u-1', created);

    gateway.emitNewNotification.mockImplementationOnce(() => {
      throw new Error('socket disconnected');
    });
    await expect(
      service.notify(
        'u-1',
        NotificationType.CONTENT_APPROVED,
        'Duyệt bài',
        'OK',
      ),
    ).resolves.toEqual(created);
  });
});
