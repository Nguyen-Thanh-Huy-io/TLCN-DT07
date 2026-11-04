import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { ACCESS_MESSAGES } from '../common/access/access.constant';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { QueryLessonDto } from './dto/query-lesson.dto';
import { ReviewLessonDto } from './dto/review-lesson.dto';
import { LessonStatus, Prisma } from '@prisma/client';
import { SlugHelper } from './helpers/slug.helper';
import { LessonContentStrategyContext } from './strategies/content-normalizer.strategy';

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
  ) {}

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
  private calculateReadTime(content: any): number {
    const plainText = LessonContentStrategyContext.extractPlainText(content);
    if (!plainText) return 1;
    const wordCount = plainText.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  /**
   * Chuẩn hóa Lesson entity trả về, kèm danh sách tags phân loại
   */
  private formatLessonResponse(lesson: any) {
    if (!lesson) return lesson;
    const content = lesson.content ?? [];
    const tags = Array.isArray(lesson.lessonTags)
      ? lesson.lessonTags.map((lt: any) => lt.tag).filter(Boolean)
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
    _creatorUserId?: string,
  ): Promise<any> {
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
        title: createLessonDto.title.trim(),
        slug,
        description: description?.trim() || null,
        content: normalizedContent,
        status: createLessonDto.status || LessonStatus.DRAFT,
        difficulty: createLessonDto.difficulty || undefined,
        sourceReferenceNote: createLessonDto.sourceReferenceNote || null,
        displayOrder:
          createLessonDto.displayOrder !== undefined
            ? Number(createLessonDto.displayOrder)
            : 0,
        thumbnailUrl: createLessonDto.thumbnailUrl || null,
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
    return this.formatLessonResponse(lesson);
  }

  /**
   * Lấy danh sách bài học (lọc theo status, tagId, search & phân trang)
   */
  async findAll(query: QueryLessonDto): Promise<IPaginatedResult<any>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {};

    if (query.status) {
      where.status = query.status;
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
      const cached = await this.redis.get<string | IPaginatedResult<any>>(
        cacheKey,
      );
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (error) {
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

    const result: IPaginatedResult<any> = {
      items: items.map((l) => this.formatLessonResponse(l)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, this.CACHE_TTL);
    } catch (error) {
      this.logger.warn(`Redis set failed for ${cacheKey}`, 'LessonService');
    }

    return result;
  }

  /**
   * Lấy chi tiết bài học theo ID
   */
  async findOne(id: string): Promise<any> {
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
  async findBySlug(slug: string): Promise<any> {
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

  /**
   * Cập nhật bài học
   */
  async update(id: string, updateLessonDto: UpdateLessonDto): Promise<any> {
    await this.findOne(id);

    const data: Prisma.LessonUpdateInput = {};

    if (updateLessonDto.title !== undefined) {
      data.title = updateLessonDto.title.trim();
      if (!updateLessonDto.slug) {
        data.slug = await this.generateUniqueSlug(updateLessonDto.title, id);
      }
    }

    if (updateLessonDto.slug !== undefined) {
      data.slug = await this.generateUniqueSlug(updateLessonDto.slug, id);
    }

    const description = updateLessonDto.description ?? updateLessonDto.summary;
    if (description !== undefined) {
      data.description = description ? description.trim() : null;
    }

    const rawContent =
      updateLessonDto.content !== undefined
        ? updateLessonDto.content
        : updateLessonDto.contentRichText;

    if (rawContent !== undefined) {
      data.content = LessonContentStrategyContext.normalize(rawContent);
    }

    if (updateLessonDto.status !== undefined) {
      data.status = updateLessonDto.status;
    }

    if (updateLessonDto.difficulty !== undefined) {
      data.difficulty = updateLessonDto.difficulty;
    }

    if (updateLessonDto.sourceReferenceNote !== undefined) {
      data.sourceReferenceNote = updateLessonDto.sourceReferenceNote || null;
    }

    if (updateLessonDto.displayOrder !== undefined) {
      data.displayOrder = Number(updateLessonDto.displayOrder) || 0;
    }

    if (updateLessonDto.thumbnailUrl !== undefined) {
      data.thumbnailUrl = updateLessonDto.thumbnailUrl || null;
    }

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
    return this.formatLessonResponse(updated);
  }

  /**
   * Phê duyệt / Từ chối bài học (Review Workflow)
   */
  async review(
    id: string,
    reviewDto: ReviewLessonDto,
    approverUserId?: string,
  ): Promise<any> {
    await this.findOne(id);

    // Quy trình 2 người: chỉ duyệt bài đang chờ duyệt, và người duyệt khác người soạn.
    const current = await this.prisma.lesson.findUnique({
      where: { id },
      select: { status: true, createdBy: true },
    });
    if (current?.status !== LessonStatus.REVIEW) {
      throw new ForbiddenException(ACCESS_MESSAGES.NOT_IN_REVIEW);
    }
    if (approverUserId && current.createdBy === approverUserId) {
      throw new ForbiddenException(ACCESS_MESSAGES.CANNOT_REVIEW_OWN);
    }

    if (
      reviewDto.status === LessonStatus.REJECTED &&
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
          reviewDto.status === LessonStatus.PUBLISHED ? new Date() : null,
        rejectionReason:
          reviewDto.status === LessonStatus.REJECTED
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
    return this.formatLessonResponse(updated);
  }

  /**
   * Xóa bài học
   */
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.lesson.delete({ where: { id } });
    await this.invalidateCache();
    return { message: 'Xóa bài học thành công.' };
  }

  /**
   * Làm mới bộ nhớ đệm danh sách bài học
   */
  private async invalidateCache(): Promise<void> {
    try {
      await this.redis.deleteByPattern(`${this.CACHE_PREFIX}:*`);
    } catch (error) {
      this.logger.warn('Failed to invalidate lesson cache', 'LessonService');
    }
  }
}
