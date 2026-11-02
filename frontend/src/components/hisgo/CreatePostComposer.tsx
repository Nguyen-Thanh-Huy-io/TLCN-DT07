'use client';

import { useRouter } from 'next/navigation';

type CreatePostComposerProps = {
  avatarUrl?: string;
  authorName?: string;
};

export function CreatePostComposer({
  avatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  authorName = 'Nguyễn Lan',
}: CreatePostComposerProps) {
  const router = useRouter();

  return (
    <div className="w-full rounded-[24px] border border-[#D9CCAE] bg-[#F8F5EE] p-4 shadow-[0_10px_28px_rgba(18,38,58,0.04)]">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt={authorName}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-[#E4D9BF]"
        />

        <button
          type="button"
          onClick={() => router.push('/blog/create')}
          className="flex-1 rounded-full border border-[#D9CCAE] bg-[#F2EBD9] px-4 py-3 text-left transition hover:border-[#A48A5D] hover:bg-[#F7F0E3]"
        >
          <span className="block text-[15px] font-medium leading-6 text-[#1B2D3F]">
            Hôm nay bạn muốn kể câu chuyện lịch sử nào?
          </span>
        </button>
      </div>
    </div>
  );
}
