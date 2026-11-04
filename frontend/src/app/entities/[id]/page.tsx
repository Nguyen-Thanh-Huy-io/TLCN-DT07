import { Suspense } from 'react';
import { EntityEditor } from '@/features/entities/components/EntityEditor';

export const metadata = {
  title: 'Chi tiết & Chỉnh sửa Thực thể Lịch sử | HISGO CMS',
};

interface EntityEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EntityEditPage({ params }: EntityEditPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải thông tin chi tiết thực thể lịch sử...
        </div>
      }
    >
      <EntityEditor entityId={id} />
    </Suspense>
  );
}
