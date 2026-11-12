'use client';

import React from 'react';
import { Check, Share2, UserPlus } from 'lucide-react';
import type { CommunityMemberProfile } from '../../api';
import type { ProfileComputedStats, ProfileTabKey } from './profile.types';

export interface ProfileHeaderKpiProps {
  profile: CommunityMemberProfile;
  computedStats: ProfileComputedStats;
  isMe: boolean;
  followLoading: boolean;
  onOpenBlogShareComposer: () => void;
  onToggleFollowProfile: () => Promise<void>;
  onSelectTab: (tab: ProfileTabKey) => void;
}

export function ProfileHeaderKpi({
  profile,
  computedStats,
  isMe,
  followLoading,
  onOpenBlogShareComposer,
  onToggleFollowProfile,
  onSelectTab,
}: ProfileHeaderKpiProps) {
  return (
    <div className="rounded-[8px] border border-[#E3D6BE] bg-[#FAF5E6] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold leading-snug text-[#14233F]">
            {isMe
              ? `Hồ sơ Cộng đồng: ${profile.user.displayName}`
              : profile.user.displayName}
          </h1>
          <p className="mt-1 text-[14px] text-[#5C4E3C] tabular-nums">
            Đã đóng góp <strong className="text-[#14233F]">{computedStats.postCount}</strong> bài
            thảo luận ({computedStats.sharedBlogCount} chuyên khảo Blog) · Nhận{' '}
            <strong className="text-[#14233F]">{computedStats.totalLikesReceived}</strong> lượt
            thích và{' '}
            <strong className="text-[#14233F]">{computedStats.totalCommentsReceived}</strong>{' '}
            phản hồi từ cộng đồng.
          </p>
        </div>

        {/* Nút thao tác chính ở góc phải dòng tiêu đề */}
        <div className="flex items-center gap-2.5">
          {isMe ? (
            <button
              type="button"
              onClick={onOpenBlogShareComposer}
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-3.5 text-[13px] font-semibold text-[#14233F] transition-colors hover:border-[#8A5A19]"
            >
              <Share2 size={14} className="text-[#8A5A19]" />
              <span>Chia sẻ bài từ Blog</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void onToggleFollowProfile()}
              disabled={followLoading}
              className={`inline-flex h-9 items-center gap-1.5 rounded-[6px] px-4 text-[13px] font-semibold transition-colors ${
                profile.followedByMe
                  ? 'border border-[#D8C8AA] bg-[#FDF9F0] text-[#14233F] hover:border-[#7A1F24] hover:text-[#7A1F24]'
                  : 'bg-[#7A1F24] text-[#FAF5E6] hover:bg-[#651A1E]'
              }`}
            >
              {profile.followedByMe ? (
                <>
                  <Check size={15} />
                  <span>Đang theo dõi</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Theo dõi</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Divided KPI Strip (1 container split by 1px hairlines) */}
      <div className="mt-5 grid grid-cols-2 divide-y divide-[#E3D6BE] rounded-[6px] border border-[#E3D6BE] bg-[#FDF9F0] md:grid-cols-4 md:divide-x md:divide-y-0">
        <button
          type="button"
          onClick={() => onSelectTab('posts')}
          className="p-4 text-left transition-colors hover:bg-[#F3EAD8]"
        >
          <p className="text-[13px] text-[#5C4E3C]">Tổng đóng góp</p>
          <p className="mt-1 text-[28px] font-semibold leading-none text-[#14233F] tabular-nums">
            {computedStats.postCount}{' '}
            <span className="text-[13px] font-normal text-[#5C4E3C]">bài</span>
          </p>
          <p className="mt-1.5 text-[12px] text-[#6E5D4B] tabular-nums">
            {computedStats.questionPostCount} thảo luận · {computedStats.sharedBlogCount} bài Blog
          </p>
        </button>

        <div className="p-4 text-left">
          <p className="text-[13px] text-[#5C4E3C]">Lượt thích nhận được</p>
          <p className="mt-1 text-[22px] font-normal leading-none text-[#14233F] tabular-nums">
            {computedStats.totalLikesReceived}{' '}
            <span className="text-[13px] text-[#5C4E3C]">lượt thích</span>
          </p>
          <p className="mt-2 text-[12px] text-[#6E5D4B] tabular-nums">
            Trên tổng {computedStats.totalViewsReceived} lượt đọc
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('followers')}
          className="p-4 text-left transition-colors hover:bg-[#F3EAD8]"
        >
          <p className="text-[13px] text-[#5C4E3C]">Người theo dõi</p>
          <p className="mt-1 text-[22px] font-normal leading-none text-[#14233F] tabular-nums">
            {computedStats.followerCount}{' '}
            <span className="text-[13px] text-[#5C4E3C]">thành viên</span>
          </p>
          <p className="mt-2 text-[12px] text-[#7A1F24]">Xem danh sách theo dõi</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('following')}
          className="p-4 text-left transition-colors hover:bg-[#F3EAD8]"
        >
          <p className="text-[13px] text-[#5C4E3C]">Đang theo dõi</p>
          <p className="mt-1 text-[22px] font-normal leading-none text-[#14233F] tabular-nums">
            {computedStats.followingCount}{' '}
            <span className="text-[13px] text-[#5C4E3C]">thành viên</span>
          </p>
          <p className="mt-2 text-[12px] text-[#7A1F24]">Xem mạng lưới kết nối</p>
        </button>
      </div>
    </div>
  );
}
