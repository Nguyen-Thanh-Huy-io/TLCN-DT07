import React, { Suspense } from 'react';
import { PublicCurriculumView } from '@/features/public-curriculum/components/PublicCurriculumView';

export default async function ChuongTrinhHocPage({
  searchParams,
}: {
  searchParams: Promise<{ pathId?: string }>;
}) {
  const resolvedParams = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f0e4] p-12 text-center font-serif text-[#501013]">
          Đang tải Chương trình học...
        </div>
      }
    >
      <PublicCurriculumView initialPathId={resolvedParams?.pathId || null} />
    </Suspense>
  );
}
