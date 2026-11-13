import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { fetchEntityBySlug } from '@/services/entities/landing.service';
import { buildEntityReaderModel } from '@/components/entity-detail/entity-reader-adapter';
import { EntityHero } from '@/components/entity-detail/EntityReaderParts';
import { EntityReader } from '@/components/entity-detail/EntityReader';
import { READER_SOURCE_PARAM, ReaderSource } from '@/constants/routes';
import '@/components/entity-detail/entity-reader.css';

/**
 * Trang đọc chung cho mọi bài viết. Các đường dẫn /nhan-vat/[slug], /su-kien/[slug], /di-tich/[slug],
 * /thuc-the/[slug] được rewrite về đây (next.config.ts) kèm `?nguon=` để giữ URL cũ và đổi chữ/link
 * quay lại theo lối vào.
 */
const READER_VARIANTS: Record<ReaderSource, {
  section: 'timeline' | 'explore';
  eyebrow: string;
  notFound: string;
  back: { href: string; label: string };
}> = {
  [ReaderSource.ARTICLE]: { section: 'explore', eyebrow: 'BÀI VIẾT', notFound: 'Không tìm thấy bài viết', back: { href: '/', label: 'Về trang chủ' } },
  [ReaderSource.FIGURE]: { section: 'timeline', eyebrow: 'NHÂN VẬT LỊCH SỬ', notFound: 'Không tìm thấy nhân vật lịch sử', back: { href: '/nhan-vat', label: 'Quay về Danh mục nhân vật' } },
  [ReaderSource.EVENT]: { section: 'timeline', eyebrow: 'SỰ KIỆN LỊCH SỬ', notFound: 'Không tìm thấy sự kiện lịch sử', back: { href: '/dong-thoi-gian', label: 'Quay về Dòng thời gian' } },
  [ReaderSource.SITE]: { section: 'timeline', eyebrow: 'DI TÍCH LỊCH SỬ', notFound: 'Không tìm thấy di tích lịch sử', back: { href: '/di-tich', label: 'Quay về Danh mục di tích' } },
  [ReaderSource.ENTITY]: { section: 'timeline', eyebrow: 'TƯ LIỆU THỰC THỂ LỊCH SỬ', notFound: 'Không tìm thấy thực thể lịch sử', back: { href: '/dong-thoi-gian', label: 'Quay về Dòng thời gian' } },
};

const isReaderSource = (value: unknown): value is ReaderSource =>
  typeof value === 'string' && Object.values<string>(ReaderSource).includes(value);

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const entity = await fetchEntityBySlug((await params).slug);
  return { title: entity ? `${entity.name} | HISGO` : 'Không tìm thấy bài viết | HISGO' };
}

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const source = query[READER_SOURCE_PARAM];
  const variant = READER_VARIANTS[isReaderSource(source) ? source : ReaderSource.ARTICLE];
  const entity = await fetchEntityBySlug(slug);
  const model = entity ? buildEntityReaderModel(entity) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header activeSectionId={variant.section} />
      <main className="flex-1">
        {model ? (
          <>
            <EntityHero model={model} />
            <EntityReader model={model} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 py-28 text-center">
            <small className="text-xs font-bold tracking-widest text-[#8C6239] uppercase mb-2">{variant.eyebrow}</small>
            <h1 className="text-3xl font-serif font-bold text-[#2D1A10] mb-3">{variant.notFound}</h1>
            <p className="text-stone-600 mb-6 max-w-md">Đường dẫn &ldquo;{slug}&rdquo; chưa có dữ liệu xuất bản.</p>
            <Link
              href={variant.back.href}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#8C2D19] text-white font-semibold hover:bg-[#6D2111] transition-colors"
            >
              ← {variant.back.label}
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
