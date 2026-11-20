import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { NoteAnchorDto, NoteInkItemDto } from '../dto/note.dto';
import { NoteAnchorMode, NoteInkTool } from '../note.constant';

/**
 * Strategy chuẩn hoá & kiểm tra hợp lệ từng loại vị trí neo (`anchor`) của ghi chú.
 * Áp dụng Strategy + Registry (OCP/SRP) thay cho nhánh if/else trong NoteService.
 */
export interface NoteAnchorStrategy {
  readonly mode: NoteAnchorMode;
  normalize(anchor: NoteAnchorDto): Prisma.InputJsonObject;
}

const pickDefinedStrings = (
  entries: ReadonlyArray<readonly [string, string | undefined]>,
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
};

@Injectable()
export class InlineTextAnchorStrategy implements NoteAnchorStrategy {
  readonly mode = NoteAnchorMode.INLINE;

  normalize(anchor: NoteAnchorDto): Prisma.InputJsonObject {
    return pickDefinedStrings([
      ['mode', anchor.mode],
      ['style', anchor.style],
      ['prefix', anchor.prefix],
      ['suffix', anchor.suffix],
    ]);
  }
}

@Injectable()
export class HeadingSectionAnchorStrategy implements NoteAnchorStrategy {
  readonly mode = NoteAnchorMode.HEADING;

  normalize(anchor: NoteAnchorDto): Prisma.InputJsonObject {
    const headingId = anchor.headingId?.trim();
    if (!headingId) {
      throw new BadRequestException(
        'Ghi chú theo mục bắt buộc phải có mã tiêu đề (headingId)',
      );
    }
    return pickDefinedStrings([
      ['mode', anchor.mode],
      ['style', anchor.style],
      ['headingId', headingId],
    ]);
  }
}

@Injectable()
export class BlockClusterAnchorStrategy implements NoteAnchorStrategy {
  readonly mode = NoteAnchorMode.BLOCK;

  normalize(anchor: NoteAnchorDto): Prisma.InputJsonObject {
    const { blockStart } = anchor;
    if (
      typeof blockStart !== 'number' ||
      !Number.isInteger(blockStart) ||
      blockStart < 0
    ) {
      throw new BadRequestException(
        'Vị trí đoạn bắt đầu (blockStart) không hợp lệ',
      );
    }

    const blockEnd = anchor.blockEnd ?? blockStart;
    if (!Number.isInteger(blockEnd) || blockEnd < blockStart) {
      throw new BadRequestException(
        'Vị trí đoạn kết thúc (blockEnd) phải lớn hơn hoặc bằng đoạn bắt đầu',
      );
    }

    return {
      mode: NoteAnchorMode.BLOCK,
      blockStart,
      blockEnd,
      ...pickDefinedStrings([
        ['style', anchor.style],
        ['startHint', anchor.startHint],
        ['endHint', anchor.endHint],
      ]),
    };
  }
}

const normalizeInkItem = (item: NoteInkItemDto): Prisma.InputJsonObject => {
  const base: Record<string, Prisma.InputJsonValue> = {
    id: item.id,
    tool: item.tool,
    color: item.color,
  };
  if (typeof item.width === 'number') base.width = item.width;
  if (typeof item.blockEnd === 'number') base.blockEnd = item.blockEnd;
  if (item.tool === NoteInkTool.TEXT) {
    if (typeof item.text === 'string') base.text = item.text.trim();
    if (typeof item.nx === 'number') base.nx = item.nx;
    if (typeof item.ny === 'number') base.ny = item.ny;
  } else if (Array.isArray(item.pts)) {
    base.pts = item.pts.map((n) => Math.round(n * 10000) / 10000);
  }
  return base;
};

@Injectable()
export class InkAnchorStrategy implements NoteAnchorStrategy {
  readonly mode = NoteAnchorMode.INK;

  normalize(anchor: NoteAnchorDto): Prisma.InputJsonObject {
    const { blockStart } = anchor;
    if (
      typeof blockStart !== 'number' ||
      !Number.isInteger(blockStart) ||
      blockStart < 0
    ) {
      throw new BadRequestException(
        'Vị trí đoạn neo nét vẽ (blockStart) không hợp lệ',
      );
    }
    const items = Array.isArray(anchor.inkItems) ? anchor.inkItems : [];
    return {
      mode: NoteAnchorMode.INK,
      blockStart,
      ...pickDefinedStrings([
        ['startHint', anchor.startHint],
        ['endHint', anchor.endHint],
      ]),
      inkItems: items.map(normalizeInkItem),
    };
  }
}

@Injectable()
export class NoteAnchorStrategyRegistry {
  private readonly strategies = new Map<NoteAnchorMode, NoteAnchorStrategy>();

  constructor(
    inlineStrategy: InlineTextAnchorStrategy,
    blockStrategy: BlockClusterAnchorStrategy,
    headingStrategy: HeadingSectionAnchorStrategy,
    inkStrategy: InkAnchorStrategy,
  ) {
    for (const strategy of [
      inlineStrategy,
      blockStrategy,
      headingStrategy,
      inkStrategy,
    ]) {
      this.strategies.set(strategy.mode, strategy);
    }
  }

  private resolveMode(anchor: NoteAnchorDto): NoteAnchorMode {
    if (anchor.mode) return anchor.mode;
    if (anchor.inkItems !== undefined) return NoteAnchorMode.INK;
    if (anchor.blockStart !== undefined) return NoteAnchorMode.BLOCK;
    if (anchor.headingId !== undefined) return NoteAnchorMode.HEADING;
    return NoteAnchorMode.INLINE;
  }

  normalize(anchor: NoteAnchorDto): Prisma.InputJsonObject {
    const mode = this.resolveMode(anchor);
    const strategy = this.strategies.get(mode);
    if (!strategy) {
      throw new BadRequestException(`Chế độ neo ghi chú không hợp lệ: ${mode}`);
    }
    return strategy.normalize(anchor);
  }
}

export const createDefaultNoteAnchorRegistry = () =>
  new NoteAnchorStrategyRegistry(
    new InlineTextAnchorStrategy(),
    new BlockClusterAnchorStrategy(),
    new HeadingSectionAnchorStrategy(),
    new InkAnchorStrategy(),
  );
