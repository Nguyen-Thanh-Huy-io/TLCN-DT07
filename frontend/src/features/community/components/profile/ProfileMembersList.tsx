'use client';

import React from 'react';
import Link from 'next/link';
import { Check, UserPlus } from 'lucide-react';
import type { CommunityMemberSummary } from '../../api';
import { getAuthorTint, getInitials } from '../../utils/author-avatar.util';
import { getRoleLabel, type ProfileTabKey } from './profile.types';

export interface ProfileMembersListProps {
  activeTab: ProfileTabKey;
  displayName: string;
  filteredMembers: CommunityMemberSummary[];
  onToggleFollowMember: (target: CommunityMemberSummary) => Promise<void>;
}

export function ProfileMembersList({
  activeTab,
  displayName,
  filteredMembers,
  onToggleFollowMember,
}: ProfileMembersListProps) {
  const isFollowers = activeTab === 'followers';

  return (
    <div className="rounded-[8px] border border-[#E3D6BE] bg-[#FDF9F0] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#14233F]">
          {isFollowers
            ? `Thành viên đang theo dõi ${displayName}`
            : `Thành viên được ${displayName} theo dõi`}
        </h2>
        <span className="text-[13px] text-[#5C4E3C] tabular-nums">
          {filteredMembers.length} tài khoản
        </span>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-[#D8C8AA] p-8 text-center">
          <p className="text-[14px] text-[#5C4E3C]">
            {isFollowers
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
                      onClick={() => void onToggleFollowMember(member)}
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
  );
}
