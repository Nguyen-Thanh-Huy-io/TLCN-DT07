'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Database,
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
import { TimelineBlockData, TimelineOrientation } from '../../types/block-builder.types';
import { TimelineNode } from '../blocks/HistoricalTimelineBlock';
import { EventPickerModal, EventSelectionPayload, normalizePickedEvent } from '../blocks/EventPickerModal';
import { TimelineLayoutStrategy } from '../../strategies/timeline-layout.strategy';
import { TimelineSceneStrategy } from '../../strategies/timeline-scene.strategy';
import type { ArticleItem } from '@/services/entities/article.service';
import { MoveDirection } from '../quiz/QuizQuestionEditors';
import { TipTapContent } from '../TipTapContent';

interface TimelineBlockItemEditorProps {
  data: TimelineBlockData;
  onChange: (updates: Partial<TimelineBlockData>) => void;
}

let nodeCounter = 0;
const getUniqueNodeId = () => {
  nodeCounter += 1;
  return `node_${Date.now()}_${nodeCounter}`;
};

export function TimelineBlockItemEditor({ data, onChange }: TimelineBlockItemEditorProps) {
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);
  const [mediaPanelNodeIdx, setMediaPanelNodeIdx] = useState<number | null>(null);

  const nodes = useMemo(() => data.nodes || [], [data.nodes]);
  const displayConfig = data.displayConfig || {
    sceneStyle: 'MUSEUM_SPLIT',
    dateFormat: 'YEAR_ONLY',
    sortOrder: 'CHRONOLOGICAL',
    showDescription: true,
    showImage: true,
    showLocation: false,
    showRole: true,
  };

  const sceneStyle = displayConfig.sceneStyle || 'MUSEUM_SPLIT';
  const showImage = displayConfig.showImage !== false;
  const showLocation = Boolean(displayConfig.showLocation);
  const isReverseSort = displayConfig.sortOrder === 'REVERSE_CHRONOLOGICAL';

  const handleUpdateNodes = (newNodes: TimelineNode[]) => {
    onChange({ nodes: newNodes });
  };

  const handleAddManualNode = () => {
    const defaultTitle = 'Mốc sự kiện mới';
    const defaultDesc = 'Nhập diễn biến, bối cảnh và ý nghĩa lịch sử tại đây. Bôi đen chữ để định dạng hoặc gắn liên kết ở cột phải...';
    const newNode: TimelineNode = {
      id: getUniqueNodeId(),
      year: '1975',
      title: defaultTitle,
      description: defaultDesc,
      contentHtml: `<h3>${defaultTitle}</h3><p>${defaultDesc}</p>`,
      isManual: true,
    };
    const next = [...nodes, newNode];
    handleUpdateNodes(next);
  };

  const handleSelectEvent = (event: ArticleItem | EventSelectionPayload) => {
    const norm = normalizePickedEvent(event);

    // Chống trùng sự kiện
    const isDuplicate = nodes.some(
      (n) =>
        (norm.eventId && n.eventId === norm.eventId) ||
        (n.title.trim().toLowerCase() === norm.title.trim().toLowerCase() &&
          String(n.year) === String(norm.year))
    );
    if (isDuplicate) {
      alert(`Sự kiện "${norm.title}" (${norm.year}) đã tồn tại trên dòng thời gian này.`);
      return;
    }

    const summaryText = norm.summary || 'Sự kiện lịch sử trọng đại.';
    const newNode: TimelineNode = {
      id: getUniqueNodeId(),
      year: String(norm.year || 'Lịch sử'),
      title: norm.title,
      description: summaryText,
      contentHtml: `<h3>${norm.title}</h3><p>${summaryText}</p>`,
      eventId: norm.eventId,
      locationName: (event as any).locationName || (norm as any).locationName,
      thumbnailUrl: (event as any).imageUrl || (norm as any).thumbnailUrl,
      mediaCaption: norm.title,
      isManual: false,
    };
    handleUpdateNodes([...nodes, newNode]);
  };

  const handleNodeFieldChange = (idx: number, updates: Partial<TimelineNode>) => {
    const next = nodes.map((n, i) => (i === idx ? { ...n, ...updates } : n));
    handleUpdateNodes(next);
  };

  const handleNodeRichTextChange = (idx: number, html: string) => {
    const current = nodes[idx];
    if (!current) return;
    const synced = TimelineSceneStrategy.syncNodeFromHtml(current, html);
    const next = nodes.map((n, i) => (i === idx ? synced : n));
    handleUpdateNodes(next);
  };

  const handleUploadLocalImage = (idx: number, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleNodeFieldChange(idx, {
          thumbnailUrl: reader.result,
          mediaCaption: nodes[idx]?.mediaCaption || nodes[idx]?.title || '',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteNode = (idx: number) => {
    if (nodes.length <= 1) {
      alert('Dòng thời gian cần có ít nhất một mốc sự kiện.');
      return;
    }
    handleUpdateNodes(nodes.filter((_, i) => i !== idx));
    if (mediaPanelNodeIdx === idx) {
      setMediaPanelNodeIdx(null);
    }
  };

  const handleMoveNode = (idx: number, direction: MoveDirection | 'UP' | 'DOWN') => {
    const targetIdx = direction === MoveDirection.UP ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= nodes.length) return;
    const copy = [...nodes];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    handleUpdateNodes(copy);
    if (mediaPanelNodeIdx === idx) {
      setMediaPanelNodeIdx(targetIdx);
    }
  };

  const orientation = data.orientation || TimelineOrientation.VERTICAL;
  const isHorizontal = TimelineLayoutStrategy.isHorizontal(orientation);

  const indexedNodes = useMemo(() => {
    const list = nodes.map((node, originalIdx) => ({ node, originalIdx }));
    if (isReverseSort) {
      list.reverse();
    }
    return list;
  }, [nodes, isReverseSort]);

  const cleanTitle =
    data.title && data.title !== 'Timeline — Dòng thời gian'
      ? data.title
      : 'Dòng thời gian lịch sử';

  return (
    <div data-testid="timeline-block-item-editor" className="space-y-5 font-sans">
      {/* 1. HEADER BIÊN NIÊN SỬ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-[22px] font-serif font-bold text-stone-900 tracking-tight leading-snug">
              {cleanTitle}
            </h3>
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md">
              {sceneStyle === 'CINEMATIC_BACKDROP' ? 'Phong cách Điện ảnh' : 'Phong cách Triển lãm'}
            </span>
          </div>
          <p className="text-base text-stone-600 mt-1 max-w-[65ch]">
            {data.subtitle ||
              `Trình bày câu chuyện lịch sử qua ${indexedNodes.length} phân cảnh theo trình tự thời gian.`}
          </p>
        </div>

        {/* Cụm nút thêm phân cảnh */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddManualNode}
            data-testid="btn-add-manual-node"
            className="px-3 py-1.5 text-sm font-medium text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 rounded-lg border border-stone-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mốc</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEventPickerOpen(true)}
            data-testid="btn-pick-timeline-event"
            className="px-3 py-1.5 text-sm font-medium text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 rounded-lg border border-stone-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Database className="w-4 h-4 text-stone-700" />
            <span>Chọn từ kho</span>
          </button>
        </div>
      </div>

      {/* 2. TRỤC DÒNG THỜI GIAN PHÂN CẢNH ĐA NĂNG (COMPOSITE STORY TIMELINE) */}
      <div
        className={
          isHorizontal
            ? 'overflow-x-auto flex flex-row gap-8 pt-4 pb-4 px-1 border-t border-stone-300 mt-4'
            : 'pl-6 border-l-2 border-stone-300 ml-2 space-y-8 my-4'
        }
        data-timeline-orientation={orientation}
      >
        {indexedNodes.map(({ node: n, originalIdx: idx }) => {
          const thumb = n.thumbnailUrl || n.mediaList?.[0]?.url || '';
          const isMediaOpen = mediaPanelNodeIdx === idx;
          const resolvedHtml = TimelineSceneStrategy.resolveNodeContentHtml(n);

          return (
            <div
              key={n.id || idx}
              data-testid={`timeline-node-${idx}`}
              className={`group/node transition-colors duration-150 ${
                isHorizontal ? 'min-w-[340px] max-w-[420px] shrink-0' : 'pb-6 border-b border-stone-200/80 last:border-b-0 last:pb-0'
              }`}
            >
              {/* THANH ĐIỀU KHIỂN MỐC THỜI GIAN (NIÊN ĐẠI + ĐỊA ĐIỂM + ĐÍNH KÈM ẢNH) */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <input
                    type="text"
                    value={n.year}
                    onChange={(e) => handleNodeFieldChange(idx, { year: e.target.value })}
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
                        onChange={(e) => handleNodeFieldChange(idx, { locationName: e.target.value })}
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

                {/* Thanh thao tác nhanh của phân cảnh */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid={`btn-node-media-${idx}`}
                    onClick={() => setMediaPanelNodeIdx(isMediaOpen ? null : idx)}
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
                      onClick={() => handleMoveNode(idx, 'UP')}
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
                  {idx < nodes.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMoveNode(idx, 'DOWN')}
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
                    onClick={() => handleDeleteNode(idx)}
                    title="Xóa mốc sự kiện"
                    className="p-1.5 text-stone-700 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* KHUNG ĐÍNH KÈM ẢNH TƯ LIỆU / ẢNH NỀN TRỰC TIẾP TRONG PHÂN CẢNH */}
              {isMediaOpen && (
                <div className="mb-4 p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Tư liệu hình ảnh của mốc {n.year}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMediaPanelNodeIdx(null)}
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
                      onChange={(e) => handleNodeFieldChange(idx, { thumbnailUrl: e.target.value })}
                      placeholder="Dán đường dẫn ảnh tư liệu (https://...)"
                      className="flex-1 min-w-[220px] text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 text-stone-900"
                    />
                    <label className="px-3 py-2 text-sm font-medium text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0">
                      <Upload className="w-4 h-4" />
                      <span>Tải ảnh lên</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadLocalImage(idx, e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                    {thumb && (
                      <button
                        type="button"
                        onClick={() => handleNodeFieldChange(idx, { thumbnailUrl: '', mediaCaption: '' })}
                        className="px-3 py-2 text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 border border-stone-300 rounded-lg cursor-pointer"
                      >
                        Gỡ ảnh
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={n.mediaCaption || ''}
                    onChange={(e) => handleNodeFieldChange(idx, { mediaCaption: e.target.value })}
                    placeholder="Chú thích ảnh tư liệu hoặc nguồn trích dẫn bảo tàng..."
                    className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 text-stone-800"
                  />
                </div>
              )}

              {/* THÂN PHÂN CẢNH: ĐIỀU PHỐI THEO PHONG CÁCH (CINEMATIC_BACKDROP vs MUSEUM_SPLIT) */}
              {sceneStyle === 'CINEMATIC_BACKDROP' && showImage && thumb ? (
                <div className="space-y-3">
                  {/* Khung đại cảnh Điện ảnh (Google Arts & Culture Story Backdrop) */}
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

                  {/* Vùng soạn thảo Văn bản Giàu định dạng hợp nhất */}
                  <div className="pt-1">
                    <TipTapContent
                      value={resolvedHtml}
                      onChange={(html) => handleNodeRichTextChange(idx, html)}
                      compact={true}
                      remoteToolbarOnly={true}
                      minHeightClass="min-h-[84px]"
                      placeholder="Nhập tiêu đề và câu chuyện lịch sử của mốc này..."
                    />
                  </div>
                </div>
              ) : (
                /* Phong cách Triển lãm Tư liệu (MUSEUM_SPLIT — Mặc định) */
                <div
                  className={
                    showImage && thumb && !isHorizontal
                      ? 'grid grid-cols-1 md:grid-cols-12 gap-6 items-start'
                      : 'space-y-3'
                  }
                >
                  {/* Cột Nội dung Văn bản Giàu định dạng (Kết nối trực tiếp với Bảng Thuộc tính Cột Phải) */}
                  <div className={showImage && thumb && !isHorizontal ? 'md:col-span-7' : 'w-full'}>
                    <TipTapContent
                      value={resolvedHtml}
                      onChange={(html) => handleNodeRichTextChange(idx, html)}
                      compact={true}
                      remoteToolbarOnly={true}
                      minHeightClass="min-h-[84px]"
                      placeholder="Nhập tiêu đề và diễn biến lịch sử tại đây..."
                    />
                  </div>

                  {/* Cột Khung Ảnh Tư liệu Triển lãm (nếu có ảnh) */}
                  {showImage && thumb && (
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
                          onChange={(e) => handleNodeFieldChange(idx, { mediaCaption: e.target.value })}
                          placeholder="Nhập chú thích ảnh tư liệu..."
                          className="w-full text-sm text-stone-700 italic bg-transparent focus:outline-none"
                        />
                      </figcaption>
                    </figure>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <EventPickerModal
        isOpen={isEventPickerOpen}
        onClose={() => setIsEventPickerOpen(false)}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
}
