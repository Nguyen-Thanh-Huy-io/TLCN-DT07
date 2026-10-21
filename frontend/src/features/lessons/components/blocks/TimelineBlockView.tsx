'use client';

import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { TIMELINE_BLOCK_CONSTANTS } from '../../constants/block-node.constants';
import { EventPickerModal } from './EventPickerModal';
import { AddBlockBelowMenu } from './AddBlockBelowMenu';
import { LessonBlockType } from '../../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../../strategies/lesson-block-insert.strategy';
import { HistoricalEventItem } from '@/services/entities/historical-event.service';
import { TimelineNode } from './HistoricalTimelineBlock';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

let nodeCounter = 0;
const getUniqueNodeId = () => {
  nodeCounter += 1;
  return `node_${nodeCounter}`;
};

export function TimelineBlockView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, editor, getPos } = props;
  const title = node.attrs.title || TIMELINE_BLOCK_CONSTANTS.TITLE;
  const subtitle = node.attrs.subtitle || TIMELINE_BLOCK_CONSTANTS.DEFAULT_SUBTITLE;
  
  // Parse nodes attribute safely
  let nodes: TimelineNode[] = [];
  try {
    if (typeof node.attrs.nodes === 'string') {
      nodes = JSON.parse(node.attrs.nodes);
    } else if (Array.isArray(node.attrs.nodes)) {
      nodes = node.attrs.nodes;
    }
  } catch {
    nodes = [];
  }

  if (nodes.length === 0) {
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
    ];
  }

  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);



  // Cập nhật danh sách nodes lên TipTap attributes
  const updateNodes = (newNodes: TimelineNode[]) => {
    updateAttributes({ nodes: JSON.stringify(newNodes) });
  };

  // Thêm mốc thủ công
  const handleAddManualNode = () => {
    const newNode: TimelineNode = {
      id: getUniqueNodeId(),
      year: '1975',
      title: 'Mốc sự kiện mới',
      description: 'Nhập tóm tắt diễn biến và ý nghĩa lịch sử tại đây...',
    };
    updateNodes([...nodes, newNode]);
  };

  // Thêm mốc từ kho tri thức HISGO
  const handleSelectEvent = (event: HistoricalEventItem) => {
    const newNode: TimelineNode = {
      id: getUniqueNodeId(),
      year: String(event.startYear || 'Lịch sử'),
      title: event.title,
      description: event.summary || event.description || 'Sự kiện lịch sử trọng đại.',
      eventId: event.id,
    };
    updateNodes([...nodes, newNode]);
  };

  // Chỉnh sửa từng trường của node
  const handleNodeChange = (idx: number, field: keyof TimelineNode, val: string) => {
    const next = nodes.map((n, i) => (i === idx ? { ...n, [field]: val } : n));
    updateNodes(next);
  };

  // Xóa một node
  const handleDeleteNode = (idx: number) => {
    if (nodes.length <= 1) {
      alert('Dòng thời gian cần có ít nhất một mốc sự kiện.');
      return;
    }
    const next = nodes.filter((_, i) => i !== idx);
    updateNodes(next);
  };

  // Di chuyển node lên / xuống
  const handleMoveNode = (idx: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= nodes.length) return;
    const copy = [...nodes];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    updateNodes(copy);
  };

  // Thêm khối ngay bên dưới
  const handleAddBlockBelow = (type: LessonBlockType) => {
    if (!editor) return;
    const snippet = lessonBlockInsertStrategy.generateSnippet(type);
    const currentPos = typeof getPos === 'function' ? getPos() : null;
    if (typeof currentPos === 'number') {
      const nextPos = currentPos + node.nodeSize;
      editor.chain().focus().insertContentAt(nextPos, snippet).run();
    } else {
      editor.chain().focus().insertContent(snippet).run();
    }
  };

  return (
    <NodeViewWrapper className="timeline-block-wrapper my-4">
      <div
        data-testid="block-timeline-container"
        className="border border-slate-200 rounded-2xl bg-white shadow-xs p-4 sm:p-5 transition-all hover:border-slate-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 relative group font-sans"
      >
        {/* Header khối */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-600">
              <Icon name={IconName.CLOCK} size={14} />
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              placeholder={TIMELINE_BLOCK_CONSTANTS.TITLE}
              data-testid="input-timeline-title"
              className="text-xs font-bold tracking-wider text-slate-800 uppercase bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={deleteNode}
              title={TIMELINE_BLOCK_CONSTANTS.BTN_DELETE_BLOCK}
              data-testid="btn-delete-timeline-block"
              className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
            >
              <Icon name={IconName.TRASH} size={14} />
            </button>
          </div>
        </div>

        {/* Phụ đề tiêu biểu */}
        <div className="mb-4">
          <input
            type="text"
            value={subtitle}
            onChange={(e) => updateAttributes({ subtitle: e.target.value })}
            placeholder={TIMELINE_BLOCK_CONSTANTS.DEFAULT_SUBTITLE}
            data-testid="input-timeline-subtitle"
            className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition font-serif"
          />
        </div>

        {/* Trục dòng thời gian thẳng đứng */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-200 ml-3 sm:ml-4 space-y-4 my-2">
          {nodes.map((n, idx) => (
            <div
              key={n.id || idx}
              data-testid={`timeline-node-${idx}`}
              className="relative group/node bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 transition shadow-2xs hover:shadow-xs"
            >
              {/* Điểm tròn đánh dấu trên trục */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-300 transition-transform group-hover/node:scale-125" />

              {/* Nút thao tác node (Lên / Xuống / Xóa) */}
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/node:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMoveNode(idx, 'UP')}
                    title="Chuyển lên trên"
                    className="p-1 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                  >
                    ▲
                  </button>
                )}
                {idx < nodes.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMoveNode(idx, 'DOWN')}
                    title="Chuyển xuống dưới"
                    className="p-1 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                  >
                    ▼
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteNode(idx)}
                  title="Xóa mốc này"
                  data-testid={`btn-delete-timeline-node-${idx}`}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Nội dung mốc (Năm + Tiêu đề + Mô tả) */}
              <div className="flex flex-col gap-1.5 pr-14">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={n.year}
                    onChange={(e) => handleNodeChange(idx, 'year', e.target.value)}
                    placeholder={TIMELINE_BLOCK_CONSTANTS.YEAR_PLACEHOLDER}
                    data-testid={`input-node-year-${idx}`}
                    className="w-20 text-xs font-bold text-blue-700 bg-blue-50/60 border border-blue-200/60 rounded px-2 py-0.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-slate-300">—</span>
                  <input
                    type="text"
                    value={n.title}
                    onChange={(e) => handleNodeChange(idx, 'title', e.target.value)}
                    placeholder={TIMELINE_BLOCK_CONSTANTS.TITLE_PLACEHOLDER}
                    data-testid={`input-node-title-${idx}`}
                    className="flex-1 text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition font-serif"
                  />
                </div>

                <textarea
                  rows={2}
                  value={n.description}
                  onChange={(e) => handleNodeChange(idx, 'description', e.target.value)}
                  placeholder={TIMELINE_BLOCK_CONSTANTS.DESC_PLACEHOLDER}
                  data-testid={`input-node-desc-${idx}`}
                  className="w-full text-xs text-slate-600 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-1.5 rounded transition leading-relaxed resize-y"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Thanh công cụ thêm mốc */}
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleAddManualNode}
            data-testid="btn-add-manual-node"
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>{TIMELINE_BLOCK_CONSTANTS.BTN_ADD_MANUAL}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEventPickerOpen(true)}
            data-testid="btn-pick-timeline-event"
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/80 transition cursor-pointer flex items-center gap-1.5"
          >
            <Icon name={IconName.SEARCH} size={12} />
            <span>{TIMELINE_BLOCK_CONSTANTS.BTN_PICK_EVENT}</span>
          </button>
        </div>

        {/* Gợi ý chân khối chuẩn img1.png */}
        <p
          data-testid="timeline-block-note"
          className="text-[11px] text-slate-400 mt-2 px-0.5 italic flex items-center gap-1"
        >
          <span>💡</span>
          <span>{TIMELINE_BLOCK_CONSTANTS.DEFAULT_NOTE}</span>
        </p>

        {/* Nút + Thêm khối bên dưới */}
        <AddBlockBelowMenu
          onSelectBlock={handleAddBlockBelow}
          buttonLabel={TIMELINE_BLOCK_CONSTANTS.BTN_ADD_BELOW}
        />

        {/* Modal chọn sự kiện */}
        <EventPickerModal
          isOpen={isEventPickerOpen}
          onClose={() => setIsEventPickerOpen(false)}
          onSelectEvent={handleSelectEvent}
        />
      </div>
    </NodeViewWrapper>
  );
}
