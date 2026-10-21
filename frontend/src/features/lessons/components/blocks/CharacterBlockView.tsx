'use client';

import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { CHARACTER_BLOCK_CONSTANTS } from '../../constants/block-node.constants';
import { EntityPickerModal, EntitySelectionPayload } from './EntityPickerModal';
import { AddBlockBelowMenu } from './AddBlockBelowMenu';
import { LessonBlockType } from '../../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../../strategies/lesson-block-insert.strategy';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export function CharacterBlockView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, editor, getPos } = props;
  const { entityId, name, years, summary, avatarUrl } = node.attrs;

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Chọn nhân vật từ kho tri thức HISGO hoặc Wikipedia
  const handleSelectEntity = (entity: EntitySelectionPayload | HistoricalEntityItem) => {
    let formattedYears = '';
    const entityName = entity.name;
    let entitySummary = '';
    let entityAvatar = '';
    let targetEntityId: string | undefined = undefined;

    if ('sourceType' in entity) {
      formattedYears = entity.years;
      entitySummary = entity.summary;
      entityAvatar = entity.avatarUrl;
      targetEntityId = entity.entityId;
    } else {
      formattedYears = entity.birthYear
        ? `${entity.birthYear} – ${entity.deathYear ?? 'Nay'}`
        : entity.birthDateLabel || '';
      entitySummary = entity.tagline || entity.description || '';
      entityAvatar = entity.imageUrl || '';
      targetEntityId = entity.id;
    }

    updateAttributes({
      entityId: targetEntityId,
      name: entityName,
      years: formattedYears,
      summary: entitySummary,
      avatarUrl: entityAvatar,
    });
  };

  // Thêm khối ngay bên dưới
  const handleAddBlockBelow = (type: LessonBlockType) => {
    if (!editor) return;
    const snippet = lessonBlockInsertStrategy.generateSnippet(type);
    const currentPos = typeof getPos === 'function' ? getPos() : null;
    if (typeof currentPos === 'number') {
      const nextPos = currentPos + node.nodeSize;
      editor.chain().focus().insertContentAt(nextPos, snippet).run();
    } else {
      editor.chain().focus().insertContent(snippet).run();
    }
  };

  return (
    <NodeViewWrapper className="character-block-wrapper my-4">
      <div
        data-testid="block-character-container"
        className="border border-slate-200 rounded-2xl bg-white shadow-xs p-4 transition-all hover:border-slate-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 relative group"
      >
        {/* Header khối */}
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-600">
              <Icon name={IconName.USERS} size={14} />
            </span>
            <span
              data-testid="block-character-title"
              className="text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              {CHARACTER_BLOCK_CONSTANTS.TITLE}
            </span>
            {entityId && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Liên kết kho dữ liệu</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              data-testid="btn-pick-character"
              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center gap-1"
            >
              <Icon name={IconName.SEARCH} size={12} />
              <span>
                {entityId
                  ? CHARACTER_BLOCK_CONSTANTS.BTN_CHANGE_ENTITY
                  : CHARACTER_BLOCK_CONSTANTS.BTN_PICK_ENTITY}
              </span>
            </button>
            <button
              type="button"
              onClick={deleteNode}
              title={CHARACTER_BLOCK_CONSTANTS.BTN_DELETE_BLOCK}
              data-testid="btn-delete-character-block"
              className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
            >
              <Icon name={IconName.TRASH} size={14} />
            </button>
          </div>
        </div>

        {/* Thẻ hiển thị nhân vật (Theo cấu trúc và phong cách img2.png) */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl flex items-start gap-4">
          {/* Avatar đại diện */}
          <div className="w-14 h-14 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs text-slate-400">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name || 'Nhân vật lịch sử'}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon name={IconName.USERS} size={28} />
            )}
          </div>

          {/* Soạn thảo trực tiếp nội dung nhân vật */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Tên nhân vật */}
            <input
              type="text"
              value={name || ''}
              onChange={(e) => updateAttributes({ name: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.NAME_PLACEHOLDER}
              data-testid="input-character-name"
              className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition"
            />

            {/* Năm sinh - năm mất */}
            <input
              type="text"
              value={years || ''}
              onChange={(e) => updateAttributes({ years: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.YEARS_PLACEHOLDER}
              data-testid="input-character-years"
              className="w-full text-xs font-semibold text-blue-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition"
            />

            {/* Thông tin giới thiệu ngắn */}
            <textarea
              rows={2}
              value={summary || ''}
              onChange={(e) => updateAttributes({ summary: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
              data-testid="input-character-summary"
              className="w-full text-xs text-slate-600 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-1.5 rounded transition leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Gợi ý theo img2.png */}
        {!entityId && (
          <p
            data-testid="character-block-hint"
            className="text-[11px] text-slate-400 mt-2 px-1 italic flex items-center gap-1"
          >
            <span>💡</span>
            <span>{CHARACTER_BLOCK_CONSTANTS.PICK_HINT}</span>
          </p>
        )}

        {/* Nút + Thêm khối bên dưới */}
        <AddBlockBelowMenu
          onSelectBlock={handleAddBlockBelow}
          buttonLabel={CHARACTER_BLOCK_CONSTANTS.BTN_ADD_BELOW}
        />

        {/* Modal chọn nhân vật */}
        <EntityPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectEntity={handleSelectEntity}
        />
      </div>
    </NodeViewWrapper>
  );
}
