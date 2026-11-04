'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Eye,
  PanelLeft,
  PanelRight,
} from 'lucide-react';
import { useLessonBlockManager } from '@/features/lessons/facades/useLessonBlockManager';
import { BlockBuilderCanvas } from '@/features/lessons/components/builder/BlockBuilderCanvas';
import { BlockLibraryPalette } from '@/features/lessons/components/builder/BlockLibraryPalette';
import { BlockPropertyInspector } from '@/features/lessons/components/builder/BlockPropertyInspector';
import { ActiveEditorProvider } from '@/features/lessons/context/ActiveEditorContext';
import { LessonBlockType } from '@/features/lessons/types/block-palette.types';

export interface ContentSkeleton {
  label: string;
  html: string;
}

export type ViewportMode = 'DESKTOP' | 'TABLET' | 'MOBILE';

export function ContentBlockEditor({
  value,
  onChange,
  skeletons,
  documentTitle = 'Tài liệu chi tiết',
  documentSubtitle = 'Bản ghi tri thức lịch sử',
  entityCategory = 'THỰC THỂ LỊCH SỬ',
  onPublish,
}: {
  value: unknown;
  onChange: (blocks: unknown) => void;
  skeletons?: ContentSkeleton[];
  documentTitle?: string;
  documentSubtitle?: string;
  entityCategory?: string;
  onPublish?: () => void;
}) {
  const manager = useLessonBlockManager(value ?? null);
  const lastEmitted = useRef<string>('');
  const [showLeftPalette, setShowLeftPalette] = useState(true);
  const [showRightInspector, setShowRightInspector] = useState(true);
  const [viewport, setViewport] = useState<ViewportMode>('DESKTOP');
  const [savedTime, setSavedTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const json = manager.compileToJson();
    const serialized = JSON.stringify(json);
    if (serialized === lastEmitted.current) return;
    lastEmitted.current = serialized;
    onChange(json);
    const now = new Date();
    setSavedTime(
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager.blocks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const insertSkeleton = (html: string) => {
    const id = manager.addBlock(LessonBlockType.TEXT);
    manager.updateBlock(id, { content: html });
  };

  const activeIndex = useMemo(() => {
    if (!manager.activeBlockId) return undefined;
    const idx = manager.blocks.findIndex((b) => b.id === manager.activeBlockId);
    return idx >= 0 ? idx : undefined;
  }, [manager.blocks, manager.activeBlockId]);

  const activeBlock = useMemo(() => {
    if (!manager.activeBlockId) return null;
    return manager.blocks.find((b) => b.id === manager.activeBlockId) || null;
  }, [manager.blocks, manager.activeBlockId]);

  const canvasWidthClass = useMemo(() => {
    switch (viewport) {
      case 'MOBILE':
        return 'max-w-sm';
      case 'TABLET':
        return 'max-w-2xl';
      case 'DESKTOP':
      default:
        return 'max-w-3xl';
    }
  }, [viewport]);

  return (
    <ActiveEditorProvider>
      <div
        className={`flex flex-col border-t border-b border-stone-200 bg-white overflow-hidden transition-colors ${
          isFullscreen
            ? 'fixed inset-0 z-[120] w-screen h-screen'
            : 'w-full'
        }`}
      >
        {/* 1. THANH ĐIỀU KHIỂN TRÊN CÙNG */}
        <div className="bg-white px-4 py-3 border-b border-stone-200 flex items-center justify-between gap-3 shrink-0">
          {/* Nhóm Bên Trái */}
          <div className="flex items-center gap-3">
            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 hover:bg-stone-100 rounded-lg text-stone-800 text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Thoát toàn màn hình"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </button>
            )}

            <div className="flex flex-col">
              <span className="text-sm font-bold text-stone-900 leading-tight">
                Trình dựng trang
              </span>
              <span className="text-xs text-stone-600 leading-tight mt-0.5">
                {documentTitle} · Chi tiết thực thể
              </span>
            </div>

            <div className="h-4 w-px bg-stone-200 mx-1 hidden sm:block" />

            {/* Hoàn tác / Làm lại */}
            <div className="hidden sm:flex items-center gap-1 text-stone-700">
              <button
                type="button"
                title="Hoàn tác"
                className="p-2 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <Undo2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                title="Làm lại"
                className="p-2 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <Redo2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Trạng thái lưu */}
            <span className="text-xs text-stone-600 hidden md:inline-block">
              {savedTime ? `Đã lưu lúc ${savedTime}` : 'Đã đồng bộ'}
            </span>
          </div>

          {/* Nhóm Bên Phải */}
          <div className="flex items-center gap-2">
            {/* Chọn khung nhìn (Máy tính / Máy tính bảng / Điện thoại) */}
            <div className="flex items-center gap-1.5 text-sm">
              <button
                type="button"
                onClick={() => setViewport('DESKTOP')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  viewport === 'DESKTOP'
                    ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50 font-medium'
                }`}
              >
                Máy tính
              </button>
              <button
                type="button"
                onClick={() => setViewport('TABLET')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  viewport === 'TABLET'
                    ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50 font-medium'
                }`}
              >
                Máy tính bảng
              </button>
              <button
                type="button"
                onClick={() => setViewport('MOBILE')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  viewport === 'MOBILE'
                    ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50 font-medium'
                }`}
              >
                Điện thoại
              </button>
            </div>

            {/* Nút Toàn màn hình */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isFullscreen
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
              }`}
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
              <span className="hidden lg:inline">
                {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              </span>
            </button>

            {isFullscreen && (
              <>
                <button
                  type="button"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-800 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem trước</span>
                </button>

                {onPublish && (
                  <button
                    type="button"
                    onClick={onPublish}
                    className="px-4 py-1.5 text-sm font-semibold bg-stone-900 text-white hover:bg-black rounded-lg transition-colors cursor-pointer"
                  >
                    Xuất bản
                  </button>
                )}
              </>
            )}

            {/* Bật / tắt bảng hai bên */}
            <div className="flex items-center gap-1 border-l border-stone-200 pl-2">
              <button
                type="button"
                title={showLeftPalette ? 'Ẩn thư viện khối' : 'Hiện thư viện khối'}
                onClick={() => setShowLeftPalette((p) => !p)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  showLeftPalette
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                title={showRightInspector ? 'Ẩn bảng thuộc tính' : 'Hiện bảng thuộc tính'}
                onClick={() => setShowRightInspector((p) => !p)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  showRightInspector
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <PanelRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. BỐ CỤC BA CỘT TRÌNH DỰNG TRANG */}
        <div
          className={`flex overflow-hidden ${
            isFullscreen ? 'flex-1 h-[calc(100vh-57px)]' : 'h-[calc(100vh-190px)] min-h-[720px]'
          }`}
        >
          {/* CỘT 1: THƯ VIỆN KHỐI (BÊN TRÁI) */}
          {showLeftPalette && (
            <BlockLibraryPalette
              className="w-64"
              onAddBlock={(type) => {
                const newId = manager.addBlock(type);
                manager.setActiveBlockId(newId);
              }}
            />
          )}

          {/* CỘT 2: TRANG SOẠN THẢO (Ở GIỮA) */}
          <main className="flex-1 min-w-0 overflow-y-auto px-6 sm:px-12 py-8 bg-white flex flex-col items-center">
            <div className={`w-full ${canvasWidthClass} min-h-full`}>
              {/* Header tài liệu */}
              <div className="border-b border-stone-200 pb-6 mb-6">
                <div className="text-xs font-bold tracking-widest uppercase text-stone-700 mb-2">
                  {entityCategory}
                </div>
                <h1 className="text-4xl font-serif font-bold text-stone-900 tracking-tight mb-2 leading-tight">
                  {documentTitle}
                </h1>
                <p className="text-base text-stone-600 font-medium max-w-[65ch]">
                  {documentSubtitle}
                </p>
              </div>

              {/* Khối Sườn bài mẫu nếu danh sách khối còn trống */}
              {skeletons && skeletons.length > 0 && manager.blocks.length === 0 && (
                <div className="mb-6 py-4 border-b border-stone-200">
                  <p className="text-base font-medium text-stone-700 mb-3 max-w-[65ch]">
                    Trang chưa có nội dung. Bạn có thể khởi tạo nhanh từ sườn bài mẫu:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {skeletons.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => insertSkeleton(s.html)}
                        className="px-3.5 py-2 text-sm font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh sách các Khối nội dung */}
              <BlockBuilderCanvas
                blocks={manager.blocks}
                activeBlockId={manager.activeBlockId}
                onSelectBlock={manager.setActiveBlockId}
                onAddBlock={manager.addBlock}
                onUpdateBlock={manager.updateBlock}
                onRemoveBlock={manager.removeBlock}
                onMoveBlock={manager.moveBlock}
                onMoveByDirection={manager.moveBlockByDirection}
                onUpdateRowRatio={manager.setRowRatio}
                onChangeRowColumnCount={manager.setRowColumnCount}
                onAddBlockToColumn={manager.addBlockToColumn}
                onUpdateBlockInColumn={manager.updateBlockInColumn}
                onRemoveBlockFromColumn={manager.removeBlockFromColumn}
              />
            </div>
          </main>

          {/* CỘT 3: THUỘC TÍNH KHỐI (BÊN PHẢI) */}
          {showRightInspector && (
            <BlockPropertyInspector
              block={activeBlock}
              blockIndex={activeIndex}
              onUpdateBlock={manager.updateBlock}
              onRemoveBlock={manager.removeBlock}
              onChangeRowColumnCount={manager.setRowColumnCount}
              onUpdateRowRatio={manager.setRowRatio}
              onClose={() => setShowRightInspector(false)}
            />
          )}
        </div>
      </div>
    </ActiveEditorProvider>
  );
}
