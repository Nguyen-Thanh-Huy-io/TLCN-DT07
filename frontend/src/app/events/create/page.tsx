import { Suspense } from 'react';
import { EventEditor } from '@/features/events/components/EventEditor';

export const metadata = {
  title: 'Tạo Sự kiện lịch sử | HISGO CMS',
};

export default function EventCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải màn hình tạo sự kiện lịch sử...
        </div>
      }
    >
      <EventEditor />
    </Suspense>
  );
}
