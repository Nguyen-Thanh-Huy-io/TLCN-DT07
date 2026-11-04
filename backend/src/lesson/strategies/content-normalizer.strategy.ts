import { Prisma } from '@prisma/client';

/**
 * Strategy Pattern Interface cho việc chuẩn hóa dữ liệu Content JSONB
 * Tuân thủ Open-Closed Principle (OCP)
 */
export interface ILessonContentStrategy {
  canHandle(rawContent: any): boolean;
  normalize(rawContent: any): Prisma.InputJsonValue;
  extractPlainText(rawContent: any): string;
}

/**
 * Strategy xử lý khi content đã là mảng Block JSON: [{ type: 'paragraph', ... }]
 */
export class ArrayBlockContentStrategy implements ILessonContentStrategy {
  canHandle(rawContent: any): boolean {
    return Array.isArray(rawContent);
  }

  normalize(rawContent: any): Prisma.InputJsonValue {
    return rawContent as Prisma.InputJsonValue;
  }

  extractPlainText(rawContent: any): string {
    if (!Array.isArray(rawContent)) return '';
    return rawContent
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block?.text) return block.text;
        if (block?.content && typeof block.content === 'string') return block.content;
        return JSON.stringify(block);
      })
      .join(' ');
  }
}

/**
 * Strategy xử lý khi content là TipTap Document Object: { type: 'doc', content: [...] }
 */
export class TipTapDocumentContentStrategy implements ILessonContentStrategy {
  canHandle(rawContent: any): boolean {
    return (
      rawContent !== null &&
      typeof rawContent === 'object' &&
      !Array.isArray(rawContent) &&
      rawContent.type === 'doc'
    );
  }

  normalize(rawContent: any): Prisma.InputJsonValue {
    return rawContent as Prisma.InputJsonValue;
  }

  extractPlainText(rawContent: any): string {
    const texts: string[] = [];
    const traverse = (node: any) => {
      if (!node) return;
      if (node.text) texts.push(node.text);
      if (Array.isArray(node.content)) {
        node.content.forEach(traverse);
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
  canHandle(rawContent: any): boolean {
    return typeof rawContent === 'string';
  }

  normalize(rawContent: any): Prisma.InputJsonValue {
    const trimmed = (rawContent as string).trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
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

  extractPlainText(rawContent: any): string {
    if (typeof rawContent !== 'string') return '';
    try {
      const parsed = JSON.parse(rawContent);
      return JSON.stringify(parsed);
    } catch {
      return (rawContent as string).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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

  normalize(rawContent: any): Prisma.InputJsonValue {
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

  static normalize(rawContent: any): Prisma.InputJsonValue {
    const strategy = this.strategies.find((s) => s.canHandle(rawContent)) || new FallbackContentStrategy();
    return strategy.normalize(rawContent);
  }

  static extractPlainText(rawContent: any): string {
    const strategy = this.strategies.find((s) => s.canHandle(rawContent)) || new FallbackContentStrategy();
    return strategy.extractPlainText(rawContent);
  }
}
