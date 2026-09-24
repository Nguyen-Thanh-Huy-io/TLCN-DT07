import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { QueryTopicDto } from './dto/query-topic.dto';
import { Topic, ContentStatus, Prisma } from '@prisma/client';

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TopicService {
  private readonly CACHE_PREFIX = 'topics:list';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Tạo mới một chủ đề lịch sử
   */
  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    this.logger.log(`Creating topic: ${createTopicDto.name}`, 'TopicService');

    // Kiểm tra xem PeriodId có tồn tại hay không
    const period = await this.prisma.period.findUnique({
      where: { id: createTopicDto.periodId },
    });

    if (!period) {
      throw new NotFoundException(
        `Giai đoạn lịch sử với ID "${createTopicDto.periodId}" không tồn tại`,
      );
    }

    const topic = await this.prisma.topic.create({
      data: {
        periodId: createTopicDto.periodId,
        name: createTopicDto.name,
        description: createTopicDto.description,
        coverImageUrl: createTopicDto.coverImageUrl,
        isSequential: createTopicDto.isSequential ?? false,
        displayOrder: createTopicDto.displayOrder ?? 0,
        status: createTopicDto.status ?? ContentStatus.DRAFT,
      },
    });

    await this.invalidateCache();
    return topic;
  }

  /**
   * Lấy danh sách chủ đề (có lọc theo periodId, status, search và phân trang)
   */
  async findAll(query: QueryTopicDto): Promise<IPaginatedResult<Topic>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TopicWhereInput = {};

    if (query.periodId) {
      where.periodId = query.periodId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `${this.CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
    try {
      const cached = await this.redis.get<IPaginatedResult<Topic>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'TopicService');
    }

    const [total, items] = await Promise.all([
      this.prisma.topic.count({ where }),
      this.prisma.topic.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          period: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
        },
      }),
    ]);

    const result: IPaginatedResult<Topic> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'TopicService');
    }

    return result;
  }

  /**
   * Lấy chi tiết một chủ đề theo ID
   */
  async findOne(id: string): Promise<Topic> {
    const cacheKey = `topic:detail:${id}`;
    try {
      const cached = await this.redis.get<Topic>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'TopicService');
    }

    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        period: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Chủ đề lịch sử với ID "${id}" không tồn tại`);
    }

    try {
      await this.redis.set(cacheKey, topic, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'TopicService');
    }

    return topic;
  }

  /**
   * Cập nhật một chủ đề lịch sử
   */
  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    await this.findOne(id);

    if (updateTopicDto.periodId) {
      const period = await this.prisma.period.findUnique({
        where: { id: updateTopicDto.periodId },
      });
      if (!period) {
        throw new NotFoundException(
          `Giai đoạn lịch sử mới với ID "${updateTopicDto.periodId}" không tồn tại`,
        );
      }
    }

    const updated = await this.prisma.topic.update({
      where: { id },
      data: updateTopicDto,
    });

    await this.invalidateCache(id);
    return updated;
  }

  /**
   * Xóa một chủ đề lịch sử
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.topic.delete({
      where: { id },
    });

    await this.invalidateCache(id);

    return {
      success: true,
      message: `Chủ đề lịch sử với ID "${id}" đã được xóa thành công`,
    };
  }

  /**
   * Xóa cache liên quan
   */
  private async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await this.redis.del(`topic:detail:${id}`);
      }
      await this.redis.deleteByPattern(`${this.CACHE_PREFIX}:*`);
    } catch (err) {
      this.logger.warn(`Failed to clear topic cache: ${err.message}`, 'TopicService');
    }
  }
}
