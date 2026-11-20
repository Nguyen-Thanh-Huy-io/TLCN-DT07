import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

export const CATEGORY_MESSAGES = {
  NOT_FOUND: (id: string) => `Không tìm thấy chuyên mục ${id}`,
  SLUG_CONFLICT: (slug: string) =>
    `Đường dẫn "${slug}" đã được dùng cho chuyên mục khác`,
  PARENT_NOT_FOUND: 'Chuyên mục cha không tồn tại',
  PARENT_CYCLE:
    'Không thể chọn chính chuyên mục này hoặc chuyên mục con của nó làm chuyên mục cha',
  HAS_ARTICLES: (count: number) =>
    `Chuyên mục còn ${count} bài viết — hãy chuyển bài viết sang chuyên mục khác trước khi xoá`,
} as const;

/** Chuyên mục bài viết — danh sách phẳng có parentId (cây nông, thường 1-2 cấp). */
@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
  ) {}

  /** Toàn bộ chuyên mục (số lượng nhỏ, không phân trang), kèm số bài viết. */
  findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { articles: true } } },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { articles: true } },
      },
    });
    if (!category) throw new NotFoundException(CATEGORY_MESSAGES.NOT_FOUND(id));
    return category;
  }

  async create(dto: CreateCategoryDto) {
    await this.assertParent(null, dto.parentId);
    const slug = dto.slug
      ? await this.assertSlugFree(dto.slug)
      : await this.slugService.generateUnique(dto.name, (s) =>
          this.slugExists(s),
        );
    return this.prisma.category.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    await this.assertParent(id, dto.parentId);
    if (dto.slug) await this.assertSlugFree(dto.slug, id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (category._count.articles > 0) {
      throw new BadRequestException(
        CATEGORY_MESSAGES.HAS_ARTICLES(category._count.articles),
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  private async slugExists(slug: string, exceptId?: string) {
    const found = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    return Boolean(found && found.id !== exceptId);
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    if (await this.slugExists(slug, exceptId)) {
      throw new ConflictException(CATEGORY_MESSAGES.SLUG_CONFLICT(slug));
    }
    return slug;
  }

  /** Chặn cha không tồn tại và vòng lặp cha – con. */
  private async assertParent(selfId: string | null, parentId?: string | null) {
    if (!parentId) return;
    let cursor: string | null = parentId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === selfId || seen.has(cursor)) {
        throw new BadRequestException(CATEGORY_MESSAGES.PARENT_CYCLE);
      }
      seen.add(cursor);
      const row: { parentId: string | null } | null =
        await this.prisma.category.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        });
      if (!row)
        throw new BadRequestException(CATEGORY_MESSAGES.PARENT_NOT_FOUND);
      cursor = row.parentId;
    }
  }
}
