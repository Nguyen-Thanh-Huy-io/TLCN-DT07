import React from 'react';
import Link from 'next/link';
import {
  fetchTopicBySlug,
  PUBLIC_ROUTE_PREFIX,
} from '@/services/entities/landing.service';
import {
  PublicDetailLayout,
  PublicLessonCard,
} from '@/components/hisgo/PublicDetailView';

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await fetchTopicBySlug(slug);

  if (!topic) {
    return (
      <PublicDetailLayout
        eyebrow="CHƯƠNG SỬ & CHUYÊN ĐỀ"
        title="Không tìm thấy chương sử"
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

  return (
    <PublicDetailLayout
      eyebrow={
        topic.eyebrow ||
        (topic.period
          ? `${topic.period.name} ${topic.period.timeLabel}`
          : 'CHƯƠNG SỬ VIỆT NAM')
      }
      title={topic.name}
      subtitle={topic.description}
    >
      {/* 1. Các chuyên đề nhánh con (nếu có) */}
      {topic.children.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
            Các chuyên đề thành phần ({topic.children.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topic.children.map((child) => (
              <Link
                key={child.id}
                href={`${PUBLIC_ROUTE_PREFIX.CHAPTER}/${child.slug}`}
                className="block rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-5 hover:border-[#7A1E1E] transition"
              >
                <h3 className="text-lg font-bold text-[#2D241C]">
                  {child.name}
                </h3>
                {child.description && (
                  <p className="text-sm text-[#5C4C3D] mt-2">
                    {child.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 2. Danh sách Bài học chuyên sâu (Rich Text + Knowledge Graph) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
          Nội dung Bài học Lịch sử ({topic.lessons.length})
        </h2>
        {topic.lessons.length === 0 ? (
          <div className="rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-6 text-sm text-[#5C4C3D]">
            Chủ đề này đang được biên tập viên cập nhật thêm bài học chi tiết.
          </div>
        ) : (
          <div className="space-y-6">
            {topic.lessons.map((lesson) => (
              <PublicLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Sự kiện Lịch sử liên quan */}
      {topic.events.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#7A1E1E] border-b border-[#D8C7A6] pb-2">
            Mốc sự kiện lịch sử ({topic.events.length})
          </h2>
          <div className="space-y-3">
            {topic.events.map((evt) => (
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
    </PublicDetailLayout>
  );
}
