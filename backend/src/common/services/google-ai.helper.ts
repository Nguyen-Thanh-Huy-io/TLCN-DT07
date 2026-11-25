import {
  ExtractedGroundingMetadata,
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

export function parseAiJsonText<T>(rawText: string): T | null {
  const cleaned = stripMarkdownJsonFence(rawText);
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      return null;
    }
  }
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
    content?: { parts?: Array<{ text?: unknown; thought?: unknown }> };
  };
  const parts = first?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;

  const answerPart =
    parts.find(
      (part) =>
        part?.thought !== true &&
        typeof part?.text === 'string' &&
        part.text.trim().length > 0,
    ) ?? parts[parts.length - 1];
  const text = answerPart?.text;
  return typeof text === 'string' && text.trim() ? text : null;
}

function toRetrievedChunk(
  ctx: Record<string, unknown>,
): RagGroundingChunk | null {
  const uri = typeof ctx.uri === 'string' ? ctx.uri.trim() : '';
  const title = typeof ctx.title === 'string' ? ctx.title.trim() : '';
  const text = typeof ctx.text === 'string' ? ctx.text.trim() : '';
  return uri || title || text ? { uri, title, text } : null;
}

function toWebChunk(webRec: Record<string, unknown>): RagGroundingChunk | null {
  const uri = typeof webRec.uri === 'string' ? webRec.uri.trim() : '';
  const title = typeof webRec.title === 'string' ? webRec.title.trim() : '';
  const domain = typeof webRec.domain === 'string' ? webRec.domain.trim() : '';
  if (!uri) return null;
  return {
    uri,
    title: title || domain || uri,
    text: '',
    isWeb: true,
    ...(domain ? { domain } : {}),
  };
}

function toGroundingChunk(item: unknown): RagGroundingChunk | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as { retrievedContext?: unknown; web?: unknown };
  if (record.retrievedContext && typeof record.retrievedContext === 'object') {
    return toRetrievedChunk(record.retrievedContext as Record<string, unknown>);
  }
  if (record.web && typeof record.web === 'object') {
    return toWebChunk(record.web as Record<string, unknown>);
  }
  return null;
}

interface RawGroundingSupport {
  segment?: { text?: unknown };
  groundingChunkIndices?: unknown;
}

export function cleanGroundedSegmentSnippet(rawSegment: string): string {
  let s = rawSegment.trim();
  if (!s) return '';

  const textFieldMatch = /"(?:text|reply)"\s*:\s*"/i.exec(s);
  if (textFieldMatch) {
    s = s.slice(textFieldMatch.index + textFieldMatch[0].length);
  }

  const tailFieldMatch = /"\s*,\s*"(?:prompts|quickActions|periodLabel)"/i.exec(
    s,
  );
  if (tailFieldMatch) {
    s = s.slice(0, tailFieldMatch.index);
  }

  s = s
    .replace(/\\n/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\*\*\[([^\]]+)\]\([^)]*\)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^[\s"{}[\],:]+/, '')
    .replace(/[\s"{}[\],]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    s.length < 18 ||
    /"(?:isHistoricalScope|groundedInCorpus|periodLabel)"/i.test(s)
  ) {
    return '';
  }
  return s;
}

function attachSupportMetadata(
  chunks: RagGroundingChunk[],
  rawSupports: unknown,
): void {
  if (!Array.isArray(rawSupports) || chunks.length === 0) return;
  for (const sup of rawSupports as RawGroundingSupport[]) {
    const rawSeg =
      typeof sup?.segment?.text === 'string' ? sup.segment.text : '';
    const cleanSeg = cleanGroundedSegmentSnippet(rawSeg);
    const indices = Array.isArray(sup?.groundingChunkIndices)
      ? sup.groundingChunkIndices
      : [];
    for (const idx of indices) {
      if (typeof idx !== 'number') continue;
      const target = chunks[idx];
      if (!target) continue;
      target.cited = true;
      if (target.isWeb && !target.text && cleanSeg) {
        target.text = cleanSeg;
      }
    }
  }
}

export function extractGroundingMetadata(
  payload: unknown,
): ExtractedGroundingMetadata {
  if (!payload || typeof payload !== 'object') {
    return { groundingChunks: [], webSearchQueries: [] };
  }
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { groundingChunks: [], webSearchQueries: [] };
  }

  const meta = (candidates[0] as { groundingMetadata?: unknown })
    ?.groundingMetadata as
    | {
        groundingChunks?: unknown;
        webSearchQueries?: unknown;
        groundingSupports?: unknown;
      }
    | undefined;

  const rawChunks = Array.isArray(meta?.groundingChunks)
    ? meta.groundingChunks
    : [];
  const groundingChunks = rawChunks
    .map(toGroundingChunk)
    .filter((chunk): chunk is RagGroundingChunk => chunk !== null);

  attachSupportMetadata(groundingChunks, meta?.groundingSupports);

  const webSearchQueries = Array.isArray(meta?.webSearchQueries)
    ? meta.webSearchQueries
        .filter((q): q is string => typeof q === 'string')
        .map((q) => q.trim())
        .filter(Boolean)
    : [];

  return { groundingChunks, webSearchQueries };
}

export function extractGroundingChunks(payload: unknown): RagGroundingChunk[] {
  return extractGroundingMetadata(payload).groundingChunks;
}
