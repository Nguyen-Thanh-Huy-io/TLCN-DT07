'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import type { ArticleItem } from '@/services/entities/article.service';
import {
  EntitySourceType,
  IEntitySearchResult,
} from '../../types/editor.types';
import { ENTITY_SOURCE_CONSTANTS } from '../../constants/lesson.constants';
import { EntitySourceStrategyFactory } from '../../strategies/entity-sources/hisgo-internal-source.strategy';
import { useWikipediaDetailPicker } from './shared/useWikipediaDetailPicker';
import { WikiDetailPreviewPane } from './shared/WikiDetailPreviewPane';

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
  onSelectEntity: (entity: EntitySelectionPayload | ArticleItem) => void;
}

export const EntityPickerModal: React.FC<EntityPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
}) => {
  const [activeSource, setActiveSource] = useState<EntitySourceType>(EntitySourceType.HISGO);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<IEntitySearchResult[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const {
    selectedItemKey,
    setSelectedItemKey,
    previewDetail,
    loadingDetail,
    editPrimary: editName,
    setEditPrimary: setEditName,
    editSecondary: editYears,
    setEditSecondary: setEditYears,
    editSummary,
    setEditSummary,
    editImage: editAvatar,
    resetPreview,
    loadDetail,
    selectFirstWikiItemIfAny,
  } = useWikipediaDetailPicker();

  const executeSearch = useCallback(
    async (keyword: string, sourceType: EntitySourceType) => {
      try {
        setLoadingList(true);
        const strategy = EntitySourceStrategyFactory.getStrategy(sourceType);
        const items = await strategy.search(keyword);
        setResults(items);

        if (sourceType === EntitySourceType.WIKIPEDIA && items.length > 0) {
          selectFirstWikiItemIfAny(items, sourceType);
        } else if (items.length === 0) {
          resetPreview();
        }
      } catch (err) {
        console.error('Lỗi khi tìm kiếm thực thể:', err);
        setResults([]);
        resetPreview();
      } finally {
        setLoadingList(false);
      }
    },
    [resetPreview, selectFirstWikiItemIfAny],
  );

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      executeSearch(search, activeSource);
    }, 350);

    return () => clearTimeout(timer);
  }, [isOpen, search, activeSource, executeSearch]);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        setSearch('');
        resetPreview();
        executeSearch('', activeSource);
      });
    }
  }, [isOpen, activeSource, executeSearch, resetPreview]);

  if (!isOpen) return null;

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

        {/* Thanh chọn Nguồn Dữ liệu */}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[380px] max-h-[460px]">
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
                  Thử tìm kiếm với từ khóa khác (ví dụ: &ldquo;Trần Hưng Đạo&rdquo;, &ldquo;Chiến thắng Bạch Đằng&rdquo;).
                </p>
              </div>
            )}
          </div>

          {activeSource === EntitySourceType.WIKIPEDIA && (
            <WikiDetailPreviewPane
              loadingDetail={loadingDetail}
              loadingLabel={ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.LOADING_DETAIL}
              previewDetail={previewDetail}
              headerTitle="Xem trước dữ liệu bóc tách từ Wikipedia & Wikidata"
              primaryLabel={ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.NAME_LABEL}
              primaryValue={editName}
              onChangePrimary={setEditName}
              primaryTestId="input-preview-name"
              secondaryLabel={ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.YEARS_LABEL}
              secondaryPlaceholder="Vd: 1228 – 1300"
              secondaryValue={editYears}
              onChangeSecondary={setEditYears}
              secondaryTestId="input-preview-years"
              summaryLabel={ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.SUMMARY_LABEL}
              summaryValue={editSummary}
              onChangeSummary={setEditSummary}
              summaryTestId="textarea-preview-summary"
              summaryCounterTestId="preview-summary-counter"
              imageUrl={editAvatar}
              fallbackIcon={<Icon name={IconName.USERS} size={28} className="text-slate-300" />}
              wikidataBadgeTestId="badge-wikidata-id"
              datesBadgeTestId="badge-wikidata-dates"
              datesBadgeCondition={Boolean(previewDetail?.birthDate)}
              datesBadgePrefix="Chuẩn Wikidata"
              licenseBadgeTestId="badge-commons-license"
              footerHint="Dữ liệu sẽ được tự động điền vào thẻ bài học"
              applyBtnLabel={<span>{ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.BTN_APPLY}</span>}
              applyBtnTestId="btn-apply-wiki-entity"
              onApply={handleApplyPreview}
              emptyState={
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400">
                  <span className="text-3xl mb-2">📖</span>
                  <p className="font-semibold text-slate-600">
                    {ENTITY_SOURCE_CONSTANTS.PREVIEW_LABELS.SELECT_HINT}
                  </p>
                  <p className="text-[11px] max-w-xs mt-1">
                    Hệ thống sẽ tự động bóc tách tên, năm sinh/mất và tóm tắt tiểu sử vừa vặn dưới 500 ký tự.
                  </p>
                </div>
              }
            />
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
