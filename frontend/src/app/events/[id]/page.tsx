import { Suspense } from 'react';
import { EventEditor } from '@/features/events/components/EventEditor';

export const metadata = {
  title: 'Chi tiết & Chỉnh sửa Sự kiện lịch sử | HISGO CMS',
};

interface EventEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventEditPage({ params }: EventEditPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải thông tin chi tiết sự kiện lịch sử...
        </div>
      }
    >
      <EventEditor eventId={id} />
    </Suspense>
  );
}
