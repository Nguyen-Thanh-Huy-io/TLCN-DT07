'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { APP_ROUTES, COMMUNITY_ROUTES } from '@/constants/routes';
import {
  CommunityMemberFollowFilter,
  CommunityMemberSort,
  type CommunityMemberSummary,
  type PaginatedCommunityMembers,
} from '../api';
import { useCommunityMembers } from '../hooks/useCommunityFeedHooks';
import { getAuthorTint, getInitials } from '../community-content.util';
import { getRoleLabel } from './CommunityProfileParts';

const FILTER_OPTIONS: Array<{
  key: CommunityMemberFollowFilter;
  label: string;
}> = [
  { key: CommunityMemberFollowFilter.ALL, label: 'Tất cả thành viên' },
  { key: CommunityMemberFollowFilter.NOT_FOLLOWING, label: 'Chưa theo dõi' },
  { key: CommunityMemberFollowFilter.FOLLOWING, label: 'Đang theo dõi' },
];

const SORT_OPTIONS: Array<{ value: CommunityMemberSort; label: string }> = [
  { value: CommunityMemberSort.CONTRIBUTION, label: 'Đóng góp nổi bật' },
  { value: CommunityMemberSort.FOLLOWERS, label: 'Nhiều người theo dõi' },
  { value: CommunityMemberSort.NEWEST, label: 'Mới tham gia' },
];

function getEmptyDirectoryMessage(
  isGuestFollowingTab: boolean,
  debouncedSearch: string,
): string {
  if (isGuestFollowingTab) {
    return 'Hãy đăng nhập để xem danh sách thành viên bạn đang theo dõi.';
  }
  if (debouncedSearch) {
    return `Không tìm thấy thành viên nào phù hợp với "${debouncedSearch}".`;
  }
  return 'Chưa có thành viên nào trong mục này.';
}

function DirectoryMemberCard({
  member,
  isPending,
  onToggleFollow,
}: {
  member: CommunityMemberSummary;
  isPending: boolean;
  onToggleFollow: (target: CommunityMemberSummary) => void;
}) {
  const tint = getAuthorTint(member.username);
  const profileHref = COMMUNITY_ROUTES.MEMBER(member.username);

  return (
    <article className="flex flex-col justify-between rounded-[10px] border border-[#E3D6BE] bg-[#FDF9F0] p-5 transition-colors hover:border-[#C9B38C]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <Link
              href={profileHref}
              style={{ backgroundColor: tint.bg, color: tint.ink }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold transition-opacity hover:opacity-85"
            >
              {getInitials(member.displayName)}
            </Link>
            <div className="min-w-0">
              <span className="inline-flex h-5 items-center rounded-[4px] bg-[#E5EFE6] px-2 text-[11px] font-semibold text-[#1E4620]">
                {getRoleLabel(member.role)}
              </span>
              <Link
                href={profileHref}
                className="mt-1 block truncate text-[16px] font-bold text-[#14233F] hover:text-[#7A1F24]"
              >
                {member.displayName}
              </Link>
              <p className="truncate text-[12.5px] text-[#6E5D4B]">
                @{member.username}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3.5 line-clamp-2 min-h-[42px] text-[13.5px] leading-relaxed text-[#4A3F33]">
          {member.bio ||
            'Thành viên Cộng đồng Lịch sử HISGO — cùng trao đổi tư liệu và đối chiếu sử học đa chiều.'}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ECE0CA] pt-3.5">
        <span className="text-[12.5px] text-[#5C4E3C] tabular-nums">
          <strong className="text-[#14233F]">{member.postCount}</strong> bài viết ·{' '}
          <strong className="text-[#14233F]">{member.followerCount}</strong> theo dõi
        </span>

        {member.isMe ? (
          <Link
            href={profileHref}
            className="inline-flex h-8 shrink-0 items-center rounded-[7px] border border-[#D8C8AA] bg-[#FAF5E6] px-3 text-[12.5px] font-semibold text-[#14233F] hover:border-[#8A5A19]"
          >
            Hồ sơ của tôi
          </Link>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onToggleFollow(member)}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] border px-3 text-[12.5px] font-semibold transition-colors cursor-pointer ${
              member.followedByMe
                ? 'border-[#D8C8AA] bg-[#F1E6D0] text-[#5C4E3C] hover:border-[#7A1F24] hover:text-[#7A1F24]'
                : 'border-[#7A1F24] bg-[#7A1F24] text-[#FAF5E6] hover:bg-[#651A1E]'
            }`}
          >
            {member.followedByMe ? (
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
        )}
      </div>
    </article>
  );
}

function DirectorySkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[196px] animate-pulse rounded-[10px] border border-[#E3D6BE] bg-[#FAF5E6] p-5"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-full bg-[#E8DCC4]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-24 rounded bg-[#E8DCC4]" />
              <div className="h-4 w-40 rounded bg-[#E8DCC4]" />
            </div>
          </div>
          <div className="mt-5 h-3.5 w-full rounded bg-[#EDE2CC]" />
          <div className="mt-2 h-3.5 w-2/3 rounded bg-[#EDE2CC]" />
        </div>
      ))}
    </div>
  );
}

function DirectoryPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#E3D6BE] bg-[#FAF5E6] px-5 py-3.5">
      <p className="text-[13.5px] text-[#5C4E3C] tabular-nums">
        Trang <strong className="text-[#14233F]">{page}</strong> / {totalPages} · Tổng{' '}
        <strong className="text-[#14233F]">{total}</strong> thành viên
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-[7px] border border-[#DFD1B8] bg-[#FDF9F0] px-3 text-[13px] font-medium text-[#14233F] disabled:opacity-45 hover:border-[#8A5A19] cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft size={15} />
          <span>Trước</span>
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-[7px] border border-[#DFD1B8] bg-[#FDF9F0] px-3 text-[13px] font-medium text-[#14233F] disabled:opacity-45 hover:border-[#8A5A19] cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Sau</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function CommunityMembersDirectory({
  initialData,
}: {
  initialData: PaginatedCommunityMembers;
}) {
  const {
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
    retryFetch,
  } = useCommunityMembers(initialData);

  const isGuestFollowingTab =
    !sessionUser?.id && followFilter === CommunityMemberFollowFilter.FOLLOWING;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        {/* Phần đầu trang danh bạ thành viên */}
        <section className="rounded-[12px] border border-[#E3D6BE] bg-[#FAF5E6] p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                href={COMMUNITY_ROUTES.FEED}
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#5C4E3C] transition-colors hover:text-[#7A1F24]"
              >
                <ArrowLeft size={16} />
                <span>Quay lại Diễn đàn Cộng đồng</span>
              </Link>
              <h1 className="mt-3 flex items-center gap-2.5 text-[24px] font-bold text-[#14233F] md:text-[28px]">
                <Users size={24} className="text-[#7A1F24]" />
                <span>Thành viên Cộng đồng HISGO</span>
              </h1>
              <p className="mt-1.5 text-[14.5px] text-[#5C4E3C]">
                Khám phá, tìm kiếm và theo dõi các tác giả, nhà nghiên cứu đang đóng góp trên Cộng đồng.
              </p>
            </div>

            {sessionUser?.username ? (
              <Link
                href={COMMUNITY_ROUTES.MEMBER(sessionUser.username)}
                className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#D8C8AA] bg-[#FDF9F0] px-4 text-[14px] font-semibold text-[#14233F] transition-colors hover:border-[#8A5A19]"
              >
                <UserCheck size={16} className="text-[#7A1F24]" />
                <span>Hồ sơ của tôi</span>
              </Link>
            ) : null}
          </div>
        </section>

        {/* Thanh lọc, tìm kiếm & sắp xếp */}
        <section className="rounded-[12px] border border-[#E3D6BE] bg-[#FAF5E6] p-5 md:px-6">
          <div className="border-b border-[#E3D6BE]">
            <div className="flex flex-nowrap items-center gap-x-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTER_OPTIONS.map((option) => {
                const active = followFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleSelectFilter(option.key)}
                    className={`shrink-0 border-b-2 pb-3 text-[14px] whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'border-[#7A1F24] font-semibold text-[#14233F]'
                        : 'border-transparent font-medium text-[#5C4E3C] hover:text-[#14233F]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-[400px]">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E5D4B]"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên, @username hoặc hướng nghiên cứu..."
                aria-label="Tìm kiếm thành viên"
                className="h-10 w-full rounded-[8px] border border-[#DFD1B8] bg-[#FDF9F0] pl-9 pr-8 text-[14px] text-[#14233F] placeholder:text-[#6E5D4B] outline-none focus:border-[#8A5A19]"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Xóa từ khóa"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5D4B]"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2.5">
              <label
                htmlFor="community-members-sort"
                className="text-[13.5px] font-medium text-[#5C4E3C]"
              >
                Sắp xếp:
              </label>
              <select
                id="community-members-sort"
                value={sort}
                onChange={(e) =>
                  handleSelectSort(e.target.value as CommunityMemberSort)
                }
                className="h-10 rounded-[8px] border border-[#DFD1B8] bg-[#FDF9F0] px-3 text-[13.5px] font-medium text-[#14233F] outline-none focus:border-[#8A5A19]"
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Nội dung: Lỗi / Đang tải / Rỗng / Danh sách */}
        {errorMsg ? (
          <div className="rounded-[10px] border border-[#E8C5C6] bg-[#F9E8E6] p-6 text-center">
            <p className="text-[14.5px] font-medium text-[#7A1F24]">{errorMsg}</p>
            <button
              type="button"
              onClick={() => void retryFetch()}
              className="mt-3 inline-flex h-9 items-center rounded-[7px] bg-[#7A1F24] px-4 text-[13.5px] font-semibold text-[#FAF5E6] hover:bg-[#651A1E] cursor-pointer"
            >
              Thử tải lại
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <DirectorySkeletonGrid />
        ) : members.length === 0 ? (
          <div className="rounded-[10px] border border-[#E3D6BE] bg-[#FAF5E6] p-10 text-center">
            <p className="text-[15px] font-medium text-[#4A3F33]">
              {getEmptyDirectoryMessage(isGuestFollowingTab, debouncedSearch)}
            </p>
            {isGuestFollowingTab ? (
              <Link
                href={`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(COMMUNITY_ROUTES.MEMBERS)}`}
                className="mt-4 inline-flex h-9 items-center rounded-[7px] bg-[#7A1F24] px-4 text-[13.5px] font-semibold text-[#FAF5E6] hover:bg-[#651A1E]"
              >
                Đăng nhập ngay
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex h-9 items-center rounded-[7px] border border-[#D8C8AA] bg-[#FDF9F0] px-4 text-[13.5px] font-semibold text-[#14233F] hover:border-[#8A5A19] cursor-pointer"
              >
                Xem tất cả thành viên
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <DirectoryMemberCard
                key={member.id}
                member={member}
                isPending={Boolean(pendingFollowIds[member.id])}
                onToggleFollow={(target) => void handleToggleFollow(target)}
              />
            ))}
          </div>
        )}

        <DirectoryPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
