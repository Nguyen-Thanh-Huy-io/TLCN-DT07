import type { Metadata } from 'next';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { fetchCommunityProfileSSR } from '@/features/community/api';
import { CommunityProfileView } from '@/features/community/components/CommunityProfileView';

interface MemberProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: MemberProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username || '');
  const profile = await fetchCommunityProfileSSR(decoded);
  return {
    title: `${profile.user.displayName} — Hồ sơ Cộng đồng Lịch sử | HISGO`,
    description:
      profile.user.bio ||
      `Theo dõi các bài thảo luận và chuyên khảo lịch sử của ${profile.user.displayName} trên Cộng đồng HISGO.`,
  };
}

export default async function CommunityMemberProfilePage({ params }: MemberProfilePageProps) {
  const { username } = await params;
  const decoded = decodeURIComponent(username || '');
  const initialProfile = await fetchCommunityProfileSSR(decoded);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5EEDC] text-[#14233F] font-[family-name:var(--font-body)]">
      <div data-ui="site-header">
        <Header activeTab="community" />
      </div>
      <main>
        <CommunityProfileView
          initialProfile={initialProfile}
          identifier={decoded}
          isPersonalRoute={false}
        />
      </main>
      <div data-ui="site-footer">
        <Footer />
      </div>
    </div>
  );
}
