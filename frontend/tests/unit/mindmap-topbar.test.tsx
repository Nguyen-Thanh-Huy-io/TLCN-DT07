import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MindmapSaveState,
  MindmapTopBar,
  type MindmapTopBarProps,
} from '@/features/mindmap/components/MindmapTopBar';

const DEFAULT_TITLE = 'Chiến dịch Điện Biên Phủ 1954';
const UPDATED_TITLE = 'Chiến thắng lịch sử Điện Biên Phủ';
const STICKY_BUTTON_TEXT = 'Ghi chú dán';

function renderTopBar(overrides: Partial<MindmapTopBarProps> = {}) {
  const props: MindmapTopBarProps = {
    title: DEFAULT_TITLE,
    saveState: MindmapSaveState.SAVED,
    canUndo: true,
    canRedo: false,
    hasSelectedNode: true,
    isLinking: false,
    readerOpen: false,
    sidebarOpen: true,
    onBack: vi.fn(),
    onTitleChange: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onAddChild: vi.fn(),
    onAddSibling: vi.fn(),
    onToggleLink: vi.fn(),
    onToggleReader: vi.fn(),
    onToggleSidebar: vi.fn(),
    onPrint: vi.fn(),
    onShareToCommunity: vi.fn(),
    ...overrides,
  };

  const utils = render(<MindmapTopBar {...props} />);
  return { ...utils, props };
}

describe('MindmapTopBar (Refactored 3-Cluster Layout)', () => {
  it('renders all 3 core clusters and excludes cluttered sticky note button', () => {
    renderTopBar();

    // Cụm 1: Danh sách, Title, Trạng thái lưu
    expect(screen.getByText('Danh sách')).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_TITLE)).toBeInTheDocument();
    expect(screen.getByText('Đã lưu')).toBeInTheDocument();

    // Cụm 2: Thao tác vẽ cây cốt lõi
    expect(screen.getByText('Nhánh con')).toBeInTheDocument();
    expect(screen.getByText('Anh em')).toBeInTheDocument();
    expect(screen.getByText('Nối dây')).toBeInTheDocument();

    // Đã loại bỏ nút Ghi chú dán theo thiết kế mới
    expect(screen.queryByText(STICKY_BUTTON_TEXT)).toBeNull();

    // Cụm 3: Tiện ích & Xuất bản
    expect(screen.getByText('Tài liệu học')).toBeInTheDocument();
    expect(screen.getByText('Xuất')).toBeInTheDocument();
    expect(screen.getByText('Chia sẻ')).toBeInTheDocument();
  });

  it('triggers core tree building actions when clicking child and sibling buttons', () => {
    const onAddChild = vi.fn();
    const onAddSibling = vi.fn();
    const onToggleLink = vi.fn();

    renderTopBar({ onAddChild, onAddSibling, onToggleLink });

    fireEvent.click(screen.getByText('Nhánh con'));
    expect(onAddChild).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Anh em'));
    expect(onAddSibling).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nối dây'));
    expect(onToggleLink).toHaveBeenCalledTimes(1);
  });

  it('disables sibling button when no node is selected', () => {
    renderTopBar({ hasSelectedNode: false });
    const siblingBtn = screen.getByTitle('Thêm nhánh ngang hàng (Phím tắt: Enter)');
    expect(siblingBtn).toBeDisabled();
  });

  it('handles undo/redo and title changes correctly', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onTitleChange = vi.fn();

    renderTopBar({ canUndo: true, canRedo: true, onUndo, onRedo, onTitleChange });

    fireEvent.click(screen.getByTitle('Hoàn tác (Ctrl+Z)'));
    expect(onUndo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Làm lại (Ctrl+Y)'));
    expect(onRedo).toHaveBeenCalledTimes(1);

    const input = screen.getByLabelText('Tên sơ đồ tư duy');
    fireEvent.change(input, { target: { value: UPDATED_TITLE } });
    expect(onTitleChange).toHaveBeenCalledWith(UPDATED_TITLE);
  });

  it('renders saving and error states gracefully', () => {
    const { rerender } = render(
      <MindmapTopBar
        title={DEFAULT_TITLE}
        saveState={MindmapSaveState.SAVING}
        canUndo={false}
        canRedo={false}
        hasSelectedNode={false}
        isLinking={false}
        readerOpen={false}
        sidebarOpen={false}
        onBack={vi.fn()}
        onTitleChange={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onAddChild={vi.fn()}
        onAddSibling={vi.fn()}
        onToggleLink={vi.fn()}
        onToggleReader={vi.fn()}
        onToggleSidebar={vi.fn()}
        onPrint={vi.fn()}
      />,
    );
    expect(screen.getByText('Đang lưu…')).toBeInTheDocument();

    rerender(
      <MindmapTopBar
        title={DEFAULT_TITLE}
        saveState={MindmapSaveState.ERROR}
        canUndo={false}
        canRedo={false}
        hasSelectedNode={false}
        isLinking={false}
        readerOpen={false}
        sidebarOpen={false}
        onBack={vi.fn()}
        onTitleChange={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onAddChild={vi.fn()}
        onAddSibling={vi.fn()}
        onToggleLink={vi.fn()}
        onToggleReader={vi.fn()}
        onToggleSidebar={vi.fn()}
        onPrint={vi.fn()}
      />,
    );
    expect(screen.getByText('Lỗi lưu')).toBeInTheDocument();
  });

  it('opens export dropdown and triggers onPrint action', () => {
    const onPrint = vi.fn();
    renderTopBar({ onPrint });

    const exportBtn = screen.getByTitle('Tuỳ chọn xuất sơ đồ');
    fireEvent.click(exportBtn);

    const printOption = screen.getByText('In / Lưu PDF');
    expect(printOption).toBeInTheDocument();

    fireEvent.click(printOption);
    expect(onPrint).toHaveBeenCalledTimes(1);
  });
});
