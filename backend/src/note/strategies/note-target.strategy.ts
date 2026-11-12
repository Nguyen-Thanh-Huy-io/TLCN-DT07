import { Injectable, NotFoundException } from '@nestjs/common';
import { NoteTargetType } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';

export interface NoteTargetStrategy {
  readonly targetType: NoteTargetType;
  validateTarget(targetId: string): Promise<boolean>;
  getTargetMeta(
    targetId: string,
  ): Promise<{ title: string; type: NoteTargetType } | null>;
}

@Injectable()
export class ArticleNoteStrategy implements NoteTargetStrategy {
  readonly targetType = NoteTargetType.ARTICLE;

  constructor(private readonly prisma: PrismaService) {}

  async validateTarget(targetId: string): Promise<boolean> {
    const article = await this.prisma.article.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    return Boolean(article);
  }

  async getTargetMeta(
    targetId: string,
  ): Promise<{ title: string; type: NoteTargetType } | null> {
    const article = await this.prisma.article.findUnique({
      where: { id: targetId },
      select: { title: true },
    });
    if (!article) return null;
    return { title: article.title, type: NoteTargetType.ARTICLE };
  }
}

@Injectable()
export class LessonNoteStrategy implements NoteTargetStrategy {
  readonly targetType = NoteTargetType.LESSON;

  constructor(private readonly prisma: PrismaService) {}

  async validateTarget(targetId: string): Promise<boolean> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    return Boolean(lesson);
  }

  async getTargetMeta(
    targetId: string,
  ): Promise<{ title: string; type: NoteTargetType } | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: targetId },
      select: { title: true },
    });
    if (!lesson) return null;
    return { title: lesson.title, type: NoteTargetType.LESSON };
  }
}

@Injectable()
export class NoteStrategyRegistry {
  private readonly strategies: Map<NoteTargetType, NoteTargetStrategy> =
    new Map();

  constructor(
    articleStrategy: ArticleNoteStrategy,
    lessonStrategy: LessonNoteStrategy,
  ) {
    this.strategies.set(articleStrategy.targetType, articleStrategy);
    this.strategies.set(lessonStrategy.targetType, lessonStrategy);
  }

  getStrategy(targetType: NoteTargetType): NoteTargetStrategy {
    const strategy = this.strategies.get(targetType);
    if (!strategy) {
      throw new NotFoundException(
        `Không hỗ trợ ghi chú cho loại mục tiêu: ${targetType}`,
      );
    }
    return strategy;
  }
}
