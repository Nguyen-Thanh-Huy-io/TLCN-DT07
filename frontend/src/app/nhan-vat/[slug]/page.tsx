import React from 'react';
import Link from 'next/link';
import {
  fetchFigureBySlug,
  PUBLIC_ROUTE_PREFIX,
} from '@/services/entities/landing.service';
import {
  PublicDetailLayout,
  PublicLessonCard,
} from '@/components/hisgo/PublicDetailView';

export default async function FigureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const figure = await fetchFigureBySlug(slug);

  if (!figure) {
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

  const yearsLabel = figure.birthYear
    ? `(${figure.birthYear} – ${figure.deathYear ?? 'nay'})`
    : '';

  return (
    <PublicDetailLayout
      eyebrow={`HỒ SƠ NHÂN VẬT LỊCH SỬ ${yearsLabel}`}
      title={figure.name}
      subtitle={figure.tagline}
    >
      {/* 1. Tiểu sử & Sự nghiệp */}
      <section className="rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-6 space-y-3">
        <h2 className="text-xl font-bold text-[#7A1E1E]">
          Tiểu sử & Dấu ấn lịch sử
        </h2>
        <p className="text-base leading-relaxed text-[#2D241C]">
          {figure.description || figure.tagline}
        </p>
        {figure.period && (
          <div className="pt-2">
            <Link
              href={`${PUBLIC_ROUTE_PREFIX.PERIOD}/${figure.period.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C446C] hover:underline"
            >
              🕰 Thuộc thời kỳ: {figure.period.name} {figure.period.timeLabel}
            </Link>
          </div>
        )}
      </section>

      {/* 2. Các Bài học gắn với nhân vật trong Đồ thị Tri thức */}
      {figure.lessons.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
            Bài học Lịch sử liên quan ({figure.lessons.length})
          </h2>
          <div className="space-y-6">
            {figure.lessons.map((lesson) => (
              <PublicLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      )}
    </PublicDetailLayout>
  );
}
