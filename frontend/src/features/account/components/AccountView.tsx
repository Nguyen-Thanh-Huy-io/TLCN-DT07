'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, BookOpen, KeyRound, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { PublicAuthService, USER_ROLE_LABELS, isStaffRole } from '@/services/auth/public-auth.service';
import { AccountApiService, type MyProfile } from '@/services/auth/account.service';
import { extractErrorMessage } from '@/services/api';
import { HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS, HubBadge, HubButton } from '@/features/public-curriculum/components/hub/HubUi';
import { ProfileSection } from './ProfileSection';
import { LearningSection } from './LearningSection';
import { SecuritySection } from './SecuritySection';

const SECTIONS = [
  { id: 'ho-so', label: 'Hồ sơ', icon: UserRound },
  { id: 'hoc-tap', label: 'Lộ trình của tôi', icon: BookOpen },
  { id: 'bao-mat', label: 'Bảo mật', icon: KeyRound },
];

function displayName(profile: MyProfile): string {
  const full = [profile.userProfile?.lastName, profile.userProfile?.firstName].filter(Boolean).join(' ');
  return full || profile.username;
}

export function AccountView() {
  const user = useAuthSession();
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === null) router.replace('/login?redirect=%2Ftai-khoan');
  }, [user, router]);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    AccountApiService.getProfile()
      .then(setProfile)
      .catch((err) => setError(extractErrorMessage(err, 'Không tải được thông tin tài khoản.')));
  }, [userId]);

  const logout = async () => {
    await PublicAuthService.logout();
    router.push('/');
  };

  return (
    <div className="lh-app">
      <Header activeTab="account" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-2xl border border-lh-red/30 bg-lh-red-soft p-8 text-center text-lh-red">{error}</div>
        ) : !profile ? (
          <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="h-80 animate-pulse rounded-2xl bg-lh-surface-2" />
            <div className="h-96 animate-pulse rounded-2xl bg-lh-surface-2" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
            <aside className="rounded-2xl border border-lh-line bg-lh-surface p-5 shadow-lh-card lg:sticky lg:top-24">
              <div className="flex flex-col items-center text-center">
                {profile.userProfile?.avatarUrl ? (
                  <img src={profile.userProfile.avatarUrl} alt="" className="size-20 rounded-full object-cover" />
                ) : (
                  <span className="grid size-20 place-items-center rounded-full bg-lh-brand text-2xl font-bold text-white">
                    {displayName(profile).slice(0, 2).toUpperCase()}
                  </span>
                )}
                <h1 className="mt-3 font-[family-name:var(--font-heading)] text-xl font-bold text-lh-ink">{displayName(profile)}</h1>
                <p className="mt-0.5 truncate text-sm text-lh-muted">{profile.email}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <HubBadge tone="brand">{USER_ROLE_LABELS[profile.role] ?? profile.role}</HubBadge>
                  {profile.verified ? (
                    <HubBadge tone="gold">
                      <BadgeCheck className="size-3.5" /> Đã xác minh
                    </HubBadge>
                  ) : (
                    <HubBadge tone="red">Chưa xác minh email</HubBadge>
                  )}
                </div>
                <p className="mt-3 text-xs text-lh-muted">
                  Tham gia từ {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <nav className="mt-5 grid gap-1 border-t border-lh-line pt-4">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-lh-ink transition hover:bg-lh-surface-2 hover:text-lh-brand"
                  >
                    <s.icon className="size-4" /> {s.label}
                  </a>
                ))}
                {isStaffRole(profile.role) && (
                  <Link
                    href="/cms"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-lh-ink transition hover:bg-lh-surface-2 hover:text-lh-brand"
                  >
                    <LayoutDashboard className="size-4" /> Vào trang quản trị
                  </Link>
                )}
              </nav>
              <HubButton variant="outline" className="mt-4 w-full" onClick={logout}>
                <LogOut className="size-4" /> Đăng xuất
              </HubButton>
            </aside>

            <div className="grid gap-6">
              <ProfileSection profile={profile} onChange={setProfile} />
              <LearningSection />
              <SecuritySection profile={profile} />
              <p className="text-center text-xs text-lh-muted">
                Cần hỗ trợ tài khoản?{' '}
                <Link href="/" className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.ghost} px-1 py-0 text-xs`}>
                  Về trang chủ
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
