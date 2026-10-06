import { Suspense } from 'react';
import { TopicEditor } from '@/features/topics/components/TopicEditor';

export const metadata = {
  title: 'Tạo chủ đề mới | Sử Ký Đại Việt CMS',
};

export default function TopicCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải màn hình tạo chủ đề...
        </div>
      }
    >
      <TopicEditor />
    </Suspense>
  );
}
