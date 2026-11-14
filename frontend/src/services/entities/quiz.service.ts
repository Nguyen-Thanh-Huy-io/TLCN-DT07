import api from '../api';
import { QuizQuestion } from '@/features/lessons/types/quiz.types';
import type { UserQuizAnswer } from '@/features/public-curriculum/strategies/public-curriculum.strategies';

const PUBLIC_QUIZZES_PATH = '/public/quizzes';

export interface StandaloneQuizQuestionLink {
  quizId: string;
  questionId: string;
  displayOrder: number;
  points: number;
  question?: unknown;
}

export interface StandaloneQuizItem {
  id: string;
  title: string;
  description?: string | null;
  topicTitle?: string;
  topics?: Array<{ id: string; name: string; slug?: string }>;
  topicIds?: string[];
  timeLimitMinutes: number;
  passingScorePercent: number;
  questionCount: number;
  questions: QuizQuestion[];
  quizQuestions?: StandaloneQuizQuestionLink[];
  status: 'ACTIVE' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestionItemInput {
  questionId: string;
  displayOrder?: number;
  points?: number;
}

export interface CreateStandaloneQuizDto {
  title: string;
  description?: string;
  topicIds?: string[];
  questionIds?: string[];
  questionItems?: QuizQuestionItemInput[];
  timeLimitMinutes?: number;
  passingScorePercent?: number;
}

export interface UpdateStandaloneQuizDto {
  title?: string;
  description?: string;
  topicIds?: string[];
  questionIds?: string[];
  questionItems?: QuizQuestionItemInput[];
  timeLimitMinutes?: number;
  passingScorePercent?: number;
}

/** Đề luyện tập công khai (`GET /public/quizzes`): đề thuộc chủ đề đã xuất bản, có câu hỏi. */
export interface PracticeQuizItem {
  id: string;
  title: string;
  description: string | null;
  passingScorePercent: number;
  timeLimitMinutes: number;
  topics: Array<{ id: string; name: string; slug: string }>;
  questions: QuizQuestion[];
}

export interface QuizStatisticsData {
  quizTitle: string;
  topicTitle?: string;
  summary: {
    totalAttempts: number;
    passedAttempts: number;
    passRatePercent: number;
    averageScore: number;
    averageTimeMinutes: string;
  };
  recentAttempts: Array<{
    id: string;
    learnerName: string;
    scorePercent: number;
    correctCount: number;
    totalQuestions: number;
    timeSpentSeconds: number;
    isPassed: boolean;
    submittedAt: string;
  }>;
}

export interface QuizAttemptResult {
  attemptId: string;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  isPassed: boolean;
  results: Record<string, boolean>;
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

  /** Lấy dữ liệu thống kê của bài kiểm tra */
  static async getQuizStatistics(id: string): Promise<QuizStatisticsData> {
    const res = await api.get(`/public/quizzes/${id}/statistics`);
    const json = res.data;
    return (json?.data?.summary ? json.data : json?.summary ? json : null) as QuizStatisticsData;
  }

  /** Nộp bài thi làm trắc nghiệm công khai */
  /** Server tự chấm từ `answers` (theo id câu hỏi) và trả điểm — client không tự tính điểm. */
  static async submitQuizAttempt(
    quizId: string,
    payload: {
      learnerName: string;
      timeSpentSeconds: number;
      answers: Record<string, UserQuizAnswer>;
    },
  ): Promise<QuizAttemptResult> {
    const res = await api.post(`/public/quizzes/${quizId}/submit`, payload);
    return res.data?.data || res.data;
  }

  /** Đề luyện tập công khai, có thể lọc theo chủ đề. */
  static async getPracticeQuizzes(topicId?: string): Promise<PracticeQuizItem[]> {
    const res = await api.get(PUBLIC_QUIZZES_PATH, { params: topicId ? { topicId } : undefined });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  }
}
