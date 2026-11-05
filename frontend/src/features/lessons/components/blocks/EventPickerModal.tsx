'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Landmark,
  Globe,
  Search,
  X,
  Eye,
  Database,
  Image as ImageIcon,
  Download,
  ScrollText,
  ExternalLink,
} from 'lucide-react';
import { ArticleApiService, type ArticleItem } from '@/services/entities/article.service';
import { dateLabelOf } from '@/utils/year-label';
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

export const EventPickerModal: React.FC<EventPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
}) => {
  const [activeSource, setActiveSource] = useState<EntitySourceType>(EntitySourceType.HISGO);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  // State nguồn nội bộ HISGO
  const [hisgoEvents, setHisgoEvents] = useState<ArticleItem[]>([]);
  const [loadingHisgo, setLoadingHisgo] = useState(false);

  // State nguồn Wikipedia & Wikidata
  const [wikiResults, setWikiResults] = useState<IEntitySearchResult[]>([]);
  const [loadingWikiList, setLoadingWikiList] = useState(false);
  const [selectedWikiKey, setSelectedWikiKey] = useState<string | null>(null);
  const [previewDetail, setPreviewDetail] = useState<IEntityDetailPreview | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Biểu mẫu chỉnh sửa trên bảng xem trước
  const [editTitle, setEditTitle] = useState('');
  const [editTimeLoc, setEditTimeLoc] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editThumb, setEditThumb] = useState('');

  useEffect(() => {
    setMounted(true);
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

  const loadWikiDetail = useCallback(async (title: string) => {
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
  }, []);

  const loadWikiEvents = useCallback(
    async (query: string) => {
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
    },
    [loadWikiDetail]
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
    if (isOpen) {
      setSearch('');
      setPreviewDetail(null);
      setSelectedWikiKey(null);
      if (activeSource === EntitySourceType.HISGO) {
        loadHisgoEvents('');
      }
    }
  }, [isOpen, activeSource, loadHisgoEvents]);

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

        {/* 2. Thanh chuyển Nguồn dữ liệu (Phẳng, không lồng card) */}
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
                  ? 'Tìm kiếm sự kiện theo tên hoặc năm (Ví dụ: Điện Biên Phủ, 1945, Bạch Đằng)...'
                  : 'Tìm kiếm sự kiện trên Wikipedia (Ví dụ: Chiến dịch Điện Biên Phủ, Hiệp định Genève 1954)...'
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

        {/* 4. Danh sách kết quả (Phẳng, dùng đường kẻ chia dòng thay vì lồng thẻ card) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[380px] max-h-[460px]">
          {activeSource === EntitySourceType.HISGO ? (
            <div className="w-full overflow-y-auto divide-y divide-stone-200 px-6">
              {loadingHisgo ? (
                <div className="py-12 text-center text-base text-stone-600 flex items-center justify-center gap-2">
                  <span>Đang tra cứu kho sự kiện...</span>
                </div>
              ) : hisgoEvents.length === 0 ? (
                <div className="py-12 text-center text-base text-stone-600">
                  Không tìm thấy sự kiện phù hợp trong kho dữ liệu nội bộ. Hãy thử chuyển sang nguồn Wikipedia mở rộng.
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
                ))
              )}
            </div>
          ) : (
            /* NGUỒN 2: WIKIPEDIA & WIKIDATA */
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
                          loadWikiDetail(item.title);
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
                      Ví dụ: &ldquo;Chiến dịch Điện Biên Phủ&rdquo;, &ldquo;Chiến thắng Bạch Đằng&rdquo;...
                    </p>
                  </div>
                )}
              </div>

              {/* Cột phải: Xem trước dữ liệu sự kiện */}
              <div className="flex-1 overflow-y-auto p-5 bg-white flex flex-col justify-between">
                {loadingDetail ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-base text-stone-600">
                    Đang trích xuất dữ liệu từ Wikidata...
                  </div>
                ) : previewDetail ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 flex-wrap gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>Dữ liệu sự kiện trích xuất từ Wikipedia</span>
                      </span>
                      {previewDetail.sourceUrl && (
                        <a
                          href={previewDetail.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Mở bài gốc</span>
                          <ExternalLink className="w-3.5 h-3.5" />
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
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-md"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>Mã Wikidata: {previewDetail.wikidataId}</span>
                        </a>
                      )}
                      {previewDetail.years && (
                        <span
                          data-testid="badge-event-dates"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-900 px-2.5 py-1 rounded-md"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Mốc thời gian: {previewDetail.years}</span>
                        </span>
                      )}
                      {previewDetail.imageLicense && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-900 px-2.5 py-1 rounded-md">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[160px]">{previewDetail.imageLicense}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-4">
                      {editThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editThumb}
                          alt={editTitle}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-16 h-16 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
                          <Calendar className="w-7 h-7" />
                        </span>
                      )}

                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                            Tên sự kiện
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            data-testid="input-preview-event-title"
                            className="w-full text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                            Thời gian &amp; Địa điểm
                          </label>
                          <input
                            type="text"
                            value={editTimeLoc}
                            onChange={(e) => setEditTimeLoc(e.target.value)}
                            placeholder="VD: 13/03/1954 – 07/05/1954 • Điện Biên"
                            data-testid="input-preview-event-timeloc"
                            className="w-full text-sm font-semibold text-stone-900 bg-white border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-stone-700 uppercase">
                          Tóm tắt diễn biến (Tối đa 500 ký tự)
                        </label>
                        <span className="text-xs font-mono font-semibold text-stone-600">
                          {editSummary.length}/500 ký tự
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={editSummary}
                        maxLength={500}
                        onChange={(e) => setEditSummary(e.target.value)}
                        data-testid="textarea-preview-event-summary"
                        className="w-full text-sm text-stone-800 bg-white border border-stone-300 rounded-lg p-3 focus:outline-none focus:border-stone-900 leading-relaxed resize-y"
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-stone-200">
                      <span className="text-sm text-stone-600">
                        Dữ liệu sẽ được điền vào dòng thời gian
                      </span>
                      <button
                        type="button"
                        data-testid="btn-apply-wiki-event"
                        onClick={handleApplyWikiEvent}
                        className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Nhập nhanh vào sự kiện</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <ScrollText className="w-8 h-8 text-stone-600 mb-3" />
                    <p className="text-base font-semibold text-stone-800 max-w-[65ch]">
                      Chọn một sự kiện từ danh sách bên trái để xem trước
                    </p>
                    <p className="text-sm text-stone-600 max-w-xs mt-1">
                      Hệ thống sẽ tự động trích xuất ngày bắt đầu, ngày kết thúc và diễn biến chính từ Wikidata.
                    </p>
                  </div>
                )}
              </div>
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
