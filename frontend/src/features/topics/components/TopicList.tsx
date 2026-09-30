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
import { TopicItem } from '@/types/models/topic.type';
import api from '@/services/api';

const DEFAULT_TOPICS: TopicItem[] = [
  {
    id: '1',
    name: 'Kháng chiến chống quân Nguyên - Mông',
    description: 'Ba lần chiến thắng oanh liệt của quân dân nhà Trần',
    isSequential: true,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    period: { id: 'p1', name: 'Thời kỳ Lý - Trần - Hồ' },
    updatedAt: '2026-09-20',
  },
  {
    id: '2',
    name: 'Khởi nghĩa Lam Sơn',
    description: 'Lê Lợi và nghĩa quân đánh đuổi giặc Minh',
    isSequential: true,
    displayOrder: 2,
    status: ContentStatus.PUBLISHED,
    period: { id: 'p2', name: 'Thời Hậu Lê' },
    updatedAt: '2026-09-18',
  },
  {
    id: '3',
    name: 'Phong trào Tây Sơn',
    description: 'Quang Trung đại phá quân Thanh',
    isSequential: false,
    displayOrder: 3,
    status: ContentStatus.PUBLISHED,
    period: { id: 'p3', name: 'Nhà Tây Sơn' },
    updatedAt: '2026-09-15',
  },
];

export function TopicList() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/topics')
      .then((res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        setTopics(Array.isArray(data) && data.length > 0 ? data : DEFAULT_TOPICS);
      })
      .catch((err) => {
        console.error('Failed to fetch topics, using fallback:', err);
        setTopics(DEFAULT_TOPICS);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnDef<TopicItem>[] = [
    {
      header: 'CHỦ ĐỀ',
      cell: (item) => (
        <ContentCell
          icon={IconName.FOLDER}
          title={item.name}
          sub={item.description || 'Chưa có mô tả'}
        />
      ),
    },
    {
      header: 'GIAI ĐOẠN',
      cell: (item) => item.period?.name || 'Chưa có giai đoạn',
    },
    {
      header: 'TUẦN TỰ',
      cell: (item) => (item.isSequential ? 'Có' : 'Không'),
    },
    {
      header: 'THỨ TỰ',
      cell: (item) => String(item.displayOrder ?? 0).padStart(2, '0'),
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
    <DataTable<TopicItem>
      columns={columns}
      data={topics}
      searchPlaceholder="Tìm kiếm chủ đề lịch sử..."
      primaryButtonLabel="Thêm chủ đề"
      onPrimaryButtonClick={() => router.push(APP_ROUTES.TOPICS.CREATE)}
      filters={[{ label: 'Giai đoạn' }, { label: 'Trạng thái' }]}
    />
  );
}
