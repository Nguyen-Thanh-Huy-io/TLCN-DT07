'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/common/Badge';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus, DifficultyLevel, MediaType } from '@/constants/enums';
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
import { LessonBlockPalette } from './LessonBlockPalette';
import { LessonBlockType } from '../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../strategies/lesson-block-insert.strategy';
import { LessonHeaderMetaForm } from './LessonHeaderMetaForm';
import { LessonHeaderMetaData } from '../types/header-meta.types';

export enum LeftSidebarMode {
  BLOCKS = 'BLOCKS',
  OUTLINE = 'OUTLINE',
}

export enum SidebarTab {
  CLASSIFICATION = 'CLASSIFICATION',
  MEDIA = 'MEDIA',
  PUBLISHING = 'PUBLISHING',
}

export function LessonEditor() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EditorViewMode>(EditorViewMode.EDIT);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.CLASSIFICATION);
  const [showSidebar, setShowSidebar] = useState(true);
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

  // Xử lý chèn khối nội dung từ Block Palette vào Editor
  const handleInsertBlock = (blockType: LessonBlockType) => {
    const snippet = lessonBlockInsertStrategy.generateSnippet(blockType);
    if (!contentRichText || contentRichText.trim() === '<p></p>') {
      setContentRichText(snippet);
    } else {
      setContentRichText(contentRichText + '\n' + snippet);
    }
  };

  // Chủ đề hiện tại đang chọn
  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId);
  }, [topics, selectedTopicId]);

  // Thông tin bài học ở đầu trang (Metadata Form Header)
  const [headerMeta, setHeaderMeta] = useState<LessonHeaderMetaData>({
    title: '',
    shortDescription: '',
    thumbnailUrl: '',
    tags: [],
    topicId: '',
    difficulty: DifficultyLevel.MEDIUM,
    startDate: '',
    endDate: '',
  });

  // Đồng bộ hai chiều từ Facade vào HeaderMeta
  useEffect(() => {
    setHeaderMeta((prev) => ({
      ...prev,
      title: title ?? prev.title,
      thumbnailUrl: thumbnailUrl ?? prev.thumbnailUrl,
      difficulty: difficulty ?? prev.difficulty,
      topicId: selectedTopicId ?? prev.topicId,
      tags: selectedTags.length > 0 ? selectedTags.map((t) => t.name) : prev.tags,
    }));
  }, [title, thumbnailUrl, difficulty, selectedTopicId, selectedTags]);

  const handleHeaderMetaChange = <K extends keyof LessonHeaderMetaData>(
    field: K,
    val: LessonHeaderMetaData[K]
  ) => {
    setHeaderMeta((prev) => ({ ...prev, [field]: val }));
    if (field === 'title') setTitle(val as string);
    if (field === 'topicId') setSelectedTopicId(val as string);
    if (field === 'difficulty') setDifficulty(val as DifficultyLevel);
    if (field === 'thumbnailUrl') setThumbnailUrl((val as string) || '');
  };

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
  // Component Preview trực quan của bài học Wiki & Khóa học (Mục lục đặt bên trái)
  const renderPreviewContent = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs h-full overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* CỘT BÊN TRÁI: MỤC LỤC BÀI HỌC WIKI (STICKY SIDEBAR TOC - ĐẶT BÊN TRÁI) */}
        {tocItems.length > 0 && (
          <aside className="w-full lg:w-60 xl:w-64 shrink-0 lg:sticky lg:top-0 self-start">
            <div className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2 gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon name={IconName.BOOK} size={13} className="text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 tracking-wide truncate">
                    Mục lục
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTocCollapsed(!isTocCollapsed)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-1.5 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer transition shrink-0"
                >
                  [{isTocCollapsed ? 'hiện' : 'ẩn'}]
                </button>
              </div>
              {!isTocCollapsed && (
                <nav className="space-y-1.5 text-xs max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {tocItems.map((item, idx) => {
                    const displayText = item.text.replace(/^(\d+(\.\d+)*\s*[-–.]?\s*)/, '');
                    return (
                      <div
                        key={item.id}
                        style={{ paddingLeft: `${(item.level - 1) * 10}px` }}
                        className="flex items-baseline gap-1.5 py-0.5 group rounded px-1 hover:bg-white transition"
                      >
                        <span className="text-slate-400 group-hover:text-blue-600 font-mono text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <a
                          href={`#${item.id}`}
                          className="text-slate-700 group-hover:text-blue-700 hover:underline leading-snug break-words transition"
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
          </aside>
        )}

        {/* CỘT CHÍNH (BÊN PHẢI MỤC LỤC): NỘI DUNG BÀI HỌC VÀ TƯ LIỆU */}
        <div className="flex-1 min-w-0 flex flex-col">
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
      </div>
    </div>
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

      {/* 1. Header chính (Tầng 1): Tối giản, tập trung thao tác chính */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs">
        {/* Khối bên trái: Thoát + Tiêu đề trang + Badge trạng thái */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.LESSONS.LIST)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer shrink-0"
            title="Quay lại danh sách bài học"
          >
            <span className="text-base leading-none">←</span>
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-2 min-w-0 pr-2 border-r border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
              {lessonId ? 'Chỉnh sửa Bài học' : 'Soạn thảo Bài học'}
            </h1>
          </div>

          <Badge tone="gray">{status}</Badge>
        </div>

        {/* Khối bên phải: Trạng thái Auto-save + Nút Cập nhật + Menu 3 chấm */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Trạng thái Auto-save trực quan với màu sắc & thời gian tương đối */}
          <AutoSaveIndicator state={autoSaveState} lastSavedAt={lastSavedAt} />

          <button
            type="button"
            className="primary-button !h-8 !text-xs md:!text-sm !px-4 cursor-pointer font-bold"
            onClick={() => submitLesson(ContentStatus.PENDING_REVIEW)}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : lessonId ? 'Cập nhật' : 'Gửi duyệt'}
          </button>

          {/* Menu ba chấm (•••) cho các tùy chọn bổ sung: Cây tri thức, Lưu nháp, Sơ đồ */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Tùy chọn mở rộng"
            >
              <Icon name={IconName.MORE} size={15} />
            </button>

            <div
              className={`absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs ${
                isMoreMenuOpen ? 'block animate-in fade-in-50 duration-100' : 'hidden'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsSidePanelOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 hover:text-slate-900 cursor-pointer font-medium"
              >
                <Icon name={IconName.GRID} size={14} className="text-blue-600" />
                <span>Trợ lý Cây tri thức</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsCurriculumPreviewOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 hover:text-slate-900 cursor-pointer font-medium"
              >
                <Icon name={IconName.BOOK} size={14} className="text-amber-600" />
                <span>Sơ đồ lộ trình toàn diện</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  submitLesson(ContentStatus.DRAFT);
                }}
                disabled={saving}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 hover:text-slate-900 cursor-pointer font-medium"
              >
                <Icon name={IconName.CHECK} size={14} className="text-emerald-600" />
                <span>{saving ? 'Đang lưu nháp...' : 'Lưu nháp'}</span>
              </button>
              {hasLocalDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    restoreDraft();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-amber-50 text-amber-700 cursor-pointer font-medium"
                >
                  <Icon name={IconName.CLOCK} size={14} className="text-amber-600" />
                  <span>Khôi phục bản nháp ({lastSavedTime})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sub-header (Tầng 2): Điều hướng chế độ xem + Toàn màn hình + Ẩn/Hiện Sidebar */}
      <div className="flex items-center justify-between gap-3 bg-slate-50/90 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
        {/* Chuyển chế độ xem: Soạn thảo | Chia đôi | Xem trước */}
        <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs md:text-sm font-medium">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === EditorViewMode.EDIT
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab(EditorViewMode.EDIT)}
            title="Chế độ soạn thảo tập trung"
          >
            <Icon name={IconName.EDIT} size={14} />
            <span>Soạn thảo</span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === EditorViewMode.SPLIT
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab(EditorViewMode.SPLIT)}
            title="Soạn thảo bên trái, xem kết quả bên phải"
          >
            <Icon name={IconName.GRID} size={14} />
            <span>Chia đôi</span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === EditorViewMode.PREVIEW
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab(EditorViewMode.PREVIEW)}
            title="Xem trước toàn bộ giao diện bài học"
          >
            <Icon name={IconName.EYE} size={14} />
            <span>Xem trước</span>
          </button>
        </div>

        {/* Nút Mục lục bên trái, Toàn màn hình & Ẩn/Hiện Sidebar */}
        <div className="flex items-center gap-1.5">
          {!isFullscreen && activeTab !== EditorViewMode.PREVIEW && (
            <button
              type="button"
              onClick={() => setShowLeftToc(!showLeftToc)}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer font-medium ${
                showLeftToc ? 'bg-blue-100 text-blue-700 font-bold' : ''
              }`}
              title={showLeftToc ? 'Ẩn thanh công cụ khối bên trái' : 'Hiện thanh công cụ khối bên trái'}
            >
              <Icon name={IconName.GRID} size={14} />
              <span>Khối nội dung</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer font-medium ${
              isFullscreen ? 'bg-blue-100 text-blue-700 font-bold' : ''
            }`}
            title={isFullscreen ? 'Thu nhỏ giao diện' : 'Mở rộng soạn thảo toàn màn hình'}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M10 4v6m0 0H4m6 0L3 3m11 7h6m-6 0V4m0 6l7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          {!isFullscreen && activeTab !== EditorViewMode.PREVIEW && (
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer font-medium ${
                showSidebar ? 'bg-slate-200 text-slate-900 font-bold' : ''
              }`}
              title={showSidebar ? 'Ẩn cột thuộc tính bài học' : 'Hiện cột thuộc tính bài học'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M15 3v18" />
              </svg>
              <span className="hidden sm:inline">Thuộc tính</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Workspace Layout */}
      {activeTab === EditorViewMode.PREVIEW ? (
        <div className="h-[calc(100vh-170px)] min-h-[550px]">
          {renderPreviewContent()}
        </div>
      ) : (
        <div
          className={`flex flex-col lg:flex-row gap-4 items-stretch transition-all ${
            isFullscreen
              ? 'fixed inset-0 z-50 bg-slate-100 p-4'
              : ''
          }`}
          style={{ minHeight: isFullscreen ? '100vh' : 'calc(100vh - 165px)' }}
        >
          {/* CỘT BÊN TRÁI: THÊM KHỐI NỘI DUNG (BLOCK PALETTE THEO IMG.PNG) & MỤC LỤC TO-C */}
          {showLeftToc && !isFullscreen && (
            <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-2 max-h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-[68px] self-start animate-in slide-in-from-left duration-150 z-20 custom-editor-scrollbar pr-0.5">
              {/* Nút chuyển đổi Tab: [Thêm khối] | [Mục lục] */}
              <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs flex items-center justify-between">
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg text-xs w-full">
                  <button
                    type="button"
                    onClick={() => setLeftSidebarMode(LeftSidebarMode.BLOCKS)}
                    data-testid="tab-left-blocks"
                    className={`py-1 px-1.5 rounded-md font-bold transition text-center cursor-pointer ${
                      leftSidebarMode === LeftSidebarMode.BLOCKS
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Thêm khối
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftSidebarMode(LeftSidebarMode.OUTLINE)}
                    data-testid="tab-left-outline"
                    className={`py-1 px-1.5 rounded-md font-bold transition text-center cursor-pointer ${
                      leftSidebarMode === LeftSidebarMode.OUTLINE
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mục lục {tocItems.length > 0 ? `(${tocItems.length})` : ''}
                  </button>
                </div>
              </div>

              {leftSidebarMode === LeftSidebarMode.BLOCKS ? (
                <LessonBlockPalette
                  onSelectBlock={handleInsertBlock}
                  className="!w-full border-slate-200 !p-2.5 !shadow-2xs"
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 px-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name={IconName.BOOK} size={13} className="text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">
                        Mục lục ({tocItems.length})
                      </span>
                    </div>
                  </div>

                  {tocItems.length > 0 ? (
                    <nav className="space-y-1 text-xs overflow-y-auto pr-0.5">
                      {tocItems.map((item, idx) => {
                        const displayText = item.text.replace(/^(\d+(\.\d+)*\s*[-–.]?\s*)/, '');
                        return (
                          <button
                            key={item.id}
                            type="button"
                            style={{ paddingLeft: `${(item.level - 1) * 10 + 4}px` }}
                            onClick={() => {
                              let el = document.getElementById(item.id);
                              if (!el) {
                                const headings = document.querySelectorAll(
                                  '.tiptap h1, .tiptap h2, .tiptap h3, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3'
                                );
                                if (headings && headings[idx]) {
                                  el = headings[idx] as HTMLElement;
                                }
                              }
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className="w-full text-left py-1.5 px-1.5 rounded-lg hover:bg-blue-50/70 hover:text-blue-700 transition flex items-baseline gap-1.5 cursor-pointer group"
                            title={`Nhảy tới: ${displayText}`}
                          >
                            <span className="text-slate-400 group-hover:text-blue-600 font-mono text-[11px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-slate-700 group-hover:text-blue-800 font-medium leading-snug line-clamp-2">
                              {displayText}
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-1">
                      <p className="font-semibold text-slate-600">Chưa có đề mục</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Chọn văn bản và bấm <strong>H1, H2, H3</strong> để tạo mục lục tự động.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}

          {/* Cột 1: Soạn thảo bài học (Tối ưu không gian viết 760px mx-auto theo mockup img.png) */}
          <main className="flex-1 min-w-0 flex flex-col bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-xs overflow-y-auto h-full">
            <div className="w-full max-w-[760px] mx-auto flex flex-col gap-3 flex-1 min-h-0">
              {/* A. THÔNG TIN BÀI HỌC Ở ĐẦU TRANG (Chuẩn img.png & structure.txt) */}
              <LessonHeaderMetaForm
                data={headerMeta}
                topics={topics.map((t) => ({ id: t.id, name: t.name }))}
                onChange={handleHeaderMetaChange}
                className="border-b border-slate-200 pb-5"
              />

              {/* Thông số bài học & Chọn mẫu bố cục sư phạm */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100 flex-wrap gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    NỘI DUNG BÀI HỌC
                  </span>
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
                        setContentRichText(tplHtml);
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

              {/* Trình soạn thảo TipTap */}
              <div className="flex-1 min-h-[460px]">
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
            <div className="flex-1 min-w-0 h-full">
              {renderPreviewContent()}
            </div>
          )}

          {/* Cột 3: Sidebar Thuộc tính bên phải (Rộng 320-340px, phẳng hoàn toàn, Accordion cho Phân loại) */}
          {showSidebar && !isFullscreen && (
            <aside className="w-full lg:w-80 xl:w-[340px] shrink-0 flex flex-col gap-2.5 max-h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-[68px] self-start pr-0.5 animate-in slide-in-from-right duration-200 z-20 custom-editor-scrollbar">
              {/* Thanh Tab chuyển đổi mục cài đặt trong Sidebar */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                  <span className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Thuộc tính bài học
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSidebar(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition cursor-pointer font-medium"
                    title="Thu gọn Sidebar"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSidebarTab(SidebarTab.CLASSIFICATION)}
                    className={`py-1.5 px-1 rounded-md text-[11px] font-bold transition text-center cursor-pointer ${
                      sidebarTab === SidebarTab.CLASSIFICATION
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Phân loại
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab(SidebarTab.MEDIA)}
                    className={`py-1.5 px-1 rounded-md text-[11px] font-bold transition text-center cursor-pointer ${
                      sidebarTab === SidebarTab.MEDIA
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Media {mediaList.length > 0 ? `(${mediaList.length})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab(SidebarTab.PUBLISHING)}
                    className={`py-1.5 px-1 rounded-md text-[11px] font-bold transition text-center cursor-pointer ${
                      sidebarTab === SidebarTab.PUBLISHING
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Xuất bản
                  </button>
                </div>
              </div>

              {/* TAB 1: PHÂN LOẠI CHƯƠNG TRÌNH (DẠNG ACCORDION PHẲNG - KHÔNG LỒNG VIỀN) */}
              {sidebarTab === SidebarTab.CLASSIFICATION && (
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs overflow-hidden animate-in fade-in-50 duration-150">
                  {/* Mục 1: Chủ đề lịch sử */}
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon name={IconName.FOLDER} size={15} className="text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Chủ đề <b className="text-rose-500">*</b>
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setIsTopicPickerOpen(true)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                      >
                        <span>Đổi</span>
                        <span className="text-slate-400">›</span>
                      </button>
                    </div>
                    <div
                      className="mt-1.5 text-xs text-slate-800 font-medium truncate bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition"
                      onClick={() => setIsTopicPickerOpen(true)}
                      title={currentTopic?.name || 'Nhấp để chọn chủ đề'}
                    >
                      {currentTopic?.name || (
                        <span className="text-slate-400 italic font-normal">Chưa gắn chủ đề...</span>
                      )}
                    </div>
                  </div>

                  {/* Mục 2: Độ khó bài học (Accordion) */}
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'difficulty' ? null : 'difficulty')}
                      className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold text-sm leading-none">★</span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Độ khó
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {DIFFICULTY_LABEL_MAP[difficulty] || difficulty}
                        </span>
                        <span className={`text-slate-400 text-xs transition-transform ${openSection === 'difficulty' ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </button>

                    <div
                      className={
                        openSection === 'difficulty'
                          ? 'mt-3 pt-2 border-t border-slate-100 animate-in fade-in-50 duration-150'
                          : 'hidden'
                      }
                    >
                      <LessonDifficultySelector
                        value={difficulty}
                        onChange={setDifficulty}
                        disabled={saving}
                        hideLabel
                      />
                    </div>
                  </div>

                  {/* Mục 3: Thẻ phân loại (Tags) (Accordion) */}
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'tags' ? null : 'tags')}
                      className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon name={IconName.TAG} size={15} className="text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Thẻ (Tags)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {selectedTags.length > 0 ? `${selectedTags.length} thẻ` : 'Tùy chọn'}
                        </span>
                        <span className={`text-slate-400 text-xs transition-transform ${openSection === 'tags' ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </button>

                    <div
                      className={
                        openSection === 'tags'
                          ? 'mt-3 pt-2 border-t border-slate-100 animate-in fade-in-50 duration-150'
                          : 'hidden'
                      }
                    >
                      <LessonTagPicker
                        selectedTags={selectedTags}
                        onChange={setSelectedTags}
                        disabled={saving}
                        hideLabel
                      />
                    </div>
                  </div>

                  {/* Mục 4: Thứ tự bài học (Accordion) */}
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'order' ? null : 'order')}
                      className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono font-bold text-xs">#</span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Thứ tự bài học
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-mono">
                          #{displayOrder} / {topicLessons.length || 1} bài
                        </span>
                        <span className={`text-slate-400 text-xs transition-transform ${openSection === 'order' ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </button>

                    <div
                      className={
                        openSection === 'order'
                          ? 'mt-3 pt-2 border-t border-slate-100 animate-in fade-in-50 duration-150'
                          : 'hidden'
                      }
                    >
                      <LessonOrderField
                        displayOrder={displayOrder}
                        onChange={setDisplayOrder}
                        topicLessons={topicLessons}
                        loading={loadingTopicLessons}
                        currentLessonId={lessonId}
                        currentTitle={title}
                        topicName={currentTopic?.name}
                        disabled={saving}
                        hideHeader
                      />
                    </div>
                  </div>
                </div>
              )}


              {/* TAB 2: TƯ LIỆU & MEDIA (PHẲNG HOÀN TOÀN) */}
              {sidebarTab === SidebarTab.MEDIA && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-4 animate-in fade-in-50 duration-150">
                  {/* Ảnh bìa bài học */}
                  <TopicCoverImagePicker
                    value={thumbnailUrl}
                    onChange={setThumbnailUrl}
                    disabled={saving}
                    title="Ảnh bìa bài học"
                    compact
                  />

                  {/* Tư liệu & Đính kèm file tài liệu (Ảnh, Video, PDF, Word) */}
                  <div className="border-t border-slate-100 pt-3">
                    <LessonMediaManager
                      mediaList={mediaList}
                      onAddMedia={addMediaItem}
                      onRemoveMedia={removeMediaItem}
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: XUẤT BẢN & SỬ LIỆU THAM KHẢO (PHẲNG HOÀN TOÀN) */}
              {sidebarTab === SidebarTab.PUBLISHING && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3.5 animate-in fade-in-50 duration-150">
                  {/* Trạng thái bài học */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Trạng thái bài học
                    </span>
                    <Badge tone="gray">{status}</Badge>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Độ dài:</span>
                      <span className="font-bold text-slate-800">{wordCount} từ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời lượng đọc:</span>
                      <span className="font-bold text-slate-800">~{estimatedReadMinutes} phút</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tự động lưu:</span>
                      <span className="font-medium text-emerald-600">Đang bật</span>
                    </div>
                  </div>

                  {/* Nguồn tư liệu tham khảo */}
                  <div className="border-t border-slate-100 pt-2.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                      Nguồn tư liệu tham khảo
                    </span>
                    <textarea
                      rows={3}
                      value={sourceReferenceNote}
                      onChange={(e) => setSourceReferenceNote(e.target.value)}
                      placeholder="Ví dụ: Đại Việt Sử Ký Toàn Thư, Lịch sử Việt Nam tập 10..."
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => submitLesson(ContentStatus.PENDING_REVIEW)}
                      disabled={saving}
                      className="primary-button !h-8 !text-xs !w-full justify-center cursor-pointer font-bold"
                    >
                      {lessonId ? 'Lưu cập nhật' : 'Gửi duyệt bài học'}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitLesson(ContentStatus.DRAFT)}
                      disabled={saving}
                      className="secondary-button !h-8 !text-xs !w-full justify-center cursor-pointer"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu bản nháp'}
                    </button>
                  </div>
                </div>
              )}
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
