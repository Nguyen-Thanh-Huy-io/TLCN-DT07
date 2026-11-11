'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import {
  Bookmark,
  Check,
  Flame,
  Hash,
  Layers,
  MessageSquarePlus,
  Search,
  Share2,
  ShieldAlert,
  UserCheck,
  UserCircle2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuthSession } from '@/services/auth/useAuthSession';
import {
  CommunityApi,
  extractCommunityContent,
  getFallbackSuggestedMembers,
  type CommunityMemberSummary,
  type CommunityPost,
} from '../api';
import { PostCard } from './PostCard';
import { QuickComposer, type ComposerMode } from './QuickComposer';

export type CommunityTabKey = 'all' | 'following' | 'trending' | 'shared_blog' | 'saved';

const PAGE_SIZE = 8;
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

const TABS: Array<{ key: CommunityTabKey; label: string }> = [
  { key: 'all', label: 'Tất cả thảo luận' },
  { key: 'following', label: 'Đang theo dõi' },
  { key: 'trending', label: 'Sôi nổi' },
  { key: 'shared_blog', label: 'Bài Blog chia sẻ' },
  { key: 'saved', label: 'Đã lưu' },
];

interface CommunityFeedProps {
  initialPosts: CommunityPost[];
  initialShareBlogSlug?: string | null;
}

export function CommunityFeed({ initialPosts, initialShareBlogSlug = null }: CommunityFeedProps) {
  const router = useRouter();
  const user = useAuthSession();

  const [activeTab, setActiveTab] = useState<CommunityTabKey>('all');
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [suggestedMembers, setSuggestedMembers] = useState<CommunityMemberSummary[]>(() =>
    getFallbackSuggestedMembers().slice(0, 4),
  );
  const [followedAuthors, setFollowedAuthors] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>('question');
  const [preselectedBlogSlug, setPreselectedBlogSlug] = useState<string | null>(
    initialShareBlogSlug,
  );
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  // Tự động mở khung Chia sẻ bài Blog nếu đi từ trang /blog/[slug] sang (?shareBlog=...)
  useEffect(() => {
    if (initialShareBlogSlug) {
      setPreselectedBlogSlug(initialShareBlogSlug);
      setComposerMode('share_blog');
      setComposerOpen(true);
    }
  }, [initialShareBlogSlug]);

  const loadTabFeed = useCallback(
    async (tab: CommunityTabKey) => {
      setIsLoading(true);
      setErrorMsg('');

      try {
        if (tab === 'saved') {
          if (!user?.id) {
            setPosts([]);
            setHasMore(false);
            return;
          }
          const saved = await CommunityApi.listMyBookmarks();
          setPosts(saved);
          setHasMore(false);
          return;
        }

        if (tab === 'following') {
          if (user?.id) {
            const followedFeed = await CommunityApi.listPosts({
              followingOnly: true,
              limit: 24,
            });
            if (followedFeed.length > 0) {
              setPosts(followedFeed);
              setHasMore(false);
              return;
            }
          }
          // Fallback hoặc kết hợp với các tác giả đã bấm Theo dõi trên trình duyệt
          const allAvailable = await CommunityApi.listPosts({ limit: 24 });
          const sourceList = allAvailable.length > 0 ? allAvailable : initialPosts;
          setPosts(sourceList);
          setHasMore(false);
          return;
        }

        const fetched = await CommunityApi.listPosts({
          sort: tab === 'trending' ? 'trending' : 'latest',
          limit: tab === 'shared_blog' ? 24 : PAGE_SIZE,
        });

        if (fetched.length > 0) {
          if (tab === 'shared_blog') {
            const sharedOnly = fetched.filter((p) => Boolean(extractCommunityContent(p).sharedBlog));
            setPosts(sharedOnly);
            setHasMore(false);
          } else {
            setPosts(fetched);
            setHasMore(fetched.length >= PAGE_SIZE);
          }
        } else if (tab === 'all') {
          setPosts(initialPosts);
          setHasMore(false);
        } else {
          const fallbackFiltered = initialPosts
            .filter((p) =>
              tab === 'shared_blog' ? Boolean(extractCommunityContent(p).sharedBlog) : true,
            )
            .sort((a, b) => {
              if (tab !== 'trending') return 0;
              const scoreA = a.likeCount * 2 + a.commentCount * 3 + a.viewCount * 0.1;
              const scoreB = b.likeCount * 2 + b.commentCount * 3 + b.viewCount * 0.1;
              return scoreB - scoreA;
            });
          setPosts(fallbackFiltered);
          setHasMore(false);
        }
      } catch {
        if (tab !== 'saved' && initialPosts.length > 0) {
          setPosts(initialPosts);
          setHasMore(false);
        } else {
          setErrorMsg('Không thể tải danh sách bài thảo luận.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [initialPosts, user?.id],
  );

  useEffect(() => {
    void loadTabFeed(activeTab);
  }, [activeTab, loadTabFeed]);

  const loadMorePosts = useCallback(async () => {
    if (
      isLoading ||
      isLoadingMore ||
      !hasMore ||
      activeTab === 'saved' ||
      activeTab === 'shared_blog' ||
      posts.length === 0
    ) {
      return;
    }

    const lastPost = posts[posts.length - 1];
    if (!lastPost || lastPost.id.startsWith('seed-post-')) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextBatch = await CommunityApi.listPosts({
        sort: activeTab === 'trending' ? 'trending' : 'latest',
        cursor: lastPost.id,
        limit: PAGE_SIZE,
      });

      if (nextBatch.length === 0) {
        setHasMore(false);
      } else {
        setPosts((current) => {
          const existingIds = new Set(current.map((item) => item.id));
          const uniqueNext = nextBatch.filter((item) => !existingIds.has(item.id));
          return [...current, ...uniqueNext];
        });
        setHasMore(nextBatch.length >= PAGE_SIZE);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeTab, hasMore, isLoading, isLoadingMore, posts]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || activeTab === 'saved' || activeTab === 'shared_blog') return;

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

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('post:hidden', (payload: { postId?: string }) => {
      const hiddenId = payload?.postId;
      if (!hiddenId) return;

      setPosts((current) => {
        const target = current.find((p) => p.id === hiddenId);
        if (target && user?.id && target.author?.id === user.id) {
          setRealtimeNotice(
            `Bài viết "${target.title}" đã bị hệ thống AI tạm ẩn do phát hiện dấu hiệu vi phạm quy tắc cộng đồng.`,
          );
        }
        return current.filter((p) => p.id !== hiddenId);
      });
    });

    socket.on('post:restored', () => {
      void loadTabFeed(activeTab);
    });

    socket.on('post:like-updated', (payload: { postId?: string; likeCount?: number }) => {
      if (!payload?.postId || typeof payload.likeCount !== 'number') return;
      setPosts((current) =>
        current.map((item) =>
          item.id === payload.postId ? { ...item, likeCount: Math.max(0, payload.likeCount!) } : item,
        ),
      );
    });

    socket.on(
      'user:follow-updated',
      (payload: { targetUserId?: string; followerCount?: number }) => {
        if (!payload?.targetUserId || typeof payload.followerCount !== 'number') return;
        setSuggestedMembers((current) =>
          current.map((m) =>
            m.id === payload.targetUserId
              ? { ...m, followerCount: Math.max(0, payload.followerCount!) }
              : m,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [activeTab, loadTabFeed, user?.id]);

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
    return posts.filter((post) => {
      const parsed = extractCommunityContent(post);
      if (activeTab === 'shared_blog' && !parsed.sharedBlog) {
        return false;
      }

      if (activeTab === 'following' && !isAuthorFollowed(post.author)) {
        return false;
      }

      if (selectedTag) {
        const hasTag = parsed.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = post.title.toLowerCase().includes(q);
        const inExcerpt = (post.excerpt || '').toLowerCase().includes(q);
        const inAuthor = (post.author?.username || '').toLowerCase().includes(q);
        const inTags = parsed.tags.some((t) => t.toLowerCase().includes(q));
        const inSharedTitle = (parsed.sharedBlog?.title || '').toLowerCase().includes(q);
        return inTitle || inExcerpt || inAuthor || inTags || inSharedTitle;
      }

      return true;
    });
  }, [activeTab, posts, searchQuery, selectedTag]);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      const parsed = extractCommunityContent(post);
      for (const tag of parsed.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    const list = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    if (list.length > 0) return list;
    return [
      ['Hoàng thành Thăng Long', 1],
      ['Lịch sử Việt Nam', 1],
      ['Khảo cổ học', 1],
    ] as Array<[string, number]>;
  }, [posts]);

  const handleOpenComposer = (mode: ComposerMode = 'question') => {
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
    if (activeTab === 'saved') {
      setActiveTab('all');
    }
  };

  const handleLikeUpdate = (postId: string, liked: boolean, likeCount: number) => {
    setPosts((current) =>
      current.map((p) => (p.id === postId ? { ...p, likedByMe: liked, likeCount } : p)),
    );
  };

  const handleBookmarkUpdate = (postId: string, bookmarked: boolean) => {
    setPosts((current) => {
      if (activeTab === 'saved' && !bookmarked) {
        return current.filter((p) => p.id !== postId);
      }
      return current.map((p) => (p.id === postId ? { ...p, bookmarkedByMe: bookmarked } : p));
    });
  };

  const handleFollowUpdate = useCallback(
    (identifier: string, following: boolean, followerCount?: number) => {
      const clean = identifier.trim().toLowerCase();
      setFollowedAuthors((prev) => {
        const next = { ...prev, [clean]: following };
        for (const m of suggestedMembers) {
          if (m.id.toLowerCase() === clean || m.username.toLowerCase() === clean) {
            next[m.id.toLowerCase()] = following;
            next[m.username.toLowerCase()] = following;
          }
        }
        return next;
      });

      setSuggestedMembers((current) =>
        current.map((m) => {
          if (m.id.toLowerCase() === clean || m.username.toLowerCase() === clean) {
            const nextCount =
              typeof followerCount === 'number'
                ? followerCount
                : Math.max(0, m.followerCount + (following ? 1 : -1));
            return { ...m, followedByMe: following, followerCount: nextCount };
          }
          return m;
        }),
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

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[350px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] lg:gap-8">
        {/* CỘT TRÁI (LEFT RAIL): Mở rộng kiểu mạng xã hội Facebook — lối tắt Trang cá nhân, Tìm kiếm, Menu bảng tin, Chủ đề & Gợi ý theo dõi */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-[12px] border border-[#E3D6BE] bg-[#FAF5E6] p-5 md:p-6">
            {/* Lối tắt Trang cá nhân đầu thanh bên trái (kiểu Facebook Sidebar) */}
            <Link
              href={myProfileHref}
              className="group flex items-center gap-3.5 rounded-[10px] border border-[#DFD1B8] bg-[#F1E6D0]/85 p-3.5 transition-colors hover:border-[#7A1F24]/50 hover:bg-[#EFE1C6]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7A1F24] text-[#FAF5E6] shadow-xs">
                <UserCircle2 size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-[#14233F] group-hover:text-[#7A1F24]">
                  {user?.username ? user.username : 'Trang cá nhân Cộng đồng'}
                </p>
                <p className="truncate text-[12.5px] text-[#5C4E3C]">
                  Xem hồ sơ, bài đã đăng & danh sách theo dõi
                </p>
              </div>
            </Link>

            {/* Ô tìm kiếm rộng rãi kiểu mạng xã hội */}
            <div className="mt-4">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6B57]"
                />
                <input
                  id="community-left-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm thảo luận, chủ đề, tác giả..."
                  aria-label="Tìm kiếm bài thảo luận"
                  className="h-11 w-full rounded-full border border-[#DFD1B8] bg-[#FDF9F0] pl-10 pr-9 text-[14px] text-[#14233F] placeholder:text-[#8A7963] outline-none transition-colors focus:border-[#8A5A19]"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6B57] hover:text-[#14233F]"
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Danh mục điều hướng Bảng tin rộng rãi kiểu Facebook Left Menu */}
            <nav className="mt-5 border-t border-[#E5DAC4] pt-4" aria-label="Danh mục thảo luận">
              <p className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E5D4B]">
                Bảng tin Cộng đồng
              </p>
              <div className="space-y-1.5">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const IconComponent =
                    tab.key === 'trending'
                      ? Flame
                      : tab.key === 'following'
                        ? UserCheck
                        : tab.key === 'shared_blog'
                          ? Share2
                          : tab.key === 'saved'
                            ? Bookmark
                            : Layers;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[14.5px] transition-colors ${
                        isActive
                          ? 'bg-[#F1E6D0] font-semibold text-[#7A1F24]'
                          : 'font-medium text-[#14233F] hover:bg-[#F3EAD8]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                            isActive
                              ? 'bg-[#7A1F24] text-[#FAF5E6]'
                              : 'bg-[#EDE2CC] text-[#5C4E3C]'
                          }`}
                        >
                          <IconComponent size={17} />
                        </span>
                        <span>{tab.label}</span>
                      </span>
                      {isActive ? (
                        <span
                          className="h-2 w-2 rounded-full bg-[#7A1F24]"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Lối tắt Chủ đề sử học nổi bật */}
            <div className="mt-5 border-t border-[#E5DAC4] pt-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E5D4B]">
                  <Hash size={14} className="text-[#8A5A19]" />
                  <span>Lối tắt chủ đề</span>
                </span>
                {selectedTag ? (
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="text-[12.5px] font-semibold text-[#7A1F24] hover:underline"
                  >
                    Bỏ chọn
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 8).map(([tag, count]) => {
                  const active = selectedTag?.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedTag((prev) =>
                          prev?.toLowerCase() === tag.toLowerCase() ? null : tag,
                        )
                      }
                      className={`inline-flex h-8 items-center gap-1.5 rounded-[7px] border px-3 text-[13px] font-medium transition-colors ${
                        active
                          ? 'border-[#7A1F24] bg-[#7A1F24] text-[#FAF5E6]'
                          : 'border-[#E2D5BC] bg-[#FDF9F0] text-[#5C4E3C] hover:border-[#8A5A19] hover:text-[#14233F]'
                      }`}
                    >
                      <span>#{tag}</span>
                      <span
                        className={`text-[11.5px] tabular-nums ${
                          active ? 'text-[#FAF5E6]/85' : 'text-[#8A7963]'
                        }`}
                      >
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Khối Gợi ý theo dõi / Thành viên tiêu biểu rộng rãi */}
            {suggestedMembers.length > 0 && (
              <div className="mt-5 border-t border-[#E5DAC4] pt-4">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E5D4B]">
                    <Users size={14} className="text-[#8A5A19]" />
                    <span>Gợi ý theo dõi</span>
                  </span>
                  <Link
                    href={myProfileHref}
                    className="text-[12.5px] font-semibold text-[#7A1F24] hover:underline"
                  >
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {suggestedMembers.slice(0, 4).map((member) => {
                    const followed = isAuthorFollowed(member);
                    const initials = member.displayName
                      .trim()
                      .split(/\s+/)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E5DAC4] bg-[#FDF9F0] p-3 transition-colors hover:border-[#D8C8AA]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Link
                            href={`/cong-dong/thanh-vien/${encodeURIComponent(member.username)}`}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E5EFE6] text-[13px] font-bold text-[#1E4620]"
                          >
                            {initials || 'HG'}
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/cong-dong/thanh-vien/${encodeURIComponent(member.username)}`}
                              className="block truncate text-[14px] font-semibold text-[#14233F] hover:text-[#7A1F24]"
                            >
                              {member.displayName}
                            </Link>
                            <p className="text-[12.5px] text-[#6E5D4B] tabular-nums">
                              {member.postCount} bài · {member.followerCount} người theo dõi
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleToggleFollowMemberCard(member)}
                          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] border px-3 text-[12.5px] font-semibold transition-colors ${
                            followed
                              ? 'border-[#D8C8AA] bg-[#F1E6D0] text-[#5C4E3C] hover:border-[#7A1F24] hover:text-[#7A1F24]'
                              : 'border-[#7A1F24] bg-[#7A1F24] text-[#FAF5E6] hover:bg-[#651A1E]'
                          }`}
                        >
                          {followed ? (
                            <>
                              <Check size={13} />
                              <span>Đã theo dõi</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={13} />
                              <span>Theo dõi</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* VÙNG TRUNG TÂM (CENTER FEED): Thoáng đãng, tập trung hoàn toàn vào việc đọc & thảo luận bài viết */}
        <div className="min-w-0 space-y-6">
          {/* Thông báo thời gian thực nếu AI vừa ẩn bài */}
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
                <X size={15} />
              </button>
            </div>
          ) : null}

          {/* Thanh gợi mở đặt câu hỏi nhẹ nhàng ở đầu vùng trung tâm */}
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#E3D6BE] bg-[#FAF5E6] px-5 py-3.5">
            <button
              type="button"
              onClick={() => handleOpenComposer('question')}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-[6px] border border-[#E2D5BC] bg-[#FDF9F0] px-4 py-2.5 text-left text-[14px] text-[#6E5D4B] transition-colors hover:border-[#8A5A19] hover:text-[#14233F]"
            >
              <MessageSquarePlus size={17} className="shrink-0 text-[#7A1F24]" />
              <span className="truncate">
                {user?.username
                  ? `${user.username}, bạn muốn đặt câu hỏi sử học hay chia sẻ bài chuyên khảo nào hôm nay?`
                  : 'Bạn đang tìm hiểu hay thắc mắc điều gì về lịch sử? Bấm vào đây để đặt câu hỏi...'}
              </span>
            </button>
          </div>

          {/* Thanh trạng thái nhỏ gọn khi người dùng đang bật bộ lọc tìm kiếm hoặc chủ đề từ cột trái */}
          {(selectedTag || searchQuery.trim() || activeTab !== 'all') && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-[#F1E6D0] px-4 py-2.5 text-[13px] text-[#5C4E3C]">
              <div className="flex flex-wrap items-center gap-2">
                <span>Đang hiển thị:</span>
                <strong className="text-[#14233F]">
                  {TABS.find((t) => t.key === activeTab)?.label}
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
                  ({filteredPosts.length} bài viết)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTag(null);
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="font-semibold text-[#7A1F24] hover:underline"
              >
                Đặt lại mặc định
              </button>
            </div>
          )}

          {/* Danh sách bài viết thoáng rộng ở trung tâm */}
          {errorMsg ? (
            <div className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-6 text-[14px] text-[#7A1F24]">
              <p>{errorMsg}</p>
              <button
                type="button"
                onClick={() => void loadTabFeed(activeTab)}
                className="mt-2 font-semibold text-[#14233F] underline"
              >
                Thử tải lại
              </button>
            </div>
          ) : isLoading ? (
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
          ) : activeTab === 'saved' && !user?.id ? (
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
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
              <h2 className="text-[17px] font-semibold text-[#14233F]">
                {activeTab === 'saved'
                  ? 'Bạn chưa lưu bài thảo luận nào trong danh mục này'
                  : activeTab === 'following'
                    ? 'Bạn chưa theo dõi tác giả nào có bài viết hiển thị'
                    : 'Không tìm thấy bài thảo luận phù hợp'}
              </h2>
              <p className="mt-1.5 text-[14px] text-[#6E5D4B]">
                {activeTab === 'following'
                  ? 'Hãy bấm nút "Theo dõi" tại danh sách Thành viên tiêu biểu ở cột bên trái hoặc trên từng bài viết để nhận thảo luận mới.'
                  : selectedTag || searchQuery
                    ? 'Hãy thử xóa bộ lọc từ khóa hoặc chọn một thẻ chủ đề khác ở cột bên trái.'
                    : 'Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ bài viết từ Blog.'}
              </p>
              {(selectedTag || searchQuery || activeTab === 'following') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTag(null);
                    setSearchQuery('');
                    if (activeTab === 'following') setActiveTab('all');
                  }}
                  className="mt-3.5 h-9 rounded-[6px] border border-[#D8C8AA] bg-[#F2E8D5] px-4 text-[13px] font-medium text-[#14233F]"
                >
                  {activeTab === 'following' ? 'Xem tất cả thảo luận' : 'Xóa bộ lọc đang chọn'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  activeTag={selectedTag}
                  onSelectTag={(tag) =>
                    setSelectedTag((current) =>
                      current?.toLowerCase() === tag.toLowerCase() ? null : tag,
                    )
                  }
                  onLikeUpdate={handleLikeUpdate}
                  onBookmarkUpdate={handleBookmarkUpdate}
                  isFollowedAuthor={isAuthorFollowed(post.author)}
                  isOwnPost={Boolean(user?.id && post.author?.id === user.id)}
                  onFollowUpdate={handleFollowUpdate}
                />
              ))}

              {(isLoadingMore || (hasMore && activeTab !== 'saved' && activeTab !== 'shared_blog')) && (
                <div ref={sentinelRef} className="pt-2 text-center">
                  {isLoadingMore ? (
                    <span className="text-[14px] text-[#6E5D4B]">Đang tải thêm bài thảo luận...</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void loadMorePosts()}
                      className="h-10 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-5 text-[14px] font-medium text-[#14233F] hover:border-[#8A5A19]"
                    >
                      Tải thêm thảo luận
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
