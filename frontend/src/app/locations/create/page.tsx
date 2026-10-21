import { Suspense } from 'react';
import { EntityEditor } from '@/features/entities/components/EntityEditor';
import { EntityType } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';

export const metadata = {
  title: 'Tạo mới Địa danh & Di tích Lịch sử | HISGO CMS',
};

export default function LocationCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải màn hình tạo địa danh, di tích lịch sử...
        </div>
      }
    >
      <EntityEditor
        defaultType={EntityType.LOCATION}
        returnRoute={APP_ROUTES.LOCATIONS.LIST}
      />
    </Suspense>
  );
}
