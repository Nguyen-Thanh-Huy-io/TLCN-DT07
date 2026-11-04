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
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus, EventCategory } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { formatHistoricalYear } from '@/utils/history-year.utils';
import { useEventListFacade } from '../facades/useEventListFacade';
import { SmartEventClassifier } from '../strategies/event-classifier.strategy';
import { EventHierarchyBadge } from './EventHierarchyBadge';
import { EventLocationCell } from './EventLocationCell';

export function EventList() {
  const router = useRouter();
  const {
    events,
    periods,
    categoryTerms,
    loading,
    search,
    setSearch,
    selectedPeriodId,
    setSelectedPeriodId,
    levelFilter,
    setLevelFilter,
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
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

      {/* 2. Toolbar & Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện, niên đại, địa danh, chiến dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-800 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search size={16} />
            </span>
          </div>

          {/* View mode toggle & Action button */}
          <div className="flex items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'flat'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Xem dạng bảng phân cấp chuẩn"
              >
                <LayoutList size={13} />
                <span>Bảng phân cấp</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('period_grouped')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'period_grouped'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Gom nhóm sự kiện theo Thời kỳ lịch sử"
              >
                <FolderTree size={13} />
                <span>Gom theo Thời kỳ</span>
              </button>
            </div>

            {/* Create Button */}
            <button
              type="button"
              onClick={() => router.push(APP_ROUTES.EVENTS.CREATE)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus size={15} />
              <span>Thêm sự kiện lịch sử</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
            <Filter size={13} />
            <span>Bộ lọc:</span>
          </div>

          {/* 1. Lọc theo Thời kỳ lịch sử (Giải quyết Vấn đề 04) */}
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-800"
          >
            <option value="all">Tất cả thời kỳ lịch sử</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* 2. Lọc theo Cấp độ sự kiện (Giải quyết Vấn đề 02) */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-800"
          >
            <option value="all">Tất cả cấp độ sự kiện</option>
            <option value="root_only">Chỉ sự kiện cha / Chiến dịch lớn</option>
            <option value="sub_only">Chỉ sự kiện trực thuộc / Trận đánh con</option>
          </select>

          {/* 3. Lọc theo Phân loại sự kiện (Giải quyết Vấn đề 01) */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-800"
          >
            <option value="all">Tất cả phân loại</option>
            <option value={EventCategory.WAR}>Chiến tranh / Kháng chiến</option>
            <option value={EventCategory.BATTLE}>Trận đánh / Chiến dịch</option>
            <option value={EventCategory.REVOLUTION}>Cách mạng / Khởi nghĩa</option>
            <option value={EventCategory.TREATY}>Hiệp ước / Văn kiện</option>
            <option value={EventCategory.POLITICAL_EVENT}>Chính trị / Thể chế</option>
            <option value={EventCategory.SUMMIT_CONFERENCE}>Hội nghị / Đại hội</option>
            <option value={EventCategory.CULTURE_SCIENCE}>Văn hóa / Tư tưởng</option>
          </select>

          <div className="ml-auto text-xs text-slate-500 font-medium">
            Hiển thị <strong>{events.length}</strong> sự kiện
          </div>
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
        </div>
      )}

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
