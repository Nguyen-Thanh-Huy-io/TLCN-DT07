'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { CommunityTabKey } from '@/constants/enums';

interface CommunityFeedEmptyStateProps {
  activeTab: CommunityTabKey;
  isLoggedIn: boolean;
  selectedTag: string | null;
  searchQuery: string;
  onResetFilter: () => void;
}

export function CommunityFeedEmptyState({
  activeTab,
  isLoggedIn,
  selectedTag,
  searchQuery,
  onResetFilter,
}: CommunityFeedEmptyStateProps) {
  if (activeTab === CommunityTabKey.SAVED && !isLoggedIn) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
        <Bookmark size={22} className="mx-auto text-[#8A5A19]" />
        <h2 className="mt-2.5 text-[17px] font-semibold text-[#14233F]">
          Đăng nhập để xem kho thảo luận đã lưu
        </h2>
        <p className="mt-1.5 text-[14px] text-[#6E5D4B]">
          Lưu lại các cuộc thảo luận sử học và bài Blog chia sẻ tâm đắc để tra cứu bất cứ lúc nào.
        </p>
        <Link
          href="/login?redirect=/cong-dong"
          className="mt-4 inline-flex h-10 items-center rounded-[6px] bg-[#7A1F24] px-5 text-[14px] font-medium text-[#FAF5E6]"
        >
          Đăng nhập tài khoản
        </Link>
      </div>
    );
  }

  const getEmptyTitle = () => {
    if (activeTab === CommunityTabKey.SAVED) {
      return 'Bạn chưa lưu bài thảo luận nào trong danh mục này';
    }
    if (activeTab === CommunityTabKey.FOLLOWING) {
      return 'Bạn chưa theo dõi tác giả nào có bài viết hiển thị';
    }
    return 'Không tìm thấy bài thảo luận phù hợp';
  };

  const getEmptyDescription = () => {
    if (activeTab === CommunityTabKey.FOLLOWING) {
      return 'Hãy bấm nút "Theo dõi" tại danh sách Thành viên tiêu biểu ở cột bên trái hoặc trên từng bài viết để nhận thảo luận mới.';
    }
    if (selectedTag || searchQuery) {
      return 'Hãy thử xóa bộ lọc từ khóa hoặc chọn một thẻ chủ đề khác ở cột bên trái.';
    }
    return 'Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ bài viết từ Blog.';
  };

  const hasFilter = Boolean(selectedTag || searchQuery || activeTab === CommunityTabKey.FOLLOWING);

  return (
    <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
      <h2 className="text-[17px] font-semibold text-[#14233F]">{getEmptyTitle()}</h2>
      <p className="mt-1.5 text-[14px] text-[#6E5D4B]">{getEmptyDescription()}</p>
      {hasFilter ? (
        <button
          type="button"
          onClick={onResetFilter}
          className="mt-3.5 h-9 rounded-[6px] border border-[#D8C8AA] bg-[#F2E8D5] px-4 text-[13px] font-medium text-[#14233F]"
        >
          {activeTab === CommunityTabKey.FOLLOWING ? 'Xem tất cả thảo luận' : 'Xóa bộ lọc đang chọn'}
        </button>
      ) : null}
    </div>
  );
}
