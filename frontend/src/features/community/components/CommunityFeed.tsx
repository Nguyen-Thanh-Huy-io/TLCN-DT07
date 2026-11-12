'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuthSession } from '@/services/auth/use-auth-session';
import {
  CommunityApi,
  getFallbackSuggestedMembers,
  type CommunityMemberSummary,
  type CommunityPost,
} from '../api';
import {
  CommunityTabKey,
  ComposerMode,
} from '@/constants/community.constant';
import { QuickComposer } from './QuickComposer';
import { CommunitySidebar } from './CommunitySidebar';
import { CommunityFeedFilterBar } from './CommunityFeedFilterBar';
import { CommunityFeedAskBanner } from './CommunityFeedAskBanner';
import { CommunityFeedListSection } from './CommunityFeedListSection';
import { useCommunityRealtimeSocket } from '../hooks/useCommunityRealtimeSocket';
import { useCommunityPaging } from '../hooks/useCommunityPaging';
import {
  computePopularTags,
  fetchTabFeedPosts,
  matchesPostFilter,
  updateFollowedAuthorsMap,
  updateSuggestedMembersList,
} from '../utils/community-feed.helper';

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
