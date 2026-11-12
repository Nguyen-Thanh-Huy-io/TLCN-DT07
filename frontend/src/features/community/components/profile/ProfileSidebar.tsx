'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Check,
  Edit3,
  FileText,
  Hash,
  Plus,
  UserPlus,
  X,
} from 'lucide-react';
import type {
  CommunityMemberProfile,
  CommunityMemberSummary,
} from '../../api';
import { getAuthorTint, getInitials } from '../../utils/author-avatar.util';
import { formatJoinDate, getRoleLabel, type ProfileComputedStats } from './profile.types';

export interface ProfileSidebarProps {
  profile: CommunityMemberProfile;
  computedStats: ProfileComputedStats;
  suggestedMembers: CommunityMemberSummary[];
  isMe: boolean;
  followLoading: boolean;
  selectedTopic: string | null;
  setSelectedTopic: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenQuestionComposer: () => void;
  onToggleFollowProfile: () => Promise<void>;
  onToggleFollowOtherMember: (target: CommunityMemberSummary) => Promise<void>;
  isEditingBio: boolean;
  setIsEditingBio: React.Dispatch<React.SetStateAction<boolean>>;
  editFirstName: string;
  setEditFirstName: (val: string) => void;
  editLastName: string;
  setEditLastName: (val: string) => void;
  editBio: string;
  setEditBio: (val: string) => void;
  savingBio: boolean;
  bioSavedNotice: string | null;
  setBioSavedNotice: (val: string | null) => void;
  onSaveBio: (e: React.FormEvent) => Promise<void>;
  onTopicClick?: () => void;
}

export function ProfileSidebar({
  profile,
  computedStats,
  suggestedMembers,
  isMe,
  followLoading,
  selectedTopic,
  setSelectedTopic,
  onOpenQuestionComposer,
  onToggleFollowProfile,
  onToggleFollowOtherMember,
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
  onSaveBio,
  onTopicClick,
}: ProfileSidebarProps) {
  const tint = getAuthorTint(profile.user.username);
  const maxTopicCount = Math.max(1, ...(computedStats.topTopics.map((t) => t.count) || [1]));

  return (
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
                onClick={onOpenQuestionComposer}
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
                onClick={() => void onToggleFollowProfile()}
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

        {/* Biểu mẫu chỉnh sửa hồ sơ sử học */}
        {isMe && isEditingBio && (
          <form
            onSubmit={(e) => void onSaveBio(e)}
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

        {/* Chủ đề sử học đóng góp */}
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
                const isSelected = selectedTopic?.toLowerCase() === item.tag.toLowerCase();
                const widthPct = Math.max(18, Math.round((item.count / maxTopicCount) * 100));
                return (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      setSelectedTopic((prev) =>
                        prev?.toLowerCase() === item.tag.toLowerCase() ? null : item.tag,
                      );
                      onTopicClick?.();
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
                    onClick={() => void onToggleFollowOtherMember(member)}
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
  );
}
