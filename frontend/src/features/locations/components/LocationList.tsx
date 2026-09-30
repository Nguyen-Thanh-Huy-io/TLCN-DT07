'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus, LocationType } from '@/constants/enums';
import { ColumnDef } from '@/types/table.types';
import { HistoricalLocationItem } from '@/types/models/historical-location.type';
import api from '@/services/api';

const LOCATION_TYPE_LABEL_MAP: Record<LocationType, string> = {
  [LocationType.BATTLEFIELD]: 'Chiến trường',
  [LocationType.MONUMENT]: 'Di tích',
  [LocationType.ANCIENT_CAPITAL]: 'Cố đô / Kinh thành',
  [LocationType.CITADEL]: 'Thành lũy',
  [LocationType.TEMPLE]: 'Đền / Chùa',
  [LocationType.OTHER]: 'Khác',
};

const DEFAULT_LOCATIONS: HistoricalLocationItem[] = [
  {
    id: 'loc-1',
    name: 'Di tích Chiến trường Điện Biên Phủ',
    type: LocationType.BATTLEFIELD,
    address: 'TP. Điện Biên Phủ, tỉnh Điện Biên',
    latitude: 21.3857,
    longitude: 103.0188,
    historicalSignificance: 'Nơi diễn ra chiến dịch Điện Biên Phủ năm 1954',
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-25',
  },
  {
    id: 'loc-2',
    name: 'Hoàng thành Thăng Long',
    type: LocationType.ANCIENT_CAPITAL,
    address: '19C Hoàng Diệu, Ba Đình, Hà Nội',
    latitude: 21.0347,
    longitude: 105.8407,
    historicalSignificance: 'Trung tâm quyền lực chính trị qua nhiều triều đại',
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-24',
  },
  {
    id: 'loc-3',
    name: 'Cố đô Hoa Lư',
    type: LocationType.ANCIENT_CAPITAL,
    address: 'Xã Trường Yên, Hoa Lư, Ninh Bình',
    latitude: 20.2858,
    longitude: 105.9083,
    historicalSignificance: 'Kinh đô đầu tiên của nhà nước phong kiến độc lập Việt Nam',
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-20',
  },
];

export function LocationList() {
  const [locations, setLocations] = useState<HistoricalLocationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/historical-locations')
      .then((res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        setLocations(Array.isArray(data) && data.length > 0 ? data : DEFAULT_LOCATIONS);
      })
      .catch((err) => {
        console.error('Failed to fetch historical locations, using fallback:', err);
        setLocations(DEFAULT_LOCATIONS);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnDef<HistoricalLocationItem>[] = [
    {
      header: 'ĐỊA DANH / DI TÍCH',
      cell: (item) => (
        <ContentCell
          icon={IconName.CALENDAR}
          title={item.name}
          sub={item.historicalSignificance || item.address || 'Chưa có thông tin'}
        />
      ),
    },
    {
      header: 'PHÂN LOẠI',
      cell: (item) => (
        <Badge tone="blue">
          {LOCATION_TYPE_LABEL_MAP[item.type] || item.type}
        </Badge>
      ),
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
          ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
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
    return <div style={{ padding: 20 }}>Đang tải danh sách địa danh...</div>;
  }

  return (
    <DataTable<HistoricalLocationItem>
      columns={columns}
      data={locations}
      searchPlaceholder="Tìm kiếm địa danh, di tích lịch sử..."
      primaryButtonLabel="Thêm địa danh"
      onPrimaryButtonClick={() => alert('Thêm địa danh mới')}
      filters={[{ label: 'Phân loại' }, { label: 'Trạng thái' }]}
    />
  );
}
