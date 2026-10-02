'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { PeriodModal, PeriodFormData } from './PeriodModal';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus } from '@/constants/enums';
import { ColumnDef } from '@/types/table.types';
import { PeriodItem } from '@/types/models/period.type';
import { PeriodApiService } from '@/services/entities/period.service';
import { extractErrorMessage } from '@/services/api';

const DEFAULT_PERIODS: PeriodItem[] = [
  {
    id: '1',
    name: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)',
    description: 'Từ năm 1954 đến Đại thắng mùa Xuân 1975',
    region: 'Toàn quốc',
    startYear: 1954,
    endYear: 1975,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    updatedAt: '2026-09-30',
  },
];

export function PeriodList() {
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodItem | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<PeriodItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await PeriodApiService.getPeriods({ limit: 100 });
      if (res.items && res.items.length > 0) {
        setPeriods(res.items);
      } else {
        setPeriods(DEFAULT_PERIODS);
      }
    } catch (err) {
      console.error('Failed to fetch periods, using fallback:', err);
      setPeriods(DEFAULT_PERIODS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleOpenCreate = () => {
    setEditingPeriod(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PeriodItem) => {
    setEditingPeriod(item);
    setIsModalOpen(true);
  };

  const handleSavePeriod = async (formData: PeriodFormData) => {
    try {
      if (editingPeriod) {
        await PeriodApiService.updatePeriod(editingPeriod.id, formData);
        setPeriods((prev) =>
          prev.map((p) => (p.id === editingPeriod.id ? { ...p, ...formData, updatedAt: new Date().toISOString() } : p))
        );
      } else {
        const newPeriod = await PeriodApiService.createPeriod(formData);
        setPeriods((prev) => [newPeriod, ...prev]);
      }
      setIsModalOpen(false);
      setEditingPeriod(null);
    } catch (err: unknown) {
      console.error('Failed to save period:', err);
      alert(extractErrorMessage(err, 'Không thể lưu Giai đoạn lịch sử.'));
    }
  };

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
        item.startYear !== undefined
          ? item.endYear
            ? `${item.startYear} – ${item.endYear}`
            : `Từ ${item.startYear}`
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
    <>
      <DataTable<PeriodItem>
        columns={columns}
        data={periods}
        searchPlaceholder="Tìm kiếm giai đoạn lịch sử..."
        primaryButtonLabel="Thêm giai đoạn"
        onPrimaryButtonClick={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingPeriod(item)}
        filters={[{ label: 'Khu vực' }, { label: 'Trạng thái' }]}
      />

      <PeriodModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPeriod(null);
        }}
        onSave={handleSavePeriod}
        initialData={editingPeriod}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingPeriod)}
        title="Xóa Giai đoạn lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingPeriod?.name}"? Mọi chủ đề, bài học và sự kiện trực thuộc giai đoạn này cũng sẽ bị xóa liên đới (Cascade).`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeletePeriod}
        onClose={() => setDeletingPeriod(null)}
      />
    </>
  );
}
