'use client';

import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface CommunityFeedAskBannerProps {
  username?: string;
  onOpenComposer: () => void;
}

export function CommunityFeedAskBanner({ username, onOpenComposer }: CommunityFeedAskBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#E3D6BE] bg-[#FAF5E6] px-5 py-3.5">
      <button
        type="button"
        onClick={onOpenComposer}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[6px] border border-[#E2D5BC] bg-[#FDF9F0] px-4 py-2.5 text-left text-[14px] text-[#6E5D4B] transition-colors hover:border-[#8A5A19] hover:text-[#14233F]"
      >
        <MessageSquarePlus size={17} className="shrink-0 text-[#7A1F24]" />
        <span className="truncate">
          {username
            ? `${username}, bạn muốn đặt câu hỏi sử học hay chia sẻ bài chuyên khảo nào hôm nay?`
            : 'Bạn đang tìm hiểu hay thắc mắc điều gì về lịch sử? Bấm vào đây để đặt câu hỏi...'}
        </span>
      </button>
    </div>
  );
}
