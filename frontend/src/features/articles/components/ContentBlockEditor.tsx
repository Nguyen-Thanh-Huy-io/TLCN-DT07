'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Undo2,
  Redo2,
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

export function ContentBlockEditor({
  value,
  onChange,
  skeletons,
  documentTitle = 'Tài liệu chi tiết',
  documentSubtitle = 'Bản ghi tri thức lịch sử',
  entityCategory = 'THỰC THỂ LỊCH SỬ',
  onPublish,
  allowedBlockTypes,
  compactInspector = false,
  accentColor = '#7c4b2e',
}: {
  value: unknown;
  onChange: (blocks: unknown) => void;
  skeletons?: ContentSkeleton[];
  documentTitle?: string;
  documentSubtitle?: string;
  entityCategory?: string;
  onPublish?: () => void;
  allowedBlockTypes?: LessonBlockType[];
  compactInspector?: boolean;
  accentColor?: string;
}) {
  const manager = useLessonBlockManager(value ?? null);
  const lastEmitted = useRef<string>('');
  const [showLeftPalette, setShowLeftPalette] = useState(true);
  const [showRightInspector, setShowRightInspector] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const json = manager.compileToJson();
    const serialized = JSON.stringify(json);
    if (serialized === lastEmitted.current) return;
    lastEmitted.current = serialized;
    onChange(json);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager.blocks]);

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

  const canvasWidthClass = useMemo(() => 'max-w-3xl', []);

  return (
    <ActiveEditorProvider>
      <div
        className={`flex flex-col overflow-hidden transition-colors ${
          previewMode ? 'bg-[#f7f3ee] text-[#1b1b1b]' : 'border-t border-b border-[#e7dcca] bg-[#f9f4ed] text-[#1e2423]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#e3d6c6] bg-[#f6f0e9] px-4 py-3 shrink-0 md:px-5">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a4d30]">
                Trình dựng bài
              </span>
              <span className="text-sm text-[#4f5f5b]">
                {documentTitle}
              </span>
            </div>

            <div className="hidden h-4 w-px bg-[#d9c9b5] sm:block" />

            <div className="hidden items-center gap-1 sm:flex">
              <button
                type="button"
                title="Hoàn tác"
                className="rounded-lg border border-[#d9c9b5] bg-white p-2 text-[#3d4a47] transition hover:border-[#8a4d2d] hover:text-[#8a4d2d]"
              >
                <Undo2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                title="Làm lại"
                className="rounded-lg border border-[#d9c9b5] bg-white p-2 text-[#3d4a47] transition hover:border-[#8a4d2d] hover:text-[#8a4d2d]"
              >
                <Redo2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode((p) => !p)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                previewMode
                  ? 'border-[#1f2a2b] bg-[#1f2a2b] text-[#f7f1e7]'
                  : 'border-[#d9c9b5] bg-white text-[#2d3938] hover:border-[#8a4d2d] hover:text-[#8a4d2d]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              {previewMode ? 'Đang xem trước' : 'Xem trước'}
            </button>

            <button
              type="button"
              onClick={() => setShowLeftPalette((p) => !p)}
              className="inline-flex items-center gap-2 rounded-full border border-[#d9c9b5] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2d3938] transition hover:border-[#8a4d2d] hover:text-[#8a4d2d]"
            >
              <PanelLeft className="h-3.5 w-3.5" />
              Khối
            </button>

            <button
              type="button"
              onClick={() => setShowRightInspector((p) => !p)}
              className="inline-flex items-center gap-2 rounded-full border border-[#d9c9b5] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2d3938] transition hover:border-[#8a4d2d] hover:text-[#8a4d2d]"
            >
              <PanelRight className="h-3.5 w-3.5" />
              Thuộc tính
            </button>

            {onPublish && (
              <button
                type="button"
                onClick={onPublish}
                className="rounded-full bg-[#1f2a2b] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f7f1e7] transition hover:bg-[#8a4d2d]"
              >
                Xuất bản
              </button>
            )}
          </div>
        </div>

        <div className={`flex overflow-hidden ${previewMode ? 'min-h-[760px]' : 'min-h-[720px]'}`}>
          {/* CỘT 1: THƯ VIỆN KHỐI (BÊN TRÁI) */}
          {showLeftPalette && (
            <div className="flex w-[340px] shrink-0 flex-col border-r border-[#e8dccb] bg-[#fffdfb]">
              <BlockLibraryPalette
                className="w-full border-r-0"
                allowedBlockTypes={allowedBlockTypes}
                accentColor={accentColor}
                onAddBlock={(type) => {
                  const newId = manager.addBlock(type);
                  manager.setActiveBlockId(newId);
                }}
              />

              {showRightInspector && (
                <div className="border-t border-[#e8dccb] bg-white">
                  <BlockPropertyInspector
                    block={activeBlock}
                    blockIndex={activeIndex}
                    onUpdateBlock={manager.updateBlock}
                    onRemoveBlock={manager.removeBlock}
                    onChangeRowColumnCount={manager.setRowColumnCount}
                    onUpdateRowRatio={manager.setRowRatio}
                    onClose={() => setShowRightInspector(false)}
                    className="w-full border-l-0 border-t-0 bg-white"
                    compact={compactInspector}
                    accentColor={accentColor}
                  />
                </div>
              )}
            </div>
          )}

          {/* CỘT 2: TRANG SOẠN THẢO (Ở GIỮA) */}
          <main className="flex-1 min-w-0 overflow-y-auto bg-[#fdfaf7] px-5 py-6 sm:px-8 lg:px-10">
            <div className={`mx-auto w-full ${canvasWidthClass} min-h-full`}>
              {(entityCategory || documentTitle) && (
                <div className="mb-6 border-b border-[#e6d8c5] pb-5">
                  {entityCategory && (
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a4d30]">
                      {entityCategory}
                    </div>
                  )}
                  <h1 className="mb-2 font-[family-name:var(--font-heading)] text-4xl leading-[1.02] text-[#1d2726] md:text-5xl">
                    {documentTitle}
                  </h1>
                  {documentSubtitle && (
                    <p className="max-w-[65ch] text-base leading-7 text-[#4d5d5a]">
                      {documentSubtitle}
                    </p>
                  )}
                </div>
              )}

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

        </div>
      </div>
    </ActiveEditorProvider>
  );
}
