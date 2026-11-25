'use client';

import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Film,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { UploadApiService, extractErrorMessage } from '@/services/api';
import { LessonBlockType } from '../../types/editor.types';
import {
  RowGapSize,
  type LessonBlockItem,
  type RowSectionBlockData,
  type TimelineBlockData,
  type TimelineNode,
  type TimelineNodeMedia,
} from '../../types/block-builder.types';
import {
  BlockPlacementRuleEngine,
  PlacementLocation,
  createBlockUUID,
} from '../../strategies/row-layout.strategy';
import {
  LESSON_BLOCK_DRAG_MIME,
  LESSON_BLOCK_ITEMS,
  getBlockLabel,
} from '../../constants/lesson.constants';
import { BLOCK_TYPE_ICONS } from '../LessonLeftToolSidebar';

const ROW_GAP_CLASSES: Record<RowGapSize, string> = {
  [RowGapSize.SM]: 'gap-2',
  [RowGapSize.MD]: 'gap-3',
  [RowGapSize.LG]: 'gap-5',
};

const MAX_TIMELINE_IMAGE_BYTES = 10 * 1024 * 1024;

interface TimelineMediaItemRowProps {
  item: TimelineNodeMedia;
  onChange: (patch: Partial<TimelineNodeMedia>) => void;
  onRemove: () => void;
}

function TimelineMediaItemRow({ item, onChange, onRemove }: TimelineMediaItemRowProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp hình ảnh hợp lệ.');
      return;
    }
    if (file.size > MAX_TIMELINE_IMAGE_BYTES) {
      setUploadError('Ảnh tối đa 10MB.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const res = await UploadApiService.uploadImage(file);
      if (res?.url) {
        onChange({ url: res.url });
      } else {
        setUploadError('Tải ảnh lên thất bại.');
      }
    } catch (err) {
      setUploadError(extractErrorMessage(err, 'Lỗi kết nối khi tải ảnh lên.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-2 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
            item.type === 'IMAGE'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-sky-50 text-sky-700'
          }`}
        >
          {item.type === 'IMAGE' ? <ImageIcon size={11} /> : <Film size={11} />}
          <span>{item.type === 'IMAGE' ? 'Ảnh' : 'Video'}</span>
        </span>

        <input
          type="url"
          value={item.url || ''}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder={
            item.type === 'IMAGE'
              ? 'Dán đường dẫn ảnh (https://...) hoặc tải từ máy...'
              : 'Dán link YouTube (watch / youtu.be / embed) hoặc .mp4...'
          }
          className="min-w-[160px] flex-1 rounded-md border border-stone-200 px-2 py-1 text-[11px] text-stone-800 focus:border-stone-600 focus:outline-none"
        />

        {item.type === 'IMAGE' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              <span>{uploading ? 'Đang tải...' : 'Tải ảnh'}</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onRemove}
          title="Xóa tư liệu này"
          className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {item.type === 'IMAGE' && item.url?.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.caption || 'Xem trước ảnh mốc sự kiện'}
            className="h-10 w-14 rounded object-cover border border-stone-200 shrink-0 bg-stone-100"
          />
        )}
        <input
          type="text"
          value={item.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Chú thích tư liệu (tùy chọn)..."
          className="w-full rounded-md border border-stone-200 px-2 py-1 text-[11px] text-stone-600 focus:border-stone-500 focus:outline-none"
        />
      </div>

      {uploadError && (
        <p role="alert" className="text-[11px] text-rose-600 font-medium">
          {uploadError}
        </p>
      )}
    </div>
  );
}

export interface TimelineBlockItemEditorProps {
  data: TimelineBlockData;
  onChange: (updates: Partial<TimelineBlockData>) => void;
}

export function TimelineBlockItemEditor({ data, onChange }: TimelineBlockItemEditorProps) {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const showLocation = Boolean(data.displayConfig?.showLocation);

  const updateNode = (index: number, patch: Partial<TimelineNode>) => {
    const next = nodes.map((node, i) => (i === index ? { ...node, ...patch } : node));
    onChange({ nodes: next });
  };

  const addNode = () => {
    const nextNode: TimelineNode = {
      id: createBlockUUID('tl'),
      year: '',
      title: '',
      description: '',
      mediaList: [],
      isManual: true,
    };
    onChange({ nodes: [...nodes, nextNode] });
  };

  const removeNode = (index: number) => {
    onChange({ nodes: nodes.filter((_, i) => i !== index) });
  };

  const moveNode = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= nodes.length) return;
    const next = [...nodes];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange({ nodes: next });
  };

  const getNodeMediaList = (node: TimelineNode): TimelineNodeMedia[] => {
    const list = Array.isArray(node.mediaList) ? [...node.mediaList] : [];
    if (
      node.thumbnailUrl?.trim() &&
      !list.some((m) => m.type === 'IMAGE' && m.url === node.thumbnailUrl?.trim())
    ) {
      list.unshift({
        id: createBlockUUID('tlm'),
        type: 'IMAGE',
        url: node.thumbnailUrl.trim(),
        caption: node.mediaCaption || '',
      });
    }
    return list;
  };

  const addNodeMedia = (nodeIdx: number, type: 'IMAGE' | 'VIDEO') => {
    const current = getNodeMediaList(nodes[nodeIdx]);
    updateNode(nodeIdx, {
      mediaList: [...current, { id: createBlockUUID('tlm'), type, url: '', caption: '' }],
      thumbnailUrl: '',
      mediaCaption: '',
    });
  };

  const updateNodeMedia = (
    nodeIdx: number,
    mediaIdx: number,
    patch: Partial<TimelineNodeMedia>,
  ) => {
    const current = getNodeMediaList(nodes[nodeIdx]);
    const next = current.map((item, idx) => (idx === mediaIdx ? { ...item, ...patch } : item));
    updateNode(nodeIdx, { mediaList: next, thumbnailUrl: '', mediaCaption: '' });
  };

  const removeNodeMedia = (nodeIdx: number, mediaIdx: number) => {
    const current = getNodeMediaList(nodes[nodeIdx]);
    updateNode(nodeIdx, {
      mediaList: current.filter((_, idx) => idx !== mediaIdx),
      thumbnailUrl: '',
      mediaCaption: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Tiêu đề dòng thời gian (vd. Lịch sử, Diễn biến chiến dịch)..."
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-900 focus:border-stone-700 focus:outline-none"
        />
        <input
          type="text"
          value={data.subtitle || ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Mô tả ngắn (tùy chọn)..."
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 focus:border-stone-700 focus:outline-none"
        />
      </div>

      {nodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 text-center text-xs text-stone-500">
          Chưa có mốc sự kiện nào. Bấm &quot;Thêm mốc sự kiện&quot; bên dưới để bắt đầu dựng trục thời gian.
        </div>
      ) : (
        <div className="relative space-y-3 pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-amber-300/80">
          {nodes.map((node, idx) => {
            const mediaItems = getNodeMediaList(node);
            return (
              <div
                key={node.id || idx}
                className="relative rounded-xl border border-stone-200 bg-stone-50/60 p-3 space-y-2"
              >
                <span className="absolute -left-[19px] top-4 h-3 w-3 rounded-full border-2 border-white bg-amber-600 shadow-2xs" />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-[170px] sm:w-48">
                    <Clock size={13} className="text-amber-700 shrink-0" />
                    <input
                      type="text"
                      value={node.year || ''}
                      onChange={(e) => updateNode(idx, { year: e.target.value })}
                      placeholder="Thời điểm / Bối cảnh..."
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-amber-800 focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={node.title || ''}
                    onChange={(e) => updateNode(idx, { title: e.target.value })}
                    placeholder="Tên mốc sự kiện..."
                    className="min-w-[180px] flex-1 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs sm:text-sm font-bold text-stone-900 focus:border-stone-700 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveNode(idx, -1)}
                      title="Đưa mốc lên trên"
                      className="rounded p-1 text-stone-500 hover:bg-stone-200 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === nodes.length - 1}
                      onClick={() => moveNode(idx, 1)}
                      title="Đưa mốc xuống dưới"
                      className="rounded p-1 text-stone-500 hover:bg-stone-200 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNode(idx)}
                      title="Xóa mốc sự kiện"
                      className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {showLocation && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-stone-400 shrink-0" />
                    <input
                      type="text"
                      value={node.locationName || ''}
                      onChange={(e) => updateNode(idx, { locationName: e.target.value })}
                      placeholder="Địa điểm diễn ra (vd. Sông Bạch Đằng, Điện Biên Phủ)..."
                      className="w-full rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700 focus:border-stone-600 focus:outline-none"
                    />
                  </div>
                )}

                <textarea
                  rows={2}
                  value={node.description || ''}
                  onChange={(e) => updateNode(idx, { description: e.target.value })}
                  placeholder="Diễn biến ngắn gọn của mốc này..."
                  className="w-full rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 focus:border-stone-600 focus:outline-none"
                />

                {mediaItems.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {mediaItems.map((mediaItem, mediaIdx) => (
                      <TimelineMediaItemRow
                        key={mediaItem.id || `${idx}-${mediaIdx}`}
                        item={mediaItem}
                        onChange={(patch) => updateNodeMedia(idx, mediaIdx, patch)}
                        onRemove={() => removeNodeMedia(idx, mediaIdx)}
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => addNodeMedia(idx, 'IMAGE')}
                    className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                  >
                    <ImageIcon size={12} />
                    <span>+ Ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addNodeMedia(idx, 'VIDEO')}
                    className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 transition cursor-pointer"
                  >
                    <Film size={12} />
                    <span>+ Video</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addNode}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-amber-400 bg-amber-50/70 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
      >
        <Plus size={14} />
        <span>Thêm mốc sự kiện</span>
      </button>
    </div>
  );
}

export interface RowSectionBlockEditorProps {
  data: RowSectionBlockData;
  onAddBlockToColumn?: (columnId: string, type: LessonBlockType) => void;
  onUpdateBlockInColumn?: (
    columnId: string,
    blockId: string,
    updates: Partial<LessonBlockItem>,
  ) => void;
  onRemoveBlockFromColumn?: (columnId: string, blockId: string) => void;
  renderChildBlock: (
    block: LessonBlockItem,
    onChange: (updates: Partial<LessonBlockItem>) => void,
  ) => React.ReactNode;
}

export function RowSectionBlockEditor({
  data,
  onAddBlockToColumn,
  onUpdateBlockInColumn,
  onRemoveBlockFromColumn,
  renderChildBlock,
}: RowSectionBlockEditorProps) {
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const [openPickerColId, setOpenPickerColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const gapClass = ROW_GAP_CLASSES[data.gapSize || RowGapSize.MD] || ROW_GAP_CLASSES[RowGapSize.MD];
  const gridTemplate =
    columns.length > 1
      ? columns.map((c) => `${Math.max(15, c.widthPercent || Math.floor(100 / columns.length))}fr`).join(' ')
      : '1fr';

  return (
    <div
      className={`grid grid-cols-1 md:[grid-template-columns:var(--row-cols)] ${gapClass}`}
      style={{ '--row-cols': gridTemplate } as React.CSSProperties}
    >
      {columns.map((col, colIdx) => {
        const allowedItems = LESSON_BLOCK_ITEMS.filter(
          (item) =>
            BlockPlacementRuleEngine.validate(item.type, {
              location: PlacementLocation.COLUMN,
              columnWidthPercent: col.widthPercent,
            }).allowed,
        );
        const isPickerOpen = openPickerColId === col.id;
        const isDragOver = dragOverColId === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(LESSON_BLOCK_DRAG_MIME)) {
                e.preventDefault();
                e.stopPropagation();
                if (dragOverColId !== col.id) setDragOverColId(col.id);
              }
            }}
            onDragLeave={() => {
              if (dragOverColId === col.id) setDragOverColId(null);
            }}
            onDrop={(e) => {
              const blockType = e.dataTransfer.getData(LESSON_BLOCK_DRAG_MIME) as LessonBlockType;
              setDragOverColId(null);
              if (!blockType) return;
              e.preventDefault();
              e.stopPropagation();
              const check = BlockPlacementRuleEngine.validate(blockType, {
                location: PlacementLocation.COLUMN,
                columnWidthPercent: col.widthPercent,
              });
              if (check.allowed) {
                onAddBlockToColumn?.(col.id, blockType);
              }
            }}
            className={`relative flex flex-col gap-2.5 rounded-xl border p-2.5 min-w-0 transition ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-200'
                : 'border-stone-200 bg-stone-50/50'
            } ${
              data.showColumnDivider && colIdx > 0 ? 'md:border-l-2 md:border-l-stone-300' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-stone-500 px-1">
              <span>Cột {colIdx + 1}</span>
              <span>{col.blocks.length} khối</span>
            </div>

            {col.blocks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-3 text-center text-xs text-stone-400">
                Cột trống — bấm &quot;Thêm khối&quot; hoặc kéo khối từ cột trái vào đây.
              </div>
            ) : (
              <div className="space-y-2.5">
                {col.blocks.map((child) => (
                  <div
                    key={child.id}
                    className="rounded-lg border border-stone-200 bg-white p-2.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                      <span className="text-[11px] font-semibold text-stone-600">
                        {getBlockLabel(child.type)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveBlockFromColumn?.(col.id, child.id)}
                        title="Xóa khối khỏi cột"
                        className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {renderChildBlock(child, (updates) =>
                      onUpdateBlockInColumn?.(col.id, child.id, updates),
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="relative pt-1">
              <button
                type="button"
                data-testid={`btn-add-col-block-${colIdx}`}
                onClick={() => setOpenPickerColId(isPickerOpen ? null : col.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:border-indigo-400 hover:bg-indigo-50/60 hover:text-indigo-800 transition cursor-pointer"
              >
                <Plus size={13} />
                <span>Thêm khối</span>
              </button>

              {isPickerOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setOpenPickerColId(null)}
                  />
                  <div
                    role="menu"
                    data-testid={`col-block-picker-${colIdx}`}
                    className="absolute left-0 right-0 bottom-full mb-1.5 z-40 max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg grid grid-cols-1 gap-0.5"
                  >
                    {allowedItems.map((item) => {
                      const ItemIcon = BLOCK_TYPE_ICONS[item.type];
                      return (
                        <button
                          key={item.type}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onAddBlockToColumn?.(col.id, item.type);
                            setOpenPickerColId(null);
                          }}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-indigo-50 hover:text-indigo-800 transition cursor-pointer"
                        >
                          {ItemIcon && <ItemIcon size={13} className="text-stone-400 shrink-0" />}
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
