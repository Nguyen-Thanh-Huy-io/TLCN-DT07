'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus } from '@/constants/enums';
import { ColumnDef } from '@/types/table.types';
import { PeriodItem } from '@/types/models/period.type';
import api from '@/services/api';

const DEFAULT_PERIODS: PeriodItem[] = [
  {
    id: '1',
    name: 'Thời kỳ Bắc thuộc',
    description: 'Từ năm 179 TCN đến năm 938',
    region: 'Việt Nam',
    startYear: -179,
    endYear: 938,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-20',
  },
  {
    id: '2',
    name: 'Thời kỳ Ngô - Đinh - Tiền Lê',
    description: 'Thế kỷ X - Thời kỳ đầu độc lập',
    region: 'Việt Nam',
    startYear: 939,
    endYear: 1009,
    displayOrder: 2,
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-18',
  },
  {
    id: '3',
    name: 'Thời kỳ Lý - Trần - Hồ',
    description: 'Thế kỷ XI - đầu thế kỷ XV',
    region: 'Việt Nam',
    startYear: 1009,
    endYear: 1407,
    displayOrder: 3,
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-15',
  },
];

export function PeriodList() {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/periods')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setPeriods(data.length > 0 ? data : DEFAULT_PERIODS);
      })
      .catch((err) => {
        console.error('Failed to fetch periods, using fallback:', err);
        setPeriods(DEFAULT_PERIODS);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnDef<PeriodItem>[] = [
    {
      header: 'GIAI ĐOẠN',
      cell: (item) => (
        <ContentCell
          icon={IconName.CLOCK}
          title={item.name}
          sub={item.description || 'Chưa có mô tả'}
        />
      ),
    },
    {
      header: 'KHU VỰC',
      accessorKey: 'region',
      cell: (item) => item.region || 'Việt Nam',
    },
    {
      header: 'THỜI GIAN',
      cell: (item) =>
        item.startYear !== undefined && item.endYear !== undefined
          ? `${item.startYear} – ${item.endYear}`
          : 'Không rõ',
    },
    {
      header: 'THỨ TỰ',
      cell: (item) =>
        String(item.displayOrder ?? item.orderIndex ?? 0).padStart(2, '0'),
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
    return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
  }

  return (
    <DataTable<PeriodItem>
      columns={columns}
      data={periods}
      searchPlaceholder="Tìm kiếm giai đoạn lịch sử..."
      primaryButtonLabel="Thêm giai đoạn"
      onPrimaryButtonClick={() => router.push(APP_ROUTES.PERIODS.CREATE)}
      filters={[{ label: 'Khu vực' }, { label: 'Trạng thái' }]}
    />
  );
}
