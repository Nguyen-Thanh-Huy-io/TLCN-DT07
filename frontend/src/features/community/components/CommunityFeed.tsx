'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, MessageSquarePlus, Bookmark } from 'lucide-react';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { CommunityApi, getFallbackSuggestedMembers, type CommunityMemberSummary, type CommunityPost } from '../api';
import { CommunityTabKey, ComposerMode, COMMUNITY_TAB_LABELS } from '@/constants/enums';
import { QuickComposer } from './QuickComposer';
import { CommunitySidebar } from './CommunitySidebar';
import { useCommunityRealtimeSocket } from '../hooks/useCommunityFeedHooks';
import { useCommunityPaging } from '../hooks/useCommunityFeedHooks';
import { computePopularTags, fetchTabFeedPosts, matchesPostFilter, updateFollowedAuthorsMap, updateSuggestedMembersList } from '../utils/community-feed.helper';
import { PostCard } from './PostCard';

export type { CommunityTabKey };

const PAGE_SIZE = 8;

interface CommunityFeedProps {
  initialPosts: CommunityPost[];
  initialShareBlogSlug?: string | null;
}

export function CommunityFeed({ initialPosts, initialShareBlogSlug = null }: CommunityFeedProps) {
  const router = useRouter();
  const user = useAuthSession();

  const [activeTab, setActiveTab] = useState<CommunityTabKey>(CommunityTabKey.ALL);
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [suggestedMembers, setSuggestedMembers] = useState<CommunityMemberSummary[]>(() =>
    getFallbackSuggestedMembers().slice(0, 4),
  );
  const [followedAuthors, setFollowedAuthors] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(Boolean(initialShareBlogSlug));
  const [composerMode, setComposerMode] = useState<ComposerMode>(
    initialShareBlogSlug ? ComposerMode.SHARE_BLOG : ComposerMode.QUESTION,
  );
  const [preselectedBlogSlug, setPreselectedBlogSlug] = useState<string | null>(
    initialShareBlogSlug,
  );
  const [prevShareSlug, setPrevShareSlug] = useState(initialShareBlogSlug);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  if (initialShareBlogSlug !== prevShareSlug) {
    setPrevShareSlug(initialShareBlogSlug);
    if (initialShareBlogSlug) {
      setPreselectedBlogSlug(initialShareBlogSlug);
      setComposerMode(ComposerMode.SHARE_BLOG);
      setComposerOpen(true);
    }
  }

  useEffect(() => {
    let active = true;
    void CommunityApi.getSuggestedMembers(4).then((list) => {
      if (!active) return;
      setSuggestedMembers(list);
      setFollowedAuthors((prev) => {
        const next = { ...prev };
        for (const item of list) {
          next[item.id.toLowerCase()] = item.followedByMe;
          next[item.username.toLowerCase()] = item.followedByMe;
        }
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const loadTabFeed = useCallback(
    async (tab: CommunityTabKey) => {
      setIsLoading(true);
      setErrorMsg('');

      try {
        const result = await fetchTabFeedPosts(tab, user?.id, initialPosts, PAGE_SIZE);
        setPosts(result.posts);
        setHasMore(result.hasMore);
      } catch {
        if (tab !== CommunityTabKey.SAVED && initialPosts.length > 0) {
          setPosts(initialPosts);
          setHasMore(false);
        } else {
          setErrorMsg('Không thể tải danh sách bài thảo luận.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [initialPosts, user],
  );

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void loadTabFeed(activeTab);
      }
    });
    return () => {
      active = false;
    };
  }, [activeTab, loadTabFeed]);

  useCommunityRealtimeSocket({
    activeTab,
    userId: user?.id,
    loadTabFeed,
    setPosts,
    setSuggestedMembers,
    setRealtimeNotice,
  });

  const { isLoadingMore, loadMorePosts } = useCommunityPaging({
    posts,
    activeTab,
    hasMore,
    setPosts,
    setHasMore,
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || activeTab === CommunityTabKey.SAVED || activeTab === CommunityTabKey.SHARED_BLOG) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMorePosts();
        }
      },
      { rootMargin: '220px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, hasMore, loadMorePosts]);

  const isAuthorFollowed = useCallback(
    (author?: { id: string; username: string; followedByMe?: boolean } | null) => {
      if (!author) return false;
      const byId = followedAuthors[author.id.toLowerCase()];
      if (byId !== undefined) return byId;
      const byName = followedAuthors[author.username.toLowerCase()];
      if (byName !== undefined) return byName;
      return Boolean(author.followedByMe);
    },
    [followedAuthors],
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((post) =>
      matchesPostFilter(post, activeTab, isAuthorFollowed, selectedTag, searchQuery),
    );
  }, [activeTab, isAuthorFollowed, posts, searchQuery, selectedTag]);

  const popularTags = useMemo(() => computePopularTags(posts), [posts]);

  const handleOpenComposer = (mode: ComposerMode = ComposerMode.QUESTION) => {
    if (!user?.id) {
      router.push('/login?redirect=/cong-dong');
      return;
    }
    setPreselectedBlogSlug(null);
    setComposerMode(mode);
    setComposerOpen(true);
  };

  const handleCreatedPost = (created: CommunityPost) => {
    setPosts((current) => [created, ...current.filter((p) => p.id !== created.id)]);
    if (activeTab === CommunityTabKey.SAVED) {
      setActiveTab(CommunityTabKey.ALL);
    }
  };

  const handleLikeUpdate = (postId: string, liked: boolean, likeCount: number) => {
    setPosts((current) =>
      current.map((p) => (p.id === postId ? { ...p, likedByMe: liked, likeCount } : p)),
    );
  };

  const handleBookmarkUpdate = (postId: string, bookmarked: boolean) => {
    setPosts((current) => {
      if (activeTab === CommunityTabKey.SAVED && !bookmarked) {
        return current.filter((p) => p.id !== postId);
      }
      return current.map((p) => (p.id === postId ? { ...p, bookmarkedByMe: bookmarked } : p));
    });
  };

  const handleFollowUpdate = useCallback(
    (identifier: string, following: boolean, followerCount?: number) => {
      setFollowedAuthors((prev) =>
        updateFollowedAuthorsMap(prev, identifier, following, suggestedMembers),
      );
      setSuggestedMembers((current) =>
        updateSuggestedMembersList(current, identifier, following, followerCount),
      );
    },
    [suggestedMembers],
  );

  const handleToggleFollowMemberCard = async (member: CommunityMemberSummary) => {
    const nextState = !isAuthorFollowed(member);
    handleFollowUpdate(member.username, nextState);
    try {
      const res = await CommunityApi.toggleFollow(member.username);
      handleFollowUpdate(member.username, res.following, res.followerCount);
    } catch {
      handleFollowUpdate(member.username, !nextState);
    }
  };

  const myProfileHref = user?.username
    ? `/cong-dong/thanh-vien/${encodeURIComponent(user.username)}`
    : '/cong-dong/ca-nhan';

  const resetFilters = () => {
    setSelectedTag(null);
    setSearchQuery('');
    if (activeTab === CommunityTabKey.FOLLOWING) {
      setActiveTab(CommunityTabKey.ALL);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[350px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] lg:gap-8">
        <CommunitySidebar
          myProfileHref={myProfileHref}
          username={user?.username}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          popularTags={popularTags}
          suggestedMembers={suggestedMembers}
          isAuthorFollowed={(m) => isAuthorFollowed(m)}
          onToggleFollowMember={(m) => void handleToggleFollowMemberCard(m)}
        />

        <div className="min-w-0 space-y-6">
          {realtimeNotice ? (
            <div className="flex items-start justify-between gap-3 rounded-[8px] border border-[#E8C5C6] bg-[#F9E8E6] px-4 py-3 text-[13px] text-[#7A1F24]">
              <div className="flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <span>{realtimeNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setRealtimeNotice(null)}
                aria-label="Đóng thông báo"
                className="text-[#7A1F24] hover:opacity-75"
              >
                ×
              </button>
            </div>
          ) : null}

          <CommunityFeedAskBanner
            username={user?.username}
            onOpenComposer={() => handleOpenComposer(ComposerMode.QUESTION)}
          />

          <CommunityFeedFilterBar
            activeTab={activeTab}
            selectedTag={selectedTag}
            searchQuery={searchQuery}
            totalPosts={filteredPosts.length}
            onResetFilters={resetFilters}
          />

          <CommunityFeedListSection
            errorMsg={errorMsg}
            isLoading={isLoading}
            filteredPosts={filteredPosts}
            activeTab={activeTab}
            isLoggedIn={Boolean(user?.id)}
            selectedTag={selectedTag}
            searchQuery={searchQuery}
            onResetFilters={resetFilters}
            onRetryLoadTab={() => void loadTabFeed(activeTab)}
            onSelectTag={(tag) =>
              setSelectedTag((current) =>
                current?.toLowerCase() === tag.toLowerCase() ? null : tag,
              )
            }
            onLikeUpdate={handleLikeUpdate}
            onBookmarkUpdate={handleBookmarkUpdate}
            isAuthorFollowed={isAuthorFollowed}
            currentUserId={user?.id}
            onFollowUpdate={handleFollowUpdate}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMorePosts={() => void loadMorePosts()}
            sentinelRef={sentinelRef}
          />
        </div>
      </div>

      <QuickComposer
        isOpen={composerOpen}
        initialMode={composerMode}
        initialSharedBlogSlug={preselectedBlogSlug}
        onClose={() => setComposerOpen(false)}
        onCreated={handleCreatedPost}
      />
    </div>
  );
}

// --- CommunityFeedAskBanner.tsx ---
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

// --- CommunityFeedEmptyState.tsx ---
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

// --- CommunityFeedFilterBar.tsx ---
interface CommunityFeedFilterBarProps {
  activeTab: CommunityTabKey;
  selectedTag: string | null;
  searchQuery: string;
  totalPosts: number;
  onResetFilters: () => void;
}

export function CommunityFeedFilterBar({
  activeTab,
  selectedTag,
  searchQuery,
  totalPosts,
  onResetFilters,
}: CommunityFeedFilterBarProps) {
  const hasFilter = Boolean(selectedTag || searchQuery.trim() || activeTab !== CommunityTabKey.ALL);
  if (!hasFilter) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-[#F1E6D0] px-4 py-2.5 text-[13px] text-[#5C4E3C]">
      <div className="flex flex-wrap items-center gap-2">
        <span>Đang hiển thị:</span>
        <strong className="text-[#14233F]">
          {COMMUNITY_TAB_LABELS[activeTab]}
        </strong>
        {selectedTag ? (
          <span className="rounded-[4px] bg-[#7A1F24] px-2 py-0.5 text-[12px] font-semibold text-[#FAF5E6]">
            #{selectedTag}
          </span>
        ) : null}
        {searchQuery.trim() ? (
          <span className="rounded-[4px] bg-[#FAF5E6] px-2 py-0.5 text-[12px] font-semibold text-[#14233F]">
            Từ khóa: &ldquo;{searchQuery.trim()}&rdquo;
          </span>
        ) : null}
        <span className="text-[#7A6B57] tabular-nums">
          ({totalPosts} bài viết)
        </span>
      </div>

      <button
        type="button"
        onClick={onResetFilters}
        className="font-semibold text-[#7A1F24] hover:underline"
      >
        Đặt lại mặc định
      </button>
    </div>
  );
}

// --- CommunityFeedListSection.tsx ---
interface CommunityFeedListSectionProps {
  errorMsg: string;
  isLoading: boolean;
  filteredPosts: CommunityPost[];
  activeTab: CommunityTabKey;
  isLoggedIn: boolean;
  selectedTag: string | null;
  searchQuery: string;
  onResetFilters: () => void;
  onRetryLoadTab: () => void;
  onSelectTag: (tag: string) => void;
  onLikeUpdate: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate: (postId: string, bookmarked: boolean) => void;
  isAuthorFollowed: (author?: { id: string; username: string; followedByMe?: boolean } | null) => boolean;
  currentUserId?: string;
  onFollowUpdate: (identifier: string, following: boolean, followerCount?: number) => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMorePosts: () => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function CommunityFeedListSection({
  errorMsg,
  isLoading,
  filteredPosts,
  activeTab,
  isLoggedIn,
  selectedTag,
  searchQuery,
  onResetFilters,
  onRetryLoadTab,
  onSelectTag,
  onLikeUpdate,
  onBookmarkUpdate,
  isAuthorFollowed,
  currentUserId,
  onFollowUpdate,
  isLoadingMore,
  hasMore,
  onLoadMorePosts,
  sentinelRef,
}: CommunityFeedListSectionProps) {
  if (errorMsg) {
    return (
      <div className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-6 text-[14px] text-[#7A1F24]">
        <p>{errorMsg}</p>
        <button
          type="button"
          onClick={onRetryLoadTab}
          className="mt-2 font-semibold text-[#14233F] underline"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-6 md:p-8"
            aria-hidden="true"
          >
            <div className="h-5 w-44 rounded-[4px] bg-[#EFE5D2]" />
            <div className="mt-4 h-7 w-3/4 rounded-[4px] bg-[#EFE5D2]" />
            <div className="mt-3 h-4 w-full rounded-[4px] bg-[#F5EDE0]" />
            <div className="mt-2 h-4 w-2/3 rounded-[4px] bg-[#F5EDE0]" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <CommunityFeedEmptyState
        activeTab={activeTab}
        isLoggedIn={isLoggedIn}
        selectedTag={selectedTag}
        searchQuery={searchQuery}
        onResetFilter={onResetFilters}
      />
    );
  }

  const showPagination =
    isLoadingMore ||
    (hasMore &&
      activeTab !== CommunityTabKey.SAVED &&
      activeTab !== CommunityTabKey.SHARED_BLOG);

  return (
    <div className="space-y-6">
      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          activeTag={selectedTag}
          onSelectTag={onSelectTag}
          onLikeUpdate={onLikeUpdate}
          onBookmarkUpdate={onBookmarkUpdate}
          isFollowedAuthor={isAuthorFollowed(post.author)}
          isOwnPost={Boolean(currentUserId && post.author?.id === currentUserId)}
          onFollowUpdate={onFollowUpdate}
        />
      ))}

      {showPagination ? (
        <div ref={sentinelRef} className="pt-2 text-center">
          {isLoadingMore ? (
            <span className="text-[14px] text-[#6E5D4B]">Đang tải thêm bài thảo luận...</span>
          ) : (
            <button
              type="button"
              onClick={onLoadMorePosts}
              className="h-10 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-5 text-[14px] font-medium text-[#14233F] hover:border-[#8A5A19]"
            >
              Tải thêm thảo luận
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
