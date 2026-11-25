'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Ban,
  Minus,
  Table2,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
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
  canExecuteTableAction,
  executeTableAction,
  insertRichTable,
  setTableCellBackground,
} from '../../../extensions/table.extension';

const TABLE_GRID_MAX = 6;

const TABLE_CELL_BG_SWATCHES: ReadonlyArray<{ hex: string; label: string }> = [
  { hex: '#f8fafc', label: 'Xám nhạt' },
  { hex: '#fef3c7', label: 'Vàng sử liệu' },
  { hex: '#fee2e2', label: 'Đỏ nhạt' },
  { hex: '#dcfce7', label: 'Xanh lá nhạt' },
  { hex: '#e0e7ff', label: 'Xanh lam nhạt' },
];

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

interface TableIconActionDef {
  action: TableActionType;
  Icon: LucideIcon;
  title: string;
  danger?: boolean;
}

const ROW_ICON_ACTIONS: ReadonlyArray<TableIconActionDef> = [
  { action: TableActionType.ADD_ROW_BEFORE, Icon: ArrowUpToLine, title: 'Thêm hàng phía trên' },
  { action: TableActionType.ADD_ROW_AFTER, Icon: ArrowDownToLine, title: 'Thêm hàng phía dưới' },
  { action: TableActionType.DELETE_ROW, Icon: Minus, title: 'Xóa hàng hiện tại', danger: true },
];

const COL_ICON_ACTIONS: ReadonlyArray<TableIconActionDef> = [
  { action: TableActionType.ADD_COL_BEFORE, Icon: ArrowLeftToLine, title: 'Thêm cột bên trái' },
  { action: TableActionType.ADD_COL_AFTER, Icon: ArrowRightToLine, title: 'Thêm cột bên phải' },
  { action: TableActionType.DELETE_COL, Icon: Minus, title: 'Xóa cột hiện tại', danger: true },
];

const HEADER_TOGGLE_ACTIONS: ReadonlyArray<{
  action: TableActionType;
  label: string;
  title: string;
}> = [
  { action: TableActionType.TOGGLE_HEADER_ROW, label: 'Hàng', title: 'Bật/tắt hàng tiêu đề' },
  { action: TableActionType.TOGGLE_HEADER_COLUMN, label: 'Cột', title: 'Bật/tắt cột tiêu đề' },
  { action: TableActionType.TOGGLE_HEADER_CELL, label: 'Ô', title: 'Bật/tắt ô tiêu đề lẻ' },
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

export function TableSizeGridPicker({
  editor,
  open,
  onClose,
  preventFocusLoss,
}: {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
  preventFocusLoss: (e: React.MouseEvent) => void;
}) {
  const [hoverSize, setHoverSize] = useState<{ rows: number; cols: number }>({
    rows: 3,
    cols: 3,
  });
  const [withHeaderRow, setWithHeaderRow] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !editor) return null;

  return (
    <div
      data-testid="inspector-table-size-picker"
      onMouseDown={preventFocusLoss}
      className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm space-y-2"
    >
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-700">Chọn kích thước bảng</span>
        <span className="font-bold text-indigo-700 tabular-nums">
          {hoverSize.rows} × {hoverSize.cols}
        </span>
      </div>

      <div
        className="grid grid-cols-6 gap-1"
        onMouseLeave={() => setHoverSize({ rows: 3, cols: 3 })}
      >
        {Array.from({ length: TABLE_GRID_MAX * TABLE_GRID_MAX }, (_, idx) => {
          const r = Math.floor(idx / TABLE_GRID_MAX) + 1;
          const c = (idx % TABLE_GRID_MAX) + 1;
          const highlighted = r <= hoverSize.rows && c <= hoverSize.cols;
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              aria-label={`Chèn bảng ${r} hàng ${c} cột`}
              onMouseEnter={() => setHoverSize({ rows: r, cols: c })}
              onClick={() => {
                insertRichTable(editor, { rows: r, cols: c, withHeaderRow });
                onClose();
              }}
              className={`h-5 rounded border transition cursor-pointer ${
                highlighted
                  ? 'border-indigo-500 bg-indigo-100'
                  : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
              }`}
            />
          );
        })}
      </div>

      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={withHeaderRow}
          onChange={(e) => setWithHeaderRow(e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span>Có hàng tiêu đề</span>
      </label>
    </div>
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

  const canMerge = canExecuteTableAction(editor, TableActionType.MERGE_CELLS);
  const canSplit = canExecuteTableAction(editor, TableActionType.SPLIT_CELL);

  return (
    <div
      data-testid="inspector-table-controls"
      className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-2 text-xs"
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
          <Table2 size={13} className="text-indigo-600" />
          <span>Bảng biểu</span>
        </span>
        <button
          type="button"
          title="Xóa toàn bộ bảng"
          data-testid={`table-action-${TableActionType.DELETE_TABLE}`}
          onMouseDown={preventFocusLoss}
          onClick={() => executeTableAction(editor, TableActionType.DELETE_TABLE)}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <Trash2 size={12} />
          <span>Xóa</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <InspectorFieldRow label="Hàng">
          <div className={`grid w-32 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
            {ROW_ICON_ACTIONS.map(({ action, Icon, title, danger }) => (
              <button
                key={action}
                type="button"
                title={title}
                aria-label={title}
                data-testid={`table-action-${action}`}
                onMouseDown={preventFocusLoss}
                onClick={() => executeTableAction(editor, action)}
                className={`grid h-7 place-items-center transition cursor-pointer ${
                  danger
                    ? 'bg-white text-rose-600 hover:bg-rose-50'
                    : INSPECTOR_SEG_BTN_IDLE
                }`}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </InspectorFieldRow>

        <InspectorFieldRow label="Cột">
          <div className={`grid w-32 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
            {COL_ICON_ACTIONS.map(({ action, Icon, title, danger }) => (
              <button
                key={action}
                type="button"
                title={title}
                aria-label={title}
                data-testid={`table-action-${action}`}
                onMouseDown={preventFocusLoss}
                onClick={() => executeTableAction(editor, action)}
                className={`grid h-7 place-items-center transition cursor-pointer ${
                  danger
                    ? 'bg-white text-rose-600 hover:bg-rose-50'
                    : INSPECTOR_SEG_BTN_IDLE
                }`}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </InspectorFieldRow>

        <InspectorFieldRow label="Ô">
          <div className={`grid w-32 grid-cols-2 ${INSPECTOR_SEG_GROUP_CLS}`}>
            <button
              type="button"
              disabled={!canMerge}
              title={canMerge ? 'Gộp các ô đang chọn' : 'Kéo chọn từ 2 ô trở lên để gộp'}
              data-testid={`table-action-${TableActionType.MERGE_CELLS}`}
              onMouseDown={preventFocusLoss}
              onClick={() => executeTableAction(editor, TableActionType.MERGE_CELLS)}
              className="flex h-7 items-center justify-center gap-1 whitespace-nowrap text-[11px] font-semibold bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <TableCellsMerge size={12} />
              <span>Gộp</span>
            </button>
            <button
              type="button"
              disabled={!canSplit}
              title={canSplit ? 'Tách ô đã gộp' : 'Chọn một ô đã gộp để tách'}
              data-testid={`table-action-${TableActionType.SPLIT_CELL}`}
              onMouseDown={preventFocusLoss}
              onClick={() => executeTableAction(editor, TableActionType.SPLIT_CELL)}
              className="flex h-7 items-center justify-center gap-1 whitespace-nowrap text-[11px] font-semibold bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <TableCellsSplit size={12} />
              <span>Tách</span>
            </button>
          </div>
        </InspectorFieldRow>

        <InspectorFieldRow label="Tiêu đề">
          <div className={`grid w-32 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
            {HEADER_TOGGLE_ACTIONS.map((item) => (
              <button
                key={item.action}
                type="button"
                title={item.title}
                data-testid={`table-action-${item.action}`}
                onMouseDown={preventFocusLoss}
                onClick={() => executeTableAction(editor, item.action)}
                className={`grid h-7 place-items-center whitespace-nowrap text-[11px] font-medium transition cursor-pointer ${INSPECTOR_SEG_BTN_IDLE}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </InspectorFieldRow>

        <InspectorFieldRow label="Nền ô">
          <div className="flex items-center gap-1">
            {TABLE_CELL_BG_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                title={`Tô nền ô: ${swatch.label}`}
                aria-label={`Tô nền ô ${swatch.label}`}
                onMouseDown={preventFocusLoss}
                onClick={() => setTableCellBackground(editor, swatch.hex)}
                style={{ backgroundColor: swatch.hex }}
                className="h-5 w-5 rounded-full border border-slate-300 hover:scale-110 transition cursor-pointer"
              />
            ))}
            <button
              type="button"
              title="Xóa màu nền ô"
              aria-label="Xóa màu nền ô"
              onMouseDown={preventFocusLoss}
              onClick={() => setTableCellBackground(editor, null)}
              className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 transition cursor-pointer"
            >
              <Ban size={10} />
            </button>
          </div>
        </InspectorFieldRow>
      </div>
    </div>
  );
}
