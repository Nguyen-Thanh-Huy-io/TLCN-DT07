import type { Metadata } from 'next';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { COMMUNITY_FEED_PAGE_SIZE, fetchCommunityFeedSSR } from '@/features/community/api';
import { CommunityFeed } from '@/features/community/components/CommunityFeed';

export const metadata: Metadata = {
  title: 'Diễn đàn Lịch sử Cộng đồng | HISGO',
  description:
    'Không gian đặt câu hỏi sử học, thảo luận nhanh và chia sẻ các bài chuyên khảo từ HISGO Blog.',
};

interface CongDongPageProps {
  searchParams?: Promise<{ shareBlog?: string }>;
}

export default async function CongDongPage({ searchParams }: CongDongPageProps) {
  const [initialPosts, resolvedParams] = await Promise.all([
    fetchCommunityFeedSSR({ limit: COMMUNITY_FEED_PAGE_SIZE }),
    searchParams ? searchParams : Promise.resolve({} as { shareBlog?: string }),
  ]);

  const initialShareBlogSlug =
    typeof resolvedParams?.shareBlog === 'string' && resolvedParams.shareBlog.trim()
      ? resolvedParams.shareBlog.trim()
      : null;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5EEDC] text-[#14233F] font-[family-name:var(--font-body)]">
      <Header activeTab="community" />
      <main>
        <CommunityFeed
          initialPosts={initialPosts}
          initialShareBlogSlug={initialShareBlogSlug}
        />
      </main>
      <Footer />
    </div>
  );
}
