'use client';

import { Bookmark, Layers, Share2, UserCheck, Users } from 'lucide-react';
import { ComposerMode } from '@/constants/enums';
import { QuickComposer } from './QuickComposer';
import { useCommunityProfile } from '../hooks/useCommunityProfile';
import { type CommunityMemberProfile } from '../api';
import { ProfileHeaderKpi, ProfileMembersList, ProfilePostsList, ProfileTabsToolbar, ProfileTabKey } from './CommunityProfileParts';
import type { ProfileTabItem } from './CommunityProfileParts';
import { ProfileSidebar } from './ProfileSidebar';

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

export interface CommunityProfileViewProps {
  initialProfile: CommunityMemberProfile;
  identifier: string;
  isPersonalRoute?: boolean;
}

export { ProfileTabKey } from './CommunityProfileParts';

export type { ProfileComputedStats } from './CommunityProfileParts';
