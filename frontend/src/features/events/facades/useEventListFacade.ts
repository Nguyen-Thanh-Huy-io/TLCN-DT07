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
import { SmartEventClassifier } from '../strategies/event-classifier.strategy';
import { extractErrorMessage } from '@/services/api';

export type EventLevelFilter = 'all' | 'root_only' | 'sub_only';
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

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<EventLevelFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<EventViewMode>('flat');

  // Delete modal state
  const [deletingEvent, setDeletingEvent] = useState<HistoricalEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsRes, periodsRes, termsRes] = await Promise.all([
        HistoricalEventApiService.getEvents({ limit: 300 }),
        PeriodApiService.getPeriods({ limit: 100 }).catch(() => ({ items: [] })),
        TaxonomyApiService.getGroups(['EVENT_CATEGORY']).catch(() => []),
      ]);

      setEvents(eventsRes.items || []);
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

  // Bộ lọc danh sách sự kiện
  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      // 1. Lọc theo từ khóa tìm kiếm
      const query = search.trim().toLowerCase();
      if (query) {
        const titleMatch = item.title.toLowerCase().includes(query);
        const summaryMatch = Boolean(item.summary?.toLowerCase().includes(query));
        const parentMatch = Boolean(item.parent?.title?.toLowerCase().includes(query));
        const locationMatch = Boolean(
          item.historicalLocation?.name?.toLowerCase().includes(query),
        );
        if (!titleMatch && !summaryMatch && !parentMatch && !locationMatch) {
          return false;
        }
      }

      // 2. Lọc theo Thời kỳ lịch sử
      if (selectedPeriodId !== 'all') {
        if (item.periodId !== selectedPeriodId) {
          return false;
        }
      }

      // 3. Lọc theo Cấp độ sự kiện (Chiến dịch cha vs Trận đánh con)
      if (levelFilter === 'root_only') {
        if (item.parentId) return false;
      } else if (levelFilter === 'sub_only') {
        if (!item.parentId) return false;
      }

      // 4. Lọc theo Phân loại sự kiện (sử dụng Smart Classifier)
      if (selectedCategory !== 'all') {
        const classified = SmartEventClassifier.classify(categoryTerms, item);
        if (classified.code !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [events, search, selectedPeriodId, levelFilter, selectedCategory, categoryTerms]);

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

  return {
    events: filteredEvents,
    allEventsCount: events.length,
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
    refresh: loadData,
  };
}
