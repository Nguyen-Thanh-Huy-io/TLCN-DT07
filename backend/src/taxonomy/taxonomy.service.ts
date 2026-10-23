import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventCategory, Prisma, TaxonomyTerm } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { normalizePreservation } from '../public-content/preservation-status.constant';
import { normalizeSiteType } from '../public-content/site-type.constant';
import {
  CreateTaxonomyTermDto,
  UpdateTaxonomyTermDto,
} from './dto/taxonomy.dto';
import {
  TAXONOMY_GROUPS,
  TAXONOMY_MESSAGES,
  normalizeRank,
} from './taxonomy.constant';
import {
  EventFieldDef,
  collectEventFields,
  descendantIds,
  legacyEventCategory,
} from './event-category.util';

const TERM_ORDER: Prisma.TaxonomyTermOrderByWithRelationInput[] = [
  { displayOrder: 'asc' },
  { label: 'asc' },
];

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Các nhóm danh mục kèm giá trị (mặc định chỉ giá trị đang dùng) — cho trang công khai và CMS. */
  listGroups(codes?: string[], includeInactive = false) {
    return this.prisma.taxonomyGroup.findMany({
      where: codes?.length ? { code: { in: codes } } : undefined,
      orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
      include: {
        terms: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: TERM_ORDER,
        },
      },
    });
  }

  async createTerm(dto: CreateTaxonomyTermDto) {
    const group = await this.prisma.taxonomyGroup.findUnique({
      where: { code: dto.groupCode },
    });
    if (!group)
      throw new NotFoundException(
        TAXONOMY_MESSAGES.GROUP_NOT_FOUND(dto.groupCode),
      );
    await this.assertParentInGroup(dto.parentId, dto.groupCode);
    try {
      return await this.prisma.taxonomyTerm.create({
        data: {
          ...this.toData(dto),
          groupCode: dto.groupCode,
          code: dto.code,
          label: dto.label.trim(),
        },
      });
    } catch (err) {
      throw this.mapUniqueError(err, dto.groupCode, dto.code);
    }
  }

  async updateTerm(id: string, dto: UpdateTaxonomyTermDto) {
    const term = await this.findTerm(id);
    await this.assertParentInGroup(dto.parentId, term.groupCode, id);
    try {
      return await this.prisma.taxonomyTerm.update({
        where: { id },
        data: {
          ...this.toData(dto),
          ...(dto.code !== undefined ? { code: dto.code } : {}),
          ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        },
      });
    } catch (err) {
      throw this.mapUniqueError(err, term.groupCode, dto.code ?? term.code);
    }
  }

  /** Chỉ xóa được giá trị chưa ai dùng; đang dùng thì phải ẩn (isActive = false). */
  async deleteTerm(id: string) {
    await this.findTerm(id);
    const used =
      (await this.prisma.historicalSite.count({
        where: {
          OR: [{ siteTypeId: id }, { preservationId: id }, { rankId: id }],
        },
      })) +
      (await this.prisma.period.count({ where: { regionId: id } })) +
      (await this.prisma.historicalEvent.count({
        where: { categoryIds: { has: id } },
      }));
    if (used > 0)
      throw new ConflictException(TAXONOMY_MESSAGES.TERM_IN_USE(used));
    await this.prisma.taxonomyTerm.delete({ where: { id } });
    return { id };
  }

  /**
   * Đồng bộ khóa ngoại danh mục của một di tích từ các cột chữ (site_type, preservation_status,
   * recognition_level) — gọi sau mỗi lần CMS ghi di tích, trong lúc form CMS còn nhập chữ tự do.
   */
  async syncSiteTerms(entityId: string) {
    const site = await this.prisma.historicalSite.findUnique({
      where: { entityId },
    });
    if (!site) return;
    const terms = await this.prisma.taxonomyTerm.findMany({
      where: {
        groupCode: {
          in: [
            TAXONOMY_GROUPS.SITE_TYPE,
            TAXONOMY_GROUPS.PRESERVATION,
            TAXONOMY_GROUPS.HERITAGE_RANK,
          ],
        },
      },
    });
    const preservation = normalizePreservation(site.preservationStatus);

    await this.prisma.historicalSite.update({
      where: { entityId },
      data: {
        siteTypeId:
          this.matchTerm(terms, TAXONOMY_GROUPS.SITE_TYPE, site.siteType, (v) =>
            normalizeSiteType(v),
          )?.id ?? null,
        preservationId:
          this.matchTerm(
            terms,
            TAXONOMY_GROUPS.PRESERVATION,
            site.preservationStatus,
            () => preservation.category,
          )?.id ?? null,
        // Form CMS chọn mã + nhập ghi chú riêng; chỉ chữ tự do kiểu cũ mới sinh ghi chú tự động.
        ...(preservation.note ? { statusNote: preservation.note } : {}),
        rankId:
          this.matchTerm(
            terms,
            TAXONOMY_GROUPS.HERITAGE_RANK,
            site.recognitionLevel,
            normalizeRank,
          )?.id ?? null,
      },
    });
  }

  /** Chữ tự do / mã → id giá trị đang dùng trong nhóm (khớp mã, nhãn, alias). */
  /**
   * Loại sự kiện cho một lần ghi: danh sách id (CMS) hoặc mã enum cũ (dữ liệu nhập / client cũ).
   * Trả về id đã kiểm tra (loại đầu là loại chính), giá trị enum đồng bộ và các trường thông tin
   * kế thừa theo cây để chuẩn hóa metadata.
   */
  async resolveEventCategories(input: {
    categoryIds?: string[] | null;
    category?: string | null;
  }): Promise<{
    categoryIds: string[];
    category: EventCategory;
    fields: EventFieldDef[];
  }> {
    const terms = await this.prisma.taxonomyTerm.findMany({
      where: { groupCode: TAXONOMY_GROUPS.EVENT_CATEGORY },
    });
    let ids = [...new Set((input.categoryIds ?? []).filter(Boolean))];
    const unknown = ids.filter((id) => !terms.some((t) => t.id === id));
    if (unknown.length) {
      throw new BadRequestException(
        TAXONOMY_MESSAGES.UNKNOWN_TERMS(
          TAXONOMY_GROUPS.EVENT_CATEGORY,
          unknown,
        ),
      );
    }
    if (!ids.length) {
      const matched =
        this.matchTerm(
          terms,
          TAXONOMY_GROUPS.EVENT_CATEGORY,
          input.category ?? null,
          () => null,
        ) ?? terms.find((t) => t.code === EventCategory.OTHER);
      ids = matched ? [matched.id] : [];
    }
    return {
      categoryIds: ids,
      category: legacyEventCategory(terms, ids[0]),
      fields: collectEventFields(terms, ids),
    };
  }

  /** Id loại sự kiện để lọc theo mã / id (kể cả mọi nút con); mã không tồn tại → mảng rỗng. */
  async eventCategoryFilterIds(codeOrId: string) {
    const terms = await this.prisma.taxonomyTerm.findMany({
      where: { groupCode: TAXONOMY_GROUPS.EVENT_CATEGORY },
    });
    const roots = terms
      .filter((t) => t.id === codeOrId || t.code === codeOrId)
      .map((t) => t.id);
    return roots.length ? descendantIds(terms, roots) : [];
  }

  async resolveTermId(group: string, raw: string | null | undefined) {
    if (!raw?.trim()) return undefined;
    const terms = await this.prisma.taxonomyTerm.findMany({
      where: { groupCode: group },
    });
    return this.matchTerm(terms, group, raw, () => null)?.id;
  }

  /**
   * Khớp mã / alias trong DB trước (giá trị thêm từ CMS khớp được ngay), rồi mới tới quy tắc
   * cố định cho dữ liệu chữ tự do cũ.
   */
  private matchTerm(
    terms: TaxonomyTerm[],
    group: string,
    raw: string | null,
    fallback: (value: string) => string | null,
  ) {
    const value = raw?.trim();
    if (!value) return undefined;
    const lower = value.toLocaleLowerCase('vi');
    const inGroup = terms.filter((t) => t.groupCode === group);
    const code = fallback(value);
    return (
      inGroup.find(
        (t) =>
          t.code === value.toUpperCase() ||
          t.label.toLocaleLowerCase('vi') === lower ||
          t.aliases.includes(lower),
      ) ?? (code ? inGroup.find((t) => t.code === code) : undefined)
    );
  }

  private async findTerm(id: string) {
    const term = await this.prisma.taxonomyTerm.findUnique({ where: { id } });
    if (!term)
      throw new NotFoundException(TAXONOMY_MESSAGES.TERM_NOT_FOUND(id));
    return term;
  }

  private async assertParentInGroup(
    parentId: string | undefined,
    groupCode: string,
    selfId?: string,
  ) {
    if (!parentId) return;
    const parent = await this.prisma.taxonomyTerm.findUnique({
      where: { id: parentId },
    });
    if (!parent || parent.groupCode !== groupCode || parent.id === selfId) {
      throw new BadRequestException(TAXONOMY_MESSAGES.PARENT_OTHER_GROUP);
    }
  }

  private toData(dto: UpdateTaxonomyTermDto) {
    return {
      ...(dto.inverseLabel !== undefined
        ? { inverseLabel: dto.inverseLabel }
        : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
      ...(dto.displayOrder !== undefined
        ? { displayOrder: dto.displayOrder }
        : {}),
      ...(dto.aliases !== undefined
        ? {
            aliases: [
              ...new Set(
                dto.aliases
                  .map((a) => a.trim().toLocaleLowerCase('vi'))
                  .filter(Boolean),
              ),
            ],
          }
        : {}),
      ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
      ...(dto.meta !== undefined
        ? { meta: dto.meta as Prisma.InputJsonValue }
        : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };
  }

  private mapUniqueError(err: unknown, group: string, code: string) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return new ConflictException(
        TAXONOMY_MESSAGES.DUPLICATE_CODE(group, code),
      );
    }
    return err;
  }
}
