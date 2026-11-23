import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import config from '../config/app.config';
import {
  buildGeminiApiGenerateEndpoint,
  buildVertexGenerateEndpoint,
  extractCandidateText,
  extractGroundingChunks,
  GOOGLE_AI_ENDPOINTS,
  parseServiceAccountJsonText,
  stripMarkdownJsonFence,
} from './google-ai.helper';
import {
  CachedAccessToken,
  GenerateAiJsonOptions,
  GenerateGroundedJsonOptions,
  GoogleAiProviderMode,
  GoogleServiceAccountCredentials,
  GroundedJsonResult,
  RagGroundingChunk,
  ResolvedEndpointRequest,
} from './google-ai.types';

export { GOOGLE_AI_ENDPOINTS } from './google-ai.helper';
export { GoogleAiProviderMode } from './google-ai.types';
export type {
  GenerateAiJsonOptions,
  GenerateGroundedJsonOptions,
  GroundedJsonResult,
  RagGroundingChunk,
} from './google-ai.types';

const DEFAULT_VERTEX_LOCATION = 'us-central1';
const DEFAULT_GOOGLE_AI_MODEL = 'gemini-2.0-flash';
const JWT_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
const JWT_LIFETIME_SEC = 3600;
const TOKEN_REFRESH_BUFFER_MS = 120_000;
const OAUTH_TIMEOUT_MS = 8_000;
const DEFAULT_GENERATE_TIMEOUT_MS = 12_000;
const DEFAULT_RAG_TIMEOUT_MS = 30_000;
const DEFAULT_TEMPERATURE = 0.35;
const ERROR_SNIPPET_MAX_CHARS = 300;
const JSON_MIME_TYPE = 'application/json';

@Injectable()
export class GoogleAiService {
  private readonly logger = new Logger(GoogleAiService.name);
  private cachedToken: CachedAccessToken | null = null;
  private inFlightToken: Promise<string | null> | null = null;
  private cachedSa: {
    sourceKey: string;
    credentials: GoogleServiceAccountCredentials | null;
  } | null = null;

  getProviderMode(): GoogleAiProviderMode {
    if (this.resolveVertexConfig()) {
      return GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT;
    }
    if (config.gemini_api_key) {
      return GoogleAiProviderMode.GEMINI_API_KEY;
    }
    return GoogleAiProviderMode.NONE;
  }

  isConfigured(): boolean {
    return this.getProviderMode() !== GoogleAiProviderMode.NONE;
  }

  /** Cấp Access Token Vertex/Cloud Platform cho tác vụ quản trị & đồng bộ RAG nội bộ. */
  async getCloudAccessContext(): Promise<{
    accessToken: string;
    projectId: string;
  } | null> {
    const vertex = this.resolveVertexConfig();
    if (!vertex) return null;
    const accessToken = await this.getVertexAccessToken(
      vertex.projectId,
      vertex.credentials,
    );
    return accessToken ? { accessToken, projectId: vertex.projectId } : null;
  }

  async generateJson<T>(options: GenerateAiJsonOptions): Promise<T | null> {
    const request = await this.resolveEndpointRequest('v1');
    if (!request) return null;

    const executed = await this.executeJsonCall<T>(request, {
      ...options,
      timeoutMs: options.timeoutMs ?? DEFAULT_GENERATE_TIMEOUT_MS,
    });
    return executed?.data ?? null;
  }

  /**
   * Gọi Vertex AI kèm tool RAG Engine (`vertexRagStore`) khi có `ragCorpus` và Service Account.
   * Tự động fallback về `generateJson` trực tiếp nếu RAG chưa bật hoặc gặp sự cố tạm thời.
   */
  async generateGroundedJson<T>(
    options: GenerateGroundedJsonOptions,
  ): Promise<GroundedJsonResult<T> | null> {
    const ragCorpus = options.ragCorpus?.trim();
    const canUseRag =
      Boolean(ragCorpus) &&
      this.getProviderMode() === GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT;

    if (canUseRag && ragCorpus) {
      const request = await this.resolveEndpointRequest('v1beta1');
      if (request) {
        const ragResult = await this.executeJsonCall<T>(request, {
          ...options,
          ragCorpus,
          timeoutMs: options.timeoutMs ?? DEFAULT_RAG_TIMEOUT_MS,
        });
        if (ragResult) {
          return {
            data: ragResult.data,
            groundingChunks: ragResult.groundingChunks,
            usedRag: true,
            providerMode: request.mode,
          };
        }
      }
    }

    const directRequest = await this.resolveEndpointRequest('v1');
    if (!directRequest) return null;

    const directResult = await this.executeJsonCall<T>(directRequest, {
      ...options,
      ragCorpus: undefined,
      timeoutMs: options.timeoutMs ?? DEFAULT_GENERATE_TIMEOUT_MS,
    });
    if (!directResult) return null;

    return {
      data: directResult.data,
      groundingChunks: [],
      usedRag: false,
      providerMode: directRequest.mode,
    };
  }

  private buildRequestPayload(
    options: GenerateGroundedJsonOptions,
  ): Record<string, unknown> {
    const ragCorpus = options.ragCorpus?.trim();
    const ragFilter =
      typeof options.vectorDistanceThreshold === 'number'
        ? {
            filter: {
              vectorDistanceThreshold: options.vectorDistanceThreshold,
            },
          }
        : {};

    return {
      systemInstruction: { parts: [{ text: options.systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: options.userPrompt }] }],
      ...(ragCorpus
        ? {
            tools: [
              {
                retrieval: {
                  vertexRagStore: {
                    ragResources: [{ ragCorpus }],
                    ragRetrievalConfig: {
                      topK: options.topK ?? config.google_cloud_rag_top_k,
                      ...ragFilter,
                    },
                  },
                },
              },
            ],
          }
        : {}),
      generationConfig: {
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        ...(typeof options.maxOutputTokens === 'number'
          ? { maxOutputTokens: options.maxOutputTokens }
          : {}),
        responseMimeType: JSON_MIME_TYPE,
      },
    };
  }

  private async executeJsonCall<T>(
    request: ResolvedEndpointRequest,
    options: GenerateGroundedJsonOptions & { timeoutMs: number },
  ): Promise<{ data: T; groundingChunks: RagGroundingChunk[] } | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    const label = options.contextLabel || 'google-ai';

    try {
      const response = await fetch(request.url, {
        method: 'POST',
        headers: request.headers,
        signal: controller.signal,
        body: JSON.stringify(this.buildRequestPayload(options)),
      });

      if (!response.ok) {
        const errBody =
          typeof response.text === 'function'
            ? (await response.text()).slice(0, ERROR_SNIPPET_MAX_CHARS)
            : '';
        this.logger.warn(
          `[${label}] ${request.mode}${options.ragCorpus ? '+RAG' : ''} HTTP ${response.status}${errBody ? `: ${errBody}` : ''}`,
        );
        return null;
      }

      const payload: unknown = await response.json();
      const rawText = extractCandidateText(payload);
      if (!rawText) return null;

      return {
        data: JSON.parse(stripMarkdownJsonFence(rawText)) as T,
        groundingChunks: extractGroundingChunks(payload),
      };
    } catch (error) {
      this.logger.warn(
        `[${label}] ${request.mode} fallback: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveVertexConfig(): {
    projectId: string;
    location: string;
    credentials: GoogleServiceAccountCredentials;
  } | null {
    const credentials = this.loadServiceAccountCredentials();
    if (!credentials) return null;

    const projectId =
      config.google_cloud_project_id || credentials.project_id || '';
    if (!projectId) {
      this.logger.warn(
        'Đã cấu hình Service Account nhưng thiếu GOOGLE_CLOUD_PROJECT_ID (và file JSON không có project_id).',
      );
      return null;
    }

    return {
      projectId,
      location: config.google_cloud_location || DEFAULT_VERTEX_LOCATION,
      credentials,
    };
  }

  private loadServiceAccountCredentials(): GoogleServiceAccountCredentials | null {
    const inlineJson = config.google_cloud_service_account_json;
    const credPath = config.google_application_credentials;
    const sourceKey = `${inlineJson}::${credPath}`;

    if (this.cachedSa && this.cachedSa.sourceKey === sourceKey) {
      return this.cachedSa.credentials;
    }

    if (inlineJson) {
      try {
        const credentials = parseServiceAccountJsonText(inlineJson);
        this.cachedSa = { sourceKey, credentials };
        return credentials;
      } catch (error) {
        this.logger.warn(
          `GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON không hợp lệ: ${error instanceof Error ? error.message : String(error)}`,
        );
        this.cachedSa = { sourceKey, credentials: null };
        return null;
      }
    }

    if (!credPath) {
      this.cachedSa = { sourceKey, credentials: null };
      return null;
    }

    try {
      const resolvedPath = path.isAbsolute(credPath)
        ? credPath
        : path.resolve(process.cwd(), credPath);
      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      const credentials = parseServiceAccountJsonText(fileContent);
      this.cachedSa = { sourceKey, credentials };
      return credentials;
    } catch (error) {
      this.logger.warn(
        `Không thể đọc GOOGLE_APPLICATION_CREDENTIALS (${credPath}): ${error instanceof Error ? error.message : String(error)}`,
      );
      this.cachedSa = { sourceKey, credentials: null };
      return null;
    }
  }

  private async resolveEndpointRequest(
    vertexApiVersion: 'v1' | 'v1beta1',
  ): Promise<ResolvedEndpointRequest | null> {
    const model = config.gemini_model || DEFAULT_GOOGLE_AI_MODEL;
    const vertex = this.resolveVertexConfig();

    if (vertex) {
      const accessToken = await this.getVertexAccessToken(
        vertex.projectId,
        vertex.credentials,
      );
      if (!accessToken) return null;

      return {
        url: buildVertexGenerateEndpoint(
          vertex.projectId,
          vertex.location,
          model,
          vertexApiVersion,
        ),
        headers: {
          'Content-Type': JSON_MIME_TYPE,
          Authorization: `Bearer ${accessToken}`,
        },
        mode: GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT,
      };
    }

    if (config.gemini_api_key) {
      return {
        url: buildGeminiApiGenerateEndpoint(model, config.gemini_api_key),
        headers: { 'Content-Type': JSON_MIME_TYPE },
        mode: GoogleAiProviderMode.GEMINI_API_KEY,
      };
    }

    return null;
  }

  private async getVertexAccessToken(
    projectId: string,
    credentials: GoogleServiceAccountCredentials,
  ): Promise<string | null> {
    const cacheKey = `${projectId}:${credentials.client_email}:${credentials.private_key_id ?? ''}`;
    if (
      this.cachedToken &&
      this.cachedToken.cacheKey === cacheKey &&
      this.cachedToken.expiresAtMs > Date.now()
    ) {
      return this.cachedToken.accessToken;
    }

    if (this.inFlightToken) {
      return this.inFlightToken;
    }

    this.inFlightToken = this.fetchFreshAccessToken(
      cacheKey,
      credentials,
    ).finally(() => {
      this.inFlightToken = null;
    });

    return this.inFlightToken;
  }

  private async fetchFreshAccessToken(
    cacheKey: string,
    credentials: GoogleServiceAccountCredentials,
  ): Promise<string | null> {
    const tokenUri =
      credentials.token_uri || GOOGLE_AI_ENDPOINTS.OAUTH2_TOKEN_URL;
    const nowSec = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
      {
        iss: credentials.client_email,
        sub: credentials.client_email,
        aud: tokenUri,
        scope: GOOGLE_AI_ENDPOINTS.CLOUD_PLATFORM_SCOPE,
        iat: nowSec,
        exp: nowSec + JWT_LIFETIME_SEC,
      },
      credentials.private_key,
      {
        algorithm: 'RS256',
        ...(credentials.private_key_id
          ? { keyid: credentials.private_key_id }
          : {}),
      },
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OAUTH_TIMEOUT_MS);

    try {
      const response = await fetch(tokenUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
        body: new URLSearchParams({
          grant_type: JWT_GRANT_TYPE,
          assertion,
        }).toString(),
      });

      if (!response.ok) {
        const errBody =
          typeof response.text === 'function'
            ? (await response.text()).slice(0, ERROR_SNIPPET_MAX_CHARS)
            : '';
        this.logger.warn(
          `Vertex OAuth2 token error HTTP ${response.status}${errBody ? `: ${errBody}` : ''}`,
        );
        return null;
      }

      const data = (await response.json()) as {
        access_token?: unknown;
        expires_in?: unknown;
      };
      const accessToken =
        typeof data.access_token === 'string' ? data.access_token.trim() : '';
      if (!accessToken) return null;

      const expiresInSec =
        typeof data.expires_in === 'number' && data.expires_in > 0
          ? data.expires_in
          : JWT_LIFETIME_SEC;
      const ttlMs = Math.max(
        expiresInSec * 1000 - TOKEN_REFRESH_BUFFER_MS,
        60_000,
      );

      this.cachedToken = {
        cacheKey,
        accessToken,
        expiresAtMs: Date.now() + ttlMs,
      };
      return accessToken;
    } catch (error) {
      this.logger.warn(
        `Vertex OAuth2 token exchange failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
