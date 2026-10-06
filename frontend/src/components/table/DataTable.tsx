'use client';
import React, { useMemo, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { ActionMenu } from '@/components/common/ActionMenu';
import { IconName } from '@/constants/icons';
import { DataTableProps } from '@/types/table.types';

export function DataTable<T extends object>({
  columns,
  data,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  searchValue,
  onSearchChange,
  filters = [],
  primaryButtonLabel,
  onPrimaryButtonClick,
  onEdit,
  onDelete,
  onView,
  emptyMessage = 'Không tìm thấy dữ liệu phù hợp.',
  totalCount,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: DataTableProps<T>) {
  const [internalQuery, setInternalQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const query = searchValue !== undefined ? searchValue : internalQuery;
  const handleQueryChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalQuery(val);
    }
  };

  const filteredData = useMemo(() => {
    if (searchValue !== undefined || !query.trim()) return data;
    const lower = query.toLowerCase();
    return data.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(lower),
    );
  }, [data, query, searchValue]);

  const allSelected =
    filteredData.length > 0 && selectedIds.length === filteredData.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((_, idx) => idx));
    }
  };

  const toggleSelectRow = (idx: number) => {
    setSelectedIds((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const displayTotal = totalCount !== undefined ? totalCount : filteredData.length;

  return (
    <div className="panel management-panel">
      {/* Toolbar */}
      <div className="toolbar">
        <label className="search-box">
          <Icon name={IconName.SEARCH} size={14} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
          {query ? (
            <button
              type="button"
              className="text-slate-400 hover:text-slate-700 text-xs"
              onClick={() => handleQueryChange('')}
            >
              ✕
            </button>
          ) : null}
        </label>
        {filters.length > 0 && (
          <div className="filters">
            {filters.map((f, idx) => (
              <button key={idx} type="button" onClick={f.onClick}>
                <Icon name={IconName.FILTER} size={12} />
                <span>{f.label}</span>
                <span className="text-slate-400 text-xs">⌄</span>
              </button>
            ))}
          </div>
        )}
        {primaryButtonLabel && onPrimaryButtonClick && (
          <button
            type="button"
            className="primary-button ml-auto"
            onClick={onPrimaryButtonClick}
          >
            <Icon name={IconName.PLUS} size={13} />
            <span>{primaryButtonLabel}</span>
          </button>
        )}
      </div>

      {/* Batch Actions Floating Toolbar */}
      {selectedIds.length > 0 && (
        <div className="batch-toolbar">
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs">
              Đã chọn {selectedIds.length} mục
            </span>
            <button
              type="button"
              className="text-[11px] text-slate-300 hover:text-white underline ml-2"
              onClick={() => setSelectedIds([])}
            >
              Bỏ chọn
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              onClick={() => {
                if (
                  confirm(
                    `Bạn có chắc chắn muốn xóa ${selectedIds.length} mục đã chọn không?`,
                  )
                ) {
                  alert(`Đã xóa ${selectedIds.length} mục thành công!`);
                  setSelectedIds([]);
                }
              }}
            >
              <Icon name={IconName.TRASH} size={12} />
              <span>Xóa các mục đã chọn</span>
            </button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="check-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              {columns.map((col, idx) => (
                <th key={idx} className={col.className}>
                  {col.header}
                </th>
              ))}
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="text-center py-10 text-slate-500 text-xs"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((item, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="check-col">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(rowIdx)}
                      onChange={() => toggleSelectRow(rowIdx)}
                    />
                  </td>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={col.className}>
                      {col.cell
                        ? col.cell(item, rowIdx)
                        : col.accessorKey
                          ? String(item[col.accessorKey] ?? '')
                          : null}
                    </td>
                  ))}
                  <td>
                    <div className="row-actions justify-end">
                      {onView ? (
                        <button
                          type="button"
                          className="quick-row-btn"
                          title="Xem chi tiết"
                          onClick={() => onView(item)}
                        >
                          <Icon name={IconName.EYE} size={13} />
                        </button>
                      ) : null}
                      {onEdit ? (
                        <button
                          type="button"
                          className="quick-row-btn"
                          title="Chỉnh sửa"
                          onClick={() => onEdit(item)}
                        >
                          <Icon name={IconName.EDIT} size={13} />
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          className="quick-row-btn danger"
                          title="Xóa"
                          onClick={() => onDelete(item)}
                        >
                          <Icon name={IconName.TRASH} size={13} />
                        </button>
                      ) : null}
                      <ActionMenu
                        onEdit={onEdit ? () => onEdit(item) : undefined}
                        onDelete={onDelete ? () => onDelete(item) : undefined}
                        onView={onView ? () => onView(item) : undefined}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>
          Hiển thị 1–{filteredData.length} trong {displayTotal} kết quả
        </span>
        <div>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
            <button
              key={pg}
              type="button"
              className={pg === currentPage ? 'selected' : ''}
              onClick={() => onPageChange && onPageChange(pg)}
            >
              {pg}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
