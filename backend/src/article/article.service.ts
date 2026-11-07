import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { validateHistoricalYearRange } from '../common/utils/historical-date.parser';
import { ACCESS_MESSAGES } from '../common/access/access.constant';
import {
  ArticleLinkInputDto,
  CreateArticleDto,
  QueryArticleDto,
  ReviewArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { normalizeArticleMetadata } from './article-metadata';

export const ARTICLE_MESSAGES = {
  NOT_FOUND: (id: string) => `Không tìm thấy bài viết ${id}`,
  SLUG_CONFLICT: (slug: string) => `Đường dẫn "${slug}" đã được dùng cho bài viết khác`,
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
  category: { select: { id: true, name: true, slug: true, kind: true, parentId: true } },
} satisfies Prisma.ArticleSelect;

/** Include dùng chung cho danh sách & chi tiết (category + topic + tag). */
const ARTICLE_INCLUDE = {
  category: { select: { id: true, name: true, slug: true, icon: true, kind: true, parentId: true } },
  topic: { select: { id: true, name: true, slug: true } },
  articleTags: { include: { tag: { select: { id: true, name: true, colorHex: true } } } },
} satisfies Prisma.ArticleInclude;

type ArticleRow = Prisma.ArticleGetPayload<{ include: typeof ARTICLE_INCLUDE }>;

/** Phẳng hoá articleTags → tags + tagIds (tagIds khớp payload của API cập nhật / bản sửa). */
function present<T extends ArticleRow>(row: T) {
  const { articleTags, ...rest } = row;
  const tags = articleTags.map((at) => at.tag);
  return { ...rest, tags, tagIds: tags.map((t) => t.id) };
}

@Injectable()
export class ArticleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
  ) {}

  async findAll(query: QueryArticleDto) {
    const { page = 1, limit = 20, search, categoryId, topicId, tagId, status, featured, sort } = query;
    const where: Prisma.ArticleWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(topicId ? { topicId } : {}),
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
    return {
      items: rows.map(present),
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
        timelineNodes: { select: NODE_REF_SELECT, orderBy: { displayOrder: 'asc' } },
        linksOut: { orderBy: { displayOrder: 'asc' }, include: { target: { select: LINKED_ARTICLE_SELECT } } },
        linksIn: { orderBy: { displayOrder: 'asc' }, include: { source: { select: LINKED_ARTICLE_SELECT } } },
      },
    });
    if (!row) throw new NotFoundException(ARTICLE_MESSAGES.NOT_FOUND(id));
    const { linksOut, linksIn, ...rest } = row;
    return {
      ...present(rest),
      links: linksOut.map((l) => ({ targetId: l.targetId, label: l.label, note: l.note })),
      linksOut: linksOut.map((l) => ({ id: l.id, label: l.label, note: l.note, article: l.target })),
      linksIn: linksIn.map((l) => ({ id: l.id, label: l.label, note: l.note, article: l.source })),
    };
  }

  private async resolveEffectiveArticleStatus(
    categoryId: string | null | undefined,
    requestedStatus: ContentStatus | undefined,
  ): Promise<ContentStatus | undefined> {
    if (!categoryId) return requestedStatus;

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true, slug: true },
    });

    if (!category) return requestedStatus;

    const normalizedName = `${category.name ?? ''} ${category.slug ?? ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const isBlogCategory = ['blog', 'bai-viet', 'bai viet', 'bài viết'].some((token) =>
      normalizedName.includes(token),
    );

    if (isBlogCategory && (!requestedStatus || requestedStatus === ContentStatus.DRAFT)) {
      return ContentStatus.PENDING_REVIEW;
    }

    return requestedStatus;
  }

  async create(dto: CreateArticleDto, authorId?: string) {
    const effectiveStatus = await this.resolveEffectiveArticleStatus(dto.categoryId, dto.status);
    const normalizedDto = { ...dto, status: effectiveStatus };
    const { tagIds, metadata, links, ...data } = normalizedDto;
    await this.validate(normalizedDto);
    await this.validateLinks(links);
    const meta = normalizeArticleMetadata(metadata);
    const slug = normalizedDto.slug
      ? await this.assertSlugFree(normalizedDto.slug)
      : await this.slugService.generateUnique(normalizedDto.title, (s) => this.slugExists(s));

    const created = await this.prisma.article.create({
      data: {
        ...data,
        slug,
        contentBlocks: (data.contentBlocks ?? []) as Prisma.InputJsonValue,
        metadata: meta ? (meta as Prisma.InputJsonValue) : Prisma.DbNull,
        createdBy: authorId ?? null,
        publishedAt: data.status === ContentStatus.PUBLISHED ? new Date() : null,
        articleTags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
        linksOut: links?.length ? { create: links.map((l, i) => this.toLinkData(l, i)) } : undefined,
      },
    });
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateArticleDto) {
    const current = await this.prisma.article.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(ARTICLE_MESSAGES.NOT_FOUND(id));
    const effectiveStatus = await this.resolveEffectiveArticleStatus(
      dto.categoryId ?? current.categoryId,
      dto.status ?? current.status,
    );
    const normalizedDto = { ...dto, status: effectiveStatus };
    await this.validate({
      ...normalizedDto,
      startYear: normalizedDto.startYear !== undefined ? normalizedDto.startYear : current.startYear,
      endYear: normalizedDto.endYear !== undefined ? normalizedDto.endYear : current.endYear,
    });
    await this.validateLinks(normalizedDto.links, id);
    if (normalizedDto.slug && normalizedDto.slug !== current.slug) await this.assertSlugFree(normalizedDto.slug, id);

    const { tagIds, contentBlocks, metadata, links, ...data } = normalizedDto;
    const meta = metadata !== undefined ? normalizeArticleMetadata(metadata) : undefined;
    const becomesPublished =
      data.status === ContentStatus.PUBLISHED && current.status !== ContentStatus.PUBLISHED;

    await this.prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: {
          ...data,
          ...(contentBlocks !== undefined
            ? { contentBlocks: contentBlocks as Prisma.InputJsonValue }
            : {}),
          ...(meta !== undefined
            ? { metadata: meta ? (meta as Prisma.InputJsonValue) : Prisma.DbNull }
            : {}),
          ...(becomesPublished ? { publishedAt: new Date() } : {}),
        },
      });
      if (tagIds !== undefined) {
        await tx.articleTag.deleteMany({ where: { articleId: id } });
        if (tagIds.length) {
          await tx.articleTag.createMany({ data: tagIds.map((tagId) => ({ articleId: id, tagId })) });
        }
      }
      // Liên kết: thay toàn bộ danh sách do bài này khai báo (liên kết bài khác trỏ tới bài này giữ nguyên).
      if (links !== undefined) {
        await tx.articleLink.deleteMany({ where: { sourceId: id } });
        if (links.length) {
          await tx.articleLink.createMany({
            data: links.map((l, i) => ({ ...this.toLinkData(l, i), sourceId: id })),
          });
        }
      }
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    // Mốc timeline trỏ tới bài → null (SetNull); tag nối, liên kết 2 chiều tự xoá (Cascade).
    await this.prisma.article.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Phê duyệt / Từ chối bài viết mới (Quy trình 2 người: người duyệt khác người tạo).
   */
  async review(
    id: string,
    dto: ReviewArticleDto,
    reviewerUserId?: string,
  ) {
    const current = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true, status: true, createdBy: true },
    });
    if (!current) throw new NotFoundException(ARTICLE_MESSAGES.NOT_FOUND(id));

    if (current.status !== ContentStatus.PENDING_REVIEW) {
      throw new ForbiddenException('Chỉ duyệt được bài viết đang ở trạng thái chờ duyệt (PENDING_REVIEW).');
    }
    if (reviewerUserId && current.createdBy === reviewerUserId) {
      throw new ForbiddenException('Bạn không thể tự duyệt bài viết do chính mình biên soạn.');
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
        rejectionReason: dto.status === ContentStatus.REJECTED ? dto.rejectionReason?.trim() : null,
      },
    });

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

  private async validateLinks(links: ArticleLinkInputDto[] | undefined, selfId?: string) {
    if (!links?.length) return;
    const ids = links.map((l) => l.targetId);
    if (selfId && ids.includes(selfId)) throw new BadRequestException(ARTICLE_MESSAGES.LINK_SELF);
    const unique = new Set(ids);
    if (unique.size !== ids.length) throw new BadRequestException(ARTICLE_MESSAGES.LINK_DUPLICATE);
    const found = await this.prisma.article.count({ where: { id: { in: [...unique] } } });
    if (found !== unique.size) throw new BadRequestException(ARTICLE_MESSAGES.LINK_TARGET_NOT_FOUND);
  }

  private async validate(dto: Partial<CreateArticleDto>) {
    validateHistoricalYearRange(dto.startYear, dto.endYear);
    if (dto.categoryId) {
      const found = await this.prisma.category.count({ where: { id: dto.categoryId } });
      if (!found) throw new BadRequestException(ARTICLE_MESSAGES.CATEGORY_NOT_FOUND);
    }
    if (dto.tagIds?.length) {
      const unique = [...new Set(dto.tagIds)];
      const found = await this.prisma.tag.count({ where: { id: { in: unique } } });
      if (found !== unique.length) throw new BadRequestException(ARTICLE_MESSAGES.TAG_NOT_FOUND);
      dto.tagIds = unique;
    }
  }

  private async slugExists(slug: string, exceptId?: string) {
    const found = await this.prisma.article.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(found && found.id !== exceptId);
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    if (await this.slugExists(slug, exceptId)) {
      throw new ConflictException(ARTICLE_MESSAGES.SLUG_CONFLICT(slug));
    }
    return slug;
  }
}
