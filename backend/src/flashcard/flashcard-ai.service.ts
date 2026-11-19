import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { QuizQuestionType } from '../quiz/types/quiz-question.types';
import {
  AiGeneratorEngine,
  FLASHCARD_LIMITS,
  FLASHCARD_MESSAGES,
} from './flashcard.constant';
import { GenerateFlashcardsDto } from './dto/flashcard.dto';

export interface GeneratedCardDraft {
  front: string;
  back: string;
  sourceNoteId?: string;
}

export interface GeneratedFlashcardPreview {
  deckTitle: string;
  cards: GeneratedCardDraft[];
  engine: AiGeneratorEngine;
  noteCount: number;
  articleCount: number;
  wrongQuizCount: number;
}

interface SourceNoteItem {
  id: string;
  kind: string;
  title: string | null;
  content: string;
  highlightText: string | null;
}

interface SourceArticleItem {
  id: string;
  title: string;
  summary: string | null;
  dateText: string | null;
  contentBlocks: unknown;
}

interface SourceWrongQuestion {
  id: string;
  type: string;
  prompt: string;
  explanation: string | null;
  data: unknown;
}

interface FormattedQuizQa {
  front: string;
  back: string;
}

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function formatChoiceQa(
  prompt: string,
  data: Record<string, unknown>,
  explanation: string | null,
): FormattedQuizQa | null {
  const rawOptions = Array.isArray(data.options) ? data.options : [];
  const options = rawOptions.filter(
    (o): o is { id?: string; text?: string; isCorrect?: boolean } =>
      Boolean(o && typeof o === 'object'),
  );
  if (options.length === 0) return null;

  const optionLines = options.map(
    (o, i) => `${OPTION_LETTERS[i] ?? i + 1}. ${String(o.text ?? '').trim()}`,
  );
  const correctTexts = options
    .map((o, i) =>
      o.isCorrect
        ? `${OPTION_LETTERS[i] ?? i + 1}. ${String(o.text ?? '').trim()}`
        : null,
    )
    .filter((v): v is string => Boolean(v));

  if (correctTexts.length === 0) return null;
  const front = `${prompt}\n${optionLines.join('\n')}`;
  const back = [
    `Đáp án đúng: ${correctTexts.join(' | ')}`,
    explanation?.trim() ? `Giải thích: ${explanation.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { front, back };
}

const QUIZ_FORMATTERS: Record<
  string,
  (
    prompt: string,
    data: Record<string, unknown>,
    explanation: string | null,
  ) => FormattedQuizQa | null
> = {
  [QuizQuestionType.SINGLE_CHOICE]: formatChoiceQa,
  [QuizQuestionType.MULTIPLE_CHOICE]: formatChoiceQa,
  [QuizQuestionType.TRUE_FALSE]: (prompt, data, explanation) => {
    if (typeof data.correctAnswer !== 'boolean') return null;
    const answerText = data.correctAnswer ? 'Đúng' : 'Sai';
    const back = [
      `Đáp án đúng: ${answerText}`,
      explanation?.trim() ? `Giải thích: ${explanation.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    return { front: `${prompt}\n(Đúng / Sai)`, back };
  },
  [QuizQuestionType.FILL_IN_BLANK]: (prompt, data, explanation) => {
    const accepted = Array.isArray(data.acceptedAnswers)
      ? data.acceptedAnswers.filter((a): a is string => typeof a === 'string')
      : [];
    if (accepted.length === 0) return null;
    const back = [
      `Đáp án đúng: ${accepted.join(' / ')}`,
      explanation?.trim() ? `Giải thích: ${explanation.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    return { front: prompt, back };
  },
};

function formatWrongQuestionToQa(q: SourceWrongQuestion): FormattedQuizQa | null {
  const data =
    q.data && typeof q.data === 'object' && !Array.isArray(q.data)
      ? (q.data as Record<string, unknown>)
      : {};
  const formatter = QUIZ_FORMATTERS[q.type];
  if (formatter) return formatter(q.prompt.trim(), data, q.explanation);
  if (!q.explanation?.trim()) return null;
  return { front: q.prompt.trim(), back: q.explanation.trim() };
}

const AI_SYSTEM_PROMPT = `Bạn là trợ lý học tập Lịch sử Việt Nam của nền tảng HISGO.
Nhiệm vụ: dựa vào danh sách GHI CHÚ cá nhân và BÀI VIẾT ĐÃ LƯU của người học, hãy tạo một bộ thẻ ghi nhớ (Flashcards) súc tích, chính xác, phục vụ ôn tập chủ động.
- Chỉ dùng dữ kiện có trong nguồn cung cấp, không bịa thêm sự kiện hay năm tháng.
- Mặt trước (front): câu hỏi ngắn gọn, rõ ràng hoặc thuật ngữ/mốc lịch sử.
- Mặt sau (back): đáp án súc tích, nêu rõ mốc thời gian, nhân vật, kết quả hoặc ý nghĩa.
- Trả về đúng JSON thuần túy (không markdown):
{
  "deckTitle": "Tên bộ thẻ ngắn gọn bằng tiếng Việt (tối đa 60 ký tự)",
  "cards": [
    { "front": "...", "back": "..." }
  ]
}`;

/** Rút văn bản thuần từ contentBlocks JSONB của Article để đưa vào ngữ cảnh AI. */
function extractPlainTextFromBlocks(blocks: unknown, maxChars = 1200): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const rec = block as Record<string, unknown>;
    for (const key of ['content', 'text', 'title', 'quote', 'caption']) {
      const val = rec[key];
      if (typeof val === 'string' && val.trim()) {
        parts.push(val.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      }
    }
    if (parts.join(' ').length >= maxChars) break;
  }
  return parts.join(' ').slice(0, maxChars);
}

@Injectable()
export class FlashcardAiService {
  private readonly logger = new Logger(FlashcardAiService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generatePreview(
    userId: string,
    dto: GenerateFlashcardsDto,
  ): Promise<GeneratedFlashcardPreview> {
    const includeNotes = dto.includeNotes ?? true;
    const includeWrongQuizzes = dto.includeWrongQuizzes ?? true;
    const maxCards = dto.maxCards ?? FLASHCARD_LIMITS.DEFAULT_AI_CARDS;
    const articleIds = dto.articleIds ?? [];

    const [notes, articles, wrongRows] = await Promise.all([
      includeNotes
        ? this.prisma.note.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: FLASHCARD_LIMITS.MAX_AI_NOTES,
            select: {
              id: true,
              kind: true,
              title: true,
              content: true,
              highlightText: true,
            },
          })
        : Promise.resolve([]),
      articleIds.length > 0
        ? this.prisma.article.findMany({
            where: {
              id: { in: articleIds },
              status: ContentStatus.PUBLISHED,
            },
            take: FLASHCARD_LIMITS.MAX_AI_ARTICLES,
            select: {
              id: true,
              title: true,
              summary: true,
              dateText: true,
              contentBlocks: true,
            },
          })
        : Promise.resolve([]),
      includeWrongQuizzes && this.prisma.quizAttemptAnswer?.findMany
        ? this.prisma.quizAttemptAnswer.findMany({
            where: { isCorrect: false, attempt: { userId } },
            distinct: ['questionId'],
            orderBy: { attempt: { createdAt: 'desc' } },
            take: maxCards,
            select: {
              question: {
                select: {
                  id: true,
                  type: true,
                  prompt: true,
                  explanation: true,
                  data: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const wrongQuestions = wrongRows.map((r) => r.question);

    if (
      notes.length === 0 &&
      articles.length === 0 &&
      wrongQuestions.length === 0
    ) {
      throw new BadRequestException(FLASHCARD_MESSAGES.NO_AI_SOURCES);
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      const aiResult = await this.callGemini(
        notes,
        articles,
        wrongQuestions,
        maxCards,
        apiKey,
      );
      if (aiResult && aiResult.cards.length > 0) {
        return {
          ...aiResult,
          engine: AiGeneratorEngine.GEMINI_FLASH,
          noteCount: notes.length,
          articleCount: articles.length,
          wrongQuizCount: wrongQuestions.length,
        };
      }
    }

    const fallback = this.buildHeuristicCards(
      notes,
      articles,
      wrongQuestions,
      maxCards,
    );
    return {
      ...fallback,
      engine: AiGeneratorEngine.HEURISTIC,
      noteCount: notes.length,
      articleCount: articles.length,
      wrongQuizCount: wrongQuestions.length,
    };
  }

  private buildPromptContext(
    notes: SourceNoteItem[],
    articles: SourceArticleItem[],
    wrongQuestions: SourceWrongQuestion[],
    maxCards: number,
  ): string {
    const noteLines = notes.map((n, i) => {
      const parts = [
        `[Ghi chú #${i + 1} | ${n.kind}]`,
        n.title ? `Tiêu đề: ${n.title}` : '',
        n.highlightText ? `Trích dẫn: "${n.highlightText}"` : '',
        n.content ? `Nội dung: ${n.content}` : '',
      ].filter(Boolean);
      return parts.join(' — ');
    });

    const articleLines = articles.map((a, i) => {
      const excerpt = extractPlainTextFromBlocks(a.contentBlocks);
      const parts = [
        `[Bài viết #${i + 1}] ${a.title}`,
        a.dateText ? `Niên đại: ${a.dateText}` : '',
        a.summary ? `Tóm tắt: ${a.summary}` : '',
        excerpt ? `Nội dung: ${excerpt}` : '',
      ].filter(Boolean);
      return parts.join(' | ');
    });

    const quizLines = wrongQuestions
      .map((q, i) => {
        const qa = formatWrongQuestionToQa(q);
        return qa ? `[Câu Quiz sai #${i + 1}]\nHỏi: ${qa.front}\nĐáp: ${qa.back}` : '';
      })
      .filter(Boolean);

    return [
      `Hãy tạo tối đa ${maxCards} thẻ flashcard từ các nguồn sau:`,
      noteLines.length ? `\n--- GHI CHÚ CỦA NGƯỜI HỌC ---\n${noteLines.join('\n')}` : '',
      articleLines.length ? `\n--- BÀI VIẾT ĐÃ LƯU ---\n${articleLines.join('\n')}` : '',
      quizLines.length ? `\n--- CÂU QUIZ TỪNG LÀM SAI ---\n${quizLines.join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async callGemini(
    notes: SourceNoteItem[],
    articles: SourceArticleItem[],
    wrongQuestions: SourceWrongQuestion[],
    maxCards: number,
    apiKey: string,
  ): Promise<{ deckTitle: string; cards: GeneratedCardDraft[] } | null> {
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      FLASHCARD_LIMITS.AI_TIMEOUT_MS,
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: this.buildPromptContext(
                    notes,
                    articles,
                    wrongQuestions,
                    maxCards,
                  ),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) return null;
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) return null;

      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as {
        deckTitle?: unknown;
        cards?: Array<{ front?: unknown; back?: unknown }>;
      };

      const cards = (Array.isArray(parsed.cards) ? parsed.cards : [])
        .map((c) => ({
          front: typeof c.front === 'string' ? c.front.trim() : '',
          back: typeof c.back === 'string' ? c.back.trim() : '',
        }))
        .filter((c) => c.front && c.back)
        .slice(0, maxCards);

      if (cards.length === 0) return null;
      const deckTitle =
        typeof parsed.deckTitle === 'string' && parsed.deckTitle.trim()
          ? parsed.deckTitle.trim().slice(0, FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH)
          : 'Bộ thẻ AI tổng hợp';
      return { deckTitle, cards };
    } catch (error) {
      this.logger.warn(`Gemini flashcard fallback: ${String(error)}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Bộ tổng hợp dự phòng khi chưa cấu hình GEMINI_API_KEY hoặc API tạm thời gián đoạn. */
  private buildHeuristicCards(
    notes: SourceNoteItem[],
    articles: SourceArticleItem[],
    wrongQuestions: SourceWrongQuestion[],
    maxCards: number,
  ): { deckTitle: string; cards: GeneratedCardDraft[] } {
    const cards: GeneratedCardDraft[] = [];

    for (const q of wrongQuestions) {
      if (cards.length >= maxCards) break;
      const qa = formatWrongQuestionToQa(q);
      if (qa) cards.push(qa);
    }

    for (const note of notes) {
      if (cards.length >= maxCards) break;
      const front = (
        note.highlightText ||
        note.title ||
        ''
      ).trim();
      const back = (note.content || note.highlightText || '').trim();
      if (!front || !back || (front === back && !note.content)) continue;
      cards.push({
        front:
          note.kind === 'DEFINITION'
            ? `Khái niệm / Thuật ngữ: "${front}" là gì?`
            : front,
        back,
        sourceNoteId: note.id,
      });
    }

    for (const article of articles) {
      if (cards.length >= maxCards) break;
      const back = (
        article.summary ||
        extractPlainTextFromBlocks(article.contentBlocks, 400)
      ).trim();
      if (!back) continue;
      const dateHint = article.dateText ? ` (${article.dateText})` : '';
      cards.push({
        front: `Nội dung trọng tâm của "${article.title}"${dateHint} là gì?`,
        back,
      });
    }

    const deckTitle =
      articles.length === 1 && notes.length === 0 && wrongQuestions.length === 0
        ? `Ôn tập: ${articles[0].title}`.slice(0, FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH)
        : wrongQuestions.length > 0 && notes.length === 0 && articles.length === 0
          ? 'Ôn lại câu Quiz từng làm sai'
          : 'Bộ thẻ ôn tập từ Ghi chú & Tư liệu';

    return { deckTitle, cards };
  }
}
