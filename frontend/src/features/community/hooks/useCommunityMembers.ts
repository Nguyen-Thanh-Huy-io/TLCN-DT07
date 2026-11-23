'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES, COMMUNITY_ROUTES } from '@/constants/routes';
import { useAuthSession } from '@/services/auth/use-auth-session';
import {
  CommunityApi,
  CommunityMemberFollowFilter,
  CommunityMemberSort,
  extractErrorMessage,
  type CommunityMemberSummary,
  type PaginatedCommunityMembers,
} from '../api';

const PAGE_LIMIT = 18;
const SEARCH_DEBOUNCE_MS = 300;

export function useCommunityMembers(initialData: PaginatedCommunityMembers) {
  const router = useRouter();
  const sessionUser = useAuthSession();

  const [members, setMembers] = useState<CommunityMemberSummary[]>(initialData.items);
  const [total, setTotal] = useState<number>(initialData.total);
  const [page, setPage] = useState<number>(initialData.page || 1);
  const [totalPages, setTotalPages] = useState<number>(initialData.totalPages);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [followFilter, setFollowFilter] = useState<CommunityMemberFollowFilter>(
    CommunityMemberFollowFilter.ALL,
  );
  const [sort, setSort] = useState<CommunityMemberSort>(
    CommunityMemberSort.CONTRIBUTION,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingFollowIds, setPendingFollowIds] = useState<Record<string, boolean>>({});
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [debouncedSearch, searchInput]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await CommunityApi.listMembers({
        page,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
        sort,
        filter: followFilter,
      });
      setMembers(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setErrorMsg(
        extractErrorMessage(err, 'Không thể tải danh sách thành viên Cộng đồng.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, followFilter, page, sort]);

  useEffect(() => {
    // SSR đã tải sẵn trang 1 mặc định cho khách; chỉ nạp lại ngay khi đăng nhập
    // (để có trạng thái followedByMe/isMe) hoặc khi người dùng đổi bộ lọc/trang.
    const isInitialDefaultGuest =
      !hasHydratedRef.current &&
      !sessionUser?.id &&
      page === 1 &&
      !debouncedSearch &&
      followFilter === CommunityMemberFollowFilter.ALL &&
      sort === CommunityMemberSort.CONTRIBUTION;

    hasHydratedRef.current = true;
    if (isInitialDefaultGuest) return;

    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void fetchMembers();
      }
    });
    return () => {
      active = false;
    };
  }, [debouncedSearch, fetchMembers, followFilter, page, sessionUser, sort]);

  const handleSelectFilter = (nextFilter: CommunityMemberFollowFilter) => {
    setFollowFilter(nextFilter);
    setPage(1);
  };

  const handleSelectSort = (nextSort: CommunityMemberSort) => {
    setSort(nextSort);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setFollowFilter(CommunityMemberFollowFilter.ALL);
    setSort(CommunityMemberSort.CONTRIBUTION);
    setPage(1);
  };

  const handleToggleFollow = async (member: CommunityMemberSummary) => {
    if (!sessionUser?.id) {
      router.push(
        `${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(COMMUNITY_ROUTES.MEMBERS)}`,
      );
      return;
    }
    if (member.isMe || pendingFollowIds[member.id]) return;

    const nextFollowed = !member.followedByMe;
    const optimisticDelta = nextFollowed ? 1 : -1;

    setPendingFollowIds((prev) => ({ ...prev, [member.id]: true }));
    setMembers((current) =>
      current.map((item) =>
        item.id === member.id
          ? {
              ...item,
              followedByMe: nextFollowed,
              followerCount: Math.max(0, item.followerCount + optimisticDelta),
            }
          : item,
      ),
    );

    try {
      const res = await CommunityApi.toggleFollow(member.username);
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id
            ? {
                ...item,
                followedByMe: res.following,
                followerCount:
                  typeof res.followerCount === 'number'
                    ? res.followerCount
                    : item.followerCount,
              }
            : item,
        ),
      );
    } catch (err) {
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id
            ? {
                ...item,
                followedByMe: member.followedByMe,
                followerCount: member.followerCount,
              }
            : item,
        ),
      );
      setErrorMsg(
        extractErrorMessage(err, 'Không thể cập nhật trạng thái theo dõi lúc này.'),
      );
    } finally {
      setPendingFollowIds((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
    }
  };

  return {
    sessionUser,
    members,
    total,
    page,
    totalPages,
    searchInput,
    debouncedSearch,
    followFilter,
    sort,
    isLoading,
    errorMsg,
    pendingFollowIds,
    setSearchInput,
    setPage,
    handleSelectFilter,
    handleSelectSort,
    handleResetFilters,
    handleToggleFollow,
    retryFetch: fetchMembers,
  };
}
