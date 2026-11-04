import api from '../api';

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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CreateChapterDto {
  learningPathId: string;
  title: string;
  description?: string;
  displayOrder?: number;
}

export class LearningPathApiService {
  /**
   * Lấy danh sách tất cả lộ trình học kèm các chương và bài học
   */
  static async getLearningPaths(): Promise<LearningPathItem[]> {
    const res = await api.get('/learning-paths');
    return res.data?.data || res.data || [];
  }

  /**
   * Lấy chi tiết một lộ trình học theo ID
   */
  static async getLearningPathById(id: string): Promise<LearningPathItem> {
    const res = await api.get(`/learning-paths/${id}`);
    return res.data?.data || res.data;
  }

  /**
   * Tạo lộ trình học mới
   */
  static async createLearningPath(
    dto: CreateLearningPathDto,
  ): Promise<LearningPathItem> {
    const res = await api.post('/learning-paths', dto);
    return res.data?.data || res.data;
  }

  /**
   * Cập nhật lộ trình học
   */
  static async updateLearningPath(
    id: string,
    dto: Partial<CreateLearningPathDto>,
  ): Promise<LearningPathItem> {
    const res = await api.put(`/learning-paths/${id}`, dto);
    return res.data?.data || res.data;
  }

  /**
   * Xóa lộ trình học
   */
  static async deleteLearningPath(id: string): Promise<void> {
    await api.delete(`/learning-paths/${id}`);
  }

  /**
   * Tạo chương mới trong lộ trình
   */
  static async createChapter(dto: CreateChapterDto): Promise<ChapterItem> {
    const res = await api.post('/learning-paths/chapters', dto);
    return res.data?.data || res.data;
  }

  /**
   * Cập nhật tên / mô tả chương
   */
  static async updateChapter(
    id: string,
    dto: { title?: string; description?: string; displayOrder?: number },
  ): Promise<ChapterItem> {
    const res = await api.put(`/learning-paths/chapters/${id}`, dto);
    return res.data?.data || res.data;
  }

  /**
   * Xóa chương
   */
  static async deleteChapter(id: string): Promise<void> {
    await api.delete(`/learning-paths/chapters/${id}`);
  }

  /**
   * Gom bài học từ thư viện vào chương
   */
  static async addLessonsToChapter(
    chapterId: string,
    lessonIds: string[],
  ): Promise<ChapterLessonItem[]> {
    const res = await api.post(
      `/learning-paths/chapters/${chapterId}/lessons`,
      { lessonIds },
    );
    return res.data?.data || res.data;
  }

  /**
   * Bỏ một bài học khỏi chương
   */
  static async removeLessonFromChapter(
    chapterId: string,
    lessonId: string,
  ): Promise<void> {
    await api.delete(
      `/learning-paths/chapters/${chapterId}/lessons/${lessonId}`,
    );
  }

  /**
   * Đổi thứ tự các bài học trong chương (Reorder)
   */
  static async reorderChapterLessons(
    chapterId: string,
    orderedLessonIds: string[],
  ): Promise<void> {
    await api.put(
      `/learning-paths/chapters/${chapterId}/lessons/reorder`,
      { orderedLessonIds },
    );
  }
}
