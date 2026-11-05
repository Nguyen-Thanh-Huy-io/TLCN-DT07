'use client';

import React, { useState } from 'react';
import { UserSquare2, Database, Sparkles } from 'lucide-react';
import { CharacterBlockData } from '../../types/block-builder.types';
import { EntityPickerModal, EntitySelectionPayload } from '../blocks/EntityPickerModal';
import type { ArticleItem } from '@/services/entities/article.service';
import { dateLabelOf } from '@/utils/year-label';
import { CHARACTER_BLOCK_CONSTANTS } from '../../constants/block-node.constants';

interface CharacterBlockItemEditorProps {
  data: CharacterBlockData;
  onChange: (updates: Partial<CharacterBlockData>) => void;
}

export function CharacterBlockItemEditor({ data, onChange }: CharacterBlockItemEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleSelectEntity = (entity: EntitySelectionPayload | ArticleItem) => {
    let formattedYears = '';
    const name = 'sourceType' in entity ? entity.name : entity.title;
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
      formattedYears = dateLabelOf(entity);
      summary = entity.summary || '';
      avatarUrl = entity.coverImageUrl || '';
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
    <div data-testid="character-block-item-editor" className="space-y-3 font-sans">
      {/* Thanh tiêu đề nhỏ gọn + Nút chọn từ kho */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            data-testid="block-character-title"
            className="text-xs font-bold tracking-wider text-stone-700 uppercase"
          >
            Hồ sơ thực thể
          </span>
          {data.entityId && (
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Kho HISGO</span>
            </span>
          )}
          {data.wikidataId && (
            <span
              data-testid="badge-character-wikidata"
              className="text-xs font-semibold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md"
            >
              Wikidata: {data.wikidataId}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          data-testid="btn-pick-character"
          className="px-2.5 py-1 text-sm font-medium text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          title="Chọn nhân vật từ Kho tri thức HISGO hoặc Wikipedia"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Chọn từ kho</span>
        </button>
      </div>

      {/* Bố cục Hồ sơ thực thể trực quan (Không lồng card-in-card) */}
      <div className="flex items-start gap-3.5 pt-1">
        {/* Ảnh chân dung */}
        <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center shrink-0 overflow-hidden text-stone-600">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.avatarUrl}
              alt={data.name || 'Nhân vật lịch sử'}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserSquare2 className="w-6 h-6" />
          )}
        </div>

        {/* Tên, Niên đại và Tóm tắt hiển thị trực tiếp */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={data.name}
              maxLength={100}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.NAME_PLACEHOLDER}
              data-testid="input-character-name"
              className="text-lg font-serif font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-900 focus:outline-none py-0.5 flex-1 min-w-[160px]"
            />
            <input
              type="text"
              value={data.years}
              maxLength={50}
              onChange={(e) => onChange({ years: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.YEARS_PLACEHOLDER}
              data-testid="input-character-years"
              className="text-sm font-semibold text-stone-700 bg-stone-100 rounded-md px-2.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-stone-900 w-32 text-center"
            />
          </div>

          <input
            type="text"
            value={data.role || ''}
            maxLength={120}
            onChange={(e) => onChange({ role: e.target.value })}
            placeholder="Vai trò / chức danh (vd: Chủ tướng đại thắng Bạch Đằng)"
            data-testid="input-character-role"
            className="w-full text-sm font-medium text-stone-700 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-900 focus:outline-none py-0.5"
          />

          <textarea
            rows={2}
            value={data.summary}
            maxLength={500}
            onChange={(e) => onChange({ summary: e.target.value })}
            placeholder={CHARACTER_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
            data-testid="input-character-summary"
            className="w-full text-sm text-stone-700 bg-transparent border border-transparent hover:border-stone-300 focus:border-stone-900 focus:bg-white focus:outline-none p-1.5 -ml-1.5 rounded-lg transition-colors leading-relaxed resize-y"
          />
        </div>
      </div>

      <EntityPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectEntity={handleSelectEntity}
      />
    </div>
  );
}
