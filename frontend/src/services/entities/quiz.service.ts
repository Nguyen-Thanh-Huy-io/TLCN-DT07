import api from '../api';
import { QuizItem, QuizQuestion } from '@/features/lessons/types/quiz.types';

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
  lessonId?: string | null;
  lessonTitle?: string | null;
  topicTitle?: string;
  topics?: Array<{ id: string; name: string; slug?: string }>;
  topicIds?: string[];
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
  lessonId?: string;
  topicIds?: string[];
  questionIds?: string[];
  questionItems?: QuizQuestionItemInput[];
  timeLimitMinutes?: number;
  passingScorePercent?: number;
  questions?: QuizQuestion[];
}

export interface UpdateStandaloneQuizDto {
  title?: string;
  description?: string;
  lessonId?: string;
  topicIds?: string[];
  questionIds?: string[];
  questionItems?: QuizQuestionItemInput[];
  timeLimitMinutes?: number;
  passingScorePercent?: number;
  questions?: QuizQuestion[];
}

export interface UpsertQuizDto {
  title?: string;
  passingScorePercent?: number;
  questions: QuizQuestion[];
}

export interface QuizStatisticsData {
  quizTitle: string;
  lessonTitle?: string;
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

  /** Lấy dữ liệu thống kê của bài kiểm tra */
  static async getQuizStatistics(id: string): Promise<QuizStatisticsData> {
    const res = await api.get(`/public/quizzes/${id}/statistics`);
    const json = res.data;
    return (json?.data?.summary ? json.data : json?.summary ? json : null) as QuizStatisticsData;
  }

  /** Nộp bài thi làm trắc nghiệm công khai */
  static async submitQuizAttempt(
    quizId: string,
    payload: {
      learnerName: string;
      scorePercent: number;
      correctCount: number;
      totalQuestions: number;
      timeSpentSeconds: number;
      isPassed: boolean;
      answers: Record<number, string>;
    },
  ): Promise<unknown> {
    const res = await api.post(`/public/quizzes/${quizId}/submit`, payload);
    return res.data?.data || res.data;
  }

  /** Lấy danh sách bài học công khai có đề thi kèm theo */
  static async getPublicLessons(): Promise<unknown[]> {
    const res = await api.get('/public/lessons');
    return res.data?.data || res.data || [];
  }

  /** Lấy đề thi khảo thí của 1 Topic */
  static async getQuizByTopic(topicId: string): Promise<StandaloneQuizItem | null> {
    const res = await api.get(`/quizzes`, { params: { topicId, limit: 1 } });
    const items = res.data?.data?.items || res.data?.items || [];
    return items.length > 0 ? items[0] : null;
  }
}
