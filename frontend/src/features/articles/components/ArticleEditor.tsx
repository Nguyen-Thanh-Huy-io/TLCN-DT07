'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, FileText, LayoutList, Save, Send, Upload } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isReviewerRole, isSuperadminRole } from '@/services/auth/public-auth.service';
import { ArchiveStatusButton, ConfirmDialog } from '@/components/common/CommonUi';
import type { TagItem } from '@/types/models';
import { LessonTagPicker } from '@/features/lessons/components/LessonTagPicker';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';
import {
  ArticleApiService,
  CategoryApiService,
  type ArticleMetadata,
  type ArticlePayload,
  type CategoryItem,
  type ContentStatusValue,
} from '@/services/entities/article.service';
import { isRevisionPending, withPendingDraft, type ContentRevisionItem } from '@/services/entities/content-revision.service';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { ContentBlockEditor } from './ContentBlockEditor';
import { StatusPill, YearInput } from './ArticleList';
import { TopicPicker, type PickedTopic } from '@/features/topics/components/TopicEditor';
import { CategoryPicker } from './CategoryPicker';

export enum ArticleEditorTab {
  INFO = 'INFO',
  CONTENT = 'CONTENT',
}

const TABS_CONFIG = [
  [ArticleEditorTab.INFO, 'Thông tin', LayoutList],
  [ArticleEditorTab.CONTENT, 'Nội dung', FileText],
] as const;

const SHARED_TOPIC_MODULES = ['Bài viết', 'Bài học', 'Luyện tập'] as const;

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
  isFeatured: false,
  displayOrder: 0,
};

const blankToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400';
const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600';

export function ArticleEditor({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const user = useAuthSession();
  const isReviewer = Boolean(user && isReviewerRole(user.role));
  const isSuperadmin = Boolean(user && isSuperadminRole(user.role));
  const isEdit = Boolean(articleId);

  const [form, setForm] = useState<ArticlePayload>(EMPTY);
  const [topic, setTopic] = useState<PickedTopic | null>(null);
  const [status, setStatus] = useState<ContentStatusValue>(ContentStatus.DRAFT);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [tab, setTab] = useState<ArticleEditorTab>(ArticleEditorTab.INFO);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [metadata, setMetadata] = useState<ArticleMetadata>({});
  const [aliasesText, setAliasesText] = useState('');
  const [sourcesText, setSourcesText] = useState('');
  const [contentKey, setContentKey] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ArticlePayload>(key: K, value: ArticlePayload[K]) => {
    setIsDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    router.push(APP_ROUTES.ARTICLES.LIST);
  };

  useEffect(() => {
    CategoryApiService.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  const loadArticle = useCallback(async (id: string) => {
    try {
      const fetched = await ArticleApiService.get(id);
      const { detail, pending } = await withPendingDraft('ARTICLE', id, fetched);
      setPendingRevision(pending);
      setStatus(detail.status);
      setRejectionReason(fetched.rejectionReason ?? null);
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
        isFeatured: detail.isFeatured,
        displayOrder: detail.displayOrder,
      });
      setSelectedTags((fetched.tags ?? []).map((t) => ({ ...t, colorHex: t.colorHex ?? undefined })));
      const loadedMeta = detail.metadata ?? {};
      setMetadata(loadedMeta);
      setAliasesText((loadedMeta.aliases ?? []).join(', '));
      setSourcesText((loadedMeta.sources ?? []).join('\n'));
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
        if (active) void loadArticle(articleId);
      });
    }
    return () => { active = false; };
  }, [articleId, loadArticle, reloadKey]);

  const parsedAliases = useMemo(
    () =>
      aliasesText
        .split(/[,;\r\n]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    [aliasesText],
  );

  const parsedSources = useMemo(
    () =>
      sourcesText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [sourcesText],
  );

  const toPayload = (nextStatus?: ContentStatusValue): ArticlePayload => {
    const { isFeatured, ...restForm } = form;
    return {
      ...restForm,
      ...(isSuperadmin ? { isFeatured } : {}),
      title: form.title.trim(),
      slug: blankToNull(form.slug) ?? undefined,
      summary: blankToNull(form.summary),
      coverImageUrl: blankToNull(form.coverImageUrl),
      coverCaption: blankToNull(form.coverCaption),
      dateText: blankToNull(form.dateText),
      metadata: {
        ...metadata,
        aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
        sources: parsedSources.length > 0 ? parsedSources : undefined,
      },
      ...(nextStatus ? { status: nextStatus } : {}),
    };
  };

  const save = async (nextStatus?: ContentStatusValue) => {
    if (!form.title.trim()) {
      setError('Bài viết cần có tiêu đề.');
      setTab(ArticleEditorTab.INFO);
      requestAnimationFrame(() => titleInputRef.current?.focus());
      return;
    }
    const effectiveStatus = nextStatus ?? ContentStatus.DRAFT;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (!articleId) {
        const created = await ArticleApiService.create(toPayload(effectiveStatus));
        setIsDirty(false);
        router.replace(APP_ROUTES.ARTICLES.DETAIL(created.id));
        return;
      }
      const payload = status === ContentStatus.PUBLISHED && !nextStatus ? toPayload() : toPayload(effectiveStatus);
      const saved = await ArticleApiService.update(articleId, payload);
      setIsDirty(false);
      if (isRevisionPending(saved)) {
        setPendingRevision(saved.revision);
        setNotice(saved.message);
      } else {
        setStatus(saved.status);
        setSavedSlug(saved.slug);
        setNotice('Đã lưu bài viết.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Lưu bài viết thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const handleTagsChange = (nextTags: TagItem[]) => {
    setSelectedTags(nextTags);
    set('tagIds', nextTags.map((t) => t.id));
  };

  const categoryName = useMemo(() => categories.find((c) => c.id === form.categoryId)?.name, [categories, form.categoryId]);

  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải bài viết…</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft size={16} /> Bài viết
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-slate-900">
          {form.title || (isEdit ? 'Bài viết' : 'Bài viết mới')}
        </h1>
        {isEdit && <StatusPill status={status} />}
        {savedSlug && status === ContentStatus.PUBLISHED && (
          <a href={PUBLIC_ROUTES.ARTICLE(savedSlug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ExternalLink size={14} /> Xem công khai
          </a>
        )}
        {status !== ContentStatus.PUBLISHED && status !== ContentStatus.ARCHIVED && (
          <>
            <button type="button" disabled={saving} onClick={() => save(ContentStatus.DRAFT)} className="secondary-button !h-9 !text-sm">
              <Save size={15} /> Lưu nháp
            </button>
            {!isReviewer ? (
              <button type="button" disabled={saving} onClick={() => save(ContentStatus.PENDING_REVIEW)} className="primary-button !h-9 !text-sm">
                <Send size={15} /> Gửi duyệt
              </button>
            ) : (
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
          type="ARTICLE" contentId={articleId} status={status} pending={pendingRevision} notice={notice}
          onChanged={(message) => { setNotice(message); setReloadKey((k) => k + 1); }}
        />
      )}
      {isEdit && status === ContentStatus.REJECTED && rejectionReason && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900">
          <strong className="block font-bold">Lý do từ chối từ Người duyệt:</strong>
          <p className="mt-1 whitespace-pre-line">{rejectionReason}</p>
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && status !== ContentStatus.PUBLISHED && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>
      )}

      <div className="mb-4 flex gap-2">
        {TABS_CONFIG.map(([key, text, IconCmp]) => (
          <button
            key={key} type="button" onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <IconCmp size={15} /> {text}
          </button>
        ))}
      </div>

      {tab === ArticleEditorTab.INFO && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <label className={labelCls}>Tiêu đề *</label>
              <input
                ref={titleInputRef}
                className={inputCls}
                value={form.title}
                onChange={(e) => {
                  set('title', e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Trần Hưng Đạo"
              />
            </div>
            {isEdit && (
              <div>
                <label className={labelCls}>Đường dẫn (slug)</label>
                <input className={inputCls} value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} placeholder="Bỏ trống để tự sinh từ tiêu đề" />
              </div>
            )}
            <div>
              <label className={labelCls}>Tóm tắt</label>
              <textarea className={`${inputCls} min-h-[90px]`} value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value)} placeholder="1-3 câu, hiện ở thẻ danh sách và kết quả tìm kiếm" />
            </div>

            <fieldset className="rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-xs font-bold uppercase text-slate-600">Niên đại</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <YearInput label="Năm bắt đầu" value={form.startYear ?? null} onChange={(v) => set('startYear', v)} />
                <YearInput label="Năm kết thúc" value={form.endYear ?? null} onChange={(v) => set('endYear', v)} />
                <div>
                  <label className={labelCls}>Nhãn hiển thị</label>
                  <input className={inputCls} value={form.dateText ?? ''} onChange={(e) => set('dateText', e.target.value)} placeholder="Ví dụ: 1228? – 1300" />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Nhân vật: năm sinh – mất · Sự kiện: năm diễn ra · Di tích: năm xây dựng. Dùng để sắp xếp bài trong chuyên mục.
              </p>
            </fieldset>

            <div>
              <label className={labelCls}>Tên gọi khác / Miếu hiệu</label>
              <input
                className={inputCls}
                value={aliasesText}
                onChange={(e) => { setIsDirty(true); setAliasesText(e.target.value); }}
                placeholder="vd. Hưng Đạo Đại Vương, Trần Quốc Tuấn (phân cách bằng dấu phẩy)"
              />
            </div>

            <div>
              <label className={labelCls}>Nguồn tư liệu tham khảo</label>
              <textarea
                className={`${inputCls} min-h-[75px]`}
                value={sourcesText}
                onChange={(e) => { setIsDirty(true); setSourcesText(e.target.value); }}
                placeholder="Mỗi dòng 1 nguồn tham khảo (vd. Đại Việt sử ký toàn thư)"
              />
              <p className="mt-1 text-xs text-slate-500">Nhập mỗi nguồn trên 1 dòng.</p>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className={`${labelCls} !mb-0`}>Chuyên mục</label>
                    <p className="text-[11px] text-slate-500">Chọn chuyên mục phù hợp để phân loại bài viết.</p>
                  </div>
                  <Link href={APP_ROUTES.CATEGORIES} className="shrink-0 text-xs font-medium text-blue-700 hover:underline">Quản lý →</Link>
                </div>
                <CategoryPicker categories={categories} value={form.categoryId ?? null} onChange={(nextId) => set('categoryId', nextId)} />
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className={`${labelCls} !mb-0`}>Chủ đề</label>
                    <p className="text-[11px] text-slate-500">Phân loại kiến thức lịch sử · Liên kết bài viết, bài học, luyện tập</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {SHARED_TOPIC_MODULES.map((m) => (
                      <span key={m} className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/70">{m}</span>
                    ))}
                  </div>
                </div>
                <TopicPicker
                  value={topic}
                  onChange={(next) => { setTopic(next); set('topicId', next?.id ?? null); }}
                  placeholder="Chưa gắn Chủ đề (tùy chọn)"
                />
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className={`${labelCls} !mb-0`}>Thẻ tìm kiếm</label>
                    <p className="text-[11px] text-slate-500">Dùng cho các nội dung cắt ngang nhiều Chủ đề</p>
                  </div>
                  <Link href={APP_ROUTES.TAGS.LIST} className="shrink-0 text-xs font-medium text-blue-700 hover:underline">Quản lý</Link>
                </div>
                <LessonTagPicker selectedTags={selectedTags} onChange={handleTagsChange} disabled={saving} hideLabel />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <TopicCoverImagePicker value={form.coverImageUrl ?? ''} onChange={(url) => set('coverImageUrl', url)} disabled={saving} title="Ảnh bìa bài viết" compact />
              <div>
                <label className={labelCls}>Chú thích ảnh</label>
                <input className={inputCls} value={form.coverCaption ?? ''} onChange={(e) => set('coverCaption', e.target.value)} />
              </div>
              {isSuperadmin ? (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(e) => set('isFeatured', e.target.checked)} />
                  <span>Nổi bật (hiện ở trang chủ)</span>
                </label>
              ) : form.isFeatured ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  ★ Bài viết đang được Quản trị hệ thống ghim nổi bật trên Trang chủ.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {tab === ArticleEditorTab.CONTENT && (
        <ContentBlockEditor
          key={contentKey} value={form.contentBlocks} onChange={(blocks) => set('contentBlocks', blocks)}
          documentTitle={form.title || 'Bài viết mới'} documentSubtitle={topic?.name ?? categoryName ?? 'Chưa phân loại'}
          thumbnailUrl={form.coverImageUrl ?? ''} selectedTags={selectedTags}
          sourceReferenceNote={parsedSources.join('; ')} topicId={form.topicId ?? undefined}
          onOpenInfoTab={() => setTab(ArticleEditorTab.INFO)}
        />
      )}

      <ConfirmDialog
        isOpen={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        onConfirm={() => {
          setIsDirty(false);
          router.push(APP_ROUTES.ARTICLES.LIST);
        }}
        title="Rời khỏi trang biên tập?"
        message="Bạn có thay đổi chưa được lưu. Nếu rời đi ngay bây giờ, dữ liệu vừa nhập sẽ không được giữ lại."
        confirmLabel="Rời trang"
        cancelLabel="Ở lại tiếp tục soạn"
        tone="warning"
      />
    </div>
  );
}
