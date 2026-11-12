import { Prisma } from '@prisma/client';

/**
 * Strategy Pattern Interface cho việc chuẩn hóa dữ liệu Content JSONB
 * Tuân thủ Open-Closed Principle (OCP)
 */
export interface ILessonContentStrategy {
  canHandle(rawContent: unknown): boolean;
  normalize(rawContent: unknown): Prisma.InputJsonValue;
  extractPlainText(rawContent: unknown): string;
}

/**
 * Strategy xử lý khi content đã là mảng Block JSON: [{ type: 'paragraph', ... }]
 */
export class ArrayBlockContentStrategy implements ILessonContentStrategy {
  canHandle(rawContent: unknown): boolean {
    return Array.isArray(rawContent);
  }

  normalize(rawContent: unknown): Prisma.InputJsonValue {
    return rawContent as Prisma.InputJsonValue;
  }

  extractPlainText(rawContent: unknown): string {
    if (!Array.isArray(rawContent)) return '';
    return rawContent
      .map((block: unknown) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object') {
          const record = block as Record<string, unknown>;
          if (typeof record.text === 'string') return record.text;
          if (typeof record.content === 'string') return record.content;
        }
        return JSON.stringify(block);
      })
      .join(' ');
  }
}

/**
 * Strategy xử lý khi content là TipTap Document Object: { type: 'doc', content: [...] }
 */
export class TipTapDocumentContentStrategy implements ILessonContentStrategy {
  canHandle(rawContent: unknown): boolean {
    return (
      rawContent !== null &&
      typeof rawContent === 'object' &&
      !Array.isArray(rawContent) &&
      (rawContent as Record<string, unknown>).type === 'doc'
    );
  }

  normalize(rawContent: unknown): Prisma.InputJsonValue {
    return rawContent as Prisma.InputJsonValue;
  }

  extractPlainText(rawContent: unknown): string {
    const texts: string[] = [];
    const traverse = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const record = node as Record<string, unknown>;
      if (typeof record.text === 'string') texts.push(record.text);
      if (Array.isArray(record.content)) {
        record.content.forEach(traverse);
      }
    };
    traverse(rawContent);
    return texts.join(' ');
  }
}

/**
 * Strategy xử lý khi content gửi lên dưới dạng chuỗi JSON hoặc chuỗi HTML thuần
 */
export class StringContentStrategy implements ILessonContentStrategy {
  canHandle(rawContent: unknown): boolean {
    return typeof rawContent === 'string';
  }

  normalize(rawContent: unknown): Prisma.InputJsonValue {
    const trimmed = (rawContent as string).trim();
    if (!trimmed) return [];

    try {
      const parsed: unknown = JSON.parse(trimmed);
      return parsed as Prisma.InputJsonValue;
    } catch {
      // Trường hợp chuỗi HTML/text truyền thống: bọc vào cấu trúc block
      return [
        {
          type: 'html',
          content: trimmed,
        },
      ] as Prisma.InputJsonValue;
    }
  }

  extractPlainText(rawContent: unknown): string {
    if (typeof rawContent !== 'string') return '';
    try {
      const parsed: unknown = JSON.parse(rawContent);
      return JSON.stringify(parsed);
    } catch {
      return rawContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
}

/**
 * Strategy mặc định dự phòng (Fallback)
 */
export class FallbackContentStrategy implements ILessonContentStrategy {
  canHandle(): boolean {
    return true;
  }

  normalize(rawContent: unknown): Prisma.InputJsonValue {
    if (rawContent && typeof rawContent === 'object') {
      return rawContent as Prisma.InputJsonValue;
    }
    return [] as Prisma.InputJsonValue;
  }

  extractPlainText(): string {
    return '';
  }
}

/**
 * Context quản lý tập các Strategy và lựa chọn tự động (Strategy Manager)
 */
export class LessonContentStrategyContext {
  private static readonly strategies: ILessonContentStrategy[] = [
    new ArrayBlockContentStrategy(),
    new TipTapDocumentContentStrategy(),
    new StringContentStrategy(),
    new FallbackContentStrategy(),
  ];

  static normalize(rawContent: unknown): Prisma.InputJsonValue {
    const strategy =
      this.strategies.find((s) => s.canHandle(rawContent)) ||
      new FallbackContentStrategy();
    return strategy.normalize(rawContent);
  }

  static extractPlainText(rawContent: unknown): string {
    const strategy =
      this.strategies.find((s) => s.canHandle(rawContent)) ||
      new FallbackContentStrategy();
    return strategy.extractPlainText(rawContent);
  }
}
