'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus } from '@/constants/enums';
import { usePublicTaxonomyTerms } from '@/features/taxonomy/usePublicTaxonomy';
import { APP_ROUTES } from '@/constants/routes';
import { ColumnDef } from '@/types/table.types';
import { HistoricalLocationItem } from '@/types/models/historical-location.type';
import api, { parsePaginatedResponse, extractErrorMessage } from '@/services/api';

export function LocationList() {
  const router = useRouter();
  const [locations, setLocations] = useState<HistoricalLocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [deletingLocation, setDeletingLocation] =
    useState<HistoricalLocationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Danh mục Loại địa điểm / Di tích tải động từ Taxonomy (SITE_TYPE)
  const siteTypeTerms = usePublicTaxonomyTerms('SITE_TYPE');

  useEffect(() => {
    api
      .get('/historical-entities?type=LOCATION&limit=100')
      .then((res) => {
        const { items } = parsePaginatedResponse<HistoricalLocationItem>(res.data);
        // Danh sách rỗng là trạng thái hợp lệ — không thay bằng dữ liệu mẫu giả.
        setLocations(items);
      })
      .catch((err) => {
        console.error('Failed to fetch historical locations:', err);
        setLocations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return;
    try {
      setIsDeleting(true);
      await api.delete(`/historical-entities/${deletingLocation.id}`);
      setLocations((prev) => prev.filter((l) => l.id !== deletingLocation.id));
      setDeletingLocation(null);
    } catch (err) {
      console.error('Delete location failed:', err);
      alert(extractErrorMessage(err, 'Không thể xóa Địa danh lịch sử.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const siteTypeOptions = useMemo(
    () => [
      { label: 'Tất cả phân loại', value: 'ALL' },
      ...siteTypeTerms.map((t) => ({ label: t.label, value: t.code })),
    ],
    [siteTypeTerms]
  );

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

  const displayedLocations = useMemo(() => {
    return locations.filter((item) => {
      // Lọc theo loại di tích đối soát theo Taxonomy TERM (Multi-Select)
      if (selectedTypes.length > 0) {
        const itemType = item.siteTypeCode || item.siteType || item.historicalSite?.siteType;
        const matchesAny = selectedTypes.some((typeCode) => {
          const selectedTerm = siteTypeTerms.find((t) => t.code === typeCode);
          return (
            itemType === typeCode ||
            (selectedTerm &&
              (itemType === selectedTerm.label ||
                selectedTerm.aliases?.includes(itemType || '')))
          );
        });
        if (!matchesAny) return false;
      }
      // Lọc theo trạng thái
      if (selectedStatus !== 'ALL') {
        const itemStatus = item.status || ContentStatus.PUBLISHED;
        if (itemStatus !== selectedStatus) return false;
      }
      return true;
    });
  }, [locations, selectedTypes, selectedStatus, siteTypeTerms]);

  const columns: ColumnDef<HistoricalLocationItem>[] = [
    {
      header: 'ĐỊA DANH / DI TÍCH',
      cell: (item) => (
        <ContentCell
          icon={IconName.TAG}
          title={item.name}
          sub={item.historicalSignificance || item.address || 'Chưa có thông tin'}
        />
      ),
    },
    {
      header: 'PHÂN LOẠI',
      cell: (item) => {
        const term = siteTypeTerms.find(
          (t) =>
            t.code === item.siteTypeCode ||
            t.code === item.siteType ||
            t.label === item.siteType
        );
        const label = term?.label || item.siteType || 'Di tích';
        return <Badge tone="blue">{label}</Badge>;
      },
    },
    {
      header: 'ĐỊA CHỈ',
      accessorKey: 'address',
      cell: (item) => (
        <span className="text-slate-700 text-xs sm:text-sm font-normal">
          {item.address || '—'}
        </span>
      ),
    },
    {
      header: 'TỌA ĐỘ',
      cell: (item) => (
        <span
          className={
            item.latitude && item.longitude
              ? 'text-slate-700 font-mono text-xs font-medium'
              : 'text-slate-600 italic text-xs'
          }
        >
          {item.latitude && item.longitude
            ? `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`
            : 'Chưa cập nhật'}
        </span>
      ),
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
        <span className="text-slate-700 text-xs font-medium">
          {item.updatedAt
            ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
            : 'Chưa cập nhật'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-500">
        Đang tải danh sách địa danh & di tích...
      </div>
    );
  }

  return (
    <>
      <DataTable<HistoricalLocationItem>
        columns={columns}
        data={displayedLocations}
        searchPlaceholder="Tìm kiếm địa danh, di tích lịch sử..."
        primaryButtonLabel="Thêm địa danh"
        onPrimaryButtonClick={() => router.push(APP_ROUTES.LOCATIONS.CREATE)}
        onView={(item) => router.push(APP_ROUTES.LOCATIONS.DETAIL(item.id))}
        onEdit={(item) => router.push(APP_ROUTES.LOCATIONS.DETAIL(item.id))}
        onDelete={(item) => setDeletingLocation(item)}
        filters={[
          {
            label: 'Phân loại',
            options: siteTypeOptions,
            selectedValues: selectedTypes,
            isMultiSelect: true,
            onSelectMultiple: setSelectedTypes,
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
        isOpen={Boolean(deletingLocation)}
        title="Xóa Địa danh / Di tích lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingLocation?.name}" khỏi cơ sở dữ liệu?`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteLocation}
        onClose={() => setDeletingLocation(null)}
      />
    </>
  );
}
