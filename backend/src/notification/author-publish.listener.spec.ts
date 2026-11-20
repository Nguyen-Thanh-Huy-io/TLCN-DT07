import { Test } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { AuthorPublishedContentType } from '../common/constants/follow-events.constant';
import { PrismaService } from '../common/services/prisma.service';
import { AuthorPublishListener } from './author-publish.listener';
import { NotificationService } from './notification.service';

describe('AuthorPublishListener — thông báo cho người theo dõi khi xuất bản nội dung', () => {
  let listener: AuthorPublishListener;

  const prisma = {
    userFollow: { findMany: jest.fn() },
    authUser: { findMany: jest.fn() },
  };
  const notificationService = { notify: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthorPublishListener,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    listener = moduleRef.get(AuthorPublishListener);
  });

  it('gửi thông báo tới từng follower (trừ chính tác giả) khi xuất bản Bài viết', async () => {
    prisma.userFollow.findMany.mockResolvedValue([
      { followerId: 'follower-1' },
      { followerId: 'follower-2' },
      { followerId: 'author-1' },
    ]);
    prisma.authUser.findMany.mockResolvedValue([
      {
        id: 'author-1',
        username: 'su_gia',
        userProfile: { firstName: 'An', lastName: 'Nguyễn' },
      },
    ]);

    await listener.handleAuthorContentPublished({
      authorId: 'author-1',
      contentType: AuthorPublishedContentType.ARTICLE,
      title: 'Chiến thắng Ngọc Hồi - Đống Đa',
      slug: 'chien-thang-ngoc-hoi-dong-da',
    });

    expect(notificationService.notify).toHaveBeenCalledTimes(2);
    expect(notificationService.notify).toHaveBeenCalledWith(
      'follower-1',
      NotificationType.CONTENT_APPROVED,
      'Nguyễn An vừa đăng bài viết lịch sử mới',
      '"Chiến thắng Ngọc Hồi - Đống Đa" đã được xuất bản. Nhấn để đọc ngay.',
      '/bai-viet/chien-thang-ngoc-hoi-dong-da',
    );
    expect(notificationService.notify).toHaveBeenCalledWith(
      'follower-2',
      NotificationType.CONTENT_APPROVED,
      'Nguyễn An vừa đăng bài viết lịch sử mới',
      '"Chiến thắng Ngọc Hồi - Đống Đa" đã được xuất bản. Nhấn để đọc ngay.',
      '/bai-viet/chien-thang-ngoc-hoi-dong-da',
    );
  });

  it('dùng đúng đường dẫn /bai-hoc/<slug> cho Bài học và bỏ qua khi chưa có follower', async () => {
    prisma.userFollow.findMany.mockResolvedValue([]);

    await listener.handleAuthorContentPublished({
      authorId: 'author-1',
      contentType: AuthorPublishedContentType.LESSON,
      title: 'Nhà Trần chống Nguyên Mông',
      slug: 'nha-tran-chong-nguyen-mong',
    });

    expect(notificationService.notify).not.toHaveBeenCalled();

    prisma.userFollow.findMany.mockResolvedValue([{ followerId: 'u-2' }]);
    prisma.authUser.findMany.mockResolvedValue([
      { id: 'author-1', username: 'su_gia', userProfile: null },
    ]);

    await listener.handleAuthorContentPublished({
      authorId: 'author-1',
      contentType: AuthorPublishedContentType.LESSON,
      title: 'Nhà Trần chống Nguyên Mông',
      slug: 'nha-tran-chong-nguyen-mong',
    });

    expect(notificationService.notify).toHaveBeenCalledWith(
      'u-2',
      NotificationType.CONTENT_APPROVED,
      'su_gia vừa đăng bài học mới',
      expect.any(String),
      '/bai-hoc/nha-tran-chong-nguyen-mong',
    );
  });
});
