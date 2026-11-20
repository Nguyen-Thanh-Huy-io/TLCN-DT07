import React from 'react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  className?: string;
  cell?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableFilterOption {
  label: string;
  value: string;
  subLabel?: string;
}

export interface DataTableFilter {
  label: string;
  options?: DataTableFilterOption[];
  selectedValue?: string;
  /** Danh sách các giá trị đang được chọn (dành cho chế độ lọc chọn nhiều Multi-Select) */
  selectedValues?: string[];
  /** Bật tính năng chọn nhiều thẻ tag/badges thay vì chỉ chọn 1 */
  isMultiSelect?: boolean;
  onSelect?: (value: string) => void;
  /** Callback xử lý khi thay đổi mảng giá trị đã chọn trong chế độ Multi-Select */
  onSelectMultiple?: (values: string[]) => void;
  onClick?: () => void;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: DataTableFilter[];
  primaryButtonLabel?: string;
  onPrimaryButtonClick?: () => void;
  /** Nút hoặc menu tùy biến thay thế primary button đơn */
  customPrimaryAction?: React.ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  emptyMessage?: string;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}
