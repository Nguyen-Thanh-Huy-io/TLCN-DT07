'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import {
  ArticleKindEnum,
  KeyboardKey,
} from '@/constants/enums';
import { PRESERVATION_LABELS } from '@/features/heritage/heritage.adapter';
import { APP_ROUTES } from '@/constants/routes';
import type {
  ArticleItem,
  ArticleLinkInput,
  ArticleLinkView,
  ArticleMetadata,
  CategoryItem,
} from '@/services/entities/article.service';
import { YearInput } from './YearInput';
import { EventPeoplePanel, InTimelinesPanel, PersonLifePreview } from './ArticleConnections';
import { ArticlePicker } from './ArticlePicker';
import { resolveCategoryKind, type ArticleKind } from '@/services/public/article-kind';

export type { ArticleKind };

/** Loại bài = Category.kind của chuyên mục (kế thừa cha) — quyết định nhánh hồ sơ hiện trong form. */
export function articleKindOf(categories: CategoryItem[], categoryId: string | null | undefined): ArticleKind {
  return resolveCategoryKind(categories, categoryId);
}

const DEFAULT_LOCATION_TYPE_LABELS: Record<string, string> = {
  ANCIENT_CAPITAL: 'Cố đô',
  CITADEL: 'Thành lũy',
  PALACE: 'Cung điện',
  BATTLEFIELD: 'Chiến trường',
  RESISTANCE_BASE: 'Căn cứ kháng chiến',
  TEMPLE: 'Đền miếu',
  ARCHAEOLOGICAL_SITE: 'Di chỉ khảo cổ',
  MONUMENT: 'Di tích lịch sử',
  OTHER: 'Khác',
};

/** Gợi ý nhãn liên kết theo loại bài nguồn → loại bài đích (chỉ là gợi ý, gõ tự do được). */
const LABEL_SUGGESTIONS: Record<string, string[]> = {
  'PERSON>PERSON': ['Phụng sự', 'Cha', 'Mẹ', 'Con', 'Vợ / chồng', 'Anh chị em', 'Kế vị', 'Đồng minh', 'Đối thủ', 'Cùng thời'],
  'PERSON>EVENT': ['Chỉ huy', 'Lãnh đạo', 'Tham gia', 'Khởi xướng', 'Ký kết'],
  'PERSON>LOCATION': ['Quê hương', 'Được thờ tại', 'Nơi an nghỉ'],
  'PERSON>DYNASTY': ['Thuộc triều đại', 'Sáng lập'],
  'EVENT>LOCATION': ['Diễn ra tại'],
  'EVENT>EVENT': ['Một phần của', 'Dẫn tới', 'Tiếp nối'],
  'EVENT>PERSON': ['Chỉ huy', 'Tham gia'],
  'LOCATION>PERSON': ['Thờ', 'Tưởng niệm'],
  'LOCATION>EVENT': ['Tưởng niệm'],
  'LOCATION>DYNASTY': ['Xây dựng thời'],
};
const DEFAULT_SUGGESTIONS = ['Liên quan'];

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400';
const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600';

/** Ô nhập danh sách chữ (tên gọi khác, tác phẩm, giai thoại...): Enter để thêm. */
function ListField({
  label,
  values,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  values: string[] | undefined;
  onChange: (v: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const list = values ?? [];
  const add = () => {
    const v = draft.trim();
    if (v && !list.includes(v)) onChange([...list, v]);
    setDraft('');
  };
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {list.length > 0 && (
        <ul className="mb-2 space-y-1">
          {list.map((v) => (
            <li key={v} className="flex items-start gap-2 rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-700">
              <span className="flex-1 whitespace-pre-wrap">{v}</span>
              <button type="button" onClick={() => onChange(list.filter((x) => x !== v))} className="text-slate-400 hover:text-red-600">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        {multiline ? (
          <textarea className={`${input} min-h-[60px]`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        ) : (
          <input
            className={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === KeyboardKey.ENTER) {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
          />
        )}
        <button type="button" onClick={add} className="shrink-0 rounded-lg border border-slate-200 px-3 text-sm hover:bg-slate-50">
          Thêm
        </button>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Liên kết trong form — kèm tiêu đề bài đích để hiển thị (không gửi lên API). */
export type LinkDraft = ArticleLinkInput & { targetTitle?: string; targetCategoryId?: string | null };

/**
 * Tab "Hồ sơ & liên kết" của trình soạn bài viết. Mọi trường TÙY CHỌN.
 *  - metadata: phần chung + nhánh theo loại bài (person / site / event) → Article.metadata (JSONB).
 *  - links: liên kết bài này → bài khác (bảng article_links), nhãn chữ tự do.
 */
export function ArticleProfilePanel({
  kind,
  metadata,
  onMetadataChange,
  links,
  onLinksChange,
  linksIn,
  kindOfArticle,
  savedArticle,
  categories,
  linksDirty,
}: {
  kind: ArticleKind;
  metadata: ArticleMetadata;
  onMetadataChange: (m: ArticleMetadata) => void;
  links: LinkDraft[];
  onLinksChange: (l: LinkDraft[]) => void;
  /** Liên kết bài KHÁC trỏ tới bài này (chỉ xem; sửa ở bài kia). */
  linksIn: ArticleLinkView[];
  kindOfArticle: (categoryId: string | null | undefined) => ArticleKind;
  /** Bản đã lưu (null khi tạo mới) — dùng cho các khung xem trước / nhận biết liên kết. */
  savedArticle: ArticleItem | null;
  categories: CategoryItem[];
  /** Liên kết trong form khác bản đã lưu (xem trước chưa phản ánh). */
  linksDirty: boolean;
}) {
  const m = metadata;
  const setTop = <K extends keyof ArticleMetadata>(key: K, value: ArticleMetadata[K]) => onMetadataChange({ ...m, [key]: value });
  const setPerson = (patch: Partial<NonNullable<ArticleMetadata['person']>>) => setTop('person', { ...m.person, ...patch });
  const setSite = (patch: Partial<NonNullable<ArticleMetadata['site']>>) => setTop('site', { ...m.site, ...patch });
  const setEvent = (patch: Partial<NonNullable<ArticleMetadata['event']>>) => setTop('event', { ...m.event, ...patch });

  const p = m.person ?? {};
  const s = m.site ?? {};
  const e = m.event ?? {};

  const updateLink = (i: number, patch: Partial<LinkDraft>) => onLinksChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const moveLink = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    onLinksChange(next);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Section title="Thông tin chung" hint="Áp dụng cho mọi loại bài. Tên gọi khác được dùng khi tìm kiếm.">
          <ListField label="Tên gọi khác / tên cổ" values={m.aliases} onChange={(v) => setTop('aliases', v)} placeholder="vd. Trần Quốc Tuấn" />
          <ListField label="Tư liệu tham khảo" values={m.sources} onChange={(v) => setTop('sources', v)} placeholder="vd. Đại Việt sử ký toàn thư" />
        </Section>

        {kind === ArticleKindEnum.PERSON && (
          <Section title="Hồ sơ nhân vật" hint="Hiện ở thẻ nhân vật và tab Tiểu sử & di sản (/nhan-vat).">
            <ListField
              label="Vai trò"
              values={p.roles}
              onChange={(v) => setPerson({ roles: v })}
              placeholder="vd. Quân chủ, Tướng lĩnh, Học giả"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Nghề nghiệp / chức vụ</label>
                <input className={input} value={p.occupation ?? ''} onChange={(ev) => setPerson({ occupation: ev.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Quê hương</label>
                <input className={input} value={p.hometown ?? ''} onChange={(ev) => setPerson({ hometown: ev.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Ngày sinh (ghi chú)</label>
                <input className={input} value={p.birthDateLabel ?? ''} onChange={(ev) => setPerson({ birthDateLabel: ev.target.value })} placeholder="vd. Chưa rõ (khoảng 1228)" />
              </div>
              <div>
                <label className={labelCls}>Ngày mất (ghi chú)</label>
                <input className={input} value={p.deathDateLabel ?? ''} onChange={(ev) => setPerson({ deathDateLabel: ev.target.value })} />
              </div>
            </div>
            <ListField label="Danh hiệu" values={p.titles} onChange={(v) => setPerson({ titles: v })} placeholder="vd. Quốc công Tiết chế" />
            <div>
              <label className={labelCls}>Xuất thân & thiếu thời</label>
              <textarea className={`${input} min-h-[70px]`} value={p.backgroundAndYouth ?? ''} onChange={(ev) => setPerson({ backgroundAndYouth: ev.target.value })} />
            </div>
            <ListField label="Tác phẩm & chiếu chỉ" values={p.notableWorks} onChange={(v) => setPerson({ notableWorks: v })} />
            <div>
              <label className={labelCls}>Di sản & tôn vinh</label>
              <textarea className={`${input} min-h-[70px]`} value={p.legacyAndHonors ?? ''} onChange={(ev) => setPerson({ legacyAndHonors: ev.target.value })} />
            </div>
            <ListField label="Giai thoại" values={p.anecdotes} onChange={(v) => setPerson({ anecdotes: v })} multiline />
            <div>
              <label className={labelCls}>Câu nói nổi tiếng</label>
              <input className={input} value={p.famousQuote ?? ''} onChange={(ev) => setPerson({ famousQuote: ev.target.value })} />
            </div>
          </Section>
        )}

        {kind === ArticleKindEnum.PERSON && (
          <Section
            title={`Mốc đời riêng (${p.milestones?.length ?? 0})`}
            hint="Việc nhỏ chỉ thuộc về nhân vật này (đi sứ, bị bãi chức...). Sự kiện lớn nhiều người tham gia → tạo bài sự kiện rồi liên kết."
          >
            <ol className="space-y-3">
              {(p.milestones ?? []).map((ms, i) => {
                const update = (patch: Partial<typeof ms>) =>
                  setPerson({ milestones: p.milestones!.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });
                return (
                  <li key={i} className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                      <YearInput label="Năm" value={ms.year ?? null} onChange={(v) => update({ year: v ?? undefined })} />
                      <div>
                        <label className={labelCls}>Tháng</label>
                        <input className={`${input} w-20`} type="number" min={1} max={12} value={ms.month ?? ''} onChange={(ev) => update({ month: ev.target.value ? Number(ev.target.value) : undefined })} />
                      </div>
                      <div>
                        <label className={labelCls}>Ngày</label>
                        <input className={`${input} w-20`} type="number" min={1} max={31} value={ms.day ?? ''} onChange={(ev) => update({ day: ev.target.value ? Number(ev.target.value) : undefined })} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPerson({ milestones: p.milestones!.filter((_, idx) => idx !== i) })}
                        className="self-end rounded border border-slate-200 p-2 text-red-600 hover:bg-red-50"
                        title="Xoá mốc"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input className={input} value={ms.title} onChange={(ev) => update({ title: ev.target.value })} placeholder="Tiêu đề mốc *" />
                    <input className={input} value={ms.note ?? ''} onChange={(ev) => update({ note: ev.target.value })} placeholder="Ghi chú (tuỳ chọn)" />
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={() => setPerson({ milestones: [...(p.milestones ?? []), { title: '' }] })}
              className="secondary-button !h-8 !text-xs"
            >
              <Plus size={14} /> Thêm mốc đời riêng
            </button>
          </Section>
        )}

        {kind === ArticleKindEnum.OTHER && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            Bài chưa có loại (Nhân vật / Sự kiện / Di tích...) nên chưa có hồ sơ riêng. Chọn chuyên mục ở tab{' '}
            <strong>Thông tin</strong> — loại bài lấy theo chuyên mục (cài ở trang Chuyên mục).
          </p>
        )}

        {kind === ArticleKindEnum.LOCATION && (
          <Section title="Hồ sơ di tích" hint="Hiện ở thẻ /di-tich và ô hồ sơ ở trang đọc.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Loại di tích</label>
                <select className={input} value={s.siteType ?? ''} onChange={(ev) => setSite({ siteType: ev.target.value || undefined })}>
                  <option value="">—</option>
                  {Object.entries(DEFAULT_LOCATION_TYPE_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Năm công nhận</label>
                <input className={input} value={s.recognizedYear ?? ''} onChange={(ev) => setSite({ recognizedYear: ev.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Hiện trạng</label>
                <select className={input} value={s.preservation ?? ''} onChange={(ev) => setSite({ preservation: ev.target.value || undefined })}>
                  <option value="">—</option>
                  {Object.entries(PRESERVATION_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Địa chỉ</label>
                <input className={input} value={s.address ?? ''} onChange={(ev) => setSite({ address: ev.target.value })} placeholder="… , Tỉnh / Thành phố (phần cuối dùng làm địa phương)" />
              </div>
              <div>
                <label className={labelCls}>Vĩ độ</label>
                <input className={input} type="number" step="any" value={s.latitude ?? ''} onChange={(ev) => setSite({ latitude: ev.target.value === '' ? undefined : Number(ev.target.value) })} />
              </div>
              <div>
                <label className={labelCls}>Kinh độ</label>
                <input className={input} type="number" step="any" value={s.longitude ?? ''} onChange={(ev) => setSite({ longitude: ev.target.value === '' ? undefined : Number(ev.target.value) })} />
              </div>
              <div>
                <label className={labelCls}>Cơ quan quản lý</label>
                <input className={input} value={s.managingAgency ?? ''} onChange={(ev) => setSite({ managingAgency: ev.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Giờ mở cửa</label>
                <input className={input} value={s.openingHours ?? ''} onChange={(ev) => setSite({ openingHours: ev.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Phong cách kiến trúc</label>
                <input className={input} value={s.architecturalStyle ?? ''} onChange={(ev) => setSite({ architecturalStyle: ev.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Ghi chú hiện trạng</label>
                <textarea className={`${input} min-h-[60px]`} value={s.statusNote ?? ''} onChange={(ev) => setSite({ statusNote: ev.target.value })} />
              </div>
            </div>
          </Section>
        )}

        {kind === ArticleKindEnum.EVENT && (
          <Section title="Hồ sơ sự kiện" hint="Hiện ở trang đọc sự kiện. Nơi diễn ra, người tham gia: thêm bằng Liên kết bên phải.">
            <div>
              <label className={labelCls}>Ghi chú niên đại</label>
              <input className={input} value={e.dateNote ?? ''} onChange={(ev) => setEvent({ dateNote: ev.target.value })} placeholder="vd. Đợt 1: 30/01 – 25/02/1968" />
            </div>
            <ListField label="Các bên tham chiến / tham gia" values={e.belligerents} onChange={(v) => setEvent({ belligerents: v })} />
            <div>
              <label className={labelCls}>Nguyên nhân</label>
              <textarea className={`${input} min-h-[70px]`} value={e.cause ?? ''} onChange={(ev) => setEvent({ cause: ev.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Kết quả</label>
              <textarea className={`${input} min-h-[70px]`} value={e.outcome ?? ''} onChange={(ev) => setEvent({ outcome: ev.target.value })} />
            </div>
          </Section>
        )}
      </div>

      <div className="space-y-6">
        {savedArticle && kind === ArticleKindEnum.PERSON && (
          <PersonLifePreview
            article={savedArticle}
            categories={categories}
            milestones={(p.milestones ?? []).filter((ms): ms is typeof ms & { year: number } => Boolean(ms.year && ms.title?.trim()))}
            linksDirty={linksDirty}
          />
        )}
        {savedArticle && kind === ArticleKindEnum.EVENT && <EventPeoplePanel article={savedArticle} categories={categories} />}
        {!savedArticle && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            Lưu bài lần đầu để xem trước dòng đời / nhân vật gắn với bài / dòng thời gian chứa bài.
          </p>
        )}

        <Section
          title={`Liên kết tới bài khác (${links.length})`}
          hint="Nhân vật → nhân vật: tab Mối quan hệ · Nhân vật → sự kiện: dòng đời & người tham gia · Sự kiện → di tích: nơi diễn ra. Hiện ở cả 2 bài."
        >
          {links.length === 0 && <p className="text-sm text-slate-500">Chưa có liên kết.</p>}
          <ol className="space-y-3">
            {links.map((l, i) => {
              const suggestions = LABEL_SUGGESTIONS[`${kind}>${kindOfArticle(l.targetCategoryId)}`] ?? DEFAULT_SUGGESTIONS;
              const listId = `link-label-${i}`;
              return (
                <li key={`${l.targetId}-${i}`} className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <ArticlePicker
                        value={l.targetId ? { id: l.targetId, title: l.targetTitle ?? 'Bài viết đã chọn' } : null}
                        onChange={(a) =>
                          updateLink(i, {
                            targetId: a?.id ?? '',
                            targetTitle: a?.title,
                            targetCategoryId: a ? (a.categoryId ?? a.category?.id ?? null) : null,
                          })
                        }
                      />
                    </div>
                    <button type="button" onClick={() => moveLink(i, -1)} disabled={i === 0} className="rounded border border-slate-200 p-1.5 disabled:opacity-30" title="Lên">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" onClick={() => moveLink(i, 1)} disabled={i === links.length - 1} className="rounded border border-slate-200 p-1.5 disabled:opacity-30" title="Xuống">
                      <ArrowDown size={14} />
                    </button>
                    <button type="button" onClick={() => onLinksChange(links.filter((_, idx) => idx !== i))} className="rounded border border-slate-200 p-1.5 text-red-600 hover:bg-red-50" title="Xoá">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <input className={input} list={listId} value={l.label ?? ''} onChange={(ev) => updateLink(i, { label: ev.target.value })} placeholder="Nhãn (tuỳ chọn), vd. Chỉ huy" />
                      <datalist id={listId}>
                        {suggestions.map((sg) => (
                          <option key={sg} value={sg} />
                        ))}
                      </datalist>
                    </div>
                    <input className={input} value={l.note ?? ''} onChange={(ev) => updateLink(i, { note: ev.target.value })} placeholder="Ghi chú (tuỳ chọn)" />
                  </div>
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={() => onLinksChange([...links, { targetId: '' }])} className="secondary-button !h-8 !text-xs">
            <Plus size={14} /> Thêm liên kết
          </button>
        </Section>

        {savedArticle && <InTimelinesPanel article={savedArticle} />}

        {linksIn.length > 0 && (
          <Section title={`Bài khác liên kết tới bài này (${linksIn.length})`} hint="Chỉ xem — sửa ở bài nguồn.">
            <ul className="space-y-1.5">
              {linksIn.map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-sm">
                  <Link href={APP_ROUTES.ARTICLES.DETAIL(l.article.id)} className="font-medium text-slate-800 hover:underline">
                    {l.article.title}
                  </Link>
                  {l.label && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{l.label}</span>}
                  {l.article.category && <span className="text-xs text-slate-400">· {l.article.category.name}</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
