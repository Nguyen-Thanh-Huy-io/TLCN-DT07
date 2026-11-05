import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { validateHistoricalYearRange } from '../common/utils/historical-date.parser';
import { CreateArticleDto, QueryArticleDto, UpdateArticleDto } from './dto/article.dto';

export const ARTICLE_MESSAGES = {
  NOT_FOUND: (id: string) => `Không tìm thấy bài viết ${id}`,
  SLUG_CONFLICT: (slug: string) => `Đường dẫn "${slug}" đã được dùng cho bài viết khác`,
  CATEGORY_NOT_FOUND: 'Chuyên mục không tồn tại',
  TAG_NOT_FOUND: 'Có tag không tồn tại',
} as const;

/** Include dùng chung cho danh sách & chi tiết (category + tag). */
const ARTICLE_INCLUDE = {
  category: { select: { id: true, name: true, slug: true, icon: true } },
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
    const { page = 1, limit = 20, search, categoryId, tagId, status, featured, sort } = query;
    const where: Prisma.ArticleWhereInput = {
      ...(categoryId ? { categoryId } : {}),
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
        // Danh sách không cần nội dung khối (nặng).
        omit: { contentBlocks: true },
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

  async findOne(id: string) {
    const row = await this.prisma.article.findUnique({
      where: { id },
      include: {
        ...ARTICLE_INCLUDE,
        timelineNodes: {
          select: { id: true, title: true, timeline: { select: { id: true, title: true, slug: true } } },
        },
      },
    });
    if (!row) throw new NotFoundException(ARTICLE_MESSAGES.NOT_FOUND(id));
    return present(row);
  }

  async create(dto: CreateArticleDto, authorId?: string) {
    const { tagIds, ...data } = dto;
    await this.validate(dto);
    const slug = dto.slug
      ? await this.assertSlugFree(dto.slug)
      : await this.slugService.generateUnique(dto.title, (s) => this.slugExists(s));

    const created = await this.prisma.article.create({
      data: {
        ...data,
        slug,
        contentBlocks: (data.contentBlocks ?? []) as Prisma.InputJsonValue,
        createdBy: authorId ?? null,
        publishedAt: data.status === ContentStatus.PUBLISHED ? new Date() : null,
        articleTags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
    });
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateArticleDto) {
    const current = await this.prisma.article.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(ARTICLE_MESSAGES.NOT_FOUND(id));
    await this.validate({
      ...dto,
      startYear: dto.startYear !== undefined ? dto.startYear : current.startYear,
      endYear: dto.endYear !== undefined ? dto.endYear : current.endYear,
    });
    if (dto.slug && dto.slug !== current.slug) await this.assertSlugFree(dto.slug, id);

    const { tagIds, contentBlocks, ...data } = dto;
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
          ...(becomesPublished ? { publishedAt: new Date() } : {}),
        },
      });
      if (tagIds !== undefined) {
        await tx.articleTag.deleteMany({ where: { articleId: id } });
        if (tagIds.length) {
          await tx.articleTag.createMany({ data: tagIds.map((tagId) => ({ articleId: id, tagId })) });
        }
      }
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    // Mốc timeline trỏ tới bài này tự về null (onDelete: SetNull), tag nối tự xoá (Cascade).
    await this.prisma.article.delete({ where: { id } });
    return { success: true };
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
