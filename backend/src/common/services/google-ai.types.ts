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
}

export interface RagGroundingChunk {
  uri: string;
  title: string;
  text: string;
}

export interface GroundedJsonResult<T> {
  data: T;
  groundingChunks: RagGroundingChunk[];
  usedRag: boolean;
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
