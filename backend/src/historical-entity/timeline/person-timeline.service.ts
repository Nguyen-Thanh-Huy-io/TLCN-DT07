import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { HISTORICAL_ENTITY_ERRORS } from '../historical-entity.constant';
import { PersonTimelineBuilder } from './person-timeline.builder';
import { StatementDirectionProjector } from './statement-direction.projector';
import {
  QueryPersonTimelineDto,
  PersonTimelineResponseDto,
} from './timeline.dto';
import { TimelineSortOrder } from './timeline.constant';

@Injectable()
export class PersonTimelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly builder: PersonTimelineBuilder,
    private readonly projector: StatementDirectionProjector,
  ) {}

  /**
   * Tổng hợp Timeline động cho một thực thể (Nhân vật, Triều đại, Tổ chức)
   * Kết hợp dữ liệu Master Data (sinh, mất, thành lập) + Đồ thị tri thức (HistoricalStatement)
   */
  async getTimeline(
    entityId: string,
    query: QueryPersonTimelineDto = {},
  ): Promise<PersonTimelineResponseDto> {
    const order = query.order ?? TimelineSortOrder.ASC;
    const includeStatements = query.includeStatements ?? true;
    const cacheKey = `historical_entity:timeline:${entityId}:${order}:${includeStatements}`;

    const cached = await this.redis.get<PersonTimelineResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Tìm thông tin thực thể và quan hệ Person
    const entity = await this.prisma.historicalEntity.findUnique({
      where: { id: entityId },
      include: {
        person: true,
      },
    });

    if (!entity) {
      throw new NotFoundException(HISTORICAL_ENTITY_ERRORS.NOT_FOUND(entityId));
    }

    // 2. Truy vấn hai chiều toàn bộ phát biểu liên quan (Target là Subject hoặc Object)
    const statementWhere: any = {
      OR: [{ subjectEntityId: entityId }, { objectEntityId: entityId }],
    };

    if (!includeStatements) {
      // Chỉ lấy các phát biểu liên kết tới Sự kiện
      statementWhere.AND = [
        {
          OR: [
            { subjectEventId: { not: null } },
            { objectEventId: { not: null } },
          ],
        },
      ];
    }

    const statements = await this.prisma.historicalStatement.findMany({
      where: statementWhere,
      include: {
        predicate: true,
        subjectEvent: true,
        objectEvent: true,
        subjectEntity: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        objectEntity: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        references: {
          include: {
            reference: true,
          },
        },
      },
    });

    // 3. Khởi tạo Builder & lắp ráp các mốc thời gian
    this.builder.reset().setEntity(entity, entity.person);

    // Mốc sinh ra (hoặc thành lập)
    this.builder.addBirthOrFoundingMilestone();

    // Chiếu các phát biểu tri thức sang các mốc sự kiện/quan hệ
    for (const statement of statements) {
      const item = this.projector.project({
        targetEntityId: entityId,
        statement,
      });
      if (item) {
        this.builder.addItem(item);
      }
    }

    // Mốc qua đời (hoặc kết thúc)
    this.builder.addDeathOrDissolutionMilestone();

    // 4. Xây dựng và sắp xếp mốc thời gian theo trục niên đại
    const result = this.builder.build(order);

    // Lưu cache (1 giờ)
    await this.redis.set(cacheKey, result, 3600);

    return result;
  }
}
