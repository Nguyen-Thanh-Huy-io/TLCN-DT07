'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Landmark,
  Globe,
  Search,
  X,
  Download,
  ScrollText,
} from 'lucide-react';
import { ArticleApiService, type ArticleItem } from '@/services/entities/article.service';
import { dateLabelOf } from '@/utils/common';
import { EntitySourceType, IEntitySearchResult } from '../../types/editor.types';
import { EntitySourceStrategyFactory } from '../../strategies/entity-sources/hisgo-internal-source.strategy';
import { useWikipediaDetailPicker } from './shared/useWikipediaDetailPicker';
import { WikiDetailPreviewPane } from './shared/WikiDetailPreviewPane';

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

/** Sự kiện chọn từ kho nội bộ = 1 bài viết (thường thuộc chuyên mục Sự kiện). */
export function normalizePickedEvent(event: ArticleItem | EventSelectionPayload): NormalizedEventPayload {
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
  const dateLabel = dateLabelOf(event);
  return {
    eventId: event.id,
    title: event.title,
    year: dateLabel || undefined,
    timeLocation: dateLabel,
    summary: event.summary || '',
    thumbnailUrl: event.coverImageUrl || undefined,
  };
}

interface EventPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: EventSelectionPayload | ArticleItem) => void;
}

/** Kết quả tra cứu trong kho sự kiện nội bộ: đang tải / rỗng / danh sách. */
function HisgoEventResults({
  loading,
  events,
  onPick,
}: {
  loading: boolean;
  events: ArticleItem[];
  onPick: (event: ArticleItem) => void;
}) {
  if (loading) {
    return (
      <div className="py-12 text-center text-base text-stone-600 flex items-center justify-center gap-2">
        <span>Đang tra cứu kho sự kiện...</span>
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-base text-stone-600">
        Không tìm thấy sự kiện phù hợp trong kho dữ liệu nội bộ. Hãy thử chuyển sang nguồn Wikipedia mở rộng.
      </div>
    );
  }
  return (
    <>
      {events.map((evt) => (
        <div
          key={evt.id}
          data-testid={`hisgo-event-item-${evt.id}`}
          onClick={() => {
            onPick(evt);
          }}
          className="py-3.5 hover:bg-stone-50 transition-colors cursor-pointer flex items-start justify-between gap-4 group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded bg-stone-900 text-white shrink-0">
                {dateLabelOf(evt) || 'Chưa rõ năm'}
              </span>
              <strong className="text-base font-bold text-stone-900 truncate">
                {evt.title}
              </strong>
            </div>
            <p className="text-base text-stone-600 line-clamp-2 leading-relaxed max-w-[65ch]">
              {evt.summary || 'Chưa có tóm tắt cho bài viết này.'}
            </p>
          </div>

          <button
            type="button"
            className="shrink-0 text-sm font-semibold px-3.5 py-2 rounded-lg bg-white border border-stone-300 text-stone-800 group-hover:bg-stone-900 group-hover:text-white group-hover:border-stone-900 transition-colors cursor-pointer"
          >
            Chọn
          </button>
        </div>
      ))}
    </>
  );
}

export const EventPickerModal: React.FC<EventPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
}) => {
  const [activeSource, setActiveSource] = useState<EntitySourceType>(EntitySourceType.HISGO);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  const [hisgoEvents, setHisgoEvents] = useState<ArticleItem[]>([]);
  const [loadingHisgo, setLoadingHisgo] = useState(false);

  const [wikiResults, setWikiResults] = useState<IEntitySearchResult[]>([]);
  const [loadingWikiList, setLoadingWikiList] = useState(false);

  const {
    selectedItemKey: selectedWikiKey,
    setSelectedItemKey: setSelectedWikiKey,
    previewDetail,
    loadingDetail,
    editPrimary: editTitle,
    setEditPrimary: setEditTitle,
    editSecondary: editTimeLoc,
    setEditSecondary: setEditTimeLoc,
    editSummary,
    setEditSummary,
    editImage: editThumb,
    resetPreview,
    loadDetail: loadWikiDetail,
    selectFirstWikiItemIfAny,
  } = useWikipediaDetailPicker();

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  const loadHisgoEvents = useCallback(async (query: string) => {
    try {
      setLoadingHisgo(true);
      const res = await ArticleApiService.list({
        search: query.trim() || undefined,
        limit: 25,
        sort: 'year',
      });
      setHisgoEvents(res.items || []);
    } catch (err) {
      console.error('Lỗi tải danh sách sự kiện:', err);
      setHisgoEvents([]);
    } finally {
      setLoadingHisgo(false);
    }
  }, []);

  const loadWikiEvents = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setWikiResults([]);
        resetPreview();
        return;
      }

      try {
        setLoadingWikiList(true);
        const strategy = EntitySourceStrategyFactory.getStrategy(EntitySourceType.WIKIPEDIA);
        const items = await strategy.search(trimmed);
        setWikiResults(items);
        selectFirstWikiItemIfAny(items, EntitySourceType.WIKIPEDIA);
      } catch (err) {
        console.error('Lỗi khi tra cứu sự kiện Wikipedia:', err);
        setWikiResults([]);
      } finally {
        setLoadingWikiList(false);
      }
    },
    [resetPreview, selectFirstWikiItemIfAny],
  );

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

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (isOpen) {
        setSearch('');
        resetPreview();
        if (activeSource === EntitySourceType.HISGO) {
          loadHisgoEvents('');
        }
      }
    });
  }, [isOpen, activeSource, loadHisgoEvents, resetPreview]);

  if (!isOpen || !mounted) return null;

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

  const modalNode = (
    <div
      data-testid="modal-event-picker"
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-stone-950/60 font-sans"
    >
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[88vh] shadow-lg flex flex-col overflow-hidden">
        {/* 1. Đầu hộp thoại */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="text-[22px] font-bold text-stone-900 leading-snug">
                Tra cứu &amp; Gợi ý Sự kiện Lịch sử
              </h3>
              <p className="text-sm text-stone-600 max-w-[65ch] mt-0.5">
                Tự động lấy mốc năm, ngày diễn biến, tóm tắt và ảnh tư liệu từ Kho dữ liệu hoặc Wikipedia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-600 hover:text-stone-950 p-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Thanh chuyển Nguồn dữ liệu */}
        <div className="px-6 py-3 bg-white border-b border-stone-200 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="tab-event-source-hisgo"
              onClick={() => {
                setActiveSource(EntitySourceType.HISGO);
                setSearch('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-2 cursor-pointer ${
                activeSource === EntitySourceType.HISGO
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Kho sự kiện nội bộ</span>
            </button>
            <button
              type="button"
              data-testid="tab-event-source-wikipedia"
              onClick={() => {
                setActiveSource(EntitySourceType.WIKIPEDIA);
                setSearch('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-2 cursor-pointer ${
                activeSource === EntitySourceType.WIKIPEDIA
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Wikipedia &amp; Wikidata</span>
            </button>
          </div>

          <span className="text-sm text-stone-600">
            {activeSource === EntitySourceType.HISGO
              ? 'Dữ liệu sự kiện nội bộ đã được kiểm chứng'
              : 'Tra cứu sự kiện mở rộng toàn cầu'}
          </span>
        </div>

        {/* 3. Ô tìm kiếm */}
        <div className="px-6 py-3 border-b border-stone-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeSource === EntitySourceType.HISGO
                  ? 'Tìm kiếm sự kiện theo tên hoặc năm (Ví dụ: 1945, Bạch Đằng)...'
                  : 'Tìm kiếm sự kiện trên Wikipedia (Ví dụ: Chiến thắng Bạch Đằng, Hiệp định Genève 1954)...'
              }
              data-testid="input-search-event"
              className="w-full text-sm pl-10 pr-9 py-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 font-medium text-stone-900 placeholder:text-stone-600 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-950 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Danh sách kết quả */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[380px] max-h-[460px]">
          {activeSource === EntitySourceType.HISGO ? (
            <div className="w-full overflow-y-auto divide-y divide-stone-200 px-6">
              <HisgoEventResults
                loading={loadingHisgo}
                events={hisgoEvents}
                onPick={(evt) => {
                  onSelectEvent(evt);
                  onClose();
                }}
              />
            </div>
          ) : (
            <>
              <div className="w-full md:w-[360px] border-r border-stone-200 overflow-y-auto divide-y divide-stone-200 px-4 bg-white">
                {loadingWikiList ? (
                  <div className="p-12 text-center text-base text-stone-600">
                    Đang tìm kiếm sự kiện trên Wikipedia...
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
                          loadWikiDetail(item.title, EntitySourceType.WIKIPEDIA);
                        }}
                        className={`py-3 px-2 transition-colors cursor-pointer flex items-start gap-3 ${
                          isSelected ? 'bg-stone-100' : 'hover:bg-stone-50'
                        }`}
                      >
                        {item.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-11 h-11 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <span className="w-11 h-11 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5" />
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <strong className="text-sm font-bold text-stone-900 truncate">
                              {item.title}
                            </strong>
                          </div>
                          <p className="text-sm text-stone-600 line-clamp-2 mt-0.5 leading-relaxed max-w-[65ch]">
                            {item.description || 'Chưa có mô tả chi tiết'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center space-y-1">
                    <p className="text-base font-semibold text-stone-800 max-w-[65ch]">
                      Nhập từ khóa để tra cứu sự kiện
                    </p>
                    <p className="text-sm text-stone-600 max-w-[65ch]">
                      Ví dụ: &ldquo;Chiến thắng Bạch Đằng&rdquo;, &ldquo;Cách mạng tháng Tám&rdquo;...
                    </p>
                  </div>
                )}
              </div>

              <WikiDetailPreviewPane
                loadingDetail={loadingDetail}
                loadingLabel="Đang trích xuất dữ liệu từ Wikidata..."
                previewDetail={previewDetail}
                headerTitle="Dữ liệu sự kiện trích xuất từ Wikipedia"
                sourceLinkLabel="Mở bài gốc ↗"
                primaryLabel="Tên sự kiện"
                primaryValue={editTitle}
                onChangePrimary={setEditTitle}
                primaryTestId="input-preview-event-title"
                secondaryLabel="Thời gian & Địa điểm"
                secondaryPlaceholder="VD: Năm 938 • Sông Bạch Đằng"
                secondaryValue={editTimeLoc}
                onChangeSecondary={setEditTimeLoc}
                secondaryTestId="input-preview-event-timeloc"
                summaryLabel="Tóm tắt diễn biến (Tối đa 500 ký tự)"
                summaryValue={editSummary}
                onChangeSummary={setEditSummary}
                summaryTestId="textarea-preview-event-summary"
                imageUrl={editThumb}
                fallbackIcon={
                  <span className="w-16 h-16 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-7 h-7" />
                  </span>
                }
                wikidataBadgeTestId="badge-event-wikidata-id"
                datesBadgeTestId="badge-event-dates"
                datesBadgePrefix="Mốc thời gian"
                footerHint="Dữ liệu sẽ được điền vào dòng thời gian"
                applyBtnLabel={
                  <>
                    <Download className="w-4 h-4" />
                    <span>Nhập nhanh vào sự kiện</span>
                  </>
                }
                applyBtnTestId="btn-apply-wiki-event"
                onApply={handleApplyWikiEvent}
                emptyState={
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <ScrollText className="w-8 h-8 text-stone-600 mb-3" />
                    <p className="text-base font-semibold text-stone-800 max-w-[65ch]">
                      Chọn một sự kiện từ danh sách bên trái để xem trước
                    </p>
                    <p className="text-sm text-stone-600 max-w-xs mt-1">
                      Hệ thống sẽ tự động trích xuất ngày bắt đầu, ngày kết thúc và diễn biến chính từ Wikidata.
                    </p>
                  </div>
                }
              />
            </>
          )}
        </div>

        {/* 5. Chân hộp thoại */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-white flex items-center justify-between text-sm text-stone-700">
          <span>
            {activeSource === EntitySourceType.HISGO
              ? `Tìm thấy ${hisgoEvents.length} sự kiện trong kho nội bộ`
              : `Tìm thấy ${wikiResults.length} kết quả từ Wikipedia`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-sm font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
