import { Injectable } from '@nestjs/common';
import { GamificationActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { ACTIVITY_XP_MAP } from '../gamification.constant';
import { toVnDateKey, toVnWeekKey } from '../utils/vn-date.util';

export interface GamificationActivityInput {
  userId: string;
  activityType: GamificationActivityType;
  entityType?: string;
  entityId?: string;
  dedupKey?: string;
  isPassed?: boolean;
  xpOverride?: number;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface RecordedActivityResult {
  recorded: boolean;
  skipped: boolean;
  activityDate: string;
  weekKey: string;
  xpEarned: number;
}

const PRISMA_UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class ActivityTrackerService {
  constructor(private readonly prisma: PrismaService) {}

  async recordActivity(
    input: GamificationActivityInput,
  ): Promise<RecordedActivityResult> {
    const now = input.occurredAt ?? new Date();
    const activityDate = toVnDateKey(now);
    const weekKey = toVnWeekKey(now);
    const xpEarned =
      input.xpOverride ?? ACTIVITY_XP_MAP[input.activityType] ?? 0;

    if (input.dedupKey) {
      const existing = await this.prisma.learningActivity.findUnique({
        where: { dedupKey: input.dedupKey },
        select: { id: true },
      });
      if (existing) {
        return {
          recorded: false,
          skipped: true,
          activityDate,
          weekKey,
          xpEarned: 0,
        };
      }
    }

    try {
      await this.prisma.learningActivity.create({
        data: {
          userId: input.userId,
          activityType: input.activityType,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          dedupKey: input.dedupKey ?? null,
          xpEarned,
          activityDate,
          weekKey,
          occurredAt: now,
          metadata: (input.metadata ??
            (input.isPassed !== undefined
              ? { isPassed: input.isPassed }
              : undefined)) as Prisma.InputJsonValue | undefined,
        },
      });
      return {
        recorded: true,
        skipped: false,
        activityDate,
        weekKey,
        xpEarned,
      };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === PRISMA_UNIQUE_VIOLATION_CODE) {
        return {
          recorded: false,
          skipped: true,
          activityDate,
          weekKey,
          xpEarned: 0,
        };
      }
      throw err;
    }
  }
}
