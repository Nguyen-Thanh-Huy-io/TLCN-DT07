'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, FileText, IdCard, LayoutList, Save, Send, Upload } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import { ArchiveStatusButton } from '@/components/common/ArchiveStatusButton';
import { TagApiService } from '@/services/entities/tag.service';
import { UploadApiService } from '@/services/entities/upload.service';
import type { TagItem } from '@/types/models';
import {
  ArticleApiService,
  CategoryApiService,
  type ArticleItem,
  type ArticleLinkView,
  type ArticleMetadata,
  type ArticlePayload,
  type CategoryItem,
  type ContentStatusValue,
  type DatePrecisionValue,
} from '@/services/entities/article.service';
import {
  isRevisionPending,
  withPendingDraft,
  type ContentRevisionItem,
} from '@/services/entities/content-revision.service';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { ContentBlockEditor } from './ContentBlockEditor';
import { StatusPill } from './StatusPill';
import { YearInput } from './YearInput';
import { TopicPicker, type PickedTopic } from '@/features/topics/components/TopicPicker';
import { ArticleProfilePanel, articleKindOf, type LinkDraft } from './ArticleProfilePanel';

const PRECISION_OPTIONS: Array<{ value: DatePrecisionValue; label: string }> = [
  { value: 'YEAR', label: 'Chính xác tới năm' },
  { value: 'MONTH', label: 'Tới tháng' },
  { value: 'DAY', label: 'Tới ngày' },
  { value: 'DECADE', label: 'Thập niên' },
  { value: 'CENTURY', label: 'Thế kỷ' },
  { value: 'APPROXIMATE', label: 'Ước đoán' },
  { value: 'UNKNOWN', label: 'Chưa rõ' },
];

export enum ArticleEditorTab {
  INFO = 'INFO',
  PROFILE = 'PROFILE',
  CONTENT = 'CONTENT',
}

const TABS_CONFIG = [
  [ArticleEditorTab.INFO, 'Thông tin', LayoutList],
  [ArticleEditorTab.PROFILE, 'Hồ sơ & liên kết', IdCard],
  [ArticleEditorTab.CONTENT, 'Nội dung', FileText],
] as const;

/** Tên chủ đề để hiện trong ô chọn; bản sửa chờ duyệt có thể đổi topicId mà chưa kèm tên. */
function pickedTopicOf(
  topicId: string | null | undefined,
  candidates: Array<{ id: string; name: string; slug: string } | null | undefined>,
): PickedTopic | null {
  if (!topicId) return null;
  return candidates.find((t) => t?.id === topicId) ?? { id: topicId, name: 'Chủ đề trong bản sửa chờ duyệt' };
}

const EMPTY: ArticlePayload = {
  title: '',
  slug: '',
  categoryId: null,
  topicId: null,
  tagIds: [],
  summary: '',
  coverImageUrl: '',
  coverCaption: '',
  contentBlocks: [],
  dateText: '',
  startYear: null,
  endYear: null,
  datePrecision: null,
  isFeatured: false,
  displayOrder: 0,
};

/** Chuỗi rỗng → null để backend không lưu "" cho cột tùy chọn. */
const blankToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export function ArticleEditor({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const user = useAuthSession();
  const isReviewer = Boolean(user && isReviewerRole(user.role));
  const isEdit = Boolean(articleId);

  const [form, setForm] = useState<ArticlePayload>(EMPTY);
  const [topic, setTopic] = useState<PickedTopic | null>(null);
  const [status, setStatus] = useState<ContentStatusValue>(ContentStatus.DRAFT);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [tab, setTab] = useState<ArticleEditorTab>(ArticleEditorTab.INFO);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Hồ sơ mô tả (metadata) + liên kết bài ↔ bài — tab "Hồ sơ & liên kết".
  const [metadata, setMetadata] = useState<ArticleMetadata>({});
  const [links, setLinks] = useState<LinkDraft[]>([]);
  const [linksIn, setLinksIn] = useState<ArticleLinkView[]>([]);
  /** Bản đã lưu — cho các khung xem trước dòng đời / nhân vật gắn bài / dòng thời gian chứa bài. */
  const [savedArticle, setSavedArticle] = useState<ArticleItem | null>(null);
  // Block editor chỉ nhận giá trị ban đầu — đổi key để nạp lại khi tải bài / khôi phục phiên bản.
  const [contentKey, setContentKey] = useState(0);

  const set = <K extends keyof ArticlePayload>(key: K, value: ArticlePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    CategoryApiService.list().then(setCategories).catch(() => setCategories([]));
    TagApiService.getTags().then(setTags).catch(() => setTags([]));
  }, []);

  const loadArticle = useCallback(async (id: string) => {
    try {
      const fetched = await ArticleApiService.get(id);
      const { detail, pending } = await withPendingDraft('ARTICLE', id, fetched);
      setPendingRevision(pending);
      setStatus(detail.status);
      setSavedSlug(fetched.slug);
      setTopic(pickedTopicOf(detail.topicId, [detail.topic, fetched.topic]));
      setForm({
        title: detail.title,
        slug: detail.slug,
        categoryId: detail.categoryId,
        topicId: detail.topicId ?? null,
        tagIds: detail.tagIds ?? detail.tags.map((t) => t.id),
        summary: detail.summary ?? '',
        coverImageUrl: detail.coverImageUrl ?? '',
        coverCaption: detail.coverCaption ?? '',
        contentBlocks: detail.contentBlocks ?? [],
        dateText: detail.dateText ?? '',
        startYear: detail.startYear,
        endYear: detail.endYear,
        datePrecision: detail.datePrecision,
        isFeatured: detail.isFeatured,
        displayOrder: detail.displayOrder,
      });
      setMetadata(detail.metadata ?? {});
      // Bản sửa chờ duyệt chỉ có {targetId,label,note} → lấy tiêu đề / loại bài từ linksOut của bản đang lưu.
      const known = new Map((fetched.linksOut ?? []).map((l) => [l.article.id, l.article]));
      setLinks(
        (detail.links ?? []).map((l) => {
          const ref = known.get(l.targetId);
          return { ...l, targetTitle: ref?.title, targetCategoryId: ref?.category?.id };
        }),
      );
      setLinksIn(fetched.linksIn ?? []);
      setSavedArticle(fetched);
      setContentKey((k) => k + 1);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được bài viết.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (articleId) {
      void Promise.resolve().then(() => {
        if (active) {
          void loadArticle(articleId);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [articleId, loadArticle, reloadKey]);

  const isBlogCategorySelected = useMemo(() => {
    const selected = categories.find((category) => category.id === form.categoryId);
    if (!selected) return false;

    const haystack = `${selected.name ?? ''} ${selected.slug ?? ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return ['blog', 'bai-viet', 'bài viết', 'bai viet'].some((token) => haystack.includes(token));
  }, [categories, form.categoryId]);

  const toPayload = (nextStatus?: ContentStatusValue): ArticlePayload => ({
    ...form,
    title: form.title.trim(),
    slug: blankToNull(form.slug) ?? undefined,
    summary: blankToNull(form.summary),
    coverImageUrl: blankToNull(form.coverImageUrl),
    coverCaption: blankToNull(form.coverCaption),
    dateText: blankToNull(form.dateText),
    metadata,
    links: links
      .filter((l) => l.targetId)
      .map((l) => ({ targetId: l.targetId, label: blankToNull(l.label), note: blankToNull(l.note) })),
    ...(nextStatus ? { status: nextStatus } : {}),
  });

  const save = async (nextStatus?: ContentStatusValue) => {
    if (!form.title.trim()) {
      setError('Bài viết cần có tiêu đề.');
      setTab(ArticleEditorTab.INFO);
      return;
    }
    const effectiveStatus =
      nextStatus === ContentStatus.DRAFT && isBlogCategorySelected
        ? ContentStatus.PENDING_REVIEW
        : nextStatus ?? (isBlogCategorySelected ? ContentStatus.PENDING_REVIEW : ContentStatus.DRAFT);
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (!articleId) {
        const created = await ArticleApiService.create(toPayload(effectiveStatus));
        router.replace(APP_ROUTES.ARTICLES.DETAIL(created.id));
        return;
      }
      // Bài đang xuất bản: không gửi status (biên tập viên → bản sửa chờ duyệt; người duyệt → sửa thẳng).
      const payload = status === ContentStatus.PUBLISHED && !nextStatus ? toPayload() : toPayload(effectiveStatus);
      const saved = await ArticleApiService.update(articleId, payload);
      if (isRevisionPending(saved)) {
        setPendingRevision(saved.revision);
        setNotice(saved.message);
      } else {
        setStatus(saved.status);
        setSavedSlug(saved.slug);
        // Cập nhật bản đã lưu → khung xem trước dòng đời / nhân vật gắn bài phản ánh ngay.
        setSavedArticle(saved);
        setLinksIn(saved.linksIn ?? []);
        setNotice('Đã lưu bài viết.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Lưu bài viết thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (id: string) =>
    set('tagIds', form.tagIds?.includes(id) ? form.tagIds.filter((t) => t !== id) : [...(form.tagIds ?? []), id]);

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setCoverUploading(true);
      setError(null);
      const result = await UploadApiService.uploadImage(file);
      if (result?.url) {
        set('coverImageUrl', result.url);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải ảnh lên.'));
    } finally {
      setCoverUploading(false);
      event.target.value = '';
    }
  };

  const categoryName = useMemo(
    () => categories.find((c) => c.id === form.categoryId)?.name,
    [categories, form.categoryId],
  );

  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải bài viết…</div>;

  const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400';
  const label = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600';

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4">
      {/* THANH ĐIỀU KHIỂN */}
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <Link href={APP_ROUTES.ARTICLES.LIST} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Bài viết
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-slate-900">
          {form.title || (isEdit ? 'Bài viết' : 'Bài viết mới')}
        </h1>
        {isEdit && <StatusPill status={status} />}
        {savedSlug && status === ContentStatus.PUBLISHED && (
          <a
            href={PUBLIC_ROUTES.ARTICLE(savedSlug)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ExternalLink size={14} /> Xem công khai
          </a>
        )}
        {status !== ContentStatus.PUBLISHED && status !== ContentStatus.ARCHIVED && (
          <>
            <button type="button" disabled={saving} onClick={() => save(ContentStatus.DRAFT)} className="secondary-button !h-9 !text-sm">
              <Save size={15} /> Lưu nháp
            </button>
            {!isReviewer && (
              <button type="button" disabled={saving} onClick={() => save(ContentStatus.PENDING_REVIEW)} className="primary-button !h-9 !text-sm">
                <Send size={15} /> Gửi duyệt
              </button>
            )}
            {isReviewer && (
              <button type="button" disabled={saving} onClick={() => save(ContentStatus.PUBLISHED)} className="primary-button !h-9 !text-sm">
                <Upload size={15} /> Xuất bản
              </button>
            )}
          </>
        )}
        {status === ContentStatus.PUBLISHED && (
          <>
            <button type="button" disabled={saving} onClick={() => save()} className="primary-button !h-9 !text-sm">
              <Save size={15} /> {isReviewer ? 'Lưu thay đổi' : 'Gửi bản sửa'}
            </button>
            {isReviewer && (
              <button type="button" disabled={saving} onClick={() => save(ContentStatus.DRAFT)} className="secondary-button !h-9 !text-sm">
                Chuyển về nháp
              </button>
            )}
          </>
        )}
        {isEdit && <ArchiveStatusButton status={status} isReviewer={isReviewer} disabled={saving} onChangeStatus={save} />}
      </div>

      {isEdit && (
        <EditorRevisionBanner
          type="ARTICLE"
          contentId={articleId}
          status={status}
          pending={pendingRevision}
          notice={notice}
          onChanged={(message) => {
            setNotice(message);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && status !== ContentStatus.PUBLISHED && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>
      )}

      {/* TAB */}
      <div className="mb-4 flex gap-2">
        {TABS_CONFIG.map(([key, text, IconCmp]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${
              tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <IconCmp size={15} /> {text}
          </button>
        ))}
      </div>

      {tab === ArticleEditorTab.INFO && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <label className={label}>Tiêu đề *</label>
              <input className={input} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Trần Hưng Đạo" />
            </div>
            {isEdit && (
              <div>
                <label className={label}>Đường dẫn (slug)</label>
                <input
                  className={input}
                  value={form.slug ?? ''}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="Bỏ trống để tự sinh từ tiêu đề"
                />
              </div>
            )}
            <div>
              <label className={label}>Tóm tắt</label>
              <textarea
                className={`${input} min-h-[90px]`}
                value={form.summary ?? ''}
                onChange={(e) => set('summary', e.target.value)}
                placeholder="1-3 câu, hiện ở thẻ danh sách và kết quả tìm kiếm"
              />
            </div>

            <fieldset className="rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-xs font-bold uppercase text-slate-600">Niên đại</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <YearInput label="Năm bắt đầu" value={form.startYear ?? null} onChange={(v) => set('startYear', v)} />
                <YearInput label="Năm kết thúc" value={form.endYear ?? null} onChange={(v) => set('endYear', v)} />
                <div>
                  <label className={label}>Nhãn hiển thị</label>
                  <input
                    className={input}
                    value={form.dateText ?? ''}
                    onChange={(e) => set('dateText', e.target.value)}
                    placeholder="vd. 1228? – 1300 (trống = ghép từ năm)"
                  />
                </div>
                <div>
                  <label className={label}>Độ chính xác</label>
                  <select
                    className={input}
                    value={form.datePrecision ?? ''}
                    onChange={(e) => set('datePrecision', (e.target.value || null) as DatePrecisionValue | null)}
                  >
                    <option value="">—</option>
                    {PRECISION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Nhân vật: năm sinh – mất · Sự kiện: năm diễn ra · Di tích: năm xây dựng. Dùng để sắp xếp bài trong chuyên mục.
              </p>
            </fieldset>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <label className={label}>Chuyên mục</label>
              <select className={input} value={form.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}>
                <option value="">— Chưa phân loại —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? '— ' : ''}
                    {c.name}
                  </option>
                ))}
              </select>
              <Link href={APP_ROUTES.CATEGORIES} className="mt-1 inline-block text-xs text-slate-500 hover:underline">
                Quản lý chuyên mục
              </Link>

              <label className={`${label} mt-4`}>Chủ đề</label>
              <TopicPicker
                value={topic}
                onChange={(next) => {
                  setTopic(next);
                  set('topicId', next?.id ?? null);
                }}
                placeholder="Bài thuộc phần nào của môn sử (vd. Triều đại nhà Trần)..."
              />

              <label className={`${label} mt-4`}>Tag</label>
              <div className="flex flex-wrap gap-1.5">
                {tags.length === 0 && <span className="text-xs text-slate-500">Chưa có tag nào.</span>}
                {tags.map((t) => {
                  const on = form.tagIds?.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
              <Link href={APP_ROUTES.TAGS.LIST} className="mt-1 inline-block text-xs text-slate-500 hover:underline">
                Quản lý tag
              </Link>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <label className={label}>Ảnh bìa</label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300">
                  <Upload size={14} />
                  {coverUploading ? 'Đang tải...' : 'Tải ảnh'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} disabled={coverUploading} />
                </label>
              </div>

              <div>
                <label className={`${label} mt-0`}>URL ảnh bìa</label>
                <input className={input} value={form.coverImageUrl ?? ''} onChange={(e) => set('coverImageUrl', e.target.value)} />
              </div>

              {form.coverImageUrl && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImageUrl} alt="Preview ảnh bìa" className="max-h-52 w-full object-cover" />
                </div>
              )}

              <div>
                <label className={label}>Chú thích ảnh</label>
                <input className={input} value={form.coverCaption ?? ''} onChange={(e) => set('coverCaption', e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(e) => set('isFeatured', e.target.checked)} />
                Nổi bật (hiện ở trang chủ)
              </label>
            </div>
          </div>
        </div>
      )}

      {tab === ArticleEditorTab.PROFILE && (
        <ArticleProfilePanel
          kind={articleKindOf(categories, form.categoryId)}
          metadata={metadata}
          onMetadataChange={setMetadata}
          links={links}
          onLinksChange={setLinks}
          linksIn={linksIn}
          kindOfArticle={(categoryId) => articleKindOf(categories, categoryId)}
          savedArticle={savedArticle}
          categories={categories}
          linksDirty={
            JSON.stringify(links.filter((l) => l.targetId).map((l) => [l.targetId, l.label ?? null])) !==
            JSON.stringify((savedArticle?.links ?? []).map((l) => [l.targetId, l.label ?? null]))
          }
        />
      )}

      {tab === ArticleEditorTab.CONTENT && (
        <ContentBlockEditor
          key={contentKey}
          value={form.contentBlocks}
          onChange={(blocks) => set('contentBlocks', blocks)}
          documentTitle={form.title || 'Bài viết mới'}
          documentSubtitle={categoryName ?? 'Chưa phân loại'}
          entityCategory={(categoryName ?? 'Bài viết').toUpperCase()}
        />
      )}
    </div>
  );
}

