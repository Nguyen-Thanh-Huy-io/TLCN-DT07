import React, { Suspense } from 'react';
import { LessonEditor } from '@/features/lessons/components/LessonEditor';

export default function LessonCreatePage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 30, textAlign: 'center', color: '#6b7280' }}>
          Đang tải trình soạn thảo bài học...
        </div>
      }
    >
      <LessonEditor />
    </Suspense>
  );
}

