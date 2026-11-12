import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { validateHistoricalYearRange } from '../common/utils/historical-date.parser';
import {
  CreateTimelineDto,
  QueryTimelineDto,
  TimelineNodeInputDto,
  UpdateTimelineDto,
} from './dto/timeline.dto';

export const TIMELINE_MESSAGES = {
  NOT_FOUND: (id: string) => `Không tìm thấy dòng thời gian ${id}`,
  SLUG_CONFLICT: (slug: string) =>
    `Đường dẫn "${slug}" đã được dùng cho dòng thời gian khác`,
  ARTICLE_NOT_FOUND: 'Có mốc trỏ tới bài viết không tồn tại',
} as const;

/** Mốc kèm thông tin bài viết liên kết (đủ để hiển thị thẻ + link). */
export const TIMELINE_NODE_INCLUDE = {
  article: {
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      coverImageUrl: true,
      status: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          kind: true,
          parentId: true,
        },
      },
      /** Bài khác liên kết tới bài của mốc (vd. nhân vật → sự kiện) — CMS hiện "Gắn với ...". */
      linksIn: {
        orderBy: { displayOrder: 'asc' },
        select: {
          label: true,
          source: {
            select: {
              id: true,
              title: true,
              category: {
                select: { id: true, name: true, kind: true, parentId: true },
              },
            },
          },
        },
      },
      /** Bài của mốc liên kết tới (vd. sự kiện → nhân vật / di tích). */
      linksOut: {
        orderBy: { displayOrder: 'asc' },
        select: {
          label: true,
          target: {
            select: {
              id: true,
              title: true,
              category: {
                select: { id: true, name: true, kind: true, parentId: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.TimelineNodeInclude;

@Injectable()
export class TimelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
  ) {}

  async findAll(query: QueryTimelineDto) {
    const { page = 1, limit = 20, search, status, topicId } = query;
    const where: Prisma.TimelineWhereInput = {
      ...(status ? { status } : {}),
      ...(topicId ? { topicId } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.timeline.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          topic: { select: { id: true, name: true, slug: true } },
          _count: { select: { nodes: true } },
        },
      }),
      this.prisma.timeline.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const timeline = await this.prisma.timeline.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, name: true, slug: true } },
        nodes: {
          orderBy: { displayOrder: 'asc' },
          include: TIMELINE_NODE_INCLUDE,
        },
      },
    });
    if (!timeline) throw new NotFoundException(TIMELINE_MESSAGES.NOT_FOUND(id));
    return timeline;
  }

  async create(dto: CreateTimelineDto) {
    const { nodes, ...data } = dto;
    await this.validateNodes(nodes);
    const slug = dto.slug
      ? await this.assertSlugFree(dto.slug)
      : await this.slugService.generateUnique(dto.title, (s) =>
          this.slugExists(s),
        );
    const created = await this.prisma.timeline.create({
      data: {
        ...data,
        slug,
        nodes: nodes?.length
          ? { create: nodes.map((n, i) => this.toNodeData(n, i)) }
          : undefined,
      },
    });
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateTimelineDto) {
    const current = await this.prisma.timeline.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!current) throw new NotFoundException(TIMELINE_MESSAGES.NOT_FOUND(id));
    if (dto.slug && dto.slug !== current.slug)
      await this.assertSlugFree(dto.slug, id);
    const { nodes, ...data } = dto;
    await this.validateNodes(nodes);

    await this.prisma.$transaction(async (tx) => {
      await tx.timeline.update({ where: { id }, data });
      if (nodes !== undefined) {
        await tx.timelineNode.deleteMany({ where: { timelineId: id } });
        if (nodes.length) {
          await tx.timelineNode.createMany({
            data: nodes.map((n, i) => ({
              ...this.toNodeData(n, i),
              timelineId: id,
            })),
          });
        }
      }
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.timeline.delete({ where: { id } });
    return { success: true };
  }

  private toNodeData(n: TimelineNodeInputDto, index: number) {
    return {
      articleId: n.articleId ?? null,
      title: n.title,
      description: n.description ?? null,
      imageUrl: n.imageUrl ?? null,
      dateText: n.dateText ?? null,
      year: n.year ?? null,
      month: n.month ?? null,
      day: n.day ?? null,
      endYear: n.endYear ?? null,
      displayOrder: index,
    };
  }

  private async validateNodes(nodes?: TimelineNodeInputDto[]) {
    if (!nodes?.length) return;
    for (const n of nodes) validateHistoricalYearRange(n.year, n.endYear);
    const articleIds = [
      ...new Set(nodes.map((n) => n.articleId).filter((v): v is string => !!v)),
    ];
    if (articleIds.length) {
      const found = await this.prisma.article.count({
        where: { id: { in: articleIds } },
      });
      if (found !== articleIds.length)
        throw new BadRequestException(TIMELINE_MESSAGES.ARTICLE_NOT_FOUND);
    }
  }

  private async slugExists(slug: string, exceptId?: string) {
    const found = await this.prisma.timeline.findUnique({
      where: { slug },
      select: { id: true },
    });
    return Boolean(found && found.id !== exceptId);
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    if (await this.slugExists(slug, exceptId)) {
      throw new ConflictException(TIMELINE_MESSAGES.SLUG_CONFLICT(slug));
    }
    return slug;
  }
}
