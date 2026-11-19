'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  BookOpen,
  Bookmark,
  Calendar,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Network,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { PublicAuthService, USER_ROLE_LABELS, isStaffRole } from '@/services/auth/public-auth.service';
import { AccountApiService, type MyProfile } from '@/services/auth/account.service';
import { extractErrorMessage } from '@/services/api';
import { ProfileSection, SecuritySection } from './AccountSections';
import { LearningSection, SavedBookmarksSection } from './AccountLearningSections';
import { FlashcardsSection } from '@/features/flashcards/components/FlashcardsSection';
import { MindmapsSection } from '@/features/mindmap/components/MindmapsSection';
import { RemoteImage } from '@/components/common/RemoteImage';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonReaderHooks';

export enum AccountTabKey {
  PROFILE = 'ho-so',
  LEARNING = 'hoc-tap',
  BOOKMARKS = 'tu-lieu',
  FLASHCARDS = 'the-ghi-nho',
  MINDMAPS = 'so-do-tu-duy',
  SECURITY = 'bao-mat',
}

interface AccountTab {
  id: AccountTabKey;
  label: string;
  icon: typeof UserRound;
  badge?: number;
}

function displayName(profile: MyProfile): string {
  const full = [profile.userProfile?.lastName, profile.userProfile?.firstName].filter(Boolean).join(' ');
  return full || profile.username;
}

const SAVED_CHANGE_EVENT = 'hisgo:saved-change';

function subscribeSavedStorage(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(SAVED_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SAVED_CHANGE_EVENT, callback);
  };
}

function readSavedCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const artRaw = localStorage.getItem('hisgo:saved-articles');
    const tlRaw = localStorage.getItem('hisgo.saved');
    const art = artRaw ? (JSON.parse(artRaw) as unknown) : [];
    const tl = tlRaw ? (JSON.parse(tlRaw) as unknown) : [];
    const artIds = Array.isArray(art) ? art.filter((x): x is string => typeof x === 'string') : [];
    const tlIds = Array.isArray(tl) ? tl.filter((x): x is string => typeof x === 'string') : [];
    return new Set([...artIds, ...tlIds]).size;
  } catch {
    return 0;
  }
}

export function AccountView() {
  const user = useAuthSession();
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AccountTabKey>(AccountTabKey.PROFILE);
  const [flashcardDueCount, setFlashcardDueCount] = useState<number>(0);
  const [mindmapCount, setMindmapCount] = useState<number>(0);
  const [savedCountOverride, setSavedCountOverride] = useState<number | null>(null);
  const storedSavedCount = useSyncExternalStore(subscribeSavedStorage, readSavedCount, () => 0);
  const savedCount = savedCountOverride ?? storedSavedCount;

  const { enrolledPathIds, completedIds } = useLessonProgress();

  useEffect(() => {
    if (user === null) router.replace('/login?redirect=%2Ftai-khoan');
  }, [user, router]);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    AccountApiService.getProfile()
      .then((p) => {
        setProfile(p);
        const fullName = [p.userProfile?.lastName, p.userProfile?.firstName].filter(Boolean).join(' ');
        PublicAuthService.updateCurrentUser({
          avatarUrl: p.userProfile?.avatarUrl,
          displayName: fullName || p.username,
        });
      })
      .catch((err) => setError(extractErrorMessage(err, 'Không tải được thông tin tài khoản.')));
  }, [userId]);

  const logout = async () => {
    await PublicAuthService.logout();
    router.push('/');
  };

  const tabs: AccountTab[] = [
    { id: AccountTabKey.PROFILE, label: 'Hồ sơ sử học', icon: UserRound },
    { id: AccountTabKey.LEARNING, label: 'Lộ trình của tôi', icon: BookOpen, badge: enrolledPathIds.length },
    { id: AccountTabKey.BOOKMARKS, label: 'Tư liệu đã lưu', icon: Bookmark, badge: savedCount },
    { id: AccountTabKey.FLASHCARDS, label: 'Thẻ ghi nhớ', icon: Layers, badge: flashcardDueCount },
    { id: AccountTabKey.MINDMAPS, label: 'Sơ đồ tư duy', icon: Network, badge: mindmapCount },
    { id: AccountTabKey.SECURITY, label: 'Bảo mật & Phiên', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page,#F5EEDC)] text-[var(--text-body,#2D1A10)]">
      <Header activeTab="account" />

      {/* 1. HERO COVER BANNER HOÀNG GIA (HERITAGE PROFILE COVER) */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#4E1015] via-[#65171D] to-[#4E1015] pt-12 pb-24 text-white shadow-inner">
        {/* Họa tiết tia sáng Đông Sơn mờ ảo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,174,103,0.18),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            {/* Avatar lớn viền kép vàng kim */}
            <div className="relative group shrink-0">
              {profile?.userProfile?.avatarUrl ? (
                <RemoteImage
                  src={profile.userProfile.avatarUrl}
                  alt=""
                  className="size-24 sm:size-28 rounded-full object-cover border-4 border-[#D4AE67] shadow-2xl ring-4 ring-black/20"
                />
              ) : (
                <div className="grid size-24 sm:size-28 place-items-center rounded-full bg-gradient-to-br from-[#C99C48] to-[#B8893F] text-3xl font-extrabold text-[#3D0A0E] border-4 border-[#D4AE67] shadow-2xl ring-4 ring-black/20">
                  {profile ? displayName(profile).slice(0, 2).toUpperCase() : 'HG'}
                </div>
              )}
              {profile?.verified && (
                <div
                  title="Đã xác thực Kim Ấn"
                  className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-emerald-600 border-2 border-[#FAF6EA] text-white shadow-md"
                >
                  <BadgeCheck size={18} />
                </div>
              )}
            </div>

            {/* Thông tin định danh */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#C99C48] to-[#B8893F] px-3 py-0.5 text-xs font-bold text-[#3D0A0E] shadow-xs">
                  <Sparkles size={12} />
                  {profile ? USER_ROLE_LABELS[profile.role] ?? profile.role : 'Học giả'}
                </span>
                {profile?.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                    <ShieldCheck size={12} /> Đã đóng Kim Ấn
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
                    <Mail size={12} /> Chưa xác minh email
                  </span>
                )}
              </div>
              <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[#FFF6E3] tracking-wide drop-shadow-sm">
                {profile ? displayName(profile) : 'Đang tải hồ sơ...'}
              </h1>
              <p className="text-xs sm:text-sm text-[#F5EEDC]/80 mt-1 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <span>{profile?.email}</span>
                {profile?.createdAt && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} className="text-[#D4AE67]" />
                      Hội viên từ {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Nút tác vụ nhanh */}
            <div className="flex items-center gap-2.5 shrink-0">
              {profile && isStaffRole(profile.role) && (
                <Link
                  href="/cms"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AE67]/60 bg-black/25 px-4 py-2 text-xs font-bold text-[#FFF6E3] backdrop-blur-xs hover:bg-black/40 transition shadow-xs"
                >
                  <LayoutDashboard size={14} className="text-[#D4AE67]" />
                  Quản trị CMS
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[#F5EEDC] backdrop-blur-xs hover:bg-white/20 transition"
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SCHOLAR KPI STRIP (HÀNG THỐNG KÊ THÀNH TÍCH SỬ HỌC) */}
      <section className="relative -mt-12 z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] p-4 sm:p-5 shadow-sm transition hover:shadow-md flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#7A1F24] to-[#91252B] text-white shadow-xs">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--text-body,#2D1A10)]">
                {enrolledPathIds.length}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted,#7A6B57)]">
                Lộ trình ghi danh
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] p-4 sm:p-5 shadow-sm transition hover:shadow-md flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#C99C48] to-[#B8893F] text-[#3D0A0E] shadow-xs">
              <Trophy size={22} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--text-body,#2D1A10)]">
                {completedIds.length}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted,#7A6B57)]">
                Bài học hoàn tất
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] p-4 sm:p-5 shadow-sm transition hover:shadow-md flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#3E2B24] to-[#2D1A10] text-[#D4AE67] shadow-xs">
              <Bookmark size={22} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--text-body,#2D1A10)]">
                {savedCount}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted,#7A6B57)]">
                Tư liệu đã ghim
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] p-4 sm:p-5 shadow-sm transition hover:shadow-md flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-xs">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--text-body,#2D1A10)]">
                Học giả
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted,#7A6B57)]">
                Cấp bậc sử học
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT: TABS NAVIGATION & TAB PANELS */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-8 text-center text-red-700 font-semibold shadow-xs">
            {error}
          </div>
        ) : !profile ? (
          <div className="space-y-6">
            <div className="h-14 animate-pulse rounded-2xl bg-[#EAE0CB]" />
            <div className="h-96 animate-pulse rounded-2xl bg-[#EAE0CB]" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Thanh điều hướng Tab phong cách Viên thuốc Capsule hoàng gia */}
            <div className="flex items-center gap-2 overflow-x-auto p-1.5 rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] shadow-xs scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#7A1F24] to-[#91252B] text-white shadow-sm'
                        : 'text-[var(--text-muted,#7A6B57)] hover:bg-[#F5EEDC] hover:text-[var(--text-body,#2D1A10)]'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#D4AE67]' : ''} />
                    <span>{tab.label}</span>
                    {typeof tab.badge === 'number' && tab.badge > 0 && (
                      <span
                        className={`grid min-w-5 h-5 place-items-center rounded-full px-1 text-[10px] font-extrabold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[var(--gold,#B8893F)]/15 text-[var(--gold,#B8893F)]'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Nội dung Tab kích hoạt */}
            <div className="transition-all duration-300">
              {activeTab === AccountTabKey.PROFILE && <ProfileSection profile={profile} onChange={setProfile} />}
              {activeTab === AccountTabKey.LEARNING && <LearningSection />}
              {activeTab === AccountTabKey.BOOKMARKS && <SavedBookmarksSection onCountChange={setSavedCountOverride} />}
              {activeTab === AccountTabKey.FLASHCARDS && <FlashcardsSection onDueCountChange={setFlashcardDueCount} />}
              {activeTab === AccountTabKey.MINDMAPS && <MindmapsSection onCountChange={setMindmapCount} />}
              {activeTab === AccountTabKey.SECURITY && <SecuritySection profile={profile} />}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
