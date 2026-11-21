import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentStatus, Prisma } from '@prisma/client';
import {
  AUTHOR_FOLLOW_EVENTS,
  AuthorPublishedContentType,
  type AuthorPublishedPayload,
} from '../common/constants/follow-events.constant';
import { PrismaService } from '../common/services/prisma.service';
import { loadAuthorNames } from '../common/utils/author-names';
import { SlugService } from '../common/services/slug.service';
import { RedisService } from '../common/services/redis.service';
import { TAG_CONFIG } from '../tag/tag.constant';
import { validateHistoricalYearRange } from '../common/utils/historical-date.parser';
import {
  ArticleLinkInputDto,
  CreateArticleDto,
  QueryArticleDto,
  ReviewArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { toArticleMetadataJson } from './article-metadata';

export const ARTICLE_MESSAGES = {
  NOT_FOUND: (id: string) => `Không tìm thấy bài viết ${id}`,
  SLUG_CONFLICT: (slug: string) =>
    `Đường dẫn "${slug}" đã được dùng cho bài viết khác`,
  CATEGORY_NOT_FOUND: 'Chuyên mục không tồn tại',
  TAG_NOT_FOUND: 'Có tag không tồn tại',
  LINK_TARGET_NOT_FOUND: 'Có liên kết trỏ tới bài viết không tồn tại',
  LINK_SELF: 'Bài viết không thể liên kết tới chính nó',
  LINK_DUPLICATE: 'Mỗi bài viết chỉ liên kết tới cùng 1 bài khác một lần',
} as const;

/** Mốc timeline (đủ để biết năm + thuộc dòng thời gian nào). */
const NODE_REF_SELECT = {
  id: true,
  title: true,
  description: true,
  dateText: true,
  year: true,
  month: true,
  day: true,
  endYear: true,
  timeline: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.TimelineNodeSelect;

/** Bài ở đầu bên kia liên kết — kèm năm + mốc timeline để CMS xem trước dòng đời nhân vật. */
const LINKED_ARTICLE_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  summary: true,
  dateText: true,
  startYear: true,
  endYear: true,
  timelineNodes: { select: NODE_REF_SELECT, orderBy: { displayOrder: 'asc' } },
  category: {
    select: { id: true, name: true, slug: true, kind: true, parentId: true },
  },
} satisfies Prisma.ArticleSelect;

/** Include dùng chung cho danh sách & chi tiết (category + topic + tag). */
const ARTICLE_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      kind: true,
      parentId: true,
    },
  },
  topic: { select: { id: true, name: true, slug: true } },
  articleTags: {
    include: { tag: { select: { id: true, name: true, colorHex: true } } },
  },
} satisfies Prisma.ArticleInclude;

type ArticleRow = Prisma.ArticleGetPayload<{ include: typeof ARTICLE_INCLUDE }>;

/** Phẳng hoá articleTags → tags + tagIds (tagIds khớp payload của API cập nhật / bản sửa). */
function present<T extends Pick<ArticleRow, 'articleTags'>>(row: T) {
  const { articleTags, ...rest } = row;
  const tags = articleTags.map((at) => at.tag);
  return { ...rest, tags, tagIds: tags.map((t) => t.id) };
}

@Injectable()
export class ArticleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
    private readonly redis: RedisService,
    @Optional() private readonly eventEmitter?: EventEmitter2,
  ) {}

  private emitAuthorContentPublished(
    authorId: string | null | undefined,
    title: string,
    slug: string,
  ): void {
    if (!this.eventEmitter || !authorId) return;
    const payload: AuthorPublishedPayload = {
      authorId,
      contentType: AuthorPublishedContentType.ARTICLE,
      title,
      slug,
    };
    this.eventEmitter.emit(AUTHOR_FOLLOW_EVENTS.CONTENT_PUBLISHED, payload);
  }

  /** Danh sách Tag được cache kèm số bài dùng tag — đổi tag của bài thì phải xoá. */
  private async clearTagCache(): Promise<void> {
    await this.redis.deleteByPattern(TAG_CONFIG.TAG_CACHE_PATTERN);
  }

  /** Gom topicId và toàn bộ topicId con/cháu (duyệt đệ quy không giới hạn độ sâu). */
  private async collectTopicSubtreeIds(rootTopicId: string): Promise<string[]> {
    const allTopics = await this.prisma.topic.findMany({
      select: { id: true, parentId: true },
    });
    const childrenMap = new Map<string, string[]>();
    for (const t of allTopics) {
      if (t.parentId) {
        const list = childrenMap.get(t.parentId) ?? [];
        list.push(t.id);
        childrenMap.set(t.parentId, list);
      }
    }
    const collected = new Set<string>();
    const visit = (id: string) => {
      if (collected.has(id)) return;
      collected.add(id);
      for (const childId of childrenMap.get(id) ?? []) {
        visit(childId);
      }
    };
    visit(rootTopicId);
    return [...collected];
  }

  async findAll(query: QueryArticleDto) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      topicId,
      tagId,
      status,
      featured,
      sort,
    } = query;
    const topicIds = topicId
      ? await this.collectTopicSubtreeIds(topicId)
      : null;
    const where: Prisma.ArticleWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(topicIds ? { topicId: { in: topicIds } } : {}),
      ...(tagId ? { articleTags: { some: { tagId } } } : {}),
      ...(status ? { status } : {}),
      ...(featured ? { isFeatured: true } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { summary: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
      sort === 'year'
        ? [{ startYear: { sort: 'asc', nulls: 'last' } }, { title: 'asc' }]
        : sort === 'title'
          ? [{ title: 'asc' }]
          : [{ updatedAt: 'desc' }];

    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        // Danh sách không cần nội dung khối / hồ sơ (nặng).
        omit: { contentBlocks: true, metadata: true },
        include: ARTICLE_INCLUDE,
      }),
      this.prisma.article.count({ where }),
    ]);
    const nameOf = await loadAuthorNames(
      this.prisma,
      rows.map((r) => r.createdBy),
    );
    return {
      items: rows.map((row) => ({
        ...present(row),
        creatorName: nameOf(row.createdBy),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Chi tiết cho CMS. `links` = liên kết do bài này khai báo, đúng dạng payload ghi (dùng cho form
   * và bản sửa chờ duyệt); `linksOut` / `linksIn` kèm thông tin bài ở đầu kia để hiển thị.
   */
  async findOne(id: string) {
    const row = await this.prisma.article.findUnique({
      where: { id },
      include: {
        ...ARTICLE_INCLUDE,
        timelineNodes: {
          select: NODE_REF_SELECT,
          orderBy: { displayOrder: 'asc' },
        },
        linksOut: {
          orderBy: { displayOrder: 'asc' },
          include: { target: { select: LINKED_ARTICLE_SELECT } },
        },
        linksIn: {
          orderBy: { displayOrder: 'asc' },
          include: { source: { select: LINKED_ARTICLE_SELECT } },
        },
      },
    });
    if (!row) throw new NotFoundException(ARTICLE_MESSAGES.NOT_FOUND(id));
    const { linksOut, linksIn, ...rest } = row;
    return {
      ...present(rest),
      links: linksOut.map((l) => ({
        targetId: l.targetId,
        label: l.label,
        note: l.note,
      })),
      linksOut: linksOut.map((l) => ({
        id: l.id,
        label: l.label,
        note: l.note,
        article: l.target,
      })),
      linksIn: linksIn.map((l) => ({
        id: l.id,
        label: l.label,
        note: l.note,
        article: l.source,
      })),
    };
  }

  async create(dto: CreateArticleDto, authorId?: string) {
    const { tagIds, metadata, links, ...data } = dto;
    await this.validate(dto);
    await this.validateLinks(links);
    const slug = dto.slug
      ? await this.assertSlugFree(dto.slug)
      : await this.slugService.generateUnique(dto.title, (s) =>
          this.slugExists(s),
        );

    const created = await this.prisma.article.create({
      data: {
        ...data,
        slug,
        contentBlocks: (data.contentBlocks ?? []) as Prisma.InputJsonValue,
        metadata: toArticleMetadataJson(metadata),
        createdBy: authorId ?? null,
        publishedAt:
          data.status === ContentStatus.PUBLISHED ? new Date() : null,
        articleTags: tagIds?.length
          ? { create: [...new Set(tagIds)].map((tagId) => ({ tagId })) }
          : undefined,
        linksOut: links?.length
          ? { create: links.map((l, i) => this.toLinkData(l, i)) }
          : undefined,
      },
    });
    if (tagIds?.length) await this.clearTagCache();
    if (created.status === ContentStatus.PUBLISHED) {
      this.emitAuthorContentPublished(
        created.createdBy,
        created.title,
        created.slug,
      );
    }
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateArticleDto) {
    const current = await this.prisma.article.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(ARTICLE_MESSAGES.NOT_FOUND(id));
    const normalizedDto = { ...dto, status: dto.status ?? current.status };
    await this.validate({
      ...normalizedDto,
      startYear:
        normalizedDto.startYear !== undefined
          ? normalizedDto.startYear
          : current.startYear,
      endYear:
        normalizedDto.endYear !== undefined
          ? normalizedDto.endYear
          : current.endYear,
    });
    await this.validateLinks(normalizedDto.links, id);
    if (normalizedDto.slug && normalizedDto.slug !== current.slug)
      await this.assertSlugFree(normalizedDto.slug, id);

    const { tagIds, contentBlocks, metadata, links, ...data } = normalizedDto;
    const becomesPublished =
      data.status === ContentStatus.PUBLISHED &&
      current.status !== ContentStatus.PUBLISHED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.article.update({
        where: { id },
        data: {
          ...data,
          ...(contentBlocks !== undefined
            ? { contentBlocks: contentBlocks as Prisma.InputJsonValue }
            : {}),
          ...(metadata !== undefined
            ? { metadata: toArticleMetadataJson(metadata) }
            : {}),
          ...(becomesPublished ? { publishedAt: new Date() } : {}),
        },
      });
      if (tagIds !== undefined) {
        await tx.articleTag.deleteMany({ where: { articleId: id } });
        if (tagIds.length) {
          await tx.articleTag.createMany({
            data: [...new Set(tagIds)].map((tagId) => ({
              articleId: id,
              tagId,
            })),
          });
        }
      }
      // Liên kết: thay toàn bộ danh sách do bài này khai báo (liên kết bài khác trỏ tới bài này giữ nguyên).
      if (links !== undefined) {
        await tx.articleLink.deleteMany({ where: { sourceId: id } });
        if (links.length) {
          await tx.articleLink.createMany({
            data: links.map((l, i) => ({
              ...this.toLinkData(l, i),
              sourceId: id,
            })),
          });
        }
      }
      return saved;
    });
    if (tagIds !== undefined) await this.clearTagCache();
    if (becomesPublished && updated) {
      this.emitAuthorContentPublished(
        updated.createdBy,
        updated.title,
        updated.slug,
      );
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    // Mốc timeline trỏ tới bài → null (SetNull); tag nối, liên kết 2 chiều tự xoá (Cascade).
    await this.prisma.article.delete({ where: { id } });
    await this.clearTagCache();
    return { success: true };
  }

  /**
   * Phê duyệt / Từ chối bài viết mới (Quy trình 2 người: người duyệt khác người tạo).
   */
  async review(id: string, dto: ReviewArticleDto, reviewerUserId?: string) {
    const current = await this.prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdBy: true,
      },
    });
    if (!current) throw new NotFoundException(ARTICLE_MESSAGES.NOT_FOUND(id));

    if (current.status !== ContentStatus.PENDING_REVIEW) {
      throw new ForbiddenException(
        'Chỉ duyệt được bài viết đang ở trạng thái chờ duyệt (PENDING_REVIEW).',
      );
    }
    if (reviewerUserId && current.createdBy === reviewerUserId) {
      throw new ForbiddenException(
        'Người tạo không được tự duyệt bài viết của chính mình.',
      );
    }
    if (dto.status === ContentStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối bài viết.');
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        status: dto.status,
        approvedBy: reviewerUserId || null,
        publishedAt: dto.status === ContentStatus.PUBLISHED ? new Date() : null,
        rejectionReason:
          dto.status === ContentStatus.REJECTED
            ? dto.rejectionReason?.trim()
            : null,
      },
    });

    if (updated.status === ContentStatus.PUBLISHED) {
      this.emitAuthorContentPublished(
        updated.createdBy,
        updated.title,
        updated.slug,
      );
    }
    return this.findOne(updated.id);
  }

  private toLinkData(l: ArticleLinkInputDto, index: number) {
    return {
      targetId: l.targetId,
      label: l.label?.trim() || null,
      note: l.note?.trim() || null,
      displayOrder: index,
    };
  }

  private async validateLinks(
    links: ArticleLinkInputDto[] | undefined,
    selfId?: string,
  ) {
    if (!links?.length) return;
    const ids = links.map((l) => l.targetId);
    if (selfId && ids.includes(selfId))
      throw new BadRequestException(ARTICLE_MESSAGES.LINK_SELF);
    const unique = new Set(ids);
    if (unique.size !== ids.length)
      throw new BadRequestException(ARTICLE_MESSAGES.LINK_DUPLICATE);
    const found = await this.prisma.article.count({
      where: { id: { in: [...unique] } },
    });
    if (found !== unique.size)
      throw new BadRequestException(ARTICLE_MESSAGES.LINK_TARGET_NOT_FOUND);
  }

  private async validate(dto: Partial<CreateArticleDto>) {
    validateHistoricalYearRange(dto.startYear, dto.endYear);
    if (dto.categoryId) {
      const found = await this.prisma.category.count({
        where: { id: dto.categoryId },
      });
      if (!found)
        throw new BadRequestException(ARTICLE_MESSAGES.CATEGORY_NOT_FOUND);
    }
    if (dto.tagIds?.length) {
      const unique = [...new Set(dto.tagIds)];
      const found = await this.prisma.tag.count({
        where: { id: { in: unique } },
      });
      if (found !== unique.length)
        throw new BadRequestException(ARTICLE_MESSAGES.TAG_NOT_FOUND);
    }
  }

  private async slugExists(slug: string, exceptId?: string) {
    const found = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    return Boolean(found && found.id !== exceptId);
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    if (await this.slugExists(slug, exceptId)) {
      throw new ConflictException(ARTICLE_MESSAGES.SLUG_CONFLICT(slug));
    }
    return slug;
  }
}
