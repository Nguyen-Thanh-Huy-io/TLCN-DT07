'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HistoricalEventApiService, HistoricalEventItem } from '@/services/entities/historical-event.service';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { EntitySourceType, IEntityDetailPreview, IEntitySearchResult } from '../../types/entity-source.types';
import { EntitySourceStrategyFactory } from '../../factories/entity-source-strategy.factory';

export interface EventSelectionPayload {
  title: string;
  timeLocation: string;
  summary: string;
  thumbnailUrl?: string;
  eventId?: string;
  wikidataId?: string;
  sourceUrl?: string;
  sourceType: 'HISGO' | 'WIKIPEDIA';
}

export interface NormalizedEventPayload {
  eventId?: string;
  title: string;
  year?: string;
  timeLocation?: string;
  summary: string;
  thumbnailUrl?: string;
}

export function normalizePickedEvent(event: HistoricalEventItem | EventSelectionPayload): NormalizedEventPayload {
  if ('sourceType' in event) {
    return {
      eventId: event.eventId,
      title: event.title,
      year: event.timeLocation || '',
      timeLocation: event.timeLocation,
      summary: event.summary,
      thumbnailUrl: event.thumbnailUrl,
    };
  }
  const timeLoc = [
    event.startYear ? `Năm ${event.startYear}` : '',
    event.historicalLocation?.name || '',
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    eventId: event.id,
    title: event.title,
    year: event.startYear ? String(event.startYear) : undefined,
    timeLocation: timeLoc || `${event.startYear || ''}`,
    summary: event.summary || event.description || '',
    thumbnailUrl: event.thumbnailUrl || undefined,
  };
}

interface EventPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: EventSelectionPayload | HistoricalEventItem) => void;
}

export const EventPickerModal: React.FC<EventPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
}) => {
  const [activeSource, setActiveSource] = useState<EntitySourceType>(EntitySourceType.HISGO);
  const [search, setSearch] = useState('');
  
  // State nguồn nội bộ HISGO
  const [hisgoEvents, setHisgoEvents] = useState<HistoricalEventItem[]>([]);
  const [loadingHisgo, setLoadingHisgo] = useState(false);

  // State nguồn Wikipedia & Wikidata
  const [wikiResults, setWikiResults] = useState<IEntitySearchResult[]>([]);
  const [loadingWikiList, setLoadingWikiList] = useState(false);
  const [selectedWikiKey, setSelectedWikiKey] = useState<string | null>(null);
  const [previewDetail, setPreviewDetail] = useState<IEntityDetailPreview | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form edit trên bảng xem trước
  const [editTitle, setEditTitle] = useState('');
  const [editTimeLoc, setEditTimeLoc] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editThumb, setEditThumb] = useState('');

  // Tải danh sách sự kiện từ HISGO nội bộ
  const loadHisgoEvents = useCallback(async (query: string) => {
    try {
      setLoadingHisgo(true);
      const res = await HistoricalEventApiService.getEvents({
        search: query.trim() || undefined,
        limit: 25,
      });
      setHisgoEvents(res.items || []);
    } catch (err) {
      console.error('Failed to load events for picker:', err);
      setHisgoEvents([]);
    } finally {
      setLoadingHisgo(false);
    }
  }, []);

  // Tải danh sách sự kiện từ Wikipedia
  const loadWikiEvents = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setWikiResults([]);
      setPreviewDetail(null);
      setSelectedWikiKey(null);
      return;
    }

    try {
      setLoadingWikiList(true);
      const strategy = EntitySourceStrategyFactory.getStrategy(EntitySourceType.WIKIPEDIA);
      const items = await strategy.search(trimmed);
      setWikiResults(items);

      if (items.length > 0) {
        const first = items[0];
        setSelectedWikiKey(first.title);
        loadWikiDetail(first.title);
      } else {
        setPreviewDetail(null);
        setSelectedWikiKey(null);
      }
    } catch (err) {
      console.error('Lỗi khi tra cứu sự kiện Wikipedia:', err);
      setWikiResults([]);
    } finally {
      setLoadingWikiList(false);
    }
  }, []);

  // Tải chi tiết sự kiện từ Wikipedia & Wikidata
  const loadWikiDetail = async (title: string) => {
    try {
      setLoadingDetail(true);
      const strategy = EntitySourceStrategyFactory.getStrategy(EntitySourceType.WIKIPEDIA);
      const detail = await strategy.getDetail(title);
      if (detail) {
        setPreviewDetail(detail);
        setEditTitle(detail.name);
        setEditTimeLoc(detail.years);
        setEditSummary(detail.summary);
        setEditThumb(detail.avatarUrl);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết sự kiện Wikipedia:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (activeSource === EntitySourceType.HISGO) {
        loadHisgoEvents(search);
      } else {
        loadWikiEvents(search);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [isOpen, search, activeSource, loadHisgoEvents, loadWikiEvents]);

  // Reset khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setPreviewDetail(null);
      setSelectedWikiKey(null);
      if (activeSource === EntitySourceType.HISGO) {
        loadHisgoEvents('');
      }
    }
  }, [isOpen, activeSource, loadHisgoEvents]);

  if (!isOpen) return null;

  // Áp dụng dữ liệu xem trước từ Wikipedia vào khối sự kiện
  const handleApplyWikiEvent = () => {
    if (!editTitle.trim()) return;

    onSelectEvent({
      title: editTitle.trim(),
      timeLocation: editTimeLoc.trim(),
      summary: editSummary.trim(),
      thumbnailUrl: editThumb.trim(),
      wikidataId: previewDetail?.wikidataId,
      sourceUrl: previewDetail?.sourceUrl,
      sourceType: 'WIKIPEDIA',
    });
    onClose();
  };

  return (
    <div
      data-testid="modal-event-picker"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shadow-2xs">
              <Icon name={IconName.CALENDAR} size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Tra cứu &amp; Gợi ý Sự kiện Lịch sử
              </h3>
              <p className="text-[11px] text-slate-500">
                Tự động lấy mốc năm, ngày diễn biến, tóm tắt và ảnh tư liệu từ Kho HISGO hoặc Wikipedia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Đóng modal"
          >
            ✕
          </button>
        </div>

        {/* Thanh chuyển Tabs (Kho HISGO vs Wikipedia & Wikidata) */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-semibold">
            <button
              type="button"
              data-testid="tab-event-source-hisgo"
              onClick={() => {
                setActiveSource(EntitySourceType.HISGO);
                setSearch('');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSource === EntitySourceType.HISGO
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏛️</span>
              <span>Kho sự kiện HISGO</span>
            </button>
            <button
              type="button"
              data-testid="tab-event-source-wikipedia"
              onClick={() => {
                setActiveSource(EntitySourceType.WIKIPEDIA);
                setSearch('');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSource === EntitySourceType.WIKIPEDIA
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌐</span>
              <span>Wikipedia &amp; Wikidata</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold uppercase">
                Mở rộng
              </span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 italic">
            {activeSource === EntitySourceType.HISGO
              ? 'Dữ liệu sự kiện nội bộ đã được kiểm chứng'
              : 'Tra cứu sự kiện mở rộng toàn cầu (vi.wikipedia.org & wikidata.org)'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="p-3 px-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeSource === EntitySourceType.HISGO
                  ? 'Tìm kiếm sự kiện theo tên hoặc năm (Ví dụ: Điện Biên Phủ, 1945, Ấp Bắc)...'
                  : 'Tìm kiếm sự kiện trên Wikipedia (Ví dụ: Chiến dịch Điện Biên Phủ, Hiệp định Genève 1954)...'
              }
              data-testid="input-search-event"
              className="w-full text-xs pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 font-medium shadow-2xs transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Body phân nhánh theo Tab */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[380px] max-h-[460px]">
          {/* TAB 1: KHO SỰ KIỆN NỘI BỘ HISGO */}
          {activeSource === EntitySourceType.HISGO ? (
            <div className="w-full overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
              {loadingHisgo ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" />
                  <span>Đang tra cứu kho sự kiện HISGO...</span>
                </div>
              ) : hisgoEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Không tìm thấy sự kiện phù hợp trong kho dữ liệu nội bộ. Hãy thử tab Wikipedia mở rộng.
                </div>
              ) : (
                hisgoEvents.map((evt) => (
                  <div
                    key={evt.id}
                    data-testid={`hisgo-event-item-${evt.id}`}
                    onClick={() => {
                      onSelectEvent(evt);
                      onClose();
                    }}
                    className="pt-2 first:pt-0 p-2.5 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200 transition cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          Năm {evt.startYear}
                        </span>
                        <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate group-hover:text-amber-700">
                          {evt.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {evt.summary || evt.description || 'Chưa có mô tả chi tiết cho sự kiện này.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 transition shadow-2xs"
                    >
                      Chọn ↵
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* TAB 2: WIKIPEDIA & WIKIDATA (MASTER - DETAIL 2 PANEL) */
            <>
              {/* Panel Trái: Danh sách gợi ý từ Wikipedia */}
              <div className="w-full md:w-[360px] border-r border-slate-100 overflow-y-auto p-3 space-y-2 bg-slate-50/40">
                {loadingWikiList ? (
                  <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tìm kiếm sự kiện trên Wikipedia...</span>
                  </div>
                ) : wikiResults.length > 0 ? (
                  wikiResults.map((item) => {
                    const isSelected = selectedWikiKey === item.title;

                    return (
                      <div
                        key={item.id}
                        data-testid={`event-picker-item-${item.id}`}
                        onClick={() => {
                          setSelectedWikiKey(item.title);
                          loadWikiDetail(item.title);
                        }}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/70 shadow-2xs'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-slate-400">
                          {item.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon name={IconName.CALENDAR} size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded shrink-0">
                              Wiki
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {item.description || 'Chưa có mô tả chi tiết'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-600">Nhập từ khóa để tra cứu sự kiện</p>
                    <p className="text-[11px]">Ví dụ: &ldquo;Chiến dịch Điện Biên Phủ&rdquo;, &ldquo;Chiến thắng Ba Tơ&rdquo;...</p>
                  </div>
                )}
              </div>

              {/* Panel Phải: Xem trước và bóc tách dữ liệu sự kiện */}
              <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col justify-between">
                {loadingDetail ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 gap-2">
                    <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang bóc tách dữ liệu từ Wikidata &amp; Commons...</span>
                  </div>
                ) : previewDetail ? (
                  <div className="space-y-3.5">
                    {/* Header preview & badges */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span>👁️</span>
                        <span>Dữ liệu sự kiện bóc tách từ Wikipedia &amp; Wikidata</span>
                      </span>
                      {previewDetail.sourceUrl && (
                        <a
                          href={previewDetail.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-blue-600 hover:underline"
                        >
                          Mở bài gốc Wikipedia ↗
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {previewDetail.wikidataId && (
                        <a
                          href={`https://www.wikidata.org/wiki/${previewDetail.wikidataId}`}
                          target="_blank"
                          rel="noreferrer"
                          data-testid="badge-event-wikidata-id"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
                        >
                          <span>📊 Wikidata:</span>
                          <span className="font-mono font-bold">{previewDetail.wikidataId}</span>
                        </a>
                      )}
                      {previewDetail.years && (
                        <span
                          data-testid="badge-event-dates"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md"
                        >
                          <span>📅 Mốc thời gian:</span>
                          <span className="font-bold">{previewDetail.years}</span>
                        </span>
                      )}
                      {previewDetail.imageLicense && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                          <span>🖼️ Bản quyền ảnh:</span>
                          <span className="font-medium truncate max-w-[130px]">{previewDetail.imageLicense}</span>
                        </span>
                      )}
                    </div>

                    {/* Ảnh tư liệu + Tên sự kiện + Thời gian */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                        {editThumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={editThumb}
                            alt={editTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Icon name={IconName.CALENDAR} size={28} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Tên sự kiện:
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            data-testid="input-preview-event-title"
                            className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Thời gian &amp; Địa điểm:
                          </label>
                          <input
                            type="text"
                            value={editTimeLoc}
                            onChange={(e) => setEditTimeLoc(e.target.value)}
                            placeholder="Vd: 13/03/1954 – 07/05/1954 • Điện Biên"
                            data-testid="input-preview-event-timeloc"
                            className="w-full text-xs font-semibold text-blue-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tóm tắt diễn biến */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Tóm tắt diễn biến (Tối đa 500 ký tự):
                        </label>
                        <span
                          className={`text-[10px] font-mono font-semibold ${
                            editSummary.length >= 500
                              ? 'text-rose-600 font-bold'
                              : editSummary.length > 450
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {editSummary.length}/500 ký tự
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={editSummary}
                        maxLength={500}
                        onChange={(e) => setEditSummary(e.target.value)}
                        data-testid="textarea-preview-event-summary"
                        className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:border-blue-600 leading-relaxed resize-y"
                      />
                    </div>

                    {/* Nút hành động */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 italic">
                        Dữ liệu sẽ được tự động điền vào khối Sự kiện trên bài học
                      </span>
                      <button
                        type="button"
                        data-testid="btn-apply-wiki-event"
                        onClick={handleApplyWikiEvent}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>📥 Nhập nhanh vào sự kiện</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400">
                    <span className="text-3xl mb-2">📜</span>
                    <p className="font-semibold text-slate-600">
                      ← Chọn một sự kiện từ danh sách bên trái để xem trước
                    </p>
                    <p className="text-[11px] max-w-xs mt-1">
                      Hệ thống sẽ tự động bóc tách ngày bắt đầu, ngày kết thúc và diễn biến chính từ Wikidata.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            {activeSource === EntitySourceType.HISGO
              ? `Tìm thấy ${hisgoEvents.length} sự kiện trong kho HISGO`
              : `Tìm thấy ${wikiResults.length} kết quả từ Wikipedia`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
