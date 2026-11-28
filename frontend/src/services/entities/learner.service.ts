import api, { parsePaginatedResponse, type PaginatedResult } from '../api';
import {
  ContentStatus,
  DifficultyLevel,
  LearnerHistoryKindEnum,
} from '@/constants/enums';
import type { QuizQuestion } from '@/features/lessons/types/editor.types';
import type { UserQuizAnswer } from '@/features/public-curriculum/strategies/public-curriculum.strategies';
import type { LessonItem } from '@/types/models';

export interface LearnerOverview {
  enrolledPathIds: string[];
  completedLessonIds: string[];
  passedQuizIds?: string[];
  bestQuizScores?: Record<string, number>;
}

export interface ReadableLesson {
  lesson: LessonItem;
}

export interface LibraryLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  difficulty: string;
  estimatedReadMinutes: number;
  topicId?: string | null;
  topic?: {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
  } | null;
  tags: Array<{ id: string; name: string; colorHex: string | null }>;
}

/** Mã lỗi backend trả khi người học chưa đăng ký lộ trình chứa bài. */
export const NOT_ENROLLED_CODE = 'NOT_ENROLLED';

export const LEARNER_ERROR_CODES = {
  NOT_ENROLLED: 'NOT_ENROLLED',
  PREREQUISITE_NOT_MET: 'PREREQUISITE_NOT_MET',
  LESSON_LOCKED_SEQUENTIAL: 'LESSON_LOCKED_SEQUENTIAL',
  CHAPTER_QUIZ_LOCKED: 'CHAPTER_QUIZ_LOCKED',
} as const;

export type ChapterQuizProgressionState = 'PASSED' | 'UNLOCKED' | 'LOCKED';

export interface PathProgressionQuiz {
  id: string;
  quizId: string;
  title: string;
  displayOrder: number;
  effectivePassScore: number;
  timeLimitMinutes: number | null;
  isRequired: boolean;
  bestScorePercent: number | null;
  state: ChapterQuizProgressionState;
  lockedReason?: string;
}

export type LessonProgressionState =
  | 'COMPLETED'
  | 'CURRENT_UNLOCKED'
  | 'LOCKED_PREREQUISITE';

export interface PathProgressionLesson {
  id: string;
  title: string;
  slug: string;
  difficulty?: string;
  state: LessonProgressionState;
  prerequisiteLessonId?: string;
  lockedReason?: string;
}

export interface PathProgressionChapter {
  id: string;
  title: string;
  slug: string;
  displayOrder: number;
  lessons: PathProgressionLesson[];
  quizzes?: PathProgressionQuiz[];
}

export interface PathProgressionData {
  pathId: string;
  title: string;
  slug: string;
  isSequential: boolean;
  prerequisitePath?: { id: string; title: string; slug: string } | null;
  successorPaths?: Array<{ id: string; title: string; slug: string }>;
  totalLessons: number;
  completedLessons: number;
  chapters: PathProgressionChapter[];
}

const ROUTES = {
  OVERVIEW: '/me/learning',
  ENROLL: (pathId: string) => `/me/learning/paths/${encodeURIComponent(pathId)}/enroll`,
  PROGRESSION: (pathId: string) => `/me/learning/paths/${encodeURIComponent(pathId)}/progression`,
  LESSON: (slug: string) => `/me/learning/lessons/${encodeURIComponent(slug)}`,
  COMPLETE: (lessonId: string) => `/me/learning/lessons/${encodeURIComponent(lessonId)}/complete`,
  HISTORY: '/me/learning/history',
  QUIZ_ATTEMPT_DETAIL: (attemptId: string) =>
    `/me/learning/quiz-attempts/${encodeURIComponent(attemptId)}`,
  LIBRARY: '/public/lessons',
} as const;

export interface LearnerQuizAttemptHistoryItem {
  id: string;
  quizId: string;
  quizTitle: string;
  topics: Array<{ id: string; name: string; slug: string }>;
  scorePercent: number;
  passingScorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  isPassed: boolean;
  createdAt: string;
}

export interface LearnerCompletedLessonHistoryItem {
  lessonId: string;
  title: string;
  slug: string;
  difficulty: string;
  estimatedReadMinutes: number;
  thumbnailUrl: string | null;
  topic: { id: string; name: string; slug: string } | null;
  completedAt: string;
}

export interface LearnerReadArticleHistoryItem {
  activityId: string;
  articleId: string;
  title: string;
  slug: string | null;
  summary: string | null;
  thumbnailUrl: string | null;
  categoryName: string | null;
  xpEarned: number;
  readAt: string;
}

export interface LearnerQuizAttemptDetail {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  passingScorePercent: number;
  timeLimitMinutes: number;
  topics: Array<{ id: string; name: string; slug: string }>;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  isPassed: boolean;
  createdAt: string;
  answers: Record<string, UserQuizAnswer>;
  results: Record<string, boolean>;
  questions: QuizQuestion[];
}

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

  /** Nội dung bài; lỗi 403 kèm `code: NOT_ENROLLED` hoặc `LESSON_LOCKED_SEQUENTIAL`. */
  static async getLesson(slug: string, pathId?: string): Promise<ReadableLesson> {
    const res = await api.get(ROUTES.LESSON(slug), {
      params: pathId ? { pathId } : undefined,
    });
    return unwrap<ReadableLesson>(res.data);
  }

  static async getPathProgression(learningPathId: string): Promise<PathProgressionData> {
    const res = await api.get(ROUTES.PROGRESSION(learningPathId));
    return unwrap<PathProgressionData>(res.data);
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

  static async getHistory<T>(params: {
    kind: LearnerHistoryKindEnum;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<T>> {
    const res = await api.get(ROUTES.HISTORY, { params });
    return parsePaginatedResponse<T>(res.data);
  }

  static async getQuizAttemptDetail(
    attemptId: string,
  ): Promise<LearnerQuizAttemptDetail> {
    const res = await api.get(ROUTES.QUIZ_ATTEMPT_DETAIL(attemptId));
    return unwrap<LearnerQuizAttemptDetail>(res.data);
  }
}

// --- Merged from lesson.service.ts ---
export interface CreateLessonDto {
  title: string;
  slug?: string;
  description?: string;
  summary?: string;
  content?: unknown;
  contentRichText?: string;
  thumbnailUrl?: string;
  difficulty?: DifficultyLevel;
  displayOrder?: number;
  status?: ContentStatus;
  topicId: string;
}

export interface UpdateLessonDto {
  topicId?: string;
  title?: string;
  slug?: string;
  description?: string;
  summary?: string;
  content?: unknown;
  contentRichText?: string;
  thumbnailUrl?: string;
  difficulty?: DifficultyLevel;
  displayOrder?: number;
  status?: ContentStatus;
}

export class LessonApiService {
  static async getLessons(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tagId?: string;
    status?: ContentStatus;
    difficulty?: DifficultyLevel;
  }): Promise<PaginatedResult<LessonItem>> {
    const res = await api.get('/lessons', { params });
    return parsePaginatedResponse<LessonItem>(res.data);
  }

  static async getLessonById(id: string): Promise<LessonItem> {
    const res = await api.get(`/lessons/${id}`);
    return res.data?.data || res.data;
  }

  static async getLessonBySlug(slug: string): Promise<LessonItem> {
    const res = await api.get(`/lessons/slug/${slug}`);
    return res.data?.data || res.data;
  }

  static async createLesson(dto: CreateLessonDto): Promise<LessonItem> {
    const res = await api.post('/lessons', dto);
    return res.data?.data || res.data;
  }

  static async updateLesson(id: string, dto: UpdateLessonDto): Promise<LessonItem> {
    const res = await api.patch(`/lessons/${id}`, dto);
    return res.data?.data || res.data;
  }

  static async deleteLesson(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/lessons/${id}`);
    return res.data;
  }
}

// --- Merged from learning-path.service.ts ---
export interface ChapterLessonItem {
  id: string;
  chapterId: string;
  lessonId: string;
  displayOrder: number;
  lesson: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    description?: string | null;
    difficulty?: string | null;
    status: string;
    duration?: number;
    topicId?: string | null;
    topic?: {
      id: string;
      name: string;
      slug: string;
      parentId?: string | null;
    } | null;
    lessonTags?: Array<{
      id: string;
      tagId: string;
      tag?: {
        id: string;
        name: string;
        slug: string;
        colorHex?: string | null;
      };
    }>;
  };
}

export interface ChapterQuizItem {
  id: string;
  chapterId: string;
  quizId: string;
  displayOrder: number;
  passScore?: number | null;
  isRequired: boolean;
  quiz?: {
    id: string;
    title?: string | null;
    passingScorePercent?: number | null;
    timeLimitMinutes?: number | null;
    _count?: {
      quizQuestions?: number;
    };
  } | null;
}

export interface ChapterQuizInputDto {
  quizId: string;
  passScore?: number | null;
  isRequired?: boolean;
}

export interface ChapterItem {
  id: string;
  learningPathId: string;
  title: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  status?: ContentStatus;
  chapterLessons: ChapterLessonItem[];
  chapterQuizzes?: ChapterQuizItem[];
}

export interface CurriculumTrackItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  displayOrder: number;
  status: ContentStatus;
  paths?: Array<{
    id: string;
    title: string;
    slug: string;
    status: ContentStatus;
    stageOrder: number;
    prerequisitePathId?: string | null;
    stageExamQuizId?: string | null;
    stageExamPassScore?: number | null;
  }>;
}

export interface CreateCurriculumTrackDto {
  title: string;
  description?: string;
  coverImageUrl?: string;
  displayOrder?: number;
  status?: ContentStatus;
}

export interface StageExamQuizRef {
  id: string;
  title?: string | null;
  passingScorePercent?: number | null;
  timeLimitMinutes?: number | null;
}

export interface LearningPathItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  pathType: 'CHRONOLOGICAL' | 'THEMATIC';
  isSequential: boolean;
  displayOrder: number;
  status: ContentStatus;
  topicId?: string | null;
  trackId?: string | null;
  stageOrder?: number;
  track?: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    displayOrder: number;
    status: ContentStatus;
  } | null;
  prerequisitePathId?: string | null;
  prerequisitePath?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  successorPaths?: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
  stageExamQuizId?: string | null;
  stageExamPassScore?: number | null;
  stageExamQuiz?: StageExamQuizRef | null;
  createdAt: string;
  updatedAt: string;
  chapters: ChapterItem[];
}

export interface CreateLearningPathDto {
  title: string;
  description?: string;
  coverImageUrl?: string;
  pathType?: 'CHRONOLOGICAL' | 'THEMATIC';
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
  trackId?: string | null;
  stageOrder?: number;
  prerequisitePathId?: string | null;
  stageExamQuizId?: string | null;
  stageExamPassScore?: number | null;
}

export interface CreateChapterDto {
  learningPathId: string;
  title: string;
  description?: string;
  displayOrder?: number;
  quizItems?: ChapterQuizInputDto[];
}

export class LearningPathApiService {
  static async getTracks(): Promise<CurriculumTrackItem[]> {
    const res = await api.get('/learning-paths/tracks');
    return res.data?.data || res.data || [];
  }

  static async createTrack(dto: CreateCurriculumTrackDto): Promise<CurriculumTrackItem> {
    const res = await api.post('/learning-paths/tracks', dto);
    return res.data?.data || res.data;
  }

  static async updateTrack(
    id: string,
    dto: Partial<CreateCurriculumTrackDto>,
  ): Promise<CurriculumTrackItem> {
    const res = await api.put(`/learning-paths/tracks/${id}`, dto);
    return res.data?.data || res.data;
  }

  static async deleteTrack(id: string): Promise<void> {
    await api.delete(`/learning-paths/tracks/${id}`);
  }

  static async getLearningPaths(): Promise<LearningPathItem[]> {
    const res = await api.get('/learning-paths');
    return res.data?.data || res.data || [];
  }

  static async getLearningPathById(id: string): Promise<LearningPathItem> {
    const res = await api.get(`/learning-paths/${id}`);
    return res.data?.data || res.data;
  }

  static async createLearningPath(dto: CreateLearningPathDto): Promise<LearningPathItem> {
    const res = await api.post('/learning-paths', dto);
    return res.data?.data || res.data;
  }

  static async updateLearningPath(id: string, dto: Partial<CreateLearningPathDto>): Promise<LearningPathItem> {
    const res = await api.put(`/learning-paths/${id}`, dto);
    return res.data?.data || res.data;
  }

  static async deleteLearningPath(id: string): Promise<void> {
    await api.delete(`/learning-paths/${id}`);
  }

  static async createChapter(dto: CreateChapterDto): Promise<ChapterItem> {
    const res = await api.post('/learning-paths/chapters', dto);
    return res.data?.data || res.data;
  }

  static async updateChapter(
    id: string,
    dto: { title?: string; description?: string; displayOrder?: number },
  ): Promise<ChapterItem> {
    const res = await api.put(`/learning-paths/chapters/${id}`, dto);
    return res.data?.data || res.data;
  }

  static async deleteChapter(id: string): Promise<void> {
    await api.delete(`/learning-paths/chapters/${id}`);
  }

  static async addLessonsToChapter(chapterId: string, lessonIds: string[]): Promise<ChapterLessonItem[]> {
    const res = await api.post(`/learning-paths/chapters/${chapterId}/lessons`, { lessonIds });
    return res.data?.data || res.data;
  }

  static async removeLessonFromChapter(chapterId: string, lessonId: string): Promise<void> {
    await api.delete(`/learning-paths/chapters/${chapterId}/lessons/${lessonId}`);
  }

  static async reorderChapterLessons(chapterId: string, orderedLessonIds: string[]): Promise<void> {
    await api.put(`/learning-paths/chapters/${chapterId}/lessons/reorder`, { orderedLessonIds });
  }

  static async setChapterQuizzes(
    chapterId: string,
    items: ChapterQuizInputDto[],
  ): Promise<ChapterQuizItem[]> {
    const res = await api.put(`/learning-paths/chapters/${chapterId}/quizzes`, { items });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload?.items) ? payload.items : [];
  }
}
