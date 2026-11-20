'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import {
  INSPECTOR_SEG_BTN_ACTIVE,
  INSPECTOR_SEG_BTN_IDLE,
  INSPECTOR_SEG_GROUP_CLS,
  INSPECTOR_SELECT_CLS,
  InspectorAccordionSection,
  InspectorFieldRow,
  InspectorToggleSwitch,
} from '@/components/common/TextStyleControls';
import {
  LessonBlockItem,
  TimelineBlockData,
  TimelineDateFormat,
  TimelineDisplayConfig,
  TimelineOrientation,
  TimelineSceneStyle,
  TimelineSortOrder,
} from '../../../types/block-builder.types';
import {
  TIMELINE_DATE_FORMAT_OPTIONS,
  TIMELINE_SORT_ORDER_OPTIONS,
} from '../../../constants/lesson.constants';
import { TIMELINE_SCENE_STYLE_OPTIONS } from '../../../strategies/timeline-scene.strategy';
import { TimelineApiService, type TimelineItem } from '@/services/entities/timeline.service';
import { formatYear } from '@/utils/common';
import { createBlockUUID } from '../../../strategies/row-layout.strategy';
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
    sceneStyle: TimelineSceneStyle.MUSEUM_SPLIT,
    dateFormat: TimelineDateFormat.YEAR_ONLY,
    sortOrder: TimelineSortOrder.CHRONOLOGICAL,
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
    <div className="space-y-3.5 text-xs text-slate-700">
      <div className={`grid grid-cols-2 ${INSPECTOR_SEG_GROUP_CLS}`}>
        <button
          type="button"
          onClick={() => setActiveTab(TimelineInspectorTab.AXIS)}
          className={`grid h-8 place-items-center transition cursor-pointer ${
            activeTab === TimelineInspectorTab.AXIS
              ? INSPECTOR_SEG_BTN_ACTIVE
              : INSPECTOR_SEG_BTN_IDLE
          }`}
        >
          Cấu hình trục
        </button>
        <button
          type="button"
          data-testid="btn-timeline-typography-tab"
          onClick={() => setActiveTab(TimelineInspectorTab.TYPOGRAPHY)}
          className={`grid h-8 place-items-center transition cursor-pointer ${
            activeTab === TimelineInspectorTab.TYPOGRAPHY
              ? INSPECTOR_SEG_BTN_ACTIVE
              : INSPECTOR_SEG_BTN_IDLE
          }`}
        >
          Định dạng chữ
        </button>
      </div>

      {activeTab === TimelineInspectorTab.TYPOGRAPHY ? (
        <TypographyInspectorPanel hideEditorialLayout />
      ) : (
        <div className="space-y-3.5">
          <InspectorAccordionSection title="Trục & Bố cục">
            <InspectorFieldRow label="Phân cảnh">
              <select
                aria-label="Phong cách phân cảnh"
                value={displayConfig.sceneStyle || TimelineSceneStyle.MUSEUM_SPLIT}
                onChange={(e) =>
                  updateDisplay(
                    'sceneStyle',
                    e.target.value as TimelineSceneStyle
                  )
                }
                className={`${INSPECTOR_SELECT_CLS} w-40`}
              >
                {TIMELINE_SCENE_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label.split(' (')[0]}
                  </option>
                ))}
              </select>
            </InspectorFieldRow>

            <InspectorFieldRow label="Hướng trục">
              <div className={`grid w-36 grid-cols-2 ${INSPECTOR_SEG_GROUP_CLS}`}>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateBlock(tl.id, {
                      orientation: TimelineOrientation.HORIZONTAL,
                    })
                  }
                  className={`flex h-7 items-center justify-center gap-1 text-[11px] transition cursor-pointer ${
                    orientation === TimelineOrientation.HORIZONTAL
                      ? INSPECTOR_SEG_BTN_ACTIVE
                      : INSPECTOR_SEG_BTN_IDLE
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Ngang</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateBlock(tl.id, {
                      orientation: TimelineOrientation.VERTICAL,
                    })
                  }
                  className={`flex h-7 items-center justify-center gap-1 text-[11px] transition cursor-pointer ${
                    orientation !== TimelineOrientation.HORIZONTAL
                      ? INSPECTOR_SEG_BTN_ACTIVE
                      : INSPECTOR_SEG_BTN_IDLE
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Dọc</span>
                </button>
              </div>
            </InspectorFieldRow>

            <InspectorFieldRow label="Định dạng ngày">
              <select
                aria-label="Định dạng ngày"
                value={displayConfig.dateFormat || TimelineDateFormat.YEAR_ONLY}
                onChange={(e) =>
                  updateDisplay(
                    'dateFormat',
                    e.target.value as TimelineDateFormat
                  )
                }
                className={`${INSPECTOR_SELECT_CLS} w-36`}
              >
                {TIMELINE_DATE_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </InspectorFieldRow>

            <InspectorFieldRow label="Thứ tự">
              <select
                aria-label="Sắp xếp mốc"
                value={displayConfig.sortOrder || TimelineSortOrder.CHRONOLOGICAL}
                onChange={(e) =>
                  updateDisplay(
                    'sortOrder',
                    e.target.value as TimelineSortOrder
                  )
                }
                className={`${INSPECTOR_SELECT_CLS} w-36`}
              >
                {TIMELINE_SORT_ORDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </InspectorFieldRow>

            <InspectorFieldRow label="Hiện ảnh tư liệu">
              <InspectorToggleSwitch
                ariaLabel="Hiển thị tư liệu hình ảnh"
                checked={displayConfig.showImage !== false}
                onChange={(next) => updateDisplay('showImage', next)}
              />
            </InspectorFieldRow>

            <InspectorFieldRow label="Hiện địa điểm">
              <InspectorToggleSwitch
                ariaLabel="Hiển thị nhãn địa điểm"
                checked={Boolean(displayConfig.showLocation)}
                onChange={(next) => updateDisplay('showLocation', next)}
              />
            </InspectorFieldRow>
          </InspectorAccordionSection>

          <InspectorAccordionSection title="Nhập từ kho dữ liệu">
            <select
              aria-label="Chọn dòng thời gian để nhập"
              value={importId}
              onChange={(e) => setImportId(e.target.value)}
              className={`${INSPECTOR_SELECT_CLS} w-full py-1.5`}
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
              className="w-full py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer transition-colors"
            >
              {importing ? 'Đang nhập…' : 'Nhập các mốc đã chọn'}
            </button>
          </InspectorAccordionSection>
        </div>
      )}
    </div>
  );
}
