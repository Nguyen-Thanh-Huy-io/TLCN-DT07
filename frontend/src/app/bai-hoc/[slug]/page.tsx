import React, { Suspense } from 'react';
import { PublicLessonReaderView } from '@/features/public-curriculum/components/PublicLessonReaderView';

export default async function BaiHocDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pathId?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f0e4] p-12 text-center font-serif text-[#501013]">
          Đang tải Bài học...
        </div>
      }
    >
      <PublicLessonReaderView
        slug={slug}
        pathId={resolvedSearchParams?.pathId || null}
      />
    </Suspense>
  );
}
