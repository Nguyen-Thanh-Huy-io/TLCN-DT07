'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus, EntityType } from '@/constants/enums';
import { ColumnDef } from '@/types/table.types';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import api from '@/services/api';

const ENTITY_TYPE_LABEL_MAP: Record<EntityType, string> = {
  [EntityType.PERSON]: 'Nhân vật',
  [EntityType.ORGANIZATION]: 'Tổ chức',
  [EntityType.DYNASTY]: 'Triều đại',
  [EntityType.MILITARY_FORCE]: 'Lực lượng quân sự',
  [EntityType.OTHER]: 'Khác',
};

const DEFAULT_ENTITIES: HistoricalEntityItem[] = [
  {
    id: 'ent-1',
    name: 'Đại tướng Võ Nguyên Giáp',
    type: EntityType.PERSON,
    biography: 'Tổng tư lệnh tối cao Quân đội Nhân dân Việt Nam trong chiến dịch Điện Biên Phủ',
    birthYear: 1911,
    deathYear: 2013,
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-25',
  },
  {
    id: 'ent-2',
    name: 'Quân đội Nhân dân Việt Nam',
    type: EntityType.MILITARY_FORCE,
    biography: 'Lực lượng vũ trang nhân dân Việt Nam, thành lập ngày 22/12/1944',
    birthYear: 1944,
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-24',
  },
  {
    id: 'ent-3',
    name: 'Nhà Hậu Lê',
    type: EntityType.DYNASTY,
    biography: 'Triều đại phong kiến trị vì lâu nhất trong lịch sử Việt Nam',
    birthYear: 1428,
    deathYear: 1789,
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-20',
  },
];

export function EntityList() {
  const [entities, setEntities] = useState<HistoricalEntityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/historical-entities')
      .then((res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        setEntities(Array.isArray(data) && data.length > 0 ? data : DEFAULT_ENTITIES);
      })
      .catch((err) => {
        console.error('Failed to fetch historical entities, using fallback:', err);
        setEntities(DEFAULT_ENTITIES);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnDef<HistoricalEntityItem>[] = [
    {
      header: 'NHÂN VẬT / TỔ CHỨC',
      cell: (item) => (
        <ContentCell
          icon={IconName.USERS}
          title={item.name}
          sub={item.biography || 'Chưa có tiểu sử'}
        />
      ),
    },
    {
      header: 'PHÂN LOẠI',
      cell: (item) => (
        <Badge tone="blue">
          {ENTITY_TYPE_LABEL_MAP[item.type] || item.type}
        </Badge>
      ),
    },
    {
      header: 'NĂM SINH - MẤT / HOẠT ĐỘNG',
      cell: (item) => {
        if (item.birthYear && item.deathYear) {
          return `${item.birthYear} – ${item.deathYear}`;
        }
        if (item.birthYear) {
          return `Từ năm ${item.birthYear}`;
        }
        return 'Chưa rõ';
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
      cell: (item) =>
        item.updatedAt
          ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
          : 'Chưa cập nhật',
    },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải danh sách nhân vật...</div>;
  }

  return (
    <DataTable<HistoricalEntityItem>
      columns={columns}
      data={entities}
      searchPlaceholder="Tìm kiếm nhân vật, triều đại lịch sử..."
      primaryButtonLabel="Thêm nhân vật"
      onPrimaryButtonClick={() => alert('Thêm nhân vật mới')}
      filters={[{ label: 'Phân loại' }, { label: 'Trạng thái' }]}
    />
  );
}
