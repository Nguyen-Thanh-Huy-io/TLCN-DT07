'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import {
  STATUS_LABEL_MAP,
  STATUS_TONE_MAP,
  DIFFICULTY_LABEL_MAP,
  DIFFICULTY_TONE_MAP,
} from '@/constants/ui-theme';
import { ContentStatus, DifficultyLevel } from '@/constants/enums';
import { ColumnDef } from '@/types/table.types';
import { LessonItem } from '@/types/models/lesson.type';
import { LessonApiService } from '@/services/entities/lesson.service';
import { extractErrorMessage } from '@/services/api';

const DEFAULT_LESSONS: LessonItem[] = [
  {
    id: '1',
    title: 'Phong trào Đồng Khởi (1959 - 1960) - Bước ngoặt cách mạng miền Nam',
    difficulty: DifficultyLevel.MEDIUM,
    xpReward: 50,
    estimatedReadMinutes: 15,
    status: ContentStatus.PUBLISHED,
    topic: { id: 't1', name: 'Xây dựng hậu phương miền Bắc và Khởi nghĩa miền Nam (1954 - 1960)' },
    creator: { id: 'u1', username: 'admin_hisgo' },
    updatedAt: '2026-09-30',
  },
];

export function LessonList() {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingLesson, setDeletingLesson] = useState<LessonItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await LessonApiService.getLessons({ limit: 100 });
      if (res.items && res.items.length > 0) {
        setLessons(res.items);
      } else {
        setLessons(DEFAULT_LESSONS);
      }
    } catch (err) {
      console.error('Failed to fetch lessons, using fallback:', err);
      setLessons(DEFAULT_LESSONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;
    try {
      setIsDeleting(true);
      await LessonApiService.deleteLesson(deletingLesson.id);
      setLessons((prev) => prev.filter((l) => l.id !== deletingLesson.id));
      setDeletingLesson(null);
    } catch (err: unknown) {
      console.error('Failed to delete lesson:', err);
      alert(extractErrorMessage(err, 'Không thể xóa bài học.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<LessonItem>[] = [
    {
      header: 'BÀI HỌC',
      cell: (item) => (
        <ContentCell
          icon={IconName.BOOK}
          title={item.title}
          sub={
            item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
              : 'Chưa cập nhật'
          }
        />
      ),
    },
    {
      header: 'CHỦ ĐỀ',
      cell: (item) => item.topic?.name || 'Chưa có chủ đề',
    },
    {
      header: 'ĐỘ KHÓ',
      cell: (item) => {
        const diff = item.difficulty || DifficultyLevel.MEDIUM;
        return (
          <Badge tone={DIFFICULTY_TONE_MAP[diff]}>
            {DIFFICULTY_LABEL_MAP[diff]}
          </Badge>
        );
      },
    },
    {
      header: 'ĐIỂM XP',
      cell: (item) => String(item.xpReward ?? 50),
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => {
        const status = item.status || ContentStatus.DRAFT;
        return (
          <Badge tone={STATUS_TONE_MAP[status]}>
            {STATUS_LABEL_MAP[status]}
          </Badge>
        );
      },
    },
    {
      header: 'NGƯỜI TẠO',
      cell: (item) => item.creator?.fullName || item.creator?.username || 'Admin',
    },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
  }

  return (
    <>
      <DataTable<LessonItem>
        columns={columns}
        data={lessons}
        searchPlaceholder="Tìm kiếm bài học lịch sử..."
        primaryButtonLabel="Tạo bài học"
        onPrimaryButtonClick={() => router.push(APP_ROUTES.LESSONS.CREATE)}
        onEdit={(item) => router.push(`${APP_ROUTES.LESSONS.CREATE}?id=${item.id}`)}
        onDelete={(item) => setDeletingLesson(item)}
        filters={[{ label: 'Chủ đề' }, { label: 'Độ khó' }, { label: 'Trạng thái' }]}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingLesson)}
        title="Xóa Bài học lịch sử"
        message={`Bạn có chắc chắn muốn xóa bài học "${deletingLesson?.title}"? Dữ liệu câu hỏi và liên kết thẻ của bài học này cũng sẽ bị xóa vĩnh viễn.`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteLesson}
        onClose={() => setDeletingLesson(null)}
      />
    </>
  );
}
