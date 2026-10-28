'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus, EntityType } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { ColumnDef } from '@/types/table.types';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import { HistoricalEntityApiService } from '@/services/entities/historical-entity.service';
import { extractErrorMessage } from '@/services/api';

const ENTITY_TYPE_LABEL_MAP: Record<EntityType, string> = {
  [EntityType.PERSON]: 'Nhân vật',
  [EntityType.ORGANIZATION]: 'Tổ chức',
  [EntityType.DYNASTY]: 'Triều đại & Đế chế',
  [EntityType.MILITARY_FORCE]: 'Lực lượng quân sự',
  [EntityType.ARTIFACT]: 'Hiện vật & Bảo vật',
  [EntityType.LOCATION]: 'Địa danh & Di tích',
  [EntityType.OTHER]: 'Khác',
};


export function EntityList() {
  const router = useRouter();
  const [entities, setEntities] = useState<HistoricalEntityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingEntity, setDeletingEntity] =
    useState<HistoricalEntityItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    HistoricalEntityApiService.getEntities({ limit: 50 })
      .then((res) => {
        // Danh sách rỗng là trạng thái hợp lệ — không thay bằng dữ liệu mẫu giả.
        setEntities(res.items || []);
      })
      .catch((err) => {
        console.error('Failed to fetch historical entities:', err);
        setEntities([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteEntity = async () => {
    if (!deletingEntity) return;
    try {
      setIsDeleting(true);
      await HistoricalEntityApiService.deleteEntity(deletingEntity.id);
      setEntities((prev) => prev.filter((e) => e.id !== deletingEntity.id));
      setDeletingEntity(null);
    } catch (err) {
      console.error('Delete entity failed:', err);
      alert(extractErrorMessage(err, 'Không thể xóa Thực thể lịch sử.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<HistoricalEntityItem>[] = [
    {
      header: 'THỰC THỂ / NHÂN VẬT LỊCH SỬ',
      cell: (item) => (
        <ContentCell
          icon={IconName.USERS}
          title={item.name}
          sub={item.tagline || item.description || 'Chưa có mô tả tóm tắt'}
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
      header: 'NIÊN ĐẠI / HOẠT ĐỘNG',
      cell: (item) => {
        let label = 'Chưa rõ';
        if (item.birthDateLabel && item.deathDateLabel) {
          label = `${item.birthDateLabel} – ${item.deathDateLabel}`;
        } else if (item.birthYear && item.deathYear) {
          label = `${item.birthYear} – ${item.deathYear}`;
        } else if (item.birthDateLabel) {
          label = item.birthDateLabel;
        } else if (item.birthYear) {
          label = `Từ năm ${item.birthYear}`;
        }
        return <span className="text-slate-700 text-xs font-medium">{label}</span>;
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
        <span className="text-slate-700 text-xs font-medium">
          {item.updatedAt
            ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
            : 'Chưa cập nhật'}
        </span>
      ),
    },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải danh sách thực thể lịch sử...</div>;
  }

  return (
    <>
      <DataTable<HistoricalEntityItem>
        columns={columns}
        data={entities}
        searchPlaceholder="Tìm kiếm nhân vật, triều đại, hiện vật lịch sử..."
        primaryButtonLabel="Tạo mới thực thể"
        onPrimaryButtonClick={() => {
          router.push(APP_ROUTES.ENTITIES.CREATE);
        }}
        onView={(item) => {
          router.push(APP_ROUTES.ENTITIES.DETAIL(item.id));
        }}
        onEdit={(item) => {
          router.push(APP_ROUTES.ENTITIES.DETAIL(item.id));
        }}
        onDelete={(item) => setDeletingEntity(item)}
        filters={[{ label: 'Phân loại' }, { label: 'Trạng thái' }]}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingEntity)}
        title="Xóa Thực thể Lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingEntity?.name}" khỏi cơ sở dữ liệu? Toàn bộ các liên kết đồ thị quan hệ sẽ bị gỡ bỏ.`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteEntity}
        onClose={() => setDeletingEntity(null)}
      />
    </>
  );
}
