'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Check,
  Flame,
  Hash,
  Layers,
  Search,
  Share2,
  UserCheck,
  UserCircle2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  CommunityTabKey,
  COMMUNITY_TAB_LABELS,
} from '@/constants/enums';
import type { CommunityMemberSummary } from '../api';

const TABS: Array<{ key: CommunityTabKey; label: string }> = [
  { key: CommunityTabKey.ALL, label: COMMUNITY_TAB_LABELS[CommunityTabKey.ALL] },
  { key: CommunityTabKey.FOLLOWING, label: COMMUNITY_TAB_LABELS[CommunityTabKey.FOLLOWING] },
  { key: CommunityTabKey.TRENDING, label: COMMUNITY_TAB_LABELS[CommunityTabKey.TRENDING] },
  { key: CommunityTabKey.SHARED_BLOG, label: COMMUNITY_TAB_LABELS[CommunityTabKey.SHARED_BLOG] },
  { key: CommunityTabKey.SAVED, label: COMMUNITY_TAB_LABELS[CommunityTabKey.SAVED] },
];

function getTabIcon(tabKey: CommunityTabKey) {
  if (tabKey === CommunityTabKey.TRENDING) return Flame;
  if (tabKey === CommunityTabKey.FOLLOWING) return UserCheck;
  if (tabKey === CommunityTabKey.SHARED_BLOG) return Share2;
  if (tabKey === CommunityTabKey.SAVED) return Bookmark;
  return Layers;
}

interface CommunitySidebarProps {
  myProfileHref: string;
  username?: string;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  activeTab: CommunityTabKey;
  onChangeTab: (tab: CommunityTabKey) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  popularTags: Array<[string, number]>;
  suggestedMembers: CommunityMemberSummary[];
  isAuthorFollowed: (member: CommunityMemberSummary) => boolean;
  onToggleFollowMember: (member: CommunityMemberSummary) => void;
}

export function CommunitySidebar({
  myProfileHref,
  username,
  searchQuery,
  onChangeSearchQuery,
  activeTab,
  onChangeTab,
  selectedTag,
  onSelectTag,
  popularTags,
  suggestedMembers,
  isAuthorFollowed,
  onToggleFollowMember,
}: CommunitySidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="rounded-[12px] border border-[#E3D6BE] bg-[#FAF5E6] p-5 md:p-6">
        <Link
          href={myProfileHref}
          className="group flex items-center gap-3.5 rounded-[10px] border border-[#DFD1B8] bg-[#F1E6D0]/85 p-3.5 transition-colors hover:border-[#7A1F24]/50 hover:bg-[#EFE1C6]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7A1F24] text-[#FAF5E6] shadow-xs">
            <UserCircle2 size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-[#14233F] group-hover:text-[#7A1F24]">
              {username || 'Trang cá nhân Cộng đồng'}
            </p>
            <p className="truncate text-[12.5px] text-[#5C4E3C]">
              Xem hồ sơ, bài đã đăng & danh sách theo dõi
            </p>
          </div>
        </Link>

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
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thảo luận, chủ đề, tác giả..."
              aria-label="Tìm kiếm bài thảo luận"
              className="h-11 w-full rounded-full border border-[#DFD1B8] bg-[#FDF9F0] pl-10 pr-9 text-[14px] text-[#14233F] placeholder:text-[#8A7963] outline-none transition-colors focus:border-[#8A5A19]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onChangeSearchQuery('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6B57] hover:text-[#14233F]"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
        </div>

        <nav className="mt-5 border-t border-[#E5DAC4] pt-4" aria-label="Danh mục thảo luận">
          <p className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E5D4B]">
            Bảng tin Cộng đồng
          </p>
          <div className="space-y-1.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const IconComponent = getTabIcon(tab.key);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onChangeTab(tab.key)}
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

        <div className="mt-5 border-t border-[#E5DAC4] pt-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E5D4B]">
              <Hash size={14} className="text-[#8A5A19]" />
              <span>Lối tắt chủ đề</span>
            </span>
            {selectedTag ? (
              <button
                type="button"
                onClick={() => onSelectTag(null)}
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
                  onClick={() => onSelectTag(active ? null : tag)}
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
                      onClick={() => onToggleFollowMember(member)}
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
  );
}
