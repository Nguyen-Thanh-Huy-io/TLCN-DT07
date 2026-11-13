import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ContentStatus, userRole } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';
import { REVISION_DIRECTIVE_KEY } from '../../content-revision/content-revision.interceptor';
import { ContentWriteGuard, type ContentResource } from './content-write.guard';

interface FakeRequest {
  user?: { userId: string; role: userRole };
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
    role: userRole,
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
    await expect(run({ model: 'topic' }, userRole.USER).result).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('biên tập viên không tạo thẳng bài viết ở trạng thái PUBLISHED', async () => {
    await expect(
      run({ model: 'article' }, userRole.MODERATOR, {
        params: {},
        body: { status: ContentStatus.PUBLISHED },
      }).result,
    ).rejects.toThrow(ForbiddenException);
  });

  it('biên tập viên tạo bài viết nháp được', async () => {
    await expect(
      run({ model: 'article' }, userRole.MODERATOR, {
        params: {},
        body: { status: ContentStatus.DRAFT },
      }).result,
    ).resolves.toBe(true);
  });

  it('người duyệt tạo thẳng bài viết PUBLISHED được', async () => {
    await expect(
      run({ model: 'article' }, userRole.ADMIN, {
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
      run({ model: 'topic', idParam: 'id' }, userRole.MODERATOR, {
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
      userRole.MODERATOR,
      { params: { id: 'a-1' }, body: {} },
    );

    await expect(result).resolves.toBe(true);
    expect(req[REVISION_DIRECTIVE_KEY]?.mode).toBe('PROPOSE');
  });
});
