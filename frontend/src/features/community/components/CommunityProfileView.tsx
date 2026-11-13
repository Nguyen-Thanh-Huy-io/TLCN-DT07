'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Layers, Share2, UserCheck, Users, Check, UserPlus, ArrowLeft, Calendar, Edit3, FileText, Hash, Plus, X, Search } from 'lucide-react';
import { ComposerMode, UserRole } from '@/constants/enums';
import { QuickComposer } from './QuickComposer';
import { useCommunityProfile } from '../hooks/useCommunityProfile';
import { type CommunityMemberProfile, type CommunityMemberSummary, type CommunityPost } from '../api';
import { getAuthorTint, getInitials } from '../utils/community-feed.helper';
import { PostCard } from './PostCard';

export function CommunityProfileView({
  initialProfile,
  identifier,
  isPersonalRoute = false,
}: CommunityProfileViewProps) {
  const {
    profile,
    suggestedMembers,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedTopic,
    setSelectedTopic,
    followLoading,
    computedStats,
    isMe,
    isEditingBio,
    setIsEditingBio,
    editFirstName,
    setEditFirstName,
    editLastName,
    setEditLastName,
    editBio,
    setEditBio,
    savingBio,
    bioSavedNotice,
    setBioSavedNotice,
    composerOpen,
    setComposerOpen,
    composerMode,
    setComposerMode,
    filteredPosts,
    filteredMembers,
    handleToggleFollowProfile,
    handleToggleFollowOtherMember,
    handleSaveBio,
    handleCreatedPost,
    handleLikeUpdate,
    handleBookmarkUpdate,
  } = useCommunityProfile({
    initialProfile,
    identifier,
    isPersonalRoute,
  });

  const tabs: ProfileTabItem[] = [
    {
      key: ProfileTabKey.POSTS,
      label: 'Bài đã đăng',
      count: computedStats.postCount,
      icon: Layers,
    },
    {
      key: ProfileTabKey.SHARED_BLOG,
      label: 'Bài Blog chia sẻ',
      count: computedStats.sharedBlogCount,
      icon: Share2,
    },
    {
      key: ProfileTabKey.FOLLOWERS,
      label: 'Người theo dõi',
      count: computedStats.followerCount,
      icon: Users,
    },
    {
      key: ProfileTabKey.FOLLOWING,
      label: 'Đang theo dõi',
      count: computedStats.followingCount,
      icon: UserCheck,
    },
    ...(isMe
      ? [
          {
            key: ProfileTabKey.SAVED,
            label: 'Đã lưu',
            count: profile.bookmarkedPosts.length,
            icon: Bookmark,
          },
        ]
      : []),
  ];

  const totalFilteredCount =
    activeTab === ProfileTabKey.FOLLOWERS || activeTab === ProfileTabKey.FOLLOWING
      ? filteredMembers.length
      : filteredPosts.length;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
        {/* CỘT TRÁI (LEFT RAIL): Hồ sơ định danh, hướng nghiên cứu, chủ đề đóng góp & gợi ý kết nối */}
        <ProfileSidebar
          profile={profile}
          computedStats={computedStats}
          suggestedMembers={suggestedMembers}
          isMe={isMe}
          followLoading={followLoading}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          onOpenQuestionComposer={() => {
            setComposerMode(ComposerMode.QUESTION);
            setComposerOpen(true);
          }}
          onToggleFollowProfile={handleToggleFollowProfile}
          onToggleFollowOtherMember={handleToggleFollowOtherMember}
          isEditingBio={isEditingBio}
          setIsEditingBio={setIsEditingBio}
          editFirstName={editFirstName}
          setEditFirstName={setEditFirstName}
          editLastName={editLastName}
          setEditLastName={setEditLastName}
          editBio={editBio}
          setEditBio={setEditBio}
          savingBio={savingBio}
          bioSavedNotice={bioSavedNotice}
          setBioSavedNotice={setBioSavedNotice}
          onSaveBio={handleSaveBio}
          onTopicClick={() => {
            if (activeTab === ProfileTabKey.FOLLOWERS || activeTab === ProfileTabKey.FOLLOWING) {
              setActiveTab(ProfileTabKey.POSTS);
            }
          }}
        />

        {/* VÙNG TRUNG TÂM (CENTER CANVAS): Tiêu đề h1, Dải KPI chia vạch 1px, Tabs gạch chân & Nội dung */}
        <div className="min-w-0 space-y-6">
          <ProfileHeaderKpi
            profile={profile}
            computedStats={computedStats}
            isMe={isMe}
            followLoading={followLoading}
            onOpenBlogShareComposer={() => {
              setComposerMode(ComposerMode.SHARE_BLOG);
              setComposerOpen(true);
            }}
            onToggleFollowProfile={handleToggleFollowProfile}
            onSelectTab={setActiveTab}
          />

          <ProfileTabsToolbar
            tabs={tabs}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedTopic={selectedTopic}
            onClearTopic={() => setSelectedTopic(null)}
            totalFilteredCount={totalFilteredCount}
          />

          {/* Nội dung theo Tab */}
          {activeTab === ProfileTabKey.FOLLOWERS || activeTab === ProfileTabKey.FOLLOWING ? (
            <ProfileMembersList
              activeTab={activeTab}
              displayName={profile.user.displayName}
              filteredMembers={filteredMembers}
              onToggleFollowMember={handleToggleFollowOtherMember}
            />
          ) : (
            <ProfilePostsList
              activeTab={activeTab}
              filteredPosts={filteredPosts}
              selectedTopic={selectedTopic}
              searchQuery={searchQuery}
              onClearFilters={() => {
                setSelectedTopic(null);
                setSearchQuery('');
              }}
              onSelectTag={(tag) =>
                setSelectedTopic((prev) =>
                  prev?.toLowerCase() === tag.toLowerCase() ? null : tag,
                )
              }
              onLikeUpdate={handleLikeUpdate}
              onBookmarkUpdate={handleBookmarkUpdate}
            />
          )}
        </div>
      </div>

      <QuickComposer
        isOpen={composerOpen}
        initialMode={composerMode}
        onClose={() => setComposerOpen(false)}
        onCreated={handleCreatedPost}
      />
    </div>
  );
}

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

export function formatJoinDate(iso?: string | null): string {
  if (!iso) return 'Tháng 8, 2026';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Tháng 8, 2026';
  return `Tham gia tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

export function getRoleLabel(role?: string): string {
  if (role === UserRole.ADMIN || role === UserRole.SUPERADMIN) return 'Hội đồng Thẩm định';
  if (role === UserRole.MODERATOR) return 'Biên tập viên Sử học';
  return 'Thành viên Cộng đồng';
}

export interface CommunityProfileViewProps {
  initialProfile: CommunityMemberProfile;
  identifier: string;
  isPersonalRoute?: boolean;
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

// --- ProfileSidebar.tsx ---
export interface ProfileSidebarProps {
  profile: CommunityMemberProfile;
  computedStats: ProfileComputedStats;
  suggestedMembers: CommunityMemberSummary[];
  isMe: boolean;
  followLoading: boolean;
  selectedTopic: string | null;
  setSelectedTopic: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenQuestionComposer: () => void;
  onToggleFollowProfile: () => Promise<void>;
  onToggleFollowOtherMember: (target: CommunityMemberSummary) => Promise<void>;
  isEditingBio: boolean;
  setIsEditingBio: React.Dispatch<React.SetStateAction<boolean>>;
  editFirstName: string;
  setEditFirstName: (val: string) => void;
  editLastName: string;
  setEditLastName: (val: string) => void;
  editBio: string;
  setEditBio: (val: string) => void;
  savingBio: boolean;
  bioSavedNotice: string | null;
  setBioSavedNotice: (val: string | null) => void;
  onSaveBio: (e: React.FormEvent) => Promise<void>;
  onTopicClick?: () => void;
}

export function ProfileSidebar({
  profile,
  computedStats,
  suggestedMembers,
  isMe,
  followLoading,
  selectedTopic,
  setSelectedTopic,
  onOpenQuestionComposer,
  onToggleFollowProfile,
  onToggleFollowOtherMember,
  isEditingBio,
  setIsEditingBio,
  editFirstName,
  setEditFirstName,
  editLastName,
  setEditLastName,
  editBio,
  setEditBio,
  savingBio,
  bioSavedNotice,
  setBioSavedNotice,
  onSaveBio,
  onTopicClick,
}: ProfileSidebarProps) {
  const tint = getAuthorTint(profile.user.username);
  const maxTopicCount = Math.max(1, ...(computedStats.topTopics.map((t) => t.count) || [1]));

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="rounded-[8px] border border-[#E3D6BE] bg-[#FAF5E6] p-5">
        {/* Điều hướng quay lại Diễn đàn */}
        <Link
          href="/cong-dong"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#5C4E3C] transition-colors hover:text-[#7A1F24]"
        >
          <ArrowLeft size={15} />
          <span>Quay lại Diễn đàn Cộng đồng</span>
        </Link>

        {/* Thẻ định danh thành viên */}
        <div className="mt-4 rounded-[6px] bg-[#F1E6D0] p-4">
          <div className="flex items-center gap-3.5">
            <div
              style={{
                backgroundColor: tint.bg,
                color: tint.ink,
              }}
              className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full text-[16px] font-bold"
            >
              {getInitials(profile.user.displayName)}
            </div>
            <div className="min-w-0">
              <span className="inline-flex h-5 items-center rounded-[4px] bg-[#E5EFE6] px-2 text-[11px] font-semibold text-[#1E4620]">
                {getRoleLabel(profile.user.role)}
              </span>
              <h1 className="mt-1 truncate text-[19px] font-bold leading-snug text-[#14233F]">
                {profile.user.displayName}
              </h1>
              <p className="truncate text-[12.5px] text-[#5C4E3C]">
                @{profile.user.username}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[13.5px] leading-relaxed text-[#14233F]">
            {profile.user.bio ||
              'Thành viên Cộng đồng Lịch sử HISGO — cùng đặt câu hỏi, trao đổi tư liệu và đối chiếu sử liệu đa chiều.'}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#5C4E3C]">
            <Calendar size={13} className="text-[#8A5A19]" />
            <span>{formatJoinDate(profile.user.joinedAt)}</span>
          </div>
        </div>

        {/* Cụm nút hành động chính 1-click */}
        <div className="mt-4 space-y-2">
          {isMe ? (
            <>
              <button
                type="button"
                onClick={onOpenQuestionComposer}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[6px] bg-[#7A1F24] px-4 text-[13.5px] font-semibold text-[#FAF5E6] transition-colors hover:bg-[#651A1E]"
              >
                <Plus size={16} />
                <span>Đăng thảo luận mới</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBio((prev) => !prev)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-4 text-[13.5px] font-semibold text-[#14233F] transition-colors hover:border-[#8A5A19] hover:bg-[#F2E8D5]"
              >
                <Edit3 size={15} className="text-[#8A5A19]" />
                <span>{isEditingBio ? 'Đóng khung chỉnh sửa' : 'Chỉnh sửa hồ sơ sử học'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void onToggleFollowProfile()}
                disabled={followLoading}
                className={`flex h-10 w-full items-center justify-center gap-2 rounded-[6px] px-4 text-[13.5px] font-semibold transition-colors ${
                  profile.followedByMe
                    ? 'border border-[#D8C8AA] bg-[#FDF9F0] text-[#14233F] hover:border-[#7A1F24] hover:text-[#7A1F24]'
                    : 'bg-[#7A1F24] text-[#FAF5E6] hover:bg-[#651A1E]'
                }`}
              >
                {profile.followedByMe ? (
                  <>
                    <Check size={16} />
                    <span>Đang theo dõi · Bỏ theo dõi</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Theo dõi thành viên</span>
                  </>
                )}
              </button>
              <Link
                href="/cong-dong/ca-nhan"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-4 text-[13.5px] font-semibold text-[#14233F] transition-colors hover:border-[#8A5A19] hover:bg-[#F2E8D5]"
              >
                <FileText size={15} className="text-[#8A5A19]" />
                <span>Xem hồ sơ cá nhân của tôi</span>
              </Link>
            </>
          )}
        </div>

        {/* Biểu mẫu chỉnh sửa hồ sơ sử học */}
        {isMe && isEditingBio && (
          <form
            onSubmit={(e) => void onSaveBio(e)}
            className="mt-4 space-y-3 rounded-[6px] border border-[#DFD1B8] bg-[#FDF9F0] p-4"
          >
            <div>
              <label
                htmlFor="profile-first-name"
                className="mb-1.5 block text-[13px] font-medium text-[#14233F]"
              >
                Họ và tên đệm
              </label>
              <input
                id="profile-first-name"
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="Ví dụ: Trần Minh"
                className="h-9 w-full rounded-[6px] border border-[#DFD1B8] bg-white px-3 text-[13.5px] text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-last-name"
                className="mb-1.5 block text-[13px] font-medium text-[#14233F]"
              >
                Tên gọi
              </label>
              <input
                id="profile-last-name"
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Ví dụ: Khôi"
                className="h-9 w-full rounded-[6px] border border-[#DFD1B8] bg-white px-3 text-[13.5px] text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-bio-input"
                className="mb-1.5 block text-[13px] font-medium text-[#14233F]"
              >
                Hướng nghiên cứu & giới thiệu
              </label>
              <textarea
                id="profile-bio-input"
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Chia sẻ giai đoạn lịch sử, triều đại hoặc chủ đề khảo cổ bạn quan tâm..."
                className="w-full rounded-[6px] border border-[#DFD1B8] bg-white p-3 text-[13.5px] leading-relaxed text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingBio(false)}
                className="h-8 rounded-[6px] border border-[#D8C8AA] bg-[#FAF5E6] px-3 text-[12.5px] font-medium text-[#5C4E3C]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingBio}
                className="h-8 rounded-[6px] bg-[#7A1F24] px-3.5 text-[12.5px] font-semibold text-[#FAF5E6] hover:bg-[#651A1E]"
              >
                {savingBio ? 'Đang lưu...' : 'Lưu hồ sơ'}
              </button>
            </div>
          </form>
        )}

        {bioSavedNotice ? (
          <div className="mt-3 flex items-center justify-between rounded-[6px] bg-[#E5EFE6] px-3 py-2 text-[12.5px] font-medium text-[#1E4620]">
            <span>{bioSavedNotice}</span>
            <button
              type="button"
              onClick={() => setBioSavedNotice(null)}
              aria-label="Đóng thông báo"
            >
              <X size={13} />
            </button>
          </div>
        ) : null}

        {/* Chủ đề sử học đóng góp */}
        {computedStats.topTopics.length > 0 && (
          <div className="mt-5 border-t border-[#E5DAC4] pt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#14233F]">
                <Hash size={14} className="text-[#8A5A19]" />
                <span>Chủ đề sử học đóng góp</span>
              </span>
              {selectedTopic ? (
                <button
                  type="button"
                  onClick={() => setSelectedTopic(null)}
                  className="text-[12px] font-semibold text-[#7A1F24] hover:underline"
                >
                  Bỏ lọc
                </button>
              ) : null}
            </div>

            <div className="space-y-2.5">
              {computedStats.topTopics.map((item, idx) => {
                const isSelected = selectedTopic?.toLowerCase() === item.tag.toLowerCase();
                const widthPct = Math.max(18, Math.round((item.count / maxTopicCount) * 100));
                return (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      setSelectedTopic((prev) =>
                        prev?.toLowerCase() === item.tag.toLowerCase() ? null : item.tag,
                      );
                      onTopicClick?.();
                    }}
                    className={`block w-full rounded-[5px] px-2.5 py-1.5 text-left transition-colors ${
                      isSelected ? 'bg-[#F1E6D0]' : 'hover:bg-[#F3EAD8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span
                        className={`truncate font-medium ${
                          isSelected ? 'font-semibold text-[#7A1F24]' : 'text-[#14233F]'
                        }`}
                      >
                        #{item.tag}
                      </span>
                      <span className="shrink-0 text-[12px] text-[#5C4E3C] tabular-nums">
                        {item.count} <span className="text-[#6E5D4B]">bài</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-[3px] w-full rounded-full bg-[#E5DAC4]">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className={`h-full rounded-full ${
                          idx === 0 || isSelected ? 'bg-[#7A1F24]' : 'bg-[#8A7963]'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Gợi ý kết nối các nhà nghiên cứu khác */}
        <div className="mt-5 border-t border-[#E5DAC4] pt-4">
          <p className="mb-2.5 text-[13px] font-semibold text-[#14233F]">
            Thành viên cùng lĩnh vực
          </p>
          <div className="space-y-2">
            {suggestedMembers
              .filter(
                (m) =>
                  m.username.toLowerCase() !== profile.user.username.toLowerCase() &&
                  m.id !== profile.user.id,
              )
              .slice(0, 3)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-2 rounded-[6px] border border-[#E5DAC4] bg-[#FDF9F0] px-3 py-2"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/cong-dong/thanh-vien/${encodeURIComponent(member.username)}`}
                      className="block truncate text-[13px] font-semibold text-[#14233F] hover:text-[#7A1F24]"
                    >
                      {member.displayName}
                    </Link>
                    <p className="text-[12px] text-[#6E5D4B] tabular-nums">
                      {member.postCount} bài · {member.followerCount} theo dõi
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onToggleFollowOtherMember(member)}
                    className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-[5px] border px-2 text-[12px] font-semibold transition-colors ${
                      member.followedByMe
                        ? 'border-[#D8C8AA] bg-[#F1E6D0] text-[#5C4E3C]'
                        : 'border-[#7A1F24] bg-[#7A1F24] text-[#FAF5E6]'
                    }`}
                  >
                    {member.followedByMe ? 'Đã theo dõi' : 'Theo dõi'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </aside>
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
