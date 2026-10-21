'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import {
  EntitySourceType,
  IEntityDetailPreview,
  IEntitySearchResult,
} from '../../types/entity-source.types';
import { ENTITY_SOURCE_CONSTANTS } from '../../constants/entity-source.constants';
import { EntitySourceStrategyFactory } from '../../factories/entity-source-strategy.factory';

export interface EntitySelectionPayload {
  name: string;
  years: string;
  summary: string;
  avatarUrl: string;
  entityId?: string;
  sourceUrl?: string;
  sourceType: EntitySourceType;
  wikidataId?: string;
  imageLicense?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface EntityPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (entity: EntitySelectionPayload | HistoricalEntityItem) => void;
}

export const EntityPickerModal: React.FC<EntityPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
}) => {
  // Tab hiện tại (Mặc định là Kho nội bộ HISGO, có thể chuyển sang Wikipedia)
  const [activeSource, setActiveSource] = useState<EntitySourceType>(EntitySourceType.HISGO);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<IEntitySearchResult[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Dữ liệu chi tiết đang được chọn để xem trước (đặc biệt hữu ích cho Wikipedia)
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [previewDetail, setPreviewDetail] = useState<IEntityDetailPreview | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form chỉnh sửa trực tiếp trên panel Preview trước khi nhập vào bài học
  const [editName, setEditName] = useState('');
  const [editYears, setEditYears] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Hàm thực hiện tìm kiếm qua Strategy Pattern
  const executeSearch = useCallback(async (keyword: string, sourceType: EntitySourceType) => {
    try {
      setLoadingList(true);
      const strategy = EntitySourceStrategyFactory.getStrategy(sourceType);
      const items = await strategy.search(keyword);
      setResults(items);

      // Nếu là Wikipedia và có kết quả, tự động chọn phần tử đầu tiên để xem trước
      if (sourceType === EntitySourceType.WIKIPEDIA && items.length > 0) {
        const first = items[0];
        setSelectedItemKey(first.title);
        loadDetail(first.title, sourceType);
      } else if (items.length === 0) {
        setPreviewDetail(null);
        setSelectedItemKey(null);
      }
    } catch (err) {
      console.error('Lỗi khi tìm kiếm thực thể:', err);
      setResults([]);
      setPreviewDetail(null);
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Hàm tải chi tiết thực thể
  const loadDetail = async (identifier: string, sourceType: EntitySourceType) => {
    try {
      setLoadingDetail(true);
      const strategy = EntitySourceStrategyFactory.getStrategy(sourceType);
      const detail = await strategy.getDetail(identifier);
      if (detail) {
        setPreviewDetail(detail);
        setEditName(detail.name);
        setEditYears(detail.years);
        setEditSummary(detail.summary);
        setEditAvatar(detail.avatarUrl);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết thực thể:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Debounced search khi gõ từ khóa
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      executeSearch(search, activeSource);
    }, 350);

    return () => clearTimeout(timer);
  }, [isOpen, search, activeSource, executeSearch]);

  // Reset state khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setPreviewDetail(null);
      setSelectedItemKey(null);
      executeSearch('', activeSource);
    }
  }, [isOpen, activeSource, executeSearch]);

  if (!isOpen) return null;

  // Xử lý áp dụng dữ liệu từ panel preview vào bài học
  const handleApplyPreview = () => {
    if (!editName.trim()) return;

    onSelectEntity({
      name: editName.trim(),
      years: editYears.trim(),
      summary: editSummary.trim(),
      avatarUrl: editAvatar.trim(),
      entityId: previewDetail?.entityId,
      sourceUrl: previewDetail?.sourceUrl,
      sourceType: activeSource,
      wikidataId: previewDetail?.wikidataId,
      imageLicense: previewDetail?.imageLicense,
      coordinates: previewDetail?.coordinates,
    });
    onClose();
  };

  // Xử lý chọn nhanh từ danh sách nội bộ HISGO
  const handleSelectHisgoItem = (item: IEntitySearchResult) => {
    loadDetail(item.id, EntitySourceType.HISGO).then(() => {
      onSelectEntity({
        name: item.title,
        years: '',
        summary: item.description || '',
        avatarUrl: item.thumbnailUrl || '',
        entityId: item.id,
        sourceType: EntitySourceType.HISGO,
      });
      onClose();
    });
  };

  return (
    <div
      data-testid="modal-entity-picker"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-2xs">
              <Icon name={IconName.SEARCH} size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.MODAL_TITLE}
              </h3>
              <p className="text-[11px] text-slate-500">
                {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.MODAL_DESC}
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

        {/* Thanh chọn Nguồn Dữ liệu (Tabs Segmented Control) */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-semibold">
            <button
              type="button"
              data-testid="tab-source-hisgo"
              onClick={() => {
                setActiveSource(EntitySourceType.HISGO);
                setSearch('');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSource === EntitySourceType.HISGO
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏛️</span>
              <span>{ENTITY_SOURCE_CONSTANTS.TABS.HISGO_TITLE}</span>
            </button>
            <button
              type="button"
              data-testid="tab-source-wikipedia"
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
              <span>{ENTITY_SOURCE_CONSTANTS.TABS.WIKIPEDIA_TITLE}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold uppercase">
                Mở rộng
              </span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 italic">
            {activeSource === EntitySourceType.HISGO
              ? ENTITY_SOURCE_CONSTANTS.TABS.HISGO_SUBTITLE
              : ENTITY_SOURCE_CONSTANTS.TABS.WIKIPEDIA_SUBTITLE}
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
                  ? ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.SEARCH_PLACEHOLDER_HISGO
                  : ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.SEARCH_PLACEHOLDER_WIKI
              }
              data-testid="input-search-entity"
              className="w-full text-xs pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium shadow-2xs transition"
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

        {/* Modal Body: Phân nhánh theo Tab */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[380px] max-h-[460px]">
          {/* CỘT TRÁI (Master List): Danh sách kết quả */}
          <div
            className={`border-r border-slate-100 overflow-y-auto p-3 space-y-2 bg-slate-50/40 ${
              activeSource === EntitySourceType.WIKIPEDIA ? 'w-full md:w-[360px]' : 'w-full'
            }`}
          >
            {loadingList ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>{ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.LOADING_LIST}</span>
              </div>
            ) : results.length > 0 ? (
              results.map((item) => {
                const isSelected = selectedItemKey === (item.rawKey || item.title || item.id);

                return (
                  <div
                    key={item.id}
                    data-testid={`entity-picker-item-${item.id}`}
                    onClick={() => {
                      setSelectedItemKey(item.rawKey || item.title || item.id);
                      if (activeSource === EntitySourceType.WIKIPEDIA) {
                        loadDetail(item.title, EntitySourceType.WIKIPEDIA);
                      } else {
                        handleSelectHisgoItem(item);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-2xs'
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
                        <Icon name={IconName.USERS} size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </h4>
                        {activeSource === EntitySourceType.WIKIPEDIA && (
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded shrink-0">
                            Wiki
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.description || 'Chưa có mô tả chi tiết'}
                      </p>
                    </div>

                    {activeSource === EntitySourceType.HISGO && (
                      <button
                        type="button"
                        data-testid={`btn-select-entity-${item.id}`}
                        className="self-center px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 transition shrink-0 cursor-pointer"
                      >
                        Chọn
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">
                  {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.NO_RESULTS}
                </p>
                <p className="text-[11px]">
                  Thử tìm kiếm với từ khóa khác (ví dụ: &ldquo;Võ Nguyên Giáp&rdquo;, &ldquo;Chiến dịch Điện Biên Phủ&rdquo;).
                </p>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (Detail Preview): Bảng xem trước & bóc tách dữ liệu (Chỉ áp dụng khi xem Wikipedia) */}
          {activeSource === EntitySourceType.WIKIPEDIA && (
            <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col justify-between">
              {loadingDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 gap-2">
                  <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>{ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.LOADING_DETAIL}</span>
                </div>
              ) : previewDetail ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <span>👁️</span>
                      <span>Xem trước dữ liệu bóc tách từ Wikipedia &amp; Wikidata</span>
                    </span>
                    {previewDetail.sourceUrl && (
                      <a
                        href={previewDetail.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>Mở bài gốc Wikipedia ↗</span>
                      </a>
                    )}
                  </div>

                  {/* Badges hiển thị dữ liệu có cấu trúc Wikidata & Commons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {previewDetail.wikidataId && (
                      <a
                        href={`https://www.wikidata.org/wiki/${previewDetail.wikidataId}`}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="badge-wikidata-id"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
                        title="Định danh thực thể Wikidata có cấu trúc"
                      >
                        <span>📊 Wikidata:</span>
                        <span className="font-mono font-bold">{previewDetail.wikidataId}</span>
                      </a>
                    )}
                    {previewDetail.birthDate && (
                      <span
                        data-testid="badge-wikidata-dates"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md"
                        title="Dữ liệu ngày sinh/mất chuẩn xác từ Wikidata P569/P570"
                      >
                        <span>📅 Chuẩn Wikidata:</span>
                        <span className="font-bold">{previewDetail.years}</span>
                      </span>
                    )}
                    {previewDetail.imageLicense && (
                      <span
                        data-testid="badge-commons-license"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md"
                        title={`Bản quyền ảnh: ${previewDetail.imageLicense} - Tác giả: ${previewDetail.imageArtist || 'Wikimedia'}`}
                      >
                        <span>🖼️ Bản quyền ảnh:</span>
                        <span className="font-medium truncate max-w-[140px]">{previewDetail.imageLicense}</span>
                      </span>
                    )}
                  </div>

                  {/* Ảnh chân dung + Tên + Năm */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                      {editAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editAvatar}
                          alt={editName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Icon name={IconName.USERS} size={28} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.NAME_LABEL}
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          data-testid="input-preview-name"
                          className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.YEARS_LABEL}
                        </label>
                        <input
                          type="text"
                          value={editYears}
                          onChange={(e) => setEditYears(e.target.value)}
                          placeholder="Vd: 1911 – 2013"
                          data-testid="input-preview-years"
                          className="w-full text-xs font-semibold text-indigo-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tóm tắt tiểu sử trích xuất */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.SUMMARY_LABEL}
                      </label>
                      <span
                        data-testid="preview-summary-counter"
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
                      data-testid="textarea-preview-summary"
                      className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:border-blue-600 leading-relaxed resize-y"
                    />
                  </div>

                  {/* Nút hành động áp dụng */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 italic">
                      Dữ liệu sẽ được tự động điền vào thẻ bài học
                    </span>
                    <button
                      type="button"
                      data-testid="btn-apply-wiki-entity"
                      onClick={handleApplyPreview}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.BTN_APPLY}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400">
                  <span className="text-3xl mb-2">📖</span>
                  <p className="font-semibold text-slate-600">
                    {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.SELECT_HINT}
                  </p>
                  <p className="text-[11px] max-w-xs mt-1">
                    Hệ thống sẽ tự động bóc tách tên, năm sinh/mất và tóm tắt tiểu sử vừa vặn dưới 500 ký tự.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Tìm thấy {results.length} kết quả</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
          >
            {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.BTN_CANCEL}
          </button>
        </div>
      </div>
    </div>
  );
};
