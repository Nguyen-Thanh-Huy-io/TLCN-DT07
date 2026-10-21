import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import {
  PUBLIC_ROUTE_PREFIX,
  PublicLessonSummaryDto,
} from '@/services/entities/landing.service';

export function PublicLessonCard({
  lesson,
}: {
  lesson: PublicLessonSummaryDto;
}) {
  return (
    <article className="rounded-xl border border-[#D8C7A6] bg-[#FAF6EA] p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5D7BC] pb-3">
        <h3 className="text-xl font-bold text-[#7A1E1E]">{lesson.title}</h3>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#EFE4CC] text-[#6B4A2B]">
          ⏱ {lesson.estimatedReadMinutes} phút đọc
        </span>
      </div>

      {lesson.contentRichText && (
        <div
          className="prose max-w-none text-[#2D241C] leading-relaxed space-y-2"
          dangerouslySetInnerHTML={{ __html: lesson.contentRichText }}
        />
      )}

      {lesson.sourceReferenceNote && (
        <p className="text-xs italic text-[#6B5A47] border-t border-[#E5D7BC] pt-3">
          📚 Tư liệu tham khảo: {lesson.sourceReferenceNote}
        </p>
      )}

      {(lesson.entities.length > 0 ||
        lesson.locations.length > 0 ||
        lesson.events.length > 0) && (
        <div className="pt-3 border-t border-[#E5D7BC] flex flex-wrap gap-2 items-center text-xs">
          <span className="font-semibold text-[#5C4328]">
            Đồ thị Tri thức liên kết:
          </span>
          {lesson.entities.map((ent) => (
            <Link
              key={ent.id}
              href={`${PUBLIC_ROUTE_PREFIX.FIGURE}/${ent.slug}`}
              className="px-2.5 py-1 rounded-full bg-[#8B1E1E]/10 text-[#7A1E1E] font-medium hover:bg-[#8B1E1E]/20 transition"
            >
              👤 {ent.name}
            </Link>
          ))}
          {lesson.locations.map((loc) => (
            <span
              key={loc.id}
              className="px-2.5 py-1 rounded-full bg-[#1C446C]/10 text-[#1C446C] font-medium"
            >
              📍 {loc.name}
              {loc.latitude && loc.longitude
                ? ` (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`
                : ''}
            </span>
          ))}
          {lesson.events.map((evt) => (
            <span
              key={evt.id}
              className="px-2.5 py-1 rounded-full bg-[#B6842D]/15 text-[#6E4D14] font-medium"
            >
              ⚔️ {evt.startYear}: {evt.title}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function PublicDetailLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="hisgo-theme min-h-screen flex flex-col bg-[#F5EEDC] text-[#2D241C]">
      <Header />
      <main className="flex-1 max-w-[1160px] w-full mx-auto px-6 py-10 space-y-10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#7A1E1E] hover:underline mb-4"
          >
            ← Quay lại Trang chủ Dòng chảy Lịch sử
          </Link>
          <div className="rounded-2xl border border-[#D4B982] bg-gradient-to-br from-[#7A1E1E] via-[#5E1616] to-[#3B1010] text-[#FAF6EA] p-8 shadow-md">
            <p className="text-xs uppercase tracking-widest text-[#E5C17B] font-semibold mb-2">
              {eyebrow}
            </p>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-sm md:text-base text-[#F2E6CE]/90 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
