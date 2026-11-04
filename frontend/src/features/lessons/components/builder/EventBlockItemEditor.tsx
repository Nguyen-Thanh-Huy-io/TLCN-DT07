'use client';

import React, { useState } from 'react';
import { EventBlockData } from '../../types/block-builder.types';
import { EventPickerModal, EventSelectionPayload } from '../blocks/EventPickerModal';
import { HistoricalEventItem } from '@/services/entities/historical-event.service';
import { EVENT_BLOCK_CONSTANTS } from '../../constants/block-node.constants';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

interface EventBlockItemEditorProps {
  data: EventBlockData;
  onChange: (updates: Partial<EventBlockData>) => void;
}

export function EventBlockItemEditor({ data, onChange }: EventBlockItemEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  const handleSelectEvent = (event: EventSelectionPayload | HistoricalEventItem) => {
    if ('sourceType' in event) {
      onChange({
        eventId: event.eventId,
        title: event.title,
        timeLocation: event.timeLocation,
        summary: event.summary,
        thumbnailUrl: event.thumbnailUrl,
        wikidataId: event.wikidataId,
        sourceUrl: event.sourceUrl,
      });
    } else {
      const timeLoc = [
        event.startYear ? `Năm ${event.startYear}` : '',
        event.historicalLocation?.name || '',
      ]
        .filter(Boolean)
        .join(' • ');

      onChange({
        eventId: event.id,
        title: event.title,
        timeLocation: timeLoc || `${event.startYear || ''}`,
        summary: event.summary || event.description || '',
        thumbnailUrl: event.thumbnailUrl || '',
      });
    }
  };

  return (
    <div data-testid="event-block-item-editor" className="space-y-3 font-sans">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            data-testid="block-event-title"
            className="text-xs font-bold tracking-wider text-slate-700 uppercase"
          >
            {EVENT_BLOCK_CONSTANTS.TITLE}
          </span>
          {data.eventId && (
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Kho sự kiện HISGO</span>
            </span>
          )}
          {data.wikidataId && (
            <span
              data-testid="badge-event-wikidata"
              className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Wikidata: {data.wikidataId}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          data-testid="btn-pick-event"
          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center gap-1"
        >
          <Icon name={IconName.SEARCH} size={12} />
          <span>
            {data.eventId || data.wikidataId
              ? EVENT_BLOCK_CONSTANTS.BTN_CHANGE_EVENT
              : EVENT_BLOCK_CONSTANTS.BTN_PICK_EVENT}
          </span>
        </button>
      </div>

      {/* Thẻ Sự kiện chuẩn img3.png */}
      <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200/60">
            {EVENT_BLOCK_CONSTANTS.SUB_LABEL}
          </div>
          <span
            data-testid="event-summary-counter"
            className={`text-[10px] font-mono font-semibold ${
              (data.summary?.length || 0) >= 500
                ? 'text-rose-600 font-bold'
                : (data.summary?.length || 0) > 450
                ? 'text-amber-600'
                : 'text-slate-400'
            }`}
          >
            {(data.summary?.length || 0)}/500 ký tự
          </span>
        </div>

        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={EVENT_BLOCK_CONSTANTS.NAME_PLACEHOLDER}
          data-testid="input-event-name"
          className="w-full text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition font-serif"
        />

        <input
          type="text"
          value={data.timeLocation}
          onChange={(e) => onChange({ timeLocation: e.target.value })}
          placeholder={EVENT_BLOCK_CONSTANTS.TIME_LOC_PLACEHOLDER}
          data-testid="input-event-timeloc"
          className="w-full text-xs font-semibold text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition"
        />

        <div className="relative">
          <textarea
            rows={3}
            value={data.summary}
            maxLength={500}
            onChange={(e) => onChange({ summary: e.target.value })}
            placeholder={EVENT_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
            data-testid="input-event-summary"
            className="w-full text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-1.5 pb-5 rounded transition leading-relaxed resize-y"
          />
          <div
            data-testid="event-summary-counter"
            className={`text-[10px] text-right px-1 select-none font-medium ${
              (data.summary?.length || 0) >= 480 ? 'text-amber-600 font-bold' : 'text-slate-400'
            }`}
          >
            {data.summary?.length || 0}/500 ký tự
          </div>
        </div>
      </div>

      <p
        data-testid="event-block-difference-note"
        className="text-[11px] text-slate-500 px-1 italic"
      >
        {EVENT_BLOCK_CONSTANTS.DIFFERENCE_NOTE}
      </p>

      {/* Chi tiết tuỳ chọn — ẩn mặc định ở bản Xem trước, chỉ xổ ra khi bấm "Xem chi tiết".
          Dùng khi 500 ký tự tóm tắt không đủ để viết đầy đủ diễn biến sự kiện. */}
      <button
        type="button"
        onClick={() => setIsDetailExpanded(!isDetailExpanded)}
        className="text-xs font-semibold text-slate-500 hover:text-amber-700 px-1 flex items-center gap-1 cursor-pointer"
      >
        <span>{isDetailExpanded ? '▲ Thu gọn' : '▼ Thêm chi tiết diễn biến'}</span>
      </button>
      {isDetailExpanded && (
        <div className="animate-in fade-in-50 duration-150">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Chi tiết diễn biến (tuỳ chọn — chỉ hiện khi bấm &quot;Xem chi tiết&quot;):
          </label>
          <textarea
            rows={4}
            value={data.detailContent || ''}
            onChange={(e) => onChange({ detailContent: e.target.value })}
            placeholder="Viết đầy đủ diễn biến sự kiện... (không giới hạn độ dài, hỗ trợ HTML cơ bản)"
            data-testid="input-event-detail"
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 focus:border-amber-500 focus:outline-none p-2 rounded-lg transition leading-relaxed resize-y"
          />
        </div>
      )}

      <EventPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
}
