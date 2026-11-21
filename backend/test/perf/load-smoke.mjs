import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const DEFAULT_BASE_URL = process.env.PERF_BASE_URL || 'http://127.0.0.1:5000';
const CONCURRENCY = Number(process.env.PERF_CONCURRENCY || 10);
const REQUESTS_PER_READ_SCENARIO = Number(process.env.PERF_REQUESTS || 50);
const WARMUP_REQUESTS = Number(process.env.PERF_WARMUP || 3);
const REPORT_OUTPUT_PATH =
  process.env.PERF_REPORT_PATH ||
  path.resolve(process.cwd(), 'coverage', 'perf-report.json');

const PERF_THRESHOLDS = {
  maxP95Ms: Number(process.env.PERF_MAX_P95_MS || 1000),
  max5xxErrors: 0,
  maxUnexpectedRatePercent: 1,
};

const SCENARIOS = [
  {
    name: 'Public Articles Read',
    method: 'GET',
    path: '/public/articles?limit=20',
    totalRequests: REQUESTS_PER_READ_SCENARIO,
    concurrency: CONCURRENCY,
    expectedStatuses: new Set([200]),
  },
  {
    name: 'Public Practice Quizzes Read',
    method: 'GET',
    path: '/public/quizzes',
    totalRequests: REQUESTS_PER_READ_SCENARIO,
    concurrency: CONCURRENCY,
    expectedStatuses: new Set([200]),
  },
  {
    name: 'Public Timelines Read',
    method: 'GET',
    path: '/public/timelines',
    totalRequests: REQUESTS_PER_READ_SCENARIO,
    concurrency: CONCURRENCY,
    expectedStatuses: new Set([200]),
  },
  {
    name: 'Auth Brute-Force & Rate-Limit Resilience',
    method: 'POST',
    path: '/auth/login',
    body: JSON.stringify({
      email: 'perf_non_existent@example.com',
      password: 'WrongPassword123!',
    }),
    headers: { 'content-type': 'application/json' },
    totalRequests: 15,
    concurrency: 5,
    expectedStatuses: new Set([401, 429]),
  },
];

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return Number(sorted[idx].toFixed(2));
}

async function warmupScenario(baseUrl, scenario) {
  if (scenario.method !== 'GET') return;
  for (let i = 0; i < WARMUP_REQUESTS; i += 1) {
    try {
      const res = await fetch(`${baseUrl}${scenario.path}`);
      await res.arrayBuffer();
    } catch {
      // Measured in main loop if unreachable
    }
  }
}

async function runScenario(baseUrl, scenario) {
  await warmupScenario(baseUrl, scenario);
  const latencies = [];
  const statusCounts = {};
  let nextIndex = 0;
  let networkErrors = 0;
  let server5xxErrors = 0;
  let unexpectedStatuses = 0;

  const startTime = performance.now();

  async function worker() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= scenario.totalRequests) return;

      const reqStart = performance.now();
      try {
        const res = await fetch(`${baseUrl}${scenario.path}`, {
          method: scenario.method,
          headers: scenario.headers,
          body: scenario.body,
        });
        await res.arrayBuffer();
        const elapsed = performance.now() - reqStart;
        latencies.push(elapsed);

        const codeKey = String(res.status);
        statusCounts[codeKey] = (statusCounts[codeKey] || 0) + 1;

        if (res.status >= 500) {
          server5xxErrors += 1;
        }
        if (!scenario.expectedStatuses.has(res.status)) {
          unexpectedStatuses += 1;
        }
      } catch {
        const elapsed = performance.now() - reqStart;
        latencies.push(elapsed);
        networkErrors += 1;
        unexpectedStatuses += 1;
      }
    }
  }

  await Promise.all(
    Array.from({ length: scenario.concurrency }, () => worker()),
  );

  const durationMs = performance.now() - startTime;
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avgMs = sorted.length > 0 ? Number((sum / sorted.length).toFixed(2)) : 0;
  const p50Ms = percentile(sorted, 50);
  const p95Ms = percentile(sorted, 95);
  const p99Ms = percentile(sorted, 99);
  const rps = Number(((scenario.totalRequests / durationMs) * 1000).toFixed(2));
  const unexpectedRatePercent = Number(
    ((unexpectedStatuses / scenario.totalRequests) * 100).toFixed(2),
  );

  const passed =
    p95Ms <= PERF_THRESHOLDS.maxP95Ms &&
    server5xxErrors <= PERF_THRESHOLDS.max5xxErrors &&
    networkErrors === 0 &&
    unexpectedRatePercent <= PERF_THRESHOLDS.maxUnexpectedRatePercent;

  return {
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    totalRequests: scenario.totalRequests,
    concurrency: scenario.concurrency,
    durationMs: Number(durationMs.toFixed(2)),
    rps,
    avgMs,
    p50Ms,
    p95Ms,
    p99Ms,
    networkErrors,
    server5xxErrors,
    unexpectedStatuses,
    unexpectedRatePercent,
    statusCounts,
    passed,
  };
}

async function main() {
  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, '');
  const results = [];

  for (const scenario of SCENARIOS) {
    const result = await runScenario(baseUrl, scenario);
    results.push(result);
    console.log(
      `[PERF] ${result.name} (${result.method} ${result.path}) -> ` +
        `RPS=${result.rps}, avg=${result.avgMs}ms, p95=${result.p95Ms}ms, ` +
        `p99=${result.p99Ms}ms, 5xx=${result.server5xxErrors}, ` +
        `statuses=${JSON.stringify(result.statusCounts)} => ${result.passed ? 'PASS' : 'FAIL'}`,
    );
  }

  const allPassed = results.every((r) => r.passed);
  await fs.mkdir(path.dirname(REPORT_OUTPUT_PATH), { recursive: true });
  await fs.writeFile(
    REPORT_OUTPUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        thresholds: PERF_THRESHOLDS,
        allPassed,
        results,
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`[PERF] Report saved to ${REPORT_OUTPUT_PATH}`);

  if (!allPassed) {
    process.exitCode = 1;
  }
}

void main();
