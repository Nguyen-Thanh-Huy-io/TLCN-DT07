'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
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
import api from '@/services/api';

const DEFAULT_LESSONS: LessonItem[] = [
  {
    id: '1',
    title: 'Chiến dịch Điện Biên Phủ 1954',
    difficulty: DifficultyLevel.MEDIUM,
    xpReward: 50,
    estimatedReadMinutes: 15,
    status: ContentStatus.PUBLISHED,
    topic: { id: 't1', name: 'Kháng chiến chống Pháp' },
    creator: { id: 'u1', username: 'Nguyễn Văn A' },
    updatedAt: '2026-09-22',
  },
  {
    id: '2',
    title: 'Chiến thắng Bạch Đằng năm 938',
    difficulty: DifficultyLevel.EASY,
    xpReward: 30,
    estimatedReadMinutes: 10,
    status: ContentStatus.PUBLISHED,
    topic: { id: 't2', name: 'Thời kỳ Ngô Quyền' },
    creator: { id: 'u2', username: 'Trần Thị B' },
    updatedAt: '2026-09-21',
  },
  {
    id: '3',
    title: 'Cách mạng tháng Tám 1945',
    difficulty: DifficultyLevel.HARD,
    xpReward: 80,
    estimatedReadMinutes: 25,
    status: ContentStatus.PENDING_REVIEW,
    topic: { id: 't3', name: 'Việt Nam 1930–1945' },
    creator: { id: 'u3', username: 'Lê Hoàng' },
    updatedAt: '2026-09-20',
  },
];

export function LessonList() {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/lessons')
      .then((res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        setLessons(Array.isArray(data) && data.length > 0 ? data : DEFAULT_LESSONS);
      })
      .catch((err) => {
        console.error('Failed to fetch lessons, using fallback:', err);
        setLessons(DEFAULT_LESSONS);
      })
      .finally(() => setLoading(false));
  }, []);

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
      cell: (item) => String(item.xpReward ?? 0),
    },
    {
      header: 'THỜI LƯỢNG',
      cell: (item) => `${item.estimatedReadMinutes ?? 0} phút`,
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
      cell: (item) => item.creator?.fullName || item.creator?.username || 'N/A',
    },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
  }

  return (
    <DataTable<LessonItem>
      columns={columns}
      data={lessons}
      searchPlaceholder="Tìm kiếm bài học lịch sử..."
      primaryButtonLabel="Tạo bài học"
      onPrimaryButtonClick={() => router.push(APP_ROUTES.LESSONS.CREATE)}
      filters={[{ label: 'Chủ đề' }, { label: 'Độ khó' }, { label: 'Trạng thái' }]}
    />
  );
}
