'use client';

import React, { useState } from 'react';
import { CharacterBlockData } from '../../types/block-builder.types';
import { EntityPickerModal, EntitySelectionPayload } from '../blocks/EntityPickerModal';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import { CHARACTER_BLOCK_CONSTANTS } from '../../constants/block-node.constants';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

interface CharacterBlockItemEditorProps {
  data: CharacterBlockData;
  onChange: (updates: Partial<CharacterBlockData>) => void;
}

export function CharacterBlockItemEditor({ data, onChange }: CharacterBlockItemEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // Trạng thái thu gọn/mở rộng thẻ nhân vật
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectEntity = (entity: EntitySelectionPayload | HistoricalEntityItem) => {
    let formattedYears = '';
    const name = entity.name;
    let summary = '';
    let avatarUrl = '';
    let entityId: string | undefined = undefined;
    let wikidataId: string | undefined = undefined;
    let sourceUrl: string | undefined = undefined;

    if ('sourceType' in entity) {
      formattedYears = entity.years;
      summary = entity.summary;
      avatarUrl = entity.avatarUrl;
      entityId = entity.entityId;
      wikidataId = entity.wikidataId;
      sourceUrl = entity.sourceUrl;
    } else {
      formattedYears = entity.birthYear
        ? `${entity.birthYear} – ${entity.deathYear ?? 'Nay'}`
        : entity.birthDateLabel || '';
      summary = entity.tagline || entity.description || '';
      avatarUrl = entity.imageUrl || '';
      entityId = entity.id;
    }

    onChange({
      entityId,
      name,
      years: formattedYears,
      summary,
      avatarUrl,
      wikidataId,
      sourceUrl,
    });
  };

  return (
    <div data-testid="character-block-item-editor" className="space-y-2.5 font-sans">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            data-testid="block-character-title"
            className="text-xs font-bold tracking-wider text-slate-700 uppercase"
          >
            {CHARACTER_BLOCK_CONSTANTS.TITLE}
          </span>
          {data.entityId && (
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Đã liên kết Bách khoa HISGO</span>
            </span>
          )}
          {data.wikidataId && (
            <span
              data-testid="badge-character-wikidata"
              className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Wikidata: {data.wikidataId}</span>
            </span>
          )}
        </div>

        {/* Nút toggle thu gọn / mở rộng thẻ nhân vật */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-700 px-2 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
        >
          <span>{isExpanded ? '▲ Thu gọn thẻ' : '▼ Sửa chi tiết / Mở rộng'}</span>
        </button>
      </div>

      {/* Thẻ nhân vật tinh gọn (Compact Card) */}
      <div
        className={`p-3 bg-slate-50/90 border border-slate-200 rounded-xl transition-all ${
          !isExpanded ? 'hover:border-slate-300' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar nhỏ gọn */}
          <div className="w-10 h-10 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs text-slate-400">
            {data.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatarUrl}
                alt={data.name || 'Nhân vật lịch sử'}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon name={IconName.USERS} size={20} />
            )}
          </div>

          {/* Dòng tên và năm gọn gàng kèm giới hạn ký tự */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <input
              type="text"
              value={data.name}
              maxLength={100}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.NAME_PLACEHOLDER}
              data-testid="input-character-name"
              title="Tên nhân vật lịch sử (tối đa 100 ký tự)"
              className="text-xs font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition flex-1"
            />
            <input
              type="text"
              value={data.years}
              maxLength={50}
              onChange={(e) => onChange({ years: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.YEARS_PLACEHOLDER}
              data-testid="input-character-years"
              title="Năm sinh - mất hoặc thời kỳ (tối đa 50 ký tự)"
              className="text-[11px] font-semibold text-indigo-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition sm:w-36"
            />
          </div>

          {/* Nút tìm kiếm Bách khoa nhanh */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            data-testid="btn-pick-character"
            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition shrink-0"
            title="Liên kết dữ liệu Bách khoa"
          >
            <Icon name={IconName.SEARCH} size={13} />
          </button>
        </div>

        {/* Phần mở rộng: Tóm tắt tiểu sử kèm bộ đếm giới hạn 500 ký tự */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in-50 duration-150">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Tóm tắt tiểu sử &amp; đóng góp lịch sử:
                </label>
                <span
                  data-testid="character-summary-counter"
                  className={`text-[10px] font-mono font-semibold ${
                    (data.summary?.length || 0) >= 500
                      ? 'text-rose-600 font-bold'
                      : (data.summary?.length || 0) > 450
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  }`}
                >
                  {(data.summary?.length || 0)}/500 ký tự
                </span>
              </div>
              <textarea
                rows={4}
                value={data.summary}
                maxLength={500}
                onChange={(e) => onChange({ summary: e.target.value })}
                placeholder={CHARACTER_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
                data-testid="input-character-summary"
                className="w-full text-xs text-slate-700 bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none p-2 rounded-lg transition leading-relaxed resize-y"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{data.entityId ? '✓ Dữ liệu đã đồng bộ với từ điển' : '💡 Nhấn kính lúp để liên kết từ điển'}</span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {data.entityId ? 'Thay đổi liên kết' : 'Chọn từ Bách khoa'}
              </button>
            </div>

            {/* Chi tiết tuỳ chọn — ẩn mặc định ở bản Xem trước, chỉ xổ ra khi bấm "Xem chi
                tiết". Dùng khi 500 ký tự tóm tắt không đủ để viết đầy đủ tiểu sử. */}
            <div className="pt-2 border-t border-slate-200/80">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Chi tiết tiểu sử (tuỳ chọn — chỉ hiện khi bấm &quot;Xem chi tiết&quot;):
              </label>
              <textarea
                rows={4}
                value={data.detailContent || ''}
                onChange={(e) => onChange({ detailContent: e.target.value })}
                placeholder="Viết đầy đủ tiểu sử, đóng góp, giai thoại... (không giới hạn độ dài, hỗ trợ HTML cơ bản)"
                data-testid="input-character-detail"
                className="w-full text-xs text-slate-700 bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none p-2 rounded-lg transition leading-relaxed resize-y"
              />
            </div>
          </div>
        )}
      </div>

      <EntityPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectEntity={handleSelectEntity}
      />
    </div>
  );
}
