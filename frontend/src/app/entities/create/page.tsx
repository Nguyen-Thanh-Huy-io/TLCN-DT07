import { Suspense } from 'react';
import { EntityEditor } from '@/features/entities/components/EntityEditor';

export const metadata = {
  title: 'Tạo Thực thể Lịch sử | HISGO CMS',
};

export default function EntityCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải màn hình tạo thực thể lịch sử...
        </div>
      }
    >
      <EntityEditor />
    </Suspense>
  );
}
