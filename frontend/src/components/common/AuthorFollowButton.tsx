'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, UserPlus, X } from 'lucide-react';
import { CommunityApi } from '@/features/community/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { APP_ROUTES } from '@/constants/routes';

export enum AuthorFollowVariant {
  INLINE = 'inline',
  PILL = 'pill',
}

const VARIANT_CLASSES: Record<AuthorFollowVariant, string> = {
  [AuthorFollowVariant.INLINE]:
    'inline-flex h-6 items-center gap-1 rounded-[5px] border px-2 text-[11.5px] font-semibold transition-colors cursor-pointer disabled:opacity-60',
  [AuthorFollowVariant.PILL]:
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.04em] transition-colors cursor-pointer disabled:opacity-60',
};

export interface AuthorFollowButtonProps {
  authorId?: string | null;
  authorUsername?: string | null;
  variant?: AuthorFollowVariant;
  className?: string;
}

/**
 * Nút Theo dõi / Đang theo dõi tác giả dùng chung cho Bài viết, Bài học và Blog.
 * Đồng bộ trực tiếp với mạng lưới UserFollow của Blog Cộng đồng.
 */
export function AuthorFollowButton({
  authorId,
  authorUsername,
  variant = AuthorFollowVariant.INLINE,
  className = '',
}: AuthorFollowButtonProps) {
  const router = useRouter();
  const sessionUser = useAuthSession();
  const identifier = authorUsername?.trim() || authorId?.trim() || '';

  const isOwnBySession = Boolean(
    sessionUser &&
      ((authorId && sessionUser.id === authorId) ||
        (authorUsername &&
          sessionUser.username.toLowerCase() === authorUsername.trim().toLowerCase())),
  );

  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [isMe, setIsMe] = useState(isOwnBySession);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!identifier || isOwnBySession) return;
    let active = true;
    void CommunityApi.getFollowStatus(identifier)
      .then((res) => {
        if (!active) return;
        setFollowing(Boolean(res.following));
        setFollowerCount(res.followerCount);
        setIsMe(Boolean(res.isMe));
      })
      .catch(() => {
        // Bỏ qua lỗi mạng tạm thời để không làm gián đoạn luồng đọc bài
      });
    return () => {
      active = false;
    };
  }, [identifier, isOwnBySession, sessionUser?.id]);

  if (!identifier || isOwnBySession || isMe) {
    return null;
  }

  const handleToggle = async () => {
    if (loading) return;
    if (!sessionUser) {
      const current =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      router.push(`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(current)}`);
      return;
    }

    const nextFollowing = !following;
    const prevCount = followerCount ?? 0;
    setFollowing(nextFollowing);
    if (followerCount !== null) {
      setFollowerCount(Math.max(0, prevCount + (nextFollowing ? 1 : -1)));
    }
    setLoading(true);
    try {
      const res = await CommunityApi.toggleFollow(identifier);
      setFollowing(res.following);
      setFollowerCount(res.followerCount);
    } catch {
      setFollowing(!nextFollowing);
      if (followerCount !== null) {
        setFollowerCount(prevCount);
      }
    } finally {
      setLoading(false);
    }
  };

  const baseShape = VARIANT_CLASSES[variant];

  const toneStyle = following
    ? 'border-[#D8C8AA] bg-[#F1E6D0] text-[#5C4E3C] hover:border-[#7A1F24] hover:text-[#7A1F24]'
    : 'border-[#7A1F24]/30 bg-[#FAF5E6] text-[#7A1F24] hover:border-[#7A1F24] hover:bg-[#7A1F24] hover:text-[#FAF5E6]';

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={loading}
      aria-pressed={following}
      title={following ? 'Nhấn để bỏ theo dõi tác giả này' : 'Nhận thông báo khi tác giả đăng bài mới'}
      className={`${baseShape} ${toneStyle} ${className}`.trim()}
    >
      {following ? <Check size={11} /> : <UserPlus size={11} />}
      <span>{following ? 'Đang theo dõi' : 'Theo dõi'}</span>
      {followerCount !== null && followerCount > 0 && (
        <span className="tabular-nums opacity-80">({followerCount})</span>
      )}
    </button>
  );
}

export interface TrueFalseAnswerSelectorProps {
  value: boolean;
  onChange: (nextValue: boolean) => void;
  compact?: boolean;
}

export function TrueFalseAnswerSelector({
  value,
  onChange,
  compact = false,
}: TrueFalseAnswerSelectorProps) {
  const choices = [
    {
      boolVal: true,
      title: 'Đúng',
      subtitle: 'Mệnh đề lịch sử nêu trên là hoàn toàn chính xác',
      activeCls: 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs',
      iconBgCls: value === true ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400',
      badgeCls: 'bg-emerald-600 text-white',
      Icon: Check,
    },
    {
      boolVal: false,
      title: 'Sai',
      subtitle: 'Mệnh đề lịch sử nêu trên có chi tiết chưa chính xác',
      activeCls: 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20 shadow-xs',
      iconBgCls: value === false ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400',
      badgeCls: 'bg-rose-600 text-white',
      Icon: X,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-800">
          Đáp án đúng của mệnh đề
        </label>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
            value
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span>Đáp án đang chọn: {value ? '✓ Đúng' : '✕ Sai'}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {choices.map((item) => {
          const isSelected = value === item.boolVal;
          const IconComp = item.Icon;

          return (
            <button
              key={String(item.boolVal)}
              type="button"
              onClick={() => onChange(item.boolVal)}
              className={`relative flex items-center gap-3 text-left rounded-xl border transition-all cursor-pointer ${
                compact ? 'p-3' : 'p-4'
              } ${
                isSelected
                  ? item.activeCls
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.iconBgCls}`}
              >
                <IconComp size={18} strokeWidth={2.5} />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{item.title}</span>
                  {isSelected && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeCls}`}
                    >
                      Đang chọn
                    </span>
                  )}
                </div>
                {!compact && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.subtitle}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
