import api, { parsePaginatedResponse, PaginatedResult } from '../api';
import { LessonItem } from '@/types/models/lesson.type';
import { ContentStatus, DifficultyLevel } from '@/constants/enums';

export interface CreateLessonDto {
  topicId: string;
  title: string;
  contentRichText?: string;
  thumbnailUrl?: string;
  difficulty?: DifficultyLevel;
  sourceReferenceNote?: string;
  displayOrder?: number;
  status?: ContentStatus;
}

export interface UpdateLessonDto {
  topicId?: string;
  title?: string;
  contentRichText?: string;
  thumbnailUrl?: string;
  difficulty?: DifficultyLevel;
  sourceReferenceNote?: string;
  displayOrder?: number;
  status?: ContentStatus;
}

export class LessonApiService {
  /**
   * Lấy danh sách Bài học có phân trang và bộ lọc
   */
  static async getLessons(params?: {
    page?: number;
    limit?: number;
    search?: string;
    topicId?: string;
    status?: ContentStatus;
    difficulty?: DifficultyLevel;
  }): Promise<PaginatedResult<LessonItem>> {
    const res = await api.get('/lessons', { params });
    return parsePaginatedResponse<LessonItem>(res.data);
  }

  /**
   * Lấy chi tiết một Bài học theo ID
   */
  static async getLessonById(id: string): Promise<LessonItem> {
    const res = await api.get(`/lessons/${id}`);
    return res.data?.data || res.data;
  }

  /**
   * Tạo mới một Bài học
   */
  static async createLesson(dto: CreateLessonDto): Promise<LessonItem> {
    const res = await api.post('/lessons', dto);
    return res.data?.data || res.data;
  }

  /**
   * Cập nhật thông tin Bài học
   */
  static async updateLesson(id: string, dto: UpdateLessonDto): Promise<LessonItem> {
    const res = await api.patch(`/lessons/${id}`, dto);
    return res.data?.data || res.data;
  }

  /**
   * Xóa một Bài học
   */
  static async deleteLesson(id: string): Promise<void> {
    await api.delete(`/lessons/${id}`);
  }
}
