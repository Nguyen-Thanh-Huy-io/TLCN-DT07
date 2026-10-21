'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus, LocationType } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { ColumnDef } from '@/types/table.types';
import { HistoricalLocationItem } from '@/types/models/historical-location.type';
import api, { parsePaginatedResponse, extractErrorMessage } from '@/services/api';

const LOCATION_TYPE_LABEL_MAP: Record<LocationType, string> = {
  [LocationType.BATTLEFIELD]: 'Chiến trường',
  [LocationType.MONUMENT]: 'Di tích',
  [LocationType.ANCIENT_CAPITAL]: 'Cố đô / Kinh thành',
  [LocationType.CITADEL]: 'Thành lũy',
  [LocationType.TEMPLE]: 'Đền / Chùa',
  [LocationType.OTHER]: 'Khác',
};


export function LocationList() {
  const router = useRouter();
  const [locations, setLocations] = useState<HistoricalLocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingLocation, setDeletingLocation] =
    useState<HistoricalLocationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        const typeKey = (item.siteType || item.historicalSite?.siteType || item.type) as LocationType;
        return (
          <Badge tone="blue">
            {LOCATION_TYPE_LABEL_MAP[typeKey] || typeKey || 'Di tích'}
          </Badge>
        );
      },
    },
    {
      header: 'ĐỊA CHỈ',
      accessorKey: 'address',
      cell: (item) => item.address || '—',
    },
    {
      header: 'TỌA ĐỘ',
      cell: (item) =>
        item.latitude && item.longitude
          ? `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`
          : 'Chưa cập nhật',
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
      cell: (item) =>
        item.updatedAt
          ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
          : 'Chưa cập nhật',
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
        data={locations}
        searchPlaceholder="Tìm kiếm địa danh, di tích lịch sử..."
        primaryButtonLabel="Thêm địa danh"
        onPrimaryButtonClick={() => router.push(APP_ROUTES.LOCATIONS.CREATE)}
        onView={(item) => router.push(APP_ROUTES.LOCATIONS.DETAIL(item.id))}
        onEdit={(item) => router.push(APP_ROUTES.LOCATIONS.DETAIL(item.id))}
        onDelete={(item) => setDeletingLocation(item)}
        filters={[{ label: 'Phân loại' }, { label: 'Trạng thái' }]}
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
