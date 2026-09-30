'use client';
import React, { Suspense } from 'react';
import { KnowledgeHub } from '@/features/knowledge/components/KnowledgeHub';

export default function KnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-gray-500">
          Đang tải Từ điển tri thức...
        </div>
      }
    >
      <KnowledgeHub />
    </Suspense>
  );
}
