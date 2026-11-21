'use client';

import React from 'react';
import { Plus, Trash2, Table2 } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import {
  INSPECTOR_SEG_BTN_ACTIVE,
  INSPECTOR_SEG_BTN_IDLE,
  INSPECTOR_SEG_GROUP_CLS,
  InspectorFieldRow,
} from '@/components/common/TextStyleControls';
import {
  BULLET_LIST_STYLE_OPTIONS,
  LIST_NODE_TYPES,
  ListStyleType,
  ORDERED_LIST_STYLE_OPTIONS,
} from '../../../extensions/typography.extension';
import {
  RICH_TABLE_NODE_NAMES,
  TableActionType,
  executeTableAction,
  insertRichTable,
} from '../../../extensions/table.extension';

/**
 * Icon Danh sách chấm đầu dòng (Bullet List) với chấm tròn đặc rõ nét,
 * phân biệt hoàn toàn với icon căn lề (AlignJustify).
 */
export function BulletListIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="4.5" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="2" fill="currentColor" stroke="none" />
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
    </svg>
  );
}

const ROW_ACTIONS: ReadonlyArray<{
  action: TableActionType;
  label: string;
  title: string;
  danger?: boolean;
}> = [
  {
    action: TableActionType.ADD_ROW_BEFORE,
    label: '+ Trên',
    title: 'Thêm hàng phía trên',
  },
  {
    action: TableActionType.ADD_ROW_AFTER,
    label: '+ Dưới',
    title: 'Thêm hàng phía dưới',
  },
  {
    action: TableActionType.DELETE_ROW,
    label: 'Xóa hàng',
    title: 'Xóa hàng hiện tại',
    danger: true,
  },
];

const COL_ACTIONS: ReadonlyArray<{
  action: TableActionType;
  label: string;
  title: string;
  danger?: boolean;
}> = [
  {
    action: TableActionType.ADD_COL_BEFORE,
    label: '+ Trái',
    title: 'Thêm cột bên trái',
  },
  {
    action: TableActionType.ADD_COL_AFTER,
    label: '+ Phải',
    title: 'Thêm cột bên phải',
  },
  {
    action: TableActionType.DELETE_COL,
    label: 'Xóa cột',
    title: 'Xóa cột hiện tại',
    danger: true,
  },
];

export function TypographyListStyleControl({
  editor,
  preventFocusLoss,
}: {
  editor: Editor | null;
  preventFocusLoss: (e: React.MouseEvent) => void;
}) {
  if (!editor) return null;

  const isBulletActive = editor.isActive(LIST_NODE_TYPES.BULLET);
  const isOrderedActive = editor.isActive(LIST_NODE_TYPES.ORDERED);

  if (!isBulletActive && !isOrderedActive) {
    return null;
  }

  const activeListNode = isBulletActive
    ? LIST_NODE_TYPES.BULLET
    : LIST_NODE_TYPES.ORDERED;
  const options = isBulletActive
    ? BULLET_LIST_STYLE_OPTIONS
    : ORDERED_LIST_STYLE_OPTIONS;
  const defaultStyle = isBulletActive
    ? ListStyleType.DISC
    : ListStyleType.DECIMAL;
  const attrs = editor.getAttributes(activeListNode) || {};
  const currentListStyle =
    (attrs.listStyleType as ListStyleType) || defaultStyle;

  return (
    <InspectorFieldRow
      label={isBulletActive ? 'Kiểu dấu đầu dòng' : 'Kiểu đánh số'}
    >
      <div
        data-testid="inspector-list-style-picker"
        className={`grid w-36 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}
      >
        {options.map((opt) => {
          const active = currentListStyle === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              data-testid={`list-style-btn-${opt.value}`}
              onMouseDown={preventFocusLoss}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .updateAttributes(activeListNode, {
                    listStyleType: opt.value,
                  })
                  .run()
              }
              className={`grid h-7 place-items-center text-xs font-bold transition cursor-pointer ${
                active ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              {opt.symbol}
            </button>
          );
        })}
      </div>
    </InspectorFieldRow>
  );
}

export function TypographyTableControls({
  editor,
  preventFocusLoss,
}: {
  editor: Editor | null;
  preventFocusLoss: (e: React.MouseEvent) => void;
}) {
  const isTableActive = Boolean(editor?.isActive(RICH_TABLE_NODE_NAMES.TABLE));
  if (!editor || !isTableActive) {
    return null;
  }

  return (
    <div
      data-testid="inspector-table-controls"
      className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2.5 space-y-2 text-xs"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-bold text-indigo-950 text-[11px]">
          <Table2 size={13} className="text-indigo-600" />
          <span>Bảng biểu đang chọn</span>
        </span>
        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() =>
            insertRichTable(editor, { rows: 3, cols: 3, withHeaderRow: true })
          }
          title="Chèn thêm một bảng 3x3 mới"
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
        >
          <Plus size={11} />
          <span>Bảng mới</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-600 shrink-0">
            Hàng
          </span>
          <div className={`grid w-40 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
            {ROW_ACTIONS.map((item) => (
              <button
                key={item.action}
                type="button"
                title={item.title}
                data-testid={`table-action-${item.action}`}
                onMouseDown={preventFocusLoss}
                onClick={() => executeTableAction(editor, item.action)}
                className={`grid h-7 place-items-center text-[10px] font-semibold transition cursor-pointer ${
                  item.danger
                    ? 'bg-white text-rose-600 hover:bg-rose-50'
                    : INSPECTOR_SEG_BTN_IDLE
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-600 shrink-0">
            Cột
          </span>
          <div className={`grid w-40 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
            {COL_ACTIONS.map((item) => (
              <button
                key={item.action}
                type="button"
                title={item.title}
                data-testid={`table-action-${item.action}`}
                onMouseDown={preventFocusLoss}
                onClick={() => executeTableAction(editor, item.action)}
                className={`grid h-7 place-items-center text-[10px] font-semibold transition cursor-pointer ${
                  item.danger
                    ? 'bg-white text-rose-600 hover:bg-rose-50'
                    : INSPECTOR_SEG_BTN_IDLE
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-2 ${INSPECTOR_SEG_GROUP_CLS}`}>
        <button
          type="button"
          data-testid={`table-action-${TableActionType.TOGGLE_HEADER_ROW}`}
          onMouseDown={preventFocusLoss}
          onClick={() =>
            executeTableAction(editor, TableActionType.TOGGLE_HEADER_ROW)
          }
          className={`flex h-7 items-center justify-center gap-1 text-[10px] font-semibold transition cursor-pointer ${INSPECTOR_SEG_BTN_IDLE}`}
        >
          <span>Dòng tiêu đề</span>
        </button>
        <button
          type="button"
          data-testid={`table-action-${TableActionType.DELETE_TABLE}`}
          onMouseDown={preventFocusLoss}
          onClick={() =>
            executeTableAction(editor, TableActionType.DELETE_TABLE)
          }
          className="flex h-7 items-center justify-center gap-1 text-[10px] font-semibold bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <Trash2 size={11} />
          <span>Xóa bảng</span>
        </button>
      </div>
    </div>
  );
}
