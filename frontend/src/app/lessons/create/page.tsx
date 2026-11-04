'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const LessonEditor = dynamic(
  () =>
    import('@/features/lessons/components/LessonEditor').then(
      (mod) => mod.LessonEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Đang chuẩn bị trình soạn thảo bài học Lịch sử...
        </p>
        <span className="text-xs text-slate-400 mt-1">
          Hệ thống cấu trúc khối nội dung chuẩn HISGO
        </span>
      </div>
    ),
  }
);

export default function LessonCreatePage() {
  return <LessonEditor />;
}
