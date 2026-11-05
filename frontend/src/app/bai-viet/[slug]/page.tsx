import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { fetchEntityBySlug } from '@/services/entities/landing.service';
import { buildEntityReaderModel } from '@/components/entity-detail/entity-reader-adapter';
import { EntityHero } from '@/components/entity-detail/EntityHero';
import { EntityReader } from '@/components/entity-detail/EntityReader';
import '@/components/entity-detail/entity-reader.css';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const entity = await fetchEntityBySlug((await params).slug);
  return { title: entity ? `${entity.name} | HISGO` : 'Không tìm thấy bài viết | HISGO' };
}

/** Trang đọc chung cho mọi bài viết (dùng cùng trình đọc với /nhan-vat, /su-kien, /di-tich...). */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const entity = await fetchEntityBySlug(slug);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header activeSectionId="explore" />
      <main className="flex-1">
        {entity ? (
          <>
            <EntityHero model={buildEntityReaderModel(entity)} />
            <EntityReader model={buildEntityReaderModel(entity)} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 py-28 text-center">
            <h1 className="text-3xl font-serif font-bold text-[#2D1A10] mb-3">Không tìm thấy bài viết</h1>
            <p className="text-stone-600 mb-6 max-w-md">Đường dẫn &ldquo;{slug}&rdquo; chưa có bài viết đã xuất bản.</p>
            <Link href="/" className="px-6 py-2.5 rounded-full bg-[#8C2D19] text-white font-semibold">
              ← Về trang chủ
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
