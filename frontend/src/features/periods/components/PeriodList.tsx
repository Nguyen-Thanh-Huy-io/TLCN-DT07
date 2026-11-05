'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus } from '@/constants/enums';
import { ColumnDef } from '@/types/table.types';
import { PeriodItem } from '@/types/models/period.type';
import { PeriodApiService } from '@/services/entities/period.service';
import { extractErrorMessage } from '@/services/api';
import { formatHistoricalTimeSpan } from '@/utils/history-year.utils';
import { usePublicTaxonomyTerms } from '@/features/taxonomy/usePublicTaxonomy';

export function PeriodList() {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPeriod, setDeletingPeriod] = useState<PeriodItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trạng thái bộ lọc (Đa chọn Khu vực)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await PeriodApiService.getPeriods({ limit: 100 });
      // Danh sách rỗng là trạng thái hợp lệ — không thay bằng dữ liệu mẫu giả.
      setPeriods(res.items || []);
    } catch (err) {
      console.error('Failed to fetch periods:', err);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleDeletePeriod = async () => {
    if (!deletingPeriod) return;
    try {
      setIsDeleting(true);
      await PeriodApiService.deletePeriod(deletingPeriod.id);
      setPeriods((prev) => prev.filter((p) => p.id !== deletingPeriod.id));
      setDeletingPeriod(null);
    } catch (err: unknown) {
      console.error('Failed to delete period:', err);
      alert(extractErrorMessage(err, 'Không thể xóa giai đoạn lịch sử.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Danh mục Khu vực tải động 100% từ Taxonomy, tuyệt đối không hardcode
  const regionTerms = usePublicTaxonomyTerms('REGION');

  const regionOptions = useMemo(() => {
    return [
      { label: 'Tất cả khu vực', value: 'ALL' },
      ...regionTerms.map((term) => ({
        label: term.label,
        value: term.label,
      })),
    ];
  }, [regionTerms]);

  // Tùy chọn cho bộ lọc Trạng thái từ từ điển chuẩn hóa tập trung
  const statusOptions = useMemo(
    () => [
      { label: 'Tất cả trạng thái', value: 'ALL' },
      ...[
        ContentStatus.PUBLISHED,
        ContentStatus.DRAFT,
        ContentStatus.PENDING_REVIEW,
        ContentStatus.ARCHIVED,
      ].map((st) => ({
        label: STATUS_LABEL_MAP[st] || st,
        value: st,
      })),
    ],
    []
  );

  // Danh sách dữ liệu sau khi áp dụng bộ lọc (Multi-Select cho Khu vực)
  const displayedPeriods = useMemo(() => {
    return periods.filter((item) => {
      // Lọc theo Khu vực đối soát qua nhãn hoặc aliases của taxonomy term
      if (selectedRegions.length > 0) {
        const itemRegion = (item.region || '').trim().toLowerCase();
        const matchesAny = selectedRegions.some((reg) => {
          const selectedTerm = regionTerms.find((t) => t.label === reg);
          return (
            itemRegion === reg.toLowerCase() ||
            Boolean(selectedTerm?.aliases?.some((a) => a.toLowerCase() === itemRegion))
          );
        });
        if (!matchesAny) {
          return false;
        }
      }
      // Lọc theo Trạng thái
      if (selectedStatus !== 'ALL') {
        const itemStatus = item.status || ContentStatus.PUBLISHED;
        if (itemStatus !== selectedStatus) {
          return false;
        }
      }
      return true;
    });
  }, [periods, selectedRegions, selectedStatus, regionTerms]);

  const columns: ColumnDef<PeriodItem>[] = [
    {
      header: 'Thời kỳ / Giai đoạn',
      cell: (item) => (
        <div>
          <ContentCell
            icon={IconName.CLOCK}
            title={item.name}
            sub={item.description || 'Chưa có mô tả'}
          />
          {item.parent && (
            <div className="mt-1 flex items-center gap-1.5 pl-9 text-[11px] text-amber-700 font-medium">
              <span className="text-slate-400">↳ Thuộc:</span>
              <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {item.parent.name}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Niên đại',
      cell: (item) => (
        <span className="text-xs font-medium text-slate-700">
          {item.timeLabel || formatHistoricalTimeSpan(item.startYear, item.endYear)}
        </span>
      ),
    },
    {
      header: 'Chủ đề',
      cell: (item) => {
        const topicCount = item._count?.topics || item.topics?.length || 0;
        return (
          <Badge tone={topicCount > 0 ? 'blue' : 'neutral'}>
            {topicCount} chủ đề
          </Badge>
        );
      },
    },
    {
      header: 'Khu vực',
      accessorKey: 'region',
      cell: (item) => item.region || 'Việt Nam',
    },
    {
      header: 'Thứ tự',
      cell: (item) =>
        String(item.displayOrder ?? item.orderIndex ?? 0).padStart(2, '0'),
    },
    {
      header: 'Trạng thái',
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
      header: 'Cập nhật',
      cell: (item) =>
        item.updatedAt
          ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
          : 'Chưa cập nhật',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-500">
        Đang tải danh sách thời kỳ lịch sử...
      </div>
    );
  }

  return (
    <>
      <DataTable<PeriodItem>
        columns={columns}
        data={displayedPeriods}
        searchPlaceholder="Tìm kiếm thời kỳ, giai đoạn lịch sử..."
        primaryButtonLabel="Tạo thời kỳ"
        onPrimaryButtonClick={() => router.push(APP_ROUTES.PERIODS.CREATE)}
        onView={(item) => router.push(APP_ROUTES.PERIODS.DETAIL(item.id))}
        onEdit={(item) => router.push(APP_ROUTES.PERIODS.DETAIL(item.id))}
        onDelete={(item) => setDeletingPeriod(item)}
        filters={[
          {
            label: 'Khu vực',
            options: regionOptions,
            selectedValues: selectedRegions,
            isMultiSelect: true,
            onSelectMultiple: setSelectedRegions,
          },
          {
            label: 'Trạng thái',
            options: statusOptions,
            selectedValue: selectedStatus,
            onSelect: setSelectedStatus,
          },
        ]}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingPeriod)}
        title="Xóa Thời kỳ Lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingPeriod?.name}"? Mọi chủ đề, bài học và sự kiện trực thuộc giai đoạn này cũng sẽ bị xóa liên đới (Cascade).`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeletePeriod}
        onClose={() => setDeletingPeriod(null)}
      />
    </>
  );
}
