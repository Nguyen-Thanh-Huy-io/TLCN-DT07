'use client';

import type { ReactNode } from 'react';
import type { RevisionChange, RevisionLabels } from '@/services/entities/content-revision.service';

type Row = Record<string, unknown>;

const isEmpty = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
const stripHtml = (html: string) =>
  html
    .replace(/<\/(p|h\d|li|div|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
const stable = (v: unknown): string => JSON.stringify(v, (_k, val) =>
  val && typeof val === 'object' && !Array.isArray(val)
    ? Object.fromEntries(Object.entries(val as Row).sort(([a], [b]) => a.localeCompare(b)))
    : val,
);

/* ---------- So sánh chữ theo từ ---------- */

type Part = { text: string; op: 'same' | 'add' | 'del' };

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

function TextDiff({ before, after }: { before: string; after: string }) {
  const parts = wordDiff(before, after);
  if (!parts) {
    return (
      <div className="grid gap-2 md:grid-cols-2">
        <Box tone="old">{before || '(trống)'}</Box>
        <Box tone="new">{after || '(trống)'}</Box>
      </div>
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-2.5 text-sm leading-relaxed text-slate-800">
      {parts.map((p, i) => (
        <span key={i} className={PART_CLASS[p.op]}>
          {p.text}
        </span>
      ))}
    </p>
  );
}

/* ---------- Khối hiển thị nhỏ ---------- */

function Box({ tone, children }: { tone: 'old' | 'new'; children: ReactNode }) {
  return (
    <div
      className={`max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg border p-2.5 text-sm ${
        tone === 'old' ? 'border-rose-200 bg-rose-50/60 text-slate-600' : 'border-emerald-200 bg-emerald-50/60 text-slate-800'
      }`}
    >
      <div className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${tone === 'old' ? 'text-rose-700' : 'text-emerald-700'}`}>
        {tone === 'old' ? 'Trước' : 'Sau'}
      </div>
      {children}
    </div>
  );
}

function Swap({ before, after }: { before: ReactNode; after: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-800 line-through">{before}</span>
      <span className="text-slate-400">→</span>
      <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-900">{after}</span>
    </div>
  );
}

type Mark = 'add' | 'del' | 'edit' | 'move';
const MARK_STYLE: Record<Mark, { cls: string; text: string }> = {
  add: { cls: 'border-emerald-200 bg-emerald-50/60', text: 'Thêm' },
  del: { cls: 'border-rose-200 bg-rose-50/60 opacity-80', text: 'Bỏ' },
  edit: { cls: 'border-amber-200 bg-amber-50/60', text: 'Sửa' },
  move: { cls: 'border-sky-200 bg-sky-50/60', text: 'Đổi vị trí' },
};

function Marked({ mark, title, children }: { mark: Mark; title: ReactNode; children?: ReactNode }) {
  const style = MARK_STYLE[mark];
  return (
    <div className={`rounded-lg border p-2.5 ${style.cls}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
          {style.text}
        </span>
        <span className={`font-semibold text-slate-800 ${mark === 'del' ? 'line-through' : ''}`}>{title}</span>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

/** So khớp hai danh sách theo khóa: thêm / bỏ / sửa / đổi vị trí. */
function matchRows(
  before: Row[],
  after: Row[],
  keyOf: (r: Row, i: number) => string,
  /** Phần được so (mặc định cả dòng) — bỏ trường ẩn như thứ tự để không báo "Sửa" giả. */
  view: (r: Row) => unknown = (r) => r,
) {
  const oldMap = new Map(before.map((r, i) => [keyOf(r, i), { row: r, index: i }]));
  const newKeys = new Set(after.map((r, i) => keyOf(r, i)));
  const keptOld = before.map((r, i) => keyOf(r, i)).filter((k) => newKeys.has(k));
  const keptNew = after.map((r, i) => keyOf(r, i)).filter((k) => oldMap.has(k));
  const out: Array<{ mark: Mark; before?: Row; after?: Row; key: string }> = [];
  after.forEach((r, i) => {
    const key = keyOf(r, i);
    const old = oldMap.get(key);
    if (!old) out.push({ mark: 'add', after: r, key });
    else if (stable(view(old.row)) !== stable(view(r))) out.push({ mark: 'edit', before: old.row, after: r, key });
    else if (keptOld.indexOf(key) !== keptNew.indexOf(key)) out.push({ mark: 'move', before: old.row, after: r, key });
  });
  before.forEach((r, i) => {
    const key = keyOf(r, i);
    if (!newKeys.has(key)) out.push({ mark: 'del', before: r, key });
  });
  return out;
}

/* ---------- Khối nội dung bài học ---------- */

const BLOCK_LABELS: Record<string, string> = {
  TEXT: 'Đoạn văn',
  IMAGE: 'Hình ảnh',
  VIDEO: 'Video',
  EVENT: 'Thẻ sự kiện',
  TIMELINE: 'Dòng thời gian',
  MAP: 'Bản đồ',
  QUIZ: 'Câu hỏi',
  SECTION_ROW: 'Hàng nhiều cột',
  COMPARISON_TABLE: 'Bảng so sánh',
  RESOURCE_LINK: 'Liên kết tư liệu',
  CHARACTER: 'Thẻ nhân vật',
};

/** Chữ đọc được của một khối (kể cả khối con trong hàng nhiều cột). */
function blockText(block: unknown): string {
  if (!block || typeof block !== 'object') return typeof block === 'string' ? stripHtml(block) : '';
  if (Array.isArray(block)) return block.map(blockText).filter(Boolean).join('\n');
  const b = block as Row;
  const own = ['title', 'name', 'heading', 'question', 'years', 'summary', 'content', 'text', 'caption', 'alt', 'description']
    .map((k) => (typeof b[k] === 'string' ? stripHtml(b[k] as string) : ''))
    .filter(Boolean);
  const nested = Object.entries(b)
    .filter(([k, v]) => typeof v === 'object' && v !== null && !['id'].includes(k))
    .map(([, v]) => blockText(v))
    .filter(Boolean);
  return [...own, ...nested].join('\n');
}

function blockTitle(block: Row) {
  const type = String(block.type ?? '');
  const head = blockText(block).split('\n')[0] ?? '';
  return `${BLOCK_LABELS[type] ?? type}${head ? ` — ${head.slice(0, 90)}${head.length > 90 ? '…' : ''}` : ''}`;
}

/** Nội dung bài học → danh sách khối: bài cũ lưu chuỗi HTML được coi là một khối "Đoạn văn". */
function toBlocks(content: unknown): Row[] {
  if (Array.isArray(content)) return content as Row[];
  if (typeof content === 'string' && content.trim()) return [{ id: '__html', type: 'TEXT', content }];
  return [];
}

function BlocksDiff({ before, after }: { before: unknown; after: unknown }) {
  const oldBlocks = toBlocks(before);
  const newBlocks = toBlocks(after);
  const rows = matchRows(oldBlocks, newBlocks, (r, i) => String(r.id ?? `#${i}`));
  // Bản sửa làm trống nội dung: cảnh báo rõ, người duyệt không được bỏ sót.
  const wiped = blockText(oldBlocks).trim() !== '' && blockText(newBlocks).trim() === '';
  const formatOnly = Array.isArray(before) !== Array.isArray(after) && !wiped;
  return (
    <div className="space-y-2">
      {wiped && (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
          ⚠ Bản sửa này làm trống toàn bộ nội dung bài học.
        </p>
      )}
      {formatOnly && (
        <p className="text-xs text-slate-500">Nội dung chuyển giữa dạng văn bản HTML và dạng khối — đối chiếu kỹ phần chữ bên dưới.</p>
      )}
      {!rows.length && <p className="text-xs text-slate-500">Các khối giữ nguyên chữ; chỉ thuộc tính hiển thị của khối thay đổi.</p>}
      {rows.map((r) => (
        <Marked key={r.key + r.mark} mark={r.mark} title={blockTitle((r.after ?? r.before) as Row)}>
          {r.mark === 'edit' && <TextDiff before={blockText(r.before)} after={blockText(r.after)} />}
          {r.mark === 'add' && <p className="whitespace-pre-wrap text-sm text-slate-700">{blockText(r.after).slice(0, 600)}</p>}
        </Marked>
      ))}
    </div>
  );
}

/* ---------- Thực thể liên quan & tư liệu ---------- */

function RelationsDiff({ before, after, name }: { before: unknown; after: unknown; name: (v: unknown) => string }) {
  const rows = matchRows(
    Array.isArray(before) ? (before as Row[]) : [],
    Array.isArray(after) ? (after as Row[]) : [],
    (r) => String(r.entityId),
    (r) => ({ role: r.role ?? null, roleLabel: r.roleLabel || null, isPrimary: Boolean(r.isPrimary), notes: r.notes || null }),
  );
  const describe = (r?: Row) =>
    r ? `${name(r.role)}${r.roleLabel ? ` · ${r.roleLabel}` : ''}${r.isPrimary ? ' · tiêu biểu' : ''}` : '';
  return (
    <div className="space-y-2">
      {rows
        .filter((r) => r.mark !== 'move')
        .map((r) => (
          <Marked key={r.key + r.mark} mark={r.mark} title={name((r.after ?? r.before)?.entityId)}>
            {r.mark === 'edit' ? (
              <Swap before={describe(r.before) || '(trống)'} after={describe(r.after) || '(trống)'} />
            ) : (
              <span className="text-xs text-slate-600">{describe(r.after ?? r.before)}</span>
            )}
          </Marked>
        ))}
    </div>
  );
}

function Thumb({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-20 w-28 rounded-md border border-slate-200 object-cover" />;
}

function MediaDiff({ before, after }: { before: unknown; after: unknown }) {
  const rows = matchRows(
    Array.isArray(before) ? (before as Row[]) : [],
    Array.isArray(after) ? (after as Row[]) : [],
    (r) => String(r.url),
    (r) => ({ type: r.type ?? null, caption: r.caption || null }),
  );
  return (
    <div className="space-y-2">
      {rows
        .filter((r) => r.mark !== 'move')
        .map((r) => {
          const item = (r.after ?? r.before) as Row;
          return (
            <Marked key={r.key + r.mark} mark={r.mark} title={String(item.caption || item.url)}>
              <div className="flex flex-wrap items-center gap-3">
                {item.type === 'IMAGE' && <Thumb src={String(item.url)} />}
                {r.mark === 'edit' && (
                  <Swap before={String(r.before?.caption || '(không chú thích)')} after={String(r.after?.caption || '(không chú thích)')} />
                )}
                <a href={String(item.url)} target="_blank" rel="noreferrer" className="break-all text-xs text-sky-700 hover:underline">
                  {String(item.url)}
                </a>
              </div>
            </Marked>
          );
        })}
    </div>
  );
}

/* ---------- Metadata ---------- */

function flatten(value: unknown, prefix = ''): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return prefix ? { [prefix]: value } : {};
  return Object.entries(value as Row).reduce<Record<string, unknown>>((acc, [k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(acc, flatten(v, path));
    else acc[path] = v;
    return acc;
  }, {});
}

const showValue = (v: unknown) =>
  isEmpty(v) ? '(trống)' : Array.isArray(v) ? v.map(String).join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);

function ObjectDiff({ before, after, labels }: { before: unknown; after: unknown; labels: RevisionLabels }) {
  const b = flatten(before);
  const a = flatten(after);
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => stable(b[k]) !== stable(a[k]));
  return (
    <div className="space-y-2">
      {keys.map((k) => {
        const last = k.split('.').pop() ?? k;
        const label = labels[`field:${last}`] ?? k;
        const long = String(b[k] ?? '').length > 80 || String(a[k] ?? '').length > 80;
        return (
          <div key={k} className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="mb-1 text-[11px] font-semibold text-slate-500">{label}</div>
            {long && typeof (a[k] ?? b[k]) === 'string' ? (
              <TextDiff before={String(b[k] ?? '')} after={String(a[k] ?? '')} />
            ) : (
              <Swap before={showValue(b[k])} after={showValue(a[k])} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Danh sách / tham chiếu ---------- */

function ChipsDiff({ before, after, name }: { before: unknown; after: unknown; name: (v: unknown) => string }) {
  const b = (Array.isArray(before) ? before : []).map(String);
  const a = (Array.isArray(after) ? after : []).map(String);
  return (
    <div className="flex flex-wrap gap-1.5">
      {b.filter((v) => !a.includes(v)).map((v) => (
        <span key={`d-${v}`} className="rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-800 line-through">
          {name(v)}
        </span>
      ))}
      {a.map((v, i) => (
        <span
          key={`a-${v}`}
          className={`rounded px-1.5 py-0.5 text-xs ${b.includes(v) ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-900'}`}
        >
          {i === 0 && a.length > 1 ? '★ ' : ''}
          {name(v)}
        </span>
      ))}
      {!a.length && !b.length && <span className="text-xs text-slate-400">(trống)</span>}
    </div>
  );
}

/* ---------- Thành phần chính ---------- */

/** Chỉ các trường thay đổi, mỗi kiểu trường hiển thị theo cách dễ đọc nhất (tên thay cho id). */
export function RevisionDiff({ changes, labels = {} }: { changes: RevisionChange[]; labels?: RevisionLabels }) {
  const name = (v: unknown) => (isEmpty(v) ? '(trống)' : labels[String(v)] ?? String(v));

  if (changes.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
        Không có khác biệt nào so với bản đang xuất bản.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {changes.length} trường thay đổi · <span className="rounded-sm bg-rose-100 px-1 text-rose-800 line-through">bị bỏ</span>{' '}
        <span className="rounded-sm bg-emerald-100 px-1 text-emerald-900">được thêm</span> — trường không đổi được ẩn.
      </p>
      {changes.map((c) => {
        let body: ReactNode;
        switch (c.kind) {
          case 'longtext':
            body = <TextDiff before={stripHtml(String(c.before ?? ''))} after={stripHtml(String(c.after ?? ''))} />;
            break;
          case 'list':
          case 'refs':
            body = <ChipsDiff before={c.before} after={c.after} name={c.kind === 'refs' ? name : (v) => String(v)} />;
            break;
          case 'ref':
            body = <Swap before={name(c.before)} after={name(c.after)} />;
            break;
          case 'bool':
            body = <Swap before={c.before ? 'Có' : 'Không'} after={c.after ? 'Có' : 'Không'} />;
            break;
          case 'image':
            body = (
              <div className="flex flex-wrap items-center gap-3">
                {isEmpty(c.before) ? <span className="text-xs text-slate-400">(chưa có ảnh)</span> : <Thumb src={String(c.before)} />}
                <span className="text-slate-400">→</span>
                {isEmpty(c.after) ? <span className="text-xs text-slate-400">(bỏ ảnh)</span> : <Thumb src={String(c.after)} />}
              </div>
            );
            break;
          case 'blocks':
            body = <BlocksDiff before={c.before} after={c.after} />;
            break;
          case 'relations':
            body = <RelationsDiff before={c.before} after={c.after} name={name} />;
            break;
          case 'media':
            body = <MediaDiff before={c.before} after={c.after} />;
            break;
          case 'object':
            body = <ObjectDiff before={c.before} after={c.after} labels={labels} />;
            break;
          default:
            body = <Swap before={isEmpty(c.before) ? '(trống)' : String(c.before)} after={isEmpty(c.after) ? '(trống)' : String(c.after)} />;
        }
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
