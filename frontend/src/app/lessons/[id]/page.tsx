import React, { Suspense } from 'react';
import { LessonEditor } from '@/features/lessons/components/LessonEditor';

export const metadata = {
  title: 'Chỉnh sửa Bài học Lịch sử | HISGO CMS',
};

interface LessonEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonEditPage({ params }: LessonEditPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div style={{ padding: 30, textAlign: 'center', color: '#6b7280' }}>
          Đang tải bài học lịch sử...
        </div>
      }
    >
      <LessonEditor lessonId={id} />
    </Suspense>
  );
}
