'use client';

import React, { useEffect, useState } from 'react';
import { KeyboardKey } from '@/constants/enums';
import {
  Crosshair,
  Expand,
  Hand,
  Keyboard,
  Maximize2,
  Minimize2,
  MousePointer2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { MindmapToolMode } from '../constants/mindmap.constants';

const SHORTCUT_ITEMS: ReadonlyArray<{ keys: string; desc: string }> = [
  { keys: 'Tab', desc: 'Thêm nhánh con cho node đang chọn' },
  { keys: 'Enter', desc: 'Thêm node anh em cùng cấp' },
  { keys: 'Double-click', desc: 'Sửa nhanh nội dung node' },
  { keys: 'Delete', desc: 'Xoá node & nhánh con đang chọn' },
  { keys: 'Ctrl + Z / Y', desc: 'Hoàn tác / Làm lại' },
  { keys: 'Cuộn / Kéo nền', desc: 'Phóng to, thu nhỏ hoặc di chuyển' },
];

/** Thanh công cụ dọc nổi bên trái giống MindMeister / XMind. */
export function MindmapLeftToolbar({
  toolMode,
  isFullscreen,
  zoom,
  onChangeToolMode,
  onFitView,
  onCenterRoot,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleFullscreen,
}: {
  toolMode: MindmapToolMode;
  isFullscreen: boolean;
  zoom: number;
  onChangeToolMode: (mode: MindmapToolMode) => void;
  onFitView: () => void;
  onCenterRoot: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleFullscreen: () => void;
}) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (!showShortcuts) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) setShowShortcuts(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showShortcuts]);

  const btnCls =
    'grid size-8 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer';
  const activeToolCls = 'bg-indigo-50 text-indigo-700';

  return (
    <div className="pointer-events-auto absolute left-3.5 top-4 z-30 flex items-start gap-2">
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-md backdrop-blur-xs">
        <button type="button" onClick={onFitView} title="Căn vừa toàn sơ đồ" className={btnCls}>
          <Expand size={15} />
        </button>
        <button type="button" onClick={onCenterRoot} title="Đưa về chủ đề trung tâm" className={btnCls}>
          <Crosshair size={15} />
        </button>

        <div className="my-0.5 h-px w-5 bg-slate-200" />

        <button type="button" onClick={onZoomIn} title="Phóng to" className={btnCls}>
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          title="Đặt lại tỉ lệ 100%"
          className="rounded-lg px-1 py-0.5 font-mono text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={onZoomOut} title="Thu nhỏ" className={btnCls}>
          <ZoomOut size={15} />
        </button>
        <button type="button" onClick={onResetZoom} title="Zoom 100%" className={btnCls}>
          <RotateCcw size={14} />
        </button>

        <div className="my-0.5 h-px w-5 bg-slate-200" />

        <button
          type="button"
          onClick={() => onChangeToolMode(MindmapToolMode.HAND)}
          title="Chế độ kéo bảng (Bàn tay)"
          className={`grid size-8 place-items-center rounded-xl transition cursor-pointer ${
            toolMode === MindmapToolMode.HAND
              ? activeToolCls
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Hand size={15} />
        </button>
        <button
          type="button"
          onClick={() => onChangeToolMode(MindmapToolMode.POINTER)}
          title="Chế độ chọn & kéo thả node"
          className={`grid size-8 place-items-center rounded-xl transition cursor-pointer ${
            toolMode === MindmapToolMode.POINTER
              ? activeToolCls
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MousePointer2 size={15} />
        </button>

        <div className="my-0.5 h-px w-5 bg-slate-200" />

        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Thu gọn khỏi toàn màn hình' : 'Mở rộng toàn màn hình'}
          className={btnCls}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        <button
          type="button"
          onClick={() => setShowShortcuts((v) => !v)}
          title="Phím tắt Mindmap"
          className={`grid size-8 place-items-center rounded-xl transition cursor-pointer ${
            showShortcuts ? activeToolCls : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Keyboard size={15} />
        </button>
      </div>

      {showShortcuts && (
        <div className="w-64 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg">
          <div className="mb-2 font-bold text-slate-900">Phím tắt thao tác nhanh</div>
          <ul className="space-y-1.5">
            {SHORTCUT_ITEMS.map((item) => (
              <li key={item.keys} className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-600">{item.desc}</span>
                <kbd className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-800">
                  {item.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
