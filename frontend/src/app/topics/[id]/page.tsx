import { Suspense } from 'react';
import { TopicEditor } from '@/features/topics/components/TopicEditor';

export const metadata = {
  title: 'Chỉnh sửa chủ đề | Sử Ký Đại Việt CMS',
};

interface TopicEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicEditPage({ params }: TopicEditPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Đang tải thông tin chủ đề...
        </div>
      }
    >
      <TopicEditor topicId={id} />
    </Suspense>
  );
}
