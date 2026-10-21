'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { EventPickerModal } from './EventPickerModal';
import { HistoricalEventItem } from '@/services/entities/historical-event.service';

export interface TimelineNodeMedia {
  id?: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  caption?: string;
}

export interface TimelineNode {
  id: string;
  year: string;
  title: string;
  description: string;
  eventId?: string;
  detailContent?: string;
  mediaList?: TimelineNodeMedia[];
}

export interface HistoricalTimelineBlockProps {
  id: string;
  title?: string;
  subtitle?: string;
  nodes?: TimelineNode[];
  isSelected?: boolean;
  isPreview?: boolean;
  onChange?: (data: { title: string; subtitle: string; nodes: TimelineNode[] }) => void;
  onSelect?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
}

export const HistoricalTimelineBlock: React.FC<HistoricalTimelineBlockProps> = ({
  id,
  title = 'Timeline — Dòng thời gian',
  subtitle = 'Các mốc lịch sử tiêu biểu',
  nodes = [
    {
      id: '1',
      year: '1945',
      title: 'Tuyên bố độc lập',
      description: 'Sự kiện đánh dấu bước ngoặt lịch sử.',
    },
    {
      id: '2',
      year: '1954',
      title: 'Chiến thắng Điện Biên Phủ',
      description: 'Mốc sự kiện tiếp theo trên dòng thời gian.',
    },
  ],
  isSelected = false,
  isPreview = false,
  onChange,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentSubtitle, setCurrentSubtitle] = useState(subtitle);
  const [currentNodes, setCurrentNodes] = useState<TimelineNode[]>(nodes);
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);

  // Cập nhật và bắn sự kiện lên component cha
  const updateState = (newTitle: string, newSubtitle: string, newNodes: TimelineNode[]) => {
    setCurrentTitle(newTitle);
    setCurrentSubtitle(newSubtitle);
    setCurrentNodes(newNodes);
    if (onChange) {
      onChange({ title: newTitle, subtitle: newSubtitle, nodes: newNodes });
    }
  };

  // Thêm mốc mới thủ công
  const handleAddManualNode = () => {
    const newNode: TimelineNode = {
      id: `node_${Date.now()}`,
      year: '1975',
      title: 'Mốc sự kiện mới',
      description: 'Nhập tóm tắt diễn biến và ý nghĩa lịch sử tại đây...',
    };
    const updated = [...currentNodes, newNode];
    updateState(currentTitle, currentSubtitle, updated);
  };

  // Thêm mốc chọn từ kho tri thức HISGO
  const handleSelectEventFromStore = (event: HistoricalEventItem) => {
    const newNode: TimelineNode = {
      id: `node_${Date.now()}`,
      year: String(event.startYear || 'Lịch sử'),
      title: event.title,
      description: event.summary || event.description || 'Sự kiện lịch sử trọng đại.',
      eventId: event.id,
    };
    const updated = [...currentNodes, newNode];
    updateState(currentTitle, currentSubtitle, updated);
  };

  // Chỉnh sửa từng thuộc tính của một node
  const handleNodeChange = (index: number, field: keyof TimelineNode, value: string) => {
    const updated = currentNodes.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateState(currentTitle, currentSubtitle, updated);
  };

  // Xóa một mốc
  const handleRemoveNode = (index: number) => {
    const updated = currentNodes.filter((_, idx) => idx !== index);
    updateState(currentTitle, currentSubtitle, updated);
  };

  return (
    <div
      onClick={onSelect}
      className={`relative my-4 transition-all duration-150 rounded-2xl ${
        isPreview
          ? 'p-6 bg-white border border-slate-100 shadow-2xs'
          : isSelected
          ? 'p-6 bg-blue-50/20 border-2 border-blue-500 shadow-md ring-4 ring-blue-50'
          : 'p-6 bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs'
      }`}
    >
      {/* Thanh công cụ nổi khi khối đang được chọn (img6.png) */}
      {!isPreview && isSelected && (
        <div className="absolute -top-3.5 right-4 z-10 flex items-center gap-1 bg-white border border-blue-400 rounded-lg px-2 py-1 shadow-sm text-xs font-semibold text-slate-700">
          <span className="text-[11px] text-blue-600 font-bold px-1.5 py-0.5 rounded bg-blue-50 mr-1 flex items-center gap-1">
            <Icon name={IconName.CLOCK} size={12} />
            Timeline
          </span>
          {onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Di chuyển khối lên trên"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Di chuyển khối xuống dưới"
            >
              ↓
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-rose-50 text-rose-600 rounded ml-1"
              title="Xóa khối này"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Header của Khối Timeline (Khớp img1.png) */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
          <span className="text-blue-600">
            <Icon name={IconName.CALENDAR} size={16} />
          </span>
          {isPreview ? (
            <span>{currentTitle}</span>
          ) : (
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => updateState(e.target.value, currentSubtitle, currentNodes)}
              className="font-bold text-xs md:text-sm uppercase tracking-wide text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-600 focus:outline-none w-64"
            />
          )}
        </div>

        {/* Phụ đề / Tiêu đề danh sách mốc (img1.png: "Các mốc lịch sử tiêu biểu") */}
        {isPreview ? (
          <h4 className="text-base md:text-lg font-bold text-slate-900 font-serif mb-1">
            {currentSubtitle}
          </h4>
        ) : (
          <input
            type="text"
            value={currentSubtitle}
            onChange={(e) => updateState(currentTitle, e.target.value, currentNodes)}
            placeholder="Các mốc lịch sử tiêu biểu..."
            className="text-base md:text-lg font-bold text-slate-900 font-serif bg-transparent border-b border-slate-200 focus:border-blue-600 focus:outline-none w-full"
          />
        )}
      </div>

      {/* Trục Dòng Thời Gian Trực Quan (Vertical Timeline Spine) */}
      <div className="relative pl-6 space-y-6 my-4 before:absolute before:left-[11px] before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-blue-200">
        {currentNodes.map((node, index) => (
          <div key={node.id} className="relative group">
            {/* Chấm mốc tròn (Timeline Bullet Marker) */}
            <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white shadow-xs z-10" />

            {/* Khung nội dung mốc thời gian */}
            <div className="bg-slate-50/60 hover:bg-blue-50/40 border border-slate-200/70 hover:border-blue-300 rounded-xl p-3.5 transition">
              {/* Dòng 1: Năm — Tiêu đề sự kiện */}
              <div className="flex items-center justify-between gap-2 mb-1">
                {isPreview ? (
                  <div className="text-sm md:text-base font-bold text-slate-900 font-serif">
                    <span className="text-blue-700 font-sans mr-1">{node.year}</span>
                    <span className="text-slate-400 mx-1.5 font-sans">—</span>
                    <span>{node.title}</span>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={node.year}
                      onChange={(e) => handleNodeChange(index, 'year', e.target.value)}
                      placeholder="1945"
                      className="w-20 font-mono font-bold text-sm text-blue-700 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-slate-400 font-bold">—</span>
                    <input
                      type="text"
                      value={node.title}
                      onChange={(e) => handleNodeChange(index, 'title', e.target.value)}
                      placeholder="Tuyên bố độc lập..."
                      className="flex-1 font-bold text-sm text-slate-900 font-serif bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                )}

                {/* Nút xóa mốc khi soạn thảo */}
                {!isPreview && (
                  <button
                    type="button"
                    onClick={() => handleRemoveNode(index)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition text-xs"
                    title="Xóa mốc này"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dòng 2: Mô tả diễn biến và ý nghĩa */}
              {isPreview ? (
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-sans pl-0.5">
                  {node.description}
                </p>
              ) : (
                <textarea
                  rows={2}
                  value={node.description}
                  onChange={(e) => handleNodeChange(index, 'description', e.target.value)}
                  placeholder="Mô tả ngắn về diễn biến và ý nghĩa của mốc lịch sử..."
                  className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded p-2 focus:outline-none focus:border-blue-600 mt-1.5 resize-none leading-relaxed"
                />
              )}

              {/* Huy hiệu liên kết thực thể (nếu được chọn từ HISGO) */}
              {node.eventId && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                  <span>✓ Đã liên kết với thực thể sự kiện HISGO</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Thanh hành động thêm mốc & ghi chú (img1.png) */}
      {!isPreview && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddManualNode}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1"
            >
              <span>+ Thêm mốc thời gian</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEventPickerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Chọn sự kiện từ kho tri thức HISGO</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Có thể chọn các sự kiện đã tồn tại trong kho tri thức HISGO, thay vì nhập lại dữ liệu.
          </p>
        </div>
      )}

      {/* Modal tra cứu và chọn sự kiện từ HISGO */}
      <EventPickerModal
        isOpen={isEventPickerOpen}
        onClose={() => setIsEventPickerOpen(false)}
        onSelectEvent={handleSelectEventFromStore}
      />
    </div>
  );
};
