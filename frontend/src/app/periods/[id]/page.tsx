import { Suspense } from 'react';
import { PeriodEditor } from '@/features/periods/components/PeriodEditor';

export const metadata = {
  title: 'Chi tiết & Chỉnh sửa Thời kỳ Lịch sử | HISGO CMS',
};

interface PeriodEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PeriodEditPage({ params }: PeriodEditPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải thông tin thời kỳ lịch sử...
        </div>
      }
    >
      <PeriodEditor periodId={id} />
    </Suspense>
  );
}
