import api, { parsePaginatedResponse, PaginatedResult } from '../api';
import { LessonItem } from '@/types/models/lesson.type';
import { LessonStatus, ContentStatus, DifficultyLevel } from '@/constants/enums';

export interface CreateLessonDto {
  title: string;
  slug?: string;
  description?: string;
  summary?: string;
  content?: any;
  contentRichText?: any;
  thumbnailUrl?: string;
  difficulty?: DifficultyLevel;
  displayOrder?: number;
  status?: LessonStatus | ContentStatus;
}

export interface UpdateLessonDto {
  title?: string;
  slug?: string;
  description?: string;
  summary?: string;
  content?: any;
  contentRichText?: any;
  thumbnailUrl?: string;
  difficulty?: DifficultyLevel;
  displayOrder?: number;
  status?: LessonStatus | ContentStatus;
}

export class LessonApiService {
  /**
   * Lấy danh sách Bài học có phân trang và bộ lọc
   */
  static async getLessons(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tagId?: string;
    status?: LessonStatus | ContentStatus;
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
   * Lấy chi tiết một Bài học theo URL Slug
   */
  static async getLessonBySlug(slug: string): Promise<LessonItem> {
    const res = await api.get(`/lessons/slug/${slug}`);
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
  static async updateLesson(
    id: string,
    dto: UpdateLessonDto,
  ): Promise<LessonItem> {
    const res = await api.patch(`/lessons/${id}`, dto);
    return res.data?.data || res.data;
  }

  /**
   * Xóa Bài học
   */
  static async deleteLesson(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/lessons/${id}`);
    return res.data;
  }
}
