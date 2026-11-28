import { Injectable, Logger, Optional } from '@nestjs/common';
import config from '../common/config/app.config';
import {
  GoogleAiService,
  RagGroundingChunk,
} from '../common/services/google-ai.service';
import { PrismaService } from '../common/services/prisma.service';
import {
  AI_ASSISTANT_LIMITS,
  AI_ASSISTANT_MESSAGES,
  AssistantEngine,
  AssistantLinkKind,
  HISGO_GOOGLE_GROUNDED_PROMPT,
  HISGO_SYSTEM_PROMPT,
} from './ai-assistant.constant';
import {
  mergeAssistantSuggestedLinks,
  resolveRagGroundingAttachments,
  selectStrictHisgoRagChunks,
  verifyRagSuggestedLinksInDb,
} from './ai-assistant.rag';
import {
  LABEL_CURRICULUM,
  matchFeatureGuideRule,
  ROUTE_ARTICLES,
  ROUTE_CURRICULUM,
  ROUTE_FLASHCARDS,
  ROUTE_GAMIFICATION,
  ROUTE_MINDMAPS,
  ROUTE_PRACTICE,
  ROUTE_TIMELINE,
} from './ai-assistant.guide';
import {
  isAskingCurrentPageSummary,
  resolveCurrentPageSnapshot,
  shouldUseRagForMessage,
} from './ai-assistant.search';
import {
  AiAssistantChatResponse,
  AssistantQuickAction,
  AssistantSuggestedLink,
  AssistantWebSource,
  PageContentSnapshot,
  UserStudySnapshot,
} from './ai-assistant.types';
import { AskAiAssistantDto, ChatHistoryItemDto } from './dto/ai-assistant.dto';

export type {
  AiAssistantChatResponse,
  AssistantQuickAction,
  AssistantSourceCitation,
  AssistantSuggestedLink,
  AssistantWebSource,
} from './ai-assistant.types';

interface RawGeminiAssistantPayload {
  groundedInCorpus?: unknown;
  isHistoricalScope?: unknown;
  reply?: unknown;
  quickActions?: Array<{ label?: unknown; href?: unknown }>;
}

function resolveWebHostname(uri: string, explicitDomain?: string): string {
  if (explicitDomain?.trim()) return explicitDomain.trim();
  try {
    const host = new URL(uri).hostname.replace(/^www\./i, '');
    return host.includes('vertexaisearch.cloud.google.com') ? '' : host;
  } catch {
    return '';
  }
}

function extractAssistantWebSources(
  chunks: ReadonlyArray<RagGroundingChunk>,
): AssistantWebSource[] {
  const seen = new Set<string>();
  const sources: AssistantWebSource[] = [];
  for (const chunk of chunks) {
    if (!chunk.isWeb || !chunk.uri || seen.has(chunk.uri)) continue;
    seen.add(chunk.uri);
    const domain = resolveWebHostname(chunk.uri, chunk.domain);
    const snippet = chunk.text?.trim() || undefined;
    sources.push({
      title: chunk.title || domain || chunk.uri,
      uri: chunk.uri,
      ...(domain ? { domain } : {}),
      ...(snippet ? { snippet } : {}),
    });
    if (sources.length >= AI_ASSISTANT_LIMITS.MAX_WEB_SOURCES) break;
  }
  return sources;
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly googleAi: GoogleAiService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() googleAi?: GoogleAiService,
  ) {
    this.googleAi = googleAi ?? new GoogleAiService();
  }

  async chat(
    userId: string | undefined,
    dto: AskAiAssistantDto,
  ): Promise<AiAssistantChatResponse> {
    const message = dto.message.trim();
    const currentPath = dto.currentPath?.trim();
    const pageContext = dto.pageContext?.trim();
    const history = dto.history ?? [];
    const useGoogleSearch = Boolean(dto.useGoogleSearch);

    const [pageSnapshot, userSnapshot] = await Promise.all([
      resolveCurrentPageSnapshot(this.prisma, currentPath, pageContext).catch(
        (err: unknown) => {
          this.logger.warn(`resolveCurrentPageSnapshot error: ${String(err)}`);
          return null;
        },
      ),
      this.fetchUserStudySnapshot(userId),
    ]);

    if (useGoogleSearch) {
      return this.handleGoogleGroundedChat(
        message,
        currentPath,
        history,
        pageSnapshot,
        userSnapshot,
      );
    }

    return this.handleStrictRagOrSystemChat(
      message,
      currentPath,
      history,
      pageSnapshot,
      userSnapshot,
    );
  }

  private async handleGoogleGroundedChat(
    message: string,
    currentPath: string | undefined,
    history: ChatHistoryItemDto[],
    pageSnapshot: PageContentSnapshot | null,
    userSnapshot: UserStudySnapshot | null,
  ): Promise<AiAssistantChatResponse> {
    if (!this.googleAi.isConfigured()) {
      return {
        reply: AI_ASSISTANT_MESSAGES.GOOGLE_UNAVAILABLE,
        engine: AssistantEngine.HEURISTIC,
        contextLabel: pageSnapshot?.title,
        suggestedLinks: [],
        sourceCitations: [],
        webSources: [],
        webSearchQueries: [],
        quickActions: [],
      };
    }

    const grounded =
      await this.googleAi.generateGroundedJson<RawGeminiAssistantPayload>({
        systemPrompt: this.buildContextualSystemPrompt(
          HISGO_GOOGLE_GROUNDED_PROMPT,
          message,
          currentPath,
          history.filter(
            (h) =>
              !h.content.includes('chưa có tư liệu trong kho dữ liệu lịch sử'),
          ),
          pageSnapshot,
          userSnapshot,
          true,
        ),
        userPrompt: message,
        enableGoogleSearch: true,
        disableUngroundedFallback: true,
        temperature: 0.3,
        timeoutMs: AI_ASSISTANT_LIMITS.AI_TIMEOUT_MS,
        contextLabel: 'assistant-google',
      });

    if (!grounded) {
      return {
        reply: AI_ASSISTANT_MESSAGES.GOOGLE_UNAVAILABLE,
        engine: AssistantEngine.HEURISTIC,
        contextLabel: pageSnapshot?.title,
        suggestedLinks: [],
        sourceCitations: [],
        webSources: [],
        webSearchQueries: [],
        quickActions: [],
      };
    }

    if (grounded.data?.isHistoricalScope === false) {
      return {
        reply: AI_ASSISTANT_MESSAGES.NON_HISTORICAL_REJECTED,
        engine: AssistantEngine.HEURISTIC,
        contextLabel: pageSnapshot?.title,
        suggestedLinks: [],
        sourceCitations: [],
        webSources: [],
        webSearchQueries: [],
        quickActions: [
          { label: 'Khám phá Bài viết', href: ROUTE_ARTICLES },
          { label: 'Bản đồ Khái niệm AI', href: '/kham-pha-khai-niem' },
        ],
      };
    }

    const parsed = this.parseGeminiChatResponse(grounded.data);
    if (!parsed) {
      return {
        reply: AI_ASSISTANT_MESSAGES.GOOGLE_UNAVAILABLE,
        engine: AssistantEngine.HEURISTIC,
        contextLabel: pageSnapshot?.title,
        suggestedLinks: [],
        sourceCitations: [],
        webSources: [],
        webSearchQueries: [],
        quickActions: [],
      };
    }

    const includeCurrentPage =
      Boolean(pageSnapshot) && pageSnapshot?.kind !== AssistantLinkKind.ROUTE;
    const suggestedLinks = mergeAssistantSuggestedLinks(
      includeCurrentPage ? pageSnapshot : null,
      [],
      [],
    );

    return {
      reply: parsed.reply,
      engine: AssistantEngine.GOOGLE_GROUNDED,
      contextLabel: pageSnapshot?.title,
      suggestedLinks,
      sourceCitations: [],
      webSources: extractAssistantWebSources(grounded.groundingChunks),
      webSearchQueries: grounded.webSearchQueries ?? [],
      quickActions: parsed.quickActions,
    };
  }

  private async handleStrictRagOrSystemChat(
    message: string,
    currentPath: string | undefined,
    history: ChatHistoryItemDto[],
    pageSnapshot: PageContentSnapshot | null,
    userSnapshot: UserStudySnapshot | null,
  ): Promise<AiAssistantChatResponse> {
    const useRagSearch = shouldUseRagForMessage(
      message,
      Boolean(pageSnapshot?.summary),
    );
    const ragCorpus = useRagSearch
      ? config.google_cloud_rag_corpus?.trim()
      : '';

    if (this.googleAi.isConfigured() && (!useRagSearch || Boolean(ragCorpus))) {
      const grounded =
        await this.googleAi.generateGroundedJson<RawGeminiAssistantPayload>({
          systemPrompt: this.buildContextualSystemPrompt(
            HISGO_SYSTEM_PROMPT,
            message,
            currentPath,
            history,
            pageSnapshot,
            userSnapshot,
            false,
          ),
          userPrompt: message,
          temperature: 0.25,
          timeoutMs: AI_ASSISTANT_LIMITS.AI_TIMEOUT_MS,
          contextLabel: 'assistant-rag',
          ...(ragCorpus
            ? {
                ragCorpus,
                topK: Math.max(
                  config.google_cloud_rag_top_k,
                  AI_ASSISTANT_LIMITS.RAG_TOP_K,
                ),
                vectorDistanceThreshold:
                  AI_ASSISTANT_LIMITS.STRICT_RAG_DISTANCE_THRESHOLD,
                disableUngroundedFallback: true,
              }
            : {}),
        });

      if (grounded) {
        const allRagChunks = grounded.groundingChunks.filter((c) => !c.isWeb);
        const groundedInCorpus = grounded.data?.groundedInCorpus !== false;
        const { hisgoChunks, relevantChunks } =
          selectStrictHisgoRagChunks(allRagChunks);

        if (useRagSearch && (hisgoChunks.length === 0 || !groundedInCorpus)) {
          return this.buildOutOfCorpusRagReply(pageSnapshot);
        }

        const parsed = this.parseGeminiChatResponse(grounded.data);
        if (parsed) {
          const ragAttachments = resolveRagGroundingAttachments(relevantChunks);
          const verifiedRagLinks = await verifyRagSuggestedLinksInDb(
            this.prisma,
            ragAttachments.links,
          );
          const includeCurrentPage =
            Boolean(pageSnapshot) &&
            (pageSnapshot?.kind !== AssistantLinkKind.ROUTE || !useRagSearch);

          const suggestedLinks = mergeAssistantSuggestedLinks(
            includeCurrentPage ? pageSnapshot : null,
            verifiedRagLinks,
            [],
          );

          return {
            reply: parsed.reply,
            engine:
              useRagSearch && hisgoChunks.length > 0
                ? AssistantEngine.VERTEX_RAG
                : AssistantEngine.GEMINI_FLASH,
            contextLabel: pageSnapshot?.title,
            suggestedLinks,
            sourceCitations: ragAttachments.citations,
            webSources: [],
            webSearchQueries: [],
            quickActions: parsed.quickActions,
          };
        }
      } else if (useRagSearch) {
        return {
          reply: AI_ASSISTANT_MESSAGES.RAG_TEMPORARILY_UNAVAILABLE,
          engine: AssistantEngine.HEURISTIC,
          contextLabel: pageSnapshot?.title,
          suggestGoogleFallback: true,
          suggestedLinks: [],
          sourceCitations: [],
          webSources: [],
          webSearchQueries: [],
          quickActions: [
            { label: 'Khám phá Kho bài viết', href: ROUTE_ARTICLES },
            { label: 'Bản đồ Khái niệm AI', href: '/kham-pha-khai-niem' },
          ],
        };
      }
    } else if (useRagSearch) {
      return this.buildOutOfCorpusRagReply(pageSnapshot);
    }

    const suggestedLinks = mergeAssistantSuggestedLinks(pageSnapshot, [], []);
    const fallback = this.buildHeuristicReply(
      message,
      pageSnapshot,
      suggestedLinks,
      userSnapshot,
    );
    return {
      reply: fallback.reply,
      engine: AssistantEngine.HEURISTIC,
      contextLabel: pageSnapshot?.title,
      suggestedLinks,
      sourceCitations: [],
      webSources: [],
      webSearchQueries: [],
      quickActions: fallback.quickActions,
    };
  }

  private buildOutOfCorpusRagReply(
    pageSnapshot: PageContentSnapshot | null,
  ): AiAssistantChatResponse {
    return {
      reply: AI_ASSISTANT_MESSAGES.NO_RAG_MATCH,
      engine: AssistantEngine.HEURISTIC,
      contextLabel: pageSnapshot?.title,
      suggestGoogleFallback: true,
      suggestedLinks: [],
      sourceCitations: [],
      webSources: [],
      webSearchQueries: [],
      quickActions: [
        { label: 'Khám phá Kho bài viết', href: ROUTE_ARTICLES },
        { label: 'Bản đồ Khái niệm AI', href: '/kham-pha-khai-niem' },
      ],
    };
  }

  private async fetchUserStudySnapshot(
    userId?: string,
  ): Promise<UserStudySnapshot | null> {
    if (!userId) return null;
    try {
      const [stats, dueFlashcards, mindmapCount, savedCount] =
        await Promise.all([
          this.prisma.userLearningStats?.findUnique
            ? this.prisma.userLearningStats.findUnique({
                where: { userId },
                select: { totalXp: true, currentDayStreak: true },
              })
            : Promise.resolve(null),
          this.prisma.flashcard?.count
            ? this.prisma.flashcard.count({
                where: { ownerId: userId, nextReviewAt: { lte: new Date() } },
              })
            : Promise.resolve(0),
          this.prisma.studyMindmap?.count
            ? this.prisma.studyMindmap.count({ where: { ownerId: userId } })
            : Promise.resolve(0),
          this.prisma.savedMaterial?.count
            ? this.prisma.savedMaterial.count({ where: { userId } })
            : Promise.resolve(0),
        ]);

      return {
        totalXp: stats?.totalXp ?? 0,
        currentDayStreak: stats?.currentDayStreak ?? 0,
        dueFlashcards,
        mindmapCount,
        savedCount,
      };
    } catch {
      return null;
    }
  }

  private buildContextualSystemPrompt(
    baseSystemPrompt: string,
    message: string,
    currentPath: string | undefined,
    history: ChatHistoryItemDto[],
    pageSnapshot: PageContentSnapshot | null,
    userSnapshot: UserStudySnapshot | null,
    isGoogleMode: boolean,
  ): string {
    const isAskingAboutCurrentPage = isAskingCurrentPageSummary(message);
    const includeFullPage =
      Boolean(pageSnapshot) &&
      (!isGoogleMode ||
        isAskingAboutCurrentPage ||
        pageSnapshot?.kind !== AssistantLinkKind.ROUTE);

    const historyBlock =
      history.length > 0
        ? `LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY:\n${history
            .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
            .join('\n')}`
        : '';

    const pageBlock =
      includeFullPage && pageSnapshot
        ? `BÀI NGƯỜI DÙNG ĐANG XEM TRÊN MÀN HÌNH (${currentPath}):\nTiêu đề: ${pageSnapshot.title}\nNội dung tóm tắt: ${pageSnapshot.summary}`
        : currentPath
          ? `TRANG HIỆN TẠI NGƯỜI DÙNG ĐANG ĐỨNG: ${currentPath}`
          : '';

    const userBlock = userSnapshot
      ? `TIẾN ĐỘ HỌC TẬP CÁ NHÂN CỦA NGƯỜI DÙNG ĐANG ĐĂNG NHẬP:\n- Tổng XP: ${userSnapshot.totalXp} XP | Streak: ${userSnapshot.currentDayStreak} ngày\n- Thẻ Flashcard đến hạn hôm nay: ${userSnapshot.dueFlashcards} thẻ | Mindmap: ${userSnapshot.mindmapCount} | Tư liệu đã lưu: ${userSnapshot.savedCount}`
      : 'Người dùng hiện chưa đăng nhập (khách vãng lai).';

    return [baseSystemPrompt, historyBlock, pageBlock, userBlock]
      .filter(Boolean)
      .join('\n\n');
  }

  private parseGeminiChatResponse(parsed: RawGeminiAssistantPayload): {
    reply: string;
    quickActions: AssistantQuickAction[];
  } | null {
    const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
    if (!reply) return null;

    const quickActions: AssistantQuickAction[] = (
      Array.isArray(parsed.quickActions) ? parsed.quickActions : []
    )
      .map((a) => ({
        label: typeof a.label === 'string' ? a.label.trim().slice(0, 45) : '',
        href: typeof a.href === 'string' ? a.href.trim() : '',
      }))
      .filter((a) => a.label && a.href.startsWith('/'))
      .slice(0, AI_ASSISTANT_LIMITS.MAX_QUICK_ACTIONS);

    return { reply, quickActions };
  }

  private buildHeuristicReply(
    message: string,
    pageSnapshot: PageContentSnapshot | null,
    suggestedLinks: AssistantSuggestedLink[],
    userSnapshot: UserStudySnapshot | null,
  ): { reply: string; quickActions: AssistantQuickAction[] } {
    if (pageSnapshot && isAskingCurrentPageSummary(message)) {
      return {
        reply: `📜 **Tóm tắt trang bạn đang xem — "${pageSnapshot.title}"**:\n• ${pageSnapshot.summary}\n\nBạn muốn khám phá sâu mục nào trên trang này hay chuyển sang công cụ học tập AI?`,
        quickActions: [
          { label: 'Dòng thời gian Đa tầng', href: ROUTE_TIMELINE },
          { label: LABEL_CURRICULUM, href: ROUTE_CURRICULUM },
          { label: 'Tạo Flashcard AI', href: ROUTE_FLASHCARDS },
          { label: 'Sơ đồ tư duy AI', href: ROUTE_MINDMAPS },
        ],
      };
    }

    if (/tiến độ|hôm nay|cần ôn|tài khoản của tôi|thành tích/i.test(message)) {
      if (userSnapshot) {
        return {
          reply: `📊 **Tổng quan học tập hiện tại của bạn trên HISGO**:\n• Chuỗi ngày học liên tiếp (Streak): **${userSnapshot.currentDayStreak} ngày** | Tổng điểm: **${userSnapshot.totalXp} XP**\n• Thẻ ghi nhớ (Flashcards) cần ôn hôm nay: **${userSnapshot.dueFlashcards} thẻ**\n• Sơ đồ tư duy đã dựng: **${userSnapshot.mindmapCount} sơ đồ** | Tư liệu đã lưu: **${userSnapshot.savedCount} mục**`,
          quickActions: [
            {
              label: `Ôn Flashcard (${userSnapshot.dueFlashcards})`,
              href: ROUTE_FLASHCARDS,
            },
            { label: 'Mục tiêu & XP', href: ROUTE_GAMIFICATION },
            { label: 'Sơ đồ tư duy', href: ROUTE_MINDMAPS },
          ],
        };
      }
      return {
        reply:
          'Bạn hãy **Đăng nhập** tài khoản để tôi kiểm tra chuỗi ngày học (Streak), điểm kinh nghiệm XP và số thẻ Flashcard cần ôn tập hôm nay của bạn nhé!',
        quickActions: [
          { label: 'Đăng nhập ngay', href: '/login' },
          { label: LABEL_CURRICULUM, href: ROUTE_CURRICULUM },
        ],
      };
    }

    const matchedGuide = matchFeatureGuideRule(message);
    if (matchedGuide) {
      return { reply: matchedGuide.reply, quickActions: matchedGuide.actions };
    }

    if (suggestedLinks.length > 0) {
      const details = suggestedLinks
        .map(
          (l) =>
            `• **${l.title}**: ${l.subtitle || 'Tư liệu chuẩn trong kho tri thức HISGO'}`,
        )
        .join('\n');
      return {
        reply: `📚 **Các mục lịch sử liên quan đến câu hỏi của bạn**:\n${details}\n\nBạn hãy bấm trực tiếp vào các đường dẫn bên dưới để xem chi tiết nội dung và tư liệu nguồn nhé!`,
        quickActions: [
          { label: LABEL_CURRICULUM, href: ROUTE_CURRICULUM },
          { label: 'Luyện tập trắc nghiệm', href: ROUTE_PRACTICE },
        ],
      };
    }

    return {
      reply:
        'Xin chào! Tôi là **Sử Gia AI — Trợ lý tra cứu sử học & điều hướng của HISGO**. Bạn có thể hỏi về **Sự kiện, Nhân vật, Di tích Lịch sử Việt Nam & Thế giới**, hoặc yêu cầu tóm tắt bài viết bạn đang đọc để nhận đường dẫn chi tiết.',
      quickActions: [
        { label: 'Khám phá Bài viết', href: ROUTE_ARTICLES },
        { label: 'Thẻ ghi nhớ AI', href: ROUTE_FLASHCARDS },
        { label: 'Sơ đồ tư duy AI', href: ROUTE_MINDMAPS },
        { label: 'Phòng Luyện tập', href: ROUTE_PRACTICE },
      ],
    };
  }
}
