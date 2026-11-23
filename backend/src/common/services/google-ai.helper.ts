import {
  GoogleServiceAccountCredentials,
  RagGroundingChunk,
} from './google-ai.types';

const GOOGLE_OAUTH2_HOST = 'oauth2.googleapis.com';
const GOOGLE_APIS_HOST = 'www.googleapis.com';
const VERTEX_API_DOMAIN = 'aiplatform.googleapis.com';
const GEMINI_API_HOST = 'generativelanguage.googleapis.com';
const VERTEX_GLOBAL_LOCATION = 'global';

export const GOOGLE_AI_ENDPOINTS = {
  OAUTH2_TOKEN_URL: `https://${GOOGLE_OAUTH2_HOST}/token`,
  CLOUD_PLATFORM_SCOPE: `https://${GOOGLE_APIS_HOST}/auth/cloud-platform`,
} as const;

export function stripMarkdownJsonFence(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

export function parseServiceAccountJsonText(
  rawText: string,
): GoogleServiceAccountCredentials | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const decodedJson = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');

  const parsed: unknown = JSON.parse(decodedJson);
  if (!parsed || typeof parsed !== 'object') return null;

  const rec = parsed as Record<string, unknown>;
  const clientEmail =
    typeof rec.client_email === 'string' ? rec.client_email.trim() : '';
  const privateKey =
    typeof rec.private_key === 'string'
      ? rec.private_key.replace(/\\n/g, '\n').trim()
      : '';

  if (!clientEmail || !privateKey) return null;

  return {
    client_email: clientEmail,
    private_key: privateKey,
    private_key_id:
      typeof rec.private_key_id === 'string'
        ? rec.private_key_id.trim()
        : undefined,
    project_id:
      typeof rec.project_id === 'string' ? rec.project_id.trim() : undefined,
    token_uri:
      typeof rec.token_uri === 'string' && rec.token_uri.trim()
        ? rec.token_uri.trim()
        : GOOGLE_AI_ENDPOINTS.OAUTH2_TOKEN_URL,
  };
}

export function buildVertexGenerateEndpoint(
  projectId: string,
  location: string,
  model: string,
  apiVersion: 'v1' | 'v1beta1' = 'v1',
): string {
  const host =
    location === VERTEX_GLOBAL_LOCATION
      ? VERTEX_API_DOMAIN
      : `${location}-${VERTEX_API_DOMAIN}`;

  return `https://${host}/${apiVersion}/projects/${encodeURIComponent(
    projectId,
  )}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(
    model,
  )}:generateContent`;
}

export function buildGeminiApiGenerateEndpoint(
  model: string,
  apiKey: string,
): string {
  return `https://${GEMINI_API_HOST}/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

export function extractCandidateText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const first = candidates[0] as {
    content?: { parts?: Array<{ text?: unknown }> };
  };
  const parts = first?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;

  const text = parts[0]?.text;
  return typeof text === 'string' && text.trim() ? text : null;
}

function toGroundingChunk(item: unknown): RagGroundingChunk | null {
  if (!item || typeof item !== 'object') return null;
  const ctx = (item as { retrievedContext?: unknown }).retrievedContext;
  if (!ctx || typeof ctx !== 'object') return null;
  const rec = ctx as Record<string, unknown>;
  const uri = typeof rec.uri === 'string' ? rec.uri.trim() : '';
  const title = typeof rec.title === 'string' ? rec.title.trim() : '';
  const text = typeof rec.text === 'string' ? rec.text.trim() : '';
  return uri || title || text ? { uri, title, text } : null;
}

export function extractGroundingChunks(payload: unknown): RagGroundingChunk[] {
  if (!payload || typeof payload !== 'object') return [];
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return [];

  const meta = (candidates[0] as { groundingMetadata?: unknown })
    ?.groundingMetadata as { groundingChunks?: unknown } | undefined;
  const rawChunks = Array.isArray(meta?.groundingChunks)
    ? meta.groundingChunks
    : [];

  return rawChunks
    .map(toGroundingChunk)
    .filter((chunk): chunk is RagGroundingChunk => chunk !== null);
}
