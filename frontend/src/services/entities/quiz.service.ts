import api from '../api';
import { QuizItem, QuizQuestion } from '@/features/lessons/types/quiz.types';

export interface UpsertQuizDto {
  title?: string;
  passingScorePercent?: number;
  questions: QuizQuestion[];
}

export class QuizApiService {
  /** Lấy đề ôn tập của 1 bài học — trả `null` nếu bài học chưa có đề (hợp lệ, không phải lỗi) */
  static async getQuiz(lessonId: string): Promise<QuizItem | null> {
    const res = await api.get(`/lessons/${lessonId}/quiz`);
    return res.data?.data ?? null;
  }

  /** Tạo mới hoặc cập nhật nguyên đề (luôn gửi toàn bộ mảng câu hỏi) */
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
