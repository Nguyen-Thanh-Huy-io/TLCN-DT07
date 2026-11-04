import api from '../api';
import type { LessonItem } from '@/types/models/lesson.type';
import type { QuizItem } from '@/features/lessons/types/quiz.types';

export interface LearnerOverview {
  enrolledPathIds: string[];
  completedLessonIds: string[];
}

export interface ReadableLesson {
  lesson: LessonItem;
  quiz: QuizItem | null;
}

export interface LibraryLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  difficulty: string;
  estimatedReadMinutes: number;
  tags: Array<{ id: string; name: string; colorHex: string | null }>;
}

/** Mã lỗi backend trả khi người học chưa đăng ký lộ trình chứa bài. */
export const NOT_ENROLLED_CODE = 'NOT_ENROLLED';

const ROUTES = {
  OVERVIEW: '/me/learning',
  ENROLL: (pathId: string) => `/me/learning/paths/${encodeURIComponent(pathId)}/enroll`,
  LESSON: (slug: string) => `/me/learning/lessons/${encodeURIComponent(slug)}`,
  COMPLETE: (lessonId: string) => `/me/learning/lessons/${encodeURIComponent(lessonId)}/complete`,
  LIBRARY: '/public/lessons',
} as const;

const unwrap = <T>(body: { data?: T } | T): T =>
  body && typeof body === 'object' && 'data' in (body as object) ? ((body as { data: T }).data) : (body as T);

export class LearnerApiService {
  static async getOverview(): Promise<LearnerOverview> {
    const res = await api.get(ROUTES.OVERVIEW);
    return unwrap<LearnerOverview>(res.data);
  }

  static async enroll(learningPathId: string): Promise<LearnerOverview> {
    const res = await api.post(ROUTES.ENROLL(learningPathId));
    return unwrap<LearnerOverview>(res.data);
  }

  static async unenroll(learningPathId: string): Promise<LearnerOverview> {
    const res = await api.delete(ROUTES.ENROLL(learningPathId));
    return unwrap<LearnerOverview>(res.data);
  }

  /** Nội dung bài + quiz; lỗi 403 kèm `code: NOT_ENROLLED` khi chưa đăng ký lộ trình. */
  static async getLesson(slug: string): Promise<ReadableLesson> {
    const res = await api.get(ROUTES.LESSON(slug));
    return unwrap<ReadableLesson>(res.data);
  }

  static async completeLesson(lessonId: string): Promise<LearnerOverview> {
    const res = await api.post(ROUTES.COMPLETE(lessonId));
    return unwrap<LearnerOverview>(res.data);
  }

  /** Thư viện bài học công khai (không kèm nội dung). */
  static async getLibrary(): Promise<LibraryLesson[]> {
    const res = await api.get(ROUTES.LIBRARY);
    const data = unwrap<LibraryLesson[]>(res.data);
    return Array.isArray(data) ? data : [];
  }
}
