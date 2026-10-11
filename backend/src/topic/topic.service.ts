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
import { ReorderTopicItemDto } from './dto/reorder-topics.dto';
import {
  Topic,
  ContentStatus,
  LearningPathType,
  Prisma,
} from '@prisma/client';
import {
  TOPIC_HIERARCHY_CONFIG,
  TOPIC_ERROR_MESSAGES,
  TOPIC_SUCCESS_MESSAGES,
} from './topic.constant';

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ITopicTreeNode extends Topic {
  children: ITopicTreeNode[];
  lessons?: any[];
  _count?: {
    lessons: number;
    children: number;
  };
}

@Injectable()
export class TopicService {
  private readonly CACHE_PREFIX = TOPIC_HIERARCHY_CONFIG.CACHE_PREFIX;
  private readonly CACHE_TTL = TOPIC_HIERARCHY_CONFIG.CACHE_TTL;
  private readonly MAX_HIERARCHY_DEPTH = TOPIC_HIERARCHY_CONFIG.MAX_DEPTH;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Kiểm tra tính toàn vẹn của mối quan hệ Cha - Con (Anti-Cycle & Max Depth Guard)
   */
  private async validateParentHierarchy(
    parentId: string,
    currentTopicId?: string,
  ): Promise<Topic> {
    if (currentTopicId && parentId === currentTopicId) {
      throw new BadRequestException(
        'Một chủ đề không thể làm chủ đề cha của chính nó',
      );
    }

    const parent = await this.prisma.topic.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException(TOPIC_ERROR_MESSAGES.PARENT_NOT_FOUND);
    }

    // Kiểm tra chu trình lặp (Cycle Detection) và Độ sâu (Depth Guard)
    let currentAncestorId: string | null = parent.parentId;
    let depth = 2; // parent đã là level 1 hoặc 2

    while (currentAncestorId) {
      depth++;
      if (depth > this.MAX_HIERARCHY_DEPTH) {
        throw new BadRequestException(
          TOPIC_ERROR_MESSAGES.MAX_DEPTH_EXCEEDED,
        );
      }

      if (currentTopicId && currentAncestorId === currentTopicId) {
        throw new BadRequestException(
          TOPIC_ERROR_MESSAGES.CYCLE_DETECTED,
        );
      }

      const ancestor = await this.prisma.topic.findUnique({
        where: { id: currentAncestorId },
        select: { id: true, parentId: true },
      });

      if (!ancestor) break;
      currentAncestorId = ancestor.parentId;
    }

    return parent;
  }

  /**
   * Tạo mới một chủ đề lịch sử (hỗ trợ phân cấp Cha - Con và Giai đoạn tùy chọn)
   */
  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    this.logger.log(`Creating topic: ${createTopicDto.name}`, 'TopicService');

    let resolvedPeriodId = createTopicDto.periodId || null;

    // 1. Kiểm tra chủ đề cha nếu có
    if (createTopicDto.parentId) {
      const parentTopic = await this.validateParentHierarchy(
        createTopicDto.parentId,
      );
      // Nếu chủ đề con không chỉ định periodId, tự động kế thừa periodId từ chủ đề cha
      if (!resolvedPeriodId && parentTopic.periodId) {
        resolvedPeriodId = parentTopic.periodId;
      }
    }

    // 2. Nếu có periodId, kiểm tra xem Period có tồn tại hay không
    if (resolvedPeriodId) {
      const period = await this.prisma.period.findUnique({
        where: { id: resolvedPeriodId },
      });

      if (!period) {
        throw new NotFoundException(
          `Giai đoạn lịch sử với ID "${resolvedPeriodId}" không tồn tại`,
        );
      }
    }

    const topic = await this.prisma.topic.create({
      data: {
        periodId: resolvedPeriodId,
        parentId: createTopicDto.parentId || null,
        pathType:
          createTopicDto.pathType ??
          (resolvedPeriodId
            ? LearningPathType.CHRONOLOGICAL
            : LearningPathType.THEMATIC),
        name: createTopicDto.name.trim(),
        description: createTopicDto.description?.trim(),
        coverImageUrl: createTopicDto.coverImageUrl,
        isSequential: createTopicDto.isSequential ?? false,
        displayOrder: createTopicDto.displayOrder ?? 0,
        status: createTopicDto.status ?? ContentStatus.DRAFT,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
    });

    await this.invalidateCache();
    return topic;
  }

  /**
   * Lấy danh sách chủ đề (hỗ trợ lọc theo periodId, parentId, isRootOnly, search...)
   */
  async findAll(query: QueryTopicDto): Promise<IPaginatedResult<Topic>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TopicWhereInput = {};

    if (query.periodId) {
      where.periodId = query.periodId;
    }

    if (query.parentId) {
      where.parentId = query.parentId;
    } else if (query.isRootOnly) {
      where.parentId = null;
    }

    if (query.pathType) {
      where.pathType = query.pathType;
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
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          period: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
          _count: {
            select: {
              children: true,
              lessons: true,
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
   * Lấy chi tiết một chủ đề theo ID kèm các chủ đề con và thông tin cha
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
        parent: {
          select: {
            id: true,
            name: true,
            periodId: true,
          },
        },
        children: {
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            _count: {
              select: {
                lessons: true,
                children: true,
              },
            },
          },
        },
        lessons: {
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            title: true,
            difficulty: true,
            status: true,
            displayOrder: true,
          },
        },
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
      throw new NotFoundException(
        `Chủ đề lịch sử với ID "${id}" không tồn tại`,
      );
    }

    try {
      await this.redis.set(cacheKey, topic, this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'TopicService');
    }

    return topic;
  }

  /**
   * Cập nhật một chủ đề lịch sử
   */
  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    const existing = await this.findOne(id);

    // Chuẩn hóa parentId: nếu là string rỗng hoặc null, set thành null để gỡ cha
    let normalizedParentId: string | null | undefined = undefined;
    if (updateTopicDto.parentId !== undefined) {
      if (updateTopicDto.parentId && updateTopicDto.parentId.trim() !== '') {
        await this.validateParentHierarchy(updateTopicDto.parentId, id);
        normalizedParentId = updateTopicDto.parentId;
      } else {
        normalizedParentId = null;
      }
    }

    // Kiểm tra periodId nếu có thay đổi
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
      data: {
        ...updateTopicDto,
        parentId:
          normalizedParentId !== undefined
            ? normalizedParentId
            : updateTopicDto.parentId,
        name: updateTopicDto.name ? updateTopicDto.name.trim() : undefined,
        description:
          updateTopicDto.description !== undefined
            ? updateTopicDto.description?.trim()
            : undefined,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
    });

    await this.invalidateCache(id);
    if (existing.parentId) {
      await this.invalidateCache(existing.parentId);
    }
    if (normalizedParentId) {
      await this.invalidateCache(normalizedParentId);
    }
    return updated;
  }

  /**
   * Gắn danh sách chủ đề con vào chủ đề cha (Outbound Hierarchy Linking)
   */
  async assignChildren(
    parentId: string,
    childIds: string[],
  ): Promise<{ count: number; message: string }> {
    const parent = await this.prisma.topic.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException(TOPIC_ERROR_MESSAGES.PARENT_NOT_FOUND);
    }

    if (!childIds || childIds.length === 0) {
      throw new BadRequestException(TOPIC_ERROR_MESSAGES.CHILD_IDS_REQUIRED);
    }

    // Kiểm tra từng chủ đề con: không được tự gán chính mình, chống chu trình lặp và vượt quá độ sâu
    for (const childId of childIds) {
      if (childId === parentId) {
        throw new BadRequestException(
          'Không thể gán một chủ đề làm con của chính nó',
        );
      }
      await this.validateParentHierarchy(parentId, childId);
    }

    // Cập nhật hàng loạt trong transaction
    await this.prisma.$transaction(
      childIds.map((childId) =>
        this.prisma.topic.update({
          where: { id: childId },
          data: {
            parentId: parentId,
            ...(parent.periodId ? { periodId: parent.periodId } : {}),
          },
        }),
      ),
    );

    // Invalidate cache
    await this.invalidateCache(parentId);
    for (const childId of childIds) {
      await this.invalidateCache(childId);
    }

    return {
      count: childIds.length,
      message: `Đã gắn thành công ${childIds.length} chủ đề con vào chủ đề "${parent.name}"`,
    };
  }

  /**
   * Tách / Hủy gắn một chủ đề con khỏi chủ đề cha để trở thành chủ đề gốc độc lập
   */
  async removeChild(
    parentId: string,
    childId: string,
  ): Promise<{ message: string }> {
    const child = await this.prisma.topic.findUnique({
      where: { id: childId },
    });
    if (!child) {
      throw new NotFoundException(TOPIC_ERROR_MESSAGES.NOT_FOUND);
    }

    if (child.parentId !== parentId) {
      throw new BadRequestException(
        TOPIC_ERROR_MESSAGES.CHILD_NOT_BELONG_TO_PARENT,
      );
    }

    await this.prisma.topic.update({
      where: { id: childId },
      data: { parentId: null },
    });

    await this.invalidateCache(parentId);
    await this.invalidateCache(childId);

    return {
      message: `Đã tách chủ đề "${child.name}" thành chủ đề gốc độc lập`,
    };
  }

  /**
   * Cập nhật hàng loạt thứ tự hiển thị của các chủ đề (Batch Reordering)
   */
  async reorder(
    items: ReorderTopicItemDto[],
  ): Promise<{ count: number; message: string }> {
    if (!items || items.length === 0) {
      throw new BadRequestException(TOPIC_ERROR_MESSAGES.REORDER_EMPTY);
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.topic.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    // Invalidate toàn bộ cache danh sách và cache từng topic được reorder
    await this.invalidateCache();
    for (const item of items) {
      await this.invalidateCache(item.id);
    }

    return {
      count: items.length,
      message: TOPIC_SUCCESS_MESSAGES.REORDER_SUCCESS,
    };
  }

  /**
   * Xóa một chủ đề lịch sử (Cascade xóa các chủ đề con theo cấu hình CSDL)
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
   * Lấy cấu trúc cây phân cấp Composite của các Chủ đề
   */
  async getTopicTree(periodId?: string): Promise<ITopicTreeNode[]> {
    const where: Prisma.TopicWhereInput = {};
    if (periodId) {
      where.periodId = periodId;
    }

    const allTopics = await this.prisma.topic.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        lessons: {
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            title: true,
            difficulty: true,
            status: true,
            displayOrder: true,
            thumbnailUrl: true,
            updatedAt: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
        _count: {
          select: {
            children: true,
            lessons: true,
          },
        },
      },
    });

    // Xây dựng cây Composite
    const topicMap = new Map<string, ITopicTreeNode>();
    allTopics.forEach((t) => {
      topicMap.set(t.id, { ...t, children: [] });
    });

    const rootNodes: ITopicTreeNode[] = [];

    topicMap.forEach((node) => {
      if (node.parentId && topicMap.has(node.parentId)) {
        topicMap.get(node.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
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
      this.logger.warn(
        `Failed to clear topic cache: ${err.message}`,
        'TopicService',
      );
    }
  }
}
