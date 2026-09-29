import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateLessonDto, EmbeddedQuizDto } from './dto/create-lesson.dto';
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

const LESSON_CACHE_PREFIX = 'lessons:list' as const;
const LESSON_DETAIL_PREFIX = 'lesson:detail' as const;
const LESSON_CACHE_TTL = 3600; // 1 hour

/** Các status sẽ kích hoạt cascade sang Quiz liên kết */
const CASCADE_QUIZ_STATUSES = [
  ContentStatus.PUBLISHED,
  ContentStatus.REJECTED,
] as const;

/** Status Quiz sẽ bị cascade (chỉ DRAFT và PENDING_REVIEW) */
const CASCADE_ELIGIBLE_QUIZ_STATUSES = [
  ContentStatus.DRAFT,
  ContentStatus.PENDING_REVIEW,
] as const;

@Injectable()
export class LessonService {
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
   * Validate dữ liệu câu hỏi được nhúng trong EmbeddedQuizDto
   */
  private validateEmbeddedQuizQuestions(
    questions?: EmbeddedQuizDto['questions'],
  ): void {
    if (!questions || questions.length === 0) return;
    for (const q of questions) {
      const correctOptions = q.options.filter((o) => o.isCorrect);
      if (correctOptions.length === 0) {
        throw new BadRequestException(
          `Câu hỏi "${q.questionText}": bắt buộc phải có ít nhất một đáp án đúng`,
        );
      }
    }
  }

  /**
   * Tạo mới bài học lịch sử kèm media minh họa.
   * Nếu DTO có field `quiz`, tạo cả Lesson + Quiz trong một Prisma transaction.
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

    const { media, quiz, locations, entities, relatedLessons, ...lessonData } = createLessonDto;

    const locationsCreate = locations && locations.length > 0
      ? {
          create: locations.map((loc, idx) => ({
            locationId: loc.locationId,
            role: loc.role,
            stepOrder: loc.stepOrder ?? idx,
          })),
        }
      : undefined;

    const entitiesCreate = entities && entities.length > 0
      ? {
          create: entities.map((ent) => ({
            entityId: ent.entityId,
            role: ent.role,
          })),
        }
      : undefined;

    const relatedSourcesCreate = relatedLessons && relatedLessons.length > 0
      ? {
          create: relatedLessons.map((rel) => ({
            targetLessonId: rel.targetLessonId,
            relationType: rel.relationType,
          })),
        }
      : undefined;

    // --- Luồng All-in-One: tạo Lesson + Quiz trong 1 transaction ---
    if (quiz) {
      this.validateEmbeddedQuizQuestions(quiz.questions);

      const result = await this.prisma.$transaction(async (tx) => {
        const lesson = await tx.lesson.create({
          data: {
            ...lessonData,
            createdBy: creatorUserId,
            media:
              media && media.length > 0
                ? { createMany: { data: media } }
                : undefined,
            locations: locationsCreate,
            entities: entitiesCreate,
            relatedSources: relatedSourcesCreate,
          },
          include: {
            creator: { select: { id: true, email: true, username: true } },
            media: true,
            locations: { include: { location: true } },
            entities: { include: { entity: true } },
          },
        });

        const { questions, ...quizMeta } = quiz;
        const createdQuiz = await tx.quiz.create({
          data: {
            ...quizMeta,
            lessonId: lesson.id,
            topicId: lesson.topicId,
            createdBy: creatorUserId,
            status: ContentStatus.DRAFT,
            questions:
              questions && questions.length > 0
                ? {
                    create: questions.map((q, qIndex) => ({
                      questionText: q.questionText,
                      explanation: q.explanation,
                      type: q.type,
                      points: q.points ?? 1,
                      displayOrder: q.displayOrder ?? qIndex,
                      options: {
                        create: q.options.map((opt, optIndex) => ({
                          optionText: opt.optionText,
                          isCorrect: opt.isCorrect,
                          displayOrder: opt.displayOrder ?? optIndex,
                        })),
                      },
                    })),
                  }
                : undefined,
          },
          include: {
            creator: { select: { id: true, email: true, username: true } },
            questions: { include: { options: true } },
          },
        });

        return { ...this.formatLessonResponse(lesson), quiz: createdQuiz };
      });

      await this.invalidateCache();
      return result;
    }

    // --- Luồng thông thường: chỉ tạo Lesson ---
    const lesson = await this.prisma.lesson.create({
      data: {
        ...lessonData,
        createdBy: creatorUserId,
        media:
          media && media.length > 0
            ? { createMany: { data: media } }
            : undefined,
        locations: locationsCreate,
        entities: entitiesCreate,
        relatedSources: relatedSourcesCreate,
      },
      include: {
        creator: { select: { id: true, email: true, username: true } },
        media: true,
        locations: { include: { location: true } },
        entities: { include: { entity: true } },
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

    if (query.genre) {
      where.genre = query.genre;
    }

    if (query.field) {
      where.fields = {
        has: query.field,
      };
    }

    if (query.year !== undefined && query.year !== null) {
      where.AND = [
        {
          OR: [{ startYear: null }, { startYear: { lte: query.year } }],
        },
        {
          OR: [{ endYear: null }, { endYear: { gte: query.year } }],
        },
      ];
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

    const cacheKey = `${LESSON_CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
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
      await this.redis.set(cacheKey, result, LESSON_CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'LessonService');
    }

    return result;
  }

  /**
   * Lấy chi tiết bài học lịch sử kèm media & tags
   */
  async findOne(id: string): Promise<any> {
    const cacheKey = `${LESSON_DETAIL_PREFIX}:${id}`;
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
        locations: {
          include: {
            location: true,
          },
          orderBy: { stepOrder: 'asc' },
        },
        entities: {
          include: {
            entity: true,
          },
        },
        relatedSources: {
          include: {
            targetLesson: {
              select: { id: true, title: true, difficulty: true, status: true },
            },
          },
        },
        relatedTargets: {
          include: {
            sourceLesson: {
              select: { id: true, title: true, difficulty: true, status: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Bài học lịch sử với ID "${id}" không tồn tại`);
    }

    const formatted = this.formatLessonResponse(lesson);

    try {
      await this.redis.set(cacheKey, formatted, LESSON_CACHE_TTL);
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

    const { media, quiz, locations, entities, relatedLessons, ...lessonData } = updateLessonDto;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Cập nhật locations nếu được cung cấp
      if (locations !== undefined) {
        await tx.lessonLocation.deleteMany({ where: { lessonId: id } });
        if (locations.length > 0) {
          await tx.lessonLocation.createMany({
            data: locations.map((loc, idx) => ({
              lessonId: id,
              locationId: loc.locationId,
              role: loc.role,
              stepOrder: loc.stepOrder ?? idx,
            })),
          });
        }
      }

      // Cập nhật entities nếu được cung cấp
      if (entities !== undefined) {
        await tx.lessonEntity.deleteMany({ where: { lessonId: id } });
        if (entities.length > 0) {
          await tx.lessonEntity.createMany({
            data: entities.map((ent) => ({
              lessonId: id,
              entityId: ent.entityId,
              role: ent.role,
            })),
          });
        }
      }

      // Cập nhật relatedLessons nếu được cung cấp
      if (relatedLessons !== undefined) {
        await tx.relatedLesson.deleteMany({ where: { sourceLessonId: id } });
        if (relatedLessons.length > 0) {
          await tx.relatedLesson.createMany({
            data: relatedLessons.map((rel) => ({
              sourceLessonId: id,
              targetLessonId: rel.targetLessonId,
              relationType: rel.relationType,
            })),
          });
        }
      }

      return tx.lesson.update({
        where: { id },
        data: {
          ...lessonData,
        },
        include: {
          creator: { select: { id: true, email: true, username: true } },
          media: true,
          locations: { include: { location: true }, orderBy: { stepOrder: 'asc' } },
          entities: { include: { entity: true } },
          relatedSources: {
            include: {
              targetLesson: { select: { id: true, title: true, difficulty: true, status: true } },
            },
          },
        },
      });
    });

    await this.invalidateCache(id);
    return this.formatLessonResponse(updated);
  }

  /**
   * Duyệt hoặc từ chối bài học (Admin/Reviewer).
   * Khi PUBLISHED hoặc REJECTED, tự động cascade cùng status sang tất cả Quiz
   * đang DRAFT/PENDING_REVIEW thuộc bài học này.
   */
  async review(id: string, reviewDto: ReviewLessonDto, adminUserId: string): Promise<any> {
    await this.findOne(id);

    if (reviewDto.status === ContentStatus.REJECTED && !reviewDto.rejectionReason) {
      throw new BadRequestException('Bắt buộc phải nhập lý do từ chối (rejectionReason)');
    }

    const lessonUpdateData: Prisma.LessonUpdateInput = {
      status: reviewDto.status,
      approver: { connect: { id: adminUserId } },
    };

    if (reviewDto.status === ContentStatus.PUBLISHED) {
      lessonUpdateData.publishedAt = new Date();
      lessonUpdateData.rejectionReason = null;
    } else if (reviewDto.status === ContentStatus.REJECTED) {
      lessonUpdateData.rejectionReason = reviewDto.rejectionReason;
    }

    const shouldCascade = (CASCADE_QUIZ_STATUSES as ReadonlyArray<ContentStatus>).includes(
      reviewDto.status,
    );

    // Dùng transaction để đảm bảo lesson + quiz cascade cùng nhất quán
    const [updatedLesson, cascadeResult] = await this.prisma.$transaction([
      this.prisma.lesson.update({
        where: { id },
        data: lessonUpdateData,
        include: {
          creator: { select: { id: true, email: true, username: true } },
          approver: { select: { id: true, email: true, username: true } },
          media: true,
        },
      }),
      shouldCascade
        ? this.prisma.quiz.updateMany({
            where: {
              lessonId: id,
              status: { in: [...CASCADE_ELIGIBLE_QUIZ_STATUSES] },
            },
            data: {
              status: reviewDto.status,
              approvedBy: adminUserId,
            },
          })
        : this.prisma.quiz.updateMany({
            // no-op: không cascade với status PENDING_REVIEW / DRAFT của Lesson
            where: { id: 'NOOP_NO_CASCADE' },
            data: {},
          }),
    ]);

    await this.invalidateCache(id);

    return {
      ...this.formatLessonResponse(updatedLesson),
      cascadeQuizzes: shouldCascade
        ? {
            count: cascadeResult.count,
            status: reviewDto.status,
          }
        : null,
    };
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
        await this.redis.del(`${LESSON_DETAIL_PREFIX}:${id}`);
      }
      await this.redis.deleteByPattern(`${LESSON_CACHE_PREFIX}:*`);
    } catch (err) {
      this.logger.warn(`Failed to clear lesson cache: ${err.message}`, 'LessonService');
    }
  }
}
