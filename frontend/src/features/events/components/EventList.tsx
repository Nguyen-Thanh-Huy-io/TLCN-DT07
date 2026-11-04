'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { ColumnDef } from '@/types/table.types';
import {
  HistoricalEventApiService,
  type HistoricalEventItem,
} from '@/services/entities/historical-event.service';
import {
  TaxonomyApiService,
  type TaxonomyTermItem,
} from '@/services/entities/taxonomy.service';
import { eventCategoryLabel } from '@/features/taxonomy/taxonomy-labels';
import { extractErrorMessage } from '@/services/api';
import { formatHistoricalYear } from '@/utils/history-year.utils';

export function EventList() {
  const router = useRouter();
  const [events, setEvents] = useState<HistoricalEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryTerms, setCategoryTerms] = useState<TaxonomyTermItem[]>([]);
  const [deletingEvent, setDeletingEvent] =
    useState<HistoricalEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    TaxonomyApiService.getGroups(['EVENT_CATEGORY'])
      .then(([group]) => setCategoryTerms(group?.terms ?? []))
      .catch(() => setCategoryTerms([]));
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await HistoricalEventApiService.getEvents({ limit: 100 });
      setEvents(res.items || []);
    } catch (err) {
      console.error('Failed to fetch historical events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

  const columns: ColumnDef<HistoricalEventItem>[] = useMemo(
    () => [
      {
        header: 'SỰ KIỆN LỊCH SỬ',
        cell: (item) => {
          const isSub = Boolean(item.parentId);
          return (
            <div className="flex items-center gap-3">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <Icon name={IconName.CLOCK} size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm hover:text-amber-900 transition">
                    {item.title}
                  </span>
                  {isSub && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                      Sự kiện trực thuộc
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[45ch]">
                  {item.summary ||
                    (item.description
                      ? item.description.replace(/<[^>]*>/g, ' ')
                      : 'Chưa có mô tả tóm tắt')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        header: 'PHÂN LOẠI',
        cell: (item) => {
          const cat = eventCategoryLabel(categoryTerms, item) || 'Chung';
          return <Badge tone="blue">{cat}</Badge>;
        },
      },
      {
        header: 'NIÊN ĐẠI / THỜI GIAN',
        cell: (item) => {
          let dateText = item.eventDateNote;
          if (!dateText) {
            if (item.startYear && item.endYear) {
              dateText = `${formatHistoricalYear(item.startYear)} – ${formatHistoricalYear(item.endYear)}`;
            } else if (item.startYear) {
              dateText = `${formatHistoricalYear(item.startYear)}`;
            } else {
              dateText = 'Chưa xác định';
            }
          }
          return (
            <span className="text-slate-800 text-xs font-semibold font-mono">
              {dateText}
            </span>
          );
        },
      },
      {
        header: 'ĐỊA DANH / DI TÍCH',
        cell: (item) => {
          const locName =
            item.historicalLocation?.name ||
            (item.metadata?.rawLocation as string) ||
            'Toàn quốc / Chưa rõ';
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <span className="text-slate-400">📍</span>
              <span className="truncate max-w-[20ch]">{locName}</span>
            </div>
          );
        },
      },
      {
        header: 'TRẠNG THÁI',
        cell: (item) => {
          const status = item.status || ContentStatus.PUBLISHED;
          return (
            <Badge tone={STATUS_TONE_MAP[status]}>
              {STATUS_LABEL_MAP[status]}
            </Badge>
          );
        },
      },
      {
        header: 'CẬP NHẬT',
        cell: (item) => (
          <span className="text-slate-600 text-xs font-medium">
            {item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
              : 'Chưa cập nhật'}
          </span>
        ),
      },
    ],
    [categoryTerms],
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-500">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-amber-800 rounded-full animate-spin mr-2" />
        <span>Đang tải danh sách sự kiện lịch sử...</span>
      </div>
    );
  }

  const renderCreateButton = () => (
    <button
      type="button"
      className="primary-button !h-9 !px-4 !text-xs sm:!text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
      onClick={() => router.push(APP_ROUTES.EVENTS.CREATE)}
    >
      <Icon name={IconName.PLUS} size={15} />
      <span>+ Thêm sự kiện lịch sử</span>
    </button>
  );

  return (
    <>
      <DataTable<HistoricalEventItem>
        columns={columns}
        data={events}
        searchPlaceholder="Tìm kiếm tên sự kiện, niên đại, địa danh lịch sử..."
        customPrimaryAction={renderCreateButton()}
        onView={(item) => {
          router.push(APP_ROUTES.EVENTS.DETAIL(item.id));
        }}
        onEdit={(item) => {
          router.push(APP_ROUTES.EVENTS.DETAIL(item.id));
        }}
        onDelete={(item) => setDeletingEvent(item)}
        filters={[{ label: 'Phân loại' }, { label: 'Trạng thái' }]}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingEvent)}
        title="Xóa Sự kiện Lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingEvent?.title}" khỏi cơ sở dữ liệu? Toàn bộ các liên kết đồ thị quan hệ sự kiện sẽ bị hủy bỏ.`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteEvent}
        onClose={() => setDeletingEvent(null)}
      />
    </>
  );
}
