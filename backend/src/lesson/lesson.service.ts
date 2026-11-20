import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/services/prisma.service';
import { loadAuthorNames } from '../common/utils/author-names';
import { ACCESS_MESSAGES } from '../common/access/access.constant';
import { RedisService } from '../common/services/redis.service';
import { TAG_CONFIG } from '../tag/tag.constant';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import {
  KNOWLEDGE_EVENTS,
  type KnowledgeChangedEventPayload,
} from '../knowledge/knowledge.constant';
import {
  AUTHOR_FOLLOW_EVENTS,
  AuthorPublishedContentType,
  type AuthorPublishedPayload,
} from '../common/constants/follow-events.constant';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { QueryLessonDto } from './dto/query-lesson.dto';
import { ReviewLessonDto } from './dto/review-lesson.dto';
import { LessonResponseDto } from './dto/lesson-response.dto';
import {
  Lesson,
  ContentStatus,
  KnowledgeTargetType,
  Prisma,
  Tag,
} from '@prisma/client';
import { SlugHelper } from './helpers/slug.helper';
import { LessonContentStrategyContext } from './strategies/content-normalizer.strategy';

type LessonWithTags = Lesson & {
  lessonTags?: Array<{ tag?: Tag | null }>;
};

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class LessonService {
  private readonly CACHE_PREFIX = 'lessons:list';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
    @Optional() private readonly eventEmitter?: EventEmitter2,
  ) {}

  private emitKnowledgeSync(id: string, removed = false): void {
    if (!this.eventEmitter) return;
    const payload: KnowledgeChangedEventPayload = {
      targetType: KnowledgeTargetType.LESSON,
      targetId: id,
    };
    this.eventEmitter.emit(
      removed
        ? KNOWLEDGE_EVENTS.CONTENT_REMOVED
        : KNOWLEDGE_EVENTS.LESSON_CHANGED,
      payload,
    );
  }

  private emitAuthorContentPublished(
    authorId: string | null | undefined,
    title: string,
    slug: string,
  ): void {
    if (!this.eventEmitter || !authorId) return;
    const payload: AuthorPublishedPayload = {
      authorId,
      contentType: AuthorPublishedContentType.LESSON,
      title,
      slug,
    };
    this.eventEmitter.emit(AUTHOR_FOLLOW_EVENTS.CONTENT_PUBLISHED, payload);
  }

  /**
   * Sinh Slug duy nhất không trùng lặp trong hệ thống (Single Responsibility Principle)
   */
  private async generateUniqueSlug(
    baseTitle: string,
    excludeId?: string,
  ): Promise<string> {
    const rawSlug = SlugHelper.generateSlug(baseTitle) || 'bai-hoc';
    let candidateSlug = rawSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.lesson.findUnique({
        where: { slug: candidateSlug },
        select: { id: true },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidateSlug;
      }

      candidateSlug = `${rawSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Tính toán thời gian đọc ước tính dựa trên số từ (200 từ/phút)
   */
  private calculateReadTime(content: unknown): number {
    const plainText = LessonContentStrategyContext.extractPlainText(content);
    if (!plainText) return 1;
    const wordCount = plainText.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  /**
   * Chuẩn hóa Lesson entity trả về, kèm danh sách tags phân loại
   */
  private formatLessonResponse(lesson: LessonWithTags): LessonResponseDto {
    if (!lesson) return lesson;
    const content = lesson.content ?? [];
    const tags = Array.isArray(lesson.lessonTags)
      ? lesson.lessonTags
          .map((lt) => lt.tag)
          .filter((tag): tag is Tag => Boolean(tag))
      : [];
    return {
      ...lesson,
      summary: lesson.description || '', // Alias tương thích ngược
      contentRichText:
        typeof content === 'string' ? content : JSON.stringify(content), // Alias tương thích TipTap
      estimatedReadMinutes: this.calculateReadTime(content),
      tags,
    };
  }

  /**
   * Tạo mới bài học lịch sử dạng JSONB
   */
  async create(
    createLessonDto: CreateLessonDto,
    creatorUserId?: string,
  ): Promise<LessonResponseDto> {
    this.logger.log(
      `Creating lesson: ${createLessonDto.title}`,
      'LessonService',
    );

    const slug = await this.generateUniqueSlug(
      createLessonDto.slug || createLessonDto.title,
    );

    const rawContent =
      createLessonDto.content !== undefined
        ? createLessonDto.content
        : createLessonDto.contentRichText;

    const normalizedContent =
      LessonContentStrategyContext.normalize(rawContent);
    const description = createLessonDto.description ?? createLessonDto.summary;

    const lesson = await this.prisma.lesson.create({
      data: {
        topicId: createLessonDto.topicId || null,
        title: createLessonDto.title.trim(),
        slug,
        description: description?.trim() || null,
        content: normalizedContent,
        status: createLessonDto.status || ContentStatus.DRAFT,
        difficulty: createLessonDto.difficulty || undefined,
        sourceReferenceNote: createLessonDto.sourceReferenceNote || null,
        displayOrder:
          createLessonDto.displayOrder !== undefined
            ? Number(createLessonDto.displayOrder)
            : 0,
        thumbnailUrl: createLessonDto.thumbnailUrl || null,
        createdBy: creatorUserId || null,
        publishedAt:
          createLessonDto.status === ContentStatus.PUBLISHED
            ? new Date()
            : null,
      },
      include: {
        lessonTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    await this.invalidateCache();
    this.emitKnowledgeSync(lesson.id);
    if (lesson.status === ContentStatus.PUBLISHED) {
      this.emitAuthorContentPublished(
        lesson.createdBy,
        lesson.title,
        lesson.slug,
      );
    }
    return this.formatLessonResponse(lesson);
  }

  /**
   * Lấy danh sách bài học (lọc theo status, tagId, search & phân trang)
   */
  async findAll(
    query: QueryLessonDto,
  ): Promise<IPaginatedResult<LessonResponseDto>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.topicId) {
      where.topicId = query.topicId;
    }

    if (query.tagId) {
      where.lessonTags = {
        some: {
          tagId: query.tagId,
        },
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `${this.CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
    try {
      const cached = await this.redis.get<
        string | IPaginatedResult<LessonResponseDto>
      >(cacheKey);
      if (cached) {
        return typeof cached === 'string'
          ? (JSON.parse(cached) as IPaginatedResult<LessonResponseDto>)
          : cached;
      }
    } catch {
      this.logger.warn(
        `Redis get/parse failed for ${cacheKey}`,
        'LessonService',
      );
    }

    const [items, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
        include: {
          lessonTags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    const nameOf = await loadAuthorNames(
      this.prisma,
      items.map((l) => l.createdBy),
    );
    const result: IPaginatedResult<LessonResponseDto> = {
      items: items.map((l) => ({
        ...this.formatLessonResponse(l),
        creatorName: nameOf(l.createdBy),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, this.CACHE_TTL);
    } catch {
      this.logger.warn(`Redis set failed for ${cacheKey}`, 'LessonService');
    }

    return result;
  }

  /**
   * Lấy chi tiết bài học theo ID
   */
  async findOne(id: string): Promise<LessonResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        lessonTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Bài học với ID ${id} không tồn tại.`);
    }

    return this.formatLessonResponse(lesson);
  }

  /**
   * Lấy chi tiết bài học theo Slug (dành cho SEO URL)
   */
  async findBySlug(slug: string): Promise<LessonResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { slug },
      include: {
        lessonTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(
        `Bài học với đường dẫn "${slug}" không tồn tại.`,
      );
    }

    return this.formatLessonResponse(lesson);
  }

  private async buildLessonUpdateData(
    id: string,
    dto: UpdateLessonDto,
    becomesPublished: boolean,
    existingPublishedAt: Date | null | undefined,
  ): Promise<Prisma.LessonUpdateInput> {
    const data: Prisma.LessonUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
      if (!dto.slug) {
        data.slug = await this.generateUniqueSlug(dto.title, id);
      }
    }
    if (dto.slug !== undefined) {
      data.slug = await this.generateUniqueSlug(dto.slug, id);
    }

    const description = dto.description ?? dto.summary;
    if (description !== undefined) {
      data.description = description ? description.trim() : null;
    }

    const rawContent =
      dto.content !== undefined ? dto.content : dto.contentRichText;
    if (rawContent !== undefined) {
      data.content = LessonContentStrategyContext.normalize(rawContent);
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (becomesPublished && !existingPublishedAt) {
      data.publishedAt = new Date();
    }

    return { ...data, ...this.buildLessonMetaPatch(dto) };
  }

  private buildLessonMetaPatch(dto: UpdateLessonDto): Prisma.LessonUpdateInput {
    return {
      ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
      ...(dto.sourceReferenceNote !== undefined
        ? { sourceReferenceNote: dto.sourceReferenceNote || null }
        : {}),
      ...(dto.displayOrder !== undefined
        ? { displayOrder: Number(dto.displayOrder) || 0 }
        : {}),
      ...(dto.thumbnailUrl !== undefined
        ? { thumbnailUrl: dto.thumbnailUrl || null }
        : {}),
      ...(dto.topicId !== undefined
        ? { topic: { connect: { id: dto.topicId } } }
        : {}),
    };
  }

  /**
   * Cập nhật bài học
   */
  async update(
    id: string,
    updateLessonDto: UpdateLessonDto,
  ): Promise<LessonResponseDto> {
    const existing = await this.findOne(id);
    const becomesPublished =
      updateLessonDto.status === ContentStatus.PUBLISHED &&
      existing.status !== ContentStatus.PUBLISHED;

    const data = await this.buildLessonUpdateData(
      id,
      updateLessonDto,
      becomesPublished,
      existing.publishedAt,
    );

    const updated = await this.prisma.lesson.update({
      where: { id },
      data,
      include: {
        lessonTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    await this.invalidateCache();
    this.emitKnowledgeSync(updated.id);
    if (becomesPublished) {
      this.emitAuthorContentPublished(
        updated.createdBy,
        updated.title,
        updated.slug,
      );
    }
    return this.formatLessonResponse(updated);
  }

  /**
   * Phê duyệt / Từ chối bài học (Review Workflow)
   */
  async review(
    id: string,
    reviewDto: ReviewLessonDto,
    approverUserId?: string,
  ): Promise<LessonResponseDto> {
    await this.findOne(id);

    // Quy trình 2 người: chỉ duyệt bài đang chờ duyệt, và người duyệt khác người soạn.
    const current = await this.prisma.lesson.findUnique({
      where: { id },
      select: { status: true, createdBy: true },
    });
    if (current?.status !== ContentStatus.PENDING_REVIEW) {
      throw new ForbiddenException(ACCESS_MESSAGES.NOT_IN_REVIEW);
    }
    if (approverUserId && current.createdBy === approverUserId) {
      throw new ForbiddenException(ACCESS_MESSAGES.CANNOT_REVIEW_OWN);
    }

    if (
      reviewDto.status === ContentStatus.REJECTED &&
      !reviewDto.rejectionReason?.trim()
    ) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối bài học.');
    }

    let resolvedApproverId: string | null = null;
    if (approverUserId) {
      const approverExists = await this.prisma.authUser.findUnique({
        where: { id: approverUserId },
        select: { id: true },
      });
      if (approverExists) {
        resolvedApproverId = approverUserId;
      }
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        status: reviewDto.status,
        approvedBy: resolvedApproverId,
        publishedAt:
          reviewDto.status === ContentStatus.PUBLISHED ? new Date() : null,
        rejectionReason:
          reviewDto.status === ContentStatus.REJECTED
            ? reviewDto.rejectionReason?.trim()
            : null,
      },
      include: {
        lessonTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    await this.invalidateCache();
    this.emitKnowledgeSync(updated.id);
    if (updated.status === ContentStatus.PUBLISHED) {
      this.emitAuthorContentPublished(
        updated.createdBy,
        updated.title,
        updated.slug,
      );
    }
    return this.formatLessonResponse(updated);
  }

  /**
   * Xóa bài học
   */
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.lesson.delete({ where: { id } });
    await this.invalidateCache();
    this.emitKnowledgeSync(id, true);
    return { message: 'Xóa bài học thành công.' };
  }

  /**
   * Làm mới bộ nhớ đệm danh sách bài học
   */
  private async invalidateCache(): Promise<void> {
    try {
      await this.redis.deleteByPattern(`${this.CACHE_PREFIX}:*`);
      // Danh sách Tag được cache kèm số bài học dùng tag.
      await this.redis.deleteByPattern(TAG_CONFIG.TAG_CACHE_PATTERN);
    } catch {
      this.logger.warn('Failed to invalidate lesson cache', 'LessonService');
    }
  }
}
