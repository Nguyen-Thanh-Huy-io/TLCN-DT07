import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateHistoricalEntityDto } from './dto/create-historical-entity.dto';
import { UpdateHistoricalEntityDto } from './dto/update-historical-entity.dto';
import { QueryHistoricalEntityDto } from './dto/query-historical-entity.dto';
import { HistoricalEntity, Prisma } from '@prisma/client';
import {
  HISTORICAL_ENTITY_CONSTANTS,
  HISTORICAL_ENTITY_ERROR_MESSAGES,
  HISTORICAL_ENTITY_SUCCESS_MESSAGES,
} from './constants/historical-entity.constant';

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class HistoricalEntityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Tạo mới một thực thể lịch sử
   */
  async create(dto: CreateHistoricalEntityDto): Promise<HistoricalEntity> {
    this.logger.log(`Creating historical entity: ${dto.name}`, 'HistoricalEntityService');

    if (
      dto.startYear !== undefined &&
      dto.endYear !== undefined &&
      dto.endYear < dto.startYear
    ) {
      throw new BadRequestException(HISTORICAL_ENTITY_ERROR_MESSAGES.INVALID_YEAR_RANGE);
    }

    const entity = await this.prisma.historicalEntity.create({
      data: {
        name: dto.name,
        originalName: dto.originalName,
        type: dto.type,
        nationality: dto.nationality,
        startYear: dto.startYear,
        endYear: dto.endYear,
        timeDisplay: dto.timeDisplay,
        imageUrl: dto.imageUrl,
        description: dto.description,
        metadata: dto.metadata,
      },
    });

    await this.invalidateCache();
    return entity;
  }

  /**
   * Lấy danh sách thực thể lịch sử (phân trang, lọc theo type, nationality, year, search)
   */
  async findAll(query: QueryHistoricalEntityDto): Promise<IPaginatedResult<HistoricalEntity>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.HistoricalEntityWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.nationality) {
      where.nationality = {
        contains: query.nationality,
        mode: 'insensitive',
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

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { originalName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `${HISTORICAL_ENTITY_CONSTANTS.CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
    try {
      const cached = await this.redis.get<IPaginatedResult<HistoricalEntity>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err: any) {
      this.logger.warn(`Redis get error: ${err.message}`, 'HistoricalEntityService');
    }

    const [total, items] = await Promise.all([
      this.prisma.historicalEntity.count({ where }),
      this.prisma.historicalEntity.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ startYear: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const result: IPaginatedResult<HistoricalEntity> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, HISTORICAL_ENTITY_CONSTANTS.CACHE_TTL);
    } catch (err: any) {
      this.logger.warn(`Redis set error: ${err.message}`, 'HistoricalEntityService');
    }

    return result;
  }

  /**
   * Lấy chi tiết một thực thể lịch sử theo ID
   */
  async findOne(id: string): Promise<HistoricalEntity> {
    const cacheKey = `${HISTORICAL_ENTITY_CONSTANTS.CACHE_DETAIL_PREFIX}:${id}`;
    try {
      const cached = await this.redis.get<HistoricalEntity>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err: any) {
      this.logger.warn(`Redis get error: ${err.message}`, 'HistoricalEntityService');
    }

    const entity = await this.prisma.historicalEntity.findUnique({
      where: { id },
      include: {
        lessonEntities: {
          include: {
            lesson: {
              select: { id: true, title: true, topicId: true, difficulty: true, status: true },
            },
          },
        },
      },
    });

    if (!entity) {
      throw new NotFoundException(HISTORICAL_ENTITY_ERROR_MESSAGES.ENTITY_NOT_FOUND);
    }

    try {
      await this.redis.set(cacheKey, entity, HISTORICAL_ENTITY_CONSTANTS.CACHE_TTL);
    } catch (err: any) {
      this.logger.warn(`Redis set error: ${err.message}`, 'HistoricalEntityService');
    }

    return entity;
  }

  /**
   * Cập nhật thực thể lịch sử
   */
  async update(id: string, dto: UpdateHistoricalEntityDto): Promise<HistoricalEntity> {
    const existing = await this.findOne(id);

    const startYear = dto.startYear !== undefined ? dto.startYear : existing.startYear;
    const endYear = dto.endYear !== undefined ? dto.endYear : existing.endYear;

    if (
      startYear !== null &&
      startYear !== undefined &&
      endYear !== null &&
      endYear !== undefined &&
      endYear < startYear
    ) {
      throw new BadRequestException(HISTORICAL_ENTITY_ERROR_MESSAGES.INVALID_YEAR_RANGE);
    }

    const updated = await this.prisma.historicalEntity.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return updated;
  }

  /**
   * Xóa một thực thể lịch sử
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.historicalEntity.delete({
      where: { id },
    });

    await this.invalidateCache(id);

    return {
      success: true,
      message: HISTORICAL_ENTITY_SUCCESS_MESSAGES.DELETED,
    };
  }

  /**
   * Xóa cache khi có thao tác mutation
   */
  private async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await this.redis.del(`${HISTORICAL_ENTITY_CONSTANTS.CACHE_DETAIL_PREFIX}:${id}`);
      }
      await this.redis.deleteByPattern(`${HISTORICAL_ENTITY_CONSTANTS.CACHE_PREFIX}:*`);
    } catch (err: any) {
      this.logger.warn(`Failed to clear historical entity cache: ${err.message}`, 'HistoricalEntityService');
    }
  }
}
