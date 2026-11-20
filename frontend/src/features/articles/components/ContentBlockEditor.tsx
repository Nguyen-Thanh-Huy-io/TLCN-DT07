'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DifficultyLevel } from '@/constants/enums';
import type { TagItem } from '@/types/models';
import { useLessonBlockManager } from '@/features/lessons/facades/useLessonBlockManager';
import { BlockBuilderCanvas } from '@/features/lessons/components/builder/BlockBuilderCanvas';
import { LessonEditorSubHeader } from '@/features/lessons/components/LessonEditorHeader';
import { LessonLeftToolSidebar } from '@/features/lessons/components/LessonLeftToolSidebar';
import { LessonPreviewContent } from '@/features/lessons/components/LessonPreviewContent';
import { LessonPropertiesPanel } from '@/features/lessons/components/properties/LessonPropertiesPanel';
import { ActiveEditorProvider } from '@/features/lessons/context/ActiveEditorContext';
import {
  EditorViewMode,
  LeftSidebarMode,
  LessonBlockType,
} from '@/features/lessons/types/editor.types';
import { buildLessonTocAndHtml } from '@/features/lessons/utils/lesson-toc.util';
import { collectQuizBlocks } from '@/features/lessons/utils/lesson-quiz.util';

export interface ContentSkeleton {
  label: string;
  html: string;
}

export interface ContentBlockEditorProps {
  value: unknown;
  onChange: (blocks: unknown) => void;
  skeletons?: ContentSkeleton[];
  documentTitle?: string;
  documentSubtitle?: string;
  entityCategory?: string;
  thumbnailUrl?: string;
  selectedTags?: TagItem[];
  sourceReferenceNote?: string;
  topicId?: string;
  onOpenInfoTab?: () => void;
}

/**
 * Trình dựng nội dung khối của Bài viết — tái sử dụng trọn bộ không gian CMS từ LessonEditor
 * (`LessonLeftToolSidebar`, `LessonEditorSubHeader`, `BlockBuilderCanvas`, `LessonPreviewContent`,
 * `LessonPropertiesPanel`) để trải nghiệm soạn thảo, chia đôi màn hình, mục lục tự động và xem trước
 * đồng nhất hoàn toàn với trang Bài học.
 */
export function ContentBlockEditor({
  value,
  onChange,
  skeletons,
  documentTitle = 'Bài viết mới',
  documentSubtitle,
  thumbnailUrl = '',
  selectedTags = [],
  sourceReferenceNote = '',
  topicId,
  onOpenInfoTab,
}: ContentBlockEditorProps) {
  const manager = useLessonBlockManager(value ?? null);
  const lastEmitted = useRef<string>('');

  const [activeTab, setActiveTab] = useState<EditorViewMode>(EditorViewMode.EDIT);
  const [showLeftToc, setShowLeftToc] = useState(true);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [leftSidebarMode, setLeftSidebarMode] = useState<LeftSidebarMode>(LeftSidebarMode.BLOCKS);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);

  useEffect(() => {
    const json = manager.compileToJson();
    const serialized = JSON.stringify(json);
    if (serialized === lastEmitted.current) return;
    lastEmitted.current = serialized;
    onChange(json);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager.blocks]);

  useEffect(() => {
    if (manager.activeBlockId) {
      void Promise.resolve().then(() => {
        setShowSidebar(true);
      });
    }
  }, [manager.activeBlockId]);

  const insertSkeleton = (html: string) => {
    const id = manager.addBlock(LessonBlockType.TEXT);
    manager.updateBlock(id, { content: html });
  };

  const activeBlock = useMemo(() => {
    if (!manager.activeBlockId) return null;
    return manager.blocks.find((b) => b.id === manager.activeBlockId) || null;
  }, [manager.blocks, manager.activeBlockId]);

  const activeBlockIndex = useMemo(() => {
    if (!manager.activeBlockId) return undefined;
    const idx = manager.blocks.findIndex((b) => b.id === manager.activeBlockId);
    return idx >= 0 ? idx : undefined;
  }, [manager.blocks, manager.activeBlockId]);

  const { tocItems, html: enrichedPreviewHtml } = useMemo(
    () => buildLessonTocAndHtml(manager.blocks),
    [manager.blocks],
  );

  const quizBlocks = useMemo(() => collectQuizBlocks(manager.blocks), [manager.blocks]);

  const { wordCount, estimatedReadMinutes } = useMemo(() => {
    const plain = enrichedPreviewHtml.replace(/<[^>]+>/g, ' ').trim();
    const words = plain ? plain.split(/\s+/).length : 0;
    return {
      wordCount: words,
      estimatedReadMinutes: Math.max(1, Math.ceil(words / 200)),
    };
  }, [enrichedPreviewHtml]);

  const isInspectorVisible =
    showSidebar &&
    !isFullscreen &&
    activeTab !== EditorViewMode.SPLIT &&
    activeTab !== EditorViewMode.PREVIEW;

  const renderPreview = (compact: boolean = false) => (
    <LessonPreviewContent
      compact={compact}
      tocItems={tocItems}
      isTocCollapsed={isTocCollapsed}
      onToggleTocCollapsed={() => setIsTocCollapsed((prev) => !prev)}
      thumbnailUrl={thumbnailUrl}
      title={documentTitle}
      topicName={documentSubtitle}
      difficulty={DifficultyLevel.MEDIUM}
      wordCount={wordCount}
      estimatedReadMinutes={estimatedReadMinutes}
      selectedTags={selectedTags}
      enrichedPreviewHtml={enrichedPreviewHtml}
      quizBlocks={quizBlocks}
      visualMediaItems={[]}
      documentMediaItems={[]}
      sourceReferenceNote={sourceReferenceNote}
    />
  );

  return (
    <ActiveEditorProvider isInspectorVisible={isInspectorVisible}>
      {activeTab === EditorViewMode.PREVIEW ? (
        <div className="space-y-3">
          <LessonEditorSubHeader
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
            showLeftToc={showLeftToc}
            onToggleLeftToc={() => setShowLeftToc((prev) => !prev)}
          />
          <div className="h-[calc(100vh-170px)] min-h-[550px]">{renderPreview()}</div>
        </div>
      ) : (
        <div
          className={`flex flex-col lg:flex-row gap-4 items-stretch transition-all ${
            isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-4' : ''
          }`}
          style={{ minHeight: isFullscreen ? '100vh' : 'calc(100vh - 150px)' }}
        >
          {showLeftToc && !isFullscreen && (
            <LessonLeftToolSidebar
              isCollapsed={isLeftSidebarCollapsed}
              onCollapse={() => setIsLeftSidebarCollapsed(true)}
              onExpand={() => setIsLeftSidebarCollapsed(false)}
              mode={leftSidebarMode}
              onChangeMode={setLeftSidebarMode}
              tocItems={tocItems}
              onInsertBlock={(type) => {
                const newId = manager.addBlock(type);
                manager.setActiveBlockId(newId);
              }}
            />
          )}

          <main className="flex-1 min-w-0 flex flex-col bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-xs overflow-y-auto h-full">
            <div
              className={`w-full mx-auto flex flex-col gap-3 flex-1 min-h-0 transition-all duration-200 ${
                !showSidebar ? 'max-w-5xl' : 'max-w-[820px]'
              }`}
            >
              <LessonEditorSubHeader
                inline
                activeTab={activeTab}
                onChangeTab={setActiveTab}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
                showLeftToc={showLeftToc}
                onToggleLeftToc={() => setShowLeftToc((prev) => !prev)}
                showSidebar={showSidebar}
                onToggleSidebar={() => setShowSidebar((prev) => !prev)}
              />

              {skeletons && skeletons.length > 0 && manager.blocks.length === 0 && (
                <div className="py-3 border-b border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Khởi tạo nhanh từ sườn bài mẫu:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {skeletons.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => insertSkeleton(s.html)}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-[480px]">
                <BlockBuilderCanvas
                  blocks={manager.blocks}
                  activeBlockId={manager.activeBlockId}
                  onSelectBlock={manager.setActiveBlockId}
                  onAddBlock={(type, atIndex) => manager.addBlock(type, atIndex)}
                  onUpdateBlock={manager.updateBlock}
                  onRemoveBlock={manager.removeBlock}
                  onMoveBlock={manager.moveBlock}
                  onMoveByDirection={manager.moveBlockByDirection}
                  onUpdateRowRatio={manager.setRowRatio}
                  onChangeRowColumnCount={manager.setRowColumnCount}
                  onAddBlockToColumn={manager.addBlockToColumn}
                  onUpdateBlockInColumn={manager.updateBlockInColumn}
                  onRemoveBlockFromColumn={manager.removeBlockFromColumn}
                  quizTopicId={topicId}
                />
              </div>

              <div className="shrink-0 flex items-center justify-between pt-3 mt-4 border-t border-slate-200 text-xs text-slate-500 select-none">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">
                    <strong>{wordCount}</strong> từ
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>~{estimatedReadMinutes} phút đọc</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400">{manager.blocks.length} khối nội dung</span>
                </div>
              </div>
            </div>
          </main>

          {activeTab === EditorViewMode.SPLIT && (
            <div className="flex-1 min-w-0 h-full">{renderPreview(true)}</div>
          )}

          {showSidebar && !isFullscreen && activeTab !== EditorViewMode.SPLIT && (
            <LessonPropertiesPanel
              onClose={() => setShowSidebar(false)}
              onOpenInfoTab={onOpenInfoTab}
              activeBlock={activeBlock}
              activeBlockIndex={activeBlockIndex}
              onUpdateBlock={manager.updateBlock}
              onRemoveBlock={manager.removeBlock}
              onChangeRowColumnCount={manager.setRowColumnCount}
              onUpdateRowRatio={manager.setRowRatio}
            />
          )}
        </div>
      )}
    </ActiveEditorProvider>
  );
}
