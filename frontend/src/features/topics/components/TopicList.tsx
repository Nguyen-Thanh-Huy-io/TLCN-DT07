'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { TopicModal, TopicFormData } from './TopicModal';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus } from '@/constants/enums';
import { ColumnDef } from '@/types/table.types';
import { TopicItem } from '@/types/models/topic.type';
import { TopicApiService } from '@/services/entities/topic.service';
import { extractErrorMessage } from '@/services/api';

const DEFAULT_TOPICS: TopicItem[] = [
  {
    id: '1',
    name: 'Xây dựng hậu phương miền Bắc và Khởi nghĩa miền Nam (1954 - 1960)',
    description: 'Phong trào Đồng Khởi bùng nổ, mở ra bước ngoặt mới',
    isSequential: true,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    period: { id: 'p1', name: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)' },
    updatedAt: '2026-09-30',
  },
];

export function TopicList() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<TopicItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await TopicApiService.getTopics({ limit: 100 });
      if (res.items && res.items.length > 0) {
        setTopics(res.items);
      } else {
        setTopics(DEFAULT_TOPICS);
      }
    } catch (err) {
      console.error('Failed to fetch topics, using fallback:', err);
      setTopics(DEFAULT_TOPICS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleOpenCreate = () => {
    setEditingTopic(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TopicItem) => {
    setEditingTopic(item);
    setIsModalOpen(true);
  };

  const handleSaveTopic = async (formData: TopicFormData) => {
    try {
      if (editingTopic) {
        await TopicApiService.updateTopic(editingTopic.id, formData);
        await fetchTopics();
      } else {
        await TopicApiService.createTopic(formData);
        await fetchTopics();
      }
      setIsModalOpen(false);
      setEditingTopic(null);
    } catch (err: unknown) {
      console.error('Failed to save topic:', err);
      alert(extractErrorMessage(err, 'Không thể lưu Chủ đề lịch sử.'));
    }
  };

  const handleDeleteTopic = async () => {
    if (!deletingTopic) return;
    try {
      setIsDeleting(true);
      await TopicApiService.deleteTopic(deletingTopic.id);
      setTopics((prev) => prev.filter((t) => t.id !== deletingTopic.id));
      setDeletingTopic(null);
    } catch (err: unknown) {
      console.error('Failed to delete topic:', err);
      alert(extractErrorMessage(err, 'Không thể xóa chủ đề lịch sử.'));
    } finally {
      setIsDeleting(false);
    }
  };

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
    <>
      <DataTable<TopicItem>
        columns={columns}
        data={topics}
        searchPlaceholder="Tìm kiếm chủ đề lịch sử..."
        primaryButtonLabel="Thêm chủ đề"
        onPrimaryButtonClick={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingTopic(item)}
        filters={[{ label: 'Giai đoạn' }, { label: 'Trạng thái' }]}
      />

      <TopicModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTopic(null);
        }}
        onSave={handleSaveTopic}
        initialData={editingTopic}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingTopic)}
        title="Xóa Chủ đề lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingTopic?.name}"? Mọi bài học và sự kiện trực thuộc chủ đề này cũng sẽ bị xóa liên đới (Cascade).`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteTopic}
        onClose={() => setDeletingTopic(null)}
      />
    </>
  );
}
