import type { Metadata } from 'next';
import { Footer } from '@/components/hisgo/Footer';
import { Header } from '@/components/hisgo/Header';
import { fetchCommunityMembersSSR } from '@/features/community/api';
import { CommunityMembersDirectory } from '@/features/community/components/CommunityMembersDirectory';

export const metadata: Metadata = {
  title: 'Thành viên Cộng đồng | HISGO',
  description:
    'Khám phá, tìm kiếm và kết nối với tất cả thành viên đang đóng góp trên Diễn đàn Lịch sử HISGO.',
};

export default async function CongDongThanhVienPage() {
  const initialData = await fetchCommunityMembersSSR({ page: 1, limit: 18 });

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5EEDC] text-[#14233F] font-[family-name:var(--font-body)]">
      <Header activeTab="community" />
      <main>
        <CommunityMembersDirectory initialData={initialData} />
      </main>
      <Footer />
    </div>
  );
}
