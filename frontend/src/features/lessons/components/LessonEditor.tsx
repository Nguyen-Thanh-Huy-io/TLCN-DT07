'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/common/Badge';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus, MediaType } from '@/constants/enums';
import { DIFFICULTY_LABEL_MAP } from '@/constants/ui-theme';
import { useLessonEditorFacade } from '../facades/useLessonEditorFacade';
import { EditorViewMode } from '../types/editor.types';
import { TipTapContent } from './TipTapContent';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { LessonTagPicker } from './LessonTagPicker';
import { LessonOrderField } from './LessonOrderField';
import { TopicParentModalPicker } from '@/features/topics/components/TopicParentModalPicker';
import { LessonDifficultySelector } from './LessonDifficultySelector';
import { LessonMediaManager } from './LessonMediaManager';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';
import { LessonTemplateFactory } from '../templates/lesson-template.factory';
import { LessonTemplateType } from '../templates/lesson-template.types';
import { CurriculumSidePanel } from '@/features/curriculum/components/CurriculumSidePanel';
import { CurriculumTreePreviewModal } from '@/features/curriculum/components/CurriculumTreePreviewModal';

export function LessonEditor() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EditorViewMode>(EditorViewMode.EDIT);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isTopicPickerOpen, setIsTopicPickerOpen] = useState(false);
  const [isCurriculumPreviewOpen, setIsCurriculumPreviewOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Facade Hook
  const {
    title,
    setTitle,
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
  } = useLessonEditorFacade();

  // Chủ đề hiện tại đang chọn
  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId);
  }, [topics, selectedTopicId]);

  const [isTocCollapsed, setIsTocCollapsed] = useState(false);

  // Trích xuất tự động các thẻ Tiêu đề H1, H2, H3 để sinh Mục lục nội dung (Wiki Table of Contents)
  const tocItems = useMemo(() => {
    if (!contentRichText) return [];
    const matches: Array<{ id: string; text: string; level: number }> = [];
    const regex = /<h([1-3])\b[^>]*>(.*?)<\/h\1>/gi;
    let match;
    let count = 0;
    while ((match = regex.exec(contentRichText)) !== null) {
      count++;
      const level = parseInt(match[1], 10);
      const cleanText = match[2].replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        matches.push({
          id: `heading-${count}`,
          text: cleanText,
          level,
        });
      }
    }
    return matches;
  }, [contentRichText]);

  // Gắn id vào các heading trong HTML để liên kết anchor mượt mà
  const enrichedPreviewHtml = useMemo(() => {
    if (!contentRichText) return '';
    let count = 0;
    return contentRichText.replace(/<h([1-3])(\b[^>]*)>(.*?)<\/h\1>/gi, (orig, lvl, attrs, inner) => {
      count++;
      return `<h${lvl}${attrs} id="heading-${count}">${inner}</h${lvl}>`;
    });
  }, [contentRichText]);

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

  // Component Preview trực quan của bài học Wiki & Khóa học
  const renderPreviewContent = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col h-full overflow-y-auto">
      {/* ẢNH BÌA BÀI HỌC (NẾU CÓ) */}
      {thumbnailUrl && (
        <div className="mb-5 rounded-xl overflow-hidden border border-slate-200 shadow-xs relative max-h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={title || 'Ảnh bìa bài học'}
            className="w-full h-full object-cover max-h-72"
          />
        </div>
      )}

      {/* Header bài học chuẩn Wiki */}
      <div className="border-b border-slate-200 pb-4 mb-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge tone="blue">Wiki Bài học</Badge>
          <span className="text-xs text-slate-500 font-medium">
            Chủ đề: {currentTopic?.name || 'Chưa gắn'}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500">Độ khó: {DIFFICULTY_LABEL_MAP[difficulty]}</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-600 font-medium">{wordCount} từ</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-600 font-medium">~{estimatedReadMinutes} phút đọc</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {title || 'Chưa có tiêu đề bài học'}
        </h1>

        {/* Thẻ (Tags) đã gắn */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="text-[11px] px-2 py-0.5 rounded-md font-medium border"
                style={{
                  backgroundColor: tag.colorHex ? `${tag.colorHex}15` : '#EFF6FF',
                  color: tag.colorHex || '#1D4ED8',
                  borderColor: tag.colorHex ? `${tag.colorHex}40` : '#BFDBFE',
                }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* HỘP MỤC LỤC BÀI HỌC WIKI (TABLE OF CONTENTS) */}
      {tocItems.length > 0 && (
        <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-md inline-block min-w-[220px] max-w-sm self-start">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2 gap-4">
            <span className="text-xs font-semibold text-slate-900 tracking-wide">
              Mục lục
            </span>
            <button
              type="button"
              onClick={() => setIsTocCollapsed(!isTocCollapsed)}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-1 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
            >
              [{isTocCollapsed ? 'hiện' : 'ẩn'}]
            </button>
          </div>
          {!isTocCollapsed && (
            <nav className="space-y-1.5 text-xs">
              {tocItems.map((item, idx) => {
                const displayText = item.text.replace(/^(\d+(\.\d+)*\s*[-–.]?\s*)/, '');
                return (
                  <div
                    key={item.id}
                    style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    className="flex items-baseline gap-1.5"
                  >
                    <span className="text-slate-400 font-mono shrink-0 text-xs">
                      {idx + 1}
                    </span>
                    <a
                      href={`#${item.id}`}
                      className="text-slate-700 hover:text-slate-900 hover:underline leading-snug"
                      onClick={(e) => {
                        e.preventDefault();
                        const targetEl = document.getElementById(item.id);
                        if (targetEl) {
                          targetEl.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      {displayText}
                    </a>
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      )}

      {/* Nội dung bài học */}
      <div
        className="tiptap-content-box !p-0 flex-1 leading-relaxed text-slate-800"
        dangerouslySetInnerHTML={{
          __html:
            enrichedPreviewHtml ||
            '<p class="text-slate-400 italic">Chưa có nội dung văn bản. Hãy soạn thảo ở cột bên cạnh.</p>',
        }}
      />

      {/* Album tư liệu hình ảnh & video */}
      {visualMediaItems.length > 0 && (
        <div className="mt-8 pt-5 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Icon name={IconName.GRID} size={14} />
            <span>Tư liệu lịch sử đính kèm ({visualMediaItems.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visualMediaItems.map((m, idx) => (
              <div
                key={idx}
                className="group relative border border-slate-200 rounded-md p-2 bg-slate-50 hover:bg-white transition-all"
              >
                <div className="text-[10px] font-semibold text-slate-600 uppercase mb-1">
                  {m.type === MediaType.VIDEO ? 'Video tài liệu' : 'Hiện vật / Ảnh'}
                </div>
                {m.type === MediaType.IMAGE ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.caption || ''}
                    className="w-full h-24 object-cover rounded border border-slate-200"
                  />
                ) : (
                  <div className="h-24 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-600 font-medium">
                    Video Player
                  </div>
                )}
                <p className="mt-1.5 text-xs text-slate-700 line-clamp-2 leading-tight">
                  {m.caption || 'Chưa có chú thích'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách file tài liệu nghiên cứu đính kèm */}
      {documentMediaItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <span>📄 Tài liệu tham khảo đính kèm ({documentMediaItems.length})</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {documentMediaItems.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition group"
              >
                <span className="text-xl">📄</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                    {doc.caption || 'Tài liệu nghiên cứu'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{doc.url}</div>
                </div>
                <span className="text-xs text-blue-600 font-medium shrink-0">Mở xem ↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Nguồn tư liệu trích dẫn */}
      <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-500 italic bg-slate-50 p-3 rounded-md border border-slate-200">
        <strong className="text-slate-800 not-italic">Nguồn tư liệu tham khảo: </strong>
        <span>{sourceReferenceNote || 'Chưa cập nhật nguồn sử liệu'}</span>
      </div>
    </div>
  );

  return (
    <div className="editor-wrap space-y-3">
      {/* 0. Banner thông báo khôi phục bản nháp LocalStorage nếu có */}
      {hasLocalDraft && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span>
              Hệ thống phát hiện có bản nháp chưa lưu cục bộ trên máy{lastSavedTime ? ` (lưu lúc ${lastSavedTime})` : ''}. Bạn có muốn khôi phục không?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium transition cursor-pointer"
            >
              Khôi phục nháp
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="px-2 py-1 text-slate-600 hover:text-slate-800 transition font-medium cursor-pointer"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Toolbar trên cùng: Tinh gọn, gom các nút chuyển chế độ xem */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-3.5 py-2">
        {/* Khối bên trái: Thoát + Tiêu đề trang + Gom chuyển chế độ xem */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.LESSONS.LIST)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition cursor-pointer"
            title="Quay lại danh sách bài học"
          >
            <span className="text-sm leading-none">←</span>
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <h1 className="text-xs font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {lessonId ? 'Chỉnh sửa Bài học' : 'Soạn thảo Bài học'}
            </h1>
          </div>

          {/* Gom chế độ xem duy nhất: Soạn thảo | Chia đôi | Xem trước */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-medium">
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === EditorViewMode.EDIT
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab(EditorViewMode.EDIT)}
              title="Chế độ soạn thảo tập trung"
            >
              <Icon name={IconName.EDIT} size={12} />
              <span>Soạn thảo</span>
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === EditorViewMode.SPLIT
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setActiveTab(EditorViewMode.SPLIT);
              }}
              title="Soạn thảo bên trái, xem kết quả bên phải"
            >
              <Icon name={IconName.GRID} size={12} />
              <span>Chia đôi</span>
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === EditorViewMode.PREVIEW
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab(EditorViewMode.PREVIEW)}
              title="Xem trước toàn bộ giao diện bài học"
            >
              <Icon name={IconName.EYE} size={12} />
              <span>Xem trước</span>
            </button>
          </div>

          {/* Nút Toàn màn hình (Fullscreen) */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`secondary-button !h-7 !text-xs !px-2.5 cursor-pointer transition ${
              isFullscreen ? '!bg-blue-50 !text-blue-700 !border-blue-300 font-semibold' : ''
            }`}
            title={isFullscreen ? 'Thu nhỏ giao diện soạn thảo' : 'Mở rộng soạn thảo toàn màn hình'}
          >
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          {/* Toggle Sidebar Thuộc tính */}
          {!isFullscreen && activeTab !== EditorViewMode.PREVIEW && (
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className={`secondary-button !h-7 !text-xs !px-2.5 cursor-pointer ${
                showSidebar ? '!bg-slate-100 !text-slate-900 font-semibold' : ''
              }`}
              title={showSidebar ? 'Ẩn cột thuộc tính' : 'Hiện cột thuộc tính'}
            >
              <span>Thuộc tính</span>
              <span className="text-[10px] text-slate-400">{showSidebar ? '✕' : '▼'}</span>
            </button>
          )}

          {/* Nút Trợ lý Cây tri thức (Side Panel kiểu Ask Gemini) */}
          <button
            type="button"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className={`group relative secondary-button !h-7 !text-xs !px-2 flex items-center gap-1 cursor-pointer transition ${
              isSidePanelOpen ? '!bg-blue-50 !text-blue-700 !border-blue-300 font-semibold' : 'hover:!text-blue-700 hover:!border-blue-200'
            }`}
            title="Mở bảng trợ lý Cây tri thức ở mép phải (Real-time)"
          >
            <Icon name={IconName.GRID} size={13} className={isSidePanelOpen ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600 transition'} />
            <span className="hidden sm:inline">Cây tri thức</span>

            {/* Tooltip hiển thị khi hover */}
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100 z-50">
              Trợ lý Cây tri thức (Đồng bộ thời gian thực)
            </span>
          </button>
        </div>

        {/* Khối bên phải: Trạng thái Auto-save trực quan + Lưu nháp + Gửi duyệt */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Trạng thái Auto-save trực quan với màu sắc & thời gian tương đối */}
          <AutoSaveIndicator state={autoSaveState} lastSavedAt={lastSavedAt} />

          <Badge tone="gray">{status}</Badge>

          <button
            type="button"
            className="secondary-button !h-7 !text-xs !px-3 cursor-pointer"
            onClick={() => submitLesson(ContentStatus.DRAFT)}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu nháp'}
          </button>
          <button
            type="button"
            className="primary-button !h-7 !text-xs !px-3 cursor-pointer"
            onClick={() => submitLesson(ContentStatus.PENDING_REVIEW)}
            disabled={saving}
          >
            {lessonId ? 'Lưu cập nhật' : 'Gửi duyệt'} <Icon name={IconName.ARROW} size={11} />
          </button>
        </div>
      </header>

      {/* 2. Workspace Layout */}
      {activeTab === EditorViewMode.PREVIEW ? (
        <div className="h-[calc(100vh-170px)] min-h-[550px]">
          {renderPreviewContent()}
        </div>
      ) : (
        <div
          className={`grid gap-4 transition-all ${
            isFullscreen
              ? 'fixed inset-0 z-50 bg-slate-100 p-4'
              : ''
          } ${
            showSidebar && !isFullscreen
              ? activeTab === EditorViewMode.SPLIT
                ? 'grid-cols-1 xl:grid-cols-[1fr_1fr_310px] lg:grid-cols-[1fr_1fr_280px]'
                : 'grid-cols-1 xl:grid-cols-[1fr_320px] lg:grid-cols-[1fr_300px]'
              : activeTab === EditorViewMode.SPLIT
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1'
          }`}
          style={{ minHeight: isFullscreen ? '100vh' : 'calc(100vh - 140px)' }}
        >
          {/* Cột 1: Soạn thảo bài học */}
          <main className="flex flex-col gap-3 min-h-0 bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-xs overflow-y-auto h-full">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                TÊN BÀI HỌC LỊCH SỬ
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài học lịch sử..."
                className="w-full text-xl md:text-2xl font-extrabold text-slate-900 placeholder:text-slate-300 border-none outline-none bg-transparent p-0 focus:ring-0"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between py-1 mb-1.5 border-b border-slate-50 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    NỘI DUNG BÀI HỌC
                  </span>

                  {/* Nút nạp khung mẫu sư phạm (Tái sử dụng LessonTemplateFactory) */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5">
                    <span className="text-[10px] text-slate-600 font-medium">Mẫu bố cục:</span>
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
                        setContentRichText(tplHtml);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="text-[11px] font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0 pr-1"
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

                <span className="text-xs text-slate-400 font-medium">
                  <strong>{wordCount}</strong> từ <span className="text-slate-300 mx-1">•</span> ~{estimatedReadMinutes} phút đọc
                </span>
              </div>
              <div className="flex-1 min-h-[420px]">
                <TipTapContent
                  value={contentRichText}
                  onChange={setContentRichText}
                  placeholder="Nhập nội dung bài học lịch sử chi tiết..."
                />
              </div>
            </div>
          </main>

          {/* Cột 2 (Nếu chọn Chế độ chia đôi): Xem trước trực tiếp */}
          {activeTab === EditorViewMode.SPLIT && (
            <div className="min-h-0 h-full">
              {renderPreviewContent()}
            </div>
          )}

          {/* Cột 3: Sidebar Thuộc tính & Tư liệu (Render duy nhất 1 lần, không trùng lặp) */}
          {showSidebar && (
            <aside className="flex flex-col gap-3 overflow-y-auto pr-0.5 animate-in slide-in-from-right duration-200">
              {/* Phân loại chương trình */}
              <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                  Phân loại chương trình
                </h3>

                {/* Chọn chủ đề lịch sử: Thiết kế card hiển thị rõ ràng, nút Đổi tách biệt không bị ép méo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Chủ đề lịch sử <b className="text-rose-500">*</b>
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setIsTopicPickerOpen(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Icon name={IconName.FOLDER} size={11} />
                      <span>Đổi chủ đề</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div
                      className="text-xs font-bold text-slate-900 leading-snug line-clamp-2"
                      title={currentTopic?.name || 'Chưa chọn chủ đề'}
                    >
                      {currentTopic?.name || (
                        <span className="text-slate-400 font-normal italic">Chưa gắn vào chủ đề nào...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chọn độ khó bài học: Thay thế select bằng Segmented Pills trực quan */}
                <LessonDifficultySelector
                  value={difficulty}
                  onChange={setDifficulty}
                  disabled={saving}
                />

                {/* Thẻ (Tags) bài học */}
                <LessonTagPicker
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  disabled={saving}
                />

                {/* Thứ tự bài học tinh gọn */}
                <LessonOrderField
                  displayOrder={displayOrder}
                  onChange={setDisplayOrder}
                  topicLessons={topicLessons}
                  loading={loadingTopicLessons}
                  currentLessonId={lessonId}
                  currentTitle={title}
                  disabled={saving}
                />
              </section>

              {/* Ảnh bìa bài học (Tái sử dụng component TopicCoverImagePicker) */}
              <TopicCoverImagePicker
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                disabled={saving}
                title="Ảnh bìa bài học"
                compact
              />

              {/* Tư liệu & Đính kèm file tài liệu (Ảnh, Video, PDF, Word) */}
              <LessonMediaManager
                mediaList={mediaList}
                onAddMedia={addMediaItem}
                onRemoveMedia={removeMediaItem}
                disabled={saving}
              />

              {/* Nguồn tư liệu tham khảo */}
              <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                  Nguồn tư liệu tham khảo
                </h3>
                <textarea
                  rows={3}
                  value={sourceReferenceNote}
                  onChange={(e) => setSourceReferenceNote(e.target.value)}
                  placeholder="Ví dụ: Đại Việt Sử Ký Toàn Thư..."
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </section>
            </aside>
          )}
        </div>
      )}

      {/* 3. Thanh thông tin chân trang tinh gọn */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 px-3.5 shadow-2xs text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">HISGO EdTech CMS</span>
          <span>•</span>
          <span>Trình biên tập nội dung Wiki Lịch sử v2.0</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{wordCount} từ vựng</span>
          <span>•</span>
          <span>~{estimatedReadMinutes} phút đọc</span>
          <span>•</span>
          <span className="text-slate-400">Tự động đồng bộ liên tục</span>
        </div>
      </div>

      {/* Modal chọn chủ đề lịch sử theo dạng cây phân cấp (Tái sử dụng TopicParentModalPicker y như bên chủ đề) */}
      <TopicParentModalPicker
        isOpen={isTopicPickerOpen}
        onClose={() => setIsTopicPickerOpen(false)}
        onSelect={(topicId) => {
          if (topicId) setSelectedTopicId(topicId);
        }}
        topics={topics}
        selectedParentId={selectedTopicId || null}
        title="Chọn Chủ đề lịch sử cho Bài học"
        subtitle="Chọn chủ đề trong cây tri thức để định vị chính xác vị trí của bài học"
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
