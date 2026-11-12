'use client';

import React from 'react';
import { IEntityDetailPreview } from '../../../types/entity-source.types';

export interface WikiDetailPreviewPaneProps {
  loadingDetail: boolean;
  loadingLabel: string;
  previewDetail: IEntityDetailPreview | null;
  headerTitle: string;
  sourceLinkLabel?: string;
  primaryLabel: string;
  primaryValue: string;
  onChangePrimary: (val: string) => void;
  primaryTestId: string;
  secondaryLabel: string;
  secondaryPlaceholder: string;
  secondaryValue: string;
  onChangeSecondary: (val: string) => void;
  secondaryTestId: string;
  summaryLabel: string;
  summaryValue: string;
  onChangeSummary: (val: string) => void;
  summaryTestId: string;
  summaryCounterTestId?: string;
  imageUrl: string;
  fallbackIcon: React.ReactNode;
  wikidataBadgeTestId: string;
  datesBadgeTestId: string;
  datesBadgeCondition?: boolean;
  datesBadgePrefix: string;
  licenseBadgeTestId?: string;
  footerHint: string;
  applyBtnLabel: React.ReactNode;
  applyBtnTestId: string;
  onApply: () => void;
  emptyState: React.ReactNode;
}

export const WikiDetailPreviewPane: React.FC<WikiDetailPreviewPaneProps> = ({
  loadingDetail,
  loadingLabel,
  previewDetail,
  headerTitle,
  sourceLinkLabel = 'Mở bài gốc Wikipedia ↗',
  primaryLabel,
  primaryValue,
  onChangePrimary,
  primaryTestId,
  secondaryLabel,
  secondaryPlaceholder,
  secondaryValue,
  onChangeSecondary,
  secondaryTestId,
  summaryLabel,
  summaryValue,
  onChangeSummary,
  summaryTestId,
  summaryCounterTestId,
  imageUrl,
  fallbackIcon,
  wikidataBadgeTestId,
  datesBadgeTestId,
  datesBadgeCondition,
  datesBadgePrefix,
  licenseBadgeTestId,
  footerHint,
  applyBtnLabel,
  applyBtnTestId,
  onApply,
  emptyState,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col justify-between">
      {loadingDetail ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-500 gap-2">
          <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>{loadingLabel}</span>
        </div>
      ) : previewDetail ? (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span>👁️</span>
              <span>{headerTitle}</span>
            </span>
            {previewDetail.sourceUrl && (
              <a
                href={previewDetail.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>{sourceLinkLabel}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {previewDetail.wikidataId && (
              <a
                href={`https://www.wikidata.org/wiki/${previewDetail.wikidataId}`}
                target="_blank"
                rel="noreferrer"
                data-testid={wikidataBadgeTestId}
                className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
                title="Định danh thực thể Wikidata có cấu trúc"
              >
                <span>📊 Wikidata:</span>
                <span className="font-mono font-bold">{previewDetail.wikidataId}</span>
              </a>
            )}
            {(datesBadgeCondition ?? Boolean(previewDetail.years)) && (
              <span
                data-testid={datesBadgeTestId}
                className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md"
              >
                <span>📅 {datesBadgePrefix}:</span>
                <span className="font-bold">{previewDetail.years}</span>
              </span>
            )}
            {previewDetail.imageLicense && (
              <span
                data-testid={licenseBadgeTestId}
                className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md"
                title={`Bản quyền ảnh: ${previewDetail.imageLicense} - Tác giả: ${previewDetail.imageArtist || 'Wikimedia'}`}
              >
                <span>🖼️ Bản quyền ảnh:</span>
                <span className="font-medium truncate max-w-[140px]">{previewDetail.imageLicense}</span>
              </span>
            )}
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={primaryValue} className="w-full h-full object-cover" />
              ) : (
                fallbackIcon
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  {primaryLabel}
                </label>
                <input
                  type="text"
                  value={primaryValue}
                  onChange={(e) => onChangePrimary(e.target.value)}
                  data-testid={primaryTestId}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  {secondaryLabel}
                </label>
                <input
                  type="text"
                  value={secondaryValue}
                  onChange={(e) => onChangeSecondary(e.target.value)}
                  placeholder={secondaryPlaceholder}
                  data-testid={secondaryTestId}
                  className="w-full text-xs font-semibold text-indigo-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                {summaryLabel}
              </label>
              <span
                data-testid={summaryCounterTestId}
                className={`text-[10px] font-mono font-semibold ${
                  summaryValue.length >= 500
                    ? 'text-rose-600 font-bold'
                    : summaryValue.length > 450
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {summaryValue.length}/500 ký tự
              </span>
            </div>
            <textarea
              rows={4}
              value={summaryValue}
              maxLength={500}
              onChange={(e) => onChangeSummary(e.target.value)}
              data-testid={summaryTestId}
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:border-blue-600 leading-relaxed resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[10px] text-slate-400 italic">{footerHint}</span>
            <button
              type="button"
              data-testid={applyBtnTestId}
              onClick={onApply}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {applyBtnLabel}
            </button>
          </div>
        </div>
      ) : (
        emptyState
      )}
    </div>
  );
};
