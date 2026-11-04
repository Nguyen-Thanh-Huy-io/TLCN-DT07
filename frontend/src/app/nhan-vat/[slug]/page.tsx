import React from 'react';
import Link from 'next/link';
import {
  fetchFigureBySlug,
  fetchFigureDirectory,
  fetchPeriods,
} from '@/services/entities/landing.service';
import { PublicDetailLayout } from '@/components/hisgo/PublicDetailView';
import { FigureDetailView } from '@/components/figure-detail/FigureDetailView';
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
      </PublicDetailLayout>
    );
  }

  return (
    <FigureDetailView figure={figure} directory={directory} periods={periods} lessons={detail.lessons} />
  );
}
