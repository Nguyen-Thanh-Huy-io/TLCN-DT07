import { Suspense } from 'react';
import { PeriodEditor } from '@/features/periods/components/PeriodEditor';

export const metadata = {
  title: 'Tạo mới Thời kỳ Lịch sử | HISGO CMS',
};

export default function CreatePeriodPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải màn hình tạo thời kỳ lịch sử...
        </div>
      }
    >
      <PeriodEditor />
    </Suspense>
  );
}
