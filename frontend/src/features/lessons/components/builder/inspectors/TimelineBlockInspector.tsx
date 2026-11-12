'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import {
  LessonBlockItem,
  TimelineBlockData,
  TimelineDisplayConfig,
  TimelineOrientation,
} from '../../../types/block-builder.types';
import { TimelineApiService, type TimelineItem } from '@/services/entities/timeline.service';
import { formatYear } from '@/utils/year-label';
import { createBlockUUID } from '../../../strategies/story-chapter-layout.strategy';
import { TypographyInspectorPanel } from './TypographyInspectorPanel';

enum TimelineInspectorTab {
  AXIS = 'AXIS',
  TYPOGRAPHY = 'TYPOGRAPHY',
}

interface TimelineBlockInspectorProps {
  block: TimelineBlockData;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

export function TimelineBlockInspector({
  block: tl,
  onUpdateBlock,
}: TimelineBlockInspectorProps) {
  const [activeTab, setActiveTab] = useState<TimelineInspectorTab>(TimelineInspectorTab.AXIS);
  const [timelines, setTimelines] = useState<TimelineItem[]>([]);
  const [importId, setImportId] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    TimelineApiService.list({ limit: 100 })
      .then((res) => setTimelines(res.items))
      .catch(() => setTimelines([]));
  }, []);

  /** Chép các mốc của 1 Dòng thời gian vào khối (thành mốc thủ công, sửa tiếp được). */
  const importFromTimeline = async () => {
    if (!importId) return;
    setImporting(true);
    try {
      const source = await TimelineApiService.get(importId);
      const imported = (source.nodes ?? []).map((n) => ({
        id: createBlockUUID(),
        year: formatYear(n.year),
        dateLabel: n.dateText ?? undefined,
        title: n.title,
        description: n.description ?? '',
        thumbnailUrl: n.imageUrl ?? undefined,
        eventId: n.articleId ?? undefined,
        isManual: true,
      }));
      onUpdateBlock(tl.id, {
        title: tl.title || source.title,
        sourceMode: 'MANUAL',
        nodes: [...(tl.nodes ?? []), ...imported],
      });
      setImportId('');
    } finally {
      setImporting(false);
    }
  };

  const orientation = tl.orientation || TimelineOrientation.VERTICAL;
  const displayConfig: TimelineDisplayConfig = tl.displayConfig || {
    sceneStyle: 'MUSEUM_SPLIT',
    dateFormat: 'YEAR_ONLY',
    sortOrder: 'CHRONOLOGICAL',
    showDescription: true,
    showImage: true,
    showLocation: false,
    showRole: true,
  };

  const updateDisplay = <K extends keyof TimelineDisplayConfig>(
    key: K,
    value: TimelineDisplayConfig[K]
  ) => {
    onUpdateBlock(tl.id, {
      displayConfig: { ...displayConfig, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab(TimelineInspectorTab.AXIS)}
          className={`py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === TimelineInspectorTab.AXIS
              ? 'bg-stone-900 text-white'
              : 'text-stone-800 hover:bg-white'
          }`}
        >
          Cấu hình trục
        </button>
        <button
          type="button"
          data-testid="btn-timeline-typography-tab"
          onClick={() => setActiveTab(TimelineInspectorTab.TYPOGRAPHY)}
          className={`py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === TimelineInspectorTab.TYPOGRAPHY
              ? 'bg-stone-900 text-white'
              : 'text-stone-800 hover:bg-white'
          }`}
        >
          Định dạng chữ
        </button>
      </div>

      {activeTab === TimelineInspectorTab.TYPOGRAPHY ? (
        <TypographyInspectorPanel />
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Tiêu đề khối
            </label>
            <input
              type="text"
              value={tl.title || ''}
              onChange={(e) => onUpdateBlock(tl.id, { title: e.target.value })}
              placeholder="VD: Dòng thời gian lịch sử"
              className="w-full text-sm font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Phụ đề ngắn (tùy chọn)
            </label>
            <input
              type="text"
              value={tl.subtitle || ''}
              onChange={(e) =>
                onUpdateBlock(tl.id, { subtitle: e.target.value })
              }
              placeholder="VD: Các mốc sự kiện tiêu biểu"
              className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Phong cách phân cảnh
            </label>
            <select
              value={displayConfig.sceneStyle || 'MUSEUM_SPLIT'}
              onChange={(e) =>
                updateDisplay(
                  'sceneStyle',
                  e.target.value as TimelineDisplayConfig['sceneStyle']
                )
              }
              className="w-full text-sm font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 cursor-pointer text-stone-900"
            >
              <option value="MUSEUM_SPLIT">
                Triển lãm tư liệu (Nhân vật / Hiện vật)
              </option>
              <option value="CINEMATIC_BACKDROP">
                Điện ảnh toàn cảnh (Sự kiện / Chiến dịch)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Hướng hiển thị
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateBlock(tl.id, {
                    orientation: TimelineOrientation.HORIZONTAL,
                  })
                }
                className={`py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  orientation === TimelineOrientation.HORIZONTAL
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Ngang</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateBlock(tl.id, {
                    orientation: TimelineOrientation.VERTICAL,
                  })
                }
                className={`py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  orientation !== TimelineOrientation.HORIZONTAL
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Dọc</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">Nhập mốc từ dòng thời gian</label>
            <p className="text-xs text-stone-600">
              Chép các mốc của một Dòng thời gian đã có vào khối này (thêm vào cuối, sửa tiếp được).
            </p>
            <div className="flex gap-2">
              <select
                value={importId}
                onChange={(e) => setImportId(e.target.value)}
                className="min-w-0 flex-1 text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none"
              >
                <option value="">— Chọn dòng thời gian —</option>
                {timelines.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t._count?.nodes ?? 0} mốc)
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!importId || importing}
                onClick={importFromTimeline}
                className="shrink-0 px-3 py-2 text-sm font-semibold rounded-lg bg-stone-900 text-white disabled:opacity-40"
              >
                {importing ? 'Đang nhập…' : 'Nhập'}
              </button>
            </div>
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-stone-700 border-t border-stone-200 pt-3">
            Hiển thị
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Định dạng ngày
              </label>
              <select
                value={displayConfig.dateFormat || 'YEAR_ONLY'}
                onChange={(e) =>
                  updateDisplay(
                    'dateFormat',
                    e.target.value as TimelineDisplayConfig['dateFormat']
                  )
                }
                className="w-full text-sm px-2.5 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none"
              >
                <option value="YEAR_ONLY">Năm (1288)</option>
                <option value="FULL_DATE">Ngày đầy đủ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Sắp xếp
              </label>
              <select
                value={displayConfig.sortOrder || 'CHRONOLOGICAL'}
                onChange={(e) =>
                  updateDisplay(
                    'sortOrder',
                    e.target.value as TimelineDisplayConfig['sortOrder']
                  )
                }
                className="w-full text-sm px-2.5 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none"
              >
                <option value="CHRONOLOGICAL">Cũ → Mới</option>
                <option value="REVERSE_CHRONOLOGICAL">Mới → Cũ</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 text-sm font-medium text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={displayConfig.showImage !== false}
                onChange={(e) => updateDisplay('showImage', e.target.checked)}
                className="rounded text-stone-900 focus:ring-0 w-4 h-4"
              />
              <span>Hiển thị tư liệu hình ảnh</span>
            </label>

            <label className="flex items-center gap-2.5 text-sm font-medium text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(displayConfig.showLocation)}
                onChange={(e) =>
                  updateDisplay('showLocation', e.target.checked)
                }
                className="rounded text-stone-900 focus:ring-0 w-4 h-4"
              />
              <span>Hiển thị nhãn địa điểm</span>
            </label>
          </div>

        </div>
      )}
    </div>
  );
}
