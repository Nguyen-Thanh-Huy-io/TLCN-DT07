import api, { parsePaginatedResponse, type PaginatedResult } from '../api';
import { ContentStatus, DifficultyLevel } from '@/constants/enums';
import type { LessonItem } from '@/types/models';

export interface LearnerOverview {
  enrolledPathIds: string[];
  completedLessonIds: string[];
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

  /** Nội dung bài; lỗi 403 kèm `code: NOT_ENROLLED` khi chưa đăng ký lộ trình. */
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

export interface ChapterItem {
  id: string;
  learningPathId: string;
  title: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  chapterLessons: ChapterLessonItem[];
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
}

export interface CreateChapterDto {
  learningPathId: string;
  title: string;
  description?: string;
  displayOrder?: number;
}

export class LearningPathApiService {
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
}
