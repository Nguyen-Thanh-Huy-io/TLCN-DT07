import api from '../api';
import { QuizItem, QuizQuestion } from '@/features/lessons/types/quiz.types';

export interface StandaloneQuizItem {
  id: string;
  title: string;
  description?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  topicTitle?: string;
  lesson?: {
    id: string;
    title: string;
    slug?: string;
    description?: string | null;
    topicTitle?: string;
  } | null;
  timeLimitMinutes: number;
  passingScorePercent: number;
  questionCount: number;
  questions: QuizQuestion[];
  status: 'ACTIVE' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
}

export interface CreateStandaloneQuizDto {
  title: string;
  description?: string;
  lessonId?: string;
  timeLimitMinutes?: number;
  passingScorePercent?: number;
  questions: QuizQuestion[];
}

export interface UpdateStandaloneQuizDto {
  title?: string;
  description?: string;
  lessonId?: string;
  timeLimitMinutes?: number;
  passingScorePercent?: number;
  questions?: QuizQuestion[];
}

export interface UpsertQuizDto {
  title?: string;
  passingScorePercent?: number;
  questions: QuizQuestion[];
}

export class QuizApiService {
  /** Lấy danh sách toàn bộ đề thi / bộ Quiz độc lập trong hệ thống */
  static async getAllQuizzes(params?: {
    search?: string;
    topicId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: StandaloneQuizItem[]; total: number; totalPages: number }> {
    const res = await api.get('/quizzes', { params });
    return res.data?.data || res.data;
  }

  /** Lấy chi tiết đề thi độc lập theo ID */
  static async getQuizById(id: string): Promise<StandaloneQuizItem> {
    const res = await api.get(`/quizzes/${id}`);
    return res.data?.data || res.data;
  }

  /** Tạo mới đề thi độc lập (hỗ trợ tổng hợp từ Ngân hàng câu hỏi) */
  static async createStandaloneQuiz(dto: CreateStandaloneQuizDto): Promise<StandaloneQuizItem> {
    const res = await api.post('/quizzes', dto);
    return res.data?.data || res.data;
  }

  /** Cập nhật đề thi độc lập */
  static async updateStandaloneQuiz(id: string, dto: UpdateStandaloneQuizDto): Promise<StandaloneQuizItem> {
    const res = await api.put(`/quizzes/${id}`, dto);
    return res.data?.data || res.data;
  }

  /** Xóa đề thi độc lập theo ID */
  static async deleteStandaloneQuiz(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/quizzes/${id}`);
    return res.data?.data || res.data;
  }

  /** Lấy đề ôn tập của 1 bài học (null nếu chưa có đề) */
  static async getQuiz(lessonId: string): Promise<QuizItem | null> {
    const res = await api.get(`/lessons/${lessonId}/quiz`);
    return res.data?.data ?? null;
  }

  /** Tạo mới hoặc cập nhật nguyên đề gắn với bài học */
  static async upsertQuiz(lessonId: string, dto: UpsertQuizDto): Promise<QuizItem> {
    const res = await api.put(`/lessons/${lessonId}/quiz`, dto);
    return res.data?.data || res.data;
  }

  /** Xóa đề ôn tập của 1 bài học */
  static async deleteQuiz(lessonId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/lessons/${lessonId}/quiz`);
    return res.data?.data || res.data;
  }
}
