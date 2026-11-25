export enum GoogleAiProviderMode {
  VERTEX_SERVICE_ACCOUNT = 'VERTEX_SERVICE_ACCOUNT',
  GEMINI_API_KEY = 'GEMINI_API_KEY',
  NONE = 'NONE',
}

export interface GenerateAiJsonOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  contextLabel?: string;
}

export interface GenerateGroundedJsonOptions extends GenerateAiJsonOptions {
  ragCorpus?: string;
  topK?: number;
  vectorDistanceThreshold?: number;
  enableGoogleSearch?: boolean;
  /** Chặn tuyệt đối việc tự fallback về gọi LLM không gắn công cụ Grounding khi RAG/Google Search đang bật. */
  disableUngroundedFallback?: boolean;
}

export interface RagGroundingChunk {
  uri: string;
  title: string;
  text: string;
  domain?: string;
  isWeb?: boolean;
  /** Đánh dấu chunk thực sự được Gemini trích dẫn trong groundingSupports (nếu API có trả groundingSupports). */
  cited?: boolean;
}

export interface ExtractedGroundingMetadata {
  groundingChunks: RagGroundingChunk[];
  webSearchQueries: string[];
}

export interface GroundedJsonResult<T> {
  data: T;
  groundingChunks: RagGroundingChunk[];
  webSearchQueries?: string[];
  usedRag: boolean;
  usedGoogleSearch?: boolean;
  providerMode: GoogleAiProviderMode;
}

export interface GoogleServiceAccountCredentials {
  client_email: string;
  private_key: string;
  private_key_id?: string;
  project_id?: string;
  token_uri?: string;
}

export interface CachedAccessToken {
  cacheKey: string;
  accessToken: string;
  expiresAtMs: number;
}

export interface ResolvedEndpointRequest {
  url: string;
  headers: Record<string, string>;
  mode: GoogleAiProviderMode;
}
