import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LearnerHistoryKindEnum } from '@/constants/enums';
import { QuizQuestionType } from '@/features/lessons/types/editor.types';
import { LearnerActivityHistoryPanel } from '@/features/account/components/LearnerActivityHistoryPanel';
import { LearnerApiService } from '@/services/entities/learner.service';

vi.mock('@/services/entities/learner.service', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/entities/learner.service')
  >('@/services/entities/learner.service');
  return {
    ...actual,
    LearnerApiService: {
      ...actual.LearnerApiService,
      getHistory: vi.fn(),
      getQuizAttemptDetail: vi.fn(),
    },
  };
});

describe('LearnerActivityHistoryPanel & QuizAttemptReviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị 3 tab lịch sử và mở Modal xem lại đáp án chi tiết khi nhấn Xem đáp án', async () => {
    const getHistoryMock = vi.mocked(LearnerApiService.getHistory);
    const getDetailMock = vi.mocked(LearnerApiService.getQuizAttemptDetail);

    getHistoryMock.mockImplementation(async ({ kind }) => {
      if (kind === LearnerHistoryKindEnum.QUIZ_ATTEMPTS) {
        return {
          items: [
            {
              id: 'att-1',
              quizId: 'quiz-1',
              quizTitle: 'Đề kiểm tra Chiến dịch Điện Biên Phủ',
              topics: [{ id: 't-1', name: 'Kháng chiến chống Pháp', slug: 'kc-phap' }],
              scorePercent: 50,
              passingScorePercent: 70,
              correctCount: 1,
              totalQuestions: 2,
              timeSpentSeconds: 95,
              isPassed: false,
              createdAt: '2026-11-28T06:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 8,
          totalPages: 1,
        };
      }
      if (kind === LearnerHistoryKindEnum.COMPLETED_LESSONS) {
        return {
          items: [
            {
              lessonId: 'les-1',
              title: 'Bài 1: Tuyên ngôn Độc lập 2/9/1945',
              slug: 'tuyen-ngon-doc-lap',
              difficulty: 'MEDIUM',
              estimatedReadMinutes: 10,
              thumbnailUrl: null,
              topic: { id: 't-1', name: 'Cách mạng Tháng Tám', slug: 'cmtt' },
              completedAt: '2026-11-28T06:15:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 8,
          totalPages: 1,
        };
      }
      return {
        items: [
          {
            activityId: 'act-1',
            articleId: 'art-1',
            title: 'Đại tướng Võ Nguyên Giáp',
            slug: 'dai-tuong-vo-nguyen-giap',
            summary: 'Tổng Tư lệnh Chiến dịch Điện Biên Phủ',
            thumbnailUrl: null,
            categoryName: 'Nhân vật',
            xpEarned: 20,
            readAt: '2026-11-28T06:30:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 8,
        totalPages: 1,
      };
    });

    getDetailMock.mockResolvedValue({
      attemptId: 'att-1',
      quizId: 'quiz-1',
      quizTitle: 'Đề kiểm tra Chiến dịch Điện Biên Phủ',
      passingScorePercent: 70,
      timeLimitMinutes: 15,
      topics: [],
      scorePercent: 50,
      correctCount: 1,
      totalQuestions: 2,
      timeSpentSeconds: 95,
      isPassed: false,
      createdAt: '2026-11-28T06:00:00.000Z',
      answers: { 'q-1': 'a', 'q-2': 'b' },
      results: { 'q-1': true, 'q-2': false },
      questions: [
        {
          id: 'q-1',
          type: QuizQuestionType.SINGLE_CHOICE,
          prompt: 'Chiến dịch Điện Biên Phủ kết thúc thắng lợi vào ngày nào?',
          explanation: '17h30 ngày 7/5/1954 tướng De Castries đầu hàng.',
          options: [
            { id: 'a', text: '07/05/1954', isCorrect: true },
            { id: 'b', text: '30/04/1975', isCorrect: false },
          ],
        },
        {
          id: 'q-2',
          type: QuizQuestionType.SINGLE_CHOICE,
          prompt: 'Phương châm tác chiến của chiến dịch là gì?',
          explanation: 'Chuyển sang Đánh chắc, tiến chắc.',
          options: [
            { id: 'a', text: 'Đánh chắc, tiến chắc', isCorrect: true },
            { id: 'b', text: 'Đánh nhanh, thắng nhanh', isCorrect: false },
          ],
        },
      ],
    });

    render(<LearnerActivityHistoryPanel />);

    await waitFor(() => {
      expect(
        screen.getByText('Đề kiểm tra Chiến dịch Điện Biên Phủ'),
      ).toBeDefined();
    });

    // Mở Modal xem lại bài làm
    fireEvent.click(screen.getByText('Xem đáp án'));

    await waitFor(() => {
      expect(
        screen.getByText('Xem lại bài làm khảo thí'),
      ).toBeDefined();
      expect(
        screen.getByText('Chỉ xem câu sai (1)'),
      ).toBeDefined();
    });

    // Đóng Modal và chuyển sang tab Bài học đã xong & Bài viết đã đọc
    fireEvent.click(screen.getByLabelText('Đóng'));
    fireEvent.click(screen.getByText('Bài học đã xong'));

    await waitFor(() => {
      expect(
        screen.getByText('Bài 1: Tuyên ngôn Độc lập 2/9/1945'),
      ).toBeDefined();
    });

    fireEvent.click(screen.getByText('Bài viết đã đọc'));

    await waitFor(() => {
      expect(screen.getByText('Đại tướng Võ Nguyên Giáp')).toBeDefined();
      expect(screen.getByText('+20 XP')).toBeDefined();
    });
  });
});
