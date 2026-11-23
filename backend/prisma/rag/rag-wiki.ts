/**
 * Tải chọn lọc các bài Wikipedia tiếng Việt (Lịch sử Việt Nam & Lịch sử Thế giới)
 * kết hợp Wikidata SPARQL + fallback MediaWiki Category API để nạp vào RAG Corpus.
 *
 * Cách chạy từ thư mục `backend/`:
 *   npm run rag:wiki -- --scope=all --limit=150
 *   npm run rag:wiki -- --scope=world --limit=100
 *   npm run rag:wiki -- --topics-file=./custom-topics.txt
 */
import 'dotenv/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  buildCoreCandidates,
  formatWikipediaMarkdown,
  WIKI_FALLBACK_CATEGORIES,
  WikiCandidateTitle,
  WikiManifestDocument,
  WikiManifestEntry,
  WikiScope,
} from './rag-wiki.util';

const DEFAULT_WIKIPEDIA_HOST = 'vi.wikipedia.org';
const DEFAULT_WIKIDATA_HOST = 'query.wikidata.org';
const USER_AGENT = 'HISGO-RAG-Collector/1.0 (Academic History Platform)';
const MIN_EXTRACT_CHARS = 240;
const REQUEST_TIMEOUT_MS = 9_000;
const BATCH_SIZE = 10;
const MANIFEST_FILENAME = 'wiki-manifest.json';

interface WikiCliOptions {
  scope: WikiScope;
  limit: number;
  outDir: string;
  topicsFile?: string;
  clean: boolean;
  quiet: boolean;
}

function resolveCliPath(raw: string): string {
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function applyWikiCliArg(opts: WikiCliOptions, arg: string): void {
  if (arg === '--no-clean') {
    opts.clean = false;
  } else if (arg === '--quiet') {
    opts.quiet = true;
  } else if (arg.startsWith('--scope=')) {
    const val = arg.slice('--scope='.length).trim().toLowerCase();
    if (val === 'vn' || val === 'world' || val === 'all') opts.scope = val;
  } else if (arg.startsWith('--limit=')) {
    const parsed = parseInt(arg.slice('--limit='.length), 10);
    if (Number.isFinite(parsed) && parsed > 0)
      opts.limit = Math.min(parsed, 1000);
  } else if (arg.startsWith('--out=')) {
    const raw = arg.slice('--out='.length).trim();
    if (raw) opts.outDir = resolveCliPath(raw);
  } else if (arg.startsWith('--topics-file=')) {
    const raw = arg.slice('--topics-file='.length).trim();
    if (raw) opts.topicsFile = resolveCliPath(raw);
  }
}

function parseWikiCliOptions(argv: string[]): WikiCliOptions {
  const opts: WikiCliOptions = {
    scope: 'all',
    limit: 150,
    outDir: path.resolve(process.cwd(), 'rag-wiki'),
    clean: true,
    quiet: false,
  };
  for (const arg of argv) {
    applyWikiCliArg(opts, arg);
  }
  return opts;
}

function getWikipediaBaseUrl(): string {
  const custom = (process.env.WIKIPEDIA_VI_API_URL || '').trim();
  if (custom) return custom;
  const url = new URL(
    '/w/api.php',
    ['https', DEFAULT_WIKIPEDIA_HOST].join('://'),
  );
  return url.toString();
}

function getWikidataBaseUrl(): string {
  const custom = (process.env.WIKIDATA_SPARQL_URL || '').trim();
  if (custom) return custom;
  const url = new URL('/sparql', ['https', DEFAULT_WIKIDATA_HOST].join('://'));
  return url.toString();
}

async function fetchJsonWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, ...headers },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function readCustomTopicsFile(
  filePath: string,
): Promise<WikiCandidateTitle[]> {
  const raw = await fs.readFile(filePath, 'utf8');
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as unknown[];
    return parsed
      .map((item): WikiCandidateTitle | null => {
        if (typeof item === 'string' && item.trim()) {
          return { title: item.trim(), scope: 'VN' };
        }
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          const title = typeof rec.title === 'string' ? rec.title.trim() : '';
          const s = rec.scope === 'WORLD' ? 'WORLD' : 'VN';
          return title ? { title, scope: s } : null;
        }
        return null;
      })
      .filter((x): x is WikiCandidateTitle => x !== null);
  }

  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => Boolean(line) && !line.startsWith('#'))
    .map((title) => ({ title, scope: 'VN' as const }));
}

async function fetchWikidataHistoryTitles(
  scope: WikiScope,
  maxItems: number,
  quiet: boolean,
): Promise<WikiCandidateTitle[]> {
  if (maxItems <= 0) return [];
  const wikiHome = ['https', `${DEFAULT_WIKIPEDIA_HOST}/`].join('://');
  const countryClause =
    scope === 'vn'
      ? '?item wdt:P17|wdt:P27 wd:Q881 .'
      : '?item wdt:P31/wdt:P279* wd:Q13418496 .';

  const sparql = `
    SELECT DISTINCT ?title WHERE {
      ${countryClause}
      ?article schema:about ?item ;
               schema:isPartOf <${wikiHome}> ;
               schema:name ?title .
    }
    LIMIT ${Math.min(maxItems, 200)}
  `;

  const reqUrl = `${getWikidataBaseUrl()}?format=json&query=${encodeURIComponent(sparql)}`;
  const payload = await fetchJsonWithTimeout<{
    results?: { bindings?: Array<{ title?: { value?: string } }> };
  }>(reqUrl, { Accept: 'application/sparql-results+json' });

  if (!payload?.results?.bindings) {
    if (!quiet) {
      console.warn(
        '⚠️ Wikidata SPARQL tạm thời bận/lỗi, tự chuyển sang MediaWiki Category API.',
      );
    }
    return [];
  }

  const targetScope = scope === 'vn' ? 'VN' : 'WORLD';
  return payload.results.bindings
    .map((b) => b.title?.value?.trim() || '')
    .filter(Boolean)
    .map((title) => ({ title, scope: targetScope }));
}

async function fetchWikipediaCategoryTitles(
  categoryName: string,
  targetScope: 'VN' | 'WORLD',
  limit: number,
): Promise<WikiCandidateTitle[]> {
  const apiBase = getWikipediaBaseUrl();
  const params = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Thể loại:${categoryName}`,
    cmnamespace: '0',
    cmlimit: String(Math.min(limit, 50)),
    format: 'json',
    formatversion: '2',
  });
  const payload = await fetchJsonWithTimeout<{
    query?: { categorymembers?: Array<{ title?: string }> };
  }>(`${apiBase}?${params.toString()}`, {});

  const members = payload?.query?.categorymembers ?? [];
  return members
    .map((m) => (typeof m.title === 'string' ? m.title.trim() : ''))
    .filter((t) => Boolean(t) && !t.startsWith('Danh sách '))
    .map((title) => ({ title, scope: targetScope }));
}

async function collectCandidatePool(
  options: WikiCliOptions,
): Promise<WikiCandidateTitle[]> {
  const seen = new Set<string>();
  const ordered: WikiCandidateTitle[] = [];
  const pushUnique = (list: WikiCandidateTitle[]) => {
    for (const item of list) {
      const key = item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      ordered.push(item);
      if (ordered.length >= options.limit) return;
    }
  };

  if (options.topicsFile) {
    pushUnique(await readCustomTopicsFile(options.topicsFile));
    return ordered.slice(0, options.limit);
  }

  pushUnique(buildCoreCandidates(options.scope));
  if (ordered.length >= options.limit) return ordered;

  const remaining = options.limit - ordered.length;
  pushUnique(
    await fetchWikidataHistoryTitles(options.scope, remaining, options.quiet),
  );
  if (ordered.length >= options.limit) return ordered;

  const scopesToExpand: Array<'VN' | 'WORLD'> =
    options.scope === 'all'
      ? ['VN', 'WORLD']
      : [options.scope === 'vn' ? 'VN' : 'WORLD'];

  for (const s of scopesToExpand) {
    for (const category of WIKI_FALLBACK_CATEGORIES[s]) {
      if (ordered.length >= options.limit) break;
      const batch = await fetchWikipediaCategoryTitles(
        category,
        s,
        options.limit - ordered.length,
      );
      pushUnique(batch);
    }
  }

  return ordered;
}

interface MediaWikiQueryPage {
  title?: string;
  missing?: boolean;
  fullurl?: string;
  extract?: string;
}

async function fetchWikipediaExtractsBatch(
  titles: string[],
): Promise<MediaWikiQueryPage[]> {
  const apiBase = getWikipediaBaseUrl();
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts|info',
    inprop: 'url',
    explaintext: '1',
    redirects: '1',
    format: 'json',
    formatversion: '2',
    titles: titles.join('|'),
  });
  const payload = await fetchJsonWithTimeout<{
    query?: { pages?: MediaWikiQueryPage[] };
  }>(`${apiBase}?${params.toString()}`, {});

  return payload?.query?.pages ?? [];
}

function buildScopeLookup(
  candidates: WikiCandidateTitle[],
): Map<string, 'VN' | 'WORLD'> {
  const map = new Map<string, 'VN' | 'WORLD'>();
  for (const item of candidates) {
    map.set(item.title.toLowerCase(), item.scope);
  }
  return map;
}

async function persistWikiPage(
  page: MediaWikiQueryPage,
  options: WikiCliOptions,
  scopeByTitle: ReadonlyMap<string, 'VN' | 'WORLD'>,
  writtenPaths: Set<string>,
  manifestEntries: WikiManifestEntry[],
): Promise<void> {
  if (page.missing || !page.title || !page.extract) return;
  if (page.extract.trim().length < MIN_EXTRACT_CHARS) return;

  const fallbackUrl = new URL(
    `/wiki/${encodeURIComponent(page.title.replace(/\s+/g, '_'))}`,
    ['https', DEFAULT_WIKIPEDIA_HOST].join('://'),
  ).toString();
  const sourceUrl = page.fullurl || fallbackUrl;
  const scope =
    scopeByTitle.get(page.title.toLowerCase()) ??
    (options.scope === 'world' ? 'WORLD' : 'VN');

  const artifact = formatWikipediaMarkdown({
    title: page.title,
    scope,
    sourceUrl,
    extract: page.extract,
    wikipediaHost: DEFAULT_WIKIPEDIA_HOST,
  });

  if (writtenPaths.has(artifact.relativePath)) return;
  writtenPaths.add(artifact.relativePath);
  await fs.writeFile(
    path.join(options.outDir, artifact.relativePath),
    artifact.markdown,
    'utf8',
  );
  manifestEntries.push(artifact.manifestEntry);
}

export async function runWikiCollector(
  argv = process.argv.slice(2),
): Promise<void> {
  const options = parseWikiCliOptions(argv);
  const articlesDir = path.join(options.outDir, 'articles');

  await fs.mkdir(options.outDir, { recursive: true });
  if (options.clean) {
    await fs.rm(articlesDir, { recursive: true, force: true });
    await fs.rm(path.join(options.outDir, MANIFEST_FILENAME), { force: true });
  }
  await fs.mkdir(articlesDir, { recursive: true });

  const candidates = await collectCandidatePool(options);
  const scopeByTitle = buildScopeLookup(candidates);
  const manifestEntries: WikiManifestEntry[] = [];
  const writtenPaths = new Set<string>();

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batchTitles = candidates.slice(i, i + BATCH_SIZE).map((c) => c.title);
    const pages = await fetchWikipediaExtractsBatch(batchTitles);
    for (const page of pages) {
      await persistWikiPage(
        page,
        options,
        scopeByTitle,
        writtenPaths,
        manifestEntries,
      );
    }
  }

  const manifest: WikiManifestDocument = {
    version: 1,
    fetchedAt: new Date().toISOString(),
    scope: options.scope,
    total: manifestEntries.length,
    entries: manifestEntries,
  };
  await fs.writeFile(
    path.join(options.outDir, MANIFEST_FILENAME),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  if (!options.quiet) {
    console.log(
      `✅ Đã tải ${manifest.total} bài Wikipedia (${options.scope}) vào ${options.outDir}`,
    );
    console.log(
      `   • Manifest: ${path.join(options.outDir, MANIFEST_FILENAME)}`,
    );
  }
}

if (require.main === module) {
  runWikiCollector().catch((err: unknown) => {
    console.error('❌ Lỗi tải dữ liệu Wikipedia/Wikidata:', err);
    process.exit(1);
  });
}
