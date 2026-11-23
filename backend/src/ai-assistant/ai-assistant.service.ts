import { Injectable, Logger, Optional } from '@nestjs/common';
import config from '../common/config/app.config';
import { GoogleAiService } from '../common/services/google-ai.service';
import { PrismaService } from '../common/services/prisma.service';
import {
  AI_ASSISTANT_LIMITS,
  AssistantEngine,
  AssistantLinkKind,
  HISGO_SYSTEM_PROMPT,
} from './ai-assistant.constant';
import {
  mergeAssistantSuggestedLinks,
  resolveRagGroundingAttachments,
} from './ai-assistant.rag';
import {
  FEATURE_GUIDE_RULES,
  LABEL_CURRICULUM,
  ROUTE_ARTICLES,
  ROUTE_CURRICULUM,
  ROUTE_FLASHCARDS,
  ROUTE_GAMIFICATION,
  ROUTE_MINDMAPS,
  ROUTE_PRACTICE,
  ROUTE_TIMELINE,
} from './ai-assistant.guide';
import {
  resolveCurrentPageSnapshot,
  searchMultiEntityContent,
  shouldUseRagForMessage,
} from './ai-assistant.search';
import {
  AiAssistantChatResponse,
  AssistantQuickAction,
  AssistantSuggestedLink,
  PageContentSnapshot,
  UserStudySnapshot,
} from './ai-assistant.types';
import { AskAiAssistantDto, ChatHistoryItemDto } from './dto/ai-assistant.dto';

export type {
  AiAssistantChatResponse,
  AssistantQuickAction,
  AssistantSourceCitation,
  AssistantSuggestedLink,
} from './ai-assistant.types';

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

    const [pageSnapshot, userSnapshot] = await Promise.all([
      resolveCurrentPageSnapshot(this.prisma, currentPath, pageContext).catch(
        (err: unknown) => {
          this.logger.warn(`resolveCurrentPageSnapshot error: ${String(err)}`);
          return null;
        },
      ),
      this.fetchUserStudySnapshot(userId),
    ]);

    const useRagSearch = shouldUseRagForMessage(
      message,
      Boolean(pageSnapshot?.summary),
    );
    const dbLinks = useRagSearch
      ? await searchMultiEntityContent(this.prisma, message).catch(
          (err: unknown) => {
            this.logger.warn(`searchMultiEntityContent error: ${String(err)}`);
            return [] as AssistantSuggestedLink[];
          },
        )
      : [];

    if (this.googleAi.isConfigured()) {
      const geminiRes = await this.callGemini(
        message,
        currentPath,
        history,
        pageSnapshot,
        dbLinks,
        userSnapshot,
        useRagSearch,
      );
      if (geminiRes) {
        const ragAttachments = resolveRagGroundingAttachments(
          geminiRes.groundingChunks,
        );
        const includeCurrentPage =
          Boolean(pageSnapshot) &&
          (pageSnapshot?.kind !== AssistantLinkKind.ROUTE || useRagSearch);

        const suggestedLinks = mergeAssistantSuggestedLinks(
          includeCurrentPage ? pageSnapshot : null,
          ragAttachments.links,
          dbLinks,
        );

        return {
          reply: geminiRes.reply,
          engine: geminiRes.usedRag
            ? AssistantEngine.VERTEX_RAG
            : AssistantEngine.GEMINI_FLASH,
          contextLabel: pageSnapshot?.title,
          suggestedLinks,
          sourceCitations: ragAttachments.citations,
          quickActions: geminiRes.quickActions,
        };
      }
    }

    const suggestedLinks = mergeAssistantSuggestedLinks(
      pageSnapshot,
      [],
      dbLinks,
    );
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
      quickActions: fallback.quickActions,
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

  private buildPromptContext(
    message: string,
    currentPath: string | undefined,
    history: ChatHistoryItemDto[],
    pageSnapshot: PageContentSnapshot | null,
    dbLinks: AssistantSuggestedLink[],
    userSnapshot: UserStudySnapshot | null,
  ): string {
    const historyBlock =
      history.length > 0
        ? `LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY:\n${history
            .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
            .join('\n')}`
        : '';

    const pageBlock = pageSnapshot
      ? `BÀI NGƯỜI DÙNG ĐANG XEM TRÊN MÀN HÌNH (${currentPath}):\nTiêu đề: ${pageSnapshot.title}\nNội dung tóm tắt: ${pageSnapshot.summary}`
      : currentPath
        ? `TRANG HIỆN TẠI NGƯỜI DÙNG ĐANG ĐỨNG: ${currentPath}`
        : '';

    const dbLinksBlock =
      dbLinks.length > 0
        ? `CÁC TƯ LIỆU LIÊN QUAN TRONG DB HISGO:\n${dbLinks
            .map(
              (l) =>
                `- [${l.kind}] ${l.title} (${l.href}): ${l.subtitle || ''}`,
            )
            .join('\n')}`
        : '';

    const userBlock = userSnapshot
      ? `TIẾN ĐỘ HỌC TẬP CÁ NHÂN CỦA NGƯỜI DÙNG ĐANG ĐĂNG NHẬP:\n- Tổng XP: ${userSnapshot.totalXp} XP | Streak: ${userSnapshot.currentDayStreak} ngày\n- Thẻ Flashcard đến hạn hôm nay: ${userSnapshot.dueFlashcards} thẻ | Mindmap: ${userSnapshot.mindmapCount} | Tư liệu đã lưu: ${userSnapshot.savedCount}`
      : 'Người dùng hiện chưa đăng nhập (khách vãng lai).';

    return [
      historyBlock,
      pageBlock,
      dbLinksBlock,
      userBlock,
      `\nCÂU HỎI HIỆN TẠI CỦA NGƯỜI DÙNG:\n"""\n${message}\n"""`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private async callGemini(
    message: string,
    currentPath: string | undefined,
    history: ChatHistoryItemDto[],
    pageSnapshot: PageContentSnapshot | null,
    dbLinks: AssistantSuggestedLink[],
    userSnapshot: UserStudySnapshot | null,
    useRag: boolean,
  ): Promise<{
    reply: string;
    quickActions: AssistantQuickAction[];
    groundingChunks: Array<{ uri: string; title: string; text: string }>;
    usedRag: boolean;
  } | null> {
    const ragCorpus = useRag ? config.google_cloud_rag_corpus : '';
    const grounded = await this.googleAi.generateGroundedJson<{
      reply?: unknown;
      quickActions?: Array<{ label?: unknown; href?: unknown }>;
    }>({
      systemPrompt: HISGO_SYSTEM_PROMPT,
      userPrompt: this.buildPromptContext(
        message,
        currentPath,
        history,
        pageSnapshot,
        dbLinks,
        userSnapshot,
      ),
      temperature: 0.35,
      timeoutMs: AI_ASSISTANT_LIMITS.AI_TIMEOUT_MS,
      contextLabel: 'assistant',
      ...(ragCorpus
        ? {
            ragCorpus,
            topK: config.google_cloud_rag_top_k,
            vectorDistanceThreshold: config.google_cloud_rag_distance_threshold,
          }
        : {}),
    });

    if (!grounded) return null;
    const parsed = this.parseGeminiChatResponse(grounded.data);
    if (!parsed) return null;

    return {
      ...parsed,
      groundingChunks: grounded.groundingChunks,
      usedRag: grounded.usedRag,
    };
  }

  private parseGeminiChatResponse(parsed: {
    reply?: unknown;
    quickActions?: Array<{ label?: unknown; href?: unknown }>;
  }): { reply: string; quickActions: AssistantQuickAction[] } | null {
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
    if (
      pageSnapshot &&
      /tóm tắt|trang này|bài này|đang đọc|đang xem|nội dung trang|trang hiện tại|ở đây có gì/i.test(
        message,
      )
    ) {
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

    for (const rule of FEATURE_GUIDE_RULES) {
      if (rule.keywords.test(message)) {
        return { reply: rule.reply, quickActions: rule.actions };
      }
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
