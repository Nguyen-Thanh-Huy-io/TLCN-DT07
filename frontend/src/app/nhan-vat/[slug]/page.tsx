import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { fetchEntityBySlug } from '@/services/entities/landing.service';
import { buildEntityReaderModel } from '@/components/entity-detail/entity-reader-adapter';
import { EntityHero } from '@/components/entity-detail/EntityHero';
import { EntityReader } from '@/components/entity-detail/EntityReader';
import '@/components/entity-detail/entity-reader.css';

interface FigureDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function FigureDetailPage({ params }: FigureDetailPageProps) {
  const { slug } = await params;
  const entity = await fetchEntityBySlug(slug);

  if (!entity) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Header activeSectionId="timeline" />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <small className="text-xs font-bold tracking-widest text-[#8C6239] uppercase mb-2">
            NHÂN VẬT LỊCH SỬ
          </small>
          <h1 className="text-3xl font-serif font-bold text-[#2D1A10] mb-3">
            Không tìm thấy nhân vật lịch sử
          </h1>
          <p className="text-stone-600 mb-6 max-w-md">
            Đường dẫn &ldquo;{slug}&rdquo; chưa có dữ liệu xuất bản.
          </p>
          <Link
            href="/nhan-vat"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#8C2D19] text-white font-semibold hover:bg-[#6D2111] transition-colors"
          >
            ← Quay về Danh mục nhân vật
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const model = buildEntityReaderModel(entity);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header activeSectionId="timeline" />
      <main className="flex-1">
        <EntityHero model={model} />
        <EntityReader model={model} />
      </main>
      <Footer />
    </div>
  );
}
