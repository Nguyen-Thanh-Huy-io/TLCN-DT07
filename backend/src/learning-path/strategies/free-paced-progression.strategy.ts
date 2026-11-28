import { Injectable } from '@nestjs/common';
import {
  IProgressionStrategy,
  LessonProgressEvaluation,
  LessonProgressionState,
} from './progression-strategy.interface';

@Injectable()
export class FreePacedProgressionStrategy implements IProgressionStrategy {
  calculateProgression(
    orderedLessonIds: string[],
    completedLessonIds: Set<string>,
  ): Map<string, LessonProgressEvaluation> {
    const result = new Map<string, LessonProgressEvaluation>();

    for (const lessonId of orderedLessonIds) {
      if (completedLessonIds.has(lessonId)) {
        result.set(lessonId, {
          lessonId,
          state: LessonProgressionState.COMPLETED,
        });
      } else {
        result.set(lessonId, {
          lessonId,
          state: LessonProgressionState.CURRENT_UNLOCKED,
        });
      }
    }

    return result;
  }

  isAccessible(): { allowed: boolean; reason?: string } {
    return { allowed: true };
  }
}
