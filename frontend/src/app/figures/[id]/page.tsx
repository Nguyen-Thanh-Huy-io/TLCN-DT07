import { Suspense } from 'react';
import { EntityEditor } from '@/features/entities/components/EntityEditor';
import { EntityType } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';

export const metadata = {
  title: 'Chi tiết & Chỉnh sửa Nhân vật lịch sử | HISGO CMS',
};

interface FigureEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function FigureEditPage({ params }: FigureEditPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải thông tin chi tiết nhân vật lịch sử...
        </div>
      }
    >
      <EntityEditor
        entityId={id}
        defaultType={EntityType.PERSON}
        returnRoute={APP_ROUTES.FIGURES.LIST}
      />
    </Suspense>
  );
}
