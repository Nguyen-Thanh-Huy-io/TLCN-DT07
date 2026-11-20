import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import {
  AUTHOR_FOLLOW_EVENTS,
  AuthorPublishedContentType,
  type AuthorPublishedPayload,
} from '../common/constants/follow-events.constant';
import { PrismaService } from '../common/services/prisma.service';
import { loadAuthorNames } from '../common/utils/author-names';
import { NotificationService } from './notification.service';

interface PublishedContentDescriptor {
  readonly label: string;
  readonly buildLink: (slug: string) => string;
}

const CONTENT_PUBLISH_DESCRIPTORS: Record<
  AuthorPublishedContentType,
  PublishedContentDescriptor
> = {
  [AuthorPublishedContentType.ARTICLE]: {
    label: 'bài viết lịch sử',
    buildLink: (slug) => `/bai-viet/${encodeURIComponent(slug)}`,
  },
  [AuthorPublishedContentType.LESSON]: {
    label: 'bài học',
    buildLink: (slug) => `/bai-hoc/${encodeURIComponent(slug)}`,
  },
  [AuthorPublishedContentType.BLOG]: {
    label: 'bài viết Blog',
    buildLink: (slug) => `/blog/${encodeURIComponent(slug)}`,
  },
};

/** Gửi thông báo tới những người đang theo dõi khi tác giả xuất bản nội dung mới. */
@Injectable()
export class AuthorPublishListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent(AUTHOR_FOLLOW_EVENTS.CONTENT_PUBLISHED)
  async handleAuthorContentPublished(
    payload: AuthorPublishedPayload,
  ): Promise<void> {
    if (!payload.authorId || !payload.slug) return;
    const descriptor = CONTENT_PUBLISH_DESCRIPTORS[payload.contentType];
    if (!descriptor) return;

    const followerRows = await this.prisma.userFollow.findMany({
      where: { followingId: payload.authorId },
      select: { followerId: true },
    });

    const followerIds = Array.from(
      new Set(
        followerRows
          .map((row) => row.followerId)
          .filter((id) => Boolean(id) && id !== payload.authorId),
      ),
    );
    if (followerIds.length === 0) return;

    const nameOf = await loadAuthorNames(this.prisma, [payload.authorId]);
    const authorName = nameOf(payload.authorId);
    const title = `${authorName} vừa đăng ${descriptor.label} mới`;
    const message = `"${payload.title}" đã được xuất bản. Nhấn để đọc ngay.`;
    const linkUrl = descriptor.buildLink(payload.slug);

    await Promise.allSettled(
      followerIds.map((followerId) =>
        this.notificationService.notify(
          followerId,
          NotificationType.CONTENT_APPROVED,
          title,
          message,
          linkUrl,
        ),
      ),
    );
  }
}
