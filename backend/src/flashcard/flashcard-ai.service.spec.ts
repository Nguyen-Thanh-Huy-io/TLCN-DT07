import { BadRequestException } from '@nestjs/common';
import { AiGeneratorEngine } from './flashcard.constant';
import { FlashcardAiService } from './flashcard-ai.service';

describe('FlashcardAiService', () => {
  let service: FlashcardAiService;
  let mockPrisma: any;
  const origKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    mockPrisma = {
      note: { findMany: jest.fn().mockResolvedValue([]) },
      article: { findMany: jest.fn().mockResolvedValue([]) },
      quizAttemptAnswer: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new FlashcardAiService(mockPrisma);
  });

  afterAll(() => {
    if (origKey !== undefined) process.env.GEMINI_API_KEY = origKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it('báo lỗi BadRequestException khi không có ghi chú lẫn bài viết đã lưu', async () => {
    await expect(
      service.generatePreview('user-1', { includeNotes: true, articleIds: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('tạo bộ thẻ dự phòng (HEURISTIC) từ ghi chú DEFINITION và bài viết đã lưu khi không có GEMINI_API_KEY', async () => {
    mockPrisma.note.findMany.mockResolvedValue([
      {
        id: 'note-1',
        kind: 'DEFINITION',
        title: null,
        highlightText: 'Hội nghị Diên Hồng',
        content: 'Hội nghị các bô lão năm 1285 bàn kế đánh quân Nguyên Mông.',
      },
    ]);
    mockPrisma.article.findMany.mockResolvedValue([
      {
        id: 'art-1',
        title: 'Chiến thắng Bạch Đằng năm 1288',
        summary: 'Trần Hưng Đạo dùng trận địa cọc đánh tan thuỷ quân Ô Mã Nhi.',
        dateText: '1288',
        contentBlocks: [],
      },
    ]);

    const res = await service.generatePreview('user-1', {
      includeNotes: true,
      articleIds: ['art-1'],
      maxCards: 10,
    });

    expect(res.engine).toBe(AiGeneratorEngine.HEURISTIC);
    expect(res.noteCount).toBe(1);
    expect(res.articleCount).toBe(1);
    expect(res.cards).toHaveLength(2);
    expect(res.cards[0].sourceNoteId).toBe('note-1');
    expect(res.cards[1].front).toContain('Chiến thắng Bạch Đằng năm 1288');
  });

  it('chuyển câu Quiz làm sai thành thẻ: mặt trước gồm câu hỏi + đáp án, mặt sau là đáp án đúng + giải thích', async () => {
    mockPrisma.quizAttemptAnswer.findMany.mockResolvedValue([
      {
        question: {
          id: 'q-1',
          type: 'SINGLE_CHOICE',
          prompt: 'Chiến thắng Bạch Đằng lần thứ nhất diễn ra năm nào?',
          explanation: 'Ngô Quyền đánh tan quân Nam Hán năm 938.',
          data: {
            options: [
              { id: 'a', text: '938', isCorrect: true },
              { id: 'b', text: '981', isCorrect: false },
            ],
          },
        },
      },
    ]);

    const res = await service.generatePreview('user-1', {
      includeNotes: false,
      includeWrongQuizzes: true,
      articleIds: [],
    });

    expect(res.wrongQuizCount).toBe(1);
    expect(res.cards).toHaveLength(1);
    expect(res.cards[0].front).toContain('A. 938');
    expect(res.cards[0].front).toContain('B. 981');
    expect(res.cards[0].back).toContain('Đáp án đúng: A. 938');
    expect(res.cards[0].back).toContain('Ngô Quyền đánh tan quân Nam Hán năm 938.');
  });
});
