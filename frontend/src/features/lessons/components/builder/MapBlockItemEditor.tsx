'use client';

import React from 'react';
import { MapBlockData } from '../../types/block-builder.types';

interface MapBlockItemEditorProps {
  data: MapBlockData;
  onChange: (updates: Partial<MapBlockData>) => void;
}

/**
 * Editor cho khối "Bản đồ" — mô tả địa bàn/địa điểm lịch sử gắn với bài học.
 * Hiện chỉ lưu tên địa danh + mô tả dạng text (chưa tích hợp bản đồ tương tác thật),
 * đủ để hiển thị dạng chú dẫn (xem `LessonBlockFactory.blockToHtml` case MAP).
 */
export function MapBlockItemEditor({ data, onChange }: MapBlockItemEditorProps) {
  return (
    <div className="space-y-2" data-testid="map-block-editor">
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          Tên địa danh
        </label>
        <input
          type="text"
          value={data.locationName}
          onChange={(e) => onChange({ locationName: e.target.value })}
          placeholder="Ví dụ: Lòng chảo Điện Biên Phủ..."
          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          Mô tả địa bàn
        </label>
        <textarea
          rows={3}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Mô tả vị trí địa lý, vai trò chiến lược, đặc điểm địa hình..."
          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}
