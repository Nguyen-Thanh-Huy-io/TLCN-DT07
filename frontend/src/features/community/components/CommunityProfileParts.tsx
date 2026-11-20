'use client';

import React from 'react';
import Link from 'next/link';
import { Share2, Check, UserPlus, X, Search } from 'lucide-react';
import { UserRole } from '@/constants/enums';
import { type CommunityMemberProfile, type CommunityMemberSummary, type CommunityPost } from '../api';
import { getAuthorTint, getInitials } from '../utils/community-feed.helper';
import { PostCard } from './PostCard';

// --- profile.types.ts ---
export enum ProfileTabKey {
  POSTS = 'posts',
  SHARED_BLOG = 'shared_blog',
  FOLLOWERS = 'followers',
  FOLLOWING = 'following',
  SAVED = 'saved',
}

export interface ProfileComputedStats {
  postCount: number;
  sharedBlogCount: number;
  questionPostCount: number;
  followerCount: number;
  followingCount: number;
  totalLikesReceived: number;
  totalCommentsReceived: number;
  totalViewsReceived: number;
  topTopics: Array<{ tag: string; count: number }>;
}

export interface ProfileTabItem {
  key: ProfileTabKey;
  label: string;
  count: number;
  icon: React.ElementType;
}

export function getRoleLabel(role?: string): string {
  if (role === UserRole.ADMIN || role === UserRole.SUPERADMIN) return 'Hội đồng Thẩm định';
  if (role === UserRole.MODERATOR) return 'Biên tập viên Sử học';
  return 'Thành viên Cộng đồng';
}

// --- ProfileHeaderKpi.tsx ---
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
          onClick={() => onSelectTab(ProfileTabKey.POSTS)}
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
          onClick={() => onSelectTab(ProfileTabKey.FOLLOWERS)}
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
          onClick={() => onSelectTab(ProfileTabKey.FOLLOWING)}
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

// --- ProfileMembersList.tsx ---
export interface ProfileMembersListProps {
  activeTab: ProfileTabKey;
  displayName: string;
  filteredMembers: CommunityMemberSummary[];
  onToggleFollowMember: (target: CommunityMemberSummary) => Promise<void>;
}

export function ProfileMembersList({
  activeTab,
  displayName,
  filteredMembers,
  onToggleFollowMember,
}: ProfileMembersListProps) {
  const isFollowers = activeTab === ProfileTabKey.FOLLOWERS;

  return (
    <div className="rounded-[8px] border border-[#E3D6BE] bg-[#FDF9F0] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#14233F]">
          {isFollowers
            ? `Thành viên đang theo dõi ${displayName}`
            : `Thành viên được ${displayName} theo dõi`}
        </h2>
        <span className="text-[13px] text-[#5C4E3C] tabular-nums">
          {filteredMembers.length} tài khoản
        </span>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-[#D8C8AA] p-8 text-center">
          <p className="text-[14px] text-[#5C4E3C]">
            {isFollowers
              ? 'Chưa có thành viên nào trong danh sách người theo dõi này.'
              : 'Chưa theo dõi thành viên nào khớp với tìm kiếm.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EDE3CE]">
          {filteredMembers.map((member) => {
            const mTint = getAuthorTint(member.username);
            return (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-1 last:pb-1"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3.5">
                  <Link
                    href={`/cong-dong/thanh-vien/${encodeURIComponent(member.username)}`}
                    style={{
                      backgroundColor: mTint.bg,
                      color: mTint.ink,
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold"
                  >
                    {getInitials(member.displayName)}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/cong-dong/thanh-vien/${encodeURIComponent(member.username)}`}
                        className="text-[15px] font-semibold text-[#14233F] hover:text-[#7A1F24]"
                      >
                        {member.displayName}
                      </Link>
                      <span className="text-[12.5px] text-[#6E5D4B]">
                        @{member.username}
                      </span>
                      <span className="rounded-[4px] bg-[#E5EFE6] px-2 py-0.5 text-[11px] font-medium text-[#1E4620]">
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[13px] text-[#5C4E3C]">
                      {member.bio ||
                        'Thành viên tham gia thảo luận và chia sẻ tư liệu lịch sử trên HISGO.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-[13px] text-[#14233F] tabular-nums">
                    <div>
                      {member.postCount}{' '}
                      <span className="text-[#5C4E3C]">bài đăng</span>
                    </div>
                    <div className="text-[12px] text-[#5C4E3C]">
                      {member.followerCount} người theo dõi
                    </div>
                  </div>

                  {!member.isMe && (
                    <button
                      type="button"
                      onClick={() => void onToggleFollowMember(member)}
                      className={`inline-flex h-8 min-w-[108px] items-center justify-center gap-1.5 rounded-[6px] border px-3 text-[12.5px] font-semibold transition-colors ${
                        member.followedByMe
                          ? 'border-[#D8C8AA] bg-[#F1E6D0] text-[#14233F] hover:border-[#7A1F24] hover:text-[#7A1F24]'
                          : 'border-[#7A1F24] bg-[#7A1F24] text-[#FAF5E6] hover:bg-[#651A1E]'
                      }`}
                    >
                      {member.followedByMe ? (
                        <>
                          <Check size={13} />
                          <span>Đang theo dõi</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Theo dõi</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- ProfilePostsList.tsx ---
export interface ProfilePostsListProps {
  activeTab: ProfileTabKey;
  filteredPosts: CommunityPost[];
  selectedTopic: string | null;
  searchQuery: string;
  onClearFilters: () => void;
  onSelectTag: (tag: string) => void;
  onLikeUpdate: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate: (postId: string, bookmarked: boolean) => void;
}

export function ProfilePostsList({
  activeTab,
  filteredPosts,
  selectedTopic,
  searchQuery,
  onClearFilters,
  onSelectTag,
  onLikeUpdate,
  onBookmarkUpdate,
}: ProfilePostsListProps) {
  if (filteredPosts.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
        <h2 className="text-[16px] font-semibold text-[#14233F]">
          {activeTab === ProfileTabKey.SAVED
            ? 'Chưa có bài viết nào trong danh sách đã lưu'
            : 'Không có bài thảo luận nào khớp với bộ lọc hiện tại'}
        </h2>
        <p className="mt-1.5 text-[14px] text-[#5C4E3C]">
          {selectedTopic || searchQuery
            ? 'Hãy xóa bộ lọc chủ đề hoặc từ khóa tìm kiếm để xem toàn bộ đóng góp.'
            : 'Thành viên này chưa đăng bài thảo luận nào trong mục này.'}
        </p>
        {(selectedTopic || searchQuery) && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-3.5 h-9 rounded-[6px] border border-[#D8C8AA] bg-[#F1E6D0] px-4 text-[13px] font-medium text-[#14233F]"
          >
            Hiển thị toàn bộ bài viết
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          activeTag={selectedTopic}
          onSelectTag={onSelectTag}
          onLikeUpdate={onLikeUpdate}
          onBookmarkUpdate={onBookmarkUpdate}
          showFollowButton={false}
        />
      ))}
    </div>
  );
}

// --- ProfileTabsToolbar.tsx ---
export interface ProfileTabsToolbarProps {
  tabs: ProfileTabItem[];
  activeTab: ProfileTabKey;
  onSelectTab: (tab: ProfileTabKey) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  selectedTopic: string | null;
  onClearTopic: () => void;
  totalFilteredCount: number;
}

export function ProfileTabsToolbar({
  tabs,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchQueryChange,
  selectedTopic,
  onClearTopic,
  totalFilteredCount,
}: ProfileTabsToolbarProps) {
  const isMemberTab = activeTab === ProfileTabKey.FOLLOWERS || activeTab === ProfileTabKey.FOLLOWING;

  return (
    <div className="rounded-[8px] border border-[#E3D6BE] bg-[#FAF5E6] p-6 pb-5">
      {/* Underline Tabs trên đường kẻ 1px */}
      <div className="border-b border-[#E3D6BE]">
        <div className="flex flex-wrap items-center gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectTab(tab.key)}
                className={`inline-flex items-center gap-2 border-b-2 pb-3 text-[14px] transition-colors ${
                  isActive
                    ? 'border-[#7A1F24] font-semibold text-[#14233F]'
                    : 'border-transparent font-normal text-[#5C4E3C] hover:text-[#14233F]'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-[#7A1F24]' : 'text-[#6E5D4B]'} />
                <span>{tab.label}</span>
                <span className="rounded-[4px] bg-[#F1E6D0] px-1.5 py-0.5 text-[12px] text-[#5C4E3C] tabular-nums">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thanh công cụ lọc nhanh */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[296px]">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6E5D4B]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={
              isMemberTab
                ? 'Tìm theo tên hoặc hướng nghiên cứu...'
                : 'Tìm trong các bài thảo luận...'
            }
            aria-label="Tìm kiếm trong hồ sơ"
            className="h-9 w-full rounded-[6px] border border-[#DFD1B8] bg-[#FDF9F0] pl-8 pr-7 text-[13.5px] text-[#14233F] placeholder:text-[#6E5D4B] outline-none focus:border-[#8A5A19]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              aria-label="Xóa từ khóa"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E5D4B]"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-[13px] text-[#5C4E3C] tabular-nums">
          {selectedTopic ? (
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#7A1F24] px-2 py-0.5 text-[12px] font-semibold text-[#FAF5E6]">
              <span>#{selectedTopic}</span>
              <button
                type="button"
                onClick={onClearTopic}
                aria-label="Xóa lọc chủ đề"
              >
                <X size={12} />
              </button>
            </span>
          ) : null}
          <span>
            Hiển thị <strong className="text-[#14233F]">{totalFilteredCount}</strong>{' '}
            {isMemberTab ? 'thành viên' : 'bài viết'}
          </span>
        </div>
      </div>
    </div>
  );
}
