import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ContentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';
import { REVISION_DIRECTIVE_KEY } from '../../content-revision/content-revision.interceptor';
import { ContentWriteGuard, type ContentResource } from './content-write.guard';

interface FakeRequest {
  user?: { userId: string; role: UserRole };
  body?: { status?: string };
  params: Record<string, string>;
  [REVISION_DIRECTIVE_KEY]?: { mode: string };
}

describe('ContentWriteGuard', () => {
  let guard: ContentWriteGuard;
  const reflector = { get: jest.fn() };
  const prisma = {
    article: { findUnique: jest.fn() },
    topic: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentWriteGuard,
        { provide: Reflector, useValue: reflector },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    guard = moduleRef.get(ContentWriteGuard);
  });

  function run(
    resource: ContentResource,
    role: UserRole,
    request: Omit<FakeRequest, 'user'> = { params: {} },
  ) {
    reflector.get.mockReturnValue(resource);
    const req: FakeRequest = { ...request, user: { userId: 'u-1', role } };
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => undefined,
    } as unknown as ExecutionContext;
    return { result: guard.canActivate(context), req };
  }

  it('chặn người học (USER) ghi nội dung CMS', async () => {
    await expect(run({ model: 'topic' }, UserRole.USER).result).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('biên tập viên không tạo thẳng bài viết ở trạng thái PUBLISHED', async () => {
    await expect(
      run({ model: 'article' }, UserRole.MODERATOR, {
        params: {},
        body: { status: ContentStatus.PUBLISHED },
      }).result,
    ).rejects.toThrow(ForbiddenException);
  });

  it('biên tập viên tạo bài viết nháp được', async () => {
    await expect(
      run({ model: 'article' }, UserRole.MODERATOR, {
        params: {},
        body: { status: ContentStatus.DRAFT },
      }).result,
    ).resolves.toBe(true);
  });

  it('người duyệt tạo thẳng bài viết PUBLISHED được', async () => {
    await expect(
      run({ model: 'article' }, UserRole.ADMIN, {
        params: {},
        body: { status: ContentStatus.PUBLISHED },
      }).result,
    ).resolves.toBe(true);
  });

  it('biên tập viên không sửa chủ đề đã xuất bản', async () => {
    prisma.topic.findUnique.mockResolvedValue({
      status: ContentStatus.PUBLISHED,
    });

    await expect(
      run({ model: 'topic', idParam: 'id' }, UserRole.MODERATOR, {
        params: { id: 't-1' },
        body: {},
      }).result,
    ).rejects.toThrow(ForbiddenException);
  });

  it('biên tập viên sửa bài viết đã xuất bản → chuyển thành bản sửa chờ duyệt', async () => {
    prisma.article.findUnique.mockResolvedValue({
      status: ContentStatus.PUBLISHED,
    });

    const { result, req } = run(
      { model: 'article', idParam: 'id', versioned: true },
      UserRole.MODERATOR,
      { params: { id: 'a-1' }, body: {} },
    );

    await expect(result).resolves.toBe(true);
    expect(req[REVISION_DIRECTIVE_KEY]?.mode).toBe('PROPOSE');
  });

  describe('lưu trữ: PUBLISHED → ARCHIVED → DRAFT', () => {
    const articleWithStatus = (
      current: ContentStatus,
      next: ContentStatus,
      role: UserRole,
    ) => {
      prisma.article.findUnique.mockResolvedValue({ status: current });
      return run({ model: 'article', idParam: 'id', versioned: true }, role, {
        params: { id: 'a-1' },
        body: { status: next },
      }).result;
    };

    it('người duyệt lưu trữ bài đang xuất bản được', async () => {
      await expect(
        articleWithStatus(
          ContentStatus.PUBLISHED,
          ContentStatus.ARCHIVED,
          UserRole.ADMIN,
        ),
      ).resolves.toBe(true);
    });

    it('biên tập viên không lưu trữ được, kể cả qua đường bản sửa chờ duyệt', async () => {
      await expect(
        articleWithStatus(
          ContentStatus.PUBLISHED,
          ContentStatus.ARCHIVED,
          UserRole.MODERATOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('không lưu trữ bản nháp', async () => {
      await expect(
        articleWithStatus(
          ContentStatus.DRAFT,
          ContentStatus.ARCHIVED,
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('không tạo mới thẳng ở trạng thái lưu trữ', async () => {
      await expect(
        run({ model: 'article' }, UserRole.ADMIN, {
          params: {},
          body: { status: ContentStatus.ARCHIVED },
        }).result,
      ).rejects.toThrow(BadRequestException);
    });

    it('khôi phục từ lưu trữ về nháp được', async () => {
      await expect(
        articleWithStatus(
          ContentStatus.ARCHIVED,
          ContentStatus.DRAFT,
          UserRole.ADMIN,
        ),
      ).resolves.toBe(true);
    });

    it('từ lưu trữ không xuất bản lại thẳng', async () => {
      await expect(
        articleWithStatus(
          ContentStatus.ARCHIVED,
          ContentStatus.PUBLISHED,
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('sửa nội dung bài lưu trữ mà không đổi trạng thái vẫn được (người duyệt)', async () => {
      prisma.article.findUnique.mockResolvedValue({
        status: ContentStatus.ARCHIVED,
      });
      await expect(
        run(
          { model: 'article', idParam: 'id', versioned: true },
          UserRole.ADMIN,
          {
            params: { id: 'a-1' },
            body: {},
          },
        ).result,
      ).resolves.toBe(true);
    });
  });
});
