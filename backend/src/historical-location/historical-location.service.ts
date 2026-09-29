import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateHistoricalLocationDto } from './dto/create-historical-location.dto';
import { UpdateHistoricalLocationDto } from './dto/update-historical-location.dto';
import { QueryHistoricalLocationDto } from './dto/query-historical-location.dto';
import { HistoricalLocation, Prisma } from '@prisma/client';
import {
  HISTORICAL_LOCATION_CONSTANTS,
  HISTORICAL_LOCATION_ERROR_MESSAGES,
  HISTORICAL_LOCATION_SUCCESS_MESSAGES,
} from './constants/historical-location.constant';

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class HistoricalLocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Tạo mới một địa điểm lịch sử
   */
  async create(dto: CreateHistoricalLocationDto): Promise<HistoricalLocation> {
    this.logger.log(`Creating historical location: ${dto.name}`, 'HistoricalLocationService');

    if (dto.latitude !== undefined && (dto.latitude < -90 || dto.latitude > 90)) {
      throw new BadRequestException(HISTORICAL_LOCATION_ERROR_MESSAGES.INVALID_COORDINATES);
    }
    if (dto.longitude !== undefined && (dto.longitude < -180 || dto.longitude > 180)) {
      throw new BadRequestException(HISTORICAL_LOCATION_ERROR_MESSAGES.INVALID_COORDINATES);
    }

    const location = await this.prisma.historicalLocation.create({
      data: {
        name: dto.name,
        historicalName: dto.historicalName,
        type: dto.type,
        modernCountry: dto.modernCountry,
        adminArea: dto.adminArea,
        latitude: dto.latitude,
        longitude: dto.longitude,
        geoJson: dto.geoJson,
      },
    });

    await this.invalidateCache();
    return location;
  }

  /**
   * Lấy danh sách địa điểm lịch sử (phân trang, lọc theo type, adminArea, modernCountry, search)
   */
  async findAll(query: QueryHistoricalLocationDto): Promise<IPaginatedResult<HistoricalLocation>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.HistoricalLocationWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.adminArea) {
      where.adminArea = {
        contains: query.adminArea,
        mode: 'insensitive',
      };
    }

    if (query.modernCountry) {
      where.modernCountry = {
        contains: query.modernCountry,
        mode: 'insensitive',
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { historicalName: { contains: query.search, mode: 'insensitive' } },
        { adminArea: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `${HISTORICAL_LOCATION_CONSTANTS.CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
    try {
      const cached = await this.redis.get<IPaginatedResult<HistoricalLocation>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err: any) {
      this.logger.warn(`Redis get error: ${err.message}`, 'HistoricalLocationService');
    }

    const [total, items] = await Promise.all([
      this.prisma.historicalLocation.count({ where }),
      this.prisma.historicalLocation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ name: 'asc' }],
      }),
    ]);

    const result: IPaginatedResult<HistoricalLocation> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, HISTORICAL_LOCATION_CONSTANTS.CACHE_TTL);
    } catch (err: any) {
      this.logger.warn(`Redis set error: ${err.message}`, 'HistoricalLocationService');
    }

    return result;
  }

  /**
   * Lấy chi tiết một địa điểm lịch sử theo ID
   */
  async findOne(id: string): Promise<HistoricalLocation> {
    const cacheKey = `${HISTORICAL_LOCATION_CONSTANTS.CACHE_DETAIL_PREFIX}:${id}`;
    try {
      const cached = await this.redis.get<HistoricalLocation>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err: any) {
      this.logger.warn(`Redis get error: ${err.message}`, 'HistoricalLocationService');
    }

    const location = await this.prisma.historicalLocation.findUnique({
      where: { id },
      include: {
        lessonLocations: {
          include: {
            lesson: {
              select: { id: true, title: true, topicId: true, difficulty: true, status: true },
            },
          },
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(HISTORICAL_LOCATION_ERROR_MESSAGES.LOCATION_NOT_FOUND);
    }

    try {
      await this.redis.set(cacheKey, location, HISTORICAL_LOCATION_CONSTANTS.CACHE_TTL);
    } catch (err: any) {
      this.logger.warn(`Redis set error: ${err.message}`, 'HistoricalLocationService');
    }

    return location;
  }

  /**
   * Cập nhật địa điểm lịch sử
   */
  async update(id: string, dto: UpdateHistoricalLocationDto): Promise<HistoricalLocation> {
    await this.findOne(id);

    if (dto.latitude !== undefined && (dto.latitude < -90 || dto.latitude > 90)) {
      throw new BadRequestException(HISTORICAL_LOCATION_ERROR_MESSAGES.INVALID_COORDINATES);
    }
    if (dto.longitude !== undefined && (dto.longitude < -180 || dto.longitude > 180)) {
      throw new BadRequestException(HISTORICAL_LOCATION_ERROR_MESSAGES.INVALID_COORDINATES);
    }

    const updated = await this.prisma.historicalLocation.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return updated;
  }

  /**
   * Xóa một địa điểm lịch sử
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.historicalLocation.delete({
      where: { id },
    });

    await this.invalidateCache(id);

    return {
      success: true,
      message: HISTORICAL_LOCATION_SUCCESS_MESSAGES.DELETED,
    };
  }

  /**
   * Xóa cache khi có thao tác mutation
   */
  private async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await this.redis.del(`${HISTORICAL_LOCATION_CONSTANTS.CACHE_DETAIL_PREFIX}:${id}`);
      }
      await this.redis.deleteByPattern(`${HISTORICAL_LOCATION_CONSTANTS.CACHE_PREFIX}:*`);
    } catch (err: any) {
      this.logger.warn(`Failed to clear historical location cache: ${err.message}`, 'HistoricalLocationService');
    }
  }
}
