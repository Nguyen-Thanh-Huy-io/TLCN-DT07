import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { CreateNoteDto, QueryNoteDto, UpdateNoteDto } from './dto/note.dto';
import { NoteStrategyRegistry } from './strategies/note-target.strategy';

@Injectable()
export class NoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strategyRegistry: NoteStrategyRegistry,
  ) {}

  async findAll(userId?: string, query?: QueryNoteDto) {
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

    const meta = await strategy.getTargetMeta(dto.targetId);

    const note = await this.prisma.note.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        userId: userId || null,
        guestId: dto.guestId || null,
        title: dto.title?.trim() || meta?.title || 'Ghi chú học tập',
        content: dto.content.trim(),
        highlightText: dto.highlightText?.trim() || null,
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

    const updated = await this.prisma.note.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.content !== undefined && { content: dto.content.trim() }),
        ...(dto.highlightText !== undefined && {
          highlightText: dto.highlightText?.trim() || null,
        }),
        ...(dto.color !== undefined && { color: dto.color }),
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
