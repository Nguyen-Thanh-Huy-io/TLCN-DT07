export enum LessonProgressionState {
  COMPLETED = 'COMPLETED',
  CURRENT_UNLOCKED = 'CURRENT_UNLOCKED',
  LOCKED_PREREQUISITE = 'LOCKED_PREREQUISITE',
}

export interface LessonProgressEvaluation {
  lessonId: string;
  state: LessonProgressionState;
  lockedReason?: string;
  prerequisiteLessonId?: string;
}

export interface IProgressionStrategy {
  calculateProgression(
    orderedLessonIds: string[],
    completedLessonIds: Set<string>,
  ): Map<string, LessonProgressEvaluation>;

  isAccessible(
    targetLessonId: string,
    orderedLessonIds: string[],
    completedLessonIds: Set<string>,
  ): { allowed: boolean; reason?: string; prerequisiteLessonId?: string };
}
