'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  ShieldAlert,
  GitBranch,
  BookOpen,
  Filter,
  LayoutList,
  FolderTree,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { formatHistoricalYear } from '@/utils/history-year.utils';
import { useEventListFacade } from '../facades/useEventListFacade';
import { SmartEventClassifier } from '../strategies/event-classifier.strategy';
import { EventHierarchyBadge } from './EventHierarchyBadge';
import { EventLocationCell } from './EventLocationCell';
import { EventFilterModal } from './EventFilterModal';

export function EventList() {
  const router = useRouter();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Phím tắt Ctrl+K hoặc Cmd+K để focus vào Global Search
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);

  const {
    events,
    periods,
    categoryTerms,
    loading,
    search,
    setSearch,
    currentCriteria,
    activeFilterCount,
    countForDraft,
    applyFilters,
    hasActiveFilters,
    handleResetFilters,
    viewMode,
    setViewMode,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalFilteredCount,
    groupedByPeriod,
    stats,
    deletingEvent,
    setDeletingEvent,
    isDeleting,
    handleDeleteEvent,
  } = useEventListFacade();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-500">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-amber-800 rounded-full animate-spin mr-2.5" />
        <span className="font-medium">Đang tải và chuẩn hóa cây sự kiện lịch sử...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{stats.totalEvents}</div>
            <div className="text-xs text-slate-500 font-medium">Tổng số sự kiện</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-indigo-700">{stats.campaignCount}</div>
            <div className="text-xs text-slate-500 font-medium">Đại sự kiện / Chiến dịch</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
            <GitBranch size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-purple-700">{stats.subEventCount}</div>
            <div className="text-xs text-slate-500 font-medium">Sự kiện con / Trận đánh</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">{stats.publishedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Đã xuất bản vào từ điển</div>
          </div>
        </div>
      </div>

      {/* 2. Unified Single-Row Toolbar (Gọn gàng 1 hàng duy nhất, gom bộ lọc vào Phễu lọc) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        {/* Nhóm trái: Ô tìm kiếm tổng + Nút [ 🌪️ Bộ lọc ] */}
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          {/* Ô tìm kiếm từ khóa tổng (Global Search) */}
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm sự kiện, nhân vật, năm (1945)... (Ctrl+K)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-14 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-800 focus:outline-none placeholder:text-slate-400"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search size={16} />
            </span>
            <div className="absolute right-2.5 top-2 flex items-center gap-1">
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded text-xs"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded">
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>

          {/* Nút Phễu lọc gom chung */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer select-none shrink-0 ${
              activeFilterCount > 0
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs font-bold'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
            }`}
            title="Mở phễu lọc theo thời kỳ, danh mục và cấp độ"
          >
            <Filter
              size={15}
              className={activeFilterCount > 0 ? 'text-amber-800' : 'text-slate-500'}
            />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-800 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {activeFilterCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetFilters();
                }}
                className="ml-1 text-amber-800 hover:text-amber-950 font-bold hover:bg-amber-200/70 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                title="Xóa nhanh tất cả bộ lọc"
              >
                ✕
              </span>
            )}
          </button>
        </div>

        {/* Nhóm phải: Chuyển chế độ xem + Nút Thêm mới */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Switcher Bảng phân cấp / Gom theo Thời kỳ */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'flat'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng Bảng phân cấp chuẩn"
            >
              <LayoutList size={14} />
              <span className="hidden md:inline">Bảng phân cấp</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('period_grouped')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'period_grouped'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Gom nhóm sự kiện theo Thời kỳ lịch sử"
            >
              <FolderTree size={14} />
              <span className="hidden md:inline">Gom theo Thời kỳ</span>
            </button>
          </div>

          {/* Create Button */}
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.EVENTS.CREATE)}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Thêm sự kiện lịch sử</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>
      </div>

      {/* 3. Data Presentation */}
      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-amber-50 text-amber-800 mb-1">
            <Calendar size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy sự kiện nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Không có sự kiện lịch sử nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc thêm sự kiện mới.
          </p>
        </div>
      ) : viewMode === 'period_grouped' ? (
        /* CHẾ ĐỘ 1: Gom nhóm theo Thời kỳ lịch sử */
        <div className="space-y-6">
          {groupedByPeriod.map((group) => (
            <div
              key={group.periodId}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Period Group Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-amber-100/70 text-amber-900">
                    <BookOpen size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{group.periodName}</h3>
                    <span className="text-xs text-slate-500 font-mono">{group.yearRange}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                  {group.events.length} sự kiện
                </span>
              </div>

              {/* Table of events in period */}
              {renderEventTable(group.events)}
            </div>
          ))}
        </div>
      ) : (
        /* CHẾ ĐỘ 2: Bảng phân cấp chuẩn */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {renderEventTable(events)}
          {renderPagination()}
        </div>
      )}

      {/* Modal Phễu lọc gom chung */}
      <EventFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        criteria={currentCriteria}
        periods={periods}
        categoryTerms={categoryTerms}
        countForDraft={countForDraft}
        onApply={applyFilters}
        onReset={handleResetFilters}
      />

      {/* Modal xác nhận xóa */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingEvent)}
        title="Xóa Sự kiện Lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingEvent?.title}" khỏi cơ sở dữ liệu? Toàn bộ các liên kết đồ thị quan hệ sự kiện sẽ bị hủy bỏ.`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteEvent}
        onClose={() => setDeletingEvent(null)}
      />
    </div>
  );

  /**
   * Render thanh điều khiển phân trang (Pagination bar)
   */
  function renderPagination() {
    if (totalFilteredCount === 0) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalFilteredCount);

    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination bg-slate-50/60 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-slate-700 font-medium">
            Hiển thị <strong>{startItem}–{endItem}</strong> trong <strong>{totalFilteredCount}</strong> sự kiện
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            title="Số sự kiện trên mỗi trang"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            aria-label="Trang trước"
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ‹
          </button>
          {startPage > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 text-slate-400 self-center">...</span>}
            </>
          )}
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              type="button"
              className={pg === currentPage ? 'selected' : ''}
              aria-label={`Trang ${pg}`}
              onClick={() => setCurrentPage(pg)}
            >
              {pg}
            </button>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-1 text-slate-400 self-center">...</span>}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            aria-label="Trang sau"
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            ›
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render bảng danh sách sự kiện tối ưu 5 cột ngữ nghĩa (Giải quyết Vấn đề 05)
   */
  function renderEventTable(data: typeof events) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4 min-w-[340px]">Sự kiện lịch sử & Cấp độ</th>
              <th className="py-3.5 px-4 min-w-[170px]">Phân loại sự kiện</th>
              <th className="py-3.5 px-4 min-w-[190px]">Niên đại & Địa danh</th>
              <th className="py-3.5 px-4 text-center min-w-[110px]">Trạng thái</th>
              <th className="py-3.5 px-4 text-right min-w-[130px]">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.map((item) => {
              // Phân loại thông minh
              const classification = SmartEventClassifier.classify(categoryTerms, item);
              const CatIcon = classification.icon;

              // Niên đại hiển thị
              let dateDisplay = item.eventDateNote;
              if (!dateDisplay) {
                if (item.startYear && item.endYear) {
                  dateDisplay = `${formatHistoricalYear(item.startYear)} – ${formatHistoricalYear(item.endYear)}`;
                } else if (item.startYear) {
                  dateDisplay = formatHistoricalYear(item.startYear);
                } else {
                  dateDisplay = 'Chưa xác định';
                }
              }

              const isSubEvent = Boolean(item.parentId);

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isSubEvent ? 'bg-slate-50/25' : ''
                  }`}
                >
                  {/* Cột 1: SỰ KIỆN LỊCH SỬ & PHÂN CẤP */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail or Category Avatar */}
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100 mt-0.5"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                          <CatIcon size={18} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={APP_ROUTES.EVENTS.DETAIL(item.id)}
                            className="font-bold text-slate-900 text-sm hover:text-amber-800 transition-colors line-clamp-1"
                          >
                            {item.title}
                          </Link>

                          {/* Badge Thời kỳ nếu có */}
                          {item.period?.name && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {item.period.name}
                            </span>
                          )}
                        </div>

                        {/* Quan hệ phân cấp Cha - Con (Giải quyết Vấn đề 02) */}
                        <EventHierarchyBadge
                          parentId={item.parentId}
                          parent={item.parent}
                          childrenCount={item.children?.length || 0}
                        />

                        {/* Mô tả tóm tắt ngắn */}
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-[50ch]">
                          {item.summary ||
                            (item.description
                              ? item.description.replace(/<[^>]*>/g, ' ')
                              : 'Chưa có mô tả tóm tắt')}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: PHÂN LOẠI SỰ KIỆN (Giải quyết Vấn đề 01) */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5">
                      <Badge tone={classification.tone}>
                        <CatIcon size={12} className="mr-1 inline-block shrink-0" />
                        <span>{classification.label}</span>
                      </Badge>
                      {classification.isHeuristic && (
                        <span
                          className="text-[10px] text-slate-400 cursor-help"
                          title="Hệ thống tự động phân loại dựa trên bối cảnh lịch sử của tiêu đề sự kiện"
                        >
                          ✦
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cột 3: NIÊN ĐẠI & ĐỊA DANH (Giải quyết Vấn đề 03) */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      {/* Dòng 1: Niên đại */}
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        {dateDisplay}
                      </div>

                      {/* Dòng 2: Địa danh / Phạm vi chiến lược */}
                      <EventLocationCell
                        historicalLocation={item.historicalLocation}
                        metadata={item.metadata}
                      />
                    </div>
                  </td>

                  {/* Cột 4: TRẠNG THÁI */}
                  <td className="py-3.5 px-4 text-center">
                    <Badge tone={STATUS_TONE_MAP[item.status || ContentStatus.PUBLISHED]}>
                      {STATUS_LABEL_MAP[item.status || ContentStatus.PUBLISHED]}
                    </Badge>
                  </td>

                  {/* Cột 5: TÁC VỤ */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => router.push(APP_ROUTES.EVENTS.DETAIL(item.id))}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Xem chi tiết sự kiện"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push(APP_ROUTES.EVENTS.DETAIL(item.id))}
                        className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Chỉnh sửa sự kiện"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingEvent(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa sự kiện"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
