import { Injectable } from '@nestjs/common';
import { SavedMaterialKind } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';

export interface SavedMaterialSnapshot {
  articleIds: string[];
  lessonIds: string[];
  timelineNodeIds: string[];
}

@Injectable()
export class SavedMaterialService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(userId: string): Promise<SavedMaterialSnapshot> {
    const rows = await this.prisma.savedMaterial.findMany({
      where: { userId },
      select: { kind: true, targetId: true },
    });

    const snapshot: SavedMaterialSnapshot = {
      articleIds: [],
      lessonIds: [],
      timelineNodeIds: [],
    };
    for (const row of rows) {
      if (row.kind === SavedMaterialKind.ARTICLE)
        snapshot.articleIds.push(row.targetId);
      else if (row.kind === SavedMaterialKind.LESSON)
        snapshot.lessonIds.push(row.targetId);
      else snapshot.timelineNodeIds.push(row.targetId);
    }
    return snapshot;
  }

  /** Lưu/bỏ lưu một tư liệu. Lưu một ARTICLE cũng ghim luôn mốc dấu mộc tương ứng (tương thích hành vi cũ). */
  async toggle(
    userId: string,
    kind: SavedMaterialKind,
    targetId: string,
  ): Promise<{ saved: boolean }> {
    const existing = await this.prisma.savedMaterial.findUnique({
      where: { userId_kind_targetId: { userId, kind, targetId } },
      select: { id: true },
    });
    const nextSaved = !existing;

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.savedMaterial.delete({ where: { id: existing.id } });
      } else {
        await tx.savedMaterial.create({ data: { userId, kind, targetId } });
      }

      if (kind === SavedMaterialKind.ARTICLE) {
        if (nextSaved) {
          await tx.savedMaterial.upsert({
            where: {
              userId_kind_targetId: {
                userId,
                kind: SavedMaterialKind.TIMELINE_NODE,
                targetId,
              },
            },
            update: {},
            create: { userId, kind: SavedMaterialKind.TIMELINE_NODE, targetId },
          });
        } else {
          await tx.savedMaterial.deleteMany({
            where: { userId, kind: SavedMaterialKind.TIMELINE_NODE, targetId },
          });
        }
      }
    });

    return { saved: nextSaved };
  }

  async remove(
    userId: string,
    kind: SavedMaterialKind,
    targetId: string,
  ): Promise<void> {
    await this.prisma.savedMaterial.deleteMany({
      where: { userId, kind, targetId },
    });
  }
}
