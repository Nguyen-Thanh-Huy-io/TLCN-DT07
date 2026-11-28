import { Injectable } from '@nestjs/common';
import {
  IProgressionStrategy,
  LessonProgressEvaluation,
  LessonProgressionState,
} from './progression-strategy.interface';

@Injectable()
export class SequentialProgressionStrategy implements IProgressionStrategy {
  calculateProgression(
    orderedLessonIds: string[],
    completedLessonIds: Set<string>,
  ): Map<string, LessonProgressEvaluation> {
    const result = new Map<string, LessonProgressEvaluation>();
    let hasEncounteredFirstIncomplete = false;

    for (let i = 0; i < orderedLessonIds.length; i++) {
      const lessonId = orderedLessonIds[i];
      const isCompleted = completedLessonIds.has(lessonId);

      if (isCompleted) {
        result.set(lessonId, {
          lessonId,
          state: LessonProgressionState.COMPLETED,
        });
      } else if (!hasEncounteredFirstIncomplete) {
        // Bài chưa học đầu tiên là bài đang mở để học tiếp
        result.set(lessonId, {
          lessonId,
          state: LessonProgressionState.CURRENT_UNLOCKED,
        });
        hasEncounteredFirstIncomplete = true;
      } else {
        // Các bài sau đó bị khóa, điều kiện tiên quyết là bài ngay trước
        const previousLessonId = orderedLessonIds[i - 1];
        result.set(lessonId, {
          lessonId,
          state: LessonProgressionState.LOCKED_PREREQUISITE,
          prerequisiteLessonId: previousLessonId,
          lockedReason:
            'Cần hoàn thành bài học trước trong lộ trình để mở khóa bài này.',
        });
      }
    }

    return result;
  }

  isAccessible(
    targetLessonId: string,
    orderedLessonIds: string[],
    completedLessonIds: Set<string>,
  ): { allowed: boolean; reason?: string; prerequisiteLessonId?: string } {
    const targetIndex = orderedLessonIds.indexOf(targetLessonId);
    if (targetIndex === -1) {
      return { allowed: true };
    }

    // Bài đầu tiên luôn được mở
    if (targetIndex === 0) {
      return { allowed: true };
    }

    // Nếu bài đã hoàn thành thì luôn được xem lại
    if (completedLessonIds.has(targetLessonId)) {
      return { allowed: true };
    }

    // Kiểm tra xem bài ngay trước đã hoàn thành chưa
    const previousLessonId = orderedLessonIds[targetIndex - 1];
    if (!completedLessonIds.has(previousLessonId)) {
      return {
        allowed: false,
        reason:
          'Cần hoàn thành bài học trước trong lộ trình để mở khóa bài này.',
        prerequisiteLessonId: previousLessonId,
      };
    }

    return { allowed: true };
  }
}
