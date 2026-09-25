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

@Injectable()
export class TagService {
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getCacheKey(key: string): string {
    return `tags:${key}`;
  }

  async create(createTagDto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { name: createTagDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Tag với tên "${createTagDto.name}" đã tồn tại`,
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
          select: { lessonTags: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag với ID "${id}" không tồn tại`);
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
          `Tag với tên "${updateTagDto.name}" đã tồn tại`,
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
    return { message: `Đã xóa Tag thành công` };
  }

  async attachTagsToLesson(lessonId: string, attachDto: AttachLessonTagsDto) {
    // 1. Check lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) {
      throw new NotFoundException(`Bài học với ID "${lessonId}" không tồn tại`);
    }

    // 2. Check all tags exist
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: attachDto.tagIds } },
    });
    if (tags.length !== attachDto.tagIds.length) {
      throw new BadRequestException(
        `Một hoặc nhiều Tag ID không tồn tại trong hệ thống`,
      );
    }

    // 3. Transaction: Replace old tags with new tags
    await this.prisma.$transaction([
      this.prisma.lessonTag.deleteMany({
        where: { lessonId },
      }),
      this.prisma.lessonTag.createMany({
        data: attachDto.tagIds.map((tagId) => ({
          lessonId,
          tagId,
        })),
      }),
    ]);

    await this.clearCache();
    return this.getLessonTags(lessonId);
  }

  async getLessonTags(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        lessonTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Bài học với ID "${lessonId}" không tồn tại`);
    }

    return lesson.lessonTags.map((lt) => lt.tag);
  }

  private async clearCache() {
    await this.redis.deleteByPattern('tags:*');
    await this.redis.deleteByPattern('lessons:*');
  }
}
