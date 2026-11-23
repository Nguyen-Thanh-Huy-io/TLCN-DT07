import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { ContentStatus, SavedMaterialKind } from '@prisma/client';
import config from '../common/config/app.config';
import { GoogleAiService } from '../common/services/google-ai.service';
import { PrismaService } from '../common/services/prisma.service';
import { GenerateFlashcardsDto } from './dto/flashcard.dto';
import {
  buildHeuristicFlashcardPreview,
  buildPromptContext,
  type GeneratedCardDraft,
  parseGeminiCardsResponse,
  pushUniqueCard,
  type SourceArticleItem,
  type SourceNoteItem,
  type SourceWrongQuestion,
} from './flashcard-ai.helper';
import {
  AiGeneratorEngine,
  FLASHCARD_AI_SYSTEM_PROMPT,
  FLASHCARD_LIMITS,
  FLASHCARD_MESSAGES,
} from './flashcard.constant';

export type { GeneratedCardDraft } from './flashcard-ai.helper';

export interface GeneratedFlashcardPreview {
  deckTitle: string;
  cards: GeneratedCardDraft[];
  engine: AiGeneratorEngine;
  noteCount: number;
  articleCount: number;
  wrongQuizCount: number;
}

@Injectable()
export class FlashcardAiService {
  private readonly googleAi: GoogleAiService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() googleAi?: GoogleAiService,
  ) {
    this.googleAi = googleAi ?? new GoogleAiService();
  }

  async generatePreview(
    userId: string,
    dto: GenerateFlashcardsDto,
  ): Promise<GeneratedFlashcardPreview> {
    const includeNotes = dto.includeNotes ?? true;
    const includeWrongQuizzes = dto.includeWrongQuizzes ?? true;
    const maxCards = dto.maxCards ?? FLASHCARD_LIMITS.DEFAULT_AI_CARDS;
    const topicHint = dto.topicHint?.trim();

    const articleIds = await this.resolveTargetArticleIds(
      userId,
      dto.articleIds,
    );

    const [notes, articles, wrongQuestions] = await Promise.all([
      this.fetchSourceNotes(userId, includeNotes),
      this.fetchSourceArticles(articleIds, topicHint),
      this.fetchWrongQuestions(userId, includeWrongQuizzes, maxCards),
    ]);

    if (
      !topicHint &&
      notes.length === 0 &&
      articles.length === 0 &&
      wrongQuestions.length === 0
    ) {
      throw new BadRequestException(FLASHCARD_MESSAGES.NO_AI_SOURCES);
    }

    if (this.googleAi.isConfigured()) {
      const aiResult = await this.callGemini(
        topicHint,
        notes,
        articles,
        wrongQuestions,
        maxCards,
      );
      if (aiResult && aiResult.cards.length > 0) {
        if (aiResult.cards.length < maxCards) {
          const topUp = buildHeuristicFlashcardPreview(
            topicHint,
            notes,
            articles,
            wrongQuestions,
            maxCards * 2,
          );
          for (const card of topUp.cards) {
            pushUniqueCard(aiResult.cards, card, maxCards);
          }
        }
        return {
          ...aiResult,
          engine: AiGeneratorEngine.GEMINI_FLASH,
          noteCount: notes.length,
          articleCount: articles.length,
          wrongQuizCount: wrongQuestions.length,
        };
      }
    }

    const fallback = buildHeuristicFlashcardPreview(
      topicHint,
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

  private async resolveTargetArticleIds(
    userId: string,
    explicitIds?: string[],
  ): Promise<string[]> {
    if (explicitIds && explicitIds.length > 0) {
      return explicitIds;
    }
    if (!this.prisma.savedMaterial?.findMany) {
      return [];
    }
    const saved = await this.prisma.savedMaterial.findMany({
      where: { userId, kind: SavedMaterialKind.ARTICLE },
      orderBy: { createdAt: 'desc' },
      take: FLASHCARD_LIMITS.MAX_AI_ARTICLES,
      select: { targetId: true },
    });
    return saved.map((s) => s.targetId);
  }

  private fetchSourceNotes(
    userId: string,
    includeNotes: boolean,
  ): Promise<SourceNoteItem[]> {
    if (!includeNotes) return Promise.resolve([]);
    return this.prisma.note.findMany({
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
    });
  }

  private async fetchSourceArticles(
    articleIds: string[],
    topicHint?: string,
  ): Promise<SourceArticleItem[]> {
    if (articleIds.length > 0) {
      return this.prisma.article.findMany({
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
      });
    }
    if (topicHint && this.prisma.article?.findMany) {
      return this.prisma.article.findMany({
        where: {
          status: ContentStatus.PUBLISHED,
          OR: [
            { title: { contains: topicHint, mode: 'insensitive' } },
            { summary: { contains: topicHint, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          summary: true,
          dateText: true,
          contentBlocks: true,
        },
      });
    }
    return [];
  }

  private async fetchWrongQuestions(
    userId: string,
    includeWrongQuizzes: boolean,
    maxCards: number,
  ): Promise<SourceWrongQuestion[]> {
    if (!includeWrongQuizzes || !this.prisma.quizAttemptAnswer?.findMany) {
      return [];
    }
    const rows = await this.prisma.quizAttemptAnswer.findMany({
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
    });
    return rows.map((r): SourceWrongQuestion => r.question);
  }

  private async callGemini(
    topicHint: string | undefined,
    notes: SourceNoteItem[],
    articles: SourceArticleItem[],
    wrongQuestions: SourceWrongQuestion[],
    maxCards: number,
  ): Promise<{ deckTitle: string; cards: GeneratedCardDraft[] } | null> {
    const ragCorpus =
      topicHint || articles.length > 0 ? config.google_cloud_rag_corpus : '';
    const grounded = await this.googleAi.generateGroundedJson<{
      deckTitle?: unknown;
      cards?: Array<{ front?: unknown; back?: unknown }>;
    }>({
      systemPrompt: FLASHCARD_AI_SYSTEM_PROMPT,
      userPrompt: buildPromptContext(
        topicHint,
        notes,
        articles,
        wrongQuestions,
        maxCards,
      ),
      temperature: FLASHCARD_LIMITS.AI_TEMPERATURE,
      maxOutputTokens: FLASHCARD_LIMITS.AI_MAX_OUTPUT_TOKENS,
      timeoutMs: FLASHCARD_LIMITS.AI_TIMEOUT_MS,
      contextLabel: 'flashcard',
      ...(ragCorpus
        ? {
            ragCorpus,
            topK: config.google_cloud_rag_top_k,
            vectorDistanceThreshold: config.google_cloud_rag_distance_threshold,
          }
        : {}),
    });

    if (!grounded) return null;
    return parseGeminiCardsResponse(grounded.data, maxCards, topicHint);
  }
}
