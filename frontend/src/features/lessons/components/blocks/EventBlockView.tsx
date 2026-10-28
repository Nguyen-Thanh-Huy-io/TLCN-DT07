'use client';

import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { EVENT_BLOCK_CONSTANTS } from '../../constants/block-node.constants';
import { EventPickerModal, EventSelectionPayload, normalizePickedEvent } from './EventPickerModal';
import { AddBlockBelowMenu } from './AddBlockBelowMenu';
import { LessonBlockType } from '../../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../../strategies/lesson-block-insert.strategy';
import { HistoricalEventItem } from '@/services/entities/historical-event.service';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export function EventBlockView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, editor, getPos } = props;
  const { eventId, title, timeLocation, summary, thumbnailUrl } = node.attrs;

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Chọn sự kiện từ kho tri thức HISGO hoặc Wikipedia
  const handleSelectEvent = (event: HistoricalEventItem | EventSelectionPayload) => {
    const norm = normalizePickedEvent(event);
    updateAttributes({
      eventId: norm.eventId || '',
      title: norm.title,
      timeLocation: norm.timeLocation || '',
      summary: norm.summary || '',
      thumbnailUrl: norm.thumbnailUrl || '',
    });
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
    <NodeViewWrapper className="event-block-wrapper my-4">
      <div
        data-testid="block-event-container"
        className="border border-slate-200 rounded-2xl bg-white shadow-xs p-4 transition-all hover:border-slate-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 relative group"
      >
        {/* Header khối */}
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-600">
              <Icon name={IconName.CALENDAR} size={14} />
            </span>
            <span
              data-testid="block-event-title"
              className="text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              {EVENT_BLOCK_CONSTANTS.TITLE}
            </span>
            {eventId && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Liên kết kho sự kiện</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              data-testid="btn-pick-event"
              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center gap-1"
            >
              <Icon name={IconName.SEARCH} size={12} />
              <span>
                {eventId
                  ? EVENT_BLOCK_CONSTANTS.BTN_CHANGE_EVENT
                  : EVENT_BLOCK_CONSTANTS.BTN_PICK_EVENT}
              </span>
            </button>
            <button
              type="button"
              onClick={deleteNode}
              title={EVENT_BLOCK_CONSTANTS.BTN_DELETE_BLOCK}
              data-testid="btn-delete-event-block"
              className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
            >
              <Icon name={IconName.TRASH} size={14} />
            </button>
          </div>
        </div>

        {/* Khối Sự kiện (Theo cấu trúc và phong cách img3.png) */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-2">
          {/* Nhãn MỐC LỊCH SỬ */}
          <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200/60">
            {EVENT_BLOCK_CONSTANTS.SUB_LABEL}
          </div>

          {/* Tên sự kiện lịch sử */}
          <input
            type="text"
            value={title || ''}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder={EVENT_BLOCK_CONSTANTS.NAME_PLACEHOLDER}
            data-testid="input-event-name"
            className="w-full text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition font-serif"
          />

          {/* Thời gian • Địa điểm */}
          <input
            type="text"
            value={timeLocation || ''}
            onChange={(e) => updateAttributes({ timeLocation: e.target.value })}
            placeholder={EVENT_BLOCK_CONSTANTS.TIME_LOC_PLACEHOLDER}
            data-testid="input-event-timeloc"
            className="w-full text-xs font-semibold text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition"
          />

          {/* Mô tả ngắn về diễn biến và ý nghĩa của sự kiện */}
          <textarea
            rows={2}
            value={summary || ''}
            onChange={(e) => updateAttributes({ summary: e.target.value })}
            placeholder={EVENT_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
            data-testid="input-event-summary"
            className="w-full text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-1.5 rounded transition leading-relaxed resize-y"
          />
        </div>

        {/* Ghi chú chân khối chuẩn img3.png */}
        <p
          data-testid="event-block-difference-note"
          className="text-[11px] text-slate-500 mt-2 px-1 italic"
        >
          {EVENT_BLOCK_CONSTANTS.DIFFERENCE_NOTE}
        </p>

        {/* Nút + Thêm khối bên dưới */}
        <AddBlockBelowMenu
          onSelectBlock={handleAddBlockBelow}
          buttonLabel={EVENT_BLOCK_CONSTANTS.BTN_ADD_BELOW}
        />

        {/* Modal chọn sự kiện */}
        <EventPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectEvent={handleSelectEvent}
        />
      </div>
    </NodeViewWrapper>
  );
}
