import { Suspense } from 'react';
import { EntityEditor } from '@/features/entities/components/EntityEditor';
import { EntityType } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';

export const metadata = {
  title: 'Chi tiết & Chỉnh sửa Địa danh / Di tích | HISGO CMS',
};

interface LocationEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationEditPage({ params }: LocationEditPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải thông tin địa danh, di tích lịch sử...
        </div>
      }
    >
      <EntityEditor
        entityId={id}
        defaultType={EntityType.LOCATION}
        returnRoute={APP_ROUTES.LOCATIONS.LIST}
      />
    </Suspense>
  );
}
