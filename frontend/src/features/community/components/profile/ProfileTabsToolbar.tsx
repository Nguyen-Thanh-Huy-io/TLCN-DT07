'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { type ProfileTabItem, ProfileTabKey } from './profile.types';

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
