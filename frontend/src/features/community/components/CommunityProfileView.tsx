'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Check,
  Edit3,
  FileText,
  Hash,
  Layers,
  Plus,
  Search,
  Share2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuthSession } from '@/services/auth/useAuthSession';
import {
  CommunityApi,
  extractCommunityContent,
  getFallbackSuggestedMembers,
  type CommunityMemberProfile,
  type CommunityMemberSummary,
  type CommunityPost,
} from '../api';
import { API_BASE_URL } from '@/constants/api-url';
import { PostCard } from './PostCard';
import { QuickComposer, type ComposerMode } from './QuickComposer';
import { getAuthorTint, getInitials } from '../utils/author-avatar.util';

export type ProfileTabKey = 'posts' | 'shared_blog' | 'followers' | 'following' | 'saved';

const SOCKET_URL = API_BASE_URL;

function formatJoinDate(iso?: string | null) {
  if (!iso) return 'Tháng 8, 2026';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Tháng 8, 2026';
  return `Tham gia tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

function getRoleLabel(role?: string) {
  if (role === 'ADMIN' || role === 'SUPERADMIN') return 'Hội đồng Thẩm định';
  if (role === 'MODERATOR') return 'Biên tập viên Sử học';
  return 'Thành viên Cộng đồng';
}

interface CommunityProfileViewProps {
  initialProfile: CommunityMemberProfile;
  identifier: string;
  isPersonalRoute?: boolean;
}

export function CommunityProfileView({
  initialProfile,
  identifier,
  isPersonalRoute = false,
}: CommunityProfileViewProps) {
  const sessionUser = useAuthSession();

  const [profile, setProfile] = useState<CommunityMemberProfile>(initialProfile);
  const [suggestedMembers, setSuggestedMembers] = useState<CommunityMemberSummary[]>(() =>
    getFallbackSuggestedMembers().slice(0, 5),
  );
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('posts');
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
  const [composerMode, setComposerMode] = useState<ComposerMode>('question');

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
  }, [identifier, isPersonalRoute, sessionUser?.id, sessionUser?.username]);

  useEffect(() => {
    void refreshProfile();
    void CommunityApi.getSuggestedMembers(5).then((list) => {
      setSuggestedMembers(list);
    });
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

  // Tính lại các chỉ số từ danh sách thực tế để đảm bảo 100% số liệu khớp nhau (references/app-screens.md §2.1)
  const computedStats = useMemo(() => {
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
              role: 'USER',
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
    setActiveTab('posts');
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
    const source = activeTab === 'saved' ? profile.bookmarkedPosts : profile.posts;
    return source.filter((post) => {
      const parsed = extractCommunityContent(post);
      if (activeTab === 'shared_blog' && !parsed.sharedBlog) {
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
    const source = activeTab === 'followers' ? profile.followers : profile.following;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.trim().toLowerCase();
    return source.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        (m.bio || '').toLowerCase().includes(q),
    );
  }, [activeTab, profile.followers, profile.following, searchQuery]);

  const tint = getAuthorTint(profile.user.username);
  const maxTopicCount = Math.max(1, ...(computedStats.topTopics.map((t) => t.count) || [1]));

  const tabs: Array<{ key: ProfileTabKey; label: string; count: number; icon: React.ElementType }> =
    [
      {
        key: 'posts',
        label: 'Bài đã đăng',
        count: computedStats.postCount,
        icon: Layers,
      },
      {
        key: 'shared_blog',
        label: 'Bài Blog chia sẻ',
        count: computedStats.sharedBlogCount,
        icon: Share2,
      },
      {
        key: 'followers',
        label: 'Người theo dõi',
        count: computedStats.followerCount,
        icon: Users,
      },
      {
        key: 'following',
        label: 'Đang theo dõi',
        count: computedStats.followingCount,
        icon: UserCheck,
      },
      ...(isMe
        ? [
            {
              key: 'saved' as const,
              label: 'Đã lưu',
              count: profile.bookmarkedPosts.length,
              icon: Bookmark,
            },
          ]
        : []),
    ];

  /*
   * Grid arithmetic (references/app-screens.md §2.4 & §4.2):
   * Outer max-width: 1280px, horizontal padding 32px each side on desktop = 1216px inner canvas.
   * Left rail: 300px + 32px gap + 884px center canvas = 1216px.
   * Divided KPI strip: 4 equal columns (884 / 4 = 221px each) separated by 1px hairlines.
   */
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
        {/* CỘT TRÁI (LEFT RAIL): Hồ sơ định danh, hướng nghiên cứu, chủ đề đóng góp & gợi ý kết nối */}
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
                    onClick={() => {
                      setComposerMode('question');
                      setComposerOpen(true);
                    }}
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
                    onClick={() => void handleToggleFollowProfile()}
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

            {/* Biểu mẫu chỉnh sửa hồ sơ sử học (references/app-screens.md §8.1: Label above field) */}
            {isMe && isEditingBio && (
              <form
                onSubmit={(e) => void handleSaveBio(e)}
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

            {/* Chủ đề sử học đóng góp (Bar list với thanh 2px tỷ lệ — references/app-screens.md §7.9) */}
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
                    const isSelected =
                      selectedTopic?.toLowerCase() === item.tag.toLowerCase();
                    const widthPct = Math.max(18, Math.round((item.count / maxTopicCount) * 100));
                    return (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => {
                          setSelectedTopic((prev) =>
                            prev?.toLowerCase() === item.tag.toLowerCase() ? null : item.tag,
                          );
                          if (activeTab === 'followers' || activeTab === 'following') {
                            setActiveTab('posts');
                          }
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
                        onClick={() => void handleToggleFollowOtherMember(member)}
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

        {/* VÙNG TRUNG TÂM (CENTER CANVAS): Tiêu đề h1, Dải KPI chia vạch 1px, Tabs gạch chân & Nội dung */}
        <div className="min-w-0 space-y-6">
          {/* Khung Header & Divided KPI Strip (references/app-screens.md §4.3 & §5) */}
          <div className="rounded-[8px] border border-[#E3D6BE] bg-[#FAF5E6] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-[22px] font-bold leading-snug text-[#14233F]">
                  {isMe
                    ? `Hồ sơ Cộng đồng: ${profile.user.displayName}`
                    : profile.user.displayName}
                </h1>
                {/* The screen's one finding */}
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
                    onClick={() => {
                      setComposerMode('share_blog');
                      setComposerOpen(true);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-3.5 text-[13px] font-semibold text-[#14233F] transition-colors hover:border-[#8A5A19]"
                  >
                    <Share2 size={14} className="text-[#8A5A19]" />
                    <span>Chia sẻ bài từ Blog</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleToggleFollowProfile()}
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

            {/* Divided KPI Strip (1 container split by 1px hairlines, label above value, tabular-nums) */}
            <div className="mt-5 grid grid-cols-2 divide-y divide-[#E3D6BE] rounded-[6px] border border-[#E3D6BE] bg-[#FDF9F0] md:grid-cols-4 md:divide-x md:divide-y-0">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
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
                onClick={() => setActiveTab('followers')}
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
                onClick={() => setActiveTab('following')}
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

            {/* Underline Tabs trên đường kẻ 1px + Thanh tìm kiếm (references/app-screens.md §4.4) */}
            <div className="mt-6 border-b border-[#E3D6BE]">
              <div className="flex flex-wrap items-center gap-6">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
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

            {/* Thanh công cụ lọc nhanh (Toolbar: search 280x34 bên trái, tổng số bên phải) */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-[296px]">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6E5D4B]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'followers' || activeTab === 'following'
                      ? 'Tìm theo tên hoặc hướng nghiên cứu...'
                      : 'Tìm trong các bài thảo luận...'
                  }
                  aria-label="Tìm kiếm trong hồ sơ"
                  className="h-9 w-full rounded-[6px] border border-[#DFD1B8] bg-[#FDF9F0] pl-8 pr-7 text-[13.5px] text-[#14233F] placeholder:text-[#6E5D4B] outline-none focus:border-[#8A5A19]"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
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
                      onClick={() => setSelectedTopic(null)}
                      aria-label="Xóa lọc chủ đề"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : null}
                <span>
                  Hiển thị{' '}
                  <strong className="text-[#14233F]">
                    {activeTab === 'followers' || activeTab === 'following'
                      ? filteredMembers.length
                      : filteredPosts.length}
                  </strong>{' '}
                  {activeTab === 'followers' || activeTab === 'following'
                    ? 'thành viên'
                    : 'bài viết'}
                </span>
              </div>
            </div>
          </div>

          {/* Nội dung theo Tab */}
          {activeTab === 'followers' || activeTab === 'following' ? (
            <div className="rounded-[8px] border border-[#E3D6BE] bg-[#FDF9F0] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[#14233F]">
                  {activeTab === 'followers'
                    ? `Thành viên đang theo dõi ${profile.user.displayName}`
                    : `Thành viên được ${profile.user.displayName} theo dõi`}
                </h2>
                <span className="text-[13px] text-[#5C4E3C] tabular-nums">
                  {filteredMembers.length} tài khoản
                </span>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="rounded-[8px] border border-dashed border-[#D8C8AA] p-8 text-center">
                  <p className="text-[14px] text-[#5C4E3C]">
                    {activeTab === 'followers'
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
                              onClick={() => void handleToggleFollowOtherMember(member)}
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
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
              <h2 className="text-[16px] font-semibold text-[#14233F]">
                {activeTab === 'saved'
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
                  onClick={() => {
                    setSelectedTopic(null);
                    setSearchQuery('');
                  }}
                  className="mt-3.5 h-9 rounded-[6px] border border-[#D8C8AA] bg-[#F1E6D0] px-4 text-[13px] font-medium text-[#14233F]"
                >
                  Hiển thị toàn bộ bài viết
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  activeTag={selectedTopic}
                  onSelectTag={(tag) =>
                    setSelectedTopic((prev) =>
                      prev?.toLowerCase() === tag.toLowerCase() ? null : tag,
                    )
                  }
                  onLikeUpdate={handleLikeUpdate}
                  onBookmarkUpdate={handleBookmarkUpdate}
                  showFollowButton={false}
                />
              ))}
            </div>
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
