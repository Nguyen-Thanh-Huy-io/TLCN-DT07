'use client';

import React from 'react';
import {
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ImagePlus,
  Upload,
  X,
  Sparkles,
} from 'lucide-react';
import { TimelineNode } from '../../types/block-builder.types';
import { TimelineSceneStrategy } from '../../strategies/timeline-scene.strategy';
import { MoveDirection } from '../quiz/QuizQuestionEditors';
import { TipTapContent } from '../TipTapContent';
import { TimelineSceneStyleEnum } from './TimelineBlockItemEditor';

export interface TimelineNodeItemCardProps {
  node: TimelineNode;
  originalIdx: number;
  totalCount: number;
  isHorizontal: boolean;
  sceneStyle: string;
  showImage: boolean;
  showLocation: boolean;
  isMediaOpen: boolean;
  onToggleMedia: () => void;
  onCloseMedia: () => void;
  onFieldChange: (updates: Partial<TimelineNode>) => void;
  onRichTextChange: (html: string) => void;
  onUploadImage: (file: File | undefined) => void;
  onMove: (direction: MoveDirection) => void;
  onDelete: () => void;
}

interface TimelineNodeMediaPanelProps {
  node: TimelineNode;
  isOpen: boolean;
  onClose: () => void;
  onFieldChange: (updates: Partial<TimelineNode>) => void;
  onUploadImage: (file: File | undefined) => void;
}

function TimelineNodeMediaPanel({
  node: n,
  isOpen,
  onClose,
  onFieldChange,
  onUploadImage,
}: TimelineNodeMediaPanelProps) {
  if (!isOpen) return null;
  const thumb = n.thumbnailUrl || n.mediaList?.[0]?.url || '';

  return (
    <div className="mb-4 p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
          Tư liệu hình ảnh của mốc {n.year}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-600 hover:text-stone-950 p-1 rounded cursor-pointer"
          title="Đóng khung ảnh"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={n.thumbnailUrl || ''}
          onChange={(e) => onFieldChange({ thumbnailUrl: e.target.value })}
          placeholder="Dán đường dẫn ảnh tư liệu (https://...)"
          className="flex-1 min-w-[220px] text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 text-stone-900"
        />
        <label className="px-3 py-2 text-sm font-medium text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0">
          <Upload className="w-4 h-4" />
          <span>Tải ảnh lên</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onUploadImage(e.target.files?.[0])}
            className="hidden"
          />
        </label>
        {thumb && (
          <button
            type="button"
            onClick={() => onFieldChange({ thumbnailUrl: '', mediaCaption: '' })}
            className="px-3 py-2 text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 border border-stone-300 rounded-lg cursor-pointer"
          >
            Gỡ ảnh
          </button>
        )}
      </div>

      <input
        type="text"
        value={n.mediaCaption || ''}
        onChange={(e) => onFieldChange({ mediaCaption: e.target.value })}
        placeholder="Chú thích ảnh tư liệu hoặc nguồn trích dẫn bảo tàng..."
        className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 text-stone-800"
      />
    </div>
  );
}

interface SceneViewProps {
  node: TimelineNode;
  resolvedHtml: string;
  thumb: string;
  isHorizontal: boolean;
  showImage: boolean;
  onFieldChange: (updates: Partial<TimelineNode>) => void;
  onRichTextChange: (html: string) => void;
}

function TimelineCinematicBackdropView({
  node: n,
  resolvedHtml,
  thumb,
  onRichTextChange,
}: SceneViewProps) {
  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden aspect-[21/9] bg-stone-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={n.title || 'Ảnh đại cảnh lịch sử'}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/35 to-transparent flex flex-col justify-end p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Niên đại {n.year}
            </span>
            {n.locationName && (
              <span className="text-xs text-stone-200">• {n.locationName}</span>
            )}
          </div>
          <h4 className="text-xl font-serif font-bold text-white leading-snug">
            {n.title}
          </h4>
          {n.mediaCaption && (
            <p className="text-sm text-stone-200 mt-1 italic">{n.mediaCaption}</p>
          )}
        </div>
      </div>

      <div className="pt-1">
        <TipTapContent
          value={resolvedHtml}
          onChange={onRichTextChange}
          compact={true}
          remoteToolbarOnly={true}
          minHeightClass="min-h-[84px]"
          placeholder="Nhập tiêu đề và câu chuyện lịch sử của mốc này..."
        />
      </div>
    </div>
  );
}

function TimelineMuseumSplitView({
  node: n,
  resolvedHtml,
  thumb,
  isHorizontal,
  showImage,
  onFieldChange,
  onRichTextChange,
}: SceneViewProps) {
  const hasVisibleImage = showImage && Boolean(thumb);
  const isSplitLayout = hasVisibleImage && !isHorizontal;

  return (
    <div className={isSplitLayout ? 'grid grid-cols-1 md:grid-cols-12 gap-6 items-start' : 'space-y-3'}>
      <div className={isSplitLayout ? 'md:col-span-7' : 'w-full'}>
        <TipTapContent
          value={resolvedHtml}
          onChange={onRichTextChange}
          compact={true}
          remoteToolbarOnly={true}
          minHeightClass="min-h-[84px]"
          placeholder="Nhập tiêu đề và diễn biến lịch sử tại đây..."
        />
      </div>

      {hasVisibleImage && (
        <figure
          className={
            !isHorizontal
              ? 'md:col-span-5 rounded-xl overflow-hidden border border-stone-200 bg-stone-50'
              : 'rounded-xl overflow-hidden border border-stone-200 bg-stone-50'
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt={n.mediaCaption || n.title || 'Tư liệu lịch sử'}
            className="w-full aspect-[16/10] object-cover"
          />
          <figcaption className="px-3 py-2 border-t border-stone-200 bg-white">
            <input
              type="text"
              value={n.mediaCaption || ''}
              onChange={(e) => onFieldChange({ mediaCaption: e.target.value })}
              placeholder="Nhập chú thích ảnh tư liệu..."
              className="w-full text-sm text-stone-700 italic bg-transparent focus:outline-none"
            />
          </figcaption>
        </figure>
      )}
    </div>
  );
}

export function TimelineNodeItemCard({
  node: n,
  originalIdx: idx,
  totalCount,
  isHorizontal,
  sceneStyle,
  showImage,
  showLocation,
  isMediaOpen,
  onToggleMedia,
  onCloseMedia,
  onFieldChange,
  onRichTextChange,
  onUploadImage,
  onMove,
  onDelete,
}: TimelineNodeItemCardProps) {
  const thumb = n.thumbnailUrl || n.mediaList?.[0]?.url || '';
  const resolvedHtml = TimelineSceneStrategy.resolveNodeContentHtml(n);
  const isCinematic = sceneStyle === TimelineSceneStyleEnum.CINEMATIC_BACKDROP && showImage && Boolean(thumb);

  return (
    <div
      data-testid={`timeline-node-${idx}`}
      className={`group/node transition-colors duration-150 ${
        isHorizontal
          ? 'min-w-[340px] max-w-[420px] shrink-0'
          : 'pb-6 border-b border-stone-200/80 last:border-b-0 last:pb-0'
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="text"
            value={n.year}
            onChange={(e) => onFieldChange({ year: e.target.value })}
            placeholder="Niên đại (1945)"
            aria-label="Niên đại hoặc mốc thời gian"
            className="w-28 text-sm font-serif font-bold text-white bg-stone-900 rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-stone-400 text-center"
          />

          {showLocation && (
            <div className="flex items-center gap-1 text-sm text-stone-700 bg-stone-100 rounded-md px-2.5 py-1">
              <MapPin className="w-3.5 h-3.5 text-stone-700 shrink-0" />
              <input
                type="text"
                value={n.locationName || ''}
                onChange={(e) => onFieldChange({ locationName: e.target.value })}
                placeholder="Địa điểm diễn ra..."
                className="bg-transparent text-sm text-stone-800 focus:outline-none w-36"
              />
            </div>
          )}

          {n.eventId && (
            <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Kho HISGO</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid={`btn-node-media-${idx}`}
            onClick={onToggleMedia}
            className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              isMediaOpen || thumb
                ? 'bg-stone-900 text-white'
                : 'text-stone-800 hover:bg-stone-100'
            }`}
            title="Đính kèm ảnh tư liệu hoặc ảnh nền cho phân cảnh này"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>{thumb ? 'Ảnh tư liệu' : 'Thêm ảnh'}</span>
          </button>

          {idx > 0 && (
            <button
              type="button"
              onClick={() => onMove(MoveDirection.UP)}
              title={isHorizontal ? 'Sang trái' : 'Lên trên'}
              className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-md cursor-pointer"
            >
              {isHorizontal ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          )}
          {idx < totalCount - 1 && (
            <button
              type="button"
              onClick={() => onMove(MoveDirection.DOWN)}
              title={isHorizontal ? 'Sang phải' : 'Xuống dưới'}
              className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-md cursor-pointer"
            >
              {isHorizontal ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            title="Xóa mốc sự kiện"
            className="p-1.5 text-stone-700 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <TimelineNodeMediaPanel
        node={n}
        isOpen={isMediaOpen}
        onClose={onCloseMedia}
        onFieldChange={onFieldChange}
        onUploadImage={onUploadImage}
      />

      {isCinematic ? (
        <TimelineCinematicBackdropView
          node={n}
          resolvedHtml={resolvedHtml}
          thumb={thumb}
          isHorizontal={isHorizontal}
          showImage={showImage}
          onFieldChange={onFieldChange}
          onRichTextChange={onRichTextChange}
        />
      ) : (
        <TimelineMuseumSplitView
          node={n}
          resolvedHtml={resolvedHtml}
          thumb={thumb}
          isHorizontal={isHorizontal}
          showImage={showImage}
          onFieldChange={onFieldChange}
          onRichTextChange={onRichTextChange}
        />
      )}
    </div>
  );
}
