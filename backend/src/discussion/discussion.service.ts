import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscussionTargetType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { ROLE_GROUPS } from '../common/access/access.constant';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import {
  CreateDiscussionReplyDto,
  CreateDiscussionThreadDto,
  QueryDiscussionDto,
} from './dto/discussion.dto';

/** Ban biên soạn / kiểm duyệt / quản trị: trả lời chính thức và xoá chủ đề của người khác. */
const STAFF_ROLES: readonly string[] = ROLE_GROUPS.STAFF;
const PUBLIC_ARTICLE_PATH = '/bai-viet';
const PUBLIC_LESSON_PATH = '/bai-hoc';

const USER_SELECT = {
  select: {
    id: true,
    username: true,
    role: true,
    userProfile: {
      select: {
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    },
  },
};

@Injectable()
export class DiscussionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(query: QueryDiscussionDto) {
    const {
      page = 1,
      limit = 20,
      targetType,
      targetId,
      learningPathId,
      isAnswered,
      search,
    } = query;

    const where: Prisma.DiscussionThreadWhereInput = {
      ...(targetType ? { targetType } : {}),
      ...(targetId ? { targetId } : {}),
      ...(learningPathId ? { learningPathId } : {}),
      ...(typeof isAnswered === 'boolean' ? { isAnswered } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.discussionThread.findMany({
        where,
        orderBy: [{ isAnswered: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: USER_SELECT,
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.discussionThread.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id },
      include: {
        user: USER_SELECT,
        replies: {
          orderBy: [{ isOfficial: 'desc' }, { createdAt: 'asc' }],
          include: {
            user: USER_SELECT,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException(`Không tìm thấy chủ đề thảo luận ${id}`);
    }

    return thread;
  }

  async create(userId: string, dto: CreateDiscussionThreadDto) {
    return this.prisma.discussionThread.create({
      data: {
        userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        learningPathId: dto.learningPathId || null,
        title: dto.title.trim(),
        content: dto.content.trim(),
      },
      include: {
        user: USER_SELECT,
      },
    });
  }

  async createReply(
    userId: string,
    userRoleVal: string,
    threadId: string,
    dto: CreateDiscussionReplyDto,
  ) {
    const thread = await this.findOne(threadId);

    // Quyền của ban biên soạn/quản trị viên/kiểm duyệt
    const isOfficial = STAFF_ROLES.includes(userRoleVal);

    return this.prisma.$transaction(async (tx) => {
      const reply = await tx.discussionReply.create({
        data: {
          threadId,
          userId,
          content: dto.content.trim(),
          isOfficial,
        },
        include: {
          user: USER_SELECT,
        },
      });

      if (isOfficial) {
        await tx.discussionThread.update({
          where: { id: threadId },
          data: { isAnswered: true },
        });
      }

      // Gửi thông báo đến người đặt câu hỏi (nếu người trả lời khác người hỏi)
      if (thread.userId !== userId) {
        await this.notificationService.notify(
          thread.userId,
          isOfficial
            ? NotificationType.OFFICIAL_REPLY
            : NotificationType.NEW_REPLY,
          isOfficial
            ? 'Ban Biên Soạn đã trả lời câu hỏi của bạn'
            : 'Có phản hồi mới về câu hỏi của bạn',
          dto.content.slice(0, 100),
          await this.discussionTargetLink(
            tx,
            thread.targetType,
            thread.targetId,
          ),
        );
      }

      return reply;
    });
  }

  private async discussionTargetLink(
    tx: Prisma.TransactionClient,
    targetType: DiscussionTargetType,
    targetId: string,
  ): Promise<string | undefined> {
    if (targetType === DiscussionTargetType.ARTICLE) {
      const article = await tx.article.findUnique({
        where: { id: targetId },
        select: { slug: true },
      });
      return article ? `${PUBLIC_ARTICLE_PATH}/${article.slug}` : undefined;
    }
    const lesson = await tx.lesson.findUnique({
      where: { id: targetId },
      select: { slug: true },
    });
    return lesson ? `${PUBLIC_LESSON_PATH}/${lesson.slug}` : undefined;
  }

  async remove(userId: string, userRoleVal: string, threadId: string) {
    const thread = await this.findOne(threadId);
    const isManager = STAFF_ROLES.includes(userRoleVal);

    if (thread.userId !== userId && !isManager) {
      throw new ForbiddenException(
        'Bạn không có quyền xoá chủ đề thảo luận này',
      );
    }

    await this.prisma.discussionThread.delete({ where: { id: threadId } });
    return { success: true };
  }
}
