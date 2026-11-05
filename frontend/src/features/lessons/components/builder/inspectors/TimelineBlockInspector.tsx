'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import {
  LessonBlockItem,
  TimelineBlockData,
  TimelineDisplayConfig,
  TimelineFilterConfig,
  TimelineOrientation,
} from '../../../types/block-builder.types';
import { TaxonomyApiService, TaxonomyTermItem } from '@/services/entities/taxonomy.service';
import { TaxonomyGroupCode } from '@/constants/enums';
import { TypographyInspectorPanel } from './TypographyInspectorPanel';

interface TimelineBlockInspectorProps {
  block: TimelineBlockData;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

export function TimelineBlockInspector({
  block: tl,
  onUpdateBlock,
}: TimelineBlockInspectorProps) {
  const [activeTab, setActiveTab] = useState<'AXIS' | 'TYPOGRAPHY'>('AXIS');
  const [eventTypeTerms, setEventTypeTerms] = useState<TaxonomyTermItem[]>([]);
  const [predicateTerms, setPredicateTerms] = useState<TaxonomyTermItem[]>([]);

  useEffect(() => {
    TaxonomyApiService.getGroups([TaxonomyGroupCode.EVENT_TYPE, TaxonomyGroupCode.PREDICATE])
      .then((groups) => {
        setEventTypeTerms(groups.find((g) => g.code === TaxonomyGroupCode.EVENT_TYPE)?.terms ?? []);
        setPredicateTerms(groups.find((g) => g.code === TaxonomyGroupCode.PREDICATE)?.terms ?? []);
      })
      .catch((err) => console.warn('Failed to fetch timeline filter taxonomies:', err));
  }, []);

  const sourceMode = tl.sourceMode || 'HYBRID';
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
  const filterConfig: TimelineFilterConfig = tl.filterConfig || {
    statusPublishedOnly: true,
  };
  const maxEvents = tl.maxEvents ?? 10;

  const updateDisplay = <K extends keyof TimelineDisplayConfig>(
    key: K,
    value: TimelineDisplayConfig[K]
  ) => {
    onUpdateBlock(tl.id, {
      displayConfig: { ...displayConfig, [key]: value },
    });
  };

  const updateFilter = <K extends keyof TimelineFilterConfig>(
    key: K,
    value: TimelineFilterConfig[K]
  ) => {
    onUpdateBlock(tl.id, {
      filterConfig: { ...filterConfig, [key]: value },
    });
  };

  const toggleFilterListValue = (key: 'eventTypes' | 'relationTypes', code: string) => {
    const current = filterConfig[key] ?? [];
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    updateFilter(key, next);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('AXIS')}
          className={`py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'AXIS'
              ? 'bg-stone-900 text-white'
              : 'text-stone-800 hover:bg-white'
          }`}
        >
          Cấu hình trục
        </button>
        <button
          type="button"
          data-testid="btn-timeline-typography-tab"
          onClick={() => setActiveTab('TYPOGRAPHY')}
          className={`py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'TYPOGRAPHY'
              ? 'bg-stone-900 text-white'
              : 'text-stone-800 hover:bg-white'
          }`}
        >
          Định dạng chữ
        </button>
      </div>

      {activeTab === 'TYPOGRAPHY' ? (
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

          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Nguồn dữ liệu
            </label>
            <select
              value={sourceMode}
              onChange={(e) =>
                onUpdateBlock(tl.id, {
                  sourceMode: e.target.value as TimelineBlockData['sourceMode'],
                })
              }
              className="w-full text-sm font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 cursor-pointer"
            >
              <option value="HYBRID">Kết hợp tự động và thủ công</option>
              <option value="AUTO">Tự động lấy sự kiện liên quan</option>
              <option value="MANUAL">Chọn thủ công</option>
            </select>
          </div>

          {(sourceMode === 'AUTO' || sourceMode === 'HYBRID') && (
            <div className="pt-3 border-t border-stone-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Bộ lọc sự kiện tự động
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Từ năm
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 1200"
                    value={filterConfig.startYear ?? ''}
                    onChange={(e) =>
                      updateFilter(
                        'startYear',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Đến năm
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 1300"
                    value={filterConfig.endYear ?? ''}
                    onChange={(e) =>
                      updateFilter(
                        'endYear',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {eventTypeTerms.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Loại sự kiện (trang Thời kỳ)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {eventTypeTerms.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleFilterListValue('eventTypes', t.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                          filterConfig.eventTypes?.includes(t.id)
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {predicateTerms.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Quan hệ liên quan (trang Thực thể)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {predicateTerms.map((t) => (
                      <button
                        key={t.code}
                        type="button"
                        onClick={() => toggleFilterListValue('relationTypes', t.code)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                          filterConfig.relationTypes?.includes(t.code)
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-800">
                <input
                  type="checkbox"
                  checked={filterConfig.statusPublishedOnly !== false}
                  onChange={(e) =>
                    updateFilter('statusPublishedOnly', e.target.checked)
                  }
                  className="rounded text-stone-900 focus:ring-0 w-4 h-4"
                />
                <span>Chỉ lấy sự kiện đã xuất bản</span>
              </label>
            </div>
          )}

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

          <div className="pt-3 border-t border-stone-200">
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Số sự kiện tối đa
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxEvents}
              onChange={(e) =>
                onUpdateBlock(tl.id, {
                  maxEvents: Number(e.target.value) || 10,
                })
              }
              className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
