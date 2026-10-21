import React from 'react';
import Link from 'next/link';
import {
  fetchPeriodBySlug,
  PUBLIC_ROUTE_PREFIX,
} from '@/services/entities/landing.service';
import { PublicDetailLayout } from '@/components/hisgo/PublicDetailView';

export default async function PeriodDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const period = await fetchPeriodBySlug(slug);

  if (!period) {
    return (
      <PublicDetailLayout
        eyebrow="GIAI ĐOẠN LỊCH SỬ"
        title="Không tìm thấy giai đoạn lịch sử"
        subtitle={`Đường dẫn "${slug}" chưa có dữ liệu xuất bản trong cơ sở dữ liệu.`}
      >
        <div className="rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-6">
          <Link href="/" className="text-[#7A1E1E] font-semibold underline">
            Quay về trang chủ HisGo
          </Link>
        </div>
      </PublicDetailLayout>
    );
  }

  return (
    <PublicDetailLayout
      eyebrow={`GIAI ĐOẠN LỊCH SỬ ${period.timeLabel}`}
      title={period.name}
      subtitle={period.description}
    >
      {/* 1. Các Chương sử / Chuyên đề thuộc Giai đoạn */}
      {period.topics.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
            Các Chương sử & Chuyên đề trọng tâm ({period.topics.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {period.topics.map((topic) => (
              <Link
                key={topic.id}
                href={`${PUBLIC_ROUTE_PREFIX.CHAPTER}/${topic.slug}`}
                className="block rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-5 hover:border-[#7A1E1E] hover:shadow-md transition"
              >
                {topic.eyebrow && (
                  <p className="text-xs font-semibold uppercase text-[#8A5A2B] mb-1">
                    {topic.eyebrow}
                  </p>
                )}
                <h3 className="text-lg font-bold text-[#2D241C]">
                  {topic.name}
                </h3>
                {topic.description && (
                  <p className="text-sm text-[#5C4C3D] mt-2 line-clamp-3">
                    {topic.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 2. Dòng chảy Sự kiện Lịch sử trong giai đoạn */}
      {period.events.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
            Dòng sự kiện tiêu biểu ({period.events.length})
          </h2>
          <div className="space-y-3">
            {period.events.map((evt) => (
              <div
                key={evt.id}
                className="rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-4 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="shrink-0 px-3 py-1.5 rounded-lg bg-[#7A1E1E] text-[#FAF6EA] font-bold text-sm text-center min-w-[110px]">
                  {evt.eventDateNote || `Năm ${evt.eventYear}`}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-[#2D241C]">
                    {evt.title}
                  </h3>
                  {evt.location && (
                    <p className="text-xs font-medium text-[#1C446C]">
                      📍 Địa điểm: {evt.location}
                    </p>
                  )}
                  {evt.description && (
                    <p className="text-sm text-[#4F4032]">{evt.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Nhân vật & Thực thể Lịch sử thuộc giai đoạn */}
      {period.figures.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
            Nhân vật & Thực thể Lịch sử ({period.figures.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {period.figures.map((fig) => (
              <Link
                key={fig.id}
                href={`${PUBLIC_ROUTE_PREFIX.FIGURE}/${fig.slug}`}
                className="rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-4 hover:border-[#7A1E1E] transition block"
              >
                <h3 className="font-bold text-base text-[#7A1E1E]">
                  {fig.name}
                </h3>
                {fig.birthYear && (
                  <p className="text-xs text-[#6B5A47]">
                    Niên đại: {fig.birthYear} – {fig.deathYear ?? 'nay'}
                  </p>
                )}
                {fig.tagline && (
                  <p className="text-sm text-[#3E3125] mt-1">{fig.tagline}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </PublicDetailLayout>
  );
}
