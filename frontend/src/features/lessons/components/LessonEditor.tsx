'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/common/Badge';
import { SelectField } from '@/components/common/FormField';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus, DifficultyLevel, MediaType } from '@/constants/enums';
import { DIFFICULTY_LABEL_MAP } from '@/constants/ui-theme';
import { useLessonEditorFacade } from '../facades/useLessonEditorFacade';
import { TipTapContent } from './TipTapContent';
import { UploadApiService } from '@/services/entities/upload.service';

export function LessonEditor() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SPLIT' | 'EDIT' | 'PREVIEW'>('EDIT');
  const [showSidebar, setShowSidebar] = useState(true); // Hiển thị sidebar thuộc tính & ảnh bìa
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isAlbumDropdownOpen, setIsAlbumDropdownOpen] = useState(false);
  const albumFileInputRef = React.useRef<HTMLInputElement>(null);
  const albumDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (albumDropdownRef.current && !albumDropdownRef.current.contains(e.target as Node)) {
        setIsAlbumDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Áp dụng Facade Pattern
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
    restoreDraft,
    dismissDraft,
    submitLesson,
  } = useLessonEditorFacade();

  const [showOrderList, setShowOrderList] = useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const res = await UploadApiService.uploadImage(file);
      setThumbnailUrl(res.url);
    } catch (err) {
      console.error('Failed to upload cover image:', err);
      alert('Không thể tải ảnh bìa lên máy chủ.');
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  };

  const handleUploadAlbumImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMedia(true);
      const res = await UploadApiService.uploadImage(file);
      const caption = window.prompt('Nhập chú thích lịch sử cho ảnh vừa tải lên:', file.name);

      addMediaItem({
        type: MediaType.IMAGE,
        url: res.url,
        caption: caption || file.name,
        displayOrder: mediaList.length + 1,
      });
    } catch (err) {
      console.error('Failed to upload album image:', err);
      alert('Không thể tải ảnh lên máy chủ.');
    } finally {
      setUploadingMedia(false);
      if (albumFileInputRef.current) {
        albumFileInputRef.current.value = '';
      }
    }
  };

  const handleAddMediaAttachment = () => {
    const url = window.prompt('Nhập URL hình ảnh hoặc video tư liệu lịch sử:');
    if (!url) return;
    const caption = window.prompt('Nhập chú thích tư liệu (Caption):', '');
    const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.endsWith('.mp4');

    addMediaItem({
      type: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
      url,
      caption: caption || undefined,
      displayOrder: mediaList.length + 1,
    });
  };

  const [isTocCollapsed, setIsTocCollapsed] = useState(false);

  // Trích xuất tự động các thẻ Tiêu đề H1, H2, H3 để sinh Mục lục nội dung (Wiki Table of Contents)
  const tocItems = React.useMemo(() => {
    if (!contentRichText) return [];
    const matches: Array<{ id: string; text: string; level: number }> = [];
    // Regex tìm các heading h1, h2, h3
    const regex = /<h([1-3])\b[^>]*>(.*?)<\/h\1>/gi;
    let match;
    let count = 0;
    while ((match = regex.exec(contentRichText)) !== null) {
      count++;
      const level = parseInt(match[1], 10);
      // Loại bỏ các html tags con nếu có
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
  const enrichedPreviewHtml = React.useMemo(() => {
    if (!contentRichText) return '';
    let count = 0;
    return contentRichText.replace(/<h([1-3])(\b[^>]*)>(.*?)<\/h\1>/gi, (orig, lvl, attrs, inner) => {
      count++;
      return `<h${lvl}${attrs} id="heading-${count}">${inner}</h${lvl}>`;
    });
  }, [contentRichText]);

  if (loadingLesson) {
    return <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Đang nạp dữ liệu bài học...</div>;
  }

  // Bộ điều khiển thứ tự bài học trực quan và hiển thị danh sách bài học hiện có trong chủ đề
  const renderLessonOrderField = () => {
    const totalInTopic = topicLessons.length;
    const maxOrder = topicLessons.reduce((max, l) => Math.max(max, l.displayOrder || 0), 0);
    const nextOrder = maxOrder + 1;

    return (
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            Thứ tự bài học
          </label>
          <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {loadingTopicLessons
              ? 'Đang tính...'
              : `Chủ đề có ${totalInTopic} bài`}
          </span>
        </div>

        {/* Ô nhập số kèm các nút gợi ý vị trí trực quan */}
        <div className="flex items-center gap-2">
          <div className="relative w-20 shrink-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
              #
            </span>
            <input
              type="number"
              min={1}
              value={displayOrder || ''}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
              placeholder="1"
              className="w-full text-xs pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white font-bold text-slate-900 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap flex-1">
            <button
              type="button"
              onClick={() => setDisplayOrder(nextOrder)}
              className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
              title="Đặt bài học này ở vị trí kế tiếp bài cuối cùng"
            >
              <span>Cuối (#{nextOrder})</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayOrder(1)}
              className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium border border-slate-200 transition-all cursor-pointer"
              title="Đặt làm bài học đầu tiên trong chủ đề"
            >
              Đầu (#1)
            </button>
          </div>
        </div>

        {/* Danh sách các bài học hiện có trong chủ đề này để biên tập viên thấy rõ thứ tự */}
        {totalInTopic > 0 && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setShowOrderList(!showOrderList)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{showOrderList ? '▼ Ẩn danh sách bài' : '▶ Xem thứ tự các bài hiện có'}</span>
            </button>

            {showOrderList && (
              <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-40 overflow-y-auto space-y-1 text-xs animate-in fade-in duration-150">
                {topicLessons.map((l) => {
                  const isCurrent = l.id === lessonId;
                  return (
                    <div
                      key={l.id}
                      className={`flex items-center justify-between p-1 px-1.5 rounded text-[11px] ${
                        isCurrent
                          ? 'bg-blue-100 text-blue-900 font-bold border border-blue-200'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span className="truncate pr-1">
                        <strong>#{l.displayOrder ?? '?'}:</strong> {l.title}
                      </span>
                      {isCurrent && <span className="text-[10px] text-blue-700 shrink-0 font-bold">(Đang sửa)</span>}
                    </div>
                  );
                })}
                {!lessonId && (
                  <div className="flex items-center justify-between p-1 px-1.5 rounded text-[11px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    <span className="truncate pr-1">
                      <strong>#{displayOrder}:</strong> {title || '(Bài học mới này)'}
                    </span>
                    <span className="text-[10px] text-emerald-600 shrink-0">Vị trí bài này</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Component Preview trực quan của bài học Wiki & Khóa học
  const renderPreviewContent = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col h-full overflow-y-auto">
      {/* ẢNH BÌA BÀI HỌC (NẾU CÓ) */}
      {thumbnailUrl && (
        <div className="mb-5 rounded-xl overflow-hidden border border-slate-200 shadow-xs relative max-h-72">
          <img
            src={thumbnailUrl}
            alt={title || 'Ảnh bìa bài học'}
            className="w-full h-full object-cover max-h-72"
          />
        </div>
      )}

      {/* Header bài học chuẩn Wiki */}
      <div className="border-b border-slate-200 pb-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="blue">Wiki Bài học</Badge>
          <span className="text-xs text-slate-500">
            Chủ đề: {topics.find((t) => t.id === selectedTopicId)?.name || 'Chưa gắn'}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500">Độ khó: {DIFFICULTY_LABEL_MAP[difficulty]}</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-emerald-600 font-semibold">{wordCount} từ vựng</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-indigo-600 font-semibold">⏱️ ~{estimatedReadMinutes} phút đọc</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {title || 'Chưa có tiêu đề bài học'}
        </h1>
      </div>

      {/* HỘP MỤC LỤC BÀI HỌC WIKI (TABLE OF CONTENTS) - ĐẶT BÊN TRÁI CHUẨN WIKIPEDIA */}
      {tocItems.length > 0 && (
        <div className="mb-6 p-3 bg-slate-50/90 border border-slate-200 rounded-md inline-block min-w-[220px] max-w-sm self-start shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2 gap-4">
            <span className="text-xs font-bold text-slate-900 tracking-wide">
              Mục lục
            </span>
            <button
              type="button"
              onClick={() => setIsTocCollapsed(!isTocCollapsed)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium px-1 py-0.5 rounded hover:bg-blue-50"
            >
              [{isTocCollapsed ? 'hiện' : 'ẩn'}]
            </button>
          </div>
          {!isTocCollapsed && (
            <nav className="space-y-1.5 text-xs">
              {tocItems.map((item, idx) => {
                // Tự động loại bỏ số thứ tự người dùng đã gõ trước tiêu đề (ví dụ "1. Bối cảnh" -> "Bối cảnh")
                const displayText = item.text.replace(/^(\d+(\.\d+)*\s*[-–.]?\s*)/, '');

                return (
                  <div
                    key={item.id}
                    style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    className="flex items-baseline gap-1.5"
                  >
                    <span className="text-slate-500 font-medium shrink-0 text-xs">
                      {idx + 1}
                    </span>
                    <a
                      href={`#${item.id}`}
                      className="text-blue-700 hover:text-blue-900 hover:underline leading-snug"
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

      {/* Album tư liệu đính kèm */}
      {mediaList.length > 0 && (
        <div className="mt-8 pt-5 border-t border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Icon name={IconName.GRID} size={14} />
            <span>Tư liệu lịch sử đính kèm ({mediaList.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mediaList.map((m, idx) => (
              <div
                key={idx}
                className="group relative border border-slate-200 rounded-lg p-2 bg-slate-50 hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="text-[10px] font-bold text-blue-700 uppercase mb-1">
                  {m.type === MediaType.VIDEO ? '🎬 Video tài liệu' : '🖼 Hiện vật / Ảnh'}
                </div>
                {m.type === MediaType.IMAGE ? (
                  <img
                    src={m.url}
                    alt={m.caption || ''}
                    className="w-full h-24 object-cover rounded-md border border-slate-200"
                  />
                ) : (
                  <div className="h-24 bg-slate-200 rounded-md flex items-center justify-center text-xs text-slate-600 font-medium">
                    ▶ Video Player
                  </div>
                )}
                <p className="mt-1.5 text-xs text-slate-700 line-clamp-2 leading-tight font-medium">
                  {m.caption || 'Chưa có chú thích'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nguồn tư liệu trích dẫn */}
      <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-500 italic bg-amber-50/50 p-3 rounded-lg border border-amber-200/50">
        <strong className="text-amber-900 not-italic">Nguồn tư liệu tham khảo: </strong>
        <span>{sourceReferenceNote || 'Chưa cập nhật nguồn sử liệu'}</span>
      </div>
    </div>
  );

  return (
    <div className="editor-wrap space-y-3">
      {/* 0. Banner thông báo khôi phục bản nháp LocalStorage nếu có */}
      {hasLocalDraft && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              Hệ thống phát hiện có bản nháp chưa lưu cục bộ trên máy{lastSavedTime ? ` (lưu lúc ${lastSavedTime})` : ''}. Bạn có muốn khôi phục không?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition-all shadow-2xs"
            >
              Khôi phục nháp
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="px-2 py-1 text-slate-600 hover:text-slate-800 transition-all font-medium"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Toolbar trên cùng: Gom thành 1 thanh điều hướng duy nhất, siêu tinh gọn */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-2xs">
        {/* Khối bên trái: Thoát + Tiêu đề trang + Chế độ xem */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.LESSONS.LIST)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer"
            title="Quay lại danh sách bài học"
          >
            <span className="text-sm leading-none">←</span>
            <span>Thoát trình soạn thảo</span>
          </button>

          <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h1 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {lessonId ? 'Chỉnh sửa Bài học' : 'Soạn thảo Bài học'}
            </h1>
          </div>

          {/* Bộ chuyển đổi chế độ xem: Soạn thảo | Chia đôi | Xem trước */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'EDIT'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('EDIT')}
              title="Chế độ soạn thảo tập trung rộng rãi"
            >
              <Icon name={IconName.FOLDER} size={12} />
              <span>Soạn thảo</span>
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SPLIT'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setActiveTab('SPLIT');
                setShowSidebar(false); // Trong Split 50/50 tự động thu gọn sidebar để không bị chật
              }}
              title="Soạn thảo bên trái, xem kết quả bên phải"
            >
              <Icon name={IconName.GRID} size={12} />
              <span>Chia đôi (50/50)</span>
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PREVIEW'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('PREVIEW')}
              title="Xem trước toàn bộ giao diện bài học"
            >
              <Icon name={IconName.EYE} size={12} />
              <span>Xem trước</span>
            </button>
          </div>

          {/* Nút Xem trước toàn màn hình Modal */}
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 bg-blue-50/70 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 font-bold transition-all cursor-pointer"
            title="Mở popup xem trước toàn màn hình"
          >
            <span>🔍 Toàn màn hình</span>
          </button>

          {/* Toggle Sidebar Thuộc tính (khi đang ở chế độ Soạn thảo) */}
          {activeTab !== 'PREVIEW' && (
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                showSidebar
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title={showSidebar ? 'Ẩn cột thuộc tính để mở rộng tối đa vùng viết' : 'Hiện cột thuộc tính'}
            >
              <span>⚙️ Thuộc tính</span>
              <span className="text-[10px]">{showSidebar ? '✕' : '▼'}</span>
            </button>
          )}
        </div>

        {/* Khối bên phải: Trạng thái đồng bộ + Lưu nháp + Gửi duyệt */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Trạng thái lưu tự động */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-slate-500">
            {saving ? (
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <span className="animate-spin inline-block text-[11px]">🔄</span>
                <span>Đang lưu...</span>
              </span>
            ) : lastSavedTime ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium" title="Bản nháp đã lưu trên máy">
                <span className="text-emerald-600 font-bold">☁️✓</span>
                <span>Đã lưu ({lastSavedTime})</span>
              </span>
            ) : null}
          </div>

          <Badge tone="blue">Trạng thái: {status}</Badge>

          <button
            type="button"
            className="secondary-button !h-8 !text-xs !px-3"
            onClick={() => submitLesson(ContentStatus.DRAFT)}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu nháp'}
          </button>
          <button
            type="button"
            className="primary-button !h-8 !text-xs !px-3.5 !bg-blue-600 hover:!bg-blue-700 font-bold"
            onClick={() => submitLesson(ContentStatus.PENDING_REVIEW)}
            disabled={saving}
          >
            {lessonId ? 'Lưu cập nhật' : 'Gửi duyệt'} <Icon name={IconName.ARROW} size={13} />
          </button>
        </div>
      </header>

      {/* 2. Workspace Layout */}
      {activeTab === 'PREVIEW' ? (
        <div className="h-[calc(100vh-170px)] min-h-[550px]">
          {renderPreviewContent()}
        </div>
      ) : activeTab === 'SPLIT' ? (
        /* Chế độ Chia đôi (Split): 50% Soạn thảo - 50% Xem trước rộng rãi, không bị gò bó */
        <div
          className={`grid gap-4 transition-all ${
            showSidebar
              ? 'grid-cols-1 xl:grid-cols-[1fr_1fr_300px] lg:grid-cols-2'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
          style={{ minHeight: 'calc(100vh - 140px)' }}
        >
          {/* Cột 1: Soạn thảo rộng rãi */}
          <main className="flex flex-col gap-3 min-h-0 bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-xs overflow-y-auto">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                TÊN BÀI HỌC LỊCH SỬ
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài học..."
                className="w-full text-xl md:text-2xl font-extrabold text-slate-900 placeholder:text-slate-300 border-none outline-none bg-transparent p-0 focus:ring-0"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between py-1 mb-1.5 border-b border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  NỘI DUNG BÀI HỌC
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  <strong>{wordCount}</strong> từ <span className="text-slate-300 mx-1">•</span> ⏱️ ~{estimatedReadMinutes} phút đọc
                </span>
              </div>
              <div className="flex-1 min-h-[400px]">
                <TipTapContent
                  value={contentRichText}
                  onChange={setContentRichText}
                  placeholder="Nhập nội dung bài học..."
                />
              </div>
            </div>
          </main>

          {/* Cột 2: Xem trước trực tiếp bên cạnh (Rộng rãi 50% màn hình) */}
          <div className="min-h-0 h-full">
            {renderPreviewContent()}
          </div>

          {/* Cột 3: Thuộc tính & Tư liệu (Chỉ hiển thị khi bật toggle) */}
          {showSidebar && (
            <aside className="flex flex-col gap-3 overflow-y-auto pr-0.5 animate-in slide-in-from-right duration-200">
            {/* Phân loại chương trình */}
            <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                Phân loại chương trình
              </h3>
              <SelectField
                label="Chủ đề lịch sử"
                required
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                items={
                  topics.length > 0
                    ? topics.map((topic) => ({ label: topic.name, value: topic.id }))
                    : [{ label: 'Đang tải danh sách chủ đề...', value: '' }]
                }
              />
              <SelectField
                label="Độ khó"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                options={[
                  DifficultyLevel.EASY,
                  DifficultyLevel.MEDIUM,
                  DifficultyLevel.HARD,
                ]}
                optionValues={[
                  DifficultyLevel.EASY,
                  DifficultyLevel.MEDIUM,
                  DifficultyLevel.HARD,
                ]}
                items={[
                  { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.EASY], value: DifficultyLevel.EASY },
                  { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.MEDIUM], value: DifficultyLevel.MEDIUM },
                  { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.HARD], value: DifficultyLevel.HARD },
                ]}
              />
              {renderLessonOrderField()}
            </section>

            {/* Ảnh bìa đại diện bài học */}
            <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
              <input
                type="file"
                ref={coverFileInputRef}
                onChange={handleUploadCover}
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: 'none' }}
              />
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Ảnh bìa bài học
                </h3>
                {thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="text-[11px] text-red-500 hover:text-red-700 font-semibold"
                  >
                    Gỡ bỏ
                  </button>
                )}
              </div>

              {thumbnailUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 group">
                  <img
                    src={thumbnailUrl}
                    alt="Ảnh bìa bài học"
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold rounded shadow-xs"
                    >
                      {uploadingCover ? 'Đang tải...' : 'Thay ảnh'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverFileInputRef.current?.click()}
                    className="w-full py-3.5 px-3 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg bg-slate-50/50 hover:bg-blue-50/30 text-slate-600 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-base">🖼️</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {uploadingCover ? 'Đang tải ảnh...' : 'Tải ảnh bìa đại diện'}
                    </span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WEBP (tỷ lệ 16:9 khuyên dùng)</span>
                  </button>
                  <input
                    type="url"
                    placeholder="Hoặc dán link ảnh trực tiếp..."
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
                  />
                </div>
              )}
            </section>

            {/* Album tư liệu đính kèm */}
            <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
              <input
                type="file"
                ref={albumFileInputRef}
                onChange={handleUploadAlbumImage}
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: 'none' }}
              />
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Album Tư liệu ({mediaList.length})
                </h3>
                <div className="relative inline-block text-left" ref={albumDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsAlbumDropdownOpen(!isAlbumDropdownOpen)}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 flex items-center gap-1"
                  >
                    <span>+ Thêm</span>
                    <span className="text-[9px]">▼</span>
                  </button>
                  {isAlbumDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                      <button
                        type="button"
                        disabled={uploadingMedia}
                        onClick={() => {
                          setIsAlbumDropdownOpen(false);
                          albumFileInputRef.current?.click();
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2"
                      >
                        <span>📤</span>
                        <span>{uploadingMedia ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAlbumDropdownOpen(false);
                          handleAddMediaAttachment();
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2"
                      >
                        <span>🔗</span>
                        <span>URL ảnh / Video</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {mediaList.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic text-center py-2">
                    Chưa có tư liệu đính kèm.
                  </div>
                ) : (
                  mediaList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate pr-1">
                        <span>{item.type === MediaType.VIDEO ? '🎬' : '🖼'}</span>
                        <span className="truncate text-slate-700 font-medium">
                          {item.caption || item.url}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMediaItem(idx)}
                        className="text-red-500 font-bold hover:text-red-700 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

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
      ) : (
        <div
          className={`grid gap-4 transition-all ${
            showSidebar ? 'grid-cols-1 xl:grid-cols-[1fr_320px] lg:grid-cols-[1fr_300px]' : 'grid-cols-1'
          }`}
          style={{ minHeight: 'calc(100vh - 140px)' }}
        >
          {/* Cột chính: Canvas soạn thảo bài học mở rộng */}
          <main className="flex flex-col gap-3 min-h-0 bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs">
            {/* Tiêu đề bài học phong cách Notion / Document Header */}
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                TÊN BÀI HỌC LỊCH SỬ
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài học lịch sử..."
                className="w-full text-2xl md:text-3xl font-extrabold text-slate-900 placeholder:text-slate-300 border-none outline-none bg-transparent p-0 focus:ring-0"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between py-1 mb-2 border-b border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  NỘI DUNG BÀI HỌC
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  <strong>{wordCount}</strong> từ <span className="text-slate-300 mx-1">•</span> ⏱️ ~{estimatedReadMinutes} phút đọc
                </span>
              </div>
              <div className="flex-1 min-h-[450px]">
                <TipTapContent
                  value={contentRichText}
                  onChange={setContentRichText}
                  placeholder="Nhập nội dung bài học lịch sử chi tiết..."
                />
              </div>
            </div>
          </main>
          {showSidebar && (
            <aside className="flex flex-col gap-3 overflow-y-auto pr-0.5 animate-in slide-in-from-right duration-200">
              {/* Phân loại chương trình */}
              <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                  Phân loại chương trình
                </h3>
                <SelectField
                  label="Chủ đề lịch sử"
                  required
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  items={
                    topics.length > 0
                      ? topics.map((topic) => ({ label: topic.name, value: topic.id }))
                      : [{ label: 'Đang tải danh sách chủ đề...', value: '' }]
                  }
                />
                <SelectField
                  label="Độ khó"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  options={[
                    DifficultyLevel.EASY,
                    DifficultyLevel.MEDIUM,
                    DifficultyLevel.HARD,
                  ]}
                  optionValues={[
                    DifficultyLevel.EASY,
                    DifficultyLevel.MEDIUM,
                    DifficultyLevel.HARD,
                  ]}
                  items={[
                    { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.EASY], value: DifficultyLevel.EASY },
                    { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.MEDIUM], value: DifficultyLevel.MEDIUM },
                    { label: DIFFICULTY_LABEL_MAP[DifficultyLevel.HARD], value: DifficultyLevel.HARD },
                  ]}
                />
                {renderLessonOrderField()}
              </section>

              {/* Ảnh bìa đại diện bài học */}
              <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
                <input
                  type="file"
                  ref={coverFileInputRef}
                  onChange={handleUploadCover}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  style={{ display: 'none' }}
                />
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Ảnh bìa bài học
                  </h3>
                  {thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold"
                    >
                      Gỡ bỏ
                    </button>
                  )}
                </div>

                {thumbnailUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 group">
                    <img
                      src={thumbnailUrl}
                      alt="Ảnh bìa bài học"
                      className="w-full h-28 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingCover}
                        onClick={() => coverFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold rounded shadow-xs"
                      >
                        {uploadingCover ? 'Đang tải...' : 'Thay ảnh'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverFileInputRef.current?.click()}
                      className="w-full py-3.5 px-3 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg bg-slate-50/50 hover:bg-blue-50/30 text-slate-600 transition-all flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-base">🖼️</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {uploadingCover ? 'Đang tải ảnh...' : 'Tải ảnh bìa đại diện'}
                      </span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, WEBP (tỷ lệ 16:9 khuyên dùng)</span>
                    </button>
                    <input
                      type="url"
                      placeholder="Hoặc dán link ảnh trực tiếp..."
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
                    />
                  </div>
                )}
              </section>

              {/* Album tư liệu đính kèm */}
              <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
                <input
                  type="file"
                  ref={albumFileInputRef}
                  onChange={handleUploadAlbumImage}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  style={{ display: 'none' }}
                />
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Album Tư liệu ({mediaList.length})
                  </h3>
                  <div className="relative inline-block text-left" ref={albumDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsAlbumDropdownOpen(!isAlbumDropdownOpen)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 flex items-center gap-1"
                    >
                      <span>+ Thêm tư liệu</span>
                      <span className="text-[9px]">▼</span>
                    </button>
                    {isAlbumDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                        <button
                          type="button"
                          disabled={uploadingMedia}
                          onClick={() => {
                            setIsAlbumDropdownOpen(false);
                            albumFileInputRef.current?.click();
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2"
                        >
                          <span>📤</span>
                          <span>{uploadingMedia ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAlbumDropdownOpen(false);
                            handleAddMediaAttachment();
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2"
                        >
                          <span>🔗</span>
                          <span>URL ảnh / Video</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {mediaList.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic text-center py-2">
                      Chưa có tư liệu đính kèm.
                    </div>
                  ) : (
                    mediaList.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                      >
                        <div className="flex items-center gap-1.5 truncate pr-1">
                          <span>{item.type === MediaType.VIDEO ? '🎬' : '🖼'}</span>
                          <span className="truncate text-slate-700 font-medium">
                            {item.caption || item.url}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMediaItem(idx)}
                          className="text-red-500 font-bold hover:text-red-700 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

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

      {/* 4. Cửa sổ Xem trước toàn màn hình (Full-screen Preview Modal) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <Badge tone="blue">Xem trước toàn màn hình</Badge>
                <span className="text-xs text-slate-600 font-medium">
                  Giao diện hiển thị cho người học • {wordCount} từ vựng • ~{estimatedReadMinutes} phút đọc
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Đóng cửa sổ xem trước"
              >
                <span>✕</span>
                <span>Đóng xem trước</span>
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/60">
              <div className="max-w-4xl mx-auto h-full">
                {renderPreviewContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
