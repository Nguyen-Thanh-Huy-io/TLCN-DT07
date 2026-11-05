import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HistoricalEventApiService,
  type HistoricalEventItem,
} from '@/services/entities/historical-event.service';
import {
  TaxonomyApiService,
  type TaxonomyTermItem,
} from '@/services/entities/taxonomy.service';
import { PeriodApiService } from '@/services/entities/period.service';
import type { PeriodItem } from '@/types/models/period.type';
import { TaxonomyGroupCode } from '@/constants/enums';
import {
  CompositeEventSpecification,
  type EventFilterCriteria,
} from '../strategies/event-filter.specification';
import { extractErrorMessage } from '@/services/api';

export type { EventFilterCriteria };

export type EventViewMode = 'flat' | 'period_grouped';

export interface EventListStats {
  totalEvents: number;
  campaignCount: number;
  subEventCount: number;
  publishedCount: number;
}

export interface PeriodGroupedEvents {
  periodId: string;
  periodName: string;
  yearRange: string;
  events: HistoricalEventItem[];
}

export function useEventListFacade() {
  const [events, setEvents] = useState<HistoricalEventItem[]>([]);
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [categoryTerms, setCategoryTerms] = useState<TaxonomyTermItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state (Đa chọn Multi-Select)
  const [search, setSearch] = useState<string>('');
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<EventViewMode>('flat');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Delete modal state
  const [deletingEvent, setDeletingEvent] = useState<HistoricalEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [firstPageEvents, periodsRes, termsRes] = await Promise.all([
        HistoricalEventApiService.getEvents({ page: 1, limit: 100 }),
        PeriodApiService.getPeriods({ limit: 100 }).catch(() => ({ items: [] })),
        TaxonomyApiService.getGroups([TaxonomyGroupCode.EVENT_TYPE]).catch(() => []),
      ]);

      let allEvents = firstPageEvents.items || [];

      // Nếu có nhiều hơn 1 trang (hơn 100 sự kiện), tải thêm các trang tiếp theo (tối đa 5 trang)
      if (firstPageEvents.totalPages && firstPageEvents.totalPages > 1) {
        const pagesToFetch = Array.from(
          { length: Math.min(firstPageEvents.totalPages - 1, 4) },
          (_, i) => i + 2,
        );
        const additionalPages = await Promise.all(
          pagesToFetch.map((page) =>
            HistoricalEventApiService.getEvents({ page, limit: 100 }).catch(() => ({ items: [] })),
          ),
        );
        for (const pageRes of additionalPages) {
          if (pageRes.items) {
            allEvents = allEvents.concat(pageRes.items);
          }
        }
      }

      setEvents(allEvents);
      setPeriods(periodsRes.items || []);
      setCategoryTerms(termsRes[0]?.terms ?? []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Sự kiện lịch sử:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bản đồ các ID con của từng Period (dùng để lọc bao quát khi chọn Period cha)
  const periodChildrenMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const p of periods) {
      if (p.parentId) {
        const set = map.get(p.parentId) || new Set<string>();
        set.add(p.id);
        map.set(p.parentId, set);
      }
    }
    return map;
  }, [periods]);

  const currentCriteria = useMemo<EventFilterCriteria>(
    () => ({
      selectedPeriodIds,
      selectedCategories,
      selectedStatus,
    }),
    [selectedPeriodIds, selectedCategories, selectedStatus]
  );

  // Bộ lọc danh sách sự kiện áp dụng Specification Pattern
  const filteredEvents = useMemo(() => {
    const spec = new CompositeEventSpecification(
      search,
      currentCriteria,
      categoryTerms,
      periodChildrenMap
    );
    return events.filter((item) => spec.isSatisfiedBy(item));
  }, [events, search, currentCriteria, categoryTerms, periodChildrenMap]);

  // Hàm tính toán số lượng sự kiện khớp với draft criteria (dành cho Modal Phễu lọc đếm trước kết quả)
  const countForDraft = useCallback(
    (draft: EventFilterCriteria) => {
      const spec = new CompositeEventSpecification(
        search,
        draft,
        categoryTerms,
        periodChildrenMap
      );
      return events.filter((item) => spec.isSatisfiedBy(item)).length;
    },
    [events, search, categoryTerms, periodChildrenMap]
  );

  // Áp dụng trọn vẹn bộ lọc từ Modal Phễu lọc
  const applyFilters = useCallback((criteria: EventFilterCriteria) => {
    setSelectedPeriodIds(criteria.selectedPeriodIds || []);
    setSelectedCategories(criteria.selectedCategories || []);
    setSelectedStatus(criteria.selectedStatus || 'all');
    setCurrentPage(1);
  }, []);

  // Số lượng tiêu chí lọc đang được kích hoạt (ngoài ô tìm kiếm)
  const activeFilterCount = useMemo(() => {
    let count = selectedPeriodIds.length + selectedCategories.length;
    if (selectedStatus !== 'all') count++;
    return count;
  }, [selectedPeriodIds, selectedCategories, selectedStatus]);

  // Reset về trang 1 khi thay đổi điều kiện lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedPeriodIds, selectedCategories, selectedStatus, pageSize]);

  // Phân trang dữ liệu hiển thị cho chế độ bảng phẳng
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEvents.slice(startIndex, startIndex + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // Nhóm sự kiện theo Thời kỳ lịch sử (dành cho chế độ xem period_grouped)
  const groupedByPeriod = useMemo<PeriodGroupedEvents[]>(() => {
    const periodMap = new Map<string, HistoricalEventItem[]>();
    const unknownPeriodEvents: HistoricalEventItem[] = [];

    for (const event of filteredEvents) {
      if (event.periodId) {
        if (!periodMap.has(event.periodId)) {
          periodMap.set(event.periodId, []);
        }
        periodMap.get(event.periodId)!.push(event);
      } else {
        unknownPeriodEvents.push(event);
      }
    }

    const result: PeriodGroupedEvents[] = [];

    // Thêm các thời kỳ có sự kiện theo thứ tự niên đại
    for (const period of periods) {
      if (periodMap.has(period.id)) {
        const evs = periodMap.get(period.id)!;
        const yearRange =
          period.startYear && period.endYear
            ? `${period.startYear} – ${period.endYear}`
            : period.startYear
              ? `Từ năm ${period.startYear}`
              : 'Thời kỳ lịch sử';

        result.push({
          periodId: period.id,
          periodName: period.name,
          yearRange,
          events: evs,
        });
      }
    }

    // Nếu có sự kiện chưa gán thời kỳ
    if (unknownPeriodEvents.length > 0) {
      result.push({
        periodId: 'unknown',
        periodName: 'Chưa phân thời kỳ',
        yearRange: 'Giai đoạn khác',
        events: unknownPeriodEvents,
      });
    }

    return result;
  }, [filteredEvents, periods]);

  // Tính toán KPI Stats
  const stats: EventListStats = useMemo(() => {
    const totalEvents = events.length;
    let campaignCount = 0;
    let subEventCount = 0;
    let publishedCount = 0;

    for (const e of events) {
      if (e.children && e.children.length > 0) {
        campaignCount++;
      }
      if (e.parentId) {
        subEventCount++;
      }
      if (e.status === 'PUBLISHED') {
        publishedCount++;
      }
    }

    return { totalEvents, campaignCount, subEventCount, publishedCount };
  }, [events]);

  // Xóa sự kiện
  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    try {
      setIsDeleting(true);
      await HistoricalEventApiService.deleteEvent(deletingEvent.id);
      setEvents((prev) => prev.filter((e) => e.id !== deletingEvent.id));
      setDeletingEvent(null);
    } catch (err) {
      console.error('Delete event failed:', err);
      alert(extractErrorMessage(err, 'Không thể xóa Sự kiện lịch sử.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Kiểm tra xem có bộ lọc nào đang được kích hoạt không (bao gồm cả từ khóa và tiêu chí)
  const hasActiveFilters =
    search.trim() !== '' ||
    selectedPeriodIds.length > 0 ||
    selectedCategories.length > 0 ||
    selectedStatus !== 'all';

  // Đặt lại toàn bộ bộ lọc về trạng thái ban đầu
  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSelectedPeriodIds([]);
    setSelectedCategories([]);
    setSelectedStatus('all');
    setCurrentPage(1);
  }, []);

  return {
    events: paginatedEvents,
    allFilteredEvents: filteredEvents,
    allEventsCount: events.length,
    periods,
    categoryTerms,
    loading,
    search,
    setSearch,
    selectedPeriodIds,
    setSelectedPeriodIds,
    selectedCategories,
    setSelectedCategories,
    selectedStatus,
    setSelectedStatus,
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
    totalFilteredCount: filteredEvents.length,
    groupedByPeriod,
    stats,
    deletingEvent,
    setDeletingEvent,
    isDeleting,
    handleDeleteEvent,
    refresh: loadData,
  };
}
