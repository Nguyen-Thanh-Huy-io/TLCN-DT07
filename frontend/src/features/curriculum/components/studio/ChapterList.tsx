'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { ChapterItem } from '@/services/entities/learning-path.service';

const PAGE_SIZE = 5;

export enum ChapterViewMode {
  ACCORDION = 'ACCORDION',
  LIST = 'LIST',
}

const BTN_VIEW_MODE_BASE = 'w-7 h-7 flex items-center justify-center rounded-md transition';
const BTN_VIEW_MODE_ACTIVE = 'bg-white text-emerald-700 shadow-2xs';
const BTN_VIEW_MODE_INACTIVE = 'text-slate-500 hover:text-slate-800';
const TABLE_CELL_TOP = 'px-3 py-2.5 align-top';
const BADGE_HAS_LESSONS = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
const BADGE_NO_LESSONS = 'bg-slate-100 text-slate-500';

interface ChapterListProps {
  loading: boolean;
  chapters: ChapterItem[] | undefined;
  expandedChapters: Record<string, boolean>;
  onToggleExpand: (chapterId: string) => void;
  onOpenCreateChapter: () => void;
  onOpenAddLessons: (chapter: ChapterItem) => void;
  /** Mở trình soạn bài mới, lưu xong bài tự gắn vào chương này. */
  onCreateLessonInChapter: (chapter: ChapterItem) => void;
  onOpenLesson: (lessonId: string) => void;
  onDeleteChapter: (e: React.MouseEvent, chapterId: string, chapterTitle: string) => void;
  onRemoveLesson: (e: React.MouseEvent, chapterId: string, lessonId: string) => void;
  onMoveLessonOrder: (
    e: React.MouseEvent,
    chapter: ChapterItem,
    currentIndex: number,
    direction: 'UP' | 'DOWN',
  ) => void;
  draggingLessonId: string | null;
  dragOverLessonId: string | null;
  onDragStart: (lessonId: string) => void;
  onDragOver: (e: React.DragEvent, lessonId: string) => void;
  onDrop: (chapter: ChapterItem, targetLessonId: string) => void;
  /** Chỉ xem: ẩn mọi nút thay đổi cấu trúc (vd. biên tập viên mở lộ trình đã xuất bản). */
  readOnly?: boolean;
  /** Sửa tên / mô tả chương — vẫn mở khi chỉ xem cấu trúc (thành bản sửa chờ duyệt). */
  onEditChapter?: (chapter: ChapterItem) => void;
}

/** Danh sách Chương dạng accordion + danh sách Lesson trong từng chương (kéo thả / ▲▼
 * để đổi thứ tự). Phần "Cấu trúc chương" của card Lộ trình học. */
export function ChapterList({
  loading,
  chapters,
  expandedChapters,
  onToggleExpand,
  onOpenCreateChapter,
  onOpenAddLessons,
  onCreateLessonInChapter,
  onOpenLesson,
  onDeleteChapter,
  onRemoveLesson,
  onMoveLessonOrder,
  draggingLessonId,
  dragOverLessonId,
  onDragStart,
  onDragOver,
  onDrop,
  readOnly = false,
  onEditChapter,
}: ChapterListProps) {
  // Phân trang danh sách Chương — lộ trình nhiều chương trước đây dồn hết 1 lần, cuộn
  // rất dài, khó quét. Về trang 1 mỗi khi đổi sang Lộ trình khác (mảng `chapters` đổi
  // tham chiếu) để không đứng ở trang rỗng của lộ trình mới.
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [chapters]);

  // Chuyển đổi Accordion (mặc định, xổ Lesson trong từng Chương) / Danh sách (bảng gọn,
  // quét nhanh nhiều chương — như kiểu Lưới/Danh sách ở tab Thư viện).
  const [viewMode, setViewMode] = useState<ChapterViewMode>(ChapterViewMode.ACCORDION);

  const totalPages = Math.max(1, Math.ceil((chapters?.length || 0) / PAGE_SIZE));
  const pagedChapters = useMemo(() => {
    if (!chapters) return [];
    const start = (page - 1) * PAGE_SIZE;
    return chapters.slice(start, start + PAGE_SIZE);
  }, [chapters, page]);

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Cấu trúc chương</h2>
          <span className="text-xs text-slate-400">Danh sách chương và bài học trong lộ trình</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Chuyển đổi Accordion / Danh sách */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode(ChapterViewMode.ACCORDION)}
              title="Xem dạng xổ chi tiết (Accordion)"
              className={`${BTN_VIEW_MODE_BASE} ${
                viewMode === ChapterViewMode.ACCORDION ? BTN_VIEW_MODE_ACTIVE : BTN_VIEW_MODE_INACTIVE
              }`}
            >
              <Icon name={IconName.FOLDER} size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode(ChapterViewMode.LIST)}
              title="Xem dạng danh sách (bảng gọn)"
              className={`${BTN_VIEW_MODE_BASE} ${
                viewMode === ChapterViewMode.LIST ? BTN_VIEW_MODE_ACTIVE : BTN_VIEW_MODE_INACTIVE
              }`}
            >
              <Icon name={IconName.MENU} size={13} />
            </button>
          </div>

          {!readOnly && (
          <button
            type="button"
            id="btn-add-chapter"
            onClick={onOpenCreateChapter}
            className="primary-button !h-7 !text-xs !px-3"
          >
            <Icon name={IconName.PLUS} size={12} />
            <span>Thêm Chương</span>
          </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Đang tải cấu trúc chương...</div>
      ) : !chapters || chapters.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm font-semibold text-slate-700">Chưa có chương nào trong lộ trình này</p>
          <p className="text-xs text-slate-400 mt-1">Nhấn &quot;Thêm Chương&quot; để bắt đầu xây dựng cấu trúc bài giảng.</p>
          {!readOnly && (
          <button
            type="button"
            onClick={onOpenCreateChapter}
            className="primary-button !h-8 !text-xs !px-4 mt-4"
          >
            + Thêm chương đầu tiên
          </button>
          )}
        </div>
      ) : viewMode === ChapterViewMode.LIST ? (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-semibold">
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-3 py-2">Chương</th>
                <th className="px-3 py-2">Số bài học</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedChapters.map((chapter, pagedIdx) => {
                const chIdx = (page - 1) * PAGE_SIZE + pagedIdx;
                const lessonCount = chapter.chapterLessons?.length || 0;
                return (
                  <tr key={chapter.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className={`${TABLE_CELL_TOP} font-mono text-slate-400`}>{chIdx + 1}</td>
                    <td className={TABLE_CELL_TOP}>
                      <div className="font-bold text-slate-900">{chapter.title}</div>
                      {chapter.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">{chapter.description}</div>
                      )}
                    </td>
                    <td className={TABLE_CELL_TOP}>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                          lessonCount > 0 ? BADGE_HAS_LESSONS : BADGE_NO_LESSONS
                        }`}
                      >
                        {lessonCount > 0 ? `${lessonCount} bài học` : 'Chưa thêm bài'}
                      </span>
                    </td>
                    <td className={`${TABLE_CELL_TOP} text-right whitespace-nowrap`}>
                      {onEditChapter && (
                        <button
                          type="button"
                          onClick={() => onEditChapter(chapter)}
                          title="Sửa tên / mô tả chương"
                          className="px-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700"
                        >
                          Sửa
                        </button>
                      )}
                      {!readOnly && (<>
                      <button
                        type="button"
                        onClick={() => onCreateLessonInChapter(chapter)}
                        title="Soạn bài mới trong chương này"
                        className="text-slate-500 hover:text-emerald-700 p-1"
                      >
                        <Icon name={IconName.EDIT} size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAddLessons(chapter)}
                        title="Thêm Lesson từ thư viện"
                        className="text-slate-500 hover:text-emerald-700 p-1"
                      >
                        <Icon name={IconName.PLUS} size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onDeleteChapter(e, chapter.id, chapter.title)}
                        title="Xóa chương"
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Icon name={IconName.TRASH} size={13} />
                      </button>
                      </>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {pagedChapters.map((chapter, pagedIdx) => {
            const chIdx = (page - 1) * PAGE_SIZE + pagedIdx;
            const isExpanded = expandedChapters[chapter.id] ?? true;
            const lessonCount = chapter.chapterLessons?.length || 0;

            return (
              <div
                key={chapter.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 transition-all hover:border-slate-300"
              >
                {/* Header của Chương */}
                <div
                  onClick={() => onToggleExpand(chapter.id)}
                  className="flex items-center justify-between p-3.5 px-4 bg-white border-b border-slate-200 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 hover:text-slate-600 transition-transform">
                      <Icon
                        name={IconName.CHEVRON}
                        size={14}
                        className={`transform transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                      />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Chương {chIdx + 1}. {chapter.title}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            lessonCount > 0 ? BADGE_HAS_LESSONS : BADGE_NO_LESSONS
                          }`}
                        >
                          {lessonCount > 0 ? `${lessonCount} bài học` : 'Chưa thêm bài'}
                        </span>
                      </div>
                      {chapter.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{chapter.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Chapter Actions */}
                  {readOnly && onEditChapter && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditChapter(chapter);
                      }}
                      className="secondary-button !h-7 !text-xs !px-2.5"
                    >
                      Sửa tên / mô tả
                    </button>
                  )}
                  {!readOnly && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onCreateLessonInChapter(chapter)}
                      className="primary-button !h-7 !text-xs !px-2.5"
                      title="Soạn một bài học mới, lưu xong tự gắn vào chương này"
                    >
                      <Icon name={IconName.EDIT} size={11} />
                      <span>Soạn bài mới</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAddLessons(chapter)}
                      className="secondary-button !h-7 !text-xs !px-2.5 text-emerald-800 bg-emerald-50/60 border-emerald-300 hover:bg-emerald-100"
                      title="Chọn các bài học độc lập từ Thư viện gom vào chương này"
                    >
                      <Icon name={IconName.PLUS} size={11} />
                      <span>Thêm Lesson từ thư viện</span>
                    </button>

                    {onEditChapter && (
                      <button
                        type="button"
                        onClick={() => onEditChapter(chapter)}
                        className="secondary-button !h-7 !text-xs !px-2.5"
                        title="Sửa tên / mô tả chương"
                      >
                        Sửa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => onDeleteChapter(e, chapter.id, chapter.title)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Xóa chương"
                    >
                      <Icon name={IconName.TRASH} size={13} />
                    </button>
                  </div>
                  )}
                </div>

                {/* Danh sách Lesson trong Chương (Có thể kéo thả) */}
                {isExpanded && (
                  <div className="p-3 bg-slate-50 space-y-2">
                    {lessonCount === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg">
                        <p className="font-medium text-slate-500">Chưa thêm bài vào chương này.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Nhấn <strong>[Soạn bài mới]</strong> để viết bài ngay trong chương, hoặc <strong>[+ Thêm Lesson từ thư viện]</strong> để gom bài có sẵn.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {chapter.chapterLessons.map((cl, lIdx) => {
                          return (
                            <div
                              key={cl.id}
                              className="flex items-center justify-between p-2.5 px-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-slate-500 w-5 text-center">
                                  {lIdx + 1}
                                </span>

                                <div className="w-6 h-6 rounded bg-emerald-100/60 text-emerald-800 flex items-center justify-center shrink-0">
                                  <Icon name={IconName.FILE} size={12} />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onOpenLesson(cl.lessonId)}
                                  className="text-left cursor-pointer group"
                                  title="Mở soạn thảo bài học này"
                                >
                                  <span className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700 group-hover:underline">
                                    {cl.lesson?.title || 'Bài học không có tiêu đề'}
                                  </span>
                                </button>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenLesson(cl.lessonId)}
                                  className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                                  title="Mở soạn thảo"
                                >
                                  <Icon name={IconName.EDIT} size={12} />
                                </button>

                                {!readOnly && (
                                <button
                                  type="button"
                                  onClick={(e) => onRemoveLesson(e, chapter.id, cl.lessonId)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded ml-1 text-xs leading-none"
                                  title="Bỏ bài học khỏi chương này"
                                >
                                  ✕
                                </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phân trang — chỉ hiện khi nhiều hơn 1 trang */}
      {!loading && chapters && chapters.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Chương {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, chapters.length)} trong {chapters.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setPage(pg)}
                className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold transition ${
                  pg === page
                    ? 'bg-emerald-700 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
