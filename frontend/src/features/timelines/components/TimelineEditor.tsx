'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Plus, Save, Send, Trash2, Upload } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import type { ContentStatusValue } from '@/services/entities/article.service';
import { TimelineApiService, type TimelineNodeItem } from '@/services/entities/timeline.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { StatusPill } from '@/features/articles/components/StatusPill';
import { YearInput } from '@/features/articles/components/YearInput';
import { ArticlePicker } from '@/features/articles/components/ArticlePicker';
import { TopicPicker, type PickedTopic } from '@/features/topics/components/TopicPicker';

/** Mốc trong form — `key` cục bộ để React giữ đúng ô khi đổi thứ tự. */
type NodeDraft = TimelineNodeItem & { key: string; articleTitle?: string | null };

/**
 * "Gắn với ..." dưới mốc: bài của mốc đang liên kết với những bài nào (vd. Trần Hưng Đạo · Chỉ huy,
 * Khu di tích Bạch Đằng · Diễn ra tại) — để biết mốc này sẽ hiện trong dòng đời của nhân vật nào.
 * Đọc từ dữ liệu ĐÃ LƯU; vừa đổi bài của mốc thì cần lưu để cập nhật.
 */
function NodeConnections({ node }: { node: NodeDraft }) {
  const article = node.article;
  if (!node.articleId) return null;
  if (!article || article.id !== node.articleId) {
    return <p className="mt-1 text-xs text-slate-400">Lưu dòng thời gian để xem bài này đang gắn với ai.</p>;
  }
  const connections = [
    ...(article.linksIn ?? []).map((l) => ({ label: l.label, other: l.source })),
    ...(article.linksOut ?? []).map((l) => ({ label: l.label, other: l.target })),
  ];
  if (connections.length === 0) {
    return <p className="mt-1 text-xs text-slate-400">Bài này chưa gắn với nhân vật / di tích nào.</p>;
  }
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-semibold text-slate-500">Gắn với:</span>
      {connections.map((c, i) => (
        <Link
          key={`${c.other.id}-${i}`}
          href={APP_ROUTES.ARTICLES.DETAIL(c.other.id)}
          className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800 hover:underline"
          title={c.other.category?.name ?? undefined}
        >
          {c.other.title}
          {c.label && <span className="text-sky-600"> · {c.label}</span>}
        </Link>
      ))}
    </div>
  );
}

let keySeq = 0;
const newKey = () => `n${++keySeq}`;

const emptyNode = (): NodeDraft => ({
  key: newKey(),
  articleId: null,
  title: '',
  description: null,
  imageUrl: null,
  dateText: null,
  year: null,
  month: null,
  day: null,
  endYear: null,
});

const blankToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export function TimelineEditor({ timelineId }: { timelineId?: string }) {
  const router = useRouter();
  const user = useAuthSession();
  const isReviewer = Boolean(user && isReviewerRole(user.role));

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState<PickedTopic | null>(null);
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [status, setStatus] = useState<ContentStatusValue>('DRAFT');
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NodeDraft[]>([]);
  const [loading, setLoading] = useState(Boolean(timelineId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const t = await TimelineApiService.get(id);
      setTitle(t.title);
      setTopic(t.topic ? { id: t.topic.id, name: t.topic.name, slug: t.topic.slug } : null);
      setSlug(t.slug);
      setSavedSlug(t.slug);
      setDescription(t.description ?? '');
      setCoverImageUrl(t.coverImageUrl ?? '');
      setDisplayOrder(t.displayOrder);
      setStatus(t.status);
      setNodes((t.nodes ?? []).map((n) => ({ ...n, key: newKey(), articleTitle: n.article?.title ?? null })));
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được dòng thời gian.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timelineId) {
      queueMicrotask(() => {
        void load(timelineId);
      });
    }
  }, [timelineId, load]);

  const updateNode = (key: string, patch: Partial<NodeDraft>) =>
    setNodes((list) => list.map((n) => (n.key === key ? { ...n, ...patch } : n)));

  const move = (index: number, delta: number) =>
    setNodes((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  /** Sắp mốc theo năm (mốc chưa có năm giữ cuối) — tiện khi nhập lộn xộn. */
  const sortByYear = () =>
    setNodes((list) =>
      [...list].sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity) || (a.month ?? 0) - (b.month ?? 0) || (a.day ?? 0) - (b.day ?? 0)),
    );

  const save = async (nextStatus?: ContentStatusValue) => {
    if (!title.trim()) return setError('Dòng thời gian cần có tiêu đề.');
    const invalid = nodes.findIndex((n) => !n.title.trim());
    if (invalid >= 0) return setError(`Mốc thứ ${invalid + 1} chưa có tiêu đề.`);

    setSaving(true);
    setError(null);
    setNotice(null);
    const payload = {
      title: title.trim(),
      topicId: topic?.id ?? null,
      slug: blankToNull(slug) ?? undefined,
      description: blankToNull(description),
      coverImageUrl: blankToNull(coverImageUrl),
      displayOrder: Number(displayOrder) || 0,
      ...(nextStatus ? { status: nextStatus } : {}),
      nodes: nodes.map((n) => ({
        articleId: n.articleId,
        title: n.title.trim(),
        description: blankToNull(n.description),
        imageUrl: blankToNull(n.imageUrl),
        dateText: blankToNull(n.dateText),
        year: n.year,
        month: n.month,
        day: n.day,
        endYear: n.endYear,
      })),
    };
    try {
      if (!timelineId) {
        const created = await TimelineApiService.create({ ...payload, status: nextStatus ?? ContentStatus.DRAFT });
        router.replace(APP_ROUTES.TIMELINES.DETAIL(created.id));
        return;
      }
      const saved = await TimelineApiService.update(timelineId, payload);
      setStatus(saved.status);
      setSavedSlug(saved.slug);
      setNotice('Đã lưu dòng thời gian.');
    } catch (err) {
      setError(extractErrorMessage(err, 'Lưu dòng thời gian thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải…</div>;

  const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400';
  const label = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600';
  const lockedForEditor = status === ContentStatus.PUBLISHED && !isReviewer;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <Link href={APP_ROUTES.TIMELINES.LIST} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Dòng thời gian
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-slate-900">{title || 'Dòng thời gian mới'}</h1>
        {timelineId && <StatusPill status={status} />}
        {savedSlug && status === ContentStatus.PUBLISHED && (
          <a href={PUBLIC_ROUTES.TIMELINE(savedSlug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-600">
            <ExternalLink size={14} /> Xem công khai
          </a>
        )}
        {!lockedForEditor && (
          <>
            <button type="button" disabled={saving} onClick={() => save(status === ContentStatus.PUBLISHED ? undefined : ContentStatus.DRAFT)} className="secondary-button !h-9 !text-sm">
              <Save size={15} /> {status === ContentStatus.PUBLISHED ? 'Lưu thay đổi' : 'Lưu nháp'}
            </button>
            {!isReviewer && status !== ContentStatus.PENDING_REVIEW && (
              <button type="button" disabled={saving} onClick={() => save(ContentStatus.PENDING_REVIEW)} className="primary-button !h-9 !text-sm">
                <Send size={15} /> Gửi duyệt
              </button>
            )}
            {isReviewer && status !== ContentStatus.PUBLISHED && (
              <button type="button" disabled={saving} onClick={() => save(ContentStatus.PUBLISHED)} className="primary-button !h-9 !text-sm">
                <Upload size={15} /> Xuất bản
              </button>
            )}
            {isReviewer && status === ContentStatus.PUBLISHED && (
              <button type="button" disabled={saving} onClick={() => save(ContentStatus.DRAFT)} className="secondary-button !h-9 !text-sm">
                Chuyển về nháp
              </button>
            )}
          </>
        )}
      </div>

      {lockedForEditor && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Dòng thời gian đã xuất bản — cần người duyệt chuyển về nháp trước khi biên tập viên sửa.
        </div>
      )}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      <fieldset disabled={lockedForEditor} className="space-y-6">
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Tiêu đề *</label>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhà Trần và ba lần kháng chiến chống Nguyên Mông" />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Chủ đề / Thời kỳ lịch sử (Topic)</label>
            <TopicPicker value={topic} onChange={setTopic} placeholder="Gắn dòng thời gian vào Chủ đề / Thời kỳ (vd. Thời Nhà Trần)..." />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Mô tả</label>
            <textarea className={`${input} min-h-[70px]`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Ảnh bìa (URL)</label>
            <input className={input} value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="flex-1 text-base font-bold text-slate-900">Các mốc ({nodes.length})</h2>
            {nodes.length > 1 && (
              <button type="button" onClick={sortByYear} className="secondary-button !h-8 !text-xs">
                Sắp theo năm
              </button>
            )}
            <button type="button" onClick={() => setNodes((l) => [...l, emptyNode()])} className="primary-button !h-8 !text-xs">
              <Plus size={14} /> Thêm mốc
            </button>
          </div>

          {nodes.length === 0 && <p className="text-sm text-slate-500">Chưa có mốc nào.</p>}
          <ol className="space-y-4">
            {nodes.map((n, i) => (
              <li key={n.key} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{i + 1}</span>
                  <input
                    className={`${input} flex-1 font-semibold`}
                    value={n.title}
                    onChange={(e) => updateNode(n.key, { title: e.target.value })}
                    placeholder="Tiêu đề mốc *"
                  />
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded border border-slate-200 p-1.5 disabled:opacity-30" title="Lên">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === nodes.length - 1} className="rounded border border-slate-200 p-1.5 disabled:opacity-30" title="Xuống">
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNodes((l) => l.filter((x) => x.key !== n.key))}
                    className="rounded border border-slate-200 p-1.5 text-red-600 hover:bg-red-50"
                    title="Xoá mốc"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <YearInput label="Năm" value={n.year} onChange={(v) => updateNode(n.key, { year: v })} />
                  <div>
                    <label className={label}>Tháng / ngày</label>
                    <div className="flex gap-2">
                      <input
                        className={input}
                        type="number"
                        min={1}
                        max={12}
                        placeholder="Th"
                        value={n.month ?? ''}
                        onChange={(e) => updateNode(n.key, { month: e.target.value ? Number(e.target.value) : null })}
                      />
                      <input
                        className={input}
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Ng"
                        value={n.day ?? ''}
                        onChange={(e) => updateNode(n.key, { day: e.target.value ? Number(e.target.value) : null })}
                      />
                    </div>
                  </div>
                  <YearInput label="Đến năm" value={n.endYear} onChange={(v) => updateNode(n.key, { endYear: v })} />
                  <div>
                    <label className={label}>Nhãn niên đại</label>
                    <input
                      className={input}
                      value={n.dateText ?? ''}
                      onChange={(e) => updateNode(n.key, { dateText: e.target.value })}
                      placeholder="trống = ghép từ số"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className={label}>Mô tả ngắn</label>
                    <textarea
                      className={`${input} min-h-[60px]`}
                      value={n.description ?? ''}
                      onChange={(e) => updateNode(n.key, { description: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Bài viết chi tiết</label>
                    <ArticlePicker
                      value={n.articleId ? { id: n.articleId, title: n.articleTitle ?? 'Bài viết đã liên kết' } : null}
                      onChange={(a) =>
                        updateNode(n.key, {
                          articleId: a?.id ?? null,
                          articleTitle: a?.title ?? null,
                          // Mốc mới chưa có tiêu đề → lấy tiêu đề bài viết.
                          ...(a && !n.title.trim() ? { title: a.title } : {}),
                        })
                      }
                    />
                    <NodeConnections node={n} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Ảnh (URL)</label>
                    <input className={input} value={n.imageUrl ?? ''} onChange={(e) => updateNode(n.key, { imageUrl: e.target.value })} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </fieldset>
    </div>
  );
}
