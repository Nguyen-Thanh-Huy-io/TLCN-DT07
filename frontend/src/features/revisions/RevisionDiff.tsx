'use client';

import type { ReactNode } from 'react';
import type { RevisionChange } from '@/services/entities/content-revision.service';

/** Giá trị → chữ để so sánh / hiển thị. */
function asText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}

type Part = { text: string; op: 'same' | 'add' | 'del' };

/** So sánh theo từ (LCS); đoạn quá dài thì chỉ hiện bản trước / bản sau. */
function wordDiff(before: string, after: string): Part[] | null {
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  if (a.length * b.length > 4_000_000) return null;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const parts: Part[] = [];
  const push = (text: string, op: Part['op']) => {
    const last = parts[parts.length - 1];
    if (last && last.op === op) last.text += text;
    else parts.push({ text, op });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(a[i], 'same');
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push(a[i], 'del');
      i++;
    } else {
      push(b[j], 'add');
      j++;
    }
  }
  while (i < a.length) push(a[i++], 'del');
  while (j < b.length) push(b[j++], 'add');
  return parts;
}

const PART_CLASS: Record<Part['op'], string> = {
  same: '',
  add: 'bg-emerald-100 text-emerald-900 rounded-sm',
  del: 'bg-rose-100 text-rose-800 line-through rounded-sm',
};

function ListChange({ before, after, labelOf }: { before: unknown; after: unknown; labelOf?: (v: string) => string }) {
  const b = Array.isArray(before) ? before.map(String) : [];
  const a = Array.isArray(after) ? after.map(String) : [];
  const show = (v: string) => (labelOf ? labelOf(v) : v);
  return (
    <div className="flex flex-wrap gap-1.5">
      {b.filter((v) => !a.includes(v)).map((v) => (
        <span key={`d-${v}`} className="rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-800 line-through">
          {show(v)}
        </span>
      ))}
      {a.map((v) => (
        <span
          key={`a-${v}`}
          className={`rounded px-1.5 py-0.5 text-xs ${b.includes(v) ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-900'}`}
        >
          {show(v)}
        </span>
      ))}
      {a.length === 0 && b.length === 0 && <span className="text-xs text-slate-400">(trống)</span>}
    </div>
  );
}

function SideBySide({ before, after, mono }: { before: string; after: string; mono?: boolean }) {
  const cls = `max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border p-2.5 text-xs ${mono ? 'font-mono' : ''}`;
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">Đang xuất bản</div>
        <pre className={`${cls} border-rose-200 bg-rose-50/50 text-slate-700`}>{before || '(trống)'}</pre>
      </div>
      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Bản sửa</div>
        <pre className={`${cls} border-emerald-200 bg-emerald-50/50 text-slate-800`}>{after || '(trống)'}</pre>
      </div>
    </div>
  );
}

/**
 * Chỉ các trường thay đổi giữa bản đang xuất bản và bản sửa (hoặc phiên bản cũ).
 * labelOf: đổi id / mã sang nhãn dễ đọc (vd. id loại sự kiện → "Trận đánh").
 */
export function RevisionDiff({
  changes,
  labelOf,
  beforeLabel = 'Đang xuất bản',
  afterLabel = 'Bản sửa',
}: {
  changes: RevisionChange[];
  labelOf?: (value: string) => string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  if (changes.length === 0) {
    return <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">Không có khác biệt nào so với bản đang xuất bản.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {changes.length} trường thay đổi · <span className="rounded-sm bg-rose-100 px-1 text-rose-800 line-through">bị bỏ</span>{' '}
        <span className="rounded-sm bg-emerald-100 px-1 text-emerald-900">được thêm</span> — trường không đổi được ẩn.
      </p>
      {changes.map((c) => {
        const before = asText(c.before);
        const after = asText(c.after);
        let body: ReactNode;
        if (c.kind === 'list') body = <ListChange before={c.before} after={c.after} labelOf={labelOf} />;
        else if (c.kind === 'json') body = <SideBySide before={before} after={after} mono />;
        else if (c.kind === 'longtext') {
          const parts = wordDiff(before, after);
          body = parts ? (
            <p className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-2.5 text-sm leading-relaxed text-slate-800">
              {parts.map((p, i) => (
                <span key={i} className={PART_CLASS[p.op]}>
                  {p.text}
                </span>
              ))}
            </p>
          ) : (
            <SideBySide before={before} after={after} />
          );
        } else
          body = (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-800 line-through" title={beforeLabel}>
                {labelOf && before ? labelOf(before) : before || '(trống)'}
              </span>
              <span className="text-slate-400">→</span>
              <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-900" title={afterLabel}>
                {labelOf && after ? labelOf(after) : after || '(trống)'}
              </span>
            </div>
          );
        return (
          <section key={c.key} className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
            <div className="mb-2 text-xs font-bold text-slate-700">{c.label}</div>
            {body}
          </section>
        );
      })}
    </div>
  );
}
