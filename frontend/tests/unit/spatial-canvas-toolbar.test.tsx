import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  SPATIAL_TOOLBAR_CONSTANTS,
  SpatialCanvasToolbar,
  type SpatialCanvasToolbarProps,
} from '@/features/mindmap/components/SpatialCanvasToolbar';

function createDefaultProps(
  overrides?: Partial<SpatialCanvasToolbarProps>,
): SpatialCanvasToolbarProps {
  return {
    drawerOpen: false,
    quickPrompt: 'Ngô Quyền',
    useGoogleSearch: false,
    zoom: 0.9,
    hasReadyNodes: true,
    exportingPng: false,
    savingMindmap: false,
    isLoggedIn: false,
    confirmReset: false,
    onQuickPromptChange: vi.fn(),
    onSubmitNewRoot: vi.fn(),
    onToggleGoogleSearch: vi.fn(),
    onToggleDrawer: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onResetView: vi.fn(),
    onExportPng: vi.fn(),
    onSaveStudio: vi.fn(),
    onResetCanvasClick: vi.fn(),
    ...overrides,
  };
}

describe('SpatialCanvasToolbar', () => {
  it('render đầy đủ các cụm điều khiển và hiển thị đúng phần trăm zoom', () => {
    const props = createDefaultProps();
    render(<SpatialCanvasToolbar {...props} />);

    expect(screen.getByPlaceholderText(SPATIAL_TOOLBAR_CONSTANTS.SEARCH_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText(SPATIAL_TOOLBAR_CONSTANTS.DRAWER_BTN_TEXT)).toBeInTheDocument();
    expect(screen.getByText(SPATIAL_TOOLBAR_CONSTANTS.SAVE_STUDIO_GUEST)).toBeInTheDocument();
  });

  it('gọi callback onToggleGoogleSearch khi nhấn toggle Google', () => {
    const onToggleGoogleSearch = vi.fn();
    const props = createDefaultProps({ onToggleGoogleSearch, useGoogleSearch: false });
    render(<SpatialCanvasToolbar {...props} />);

    const toggle = screen.getByTestId('google-search-toggle');
    fireEvent.click(toggle);

    expect(onToggleGoogleSearch).toHaveBeenCalledWith(true);
  });

  it('gọi các callback điều khiển zoom', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onResetView = vi.fn();

    const props = createDefaultProps({ onZoomIn, onZoomOut, onResetView, zoom: 1.25 });
    render(<SpatialCanvasToolbar {...props} />);

    fireEvent.click(screen.getByLabelText('Thu nhỏ Canvas'));
    expect(onZoomOut).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Phóng to Canvas'));
    expect(onZoomIn).toHaveBeenCalled();

    fireEvent.click(screen.getByText('125%'));
    expect(onResetView).toHaveBeenCalled();
  });

  it('hiển thị nhãn "Mở Studio" khi người dùng đã đăng nhập', () => {
    const props = createDefaultProps({ isLoggedIn: true });
    render(<SpatialCanvasToolbar {...props} />);

    expect(screen.getByText(SPATIAL_TOOLBAR_CONSTANTS.SAVE_STUDIO_LOGGED_IN)).toBeInTheDocument();
  });

  it('hiển thị trạng thái xác nhận xoá khi confirmReset là true', () => {
    const props = createDefaultProps({ confirmReset: true });
    render(<SpatialCanvasToolbar {...props} />);

    expect(screen.getByText(SPATIAL_TOOLBAR_CONSTANTS.RESET_CONFIRM_TEXT)).toBeInTheDocument();
  });

  it('vô hiệu hoá nút Xuất PNG và Mở Studio khi hasReadyNodes = false', () => {
    const props = createDefaultProps({ hasReadyNodes: false });
    render(<SpatialCanvasToolbar {...props} />);

    const exportBtn = screen.getByTitle(SPATIAL_TOOLBAR_CONSTANTS.EXPORT_PNG_TEXT);
    expect(exportBtn).toBeDisabled();
  });
});
