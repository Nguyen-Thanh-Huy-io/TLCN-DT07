'use client';
import { CommonFilterOption, LessonStatus } from '@/constants/enums';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { LessonItem } from '@/types/models/lesson.type';

interface LessonLibraryPanelProps {
  lessons: LessonItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onCreateLesson: () => void;
  onOpenLesson: (lessonId: string) => void;
  onDeleteLesson: (lesson: LessonItem) => void;
}

export enum LibraryViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
}

const PAGE_SIZE = 9;

const BTN_VIEW_MODE_BASE = 'w-7 h-7 flex items-center justify-center rounded-md transition';
const BTN_VIEW_MODE_ACTIVE = 'bg-white text-emerald-700 shadow-2xs';
const BTN_VIEW_MODE_INACTIVE = 'text-slate-500 hover:text-slate-800';
const BADGE_PUBLISHED = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
const BADGE_DRAFT = 'bg-amber-50 text-amber-700 border border-amber-200';
const LABEL_PUBLISHED = 'Đã xuất bản';
const LABEL_DRAFT = 'Bản nháp';

/** Tab "Thư viện Lesson": danh sách mọi bài học độc lập, tìm kiếm + lọc trạng thái,
 * có thể mở lại để soạn thảo hoặc tái sử dụng vào nhiều lộ trình/chương khác nhau.
 * Có 2 cách xem — Lưới (card, mặc định) và Danh sách (dạng bảng) — cả 2 đều phân trang
 * phía client (danh sách đã tải tối đa 100 bài, đủ nhỏ để không cần phân trang server). */
export function LessonLibraryPanel({
  lessons,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreateLesson,
  onOpenLesson,
  onDeleteLesson,
}: LessonLibraryPanelProps) {
  const [viewMode, setViewMode] = useState<LibraryViewMode>(LibraryViewMode.GRID);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(lessons.length / PAGE_SIZE));

  // Quay về trang 1 mỗi khi bộ lọc/tìm kiếm thay đổi kết quả, tránh đứng ở trang rỗng
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, lessons.length]);

  const pagedLessons = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return lessons.slice(start, start + PAGE_SIZE);
  }, [lessons, page]);

  const renderPagination = () => (
    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
      <span>
        Hiển thị {pagedLessons.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
        {(page - 1) * PAGE_SIZE + pagedLessons.length} trong {lessons.length} bài học
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
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Thư viện Lesson độc lập</h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Các bài học được soạn thảo và lưu độc lập. Có thể tái sử dụng vào nhiều lộ trình / chương khác nhau.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm bài học..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-input !h-8 !text-xs !pl-8 !pr-3 w-60"
            />
            <span className="absolute left-2.5 top-2 text-slate-500">
              <Icon name={IconName.SEARCH} size={13} />
            </span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="form-input !h-8 !text-xs !py-0 w-36"
          >
            <option value={CommonFilterOption.ALL}>Tất cả trạng thái</option>
            <option value={LessonStatus.PUBLISHED}>Đã xuất bản</option>
            <option value={LessonStatus.DRAFT}>Bản nháp</option>
          </select>

          {/* Chuyển đổi Lưới / Danh sách */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode(LibraryViewMode.GRID)}
              title="Xem dạng lưới"
              className={`${BTN_VIEW_MODE_BASE} ${
                viewMode === LibraryViewMode.GRID ? BTN_VIEW_MODE_ACTIVE : BTN_VIEW_MODE_INACTIVE
              }`}
            >
              <Icon name={IconName.GRID} size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode(LibraryViewMode.LIST)}
              title="Xem dạng danh sách"
              className={`${BTN_VIEW_MODE_BASE} ${
                viewMode === LibraryViewMode.LIST ? BTN_VIEW_MODE_ACTIVE : BTN_VIEW_MODE_INACTIVE
              }`}
            >
              <Icon name={IconName.MENU} size={13} />
            </button>
          </div>

          <button type="button" onClick={onCreateLesson} className="primary-button !h-8 !text-xs !px-3.5 font-bold">
            <Icon name={IconName.PLUS} size={13} />
            <span>+ Soạn bài mới</span>
          </button>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-600 font-medium">Không tìm thấy bài học nào phù hợp.</div>
      ) : viewMode === LibraryViewMode.GRID ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        lesson.status === LessonStatus.PUBLISHED ? BADGE_PUBLISHED : BADGE_DRAFT
                      }`}
                    >
                      {lesson.status === LessonStatus.PUBLISHED ? LABEL_PUBLISHED : LABEL_DRAFT}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{lesson.title}</h3>

                  {lesson.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{lesson.description}</p>
                  )}

                  {Array.isArray(lesson.tags) && lesson.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {lesson.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                          style={
                            tag.colorHex
                              ? {
                                  backgroundColor: `${tag.colorHex}15`,
                                  color: tag.colorHex,
                                  borderColor: `${tag.colorHex}40`,
                                }
                              : undefined
                          }
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3 gap-2">
                  <span className="text-xs text-slate-500 truncate">
                    {lesson.updatedAt ? `Cập nhật ${new Date(lesson.updatedAt).toLocaleDateString('vi-VN')}` : ''}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDeleteLesson(lesson)}
                      title="Xóa bài học"
                      className="text-xs font-semibold text-slate-500 hover:text-rose-700 flex items-center p-1 cursor-pointer"
                    >
                      <Icon name={IconName.TRASH} size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenLesson(lesson.id)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mở soạn thảo</span>
                      <Icon name={IconName.ARROW} size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {renderPagination()}
        </>
      ) : (
        <>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-700 font-bold">
                  <th className="px-3 py-2">Bài học &amp; Slug</th>
                  <th className="px-3 py-2">Tóm tắt</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2">Cập nhật</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedLessons.map((lesson) => (
                  <tr key={lesson.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-bold text-slate-900">{lesson.title}</div>
                      {Array.isArray(lesson.tags) && lesson.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lesson.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              style={
                                tag.colorHex
                                  ? {
                                      backgroundColor: `${tag.colorHex}15`,
                                      color: tag.colorHex,
                                      borderColor: `${tag.colorHex}40`,
                                    }
                                  : undefined
                              }
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 align-top text-slate-600 max-w-xs">
                      <span className="line-clamp-2 leading-relaxed">{lesson.description || 'Chưa có mô tả tóm tắt'}</span>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                          lesson.status === LessonStatus.PUBLISHED ? BADGE_PUBLISHED : BADGE_DRAFT
                        }`}
                      >
                        {lesson.status === LessonStatus.PUBLISHED ? LABEL_PUBLISHED : LABEL_DRAFT}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top text-slate-600 font-mono whitespace-nowrap">
                      {lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-3 py-2.5 align-top text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenLesson(lesson.id)}
                        title="Mở soạn thảo"
                        className="text-slate-600 hover:text-emerald-700 p-1 cursor-pointer"
                      >
                        <Icon name={IconName.EDIT} size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteLesson(lesson)}
                        title="Xóa bài học"
                        className="text-slate-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Icon name={IconName.TRASH} size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
}
