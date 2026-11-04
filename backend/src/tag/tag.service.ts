import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { AttachLessonTagsDto } from './dto/attach-lesson-tags.dto';
import { TAG_CONFIG, TAG_MESSAGES } from './tag.constant';

@Injectable()
export class TagService {
  private readonly CACHE_TTL = TAG_CONFIG.CACHE_TTL;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getCacheKey(key: string): string {
    return `${TAG_CONFIG.CACHE_PREFIX}:${key}`;
  }

  async create(createTagDto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { name: createTagDto.name },
    });

    if (existing) {
      throw new ConflictException(
        TAG_MESSAGES.NAME_CONFLICT(createTagDto.name),
      );
    }

    const tag = await this.prisma.tag.create({
      data: createTagDto,
    });

    await this.clearCache();
    return tag;
  }

  async findAll(query: QueryTagDto) {
    const { page = 1, limit = 10, search } = query;
    const cacheKey = this.getCacheKey(
      `list:${page}:${limit}:${search || 'all'}`,
    );

    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              lessonTags: true,
            },
          },
        },
      }),
      this.prisma.tag.count({ where }),
    ]);

    const result = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findOne(id: string) {
    const cacheKey = this.getCacheKey(`detail:${id}`);
    const cachedTag = await this.redis.get(cacheKey);
    if (cachedTag) {
      return cachedTag;
    }

    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            lessonTags: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(TAG_MESSAGES.NOT_FOUND(id));
    }

    await this.redis.set(cacheKey, tag, this.CACHE_TTL);
    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    await this.findOne(id);

    if (updateTagDto.name) {
      const existing = await this.prisma.tag.findFirst({
        where: {
          name: updateTagDto.name,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(
          TAG_MESSAGES.NAME_CONFLICT(updateTagDto.name),
        );
      }
    }

    const updatedTag = await this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });

    await this.clearCache();
    return updatedTag;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.tag.delete({
      where: { id },
    });

    await this.clearCache();
    return { message: TAG_MESSAGES.DELETED_SUCCESS };
  }

  async attachTagsToLesson(lessonId: string, attachDto: AttachLessonTagsDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) {
      throw new NotFoundException(TAG_MESSAGES.LESSON_NOT_FOUND(lessonId));
    }

    const uniqueTagIds = Array.from(new Set(attachDto.tagIds || []));

    const validTags =
      uniqueTagIds.length > 0
        ? await this.prisma.tag.findMany({
            where: { id: { in: uniqueTagIds } },
          })
        : [];

    const validTagIds = validTags.map((t) => t.id);

    if (validTags.length !== uniqueTagIds.length) {
      const invalidIds = uniqueTagIds.filter((id) => !validTagIds.includes(id));
      throw new BadRequestException(TAG_MESSAGES.INVALID_TAG_IDS(invalidIds));
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.lessonTag.deleteMany({
        where: { lessonId },
      });

      if (validTagIds.length > 0) {
        await tx.lessonTag.createMany({
          data: validTagIds.map((tagId) => ({
            lessonId,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    });

    await this.clearCache(lessonId);
    return validTags;
  }

  async getLessonTags(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        lessonTags: {
          include: {
            tag: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(TAG_MESSAGES.LESSON_NOT_FOUND(lessonId));
    }

    return lesson.lessonTags.map((lt) => lt.tag);
  }

  private async clearCache(lessonId?: string) {
    if (lessonId) {
      await this.redis.del(`lesson:detail:${lessonId}`);
    }
    await this.redis.deleteByPattern(TAG_CONFIG.TAG_CACHE_PATTERN);
    await this.redis.deleteByPattern(TAG_CONFIG.LESSON_CACHE_PATTERN);
    await this.redis.deleteByPattern('lesson:slug:*');
  }
}
