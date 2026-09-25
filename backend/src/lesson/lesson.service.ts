import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { QueryLessonDto } from './dto/query-lesson.dto';
import { ReviewLessonDto } from './dto/review-lesson.dto';
import { Lesson, ContentStatus, Prisma } from '@prisma/client';

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
   * Tính toán thời gian đọc ước tính dựa trên số từ (200 từ/phút)
   */
  private calculateReadTime(contentRichText?: string | null): number {
    if (!contentRichText) return 1;
    const plainText = contentRichText.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return 1;
    const wordCount = plainText.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  /**
   * Tự động thêm estimatedReadMinutes vào DTO trả về
   */
  private formatLessonResponse(lesson: any) {
    return {
      ...lesson,
      estimatedReadMinutes: this.calculateReadTime(lesson.contentRichText),
    };
  }

  /**
   * Tạo mới bài học lịch sử kèm media minh họa
   */
  async create(createLessonDto: CreateLessonDto, creatorUserId: string): Promise<any> {
    this.logger.log(`Creating lesson: ${createLessonDto.title}`, 'LessonService');

    const topic = await this.prisma.topic.findUnique({
      where: { id: createLessonDto.topicId },
    });

    if (!topic) {
      throw new NotFoundException(
        `Chủ đề lịch sử với ID "${createLessonDto.topicId}" không tồn tại`,
      );
    }

    const { media, ...lessonData } = createLessonDto;

    const lesson = await this.prisma.lesson.create({
      data: {
        ...lessonData,
        createdBy: creatorUserId,
        media: media && media.length > 0
          ? {
              createMany: {
                data: media,
              },
            }
          : undefined,
      },
      include: {
        creator: { select: { id: true, email: true, username: true } },
        media: true,
      },
    });

    await this.invalidateCache();
    return this.formatLessonResponse(lesson);
  }

  /**
   * Lấy danh sách bài học (lọc theo topicId, status, difficulty, search & phân trang)
   */
  async findAll(query: QueryLessonDto): Promise<IPaginatedResult<any>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {};

    if (query.topicId) {
      where.topicId = query.topicId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { contentRichText: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `${this.CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
    try {
      const cached = await this.redis.get<IPaginatedResult<any>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'LessonService');
    }

    const [total, items] = await Promise.all([
      this.prisma.lesson.count({ where }),
      this.prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          topic: { select: { id: true, name: true } },
          creator: { select: { id: true, email: true, username: true } },
          media: true,
        },
      }),
    ]);

    const formattedItems = items.map((item) => this.formatLessonResponse(item));

    const result: IPaginatedResult<any> = {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'LessonService');
    }

    return result;
  }

  /**
   * Lấy chi tiết bài học lịch sử kèm media & tags
   */
  async findOne(id: string): Promise<any> {
    const cacheKey = `lesson:detail:${id}`;
    try {
      const cached = await this.redis.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'LessonService');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, name: true, periodId: true } },
        creator: { select: { id: true, email: true, username: true } },
        approver: { select: { id: true, email: true, username: true } },
        media: { orderBy: { displayOrder: 'asc' } },
        lessonTags: { include: { tag: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Bài học lịch sử với ID "${id}" không tồn tại`);
    }

    const formatted = this.formatLessonResponse(lesson);

    try {
      await this.redis.set(cacheKey, formatted, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'LessonService');
    }

    return formatted;
  }

  /**
   * Cập nhật bài học lịch sử
   */
  async update(id: string, updateLessonDto: UpdateLessonDto): Promise<any> {
    await this.findOne(id);

    if (updateLessonDto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: updateLessonDto.topicId },
      });
      if (!topic) {
        throw new NotFoundException(
          `Chủ đề lịch sử mới với ID "${updateLessonDto.topicId}" không tồn tại`,
        );
      }
    }

    const { media, ...lessonData } = updateLessonDto;

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        ...lessonData,
      },
      include: {
        creator: { select: { id: true, email: true, username: true } },
        media: true,
      },
    });

    await this.invalidateCache(id);
    return this.formatLessonResponse(updated);
  }

  /**
   * Duyệt hoặc từ chối bài học (Admin/Reviewer)
   */
  async review(id: string, reviewDto: ReviewLessonDto, adminUserId: string): Promise<any> {
    await this.findOne(id);

    if (reviewDto.status === ContentStatus.REJECTED && !reviewDto.rejectionReason) {
      throw new BadRequestException('Bắt buộc phải nhập lý do từ chối (rejectionReason)');
    }

    const updateData: Prisma.LessonUpdateInput = {
      status: reviewDto.status,
      approver: { connect: { id: adminUserId } },
    };

    if (reviewDto.status === ContentStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
      updateData.rejectionReason = null;
    } else if (reviewDto.status === ContentStatus.REJECTED) {
      updateData.rejectionReason = reviewDto.rejectionReason;
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, email: true, username: true } },
        approver: { select: { id: true, email: true, username: true } },
        media: true,
      },
    });

    await this.invalidateCache(id);
    return this.formatLessonResponse(updated);
  }

  /**
   * Xóa một bài học lịch sử
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.lesson.delete({
      where: { id },
    });

    await this.invalidateCache(id);

    return {
      success: true,
      message: `Bài học lịch sử với ID "${id}" đã được xóa thành công`,
    };
  }

  /**
   * Xóa cache liên quan khi có mutation
   */
  private async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await this.redis.del(`lesson:detail:${id}`);
      }
      await this.redis.deleteByPattern(`${this.CACHE_PREFIX}:*`);
    } catch (err) {
      this.logger.warn(`Failed to clear lesson cache: ${err.message}`, 'LessonService');
    }
  }
}
