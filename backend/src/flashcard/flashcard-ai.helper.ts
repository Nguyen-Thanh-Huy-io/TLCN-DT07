import { FLASHCARD_LIMITS, FLASHCARD_TOPIC_ANGLES } from './flashcard.constant';
import { QuizQuestionType } from '../quiz/types/quiz-question.types';

export interface GeneratedCardDraft {
  front: string;
  back: string;
  sourceNoteId?: string;
}

export interface SourceNoteItem {
  id: string;
  kind: string;
  title: string | null;
  content: string;
  highlightText: string | null;
}

export interface SourceArticleItem {
  id: string;
  title: string;
  summary: string | null;
  dateText: string | null;
  contentBlocks: unknown;
}

export interface SourceWrongQuestion {
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
const ANSWER_PREFIX = 'Đáp án đúng: ';
const EXPLANATION_PREFIX = 'Giải thích: ';
const BLOCK_TEXT_KEYS = [
  'content',
  'text',
  'title',
  'quote',
  'caption',
] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function formatQuizBack(
  answerText: string,
  explanation: string | null,
): string {
  const explain = explanation?.trim()
    ? `${EXPLANATION_PREFIX}${explanation.trim()}`
    : '';
  return [`${ANSWER_PREFIX}${answerText}`, explain].filter(Boolean).join('\n');
}

function formatChoiceQa(
  prompt: string,
  data: Record<string, unknown>,
  explanation: string | null,
): FormattedQuizQa | null {
  const rawOptions = Array.isArray(data.options) ? data.options : [];
  const options = rawOptions.filter(
    (o): o is { id?: string; text?: string; isCorrect?: boolean } =>
      isPlainRecord(o),
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
  return {
    front: `${prompt}\n${optionLines.join('\n')}`,
    back: formatQuizBack(correctTexts.join(' | '), explanation),
  };
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
    return {
      front: `${prompt}\n(Đúng / Sai)`,
      back: formatQuizBack(answerText, explanation),
    };
  },
  [QuizQuestionType.FILL_IN_BLANK]: (prompt, data, explanation) => {
    const accepted = Array.isArray(data.acceptedAnswers)
      ? data.acceptedAnswers.filter((a): a is string => typeof a === 'string')
      : [];
    if (accepted.length === 0) return null;
    return {
      front: prompt,
      back: formatQuizBack(accepted.join(' / '), explanation),
    };
  },
};

export function formatWrongQuestionToQa(
  q: SourceWrongQuestion,
): FormattedQuizQa | null {
  const data = isPlainRecord(q.data) ? q.data : {};
  const formatter = QUIZ_FORMATTERS[q.type];
  if (formatter) return formatter(q.prompt.trim(), data, q.explanation);
  if (!q.explanation?.trim()) return null;
  return { front: q.prompt.trim(), back: q.explanation.trim() };
}

function extractTextFromSingleBlock(block: unknown): string[] {
  if (!isPlainRecord(block)) return [];
  const collected: string[] = [];
  for (const key of BLOCK_TEXT_KEYS) {
    const val = block[key];
    if (typeof val === 'string' && val.trim()) {
      collected.push(
        val
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      );
    }
  }
  return collected;
}

/** Rút văn bản thuần từ contentBlocks JSONB của Article để đưa vào ngữ cảnh AI. */
export function extractPlainTextFromBlocks(
  blocks: unknown,
  maxChars: number = FLASHCARD_LIMITS.AI_ARTICLE_EXCERPT_CHARS,
): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    parts.push(...extractTextFromSingleBlock(block));
    if (parts.join(' ').length >= maxChars) break;
  }
  return parts.join(' ').slice(0, maxChars);
}

export function pushUniqueCard(
  cards: GeneratedCardDraft[],
  card: GeneratedCardDraft | null,
  maxCards: number,
): void {
  if (!card || cards.length >= maxCards) return;
  const key = card.front.trim().toLowerCase();
  if (cards.some((c) => c.front.trim().toLowerCase() === key)) return;
  cards.push(card);
}

/** Gom các câu liên tiếp thành đoạn đủ đầy đặn (~260–900 ký tự) thay vì cắt cụt một câu lẻ. */
function buildArticleParagraphs(article: SourceArticleItem): string[] {
  const text = extractPlainTextFromBlocks(
    article.contentBlocks,
    FLASHCARD_LIMITS.HEURISTIC_ARTICLE_EXTRACT_CHARS,
  );
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= FLASHCARD_LIMITS.MIN_SENTENCE_CHARS);

  const paragraphs: string[] = [];
  let buffer = '';
  for (const sentence of sentences) {
    const candidate = buffer ? `${buffer} ${sentence}` : sentence;
    if (
      buffer.length >= FLASHCARD_LIMITS.TARGET_HEURISTIC_CARD_CHARS ||
      candidate.length > FLASHCARD_LIMITS.HEURISTIC_ARTICLE_CARD_CHARS
    ) {
      paragraphs.push(
        buffer.slice(0, FLASHCARD_LIMITS.HEURISTIC_ARTICLE_CARD_CHARS),
      );
      buffer = sentence;
    } else {
      buffer = candidate;
    }
    if (paragraphs.length >= FLASHCARD_LIMITS.MAX_ARTICLE_PARAGRAPHS) break;
  }
  if (buffer && paragraphs.length < FLASHCARD_LIMITS.MAX_ARTICLE_PARAGRAPHS) {
    paragraphs.push(
      buffer.slice(0, FLASHCARD_LIMITS.HEURISTIC_ARTICLE_CARD_CHARS),
    );
  }
  return paragraphs;
}

function toCardsFromArticle(article: SourceArticleItem): GeneratedCardDraft[] {
  const result: GeneratedCardDraft[] = [];
  const dateHint = article.dateText ? ` (${article.dateText})` : '';
  const bodyExcerpt = extractPlainTextFromBlocks(
    article.contentBlocks,
    FLASHCARD_LIMITS.HEURISTIC_ARTICLE_CARD_CHARS,
  );
  const summaryParts = [
    article.summary?.trim() || '',
    article.summary &&
    bodyExcerpt &&
    !bodyExcerpt.startsWith(article.summary.trim().slice(0, 30))
      ? bodyExcerpt
      : '',
  ].filter(Boolean);
  const summary = (summaryParts.join('\n') || bodyExcerpt).slice(
    0,
    FLASHCARD_LIMITS.HEURISTIC_ARTICLE_CARD_CHARS,
  );

  if (summary) {
    result.push({
      front: `Nội dung trọng tâm của "${article.title}"${dateHint} là gì?`,
      back: summary,
    });
  }
  if (article.dateText) {
    result.push({
      front: `"${article.title}" diễn ra vào thời gian nào và gắn với bối cảnh gì?`,
      back: [
        `• Mốc thời gian: ${article.dateText}.`,
        article.summary?.trim()
          ? `• Nội dung chính: ${article.summary.trim()}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }
  buildArticleParagraphs(article).forEach((paragraph, idx) => {
    result.push({
      front: `Luận điểm trọng tâm #${idx + 1} trong "${article.title}" là gì?`,
      back: paragraph,
    });
  });
  return result;
}

function splitTopicHint(topic: string): string[] {
  const subTopics = topic
    .split(/[,;\n]|\s+và\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);
  return [topic, ...subTopics.filter((s) => s !== topic)];
}

export function buildPromptContext(
  topicHint: string | undefined,
  notes: SourceNoteItem[],
  articles: SourceArticleItem[],
  wrongQuestions: SourceWrongQuestion[],
  maxCards: number,
): string {
  const noteLines = notes.map((n, i) =>
    [
      `[Ghi chú #${i + 1} | ${n.kind}]`,
      n.title ? `Tiêu đề: ${n.title}` : '',
      n.highlightText ? `Trích dẫn: "${n.highlightText}"` : '',
      n.content ? `Nội dung: ${n.content}` : '',
    ]
      .filter(Boolean)
      .join(' — '),
  );

  const articleLines = articles.map((a, i) => {
    const excerpt = extractPlainTextFromBlocks(
      a.contentBlocks,
      FLASHCARD_LIMITS.AI_ARTICLE_EXCERPT_CHARS,
    );
    return [
      `[Bài viết #${i + 1}] ${a.title}`,
      a.dateText ? `Niên đại: ${a.dateText}` : '',
      a.summary ? `Tóm tắt: ${a.summary}` : '',
      excerpt ? `Nội dung: ${excerpt}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
  });

  const quizLines = wrongQuestions
    .map((q, i) => {
      const qa = formatWrongQuestionToQa(q);
      return qa
        ? `[Câu Quiz sai #${i + 1}]\nHỏi: ${qa.front}\nĐáp: ${qa.back}`
        : '';
    })
    .filter(Boolean);

  return [
    `Hãy tạo ĐÚNG ${maxCards} thẻ flashcard Lịch sử Việt Nam chuyên sâu (không ít hơn, không nhiều hơn). Yêu cầu mỗi thẻ có mặt sau (back) giải thích ĐẦY ĐỦ 3–5 câu hoặc gạch đầu dòng chi tiết (nêu rõ mốc thời gian, nhân vật, diễn biến/nguyên nhân, kết quả và ý nghĩa lịch sử), TUYỆT ĐỐI không viết cụt ngủn 1 dòng.`,
    topicHint
      ? `\n--- CHỦ ĐỀ LỊCH SỬ TRỌNG TÂM ---\n"${topicHint}" (Hãy vận dụng tri thức chuẩn SGK Lịch sử Việt Nam về chủ đề này kết hợp với tư liệu bên dưới nếu có).`
      : '',
    noteLines.length
      ? `\n--- GHI CHÚ CỦA NGƯỜI HỌC ---\n${noteLines.join('\n')}`
      : '',
    articleLines.length
      ? `\n--- BÀI VIẾT THAM KHẢO ---\n${articleLines.join('\n')}`
      : '',
    quizLines.length
      ? `\n--- CÂU QUIZ TỪNG LÀM SAI ---\n${quizLines.join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function parseGeminiCardsResponse(
  parsed: {
    deckTitle?: unknown;
    cards?: Array<{ front?: unknown; back?: unknown }>;
  },
  maxCards: number,
  topicHint?: string,
): { deckTitle: string; cards: GeneratedCardDraft[] } | null {
  const cards = (Array.isArray(parsed.cards) ? parsed.cards : [])
    .map((c) => ({
      front: typeof c.front === 'string' ? c.front.trim() : '',
      back: typeof c.back === 'string' ? c.back.trim() : '',
    }))
    .filter((c) => c.front && c.back)
    .slice(0, maxCards);

  if (cards.length === 0) return null;
  const fallbackTitle = topicHint
    ? `Ôn tập: ${topicHint}`
    : 'Bộ thẻ AI tổng hợp';
  const deckTitle =
    typeof parsed.deckTitle === 'string' && parsed.deckTitle.trim()
      ? parsed.deckTitle.trim().slice(0, FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH)
      : fallbackTitle.slice(0, FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH);
  return { deckTitle, cards };
}

function appendCardsFromWrongQuestions(
  cards: GeneratedCardDraft[],
  wrongQuestions: SourceWrongQuestion[],
  maxCards: number,
): void {
  for (const q of wrongQuestions) {
    if (cards.length >= maxCards) return;
    const qa = formatWrongQuestionToQa(q);
    if (qa) cards.push(qa);
  }
}

function appendCardsFromNotes(
  cards: GeneratedCardDraft[],
  notes: SourceNoteItem[],
  maxCards: number,
): void {
  for (const note of notes) {
    if (cards.length >= maxCards) return;
    const front = (note.highlightText || note.title || '').trim();
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
}

function appendCardsFromArticles(
  cards: GeneratedCardDraft[],
  articles: SourceArticleItem[],
  maxCards: number,
): void {
  const perArticle = articles.map(toCardsFromArticle);
  const longest = Math.max(0, ...perArticle.map((list) => list.length));
  for (let i = 0; i < longest; i++) {
    for (const list of perArticle) {
      if (cards.length >= maxCards) return;
      pushUniqueCard(cards, list[i] ?? null, maxCards);
    }
  }
}

function appendCardsFromTopicHint(
  cards: GeneratedCardDraft[],
  topicHint: string | undefined,
  maxCards: number,
): void {
  const topic = topicHint?.trim();
  if (!topic) return;
  for (const angle of FLASHCARD_TOPIC_ANGLES) {
    for (const sub of splitTopicHint(topic)) {
      if (cards.length >= maxCards) return;
      pushUniqueCard(
        cards,
        {
          front: angle.front.replace('{t}', sub),
          back: angle.back.replaceAll('{t}', sub),
        },
        maxCards,
      );
    }
  }
}

function resolveHeuristicDeckTitle(
  topicHint: string | undefined,
  notes: SourceNoteItem[],
  articles: SourceArticleItem[],
  wrongQuestions: SourceWrongQuestion[],
): string {
  if (topicHint?.trim()) {
    return `Ôn tập: ${topicHint.trim()}`.slice(
      0,
      FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH,
    );
  }
  if (
    articles.length === 1 &&
    notes.length === 0 &&
    wrongQuestions.length === 0
  ) {
    return `Ôn tập: ${articles[0].title}`.slice(
      0,
      FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH,
    );
  }
  if (
    wrongQuestions.length > 0 &&
    notes.length === 0 &&
    articles.length === 0
  ) {
    return 'Ôn lại câu Quiz từng làm sai';
  }
  return 'Bộ thẻ ôn tập từ Ghi chú & Tư liệu';
}

/** Bộ tổng hợp dự phòng khi chưa cấu hình AI hoặc API tạm thời gián đoạn. */
export function buildHeuristicFlashcardPreview(
  topicHint: string | undefined,
  notes: SourceNoteItem[],
  articles: SourceArticleItem[],
  wrongQuestions: SourceWrongQuestion[],
  maxCards: number,
): { deckTitle: string; cards: GeneratedCardDraft[] } {
  const cards: GeneratedCardDraft[] = [];

  appendCardsFromWrongQuestions(cards, wrongQuestions, maxCards);
  appendCardsFromNotes(cards, notes, maxCards);
  appendCardsFromArticles(cards, articles, maxCards);
  appendCardsFromTopicHint(cards, topicHint, maxCards);

  const deckTitle = resolveHeuristicDeckTitle(
    topicHint,
    notes,
    articles,
    wrongQuestions,
  );
  return { deckTitle, cards };
}
