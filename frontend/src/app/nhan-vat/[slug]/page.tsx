import React from 'react';
import Link from 'next/link';
import {
  fetchFigureBySlug,
  fetchFigureDirectory,
  fetchPeriods,
} from '@/services/entities/landing.service';
import { PublicDetailLayout, PublicLessonCard } from '@/components/hisgo/PublicDetailView';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { FigureFullProfile } from '@/components/figures/FigureFullProfile';
import { buildFigureViews } from '@/components/figures/figure-utils';

export default async function FigureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [detail, directoryRaw, periods] = await Promise.all([
    fetchFigureBySlug(slug),
    fetchFigureDirectory(),
    fetchPeriods(),
  ]);

  if (!detail) {
    return (
      <PublicDetailLayout
        eyebrow="NHÂN VẬT & THỰC THỂ LỊCH SỬ"
        title="Không tìm thấy hồ sơ nhân vật"
        subtitle={`Đường dẫn "${slug}" chưa có dữ liệu xuất bản.`}
      >
        <div className="rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-6">
          <Link href="/" className="text-[#7A1E1E] font-semibold underline">
            Quay về trang chủ HisGo
          </Link>
        </div>
      </PublicDetailLayout>
    );
  }

  const directory = buildFigureViews(directoryRaw, periods);
  const figure = directory.find((f) => f.slug === slug);

  // Nhân vật có trong getFigureBySlug nhưng chưa xuất hiện trong directory công khai (vd.
  // khác trạng thái xuất bản) — hiếm, dùng tạm layout cơ bản thay vì trắng trang.
  if (!figure) {
    return (
      <PublicDetailLayout
        eyebrow="HỒ SƠ NHÂN VẬT LỊCH SỬ"
        title={detail.name}
        subtitle={detail.tagline}
      >
        <section className="rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-6 space-y-3">
          <h2 className="text-xl font-bold text-[#7A1E1E]">Tiểu sử & Dấu ấn lịch sử</h2>
          <p className="text-base leading-relaxed text-[#2D241C]">
            {detail.description || detail.tagline}
          </p>
        </section>
        {detail.lessons.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
              Bài học Lịch sử liên quan ({detail.lessons.length})
            </h2>
            <div className="space-y-6">
              {detail.lessons.map((lesson) => (
                <PublicLessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </section>
        )}
      </PublicDetailLayout>
    );
  }

  return (
    <div className="bg-[#F5EFE1] min-h-screen pb-16">
      <Header />
      <FigureFullProfile figure={figure} directory={directory} periods={periods} />

      {detail.lessons.length > 0 && (
        <section className="mx-auto max-w-[900px] px-8 space-y-4">
          <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
            Bài học Lịch sử liên quan ({detail.lessons.length})
          </h2>
          <div className="space-y-6">
            {detail.lessons.map((lesson) => (
              <PublicLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}
