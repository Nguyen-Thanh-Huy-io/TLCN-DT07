import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GamificationActivityType } from '@prisma/client';
import {
  GamificationEventName,
  QUIZ_XP_BY_RESULT,
} from '../gamification.constant';
import { GamificationActivityInput } from '../services/activity-tracker.service';
import { GamificationFacadeService } from '../services/gamification-facade.service';
import { toVnDateKey } from '../utils/vn-date.util';

export interface LessonCompletedEvent {
  userId: string;
  lessonId: string;
}

export interface QuizSubmittedEvent {
  userId: string;
  attemptId: string;
  quizId: string;
  scorePercent: number;
  isPassed: boolean;
}

export interface FlashcardReviewedEvent {
  userId: string;
  cardId: string;
  rating: string;
}

export interface MindmapCreatedEvent {
  userId: string;
  mindmapId: string;
  title: string;
}

export interface NoteCreatedEvent {
  userId: string;
  noteId: string;
  targetType: string;
  targetId: string;
}

@Injectable()
export class GamificationEventListener {
  private readonly logger = new Logger(GamificationEventListener.name);

  constructor(private readonly facade: GamificationFacadeService) {}

  @OnEvent(GamificationEventName.LESSON_COMPLETED, { async: true })
  async onLessonCompleted(payload: LessonCompletedEvent): Promise<void> {
    await this.safeProcess(GamificationEventName.LESSON_COMPLETED, {
      userId: payload.userId,
      activityType: GamificationActivityType.LESSON_COMPLETED,
      entityType: 'LESSON',
      entityId: payload.lessonId,
      dedupKey: `LESSON:${payload.userId}:${payload.lessonId}`,
    });
  }

  @OnEvent(GamificationEventName.QUIZ_SUBMITTED, { async: true })
  async onQuizSubmitted(payload: QuizSubmittedEvent): Promise<void> {
    await this.safeProcess(GamificationEventName.QUIZ_SUBMITTED, {
      userId: payload.userId,
      activityType: GamificationActivityType.QUIZ_SUBMITTED,
      entityType: 'QUIZ',
      entityId: payload.quizId,
      dedupKey: `QUIZ_ATTEMPT:${payload.attemptId}`,
      isPassed: payload.isPassed,
      xpOverride: payload.isPassed
        ? QUIZ_XP_BY_RESULT.PASSED
        : QUIZ_XP_BY_RESULT.FAILED,
      metadata: {
        isPassed: payload.isPassed,
        scorePercent: payload.scorePercent,
      },
    });
  }

  @OnEvent(GamificationEventName.FLASHCARD_REVIEWED, { async: true })
  async onFlashcardReviewed(payload: FlashcardReviewedEvent): Promise<void> {
    await this.safeProcess(GamificationEventName.FLASHCARD_REVIEWED, {
      userId: payload.userId,
      activityType: GamificationActivityType.FLASHCARD_REVIEWED,
      entityType: 'FLASHCARD',
      entityId: payload.cardId,
      dedupKey: `FLASHCARD:${payload.userId}:${payload.cardId}:${toVnDateKey()}`,
      metadata: { rating: payload.rating },
    });
  }

  @OnEvent(GamificationEventName.MINDMAP_CREATED, { async: true })
  async onMindmapCreated(payload: MindmapCreatedEvent): Promise<void> {
    await this.safeProcess(GamificationEventName.MINDMAP_CREATED, {
      userId: payload.userId,
      activityType: GamificationActivityType.MINDMAP_CREATED,
      entityType: 'MINDMAP',
      entityId: payload.mindmapId,
      dedupKey: `MINDMAP:${payload.mindmapId}`,
      metadata: { title: payload.title },
    });
  }

  @OnEvent(GamificationEventName.NOTE_CREATED, { async: true })
  async onNoteCreated(payload: NoteCreatedEvent): Promise<void> {
    await this.safeProcess(GamificationEventName.NOTE_CREATED, {
      userId: payload.userId,
      activityType: GamificationActivityType.NOTE_CREATED,
      entityType: payload.targetType,
      entityId: payload.targetId,
      dedupKey: `NOTE:${payload.noteId}`,
    });
  }

  private async safeProcess(
    eventLabel: string,
    input: GamificationActivityInput,
  ): Promise<void> {
    try {
      await this.facade.processLearningActivity(input);
    } catch (err) {
      this.logger.error(
        `Lỗi xử lý sự kiện ${eventLabel}: ${(err as Error).message}`,
      );
    }
  }
}
