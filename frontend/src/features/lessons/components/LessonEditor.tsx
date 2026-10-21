'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ContentStatus, DifficultyLevel, MediaType } from '@/constants/enums';
import { useLessonEditorFacade } from '../facades/useLessonEditorFacade';
import { useLessonBlockManager } from '../facades/useLessonBlockManager';
import { BlockBuilderCanvas } from './builder/BlockBuilderCanvas';
import { EditorViewMode, LeftSidebarMode, SidebarTab } from '../types/editor.types';
import { TopicParentModalPicker } from '@/features/topics/components/TopicParentModalPicker';
import { LessonTemplateFactory } from '../templates/lesson-template.factory';
import { LessonTemplateType } from '../templates/lesson-template.types';
import { CurriculumSidePanel } from '@/features/curriculum/components/CurriculumSidePanel';
import { CurriculumTreePreviewModal } from '@/features/curriculum/components/CurriculumTreePreviewModal';
import { LessonBlockType } from '../types/block-palette.types';
import { LessonHeaderMetaForm } from './LessonHeaderMetaForm';
import { LessonHeaderMetaData } from '../types/header-meta.types';
import { LessonEditorHeader } from './LessonEditorHeader';
import { LessonEditorSubHeader } from './LessonEditorSubHeader';
import { LessonLeftToolSidebar } from './LessonLeftToolSidebar';
import { LessonPreviewContent } from './LessonPreviewContent';
import { LessonPropertiesPanel } from './properties/LessonPropertiesPanel';
import { buildLessonTocAndHtml } from '../utils/lesson-toc.util';
import { useQuizEditor } from '../facades/useQuizEditor';

export interface LessonEditorProps {
  lessonId?: string;
}

/**
 * LessonEditor — bộ điều phối: giữ toàn bộ state & nghiệp vụ (facade bài học, facade
 * khối nội dung, đồng bộ HTML/TOC...), còn phần hiển thị được tách ra các component con
 * (`LessonEditorHeader`, `LessonEditorSubHeader`, `LessonLeftToolSidebar`,
 * `LessonPreviewContent`, `properties/LessonPropertiesPanel`...) để file này không phình
 * quá lớn (trước đây gần 1500 dòng dồn hết vào 1 file).
 */
export function LessonEditor({ lessonId: propLessonId }: LessonEditorProps = {}) {
  const [activeTab, setActiveTab] = useState<EditorViewMode>(EditorViewMode.EDIT);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.CLASSIFICATION);
  // Đề xuất: Thuộc tính bên phải đóng mặc định khi không cần, mở dạng panel khi chỉnh sửa
  const [showSidebar, setShowSidebar] = useState(false);
  // Đề xuất: Sidebar trái có thể thu gọn thành thanh công cụ mỏng hoặc mở theo nhu cầu
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [showLeftToc, setShowLeftToc] = useState(true);
  const [leftSidebarMode, setLeftSidebarMode] = useState<LeftSidebarMode>(LeftSidebarMode.BLOCKS);
  const [isTopicPickerOpen, setIsTopicPickerOpen] = useState(false);
  const [isCurriculumPreviewOpen, setIsCurriculumPreviewOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [openSection, setOpenSection] = useState<'difficulty' | 'tags' | 'order' | null>(null);

  // Đóng MoreMenu khi nhấp chuột ra ngoài
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // Facade Hook
  const {
    title,
    setTitle,
    slug,
    setSlug,
    description,
    setDescription,
    selectedTopicId,
    setSelectedTopicId,
    contentRichText,
    setContentRichText,
    difficulty,
    setDifficulty,
    sourceReferenceNote,
    setSourceReferenceNote,
    thumbnailUrl,
    setThumbnailUrl,
    displayOrder,
    setDisplayOrder,
    status,
    mediaList,
    addMediaItem,
    removeMediaItem,
    initialBlockContent,
    topics,
    topicLessons,
    loadingTopicLessons,
    loadingLesson,
    saving,
    wordCount,
    estimatedReadMinutes,
    lessonId,
    hasLocalDraft,
    lastSavedTime,
    lastSavedAt,
    autoSaveState,
    restoreDraft,
    dismissDraft,
    selectedTags,
    setSelectedTags,
    submitLesson,
  } = useLessonEditorFacade(propLessonId);

  // Facade quản lý danh sách các Khối nội dung độc lập (Block-based Page Builder)
  // Lưu ý: khởi tạo với `contentRichText` ở đây CHỈ có tác dụng cho lần render đầu tiên
  // (lúc đó luôn rỗng nếu đang sửa bài học có sẵn, vì API chưa trả dữ liệu kịp) — nội dung
  // thật được nạp lại đúng 1 lần ở effect "nạp nội dung thật" ngay dưới đây.
  const blockManager = useLessonBlockManager(contentRichText);

  // Đề ôn tập cuối bài — dùng CHUNG 1 instance cho cả tab "Đề ôn tập" (Panel Thuộc tính)
  // và phần hiển thị cuối bài ở tab "Xem trước", để tránh gọi API 2 lần và luôn đồng bộ.
  const quiz = useQuizEditor(lessonId);

  // Nạp nội dung khối THẬT của bài học vào Block Builder — đúng 1 lần, ngay khi API tải xong
  // (lessonId tồn tại và loadingLesson chuyển từ true -> false). Nếu không có effect này,
  // canvas sẽ mãi hiển thị khối mẫu rỗng khởi tạo ban đầu thay vì nội dung bài học thật.
  const hasLoadedRealContentRef = useRef(false);
  useEffect(() => {
    if (!lessonId || loadingLesson || hasLoadedRealContentRef.current) return;
    if (initialBlockContent === undefined || initialBlockContent === null) return;
    blockManager.loadFromContent(initialBlockContent);
    hasLoadedRealContentRef.current = true;
  }, [lessonId, loadingLesson, initialBlockContent]);

  // Đồng bộ HTML từ danh sách khối sang contentRichText để tự động cập nhật Mục lục TOC, số từ và xem trước
  useEffect(() => {
    const html = blockManager.compileToHtml();
    setContentRichText(html);
  }, [blockManager.blocks, blockManager.resourceLinks, blockManager.compileToHtml, setContentRichText]);

  // Xử lý chèn khối nội dung từ Block Palette bên trái
  const handleInsertBlock = (blockType: LessonBlockType) => {
    blockManager.addBlock(blockType);
  };

  const handleSaveLesson = (nextStatus: ContentStatus | any) => {
    submitLesson(nextStatus, blockManager.compileToJson());
  };

  // Chủ đề hiện tại đang chọn
  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId);
  }, [topics, selectedTopicId]);

  // Thông tin bài học ở đầu trang (Metadata Form Header)
  const [headerMeta, setHeaderMeta] = useState<LessonHeaderMetaData>({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    thumbnailUrl: '',
    tags: [],
    topicId: '',
    difficulty: DifficultyLevel.MEDIUM,
  });

  // Đồng bộ hai chiều từ Facade vào HeaderMeta
  useEffect(() => {
    setHeaderMeta((prev) => ({
      ...prev,
      title: title ?? prev.title,
      slug: slug ?? prev.slug,
      description: description ?? prev.description,
      shortDescription: description ?? prev.shortDescription,
      thumbnailUrl: thumbnailUrl ?? prev.thumbnailUrl,
      difficulty: difficulty ?? prev.difficulty,
      topicId: selectedTopicId ?? prev.topicId,
      tags: selectedTags.length > 0 ? selectedTags.map((t) => t.name) : prev.tags,
    }));
  }, [title, slug, description, thumbnailUrl, difficulty, selectedTopicId, selectedTags]);

  const handleHeaderMetaChange = <K extends keyof LessonHeaderMetaData>(
    field: K,
    val: LessonHeaderMetaData[K]
  ) => {
    setHeaderMeta((prev) => ({ ...prev, [field]: val }));
    if (field === 'title') setTitle(val as string);
    if (field === 'slug') setSlug(val as string);
    if (field === 'description' || field === 'shortDescription' || field === 'summary') {
      setDescription(val as string);
    }
    if (field === 'topicId') setSelectedTopicId(val as string);
    if (field === 'difficulty') setDifficulty(val as DifficultyLevel);
    if (field === 'thumbnailUrl') setThumbnailUrl((val as string) || '');
  };

  const [isTocCollapsed, setIsTocCollapsed] = useState(false);

  // Mục lục (TOC) + HTML xem trước được biên dịch TRỰC TIẾP từ danh sách Khối (Block
  // Builder), không còn dò thẻ <h1-h3> trên `contentRichText` đã ghép sẵn — cách cũ chỉ bắt
  // được tiêu đề nằm trong khối Văn bản, bỏ sót mọi khối khác (Timeline/Nhân vật/Sự kiện/
  // Bản đồ/Bảng so sánh), khiến Mục lục quá sơ sài so với nội dung thật của bài học.
  const { tocItems, html: enrichedPreviewHtml } = useMemo(
    () => buildLessonTocAndHtml(blockManager.blocks),
    [blockManager.blocks]
  );

  // Tách media thành ảnh/video và tài liệu đính kèm
  const visualMediaItems = useMemo(() => {
    return mediaList.filter((m) => m.type !== MediaType.DOCUMENT);
  }, [mediaList]);

  const documentMediaItems = useMemo(() => {
    return mediaList.filter((m) => m.type === MediaType.DOCUMENT);
  }, [mediaList]);

  if (loadingLesson) {
    return <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Đang nạp dữ liệu bài học...</div>;
  }

  const renderPreview = (compact: boolean = false) => (
    <LessonPreviewContent
      compact={compact}
      tocItems={tocItems}
      isTocCollapsed={isTocCollapsed}
      onToggleTocCollapsed={() => setIsTocCollapsed(!isTocCollapsed)}
      thumbnailUrl={thumbnailUrl}
      title={title}
      topicName={currentTopic?.name}
      difficulty={difficulty}
      wordCount={wordCount}
      estimatedReadMinutes={estimatedReadMinutes}
      selectedTags={selectedTags}
      enrichedPreviewHtml={enrichedPreviewHtml}
      visualMediaItems={visualMediaItems}
      documentMediaItems={documentMediaItems}
      sourceReferenceNote={sourceReferenceNote}
      quizTitle={quiz.title}
      quizQuestions={quiz.questions}
      quizLoading={quiz.loading}
    />
  );

  return (
    <div className="editor-wrap space-y-3">
      {/* 0. Thanh cảnh báo khôi phục bản nháp: Gọn gàng, rõ ràng, an toàn */}
      {hasLocalDraft && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-lg py-2 px-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            <span className="truncate">
              Phát hiện bản nháp tự động lưu trên máy{lastSavedTime ? ` (lúc ${lastSavedTime})` : ''}. Bạn có muốn khôi phục không?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  'Bạn có chắc chắn muốn khôi phục bản nháp đã lưu trên máy không? Thao tác này sẽ áp dụng nội dung bản nháp vào màn hình hiện tại.'
                );
                if (confirmed) restoreDraft();
              }}
              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              Khôi phục
            </button>
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  'Bạn có chắc chắn muốn bỏ qua bản nháp này? Bản nháp cũ sẽ bị xóa và giữ nguyên nội dung hiện tại.'
                );
                if (confirmed) dismissDraft();
              }}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium transition cursor-pointer"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      <LessonEditorHeader
        lessonId={lessonId}
        status={status}
        saving={saving}
        autoSaveState={autoSaveState}
        lastSavedAt={lastSavedAt}
        hasLocalDraft={hasLocalDraft}
        lastSavedTime={lastSavedTime}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onSaveLesson={handleSaveLesson}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onOpenSidePanel={() => setIsSidePanelOpen(true)}
        onOpenCurriculumPreview={() => setIsCurriculumPreviewOpen(true)}
        onRestoreDraft={restoreDraft}
        isMoreMenuOpen={isMoreMenuOpen}
        onToggleMoreMenu={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
        onCloseMoreMenu={() => setIsMoreMenuOpen(false)}
        moreMenuRef={moreMenuRef}
      />

      <LessonEditorSubHeader
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        showLeftToc={showLeftToc}
        onToggleLeftToc={() => setShowLeftToc(!showLeftToc)}
      />

      {/* 2. Workspace Layout */}
      {activeTab === EditorViewMode.PREVIEW ? (
        <div className="h-[calc(100vh-170px)] min-h-[550px]">{renderPreview()}</div>
      ) : (
        <div
          className={`flex flex-col lg:flex-row gap-4 items-stretch transition-all ${
            isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-4' : ''
          }`}
          style={{ minHeight: isFullscreen ? '100vh' : 'calc(100vh - 165px)' }}
        >
          {showLeftToc && !isFullscreen && (
            <LessonLeftToolSidebar
              isCollapsed={isLeftSidebarCollapsed}
              onCollapse={() => setIsLeftSidebarCollapsed(true)}
              onExpand={() => setIsLeftSidebarCollapsed(false)}
              mode={leftSidebarMode}
              onChangeMode={setLeftSidebarMode}
              tocItems={tocItems}
              onInsertBlock={handleInsertBlock}
            />
          )}

          {/* Cột 1: Soạn thảo bài học (Vùng soạn thảo mở rộng linh hoạt khi panel thuộc tính đóng) */}
          <main className="flex-1 min-w-0 flex flex-col bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-xs overflow-y-auto h-full">
            <div
              className={`w-full mx-auto flex flex-col gap-3 flex-1 min-h-0 transition-all duration-200 ${
                !showSidebar ? 'max-w-4xl xl:max-w-5xl' : 'max-w-[760px]'
              }`}
            >
              <LessonHeaderMetaForm
                data={headerMeta}
                topics={topics.map((t) => ({ id: t.id, name: t.name }))}
                onChange={handleHeaderMetaChange}
                className="border-b border-slate-200 pb-5"
              />

              {/* Thông số bài học & Chọn mẫu bố cục sư phạm */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100 flex-wrap gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">NỘI DUNG BÀI HỌC</span>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <span className="text-xs text-slate-600 font-semibold">Mẫu bố cục:</span>
                    <select
                      onChange={(e) => {
                        const tplType = e.target.value as LessonTemplateType;
                        if (!tplType || tplType === LessonTemplateType.BLANK) return;

                        if (
                          contentRichText &&
                          contentRichText.trim() !== '<p></p>' &&
                          contentRichText.trim().length > 20
                        ) {
                          const confirmReplace = window.confirm(
                            'Nội dung soạn thảo hiện tại sẽ được thay thế bằng cấu trúc mẫu mới. Bạn có chắc chắn muốn áp dụng không?'
                          );
                          if (!confirmReplace) {
                            e.target.value = '';
                            return;
                          }
                        }

                        const tplHtml = LessonTemplateFactory.generateContent(tplType, {
                          lessonTitle: title || 'Bài học Lịch sử',
                          topicName: currentTopic?.name,
                        });
                        blockManager.loadFromContent(tplHtml);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0 pr-1"
                    >
                      <option value="" disabled>
                        -- Chọn mẫu bố cục để nạp --
                      </option>
                      {LessonTemplateFactory.getAllTemplateMetas()
                        .filter((t) => t.type !== LessonTemplateType.BLANK)
                        .map((tpl) => (
                          <option key={tpl.type} value={tpl.type}>
                            {tpl.label} ({tpl.badge})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <span className="font-medium">
                  <strong>{wordCount}</strong> từ <span className="text-slate-300 mx-1">•</span> ~{estimatedReadMinutes} phút đọc
                </span>
              </div>

              {/* Trình soạn thảo Khối độc lập dạng Page Builder */}
              <div className="flex-1 min-h-[420px]">
                <BlockBuilderCanvas
                  blocks={blockManager.blocks}
                  activeBlockId={blockManager.activeBlockId}
                  onSelectBlock={blockManager.setActiveBlockId}
                  onAddBlock={(type, atIndex) => blockManager.addBlock(type, atIndex)}
                  onUpdateBlock={blockManager.updateBlock}
                  onRemoveBlock={blockManager.removeBlock}
                  onMoveBlock={blockManager.moveBlock}
                  onMoveByDirection={blockManager.moveBlockByDirection}
                  onUpdateRowRatio={blockManager.setRowRatio}
                  onChangeRowColumnCount={blockManager.setRowColumnCount}
                  onAddBlockToColumn={blockManager.addBlockToColumn}
                  onUpdateBlockInColumn={blockManager.updateBlockInColumn}
                  onRemoveBlockFromColumn={blockManager.removeBlockFromColumn}
                />
              </div>
            </div>
          </main>

          {/* Cột 2 (Nếu chọn Chế độ chia đôi): Xem trước trực tiếp — dùng bản compact
              (không chia cột Mục lục riêng) vì pane này chỉ rộng ~1/2 màn hình. */}
          {activeTab === EditorViewMode.SPLIT && <div className="flex-1 min-w-0 h-full">{renderPreview(true)}</div>}

          {/* Cột 3: Sidebar Thuộc tính bên phải — ẩn khi đang ở Chế độ Chia đôi: 2 cột
              Soạn thảo + Xem trước đã chiếm hết chiều rộng, thêm cột thứ 3 sẽ bóp vỡ cả
              2 bên. Mở lại Thuộc tính bằng cách chuyển về Soạn thảo. */}
          {showSidebar && !isFullscreen && activeTab !== EditorViewMode.SPLIT && (
            <LessonPropertiesPanel
              sidebarTab={sidebarTab}
              setSidebarTab={setSidebarTab}
              onClose={() => setShowSidebar(false)}
              mediaCount={mediaList.length}
              currentTopicName={currentTopic?.name}
              onOpenTopicPicker={() => setIsTopicPickerOpen(true)}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              displayOrder={displayOrder}
              setDisplayOrder={setDisplayOrder}
              topicLessons={topicLessons}
              loadingTopicLessons={loadingTopicLessons}
              title={title}
              openSection={openSection}
              setOpenSection={setOpenSection}
              thumbnailUrl={thumbnailUrl}
              mediaList={mediaList}
              onAddMedia={addMediaItem}
              onRemoveMedia={removeMediaItem}
              lessonId={lessonId}
              quiz={quiz}
              status={status}
              wordCount={wordCount}
              estimatedReadMinutes={estimatedReadMinutes}
              sourceReferenceNote={sourceReferenceNote}
              setSourceReferenceNote={setSourceReferenceNote}
              resourceLinks={blockManager.resourceLinks}
              onAddResourceLink={() => blockManager.addResourceLink()}
              onUpdateResourceLink={blockManager.updateResourceLink}
              onRemoveResourceLink={blockManager.removeResourceLink}
              onSaveLesson={handleSaveLesson}
              saving={saving}
            />
          )}
        </div>
      )}

      {/* Modal chọn chương học (Chapter) gom nhóm bài viết */}
      <TopicParentModalPicker
        isOpen={isTopicPickerOpen}
        onClose={() => setIsTopicPickerOpen(false)}
        onSelect={(topicId) => {
          if (topicId) setSelectedTopicId(topicId);
        }}
        topics={topics}
        selectedParentId={selectedTopicId || null}
        title="Chọn Chương học (Chapter) cho Bài học"
        subtitle="Chọn chương học hoặc chuyên đề để gom nhóm bài học và định vị thứ tự trong chương trình"
        allowRootSelect={false}
        maxDepth={null}
      />

      {/* Modal Xem trước Cây tri thức toàn diện */}
      <CurriculumTreePreviewModal
        isOpen={isCurriculumPreviewOpen}
        onClose={() => setIsCurriculumPreviewOpen(false)}
        highlightTopicId={selectedTopicId || undefined}
        highlightLessonId={lessonId || undefined}
        title="Sơ đồ Cây tri thức toàn chương trình"
        subtitle="Vị trí của bài học này trong cấu trúc lộ trình môn Lịch sử"
      />

      {/* Trợ lý Sơ đồ Cây tri thức Cố định Mép phải (Ask Gemini / Copilot Style) */}
      <CurriculumSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        currentTopicTitle={title}
        currentDisplayOrder={displayOrder}
        highlightTopicId={selectedTopicId || undefined}
        highlightLessonId={lessonId || undefined}
      />
    </div>
  );
}
