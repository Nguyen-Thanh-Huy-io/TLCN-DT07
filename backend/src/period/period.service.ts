import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { QueryPeriodDto } from './dto/query-period.dto';
import { IPeriodService, IPaginatedResult } from './interfaces/period.interface';
import { Period, ContentStatus, Prisma } from '@prisma/client';

@Injectable()
export class PeriodService implements IPeriodService {
  private readonly CACHE_PREFIX = 'periods:list';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Tạo mới một giai đoạn lịch sử
   */
  async create(createPeriodDto: CreatePeriodDto): Promise<Period> {
    this.logger.log(`Creating period: ${createPeriodDto.name}`, 'PeriodService');

    // Business validation: endYear >= startYear nếu có endYear
    if (
      createPeriodDto.endYear !== undefined &&
      createPeriodDto.endYear !== null &&
      createPeriodDto.endYear < createPeriodDto.startYear
    ) {
      throw new BadRequestException('endYear must be greater than or equal to startYear');
    }

    const period = await this.prisma.period.create({
      data: {
        name: createPeriodDto.name,
        region: createPeriodDto.region,
        startYear: createPeriodDto.startYear,
        endYear: createPeriodDto.endYear,
        description: createPeriodDto.description,
        coverImageUrl: createPeriodDto.coverImageUrl,
        displayOrder: createPeriodDto.displayOrder ?? 0,
        status: createPeriodDto.status ?? ContentStatus.DRAFT,
      },
    });

    // Invalidate list caches
    await this.invalidateCache();

    return period;
  }

  /**
   * Lấy danh sách giai đoạn có phân trang, lọc theo vùng/tỉnh thành, status và tìm kiếm
   */
  async findAll(query: QueryPeriodDto): Promise<IPaginatedResult<Period>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PeriodWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.region) {
      where.region = {
        contains: query.region,
        mode: 'insensitive',
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `${this.CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
    try {
      const cached = await this.redis.get<IPaginatedResult<Period>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'PeriodService');
    }

    const [total, items] = await Promise.all([
      this.prisma.period.count({ where }),
      this.prisma.period.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { startYear: 'asc' }],
      }),
    ]);

    const result: IPaginatedResult<Period> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'PeriodService');
    }

    return result;
  }

  /**
   * Lấy chi tiết một giai đoạn theo ID
   */
  async findOne(id: string): Promise<Period> {
    const cacheKey = `period:detail:${id}`;
    try {
      const cached = await this.redis.get<Period>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'PeriodService');
    }

    const period = await this.prisma.period.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException(`Period with ID "${id}" not found`);
    }

    try {
      await this.redis.set(cacheKey, period, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'PeriodService');
    }

    return period;
  }

  /**
   * Cập nhật một giai đoạn lịch sử
   */
  async update(id: string, updatePeriodDto: UpdatePeriodDto): Promise<Period> {
    const existing = await this.findOne(id);

    const startYear = updatePeriodDto.startYear ?? existing.startYear;
    const endYear =
      updatePeriodDto.endYear !== undefined ? updatePeriodDto.endYear : existing.endYear;

    if (endYear !== null && endYear !== undefined && endYear < startYear) {
      throw new BadRequestException('endYear must be greater than or equal to startYear');
    }

    const updated = await this.prisma.period.update({
      where: { id },
      data: updatePeriodDto,
    });

    // Invalidate caches
    await this.invalidateCache(id);

    return updated;
  }

  /**
   * Xóa một giai đoạn
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.period.delete({
      where: { id },
    });

    await this.invalidateCache(id);

    return {
      success: true,
      message: `Period with ID "${id}" has been deleted successfully`,
    };
  }

  /**
   * Xóa cache liên quan khi có mutation
   */
  private async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await this.redis.del(`period:detail:${id}`);
      }
      // Xóa tất cả query cache danh sách periods an toàn bằng scan pattern
      await this.redis.deleteByPattern(`${this.CACHE_PREFIX}:*`);
    } catch (err) {
      this.logger.warn(`Failed to clear period cache: ${err.message}`, 'PeriodService');
    }
  }
}
