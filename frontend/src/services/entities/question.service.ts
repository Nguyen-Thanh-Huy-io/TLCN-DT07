import api from '../api';
import { QuizQuestionType } from '@/features/lessons/types/quiz.types';

/** Phương án của câu trắc nghiệm trong `questions.data`. */
export interface QuestionBankOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** Dữ liệu riêng theo dạng câu hỏi (JSONB `questions.data`); chỉ khai các trường dùng chung để xem trước. */
export type QuestionBankData = Record<string, unknown> & {
  options?: QuestionBankOption[];
  correctAnswer?: boolean;
};

export interface QuestionBankItem {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  explanation?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  data: QuestionBankData;
  lessons?: Array<{ id: string; title: string }>;
  topics?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankListResponse {
  items: QuestionBankItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateQuestionPayload {
  type: QuizQuestionType;
  prompt: string;
  explanation?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  points?: number;
  data: Record<string, unknown>;
  lessonIds?: string[];
  topicIds?: string[];
}

export class QuestionApiService {
  static async getQuestions(params?: {
    search?: string;
    type?: QuizQuestionType;
    difficulty?: string;
    lessonId?: string;
    topicId?: string;
    page?: number;
    limit?: number;
  }): Promise<QuestionBankListResponse> {
    const res = await api.get('/questions', { params });
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      };
    }
    return data;
  }

  static async getQuestion(id: string): Promise<QuestionBankItem> {
    const res = await api.get(`/questions/${id}`);
    return res.data?.data || res.data;
  }

  static async createQuestion(payload: CreateQuestionPayload): Promise<QuestionBankItem> {
    const res = await api.post('/questions', payload);
    return res.data?.data || res.data;
  }

  static async updateQuestion(
    id: string,
    payload: Partial<CreateQuestionPayload>,
  ): Promise<QuestionBankItem> {
    const res = await api.put(`/questions/${id}`, payload);
    return res.data?.data || res.data;
  }

  static async deleteQuestion(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/questions/${id}`);
    return res.data?.data || res.data;
  }
}
