'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Database } from 'lucide-react';
import { TimelineBlockData, TimelineOrientation, TimelineNode } from '../../types/block-builder.types';
import { EventPickerModal, EventSelectionPayload, normalizePickedEvent } from '../blocks/EventPickerModal';
import { TimelineLayoutStrategy } from '../../strategies/timeline-scene.strategy';
import type { ArticleItem } from '@/services/entities/article.service';
import { MoveDirection } from '../quiz/QuizQuestionEditors';
import { TimelineNodeItemCard } from './TimelineNodeItemCard';

export enum TimelineSceneStyleEnum {
  MUSEUM_SPLIT = 'MUSEUM_SPLIT',
  CINEMATIC_BACKDROP = 'CINEMATIC_BACKDROP',
}

export enum TimelineSortOrderEnum {
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  REVERSE_CHRONOLOGICAL = 'REVERSE_CHRONOLOGICAL',
}

interface EventMetadataPreview {
  locationName?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

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
    sceneStyle: TimelineSceneStyleEnum.MUSEUM_SPLIT,
    dateFormat: 'YEAR_ONLY',
    sortOrder: TimelineSortOrderEnum.CHRONOLOGICAL,
    showDescription: true,
    showImage: true,
    showLocation: false,
    showRole: true,
  };

  const sceneStyle = displayConfig.sceneStyle || TimelineSceneStyleEnum.MUSEUM_SPLIT;
  const showImage = displayConfig.showImage !== false;
  const showLocation = Boolean(displayConfig.showLocation);
  const isReverseSort = displayConfig.sortOrder === TimelineSortOrderEnum.REVERSE_CHRONOLOGICAL;

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
    const eventPreview = event as unknown as EventMetadataPreview;
    const normPreview = norm as unknown as EventMetadataPreview;
    const locName = eventPreview.locationName || normPreview.locationName || norm.timeLocation || '';
    const thumbUrl = eventPreview.imageUrl || normPreview.imageUrl || norm.thumbnailUrl || normPreview.thumbnailUrl || '';

    const newNode: TimelineNode = {
      id: getUniqueNodeId(),
      year: String(norm.year || 'Lịch sử'),
      title: norm.title,
      description: summaryText,
      contentHtml: `<h3>${norm.title}</h3><p>${summaryText}</p>`,
      eventId: norm.eventId,
      locationName: locName,
      thumbnailUrl: thumbUrl,
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
    const synced = { ...current, contentHtml: html };
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

  const handleMoveNode = (idx: number, direction: MoveDirection) => {
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
              {sceneStyle === TimelineSceneStyleEnum.CINEMATIC_BACKDROP ? 'Phong cách Điện ảnh' : 'Phong cách Triển lãm'}
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

      {/* 2. TRỤC DÒNG THỜI GIAN PHÂN CẢNH ĐA NĂNG */}
      <div
        className={
          isHorizontal
            ? 'overflow-x-auto flex flex-row gap-8 pt-4 pb-4 px-1 border-t border-stone-300 mt-4'
            : 'pl-6 border-l-2 border-stone-300 ml-2 space-y-8 my-4'
        }
        data-timeline-orientation={orientation}
      >
        {indexedNodes.map(({ node: n, originalIdx: idx }) => (
          <TimelineNodeItemCard
            key={n.id || idx}
            node={n}
            originalIdx={idx}
            totalCount={nodes.length}
            isHorizontal={isHorizontal}
            sceneStyle={sceneStyle}
            showImage={showImage}
            showLocation={showLocation}
            isMediaOpen={mediaPanelNodeIdx === idx}
            onToggleMedia={() => setMediaPanelNodeIdx(mediaPanelNodeIdx === idx ? null : idx)}
            onCloseMedia={() => setMediaPanelNodeIdx(null)}
            onFieldChange={(updates) => handleNodeFieldChange(idx, updates)}
            onRichTextChange={(html) => handleNodeRichTextChange(idx, html)}
            onUploadImage={(file) => handleUploadLocalImage(idx, file)}
            onMove={(dir) => handleMoveNode(idx, dir)}
            onDelete={() => handleDeleteNode(idx)}
          />
        ))}
      </div>

      <EventPickerModal
        isOpen={isEventPickerOpen}
        onClose={() => setIsEventPickerOpen(false)}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
}
