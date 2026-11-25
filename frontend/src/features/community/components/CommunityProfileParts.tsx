'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, ScrollText, Share2, Check, UserPlus, X, Search } from 'lucide-react';
import { UserRole } from '@/constants/enums';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { formatPublishedDate } from '@/utils/common';
import { COMMUNITY_FEED_PAGE_SIZE, type CommunityMemberProfile, type CommunityMemberSummary, type CommunityPost, type PublishedWorkArticle, type PublishedWorkLesson } from '../api';
import { useInfiniteScrollObserver } from '../hooks/useCommunityFeedHooks';
import { getAuthorTint, getInitials } from '../community-content.util';
import { PostCard } from './PostActionBar';

// --- profile.types.ts ---
export enum ProfileTabKey {
  POSTS = 'posts',
  WORKS = 'works',
  SHARED_BLOG = 'shared_blog',
  FOLLOWERS = 'followers',
  FOLLOWING = 'following',
  SAVED = 'saved',
}

export interface ProfileComputedStats {
  postCount: number;
  sharedBlogCount: number;
  questionPostCount: number;
  publishedArticlesCount: number;
  publishedLessonsCount: number;
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
  isMe: boolean;
  followLoading: boolean;
  onOpenBlogShareComposer: () => void;
  onToggleFollowProfile: () => Promise<void>;
}

export function ProfileHeaderKpi({
  profile,
  isMe,
  followLoading,
  onOpenBlogShareComposer,
  onToggleFollowProfile,
}: ProfileHeaderKpiProps) {
  return (
    <div className="rounded-[10px] border border-[#E3D6BE] bg-[#FAF5E6] px-5 py-5 md:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="min-w-[210px] flex-1">
          <h1 className="text-[22px] font-bold leading-snug text-[#14233F] sm:text-[24px] md:text-[28px]">
            {isMe
              ? `Hồ sơ Cộng đồng: ${profile.user.displayName}`
              : profile.user.displayName}
          </h1>
        </div>

        {/* Nút thao tác chính ở góc phải dòng tiêu đề */}
        <div className="flex items-center gap-2.5">
          {isMe ? (
            <button
              type="button"
              onClick={onOpenBlogShareComposer}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#D8C8AA] bg-[#FDF9F0] px-4 text-[14px] font-semibold text-[#14233F] transition-colors hover:border-[#8A5A19] cursor-pointer"
            >
              <Share2 size={15} className="text-[#8A5A19]" />
              <span>Chia sẻ bài từ Blog</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void onToggleFollowProfile()}
              disabled={followLoading}
              className={`inline-flex h-10 items-center gap-2 rounded-[8px] px-4.5 text-[14px] font-semibold transition-colors cursor-pointer ${
                profile.followedByMe
                  ? 'border border-[#D8C8AA] bg-[#FDF9F0] text-[#14233F] hover:border-[#7A1F24] hover:text-[#7A1F24]'
                  : 'bg-[#7A1F24] text-[#FAF5E6] hover:bg-[#651A1E]'
              }`}
            >
              {profile.followedByMe ? (
                <>
                  <Check size={16} />
                  <span>Đang theo dõi</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Theo dõi</span>
                </>
              )}
            </button>
          )}
        </div>
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
  const filterKey = `${activeTab}:${selectedTopic ?? ''}:${searchQuery}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  const [visibleCount, setVisibleCount] = useState(COMMUNITY_FEED_PAGE_SIZE);

  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(COMMUNITY_FEED_PAGE_SIZE);
  }

  const hasMorePosts = visibleCount < filteredPosts.length;
  const loadMoreProfilePosts = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(prev + COMMUNITY_FEED_PAGE_SIZE, filteredPosts.length),
    );
  }, [filteredPosts.length]);

  const sentinelRef = useInfiniteScrollObserver({
    enabled: hasMorePosts,
    isLoading: false,
    triggerKey: `${filteredPosts.length}:${visibleCount}`,
    onLoadMore: loadMoreProfilePosts,
  });

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

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      {visiblePosts.map((post, idx) => (
        <PostCard
          key={post.id}
          post={post}
          activeTag={selectedTopic}
          onSelectTag={onSelectTag}
          onLikeUpdate={onLikeUpdate}
          onBookmarkUpdate={onBookmarkUpdate}
          showFollowButton={false}
          priorityLcp={idx === 0}
        />
      ))}

      {hasMorePosts ? (
        <div ref={sentinelRef} className="pt-2 text-center">
          <button
            type="button"
            onClick={loadMoreProfilePosts}
            className="h-10 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-5 text-[14px] font-medium text-[#14233F] hover:border-[#8A5A19] cursor-pointer"
          >
            Tải thêm bài viết
          </button>
        </div>
      ) : null}
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
}

export function ProfileTabsToolbar({
  tabs,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchQueryChange,
  selectedTopic,
  onClearTopic,
}: ProfileTabsToolbarProps) {
  const isMemberTab = activeTab === ProfileTabKey.FOLLOWERS || activeTab === ProfileTabKey.FOLLOWING;

  return (
    <div className="rounded-[10px] border border-[#E3D6BE] bg-[#FAF5E6] p-5 pb-5 md:px-6">
      {/* Underline Tabs trên đường kẻ 1px (luôn giữ trên 1 hàng) */}
      <div className="border-b border-[#E3D6BE]">
        <div className="flex flex-nowrap items-center gap-x-3.5 pr-4 xl:gap-x-4 2xl:gap-x-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-[13.5px] xl:text-[14px] whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#7A1F24] font-semibold text-[#14233F]'
                    : 'border-transparent font-medium text-[#5C4E3C] hover:text-[#14233F]'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-[#7A1F24]' : 'text-[#6E5D4B]'} />
                <span>{tab.label}</span>
                <span className="rounded-[5px] bg-[#F1E6D0] px-1.5 py-0.5 text-[11.5px] font-semibold text-[#5C4E3C] tabular-nums">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thanh công cụ lọc nhanh */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[420px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E5D4B]"
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
            className="h-10 w-full rounded-[8px] border border-[#DFD1B8] bg-[#FDF9F0] pl-9 pr-8 text-[14px] text-[#14233F] placeholder:text-[#6E5D4B] outline-none focus:border-[#8A5A19]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              aria-label="Xóa từ khóa"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5D4B]"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {selectedTopic ? (
          <div className="flex items-center gap-2 text-[14px] text-[#5C4E3C]">
            <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#7A1F24] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#FAF5E6]">
              <span>#{selectedTopic}</span>
              <button
                type="button"
                onClick={onClearTopic}
                aria-label="Xóa lọc chủ đề"
              >
                <X size={12} />
              </button>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// === Merged from ProfilePublishedWorksList.tsx ===
export interface ProfilePublishedWorksListProps {
  articles: PublishedWorkArticle[];
  lessons: PublishedWorkLesson[];
  searchQuery: string;
  onClearSearch: () => void;
}

export function ProfilePublishedWorksList({
  articles,
  lessons,
  searchQuery,
  onClearSearch,
}: ProfilePublishedWorksListProps) {
  const totalCount = articles.length + lessons.length;

  if (totalCount === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
        <h2 className="text-[16px] font-semibold text-[#14233F]">
          Chưa có bài viết hoặc bài học nào được tìm thấy
        </h2>
        <p className="mt-1.5 text-[14px] text-[#5C4E3C]">
          {searchQuery
            ? 'Hãy thử xóa từ khóa tìm kiếm để xem toàn bộ tác phẩm biên soạn.'
            : 'Tác giả này chưa xuất bản bài viết lịch sử hoặc bài học nào.'}
        </p>
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-3.5 h-9 rounded-[6px] border border-[#D8C8AA] bg-[#F1E6D0] px-4 text-[13px] font-medium text-[#14233F]"
          >
            Hiển thị toàn bộ
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {articles.length > 0 && (
        <section className="rounded-[8px] border border-[#E3D6BE] bg-[#FDF9F0] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-[#14233F]">
            <ScrollText size={16} className="text-[#7A1F24]" />
            <span>Bài viết lịch sử ({articles.length})</span>
          </h2>
          <div className="divide-y divide-[#EDE3CE]">
            {articles.map((article) => {
              const dateText = formatPublishedDate(article.publishedAt ?? article.updatedAt);
              return (
                <Link
                  key={article.id}
                  href={PUBLIC_ROUTES.ARTICLE(article.slug)}
                  className="block py-3.5 first:pt-1 last:pb-1 transition-colors hover:bg-[#FAF5E6]/80"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#6E5D4B]">
                    {article.categoryName && (
                      <span className="rounded bg-[#F1E6D0] px-2 py-0.5 font-semibold text-[#7A1F24]">
                        {article.categoryName}
                      </span>
                    )}
                    {article.dateLabel && <span>{article.dateLabel}</span>}
                    {dateText && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        Đăng {dateText}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-[15px] font-bold text-[#14233F] hover:text-[#7A1F24]">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-[#5C4E3C]">{article.summary}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {lessons.length > 0 && (
        <section className="rounded-[8px] border border-[#E3D6BE] bg-[#FDF9F0] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-[#14233F]">
            <BookOpen size={16} className="text-[#7A1F24]" />
            <span>Bài học chuyên đề ({lessons.length})</span>
          </h2>
          <div className="divide-y divide-[#EDE3CE]">
            {lessons.map((lesson) => {
              const dateText = formatPublishedDate(lesson.publishedAt ?? lesson.updatedAt);
              return (
                <Link
                  key={lesson.id}
                  href={PUBLIC_ROUTES.LESSON(lesson.slug)}
                  className="block py-3.5 first:pt-1 last:pb-1 transition-colors hover:bg-[#FAF5E6]/80"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#6E5D4B]">
                    {lesson.topicName && (
                      <span className="rounded bg-[#E5EFE6] px-2 py-0.5 font-semibold text-[#1E4620]">
                        {lesson.topicName}
                      </span>
                    )}
                    {dateText && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        Đăng {dateText}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-[15px] font-bold text-[#14233F] hover:text-[#7A1F24]">
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-[#5C4E3C]">{lesson.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
