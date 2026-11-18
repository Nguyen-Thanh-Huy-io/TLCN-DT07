import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NoteKind, NoteTargetType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { REVISION_CONTENT_TYPES } from '../content-revision/content-revision.constant';
import { ContentRevisionService } from '../content-revision/content-revision.service';
import {
  CreateNoteDto,
  NOTE_KINDS_WITHOUT_CONTENT,
  NoteAnchorDto,
  QueryNoteDto,
  UpdateNoteDto,
} from './dto/note.dto';
import { NoteStrategyRegistry } from './strategies/note-target.strategy';

const REVISION_TYPE_OF_TARGET = {
  [NoteTargetType.ARTICLE]: REVISION_CONTENT_TYPES.ARTICLE,
  [NoteTargetType.LESSON]: REVISION_CONTENT_TYPES.LESSON,
} as const;

/** Bỏ khoảng trắng thừa, nhãn rỗng và nhãn trùng. */
const normalizeLabels = (labels: string[]) => [
  ...new Set(labels.map((label) => label.trim()).filter(Boolean)),
];

/** Chỉ lưu các khoá có giá trị của vị trí. */
const toAnchorJson = (anchor: NoteAnchorDto): Prisma.InputJsonObject =>
  Object.fromEntries(
    Object.entries(anchor).filter(([, value]) => typeof value === 'string'),
  );

@Injectable()
export class NoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strategyRegistry: NoteStrategyRegistry,
    private readonly contentRevision: ContentRevisionService,
  ) {}

  /** Phiên bản hiện hành của bài, để biết ghi chú được gắn ở bản nào (bài sửa sau đó thì dò lại vị trí). */
  private contentVersionOf(targetType: NoteTargetType, targetId: string) {
    return this.contentRevision.liveVersion(
      REVISION_TYPE_OF_TARGET[targetType],
      targetId,
    );
  }

  /** Nhãn người học đã dùng (mọi bài), để gợi ý khi gõ. */
  async findLabels(userId?: string, guestId?: string): Promise<string[]> {
    if (!userId && !guestId) return [];
    const owner = userId
      ? Prisma.sql`user_id = ${userId}`
      : Prisma.sql`guest_id = ${guestId}`;
    const rows = await this.prisma.$queryRaw<{ label: string }[]>`
      SELECT DISTINCT unnest(labels) AS label FROM notes WHERE ${owner} ORDER BY 1`;
    return rows.map((row) => row.label);
  }

  async findAll(userId?: string, query?: QueryNoteDto) {
    if (!userId && !query?.guestId) return [];

    const where: Prisma.NoteWhereInput = {};

    if (query?.targetType) {
      where.targetType = query.targetType;
    }
    if (query?.targetId) {
      where.targetId = query.targetId;
    }

    // Lọc theo người dùng hoặc mã khách
    if (userId) {
      where.OR = [
        { userId },
        ...(query?.guestId ? [{ guestId: query.guestId }] : []),
      ];
    } else if (query?.guestId) {
      where.guestId = query.guestId;
    }

    const items = await this.prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return items;
  }

  async findOne(id: string, userId?: string, guestId?: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú có ID: ${id}`);
    }

    this.assertOwnership(note, userId, guestId);

    return note;
  }

  async create(dto: CreateNoteDto, userId?: string) {
    const strategy = this.strategyRegistry.getStrategy(dto.targetType);
    const isValid = await strategy.validateTarget(dto.targetId);

    if (!isValid) {
      throw new NotFoundException(
        `Mục tiêu ${dto.targetType} với ID ${dto.targetId} không tồn tại`,
      );
    }

    const [meta, contentVersion] = await Promise.all([
      strategy.getTargetMeta(dto.targetId),
      this.contentVersionOf(dto.targetType, dto.targetId),
    ]);
    const content = dto.content.trim();

    const note = await this.prisma.note.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        userId: userId || null,
        guestId: dto.guestId || null,
        title: dto.title?.trim() || meta?.title || 'Ghi chú học tập',
        kind: dto.kind ?? (content ? NoteKind.NOTE : NoteKind.HIGHLIGHT),
        content,
        highlightText: dto.highlightText?.trim() || null,
        anchor: dto.anchor ? toAnchorJson(dto.anchor) : undefined,
        contentVersion,
        labels: normalizeLabels(dto.labels ?? []),
        color: dto.color,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return note;
  }

  async update(
    id: string,
    dto: UpdateNoteDto,
    userId?: string,
    guestId?: string,
  ) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú có ID: ${id}`);
    }

    this.assertOwnership(note, userId, guestId);

    const content = dto.content?.trim() ?? note.content;
    const keepsHighlight =
      dto.highlightText !== undefined
        ? Boolean(dto.highlightText.trim())
        : Boolean(note.highlightText);
    // Tô sáng được viết thêm nội dung thì thành ghi chú, trừ khi người dùng chọn loại khác.
    const kind =
      dto.kind ??
      (note.kind === NoteKind.HIGHLIGHT && content ? NoteKind.NOTE : note.kind);
    if (
      !content &&
      !(keepsHighlight && NOTE_KINDS_WITHOUT_CONTENT.includes(kind))
    ) {
      throw new BadRequestException(
        'Loại ghi chú này (hoặc ghi chú không gắn đoạn nào) phải có nội dung',
      );
    }

    const updated = await this.prisma.note.update({
      where: { id },
      data: {
        kind,
        content,
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.highlightText !== undefined && {
          highlightText: dto.highlightText?.trim() || null,
        }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.labels !== undefined && {
          labels: normalizeLabels(dto.labels),
        }),
        ...(dto.resolved !== undefined && {
          resolvedAt: dto.resolved ? new Date() : null,
        }),
        ...(dto.anchor !== undefined && {
          anchor: toAnchorJson(dto.anchor),
          contentVersion: await this.contentVersionOf(
            note.targetType,
            note.targetId,
          ),
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string, userId?: string, guestId?: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú có ID: ${id}`);
    }

    this.assertOwnership(note, userId, guestId);

    await this.prisma.note.delete({ where: { id } });

    return { id };
  }

  private assertOwnership(
    note: { userId: string | null; guestId: string | null },
    userId?: string,
    guestId?: string,
  ) {
    if (userId && note.userId === userId) {
      return;
    }
    if (guestId && note.guestId === guestId) {
      return;
    }
    // Nếu note không có owner hoặc người gọi không khớp
    if (note.userId && note.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên ghi chú này',
      );
    }
    if (!note.userId && note.guestId && note.guestId !== guestId) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên ghi chú này',
      );
    }
  }
}
