import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateHistoricalEventDto } from './dto/create-historical-event.dto';
import { UpdateHistoricalEventDto } from './dto/update-historical-event.dto';
import { QueryHistoricalEventDto } from './dto/query-historical-event.dto';
import { HistoricalEvent, Prisma } from '@prisma/client';

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class HistoricalEventService {
  private readonly CACHE_PREFIX = 'historical_events:list';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Tạo mới một sự kiện lịch sử
   */
  async create(dto: CreateHistoricalEventDto): Promise<HistoricalEvent> {
    this.logger.log(`Creating historical event: ${dto.title}`, 'HistoricalEventService');

    // Kiểm tra TopicId có tồn tại không
    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
    });

    if (!topic) {
      throw new NotFoundException(
        `Chủ đề lịch sử với ID "${dto.topicId}" không tồn tại`,
      );
    }

    const event = await this.prisma.historicalEvent.create({
      data: {
        topicId: dto.topicId,
        title: dto.title,
        eventYear: dto.eventYear,
        eventDateNote: dto.eventDateNote,
        description: dto.description,
        location: dto.location,
        displayOrder: dto.displayOrder ?? 0,
      },
    });

    await this.invalidateCache();
    return event;
  }

  /**
   * Lấy danh sách sự kiện lịch sử (lọc theo topicId, eventYear, location, search và phân trang)
   */
  async findAll(query: QueryHistoricalEventDto): Promise<IPaginatedResult<HistoricalEvent>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.HistoricalEventWhereInput = {};

    if (query.topicId) {
      where.topicId = query.topicId;
    }

    if (query.eventYear !== undefined && query.eventYear !== null) {
      where.eventYear = query.eventYear;
    }

    if (query.location) {
      where.location = {
        contains: query.location,
        mode: 'insensitive',
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `${this.CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
    try {
      const cached = await this.redis.get<IPaginatedResult<HistoricalEvent>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'HistoricalEventService');
    }

    const [total, items] = await Promise.all([
      this.prisma.historicalEvent.count({ where }),
      this.prisma.historicalEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ eventYear: 'asc' }, { displayOrder: 'asc' }],
        include: {
          topic: {
            select: { id: true, name: true, periodId: true },
          },
        },
      }),
    ]);

    const result: IPaginatedResult<HistoricalEvent> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'HistoricalEventService');
    }

    return result;
  }

  /**
   * Lấy chi tiết một sự kiện lịch sử theo ID
   */
  async findOne(id: string): Promise<HistoricalEvent> {
    const cacheKey = `historical_event:detail:${id}`;
    try {
      const cached = await this.redis.get<HistoricalEvent>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'HistoricalEventService');
    }

    const event = await this.prisma.historicalEvent.findUnique({
      where: { id },
      include: {
        topic: {
          select: { id: true, name: true, periodId: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Sự kiện lịch sử với ID "${id}" không tồn tại`);
    }

    try {
      await this.redis.set(cacheKey, event, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'HistoricalEventService');
    }

    return event;
  }

  /**
   * Cập nhật sự kiện lịch sử
   */
  async update(id: string, dto: UpdateHistoricalEventDto): Promise<HistoricalEvent> {
    await this.findOne(id);

    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
      });
      if (!topic) {
        throw new NotFoundException(
          `Chủ đề lịch sử mới với ID "${dto.topicId}" không tồn tại`,
        );
      }
    }

    const updated = await this.prisma.historicalEvent.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return updated;
  }

  /**
   * Xóa một sự kiện lịch sử
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.historicalEvent.delete({
      where: { id },
    });

    await this.invalidateCache(id);

    return {
      success: true,
      message: `Sự kiện lịch sử với ID "${id}" đã được xóa thành công`,
    };
  }

  /**
   * Xóa cache liên quan
   */
  private async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await this.redis.del(`historical_event:detail:${id}`);
      }
      await this.redis.deleteByPattern(`${this.CACHE_PREFIX}:*`);
    } catch (err) {
      this.logger.warn(`Failed to clear historical event cache: ${err.message}`, 'HistoricalEventService');
    }
  }
}
