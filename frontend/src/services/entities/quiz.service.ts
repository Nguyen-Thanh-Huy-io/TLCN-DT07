import api from '../api';
import {
  type FillInBlankQuestion,
  type MatchingQuestion,
  type MultipleChoiceOption,
  type MultipleChoiceQuestion,
  type OrderingQuestion,
  type QuizQuestion,
  QuizQuestionType,
  type SingleChoiceQuestion,
  type TrueFalseQuestion,
} from '@/features/lessons/types/editor.types';
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

type WithoutAnswerKey<Q, K extends keyof Q> = Omit<Q, K | 'explanation'>;
type ChoiceOptionView = Pick<MultipleChoiceOption, 'id' | 'text'>;

/** Câu hỏi của đề công khai trước khi nộp bài: server đã bỏ đáp án đúng và lời giải. */
export type PublicQuizQuestion =
  | (WithoutAnswerKey<SingleChoiceQuestion, 'options'> & { options: ChoiceOptionView[] })
  | (WithoutAnswerKey<MultipleChoiceQuestion, 'options'> & { options: ChoiceOptionView[] })
  | WithoutAnswerKey<TrueFalseQuestion, 'correctAnswer'>
  | WithoutAnswerKey<OrderingQuestion, 'correctOrder'>
  | WithoutAnswerKey<MatchingQuestion, 'correctPairs'>
  | WithoutAnswerKey<FillInBlankQuestion, 'acceptedAnswers' | 'caseSensitive'>;

/** Đề luyện tập công khai (`GET /public/quizzes`): đề thuộc chủ đề đã xuất bản, có câu hỏi. */
export interface PracticeQuizItem {
  id: string;
  title: string;
  description: string | null;
  passingScorePercent: number;
  timeLimitMinutes: number;
  topics: Array<{ id: string; name: string; slug: string }>;
  questions: PublicQuizQuestion[];
}

export interface QuizQuestionStatistics {
  questionId: string;
  type: string;
  prompt: string;
  answered: number;
  correct: number;
  correctRatePercent: number;
  topWrongAnswer: { label: string; count: number } | null;
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
  /** Theo thứ tự câu trong đề; chỉ tính các lượt nộp từ khi hệ thống lưu kết quả từng câu. */
  questions: QuizQuestionStatistics[];
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
  /** Câu hỏi đầy đủ (đáp án + lời giải) — chỉ có sau khi nộp bài. */
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

  /** Thống kê đề cho Ban biên tập (cần đăng nhập): tổng lượt làm và tỷ lệ đúng từng câu. */
  static async getQuizStatistics(id: string): Promise<QuizStatisticsData> {
    const res = await api.get<{ data: QuizStatisticsData }>(`/quizzes/${id}/statistics`);
    return res.data.data;
  }

  /** Nộp bài thi làm trắc nghiệm công khai */
  /** Server tự chấm từ `answers` (theo id câu hỏi) và trả điểm — client không tự tính điểm. */
  static async submitQuizAttempt(
    quizId: string,
    payload: {
      /** Chỉ khách cần gửi; đã đăng nhập thì server lấy tài khoản từ token. */
      learnerName?: string;
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

// --- Merged from question.service.ts ---
export interface QuestionBankOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export type QuestionBankData = Record<string, unknown> & {
  options?: QuestionBankOption[];
  correctAnswer?: boolean;
};

export interface QuestionAnswerStats {
  answered: number;
  correct: number;
}

export interface QuestionBankItem {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  explanation?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  data: QuestionBankData;
  topics?: Array<{ id: string; name: string }>;
  _count?: { quizQuestions: number };
  answerStats?: QuestionAnswerStats;
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
  topicIds?: string[];
}

export class QuestionApiService {
  static async getQuestions(params?: {
    search?: string;
    type?: QuizQuestionType;
    difficulty?: string;
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
