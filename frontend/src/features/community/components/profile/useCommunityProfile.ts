'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { API_BASE_URL } from '@/constants/api-url';
import { UserRole } from '@/constants/enums';
import { ComposerMode } from '@/constants/community.constant';
import {
  CommunityApi,
  extractCommunityContent,
  getFallbackSuggestedMembers,
  type CommunityMemberProfile,
  type CommunityMemberSummary,
  type CommunityPost,
} from '../../api';
import {
  type CommunityProfileViewProps,
  type ProfileComputedStats,
  ProfileTabKey,
} from './profile.types';

const SOCKET_URL = API_BASE_URL;

export function useCommunityProfile({
  initialProfile,
  identifier,
  isPersonalRoute = false,
}: CommunityProfileViewProps) {
  const sessionUser = useAuthSession();

  const [profile, setProfile] = useState<CommunityMemberProfile>(initialProfile);
  const [suggestedMembers, setSuggestedMembers] = useState<CommunityMemberSummary[]>(() =>
    getFallbackSuggestedMembers().slice(0, 5),
  );
  const [activeTab, setActiveTab] = useState<ProfileTabKey>(ProfileTabKey.POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  // Chỉnh sửa hồ sơ cá nhân
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editFirstName, setEditFirstName] = useState(initialProfile.user.firstName || '');
  const [editLastName, setEditLastName] = useState(initialProfile.user.lastName || '');
  const [editBio, setEditBio] = useState(initialProfile.user.bio || '');
  const [savingBio, setSavingBio] = useState(false);
  const [bioSavedNotice, setBioSavedNotice] = useState<string | null>(null);

  // Khung đăng bài nhanh / chia sẻ bài Blog
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>(ComposerMode.QUESTION);

  // Tải dữ liệu hồ sơ thực tế theo phiên đăng nhập trên client
  const refreshProfile = useCallback(async () => {
    try {
      let fetched: CommunityMemberProfile;
      if (isPersonalRoute) {
        if (sessionUser?.username) {
          fetched = await CommunityApi.getMyCommunityProfile();
        } else {
          fetched = await CommunityApi.getCommunityProfile('author-1');
          fetched = { ...fetched, isMe: true };
        }
      } else {
        fetched = await CommunityApi.getCommunityProfile(identifier);
        if (
          sessionUser?.id &&
          (fetched.user.id === sessionUser.id ||
            fetched.user.username.toLowerCase() === sessionUser.username.toLowerCase())
        ) {
          fetched = { ...fetched, isMe: true };
        }
      }
      setProfile(fetched);
      setEditFirstName(fetched.user.firstName || '');
      setEditLastName(fetched.user.lastName || '');
      setEditBio(fetched.user.bio || '');
    } catch {
      // Giữ nguyên dữ liệu SSR fallback nếu mạng gián đoạn
    }
  }, [identifier, isPersonalRoute, sessionUser]);

  useEffect(() => {
    let active = true;
    void refreshProfile().then(() => {
      if (!active) return;
    });
    void CommunityApi.getSuggestedMembers(5).then((list) => {
      if (!active) return;
      setSuggestedMembers(list);
    });
    return () => {
      active = false;
    };
  }, [refreshProfile]);

  // Đồng bộ thời gian thực qua Socket.io khi có lượt thích hoặc theo dõi mới
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on(
      'user:follow-updated',
      (payload: { targetUserId?: string; followerCount?: number }) => {
        if (!payload?.targetUserId || typeof payload.followerCount !== 'number') return;
        if (payload.targetUserId === profile.user.id) {
          setProfile((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              followerCount: Math.max(0, payload.followerCount!),
            },
          }));
        }
      },
    );

    socket.on('post:like-updated', (payload: { postId?: string; likeCount?: number }) => {
      if (!payload?.postId || typeof payload.likeCount !== 'number') return;
      setProfile((prev) => {
        const updatedPosts = prev.posts.map((p) =>
          p.id === payload.postId ? { ...p, likeCount: Math.max(0, payload.likeCount!) } : p,
        );
        const nextTotalLikes = updatedPosts.reduce((sum, p) => sum + p.likeCount, 0);
        return {
          ...prev,
          posts: updatedPosts,
          stats: {
            ...prev.stats,
            totalLikesReceived: nextTotalLikes,
          },
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [profile.user.id]);

  // Tính lại các chỉ số từ danh sách thực tế
  const computedStats: ProfileComputedStats = useMemo(() => {
    const postCount = profile.posts.length;
    let sharedBlogCount = 0;
    let totalLikesReceived = 0;
    let totalCommentsReceived = 0;
    let totalViewsReceived = 0;
    const topicMap = new Map<string, number>();

    for (const post of profile.posts) {
      totalLikesReceived += post.likeCount;
      totalCommentsReceived += post.commentCount;
      totalViewsReceived += post.viewCount;
      const parsed = extractCommunityContent(post);
      if (parsed.sharedBlog) {
        sharedBlogCount += 1;
      }
      for (const tag of parsed.tags) {
        topicMap.set(tag, (topicMap.get(tag) || 0) + 1);
      }
    }

    const questionPostCount = Math.max(0, postCount - sharedBlogCount);
    const topTopics =
      profile.topTopics.length > 0
        ? profile.topTopics
        : Array.from(topicMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tag, count]) => ({ tag, count }));

    return {
      postCount,
      sharedBlogCount,
      questionPostCount,
      followerCount: profile.followers.length,
      followingCount: profile.following.length,
      totalLikesReceived,
      totalCommentsReceived,
      totalViewsReceived,
      topTopics,
    };
  }, [profile.followers.length, profile.following.length, profile.posts, profile.topTopics]);

  const isMe =
    profile.isMe ||
    isPersonalRoute ||
    Boolean(
      sessionUser?.id &&
        (sessionUser.id === profile.user.id ||
          sessionUser.username.toLowerCase() === profile.user.username.toLowerCase()),
    );

  const handleToggleFollowProfile = async () => {
    if (followLoading || isMe) return;
    const nextFollowed = !profile.followedByMe;
    const viewerUsername = sessionUser?.username || 'Bạn (Thành viên HISGO)';
    const viewerId = sessionUser?.id || 'viewer-local';

    setProfile((prev) => {
      const nextFollowers = nextFollowed
        ? [
            {
              id: viewerId,
              username: viewerUsername,
              displayName: viewerUsername,
              role: UserRole.USER,
              bio: 'Thành viên đang theo dõi các thảo luận lịch sử trên HISGO.',
              avatarUrl: null,
              postCount: 1,
              followerCount: 1,
              followingCount: 1,
              followedByMe: false,
              isMe: true,
            },
            ...prev.followers.filter((f) => f.id !== viewerId && f.username !== viewerUsername),
          ]
        : prev.followers.filter((f) => f.id !== viewerId && f.username !== viewerUsername);

      return {
        ...prev,
        followedByMe: nextFollowed,
        followers: nextFollowers,
      };
    });

    setFollowLoading(true);
    try {
      await CommunityApi.toggleFollow(profile.user.username);
    } catch {
      // Giữ trạng thái local fallback
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleFollowOtherMember = async (target: CommunityMemberSummary) => {
    const nextFollowed = !target.followedByMe;
    const updateList = (list: CommunityMemberSummary[]) =>
      list.map((m) =>
        m.id === target.id || m.username === target.username
          ? {
              ...m,
              followedByMe: nextFollowed,
              followerCount: Math.max(0, m.followerCount + (nextFollowed ? 1 : -1)),
            }
          : m,
      );

    setProfile((prev) => ({
      ...prev,
      followers: updateList(prev.followers),
      following: updateList(prev.following),
    }));
    setSuggestedMembers((prev) => updateList(prev));

    try {
      await CommunityApi.toggleFollow(target.username);
    } catch {
      // Fallback handled in CommunityApi
    }
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBio(true);
    setBioSavedNotice(null);
    try {
      const updated = await CommunityApi.updateMyCommunityProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        bio: editBio.trim(),
      });
      setProfile((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          firstName: editFirstName.trim() || null,
          lastName: editLastName.trim() || null,
          displayName:
            [editFirstName.trim(), editLastName.trim()].filter(Boolean).join(' ').trim() ||
            prev.user.username,
          bio: editBio.trim() || null,
        },
        ...(updated?.user ? { isMe: true } : {}),
      }));
      setIsEditingBio(false);
      setBioSavedNotice('Đã lưu thông tin hồ sơ sử học cá nhân.');
    } finally {
      setSavingBio(false);
    }
  };

  const handleCreatedPost = (created: CommunityPost) => {
    setProfile((prev) => ({
      ...prev,
      posts: [created, ...prev.posts.filter((p) => p.id !== created.id)],
    }));
    setActiveTab(ProfileTabKey.POSTS);
  };

  const handleLikeUpdate = (postId: string, liked: boolean, likeCount: number) => {
    setProfile((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, likedByMe: liked, likeCount } : p)),
      bookmarkedPosts: prev.bookmarkedPosts.map((p) =>
        p.id === postId ? { ...p, likedByMe: liked, likeCount } : p,
      ),
    }));
  };

  const handleBookmarkUpdate = (postId: string, bookmarked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, bookmarkedByMe: bookmarked } : p)),
      bookmarkedPosts: bookmarked
        ? prev.bookmarkedPosts
        : prev.bookmarkedPosts.filter((p) => p.id !== postId),
    }));
  };

  const filteredPosts = useMemo(() => {
    const source = activeTab === ProfileTabKey.SAVED ? profile.bookmarkedPosts : profile.posts;
    return source.filter((post) => {
      const parsed = extractCommunityContent(post);
      if (activeTab === ProfileTabKey.SHARED_BLOG && !parsed.sharedBlog) {
        return false;
      }
      if (selectedTopic) {
        const hasTopic = parsed.tags.some(
          (t) => t.toLowerCase() === selectedTopic.toLowerCase(),
        );
        if (!hasTopic) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = post.title.toLowerCase().includes(q);
        const inExcerpt = (post.excerpt || '').toLowerCase().includes(q);
        const inTags = parsed.tags.some((t) => t.toLowerCase().includes(q));
        return inTitle || inExcerpt || inTags;
      }
      return true;
    });
  }, [activeTab, profile.bookmarkedPosts, profile.posts, searchQuery, selectedTopic]);

  const filteredMembers = useMemo(() => {
    const source = activeTab === ProfileTabKey.FOLLOWERS ? profile.followers : profile.following;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.trim().toLowerCase();
    return source.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        (m.bio || '').toLowerCase().includes(q),
    );
  }, [activeTab, profile.followers, profile.following, searchQuery]);

  return {
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
  };
}
