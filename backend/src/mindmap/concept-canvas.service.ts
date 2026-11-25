import { Injectable, Optional } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { AssistantLinkKind } from '../ai-assistant/ai-assistant.constant';
import {
  extractRagCandidateArticleSlugs,
  resolveRagGroundingAttachments,
} from '../ai-assistant/ai-assistant.rag';
import { extractBlockSnippet } from '../ai-assistant/ai-assistant.search';
import appConfig from '../common/config/app.config';
import {
  GoogleAiService,
  RagGroundingChunk,
} from '../common/services/google-ai.service';
import { PrismaService } from '../common/services/prisma.service';
import {
  CONCEPT_CANVAS_DEFAULT_PROMPTS,
  CONCEPT_CANVAS_GOOGLE_GROUNDED_PROMPT,
  CONCEPT_CANVAS_LIMITS,
  CONCEPT_CANVAS_MESSAGES,
  CONCEPT_CANVAS_STRICT_RAG_PROMPT,
  ConceptCanvasEngine,
} from './concept-canvas.constant';
import { ExploreConceptDto } from './dto/concept-canvas.dto';

export interface SpatialMatchedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  dateText: string | null;
  coverImageUrl: string | null;
  categoryName: string | null;
}

export interface SpatialMatchedTimelineNode {
  id: string;
  title: string;
  dateText: string | null;
  timelineTitle: string;
  timelineSlug: string;
  imageUrl: string | null;
}

export interface SpatialWebSource {
  title: string;
  uri: string;
  domain?: string;
  snippet?: string;
}

export interface SpatialRagCitation {
  title: string;
  subtitle?: string;
  href?: string;
}

export interface SpatialExploreResponse {
  prompt: string;
  periodLabel: string;
  text: string;
  prompts: string[];
  imageUrl: string | null;
  engine: ConceptCanvasEngine;
  matchedArticles: SpatialMatchedArticle[];
  matchedTimelineNodes: SpatialMatchedTimelineNode[];
  webSources: SpatialWebSource[];
  webSearchQueries: string[];
  ragCitations: SpatialRagCitation[];
}

interface RawArticleRecord {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  dateText: string | null;
  coverImageUrl: string | null;
  contentBlocks: unknown;
  category: { name: string } | null;
  topic: { name: string } | null;
}

interface AiConceptWirePayload {
  groundedInCorpus?: unknown;
  isHistoricalScope?: unknown;
  periodLabel?: unknown;
  text?: unknown;
  prompts?: unknown;
}

interface NormalizedAiConcept {
  groundedInCorpus: boolean;
  isHistoricalScope: boolean;
  periodLabel: string;
  text: string;
  prompts: string[];
}

const ARTICLE_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  dateText: true,
  coverImageUrl: true,
  contentBlocks: true,
  category: { select: { name: true } },
  topic: { select: { name: true } },
} as const;

function toMatchedArticle(item: RawArticleRecord): SpatialMatchedArticle {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    dateText: item.dateText,
    coverImageUrl: item.coverImageUrl,
    categoryName: item.category?.name ?? null,
  };
}

function normalizeAiConceptPayload(
  raw: AiConceptWirePayload | null | undefined,
): NormalizedAiConcept | null {
  if (!raw || typeof raw !== 'object') return null;
  const groundedInCorpus = raw.groundedInCorpus !== false;
  const isHistoricalScope = raw.isHistoricalScope !== false;
  const text = typeof raw.text === 'string' ? raw.text.trim() : '';
  const periodLabel =
    typeof raw.periodLabel === 'string' && raw.periodLabel.trim()
      ? raw.periodLabel.trim()
      : '';
  const prompts = Array.isArray(raw.prompts)
    ? raw.prompts
        .filter((p): p is string => typeof p === 'string')
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return {
    groundedInCorpus,
    isHistoricalScope,
    periodLabel,
    text,
    prompts,
  };
}

function filterFollowUpPrompts(
  candidates: readonly string[],
  currentPrompt: string,
  excludePrompts: readonly string[] = [],
): string[] {
  const blocked = new Set(
    [currentPrompt, ...excludePrompts].map((item) => item.trim().toLowerCase()),
  );
  const picked: string[] = [];

  for (const raw of [...candidates, ...CONCEPT_CANVAS_DEFAULT_PROMPTS]) {
    const clean = raw.trim();
    const key = clean.toLowerCase();
    if (!clean || blocked.has(key)) continue;
    blocked.add(key);
    picked.push(clean);
    if (picked.length >= CONCEPT_CANVAS_LIMITS.MAX_CHILD_PROMPTS) break;
  }
  return picked;
}

function resolveHostnameLabel(uri: string, explicitDomain?: string): string {
  if (explicitDomain?.trim()) return explicitDomain.trim();
  try {
    const host = new URL(uri).hostname.replace(/^www\./i, '');
    if (host.includes('vertexaisearch.cloud.google.com')) return '';
    return host;
  } catch {
    return '';
  }
}

export function extractCanvasWebSources(
  chunks: ReadonlyArray<RagGroundingChunk>,
): SpatialWebSource[] {
  const seen = new Set<string>();
  const sources: SpatialWebSource[] = [];
  for (const chunk of chunks) {
    if (!chunk.isWeb || !chunk.uri || seen.has(chunk.uri)) continue;
    seen.add(chunk.uri);
    const domain = resolveHostnameLabel(chunk.uri, chunk.domain);
    const snippet = chunk.text?.trim() || undefined;
    sources.push({
      title: chunk.title || domain || chunk.uri,
      uri: chunk.uri,
      ...(domain ? { domain } : {}),
      ...(snippet ? { snippet } : {}),
    });
    if (sources.length >= CONCEPT_CANVAS_LIMITS.MAX_WEB_SOURCES) break;
  }
  return sources;
}

function buildContextualSystemPrompt(
  baseSystemPrompt: string,
  dto: ExploreConceptDto,
  pinnedArticle: RawArticleRecord | null,
): string {
  const extras: string[] = [baseSystemPrompt];
  if (dto.parentTitle) {
    extras.push(
      `NGỮ CẢNH CHA: Chủ đề hiện tại nằm trong mạch trực tiếp của "${dto.parentTitle}", bắt buộc phân tích sát mối liên hệ này.`,
    );
  }
  if (dto.excludePrompts && dto.excludePrompts.length > 0) {
    extras.push(
      `KHÔNG LẶP LẠI CÁC NHÁNH ĐÃ MỞ TRONG PROMPTS: ${dto.excludePrompts.join(' | ')}`,
    );
  }
  if (pinnedArticle) {
    const snippet = extractBlockSnippet(
      pinnedArticle.contentBlocks,
      CONCEPT_CANVAS_LIMITS.MAX_SNIPPET_LENGTH,
    );
    extras.push(
      `BÀI VIẾT GỐC ĐƯỢC CHỌN TRÊN HISGO:\n- [${pinnedArticle.title}] (${pinnedArticle.dateText ?? 'Tư liệu HISGO'}): ${pinnedArticle.summary ?? ''} ${snippet}`.trim(),
    );
  }
  return extras.join('\n\n');
}

function buildCleanRetrievalQuery(dto: ExploreConceptDto): string {
  return dto.parentTitle ? `${dto.parentTitle} — ${dto.prompt}` : dto.prompt;
}

function selectRelevantRagChunks(
  ragChunks: RagGroundingChunk[],
): RagGroundingChunk[] {
  const cited = ragChunks.filter((c) => c.cited);
  return cited.length > 0 ? cited : ragChunks.slice(0, 2);
}

function buildEmptyCorpusResponse(
  prompt: string,
  periodLabel: string,
  message: string,
): SpatialExploreResponse {
  return {
    prompt,
    periodLabel,
    text: message,
    prompts: [],
    imageUrl: null,
    engine: ConceptCanvasEngine.OUT_OF_CORPUS,
    matchedArticles: [],
    matchedTimelineNodes: [],
    webSources: [],
    webSearchQueries: [],
    ragCitations: [],
  };
}

interface ConceptGroundingStrategy {
  execute(
    dto: ExploreConceptDto,
    pinnedArticle: RawArticleRecord | null,
  ): Promise<SpatialExploreResponse>;
}

/**
 * Strategy 1 (Google OFF): Chỉ trả lời khi Vertex AI RAG thực sự truy xuất được tài liệu khớp chủ đề.
 * Không quét ILIKE dưới DB; chỉ hydrate bài viết theo danh sách slug thực tế do RAG trả về.
 */
class StrictVertexRagCanvasStrategy implements ConceptGroundingStrategy {
  constructor(
    private readonly googleAi: GoogleAiService,
    private readonly hydrateArticlesBySlugs: (
      pinned: RawArticleRecord | null,
      chunks: ReadonlyArray<RagGroundingChunk>,
    ) => Promise<RawArticleRecord[]>,
  ) {}

  async execute(
    dto: ExploreConceptDto,
    pinnedArticle: RawArticleRecord | null,
  ): Promise<SpatialExploreResponse> {
    const ragCorpus = appConfig.google_cloud_rag_corpus?.trim();
    if (!this.googleAi.isConfigured() || (!ragCorpus && !pinnedArticle)) {
      return buildEmptyCorpusResponse(
        dto.prompt,
        CONCEPT_CANVAS_MESSAGES.OUT_OF_CORPUS_PERIOD_LABEL,
        CONCEPT_CANVAS_MESSAGES.NO_RAG_MATCH,
      );
    }

    const aiResult =
      await this.googleAi.generateGroundedJson<AiConceptWirePayload>({
        systemPrompt: buildContextualSystemPrompt(
          CONCEPT_CANVAS_STRICT_RAG_PROMPT,
          dto,
          pinnedArticle,
        ),
        userPrompt: buildCleanRetrievalQuery(dto),
        ragCorpus: ragCorpus || undefined,
        topK: CONCEPT_CANVAS_LIMITS.RAG_TOP_K,
        vectorDistanceThreshold:
          CONCEPT_CANVAS_LIMITS.STRICT_RAG_DISTANCE_THRESHOLD,
        enableGoogleSearch: false,
        disableUngroundedFallback: Boolean(ragCorpus),
        temperature: CONCEPT_CANVAS_LIMITS.AI_TEMPERATURE,
        maxOutputTokens: CONCEPT_CANVAS_LIMITS.AI_MAX_TOKENS,
        timeoutMs: CONCEPT_CANVAS_LIMITS.AI_TIMEOUT_MS,
        contextLabel: 'concept-canvas-rag',
      });

    const normalized = normalizeAiConceptPayload(aiResult?.data);
    const allRagChunks = (aiResult?.groundingChunks ?? []).filter(
      (chunk) => !chunk.isWeb,
    );
    const hasVerifiedContext =
      allRagChunks.length > 0 || Boolean(pinnedArticle);

    if (
      !aiResult ||
      !normalized ||
      !hasVerifiedContext ||
      !normalized.groundedInCorpus ||
      !normalized.text
    ) {
      return buildEmptyCorpusResponse(
        dto.prompt,
        CONCEPT_CANVAS_MESSAGES.OUT_OF_CORPUS_PERIOD_LABEL,
        CONCEPT_CANVAS_MESSAGES.NO_RAG_MATCH,
      );
    }

    const relevantChunks = selectRelevantRagChunks(allRagChunks);
    const verifiedRows = await this.hydrateArticlesBySlugs(
      pinnedArticle,
      relevantChunks,
    );
    const matchedArticles = verifiedRows.map(toMatchedArticle);
    const ragAttachments = resolveRagGroundingAttachments(relevantChunks);
    const ragCitations: SpatialRagCitation[] = [
      ...ragAttachments.links
        .filter((l) => l.kind === AssistantLinkKind.WIKIPEDIA)
        .map((l) => ({
          title: l.title,
          subtitle: l.subtitle,
          href: l.href,
        })),
      ...ragAttachments.citations.map((c) => ({
        title: c.title,
        subtitle: c.authorOrPublisher || c.note,
      })),
    ];

    const firstRow = verifiedRows[0];
    const fallbackPeriod = firstRow?.dateText
      ? `${firstRow.dateText}${firstRow.topic?.name ? ` · ${firstRow.topic.name}` : ''}`
      : firstRow?.topic?.name || CONCEPT_CANVAS_MESSAGES.DEFAULT_PERIOD_LABEL;

    return {
      prompt: dto.prompt,
      periodLabel: normalized.periodLabel || fallbackPeriod,
      text: normalized.text,
      prompts: filterFollowUpPrompts(
        normalized.prompts,
        dto.prompt,
        dto.excludePrompts,
      ),
      imageUrl:
        matchedArticles.find((a) => Boolean(a.coverImageUrl))?.coverImageUrl ??
        null,
      engine: ConceptCanvasEngine.VERTEX_RAG,
      matchedArticles,
      matchedTimelineNodes: [],
      webSources: [],
      webSearchQueries: [],
      ragCitations,
    };
  }
}

/**
 * Strategy 2 (Google ON): Cho phép tra cứu mở rộng qua Google Search cho các chủ đề có chiều sâu lịch sử,
 * trả đầy đủ danh sách bài viết web & truy vấn từ groundingMetadata.
 */
class GoogleGroundedCanvasStrategy implements ConceptGroundingStrategy {
  constructor(private readonly googleAi: GoogleAiService) {}

  async execute(
    dto: ExploreConceptDto,
    pinnedArticle: RawArticleRecord | null,
  ): Promise<SpatialExploreResponse> {
    if (!this.googleAi.isConfigured()) {
      return buildEmptyCorpusResponse(
        dto.prompt,
        CONCEPT_CANVAS_MESSAGES.OUT_OF_CORPUS_PERIOD_LABEL,
        CONCEPT_CANVAS_MESSAGES.GOOGLE_UNAVAILABLE,
      );
    }

    const aiResult =
      await this.googleAi.generateGroundedJson<AiConceptWirePayload>({
        systemPrompt: buildContextualSystemPrompt(
          CONCEPT_CANVAS_GOOGLE_GROUNDED_PROMPT,
          dto,
          pinnedArticle,
        ),
        userPrompt: buildCleanRetrievalQuery(dto),
        enableGoogleSearch: true,
        disableUngroundedFallback: true,
        temperature: CONCEPT_CANVAS_LIMITS.AI_TEMPERATURE,
        maxOutputTokens: CONCEPT_CANVAS_LIMITS.AI_MAX_TOKENS,
        timeoutMs: CONCEPT_CANVAS_LIMITS.AI_TIMEOUT_MS,
        contextLabel: 'concept-canvas-google',
      });

    const normalized = normalizeAiConceptPayload(aiResult?.data);
    if (!aiResult || !normalized) {
      return buildEmptyCorpusResponse(
        dto.prompt,
        CONCEPT_CANVAS_MESSAGES.OUT_OF_CORPUS_PERIOD_LABEL,
        CONCEPT_CANVAS_MESSAGES.GOOGLE_UNAVAILABLE,
      );
    }

    if (!normalized.isHistoricalScope || !normalized.text) {
      return buildEmptyCorpusResponse(
        dto.prompt,
        CONCEPT_CANVAS_MESSAGES.OUT_OF_SCOPE_PERIOD_LABEL,
        CONCEPT_CANVAS_MESSAGES.NON_HISTORICAL_REJECTED,
      );
    }

    const matchedArticles = pinnedArticle
      ? [toMatchedArticle(pinnedArticle)]
      : [];
    const webSources = extractCanvasWebSources(aiResult.groundingChunks);

    return {
      prompt: dto.prompt,
      periodLabel:
        normalized.periodLabel || CONCEPT_CANVAS_MESSAGES.DEFAULT_PERIOD_LABEL,
      text: normalized.text,
      prompts: filterFollowUpPrompts(
        normalized.prompts,
        dto.prompt,
        dto.excludePrompts,
      ),
      imageUrl: matchedArticles[0]?.coverImageUrl ?? null,
      engine: ConceptCanvasEngine.GOOGLE_GROUNDED,
      matchedArticles,
      matchedTimelineNodes: [],
      webSources,
      webSearchQueries: aiResult.webSearchQueries ?? [],
      ragCitations: [],
    };
  }
}

@Injectable()
export class ConceptCanvasService {
  private readonly googleAi: GoogleAiService;
  private readonly strictRagStrategy: ConceptGroundingStrategy;
  private readonly googleGroundedStrategy: ConceptGroundingStrategy;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() googleAi?: GoogleAiService,
  ) {
    this.googleAi = googleAi ?? new GoogleAiService();
    this.strictRagStrategy = new StrictVertexRagCanvasStrategy(
      this.googleAi,
      (pinned, chunks) => this.hydrateVerifiedRagArticles(pinned, chunks),
    );
    this.googleGroundedStrategy = new GoogleGroundedCanvasStrategy(
      this.googleAi,
    );
  }

  async explore(dto: ExploreConceptDto): Promise<SpatialExploreResponse> {
    const pinnedArticle = dto.articleSlug
      ? await this.prisma.article.findFirst({
          where: { slug: dto.articleSlug, status: ContentStatus.PUBLISHED },
          select: ARTICLE_SELECT,
        })
      : null;

    const strategy = dto.useGoogleSearch
      ? this.googleGroundedStrategy
      : this.strictRagStrategy;

    return strategy.execute(dto, pinnedArticle);
  }

  private async hydrateVerifiedRagArticles(
    pinned: RawArticleRecord | null,
    chunks: ReadonlyArray<RagGroundingChunk>,
  ): Promise<RawArticleRecord[]> {
    const pinnedSlug = pinned?.slug;
    const candidateSlugs = extractRagCandidateArticleSlugs(chunks).filter(
      (slug) => slug !== pinnedSlug,
    );

    const verifiedRows: RawArticleRecord[] =
      candidateSlugs.length > 0 && this.prisma.article?.findMany
        ? await this.prisma.article.findMany({
            where: {
              slug: { in: candidateSlugs },
              status: ContentStatus.PUBLISHED,
            },
            take: CONCEPT_CANVAS_LIMITS.MAX_MATCHED_ARTICLES,
            select: ARTICLE_SELECT,
          })
        : [];

    const orderedByChunkRank = candidateSlugs
      .map((slug) => verifiedRows.find((r) => r.slug === slug))
      .filter((r): r is RawArticleRecord => Boolean(r));

    const combined = [...(pinned ? [pinned] : []), ...orderedByChunkRank];
    const seen = new Set<string>();
    const unique: RawArticleRecord[] = [];
    for (const row of combined) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      unique.push(row);
      if (unique.length >= CONCEPT_CANVAS_LIMITS.MAX_MATCHED_ARTICLES) break;
    }
    return unique;
  }
}
