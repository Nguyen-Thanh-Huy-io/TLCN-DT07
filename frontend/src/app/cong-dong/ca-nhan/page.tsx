import type { Metadata } from 'next';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { fetchCommunityProfileSSR } from '@/features/community/api';
import { CommunityProfileView } from '@/features/community/components/CommunityProfileView';

export const metadata: Metadata = {
  title: 'Trang cá nhân Cộng đồng | HISGO',
  description:
    'Quản lý hồ sơ nghiên cứu sử học, các bài thảo luận đã đăng và mạng lưới theo dõi trên Cộng đồng HISGO.',
};

export default async function CommunityPersonalProfilePage() {
  const initialProfile = await fetchCommunityProfileSSR('me');

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5EEDC] text-[#14233F] font-[family-name:var(--font-body)]">
      <div data-ui="site-header">
        <Header activeTab="community" />
      </div>
      <main>
        <CommunityProfileView
          initialProfile={initialProfile}
          identifier="me"
          isPersonalRoute={true}
        />
      </main>
      <div data-ui="site-footer">
        <Footer />
      </div>
    </div>
  );
}
