'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  ImagePlus,
  Link2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Unlink,
  X,
} from 'lucide-react';
import { TextStyleControls, type TextStyleValue } from '@/components/common/TextStyleControls';
import { PUBLIC_ROUTES, type PublicArticleSummary } from '@/services/public/public-content.service';
import {
  BRANCH_COLOR_STYLES,
  MINDMAP_MARKERS,
  MindmapBorderStyle,
  MindmapBranchColor,
  MindmapBranchSide,
  MindmapEdgeStyle,
  MindmapImageHeight,
  MindmapMarkerId,
  MindmapNodeShape,
  MindmapNodeSize,
  MindmapShortcutKey,
  MindmapStructure,
  NODE_RADIUS_OPTIONS,
  STROKE_WIDTH_OPTIONS,
} from '../constants/mindmap.constants';
import {
  MindmapApiService,
  type MindmapArticleRef,
  type MindmapEdge,
  type MindmapNode,
  type MindmapNodeStyle,
} from '../services/mindmap.service';
import { nodeArticlesOf } from './MindmapNodeCard';

const SHAPE_OPTIONS: ReadonlyArray<{ id: MindmapNodeShape; label: string }> = [
  { id: MindmapNodeShape.AUTO, label: 'Tự động' },
  { id: MindmapNodeShape.CARD, label: 'Thẻ bo' },
  { id: MindmapNodeShape.PILL, label: 'Viên thuốc' },
  { id: MindmapNodeShape.UNDERLINE, label: 'Gạch chân' },
  { id: MindmapNodeShape.CIRCLE, label: 'Bong bóng' },
  { id: MindmapNodeShape.PLAIN, label: 'Chữ trơn' },
];

const BORDER_OPTIONS: ReadonlyArray<{ id: MindmapBorderStyle; label: string }> = [
  { id: MindmapBorderStyle.NONE, label: 'Không' },
  { id: MindmapBorderStyle.SOLID, label: 'Nét liền' },
  { id: MindmapBorderStyle.DASHED, label: 'Nét đứt' },
  { id: MindmapBorderStyle.DOTTED, label: 'Nét chấm' },
];

const STROKE_STYLE_OPTIONS: ReadonlyArray<{ id: MindmapBorderStyle; label: string }> = [
  { id: MindmapBorderStyle.SOLID, label: 'Nét liền' },
  { id: MindmapBorderStyle.DASHED, label: 'Nét đứt' },
  { id: MindmapBorderStyle.DOTTED, label: 'Nét chấm' },
];

const IMG_HEIGHT_OPTIONS: ReadonlyArray<{ id: MindmapImageHeight; label: string }> = [
  { id: MindmapImageHeight.SM, label: 'Thấp' },
  { id: MindmapImageHeight.MD, label: 'Vừa' },
  { id: MindmapImageHeight.LG, label: 'Cao' },
];

const SELECT_CLS =
  'rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer';
const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white';
const IDLE_CHIP_CLS = 'border-slate-200 bg-white text-slate-700';
const ACTIVE_CHIP_CLS = 'border-slate-900 bg-slate-900 text-white';

async function compressImageFileToDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = objectUrl;
    });
    const maxW = 460;
    const scale = Math.min(1, maxW / Math.max(1, img.width));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.78);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function AccordionSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-slate-100 pb-3.5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 py-1 text-left cursor-pointer"
      >
        <ChevronDown
          size={13}
          className={`shrink-0 text-slate-500 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <span className="text-[13px] font-bold text-slate-800">{title}</span>
        {subtitle && <span className="text-[11px] font-medium text-slate-400">{subtitle}</span>}
      </button>
      {open && <div className="mt-2.5 space-y-2.5">{children}</div>}
    </section>
  );
}

function ShapeAppearanceSection({
  node,
  nodeStyle,
  onChange,
  onPatchStyle,
}: {
  node: MindmapNode;
  nodeStyle: MindmapNodeStyle;
  onChange: (patch: Partial<MindmapNode>) => void;
  onPatchStyle: (patch: Partial<MindmapNodeStyle>) => void;
}) {
  const borderMode = nodeStyle.borderStyle ?? MindmapBorderStyle.SOLID;
  return (
    <AccordionSection title="Hình dáng">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">Kiểu khung</span>
        <select
          aria-label="Kiểu khung"
          value={node.shape ?? MindmapNodeShape.AUTO}
          onChange={(e) => onChange({ shape: e.target.value as MindmapNodeShape })}
          className={`${SELECT_CLS} w-36`}
        >
          {SHAPE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">Biến thể</span>
        <select
          aria-label="Bo góc"
          value={nodeStyle.borderRadius ?? 8}
          onChange={(e) => onPatchStyle({ borderRadius: Number(e.target.value) })}
          className={`${SELECT_CLS} w-36`}
        >
          {NODE_RADIUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">Tô màu</span>
        <div className="flex items-center gap-1.5">
          {Object.values(MindmapBranchColor).slice(0, 5).map((color) => (
            <button
              key={color}
              type="button"
              title={BRANCH_COLOR_STYLES[color].label}
              onClick={() => onChange({ colorOverride: color, color })}
              className={`size-4 rounded-full ${BRANCH_COLOR_STYLES[color].dot} cursor-pointer ${
                node.colorOverride === color ? 'ring-2 ring-offset-1 ring-slate-900' : 'opacity-80'
              }`}
            />
          ))}
          <input
            type="color"
            aria-label="Màu nền tuỳ chọn"
            value={nodeStyle.fillColor ?? '#DCE8FD'}
            onChange={(e) => onPatchStyle({ fillColor: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">Viền</span>
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Kiểu viền"
            value={borderMode}
            onChange={(e) => onPatchStyle({ borderStyle: e.target.value as MindmapBorderStyle })}
            className={`${SELECT_CLS} w-24`}
          >
            {BORDER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="color"
            disabled={borderMode === MindmapBorderStyle.NONE}
            value={nodeStyle.borderColor ?? '#3B82F6'}
            onChange={(e) => onPatchStyle({ borderColor: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5 disabled:opacity-40"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">Độ dày viền</span>
        <select
          aria-label="Độ dày viền"
          disabled={borderMode === MindmapBorderStyle.NONE}
          value={nodeStyle.borderWidth ?? 1}
          onChange={(e) => onPatchStyle({ borderWidth: Number(e.target.value) })}
          className={`${SELECT_CLS} w-36 disabled:opacity-40`}
        >
          <option value={1}>Mảnh (1px)</option>
          <option value={2}>Vừa (2px)</option>
          <option value={3}>Đậm (3px)</option>
        </select>
      </div>
    </AccordionSection>
  );
}

function ImageUploadSection({
  node,
  onChange,
}: {
  node: MindmapNode;
  onChange: (patch: Partial<MindmapNode>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      onChange({ imageUrl: dataUrl });
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <AccordionSection title="Hình ảnh">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => void handleFilePick(e)}
      />

      {!node.imageUrl ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 py-5 text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer"
        >
          <ImagePlus size={20} className="text-slate-500" />
          <span className="text-xs font-bold">
            {busy ? 'Đang xử lý ảnh…' : 'Nhấp để thêm ảnh'}
          </span>
        </button>
      ) : (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={node.imageUrl} alt={node.title} className="h-28 w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ imageUrl: undefined })}
              title="Gỡ ảnh"
              className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-600 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10.5px] font-semibold text-slate-500">Chiều cao:</span>
            {IMG_HEIGHT_OPTIONS.map((opt) => {
              const active = (node.imageHeight ?? MindmapImageHeight.MD) === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ imageHeight: opt.id })}
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                    active ? ACTIVE_CHIP_CLS : IDLE_CHIP_CLS
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <input
        type="url"
        value={node.imageUrl?.startsWith('data:') ? '' : (node.imageUrl ?? '')}
        onChange={(e) => onChange({ imageUrl: e.target.value || undefined })}
        placeholder="Hoặc dán URL hình ảnh…"
        className={INPUT_CLS}
      />
    </AccordionSection>
  );
}

/** Tab 1 (Palette): Hình dáng, Văn bản tái sử dụng, Nhánh con, Hình ảnh, Liên kết ngoài. */
export function MindmapNodeStylePanel({
  node,
  structure,
  isRoot,
  isLevel1,
  onChange,
  onAddChild,
  onDelete,
}: {
  node: MindmapNode;
  structure: MindmapStructure;
  isRoot: boolean;
  isLevel1: boolean;
  onChange: (patch: Partial<MindmapNode>) => void;
  onAddChild: () => void;
  onDelete: () => void;
}) {
  const nodeStyle: MindmapNodeStyle = node.style ?? {};
  const patchStyle = (patch: Partial<MindmapNodeStyle>) => {
    onChange({ style: { ...nodeStyle, ...patch } });
  };

  const resetAllStyles = () => {
    onChange({
      style: undefined,
      shape: undefined,
      size: undefined,
      colorOverride: undefined,
    });
  };

  return (
    <div className="space-y-3.5 text-xs text-slate-700">
      <input
        type="text"
        aria-label="Tiêu đề node"
        value={node.title}
        onChange={(e) => onChange({ title: e.target.value })}
        maxLength={120}
        className={`${INPUT_CLS} font-bold text-sm`}
      />

      <ShapeAppearanceSection
        node={node}
        nodeStyle={nodeStyle}
        onChange={onChange}
        onPatchStyle={patchStyle}
      />

      <AccordionSection title="Văn bản">
        <TextStyleControls
          value={nodeStyle}
          defaultFontSize={isRoot ? 15 : 13}
          onChange={(patch: Partial<TextStyleValue>) => patchStyle(patch)}
        />
      </AccordionSection>

      <AccordionSection title="Nhánh" subtitle="nhánh con">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600 font-medium">Kiểu nhánh</span>
          <select
            aria-label="Kiểu nhánh con"
            value={nodeStyle.childEdgeStyle ?? MindmapEdgeStyle.AUTO}
            onChange={(e) => patchStyle({ childEdgeStyle: e.target.value as MindmapEdgeStyle })}
            className={`${SELECT_CLS} w-36`}
          >
            <option value={MindmapEdgeStyle.AUTO}>Theo bản đồ</option>
            <option value={MindmapEdgeStyle.BEZIER}>Cong mượt</option>
            <option value={MindmapEdgeStyle.STEP}>Vuông góc</option>
            <option value={MindmapEdgeStyle.STRAIGHT}>Thẳng</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600 font-medium">Đường kẻ</span>
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Kiểu nét đường kẻ"
              value={nodeStyle.childStrokeStyle ?? MindmapBorderStyle.SOLID}
              onChange={(e) => patchStyle({ childStrokeStyle: e.target.value as MindmapBorderStyle })}
              className={`${SELECT_CLS} w-24`}
            >
              {STROKE_STYLE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="color"
              aria-label="Màu đường nhánh"
              value={nodeStyle.childStrokeColor ?? '#3B82F6'}
              onChange={(e) => patchStyle({ childStrokeColor: e.target.value })}
              className="h-7 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600 font-medium">Độ dày</span>
          <select
            aria-label="Độ dày nhánh"
            value={nodeStyle.childStrokeWidth ?? 2.2}
            onChange={(e) => patchStyle({ childStrokeWidth: Number(e.target.value) })}
            className={`${SELECT_CLS} w-36`}
          >
            {STROKE_WIDTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600 font-medium">Độ rộng thẻ</span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: MindmapNodeSize.SM, label: 'Nhỏ' },
              { id: MindmapNodeSize.MD, label: 'Vừa' },
              { id: MindmapNodeSize.LG, label: 'Lớn' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ size: opt.id })}
                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                  (node.size ?? MindmapNodeSize.MD) === opt.id ? ACTIVE_CHIP_CLS : IDLE_CHIP_CLS
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {structure === MindmapStructure.MIND_MAP && isLevel1 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 font-medium">Hướng nhánh</span>
            <div className="inline-flex gap-1">
              {[
                { id: MindmapBranchSide.AUTO, label: 'Tự động' },
                { id: MindmapBranchSide.LEFT, label: 'Trái' },
                { id: MindmapBranchSide.RIGHT, label: 'Phải' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange({ side: s.id })}
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                    (node.side ?? MindmapBranchSide.AUTO) === s.id ? ACTIVE_CHIP_CLS : IDLE_CHIP_CLS
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={resetAllStyles}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
        >
          <RotateCcw size={13} /> Đặt lại kiểu
        </button>
      </AccordionSection>

      <ImageUploadSection node={node} onChange={onChange} />

      <AccordionSection title="Liên kết ngoài" defaultOpen={false}>
        <input
          type="url"
          value={node.externalUrl ?? ''}
          onChange={(e) => onChange({ externalUrl: e.target.value || undefined })}
          placeholder="Thêm liên kết https://…"
          className={INPUT_CLS}
        />
      </AccordionSection>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onAddChild}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#16357B] px-3 py-2 font-bold text-white hover:brightness-110 cursor-pointer"
        >
          <Plus size={13} /> Thêm nhánh con
        </button>
        {!isRoot && (
          <button
            type="button"
            onClick={onDelete}
            title="Xoá node và nhánh con"
            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-bold text-rose-600 hover:bg-rose-100 cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Tab 2 (Star): Tách riêng Biểu tượng đánh dấu, Niên đại / Ngày tháng và Thẻ nhãn (#tag). */
export function MindmapNodeMarkersPanel({
  node,
  onChange,
}: {
  node: MindmapNode;
  onChange: (patch: Partial<MindmapNode>) => void;
}) {
  const [tagDraft, setTagDraft] = useState('');
  const tags = node.tags ?? [];
  const markers = node.markers ?? [];

  const toggleMarker = (markerId: MindmapMarkerId) => {
    const next = markers.includes(markerId)
      ? markers.filter((m) => m !== markerId)
      : [...markers, markerId];
    onChange({ markers: next });
  };

  const commitTag = () => {
    const clean = tagDraft.trim();
    if (!clean || tags.includes(clean)) {
      setTagDraft('');
      return;
    }
    onChange({ tags: [...tags, clean] });
    setTagDraft('');
  };

  const fillToday = () => {
    const today = new Intl.DateTimeFormat('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
    onChange({ dateLabel: today, badge: today });
  };

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <AccordionSection title="Biểu tượng đánh dấu">
        <div className="flex flex-wrap gap-1.5">
          {Object.values(MindmapMarkerId).map((markerId) => {
            const meta = MINDMAP_MARKERS[markerId];
            const active = markers.includes(markerId);
            return (
              <button
                key={markerId}
                type="button"
                onClick={() => toggleMarker(markerId)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  active ? ACTIVE_CHIP_CLS : `${IDLE_CHIP_CLS} hover:bg-slate-50`
                }`}
              >
                <span
                  style={{ backgroundColor: meta.bg, color: meta.fg }}
                  className="grid size-4 place-items-center rounded-full text-[9.5px] font-bold"
                >
                  {meta.glyph}
                </span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
        {markers.length > 0 && (
          <button
            type="button"
            onClick={() => onChange({ markers: [] })}
            className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
          >
            Xoá toàn bộ biểu tượng
          </button>
        )}
      </AccordionSection>

      <AccordionSection title="Niên đại & Ngày tháng">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <CalendarDays size={12} className="text-indigo-600" /> Mốc thời gian
          </span>
          <button
            type="button"
            onClick={fillToday}
            className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
          >
            Điền hôm nay
          </button>
        </div>
        <input
          type="text"
          value={node.dateLabel ?? node.badge ?? ''}
          onChange={(e) => onChange({ dateLabel: e.target.value, badge: e.target.value })}
          placeholder="VD: 19 thg 11, 2026 hoặc 1225 – 1400"
          maxLength={60}
          className={INPUT_CLS}
        />
      </AccordionSection>

      <AccordionSection title="Nhãn thẻ (#tag)">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === MindmapShortcutKey.ENTER) {
                e.preventDefault();
                commitTag();
              }
            }}
            placeholder="Nhập nhãn rồi nhấn Enter…"
            className={INPUT_CLS}
          />
          <button
            type="button"
            onClick={commitTag}
            className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Thêm
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => onChange({ tags: tags.filter((x) => x !== t) })}
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </AccordionSection>
    </div>
  );
}

/** Tab 5 (FileText): Tách riêng Ghi chú chi tiết, Tư liệu HISGO đính kèm và Nhãn đường nối. */
export function MindmapNodeNotesPanel({
  node,
  edges,
  nodeMap,
  onChange,
  onUpdateEdge,
  onDeleteEdge,
  onOpenArticleInReader,
}: {
  node: MindmapNode;
  edges: MindmapEdge[];
  nodeMap: Map<string, MindmapNode>;
  onChange: (patch: Partial<MindmapNode>) => void;
  onUpdateEdge: (edgeId: string, label: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onOpenArticleInReader: (slug: string) => void;
}) {
  const [articleQuery, setArticleQuery] = useState('');
  const [results, setResults] = useState<PublicArticleSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const attachedArticles = nodeArticlesOf(node);
  const connectedEdges = edges.filter((e) => e.fromId === node.id || e.toId === node.id);

  const runSearch = async (q: string) => {
    setArticleQuery(q);
    setSearching(true);
    try {
      setResults(await MindmapApiService.searchArticles(q));
    } finally {
      setSearching(false);
    }
  };

  const addArticle = (art: PublicArticleSummary) => {
    if (attachedArticles.some((a) => a.id === art.id)) return;
    const nextList: MindmapArticleRef[] = [
      ...attachedArticles,
      { id: art.id, slug: art.slug, title: art.title, coverImageUrl: art.coverImageUrl },
    ];
    onChange({
      articleRefs: nextList,
      articleRef: undefined,
      ...(!node.imageUrl && art.coverImageUrl ? { imageUrl: art.coverImageUrl } : {}),
    });
    setArticleQuery('');
    setResults([]);
  };

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <AccordionSection title="Ghi chú chi tiết">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">
            Mặc định hiển thị icon ≡ gọn trên thẻ
          </span>
          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(node.showNoteInline)}
              onChange={(e) => onChange({ showNoteInline: e.target.checked })}
              className="accent-indigo-600"
            />
            Hiện trên thẻ
          </label>
        </div>
        <textarea
          rows={6}
          value={node.note ?? ''}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder="Ghi chép bối cảnh, nhân vật, diễn biến hoặc bài học rút ra…"
          maxLength={600}
          className={`${INPUT_CLS} resize-y leading-relaxed`}
        />
      </AccordionSection>

      {/* Tư liệu HISGO đính kèm — giữ vị trí chuẩn chỉnh như hình 2 user gợi ý */}
      <AccordionSection title={`Tư liệu HISGO (${attachedArticles.length})`}>
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={articleQuery}
            onFocus={() => {
              if (results.length === 0) void runSearch(articleQuery);
            }}
            onChange={(e) => void runSearch(e.target.value)}
            placeholder="Tìm bài viết lịch sử HISGO…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
          />
        </div>
        {searching && <p className="text-[11px] text-slate-400">Đang tìm…</p>}
        {results.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs">
            {results.map((art) => {
              const added = attachedArticles.some((a) => a.id === art.id);
              return (
                <li key={art.id}>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => addArticle(art)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium hover:bg-slate-100 disabled:opacity-45 cursor-pointer"
                  >
                    <span className="truncate">{art.title}</span>
                    <span className="shrink-0 text-[10px] font-bold text-indigo-600">
                      {added ? 'Đã gắn' : '+ Gắn'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {attachedArticles.length > 0 && (
          <ul className="space-y-1.5">
            {attachedArticles.map((art) => (
              <li
                key={art.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2"
              >
                <button
                  type="button"
                  onClick={() => onOpenArticleInReader(art.slug)}
                  title="Mở đọc ngay trong Studio"
                  className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-left font-semibold text-indigo-700 hover:underline cursor-pointer"
                >
                  <Link2 size={12} className="shrink-0" />
                  <span className="truncate">{art.title}</span>
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Link
                    href={PUBLIC_ROUTES.ARTICLE(art.slug)}
                    target="_blank"
                    title="Mở ở tab mới"
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-indigo-600"
                  >
                    <ExternalLink size={11} />
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        articleRefs: attachedArticles.filter((a) => a.id !== art.id),
                        articleRef: undefined,
                      })
                    }
                    title="Gỡ tư liệu"
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-rose-600 cursor-pointer"
                  >
                    <Unlink size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AccordionSection>

      {connectedEdges.length > 0 && (
        <AccordionSection title={`Nhãn đường nối (${connectedEdges.length})`} defaultOpen={false}>
          <ul className="space-y-1.5">
            {connectedEdges.map((edge) => {
              const otherId = edge.fromId === node.id ? edge.toId : edge.fromId;
              return (
                <li key={edge.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                  <span className="max-w-[85px] truncate text-[11px] font-semibold text-slate-600">
                    {nodeMap.get(otherId)?.title ?? 'Node'}
                  </span>
                  <input
                    type="text"
                    value={edge.label ?? ''}
                    onChange={(e) => onUpdateEdge(edge.id, e.target.value)}
                    placeholder="Nhãn nối…"
                    className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] outline-none"
                  />
                  {edge.isCrossLink && (
                    <button
                      type="button"
                      onClick={() => onDeleteEdge(edge.id)}
                      className="rounded p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </AccordionSection>
      )}
    </div>
  );
}
