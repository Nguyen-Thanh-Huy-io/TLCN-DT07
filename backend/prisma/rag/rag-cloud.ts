/**
 * Quản trị & đồng bộ dữ liệu lên Google Cloud Storage + Vertex AI RAG Engine:
 *   npm run rag:setup   -> Bật Serverless Mode & tạo Corpus Managed Agent Retrieval
 *   npm run rag:sync    -> Upload HISGO (.md) + Wikipedia (.md) + Sách (files/) lên GCS & import vào RAG
 *   npm run rag:status  -> Xem danh sách file đã nạp & kiểm tra truy vấn retrieveContexts
 */
import 'dotenv/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import config from '../../src/common/config/app.config';
import { GoogleAiService } from '../../src/common/services/google-ai.service';

const VERTEX_HOST_SUFFIX = 'aiplatform.googleapis.com';
const GCS_UPLOAD_HOST = 'storage.googleapis.com';
const DEFAULT_CORPUS_NAME = 'hisgo-history-corpus';
const LRO_POLL_INTERVAL_MS = 3_000;
const LRO_MAX_ATTEMPTS = 60;
const UPLOAD_CONCURRENCY = 6;
const SUPPORTED_BOOK_EXTENSIONS = new Set(['.pdf', '.txt', '.md', '.docx']);

interface UploadTarget {
  absPath: string;
  gcsObjectKey: string;
  contentType: string;
}

interface CloudContext {
  accessToken: string;
  projectId: string;
  ragLocation: string;
}

function resolveRagEndpointHost(location: string): string {
  return `https://${location}-${VERTEX_HOST_SUFFIX}/v1beta1`;
}

function resolveMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.json') return 'application/json';
  if (ext === '.md') return 'text/markdown; charset=utf-8';
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return 'text/plain; charset=utf-8';
}

async function vertexJsonFetch<T>(
  url: string,
  accessToken: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: T | null; rawError: string }> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const rawError = await res.text();
    return { ok: false, status: res.status, data: null, rawError };
  }
  const data = (await res.json()) as T;
  return { ok: true, status: res.status, data, rawError: '' };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollOperation(
  ctx: CloudContext,
  operationName: string,
): Promise<Record<string, unknown>> {
  const base = resolveRagEndpointHost(ctx.ragLocation);
  const cleanOp = operationName.replace(/^\/+/, '');
  const opUrl = `${base}/${cleanOp}`;

  for (let i = 0; i < LRO_MAX_ATTEMPTS; i++) {
    const res = await vertexJsonFetch<Record<string, unknown>>(
      opUrl,
      ctx.accessToken,
      'GET',
    );
    if (!res.ok || !res.data) {
      throw new Error(
        `Không kiểm tra được operation (${res.status}): ${res.rawError}`,
      );
    }
    if (res.data.done === true) {
      if (res.data.error) {
        throw new Error(`Operation lỗi: ${JSON.stringify(res.data.error)}`);
      }
      return res.data;
    }
    await sleep(LRO_POLL_INTERVAL_MS);
  }
  throw new Error('Hết thời gian chờ Google Cloud Operation hoàn tất.');
}

async function enableServerlessRagMode(ctx: CloudContext): Promise<void> {
  const base = resolveRagEndpointHost(ctx.ragLocation);
  const url = `${base}/projects/${encodeURIComponent(ctx.projectId)}/locations/${encodeURIComponent(ctx.ragLocation)}/ragEngineConfig`;
  const res = await vertexJsonFetch<{ ragManagedDbConfig?: unknown }>(
    url,
    ctx.accessToken,
    'PATCH',
    { ragManagedDbConfig: { serverless: {} } },
  );
  if (!res.ok) {
    throw new Error(
      `Không bật được Serverless Mode (dừng lại để tránh mở Spanner Basic). HTTP ${res.status}: ${res.rawError}`,
    );
  }
}

async function runSetupAction(
  ctx: CloudContext,
  argv: string[],
): Promise<void> {
  const displayNameArg = argv
    .find((a) => a.startsWith('--display-name='))
    ?.slice('--display-name='.length)
    .trim();
  const displayName = displayNameArg || DEFAULT_CORPUS_NAME;

  console.log(`🔧 Bật Serverless Mode tại ${ctx.ragLocation}...`);
  await enableServerlessRagMode(ctx);
  console.log('✅ Đã xác nhận Serverless Mode.');

  const base = resolveRagEndpointHost(ctx.ragLocation);
  const listUrl = `${base}/projects/${encodeURIComponent(ctx.projectId)}/locations/${encodeURIComponent(ctx.ragLocation)}/ragCorpora`;
  const existing = await vertexJsonFetch<{
    ragCorpora?: Array<{ name?: string; displayName?: string }>;
  }>(listUrl, ctx.accessToken, 'GET');

  const matched = existing.data?.ragCorpora?.find(
    (c) =>
      c.displayName === displayName ||
      c.name === config.google_cloud_rag_corpus,
  );
  if (matched?.name) {
    console.log(`ℹ️ Đã tìm thấy Corpus sẵn có: ${matched.name}`);
    console.log(
      `👉 Đặt vào backend/.env: GOOGLE_CLOUD_RAG_CORPUS=${matched.name}`,
    );
    return;
  }

  console.log(
    `🚀 Đang tạo RAG Corpus "${displayName}" (Managed Agent Retrieval)...`,
  );
  const created = await vertexJsonFetch<{
    name?: string;
    response?: { name?: string };
  }>(listUrl, ctx.accessToken, 'POST', {
    display_name: displayName,
    vector_db_config: {
      rag_managed_vertex_vector_search: {},
    },
  });

  if (!created.ok || !created.data) {
    throw new Error(
      `Tạo Corpus thất bại HTTP ${created.status}: ${created.rawError}`,
    );
  }

  let corpusName = created.data.response?.name || '';
  if (!corpusName && created.data.name?.includes('/operations/')) {
    const doneOp = await pollOperation(ctx, created.data.name);
    const resp = doneOp.response as { name?: string } | undefined;
    corpusName = resp?.name || '';
  } else if (!corpusName && created.data.name?.includes('/ragCorpora/')) {
    corpusName = created.data.name;
  }

  console.log(`✅ Tạo thành công Corpus: ${corpusName}`);
  console.log(
    `👉 Dán dòng sau vào backend/.env:\nGOOGLE_CLOUD_RAG_CORPUS=${corpusName}`,
  );
}

async function listFilesRecursive(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await listFilesRecursive(full)));
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
    return files;
  } catch {
    return [];
  }
}

async function collectSyncTargets(): Promise<UploadTarget[]> {
  const root = process.cwd();
  const targets: UploadTarget[] = [];

  const hisgoDir = path.resolve(root, 'rag-export');
  for (const sub of ['articles', 'lessons', 'blogs', 'timelines']) {
    const files = await listFilesRecursive(path.join(hisgoDir, sub));
    for (const absPath of files) {
      if (!absPath.endsWith('.md')) continue;
      const rel = path.relative(hisgoDir, absPath).split(path.sep).join('/');
      targets.push({
        absPath,
        gcsObjectKey: `hisgo/${rel}`,
        contentType: resolveMimeType(absPath),
      });
    }
  }

  const wikiDir = path.resolve(root, 'rag-wiki', 'articles');
  for (const absPath of await listFilesRecursive(wikiDir)) {
    if (!absPath.endsWith('.md')) continue;
    targets.push({
      absPath,
      gcsObjectKey: `wikipedia/articles/${path.basename(absPath)}`,
      contentType: resolveMimeType(absPath),
    });
  }

  const booksDir = path.resolve(root, 'rag-sources', 'files');
  for (const absPath of await listFilesRecursive(booksDir)) {
    const ext = path.extname(absPath).toLowerCase();
    if (!SUPPORTED_BOOK_EXTENSIONS.has(ext)) continue;
    targets.push({
      absPath,
      gcsObjectKey: `books/${path.basename(absPath)}`,
      contentType: resolveMimeType(absPath),
    });
  }

  return targets;
}

async function uploadToGcs(
  accessToken: string,
  bucket: string,
  target: UploadTarget,
): Promise<void> {
  const bytes = await fs.readFile(target.absPath);
  const uploadUrl = new URL(
    `/upload/storage/v1/b/${encodeURIComponent(bucket)}/o`,
    ['https', GCS_UPLOAD_HOST].join('://'),
  );
  uploadUrl.searchParams.set('uploadType', 'media');
  uploadUrl.searchParams.set('name', target.gcsObjectKey);

  const res = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': target.contentType,
    },
    body: bytes,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Upload GCS thất bại (${target.gcsObjectKey}): HTTP ${res.status} ${errText}`,
    );
  }
}

async function uploadBatchWithConcurrency(
  accessToken: string,
  bucket: string,
  targets: UploadTarget[],
): Promise<void> {
  let cursor = 0;
  const worker = async () => {
    while (cursor < targets.length) {
      const idx = cursor++;
      await uploadToGcs(accessToken, bucket, targets[idx]);
    }
  };
  const workerCount = Math.min(UPLOAD_CONCURRENCY, targets.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

async function runSyncAction(ctx: CloudContext): Promise<void> {
  const bucket = config.google_cloud_rag_bucket;
  const corpus = config.google_cloud_rag_corpus;
  if (!bucket || !corpus) {
    throw new Error(
      'Thiếu GOOGLE_CLOUD_RAG_BUCKET hoặc GOOGLE_CLOUD_RAG_CORPUS trong backend/.env.',
    );
  }

  const targets = await collectSyncTargets();
  if (targets.length === 0) {
    console.log(
      '⚠️ Không có file nào để sync. Hãy chạy npm run rag:export / rag:wiki trước.',
    );
    return;
  }

  console.log(`☁️ Đang upload ${targets.length} file lên gs://${bucket}/ ...`);
  await uploadBatchWithConcurrency(ctx.accessToken, bucket, targets);
  console.log('✅ Upload GCS hoàn tất.');

  const prefixes = Array.from(
    new Set(
      targets.map((t) => `gs://${bucket}/${t.gcsObjectKey.split('/')[0]}/`),
    ),
  );
  const base = resolveRagEndpointHost(ctx.ragLocation);
  const importUrl = `${base}/${corpus.replace(/^\/+/, '')}/ragFiles:import`;

  console.log(
    `📥 Đang kích hoạt Vertex AI RAG import (${prefixes.join(', ')})...`,
  );
  const res = await vertexJsonFetch<{ name?: string }>(
    importUrl,
    ctx.accessToken,
    'POST',
    {
      import_rag_files_config: {
        gcs_source: { uris: prefixes },
        rag_file_transformation_config: {
          rag_file_chunking_config: {
            chunk_size: 1024,
            chunk_overlap: 200,
          },
        },
        max_embedding_requests_per_min: 1000,
      },
    },
  );

  if (!res.ok || !res.data) {
    throw new Error(`Import RAG thất bại HTTP ${res.status}: ${res.rawError}`);
  }

  if (res.data.name) {
    const op = await pollOperation(ctx, res.data.name);
    console.log(
      '✅ RAG Corpus đã cập nhật xong:',
      JSON.stringify(op.response ?? { done: true }),
    );
  }
}

async function runStatusAction(
  ctx: CloudContext,
  argv: string[],
): Promise<void> {
  const corpus = config.google_cloud_rag_corpus;
  if (!corpus) {
    throw new Error('Thiếu GOOGLE_CLOUD_RAG_CORPUS trong backend/.env.');
  }
  const base = resolveRagEndpointHost(ctx.ragLocation);
  const listUrl = `${base}/${corpus.replace(/^\/+/, '')}/ragFiles?pageSize=100`;
  const filesRes = await vertexJsonFetch<{
    ragFiles?: Array<{ name?: string; displayName?: string }>;
  }>(listUrl, ctx.accessToken, 'GET');

  if (!filesRes.ok) {
    throw new Error(
      `Không đọc được ragFiles HTTP ${filesRes.status}: ${filesRes.rawError}`,
    );
  }
  const files = filesRes.data?.ragFiles ?? [];
  console.log(`📊 Corpus: ${corpus}`);
  console.log(`   • Số file trong trang đầu: ${files.length}`);

  const queryArg = argv
    .find((a) => a.startsWith('--q='))
    ?.slice('--q='.length)
    .trim();
  if (queryArg) {
    const retrieveUrl = `${base}/projects/${encodeURIComponent(ctx.projectId)}/locations/${encodeURIComponent(ctx.ragLocation)}:retrieveContexts`;
    const retRes = await vertexJsonFetch<{
      contexts?: {
        contexts?: Array<{
          sourceUri?: string;
          text?: string;
          distance?: number;
        }>;
      };
    }>(retrieveUrl, ctx.accessToken, 'POST', {
      vertexRagStore: { ragResources: [{ ragCorpus: corpus }] },
      query: { text: queryArg },
    });
    const hits = retRes.data?.contexts?.contexts ?? [];
    console.log(
      `🔍 Kết quả thử truy vấn "${queryArg}" (${hits.length} chunk):`,
    );
    hits.slice(0, 4).forEach((h, idx) => {
      console.log(
        `   ${idx + 1}. [dist=${h.distance ?? '?'}] ${h.sourceUri || 'unknown'}`,
      );
    });
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const actionArg =
    argv.find((a) => a.startsWith('--action='))?.slice('--action='.length) ||
    'status';

  const aiService = new GoogleAiService();
  const authCtx = await aiService.getCloudAccessContext();
  if (!authCtx) {
    throw new Error(
      'Chưa cấu hình Service Account Vertex AI hợp lệ trong backend/.env.',
    );
  }

  const ctx: CloudContext = {
    accessToken: authCtx.accessToken,
    projectId: authCtx.projectId,
    ragLocation: config.google_cloud_rag_location || 'us-central1',
  };

  if (actionArg === 'setup') {
    await runSetupAction(ctx, argv);
  } else if (actionArg === 'sync') {
    await runSyncAction(ctx);
  } else {
    await runStatusAction(ctx, argv);
  }
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error(
      '❌ Lỗi RAG Cloud CLI:',
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  });
}
