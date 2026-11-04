import { Suspense } from 'react';
import { EntityEditor } from '@/features/entities/components/EntityEditor';
import { EntityType } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';

export const metadata = {
  title: 'Tạo Nhân vật lịch sử | HISGO CMS',
};

export default function FigureCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải màn hình tạo nhân vật lịch sử...
        </div>
      }
    >
      <EntityEditor
        defaultType={EntityType.PERSON}
        returnRoute={APP_ROUTES.FIGURES.LIST}
      />
    </Suspense>
  );
}
