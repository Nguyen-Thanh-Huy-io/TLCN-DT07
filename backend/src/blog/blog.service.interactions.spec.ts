import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ContentStatus,
  NotificationType,
  PostCommentStatus,
  PostType,
  ReportSource,
  ReportTargetType,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ModerationService } from '../moderation/moderation.service';
import { NotificationService } from '../notification/notification.service';
import { BlogGateway } from './blog.gateway';
import { BlogService } from './blog.service';
import { BLOG_REVIEW_DEFAULT_LIMIT } from './dto/blog-post.dto';

const AUTHOR = 'author-1';
const READER = 'reader-1';

const flushBackgroundTasks = () => new Promise((r) => setImmediate(r));

const feedPost = (id: string, overrides: object = {}) => ({
  id,
  title: `Bài ${id}`,
  slug: id,
  postType: PostType.QUICK_POST,
  status: ContentStatus.PUBLISHED,
  likeCount: 0,
  commentCount: 0,
  viewCount: 0,
  publishedAt: new Date(),
  createdAt: new Date(),
  author: { id: AUTHOR, username: 'tac-gia' },
  ...overrides,
});

const storedComment = (overrides: object = {}) => ({
  id: 'c-1',
  postId: 'post-1',
  authorId: READER,
  parentId: null,
  content: 'Hay quá',
  likeCount: 0,
  author: { id: READER, username: 'doc-gia' },
  replies: [],
  ...overrides,
});

describe('BlogService — tương tác cộng đồng', () => {
  let service: BlogService;
  const prisma = {
    blogPost: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    authUser: { findUnique: jest.fn(), findFirst: jest.fn() },
    blogPostComment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    postCommentLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    postLike: { findMany: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
    postBookmark: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    contentReport: { findFirst: jest.fn(), create: jest.fn() },
    userFollow: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const gateway = {
    emitCommentAdded: jest.fn(),
    emitCommentUpdated: jest.fn(),
    emitLikeUpdated: jest.fn(),
    emitModerationEvent: jest.fn(),
    emitFollowUpdated: jest.fn(),
  };
  const notifications = { notify: jest.fn() };
  const redis = { setNX: jest.fn() };
  const moderation = { enqueueScan: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    prisma.blogPost.findUnique.mockResolvedValue({
      id: 'post-1',
      authorId: AUTHOR,
      title: 'Chiến thắng Bạch Đằng',
      slug: 'bach-dang',
    });
    prisma.authUser.findUnique.mockResolvedValue({
      id: READER,
      username: 'doc-gia',
    });
    prisma.postLike.findMany.mockResolvedValue([]);
    prisma.postBookmark.findMany.mockResolvedValue([]);
    prisma.blogPostComment.findMany.mockResolvedValue([]);
    prisma.userFollow.findMany.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: PrismaService, useValue: prisma },
        { provide: BlogGateway, useValue: gateway },
        { provide: NotificationService, useValue: notifications },
        { provide: RedisService, useValue: redis },
        { provide: ModerationService, useValue: moderation },
      ],
    }).compile();
    service = moduleRef.get(BlogService);
  });

  describe('listPosts — bảng tin', () => {
    it('bảng tin công khai chỉ lấy bài đã xuất bản', async () => {
      prisma.blogPost.findMany.mockResolvedValue([]);

      await service.listPosts(READER);

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ContentStatus.PUBLISHED },
        }),
      );
    });

    it('lọc theo loại bài', async () => {
      prisma.blogPost.findMany.mockResolvedValue([]);

      await service.listPosts(undefined, { type: PostType.LONG_FORM });

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: ContentStatus.PUBLISHED,
            postType: PostType.LONG_FORM,
          },
        }),
      );
    });

    it('"đang theo dõi" khi chưa đăng nhập hoặc chưa theo dõi ai → rỗng, không truy vấn bài', async () => {
      await expect(
        service.listPosts(undefined, { followingOnly: 'true' }),
      ).resolves.toEqual([]);
      await expect(
        service.listPosts(READER, { followingOnly: 'true' }),
      ).resolves.toEqual([]);
      expect(prisma.blogPost.findMany).not.toHaveBeenCalled();
    });

    it('"đang theo dõi" chỉ lấy bài của người đã theo dõi', async () => {
      prisma.userFollow.findMany.mockResolvedValue([{ followingId: AUTHOR }]);
      prisma.blogPost.findMany.mockResolvedValue([]);

      await service.listPosts(READER, { followingOnly: 'true' });

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: ContentStatus.PUBLISHED,
            authorId: { in: [AUTHOR] },
          },
        }),
      );
    });

    it('phân trang theo con trỏ: lấy các bài sau con trỏ', async () => {
      prisma.blogPost.findMany.mockResolvedValue([
        feedPost('p1'),
        feedPost('p2'),
        feedPost('p3'),
      ]);

      const page = await service.listPosts(undefined, {
        cursor: 'p1',
        limit: 1,
      });

      expect(page.map((p) => p.id)).toEqual(['p2']);
    });

    it('giới hạn mỗi trang tối đa 50 bài', async () => {
      prisma.blogPost.findMany.mockResolvedValue(
        Array.from({ length: 60 }, (_, i) => feedPost(`p${i}`)),
      );

      const page = await service.listPosts(undefined, { limit: 999 });

      expect(page).toHaveLength(50);
    });

    it('xếp "thịnh hành" theo tương tác: bài nhiều bình luận lên trước', async () => {
      prisma.blogPost.findMany.mockResolvedValue([
        feedPost('it-tuong-tac'),
        feedPost('soi-noi', { commentCount: 20, likeCount: 10 }),
      ]);

      const page = await service.listPosts(undefined, { sort: 'trending' });

      expect(page.map((p) => p.id)).toEqual(['soi-noi', 'it-tuong-tac']);
    });

    it('gắn cờ đã thích / đã lưu / đang theo dõi tác giả và bình luận xem trước cho người xem', async () => {
      prisma.blogPost.findMany.mockResolvedValue([feedPost('p1')]);
      prisma.postLike.findMany.mockResolvedValue([{ postId: 'p1' }]);
      prisma.userFollow.findMany.mockResolvedValue([{ followingId: AUTHOR }]);
      prisma.blogPostComment.findMany.mockResolvedValue([
        {
          id: 'c-1',
          postId: 'p1',
          content: 'Mới nhất',
          createdAt: new Date(),
          author: { username: 'doc-gia' },
        },
      ]);

      const [post] = await service.listPosts(READER);

      expect(post).toMatchObject({
        likedByMe: true,
        bookmarkedByMe: false,
        author: { followedByMe: true },
        previewComment: { id: 'c-1', authorName: 'doc-gia' },
      });
    });
  });

  describe('xem bài theo slug', () => {
    const draft = feedPost('nhap', {
      status: ContentStatus.PENDING_REVIEW,
      authorId: AUTHOR,
    });

    it('bài không tồn tại → 404', async () => {
      prisma.blogPost.findFirst.mockResolvedValue(null);

      await expect(service.getPostBySlug('khong-co')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('bài chưa xuất bản: khách và người khác nhận 404', async () => {
      prisma.blogPost.findFirst.mockResolvedValue(draft);

      await expect(service.getPostBySlug('nhap')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPostBySlug('nhap', READER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('tác giả vẫn xem được bài chưa xuất bản của mình', async () => {
      prisma.blogPost.findFirst.mockResolvedValue(draft);

      await expect(
        service.getPostBySlug('nhap', AUTHOR),
      ).resolves.toMatchObject({
        id: 'nhap',
        status: ContentStatus.PENDING_REVIEW,
      });
    });
  });

  it('hàng đợi duyệt: mọi trạng thái hoặc lọc 1 trạng thái, giới hạn mặc định', async () => {
    prisma.blogPost.findMany.mockResolvedValue([]);

    await service.listPostsForReview({});
    await service.listPostsForReview({
      status: ContentStatus.PENDING_REVIEW,
      limit: 10,
    });

    expect(prisma.blogPost.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: {}, take: BLOG_REVIEW_DEFAULT_LIMIT }),
    );
    expect(prisma.blogPost.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { status: ContentStatus.PENDING_REVIEW },
        take: 10,
      }),
    );
  });

  describe('reviewPost — duyệt bài chuyên khảo', () => {
    const pendingPost = () =>
      prisma.blogPost.findUnique.mockResolvedValueOnce({
        id: 'post-1',
        status: ContentStatus.PENDING_REVIEW,
      });

    beforeEach(() => {
      prisma.blogPost.update.mockResolvedValue({
        id: 'post-1',
        authorId: AUTHOR,
        title: 'Bài dài',
        slug: 'bai-dai',
      });
    });

    it('bài không ở trạng thái chờ duyệt → 400', async () => {
      prisma.blogPost.findUnique.mockResolvedValueOnce({
        id: 'post-1',
        status: ContentStatus.DRAFT,
      });

      await expect(
        service.reviewPost('post-1', { status: ContentStatus.PUBLISHED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('bài không tồn tại → 404', async () => {
      prisma.blogPost.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.reviewPost('khong-co', { status: ContentStatus.PUBLISHED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('từ chối không kèm lý do → 400', async () => {
      pendingPost();

      await expect(
        service.reviewPost('post-1', {
          status: ContentStatus.REJECTED,
          rejectionReason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.blogPost.update).not.toHaveBeenCalled();
    });

    it('xuất bản: ghi thời điểm xuất bản và báo tác giả', async () => {
      pendingPost();

      await service.reviewPost('post-1', { status: ContentStatus.PUBLISHED });

      expect(prisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: ContentStatus.PUBLISHED,
            publishedAt: expect.any(Date),
          },
        }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        AUTHOR,
        NotificationType.CONTENT_APPROVED,
        expect.any(String),
        expect.any(String),
        '/blog/bai-dai',
      );
    });

    it('từ chối: báo tác giả kèm lý do; lỗi gửi thông báo không làm hỏng việc duyệt', async () => {
      pendingPost();
      notifications.notify.mockRejectedValueOnce(new Error('mất kết nối'));

      await expect(
        service.reviewPost('post-1', {
          status: ContentStatus.REJECTED,
          rejectionReason: 'Thiếu nguồn',
        }),
      ).resolves.toMatchObject({ id: 'post-1' });
      expect(notifications.notify).toHaveBeenCalledWith(
        AUTHOR,
        NotificationType.CONTENT_REJECTED,
        expect.any(String),
        expect.stringContaining('Thiếu nguồn'),
        '/blog/bai-dai',
      );
    });
  });

  describe('bình luận', () => {
    beforeEach(() => {
      prisma.blogPostComment.create.mockImplementation(
        ({ data }: { data: object }) => storedComment(data),
      );
    });

    it('bình luận của người khác: tăng đếm, phát realtime, đưa vào hàng quét AI, báo tác giả bài', async () => {
      await service.createComment('post-1', { content: '  Hay quá  ' }, READER);

      expect(prisma.blogPostComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            postId: 'post-1',
            authorId: READER,
            parentId: null,
            content: 'Hay quá',
            status: PostCommentStatus.VISIBLE,
          },
        }),
      );
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.blogPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { commentCount: { increment: 1 } },
      });
      expect(gateway.emitCommentAdded).toHaveBeenCalled();
      expect(moderation.enqueueScan).toHaveBeenCalledWith(
        ReportTargetType.COMMENT,
        'c-1',
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        AUTHOR,
        NotificationType.BLOG_COMMENT,
        expect.any(String),
        expect.any(String),
        '/blog/bach-dang',
      );
    });

    it('tác giả tự bình luận bài mình thì không tự báo cho mình', async () => {
      await service.createComment('post-1', { content: 'Bổ sung' }, AUTHOR);

      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('trả lời bình luận: báo người viết bình luận cha', async () => {
      prisma.blogPostComment.findFirst.mockResolvedValue({ id: 'c-cha' });
      prisma.blogPostComment.findUnique.mockResolvedValue({
        authorId: 'nguoi-hoi',
      });

      await service.createComment(
        'post-1',
        { content: 'Trả lời', parentId: 'c-cha' },
        READER,
      );

      expect(notifications.notify).toHaveBeenCalledWith(
        'nguoi-hoi',
        NotificationType.NEW_REPLY,
        expect.any(String),
        expect.any(String),
        '/blog/bach-dang',
      );
    });

    it('trả lời vào bình luận cha không có trong bài → 404', async () => {
      prisma.blogPostComment.findFirst.mockResolvedValue(null);

      await expect(
        service.createComment(
          'post-1',
          { content: 'Trả lời', parentId: 'c-khac-bai' },
          READER,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.blogPostComment.create).not.toHaveBeenCalled();
    });

    it('bình luận vào bài không tồn tại → 404', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment('khong-co', { content: 'X' }, READER),
      ).rejects.toThrow(NotFoundException);
    });

    it('người dùng không còn tồn tại → 404', async () => {
      prisma.authUser.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment('post-1', { content: 'X' }, 'da-xoa'),
      ).rejects.toThrow(NotFoundException);
    });

    it('tác giả sửa bình luận: cập nhật nội dung và quét AI lại', async () => {
      prisma.blogPostComment.findFirst.mockResolvedValue(storedComment());
      prisma.blogPostComment.update.mockResolvedValue(
        storedComment({ content: 'Đã sửa' }),
      );

      const result = await service.updateComment('post-1', 'c-1', READER, {
        content: ' Đã sửa ',
      });

      expect(result.content).toBe('Đã sửa');
      expect(moderation.enqueueScan).toHaveBeenCalledWith(
        ReportTargetType.COMMENT,
        'c-1',
      );
    });

    it('STAFF cũng không sửa được bình luận của người khác', async () => {
      prisma.blogPostComment.findFirst.mockResolvedValue(storedComment());

      await expect(
        service.updateComment('post-1', 'c-1', 'moderator-1', {
          content: 'X',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('xoá bình luận là xoá mềm và giảm đếm (không xuống âm)', async () => {
      prisma.blogPostComment.findFirst.mockResolvedValue(storedComment());

      await expect(
        service.deleteComment('post-1', 'c-1', READER),
      ).resolves.toEqual({ success: true, commentId: 'c-1', postId: 'post-1' });

      expect(prisma.blogPostComment.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: {
          deletedAt: expect.any(Date),
          status: PostCommentStatus.REMOVED,
        },
      });
      expect(prisma.blogPost.updateMany).toHaveBeenCalledWith({
        where: { id: 'post-1', commentCount: { gt: 0 } },
        data: { commentCount: { decrement: 1 } },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('xoá bình luận đã xoá / không tồn tại → 404', async () => {
      prisma.blogPostComment.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteComment('post-1', 'c-1', READER),
      ).rejects.toThrow(NotFoundException);
    });

    it('thích bình luận lần đầu → liked, bấm lại → bỏ thích', async () => {
      prisma.blogPostComment.findFirst.mockResolvedValue(storedComment());
      prisma.postCommentLike.findUnique.mockResolvedValueOnce(null);
      prisma.blogPostComment.update.mockResolvedValueOnce({ likeCount: 1 });

      await expect(
        service.likeComment('post-1', 'c-1', AUTHOR),
      ).resolves.toMatchObject({ liked: true, likeCount: 1 });

      prisma.postCommentLike.findUnique.mockResolvedValueOnce({ id: 'like-1' });
      prisma.blogPostComment.update.mockResolvedValueOnce({ likeCount: 0 });

      await expect(
        service.likeComment('post-1', 'c-1', AUTHOR),
      ).resolves.toMatchObject({ liked: false, likeCount: 0 });
      expect(prisma.postCommentLike.delete).toHaveBeenCalledWith({
        where: { id: 'like-1' },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('thích / lưu / báo cáo / lượt xem bài', () => {
    it('thích bài: tạo lượt thích trong transaction, phát realtime, báo tác giả', async () => {
      prisma.postLike.deleteMany.mockResolvedValue({ count: 0 });
      prisma.blogPost.update.mockResolvedValue({ likeCount: 3 });

      await expect(service.toggleLike('post-1', READER)).resolves.toEqual({
        liked: true,
        likeCount: 3,
      });
      await flushBackgroundTasks();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.postLike.create).toHaveBeenCalledWith({
        data: { postId: 'post-1', userId: READER },
      });
      expect(gateway.emitLikeUpdated).toHaveBeenCalledWith('post-1', 3);
      expect(notifications.notify).toHaveBeenCalledWith(
        AUTHOR,
        NotificationType.POST_LIKED,
        expect.any(String),
        expect.any(String),
        '/blog/bach-dang',
      );
    });

    it('bỏ thích: không tạo lượt mới, không báo tác giả, số đếm không âm', async () => {
      prisma.postLike.deleteMany.mockResolvedValue({ count: 1 });
      prisma.blogPost.update.mockResolvedValue({ likeCount: -1 });

      await expect(service.toggleLike('post-1', READER)).resolves.toEqual({
        liked: false,
        likeCount: 0,
      });
      await flushBackgroundTasks();

      expect(prisma.postLike.create).not.toHaveBeenCalled();
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('lưu bài bật / tắt', async () => {
      prisma.postBookmark.deleteMany.mockResolvedValueOnce({ count: 0 });
      await expect(service.toggleBookmark('post-1', READER)).resolves.toEqual({
        bookmarked: true,
      });

      prisma.postBookmark.deleteMany.mockResolvedValueOnce({ count: 1 });
      await expect(service.toggleBookmark('post-1', READER)).resolves.toEqual({
        bookmarked: false,
      });
      expect(prisma.postBookmark.create).toHaveBeenCalledTimes(1);
    });

    it('báo cáo bài: tạo báo cáo nguồn người dùng và báo hàng kiểm duyệt', async () => {
      prisma.contentReport.findFirst.mockResolvedValue(null);
      prisma.contentReport.create.mockResolvedValue({ id: 'rp-1' });

      await expect(
        service.reportPost('post-1', READER, { reason: 'Sai sự thật' }),
      ).resolves.toEqual({ success: true, reportId: 'rp-1' });

      expect(prisma.contentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: ReportTargetType.POST,
          source: ReportSource.USER_REPORT,
          reporterId: READER,
          aiReasons: { userReason: 'Sai sự thật' },
        }),
      });
      expect(gateway.emitModerationEvent).toHaveBeenCalledWith(
        expect.objectContaining({ reportId: 'rp-1', targetId: 'post-1' }),
      );
    });

    it('báo cáo cùng bài lần 2 → 409', async () => {
      prisma.contentReport.findFirst.mockResolvedValue({ id: 'rp-1' });

      await expect(
        service.reportPost('post-1', READER, { reason: 'Lặp' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.contentReport.create).not.toHaveBeenCalled();
    });

    it('lượt xem: mỗi người chỉ tính 1 lần / giờ', async () => {
      redis.setNX.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      await service.incrementViewCount('post-1', READER);
      await service.incrementViewCount('post-1', READER);

      expect(redis.setNX).toHaveBeenCalledWith(
        `view:post-1:${READER}`,
        1,
        3600,
      );
      expect(prisma.blogPost.update).toHaveBeenCalledTimes(1);
    });

    it('lượt xem: Redis lỗi thì bỏ qua, không làm hỏng việc xem bài', async () => {
      redis.setNX.mockRejectedValue(new Error('redis down'));

      await expect(
        service.incrementViewCount('post-1', READER),
      ).resolves.toBeUndefined();
    });
  });

  describe('theo dõi thành viên', () => {
    beforeEach(() => {
      prisma.authUser.findFirst.mockResolvedValue({
        id: AUTHOR,
        username: 'tac-gia',
      });
      prisma.userFollow.count.mockResolvedValue(5);
    });

    it('theo dõi: tạo quan hệ, phát số người theo dõi, báo người được theo dõi', async () => {
      prisma.userFollow.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.toggleFollow(READER, 'tac-gia');
      await flushBackgroundTasks();

      expect(result).toMatchObject({ following: true });
      expect(prisma.userFollow.create).toHaveBeenCalledWith({
        data: { followerId: READER, followingId: AUTHOR },
      });
      expect(gateway.emitFollowUpdated).toHaveBeenCalledWith(AUTHOR, 5);
      expect(notifications.notify).toHaveBeenCalledWith(
        AUTHOR,
        NotificationType.NEW_FOLLOWER,
        expect.any(String),
        expect.any(String),
        '/cong-dong/thanh-vien/doc-gia',
      );
    });

    it('bấm lại thì bỏ theo dõi, không báo', async () => {
      prisma.userFollow.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.toggleFollow(READER, 'tac-gia');
      await flushBackgroundTasks();

      expect(result).toMatchObject({ following: false });
      expect(prisma.userFollow.create).not.toHaveBeenCalled();
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('không tự theo dõi chính mình → 400', async () => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: AUTHOR,
        username: 'tac-gia',
      });

      await expect(service.toggleFollow(AUTHOR, 'tac-gia')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('thành viên không tồn tại → 404', async () => {
      prisma.authUser.findFirst.mockResolvedValue(null);

      await expect(service.toggleFollow(READER, 'khong-co')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
