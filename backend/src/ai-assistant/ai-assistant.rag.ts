import * as fs from 'node:fs';
import * as path from 'node:path';
import { RagGroundingChunk } from '../common/services/google-ai.service';
import {
  AI_ASSISTANT_LIMITS,
  AssistantLinkKind,
} from './ai-assistant.constant';
import {
  AssistantSourceCitation,
  AssistantSuggestedLink,
  PageContentSnapshot,
} from './ai-assistant.types';

interface HisgoManifestItem {
  gcsDefaultPath: string;
  relativePath: string;
  kind: string;
  title: string;
  subtitle?: string;
  href: string;
  sources?: string[];
}

interface WikiManifestItem {
  gcsDefaultPath: string;
  relativePath: string;
  kind: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface ExternalBookSourceItem {
  gcsPath: string;
  title: string;
  authorOrPublisher?: string;
  note?: string;
}

interface ManifestIndexSnapshot {
  byGcsPath: Map<string, HisgoManifestItem | WikiManifestItem>;
  byBasename: Map<string, HisgoManifestItem | WikiManifestItem>;
  booksByGcsPath: Map<string, ExternalBookSourceItem>;
  booksByBasename: Map<string, ExternalBookSourceItem>;
  loadedAtMs: number;
}

const MANIFEST_CACHE_TTL_MS = 60_000;
let cachedIndex: ManifestIndexSnapshot | null = null;

const HISGO_KIND_MAP: Record<string, AssistantLinkKind> = {
  EVENT: AssistantLinkKind.EVENT,
  PERSON: AssistantLinkKind.PERSON,
  LOCATION: AssistantLinkKind.LOCATION,
  ARTICLE: AssistantLinkKind.ARTICLE,
  LESSON: AssistantLinkKind.LESSON,
  BLOG: AssistantLinkKind.BLOG,
  TIMELINE_NODE: AssistantLinkKind.TIMELINE,
  WIKIPEDIA: AssistantLinkKind.WIKIPEDIA,
};

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function indexManifestEntries<
  T extends { gcsDefaultPath: string; relativePath?: string },
>(
  entries: T[] | undefined,
  byGcsPath: Map<string, T>,
  byBasename: Map<string, T>,
): void {
  if (!Array.isArray(entries)) return;
  for (const item of entries) {
    if (item.gcsDefaultPath) {
      byGcsPath.set(item.gcsDefaultPath.toLowerCase(), item);
      byBasename.set(path.basename(item.gcsDefaultPath).toLowerCase(), item);
    }
    if (item.relativePath) {
      byBasename.set(path.basename(item.relativePath).toLowerCase(), item);
    }
  }
}

function loadManifestIndex(): ManifestIndexSnapshot {
  if (
    cachedIndex &&
    Date.now() - cachedIndex.loadedAtMs < MANIFEST_CACHE_TTL_MS
  ) {
    return cachedIndex;
  }

  const root = process.cwd();
  const byGcsPath = new Map<string, HisgoManifestItem | WikiManifestItem>();
  const byBasename = new Map<string, HisgoManifestItem | WikiManifestItem>();
  const booksByGcsPath = new Map<string, ExternalBookSourceItem>();
  const booksByBasename = new Map<string, ExternalBookSourceItem>();

  const hisgoManifest = safeReadJson<{ entries?: HisgoManifestItem[] }>(
    path.resolve(root, 'rag-export', 'hisgo-manifest.json'),
  );
  indexManifestEntries(hisgoManifest?.entries, byGcsPath, byBasename);

  const wikiManifest = safeReadJson<{ entries?: WikiManifestItem[] }>(
    path.resolve(root, 'rag-wiki', 'wiki-manifest.json'),
  );
  indexManifestEntries(wikiManifest?.entries, byGcsPath, byBasename);

  const externalBooks = safeReadJson<{ sources?: ExternalBookSourceItem[] }>(
    path.resolve(root, 'rag-sources', 'external-sources.json'),
  );
  if (Array.isArray(externalBooks?.sources)) {
    for (const src of externalBooks.sources) {
      if (!src.gcsPath || !src.title) continue;
      booksByGcsPath.set(src.gcsPath.toLowerCase(), src);
      booksByBasename.set(path.basename(src.gcsPath).toLowerCase(), src);
    }
  }

  cachedIndex = {
    byGcsPath,
    byBasename,
    booksByGcsPath,
    booksByBasename,
    loadedAtMs: Date.now(),
  };
  return cachedIndex;
}

/** Rút object path sau `gs://<bucket>/` từ URI trả về bởi Vertex AI RAG. */
export function extractGcsObjectPath(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed.startsWith('gs://')) return trimmed.replace(/^\/+/, '');
  const withoutScheme = trimmed.slice('gs://'.length);
  const slashIdx = withoutScheme.indexOf('/');
  return slashIdx >= 0 ? withoutScheme.slice(slashIdx + 1) : '';
}

function resolveWikipediaFallback(
  rawObjectPath: string,
  rawTitle: string,
): AssistantSuggestedLink | null {
  if (!rawObjectPath.toLowerCase().startsWith('wikipedia/')) return null;
  const baseName = path.basename(rawObjectPath || rawTitle);
  const wikiSlug = baseName.replace(/\.(md|txt|json)$/i, '').trim();
  if (!wikiSlug) return null;

  const wikiHost = ['vi', 'wikipedia', 'org'].join('.');
  const href = new URL(
    `/wiki/${encodeURIComponent(wikiSlug)}`,
    ['https', wikiHost].join('://'),
  ).toString();
  return {
    kind: AssistantLinkKind.WIKIPEDIA,
    title: wikiSlug.replace(/_/g, ' '),
    subtitle: 'Wikipedia tiếng Việt',
    href,
    external: true,
  };
}

function resolveFallbackFromFilename(
  rawObjectPath: string,
  title: string,
): AssistantSuggestedLink | null {
  const wikiHit = resolveWikipediaFallback(rawObjectPath, title);
  if (wikiHit) return wikiHit;

  const base = path.basename(rawObjectPath || title).toLowerCase();
  const prefixRoutes: Array<[string, AssistantLinkKind, string]> = [
    ['su-kien--', AssistantLinkKind.EVENT, '/su-kien'],
    ['nhan-vat--', AssistantLinkKind.PERSON, '/nhan-vat'],
    ['di-tich--', AssistantLinkKind.LOCATION, '/di-tich'],
    ['bai-viet--', AssistantLinkKind.ARTICLE, '/bai-viet'],
    ['bai-hoc--', AssistantLinkKind.LESSON, '/bai-hoc'],
    ['blog--', AssistantLinkKind.BLOG, '/blog'],
  ];

  for (const [prefix, kind, routeBase] of prefixRoutes) {
    if (!base.startsWith(prefix)) continue;
    const slug = base.slice(prefix.length).replace(/\.md$/, '');
    if (!slug) continue;
    return {
      kind,
      title: slug.replace(/-/g, ' '),
      subtitle: 'Tư liệu trong hệ thống HISGO',
      href: `${routeBase}/${slug}`,
    };
  }
  return null;
}

function formatFallbackBookTitle(objectPath: string, rawTitle: string): string {
  const name = path
    .basename(objectPath || rawTitle)
    .replace(/\.(pdf|docx|txt|md)$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  return name || rawTitle;
}

function appendManifestCitations(
  manifestItem: HisgoManifestItem | WikiManifestItem,
  citationMap: Map<string, AssistantSourceCitation>,
): void {
  if (!('sources' in manifestItem) || !Array.isArray(manifestItem.sources)) {
    return;
  }
  for (const rawSource of manifestItem.sources) {
    if (typeof rawSource !== 'string') continue;
    const clean = rawSource.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!citationMap.has(key)) {
      citationMap.set(key, {
        title: clean,
        note: `Nguồn tham khảo của "${manifestItem.title}"`,
      });
    }
  }
}

function applySingleGroundingChunk(
  chunk: RagGroundingChunk,
  index: ManifestIndexSnapshot,
  linkMap: Map<string, AssistantSuggestedLink>,
  citationMap: Map<string, AssistantSourceCitation>,
): void {
  const rawObjectPath = extractGcsObjectPath(chunk.uri);
  const objectPath = rawObjectPath.toLowerCase();
  const baseName = path.basename(objectPath || chunk.title).toLowerCase();

  const matchedBook =
    index.booksByGcsPath.get(objectPath) ?? index.booksByBasename.get(baseName);
  if (matchedBook) {
    citationMap.set(matchedBook.title.toLowerCase(), {
      title: matchedBook.title,
      authorOrPublisher: matchedBook.authorOrPublisher,
      note: matchedBook.note,
    });
    return;
  }

  if (objectPath.startsWith('books/')) {
    const bookTitle = formatFallbackBookTitle(objectPath, chunk.title);
    if (bookTitle) {
      citationMap.set(bookTitle.toLowerCase(), {
        title: bookTitle,
        note: 'Tài liệu sách / PDF trong kho tư liệu RAG',
      });
    }
    return;
  }

  const manifestItem =
    index.byGcsPath.get(objectPath) ?? index.byBasename.get(baseName);
  if (manifestItem) {
    const kind = HISGO_KIND_MAP[manifestItem.kind] ?? AssistantLinkKind.ARTICLE;
    const isExternal = kind === AssistantLinkKind.WIKIPEDIA;
    if (!linkMap.has(manifestItem.href)) {
      linkMap.set(manifestItem.href, {
        kind,
        title: manifestItem.title,
        subtitle: manifestItem.subtitle,
        href: manifestItem.href,
        ...(isExternal ? { external: true } : {}),
      });
    }
    appendManifestCitations(manifestItem, citationMap);
    return;
  }

  const fallbackLink = resolveFallbackFromFilename(rawObjectPath, chunk.title);
  if (fallbackLink && !linkMap.has(fallbackLink.href)) {
    linkMap.set(fallbackLink.href, fallbackLink);
  }
}

/** Ánh xạ groundingChunks từ Vertex RAG thành Link thật (HISGO/Wikipedia) + Trích dẫn sách tĩnh. */
export function resolveRagGroundingAttachments(chunks: RagGroundingChunk[]): {
  links: AssistantSuggestedLink[];
  citations: AssistantSourceCitation[];
} {
  if (chunks.length === 0) return { links: [], citations: [] };
  const index = loadManifestIndex();
  const linkMap = new Map<string, AssistantSuggestedLink>();
  const citationMap = new Map<string, AssistantSourceCitation>();

  for (const chunk of chunks) {
    applySingleGroundingChunk(chunk, index, linkMap, citationMap);
  }

  return {
    links: Array.from(linkMap.values()).slice(
      0,
      AI_ASSISTANT_LIMITS.MAX_SUGGESTED_LINKS,
    ),
    citations: Array.from(citationMap.values()).slice(
      0,
      AI_ASSISTANT_LIMITS.MAX_SOURCE_CITATIONS,
    ),
  };
}

/** Hợp nhất link theo ưu tiên: Trang đang xem -> RAG Grounding -> Tìm kiếm đa thực thể DB. */
export function mergeAssistantSuggestedLinks(
  pageSnapshot: PageContentSnapshot | null,
  ragLinks: AssistantSuggestedLink[],
  dbLinks: AssistantSuggestedLink[],
): AssistantSuggestedLink[] {
  const map = new Map<string, AssistantSuggestedLink>();
  if (pageSnapshot) {
    map.set(pageSnapshot.href, {
      kind: pageSnapshot.kind,
      title: pageSnapshot.title,
      subtitle: 'Trang bạn đang xem',
      href: pageSnapshot.href,
    });
  }
  for (const item of [...ragLinks, ...dbLinks]) {
    if (!map.has(item.href)) {
      map.set(item.href, item);
    }
  }
  return Array.from(map.values()).slice(
    0,
    AI_ASSISTANT_LIMITS.MAX_SUGGESTED_LINKS,
  );
}
