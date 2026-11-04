import React from "react";
import Link from "next/link";
import { timelineData, TimelineNode } from "@/data/timeline";
import { OrnamentFrame } from "@/components/hisgo/OrnamentFrame";
import { SafeImage } from "@/components/hisgo/SafeImage";

interface TimelineStripProps {
  nodes?: TimelineNode[];
}

export function TimelineStrip({ nodes = timelineData }: TimelineStripProps) {
  return (
    <OrnamentFrame cornerSize={22} className="w-full !p-6 sm:!p-8 bg-[var(--bg-surface)]/40 backdrop-blur-[2px] overflow-hidden border-[var(--border-gold)]">
      {/* 1. MÀN HÌNH DESKTOP (>= 1024px): Các node chia đều trên 1 hàng */}
      <div className="hidden lg:block relative py-4">
        {/* Đường nối ngang xuyên tâm các node */}
        <div
          className="absolute top-[42px] left-[8%] right-[8%] h-[2px] bg-[var(--gold)]/40 z-0"
          aria-hidden="true"
        />

        {/* 6 Node grid chia đều, gap tối thiểu 16px (gap-4) */}
        <div className="relative z-10 grid grid-cols-6 gap-4 lg:gap-5">
          {nodes.map((node, index) => (
            <div key={node.id} className="relative flex flex-col items-center">
              {/* Chấm nhỏ gold giữa hai node liền kề */}
              {index < nodes.length - 1 && (
                <span
                  className="absolute top-[38px] -right-[14px] w-2.5 h-2.5 rounded-full bg-[var(--gold)] border-2 border-[var(--bg-surface)] z-10"
                  aria-hidden="true"
                />
              )}

              {/* Node Link */}
              <Link
                href={`/giai-doan/${node.slug}`}
                className="group flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-[var(--radius-card)] p-1.5 transition-transform duration-200 w-full"
              >
                {/* Node Avatar tròn 72px, viền gold-light 3px, bóng CSS */}
                <div
                  className="w-[72px] h-[72px] rounded-full border-[3px] border-[var(--gold-light)] group-hover:border-[var(--gold)] shadow-md flex items-center justify-center transition-all duration-300 group-hover:scale-[1.06] overflow-hidden flex-shrink-0"
                  title={node.alt}
                >
                  <SafeImage
                    src={node.image}
                    alt={node.alt}
                    fallbackLetter={node.letter}
                    sizes="72px"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Tên thời kỳ: 14px, weight 600, cho phép 2 dòng, min-height 42px */}
                <div className="mt-3 w-full min-h-[42px] flex items-center justify-center">
                  <h3 className="text-[14px] font-semibold font-[family-name:var(--font-heading)] text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors leading-snug px-0.5 line-clamp-2 text-center text-balance">
                    {node.title}
                  </h3>
                </div>

                {/* Niên đại: 12px, đặt trong ngoặc đơn, min-height 32px (2 dòng), text-balance */}
                <div className="mt-1 w-full min-h-[32px] flex items-start justify-center">
                  <p className="text-[12px] text-[var(--text-muted)] font-[family-name:var(--font-body)] leading-tight max-w-[150px] text-center text-balance">
                    {node.period}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MÀN HÌNH TABLET (640px - 1023px): Cuộn ngang scroll-snap */}
      <div className="hidden sm:block lg:hidden relative">
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-[var(--bg-surface)] to-transparent z-20"
          aria-hidden="true"
        />

        <div className="relative overflow-x-auto pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
          <div
            className="absolute top-[46px] left-10 w-[840px] h-[2px] bg-[var(--gold)]/40 z-0"
            aria-hidden="true"
          />

          <div className="flex items-start gap-4 min-w-[890px] px-2 relative z-10">
            {nodes.map((node, index) => (
              <div
                key={node.id}
                className="w-[145px] flex-shrink-0 flex flex-col items-center relative snap-start"
              >
                {index < nodes.length - 1 && (
                  <span
                    className="absolute top-[38px] -right-[12px] w-2 h-2 rounded-full bg-[var(--gold)] border-2 border-[var(--bg-surface)] z-10"
                    aria-hidden="true"
                  />
                )}

                <Link
                  href={`/giai-doan/${node.slug}`}
                  className="group flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] p-2 rounded-[var(--radius-card)] w-full"
                >
                  <div
                    className="w-[68px] h-[68px] rounded-full border-[3px] border-[var(--gold-light)] group-hover:border-[var(--gold)] shadow-md flex items-center justify-center transition-all duration-300 group-hover:scale-[1.06] overflow-hidden"
                    title={node.alt}
                  >
                    <SafeImage
                      src={node.image}
                      alt={node.alt}
                      fallbackLetter={node.letter}
                      sizes="68px"
                      className="w-full h-full"
                    />
                  </div>

                  <div className="min-h-[40px] flex items-center justify-center mt-3">
                    <h3 className="text-[14px] font-bold font-[family-name:var(--font-heading)] text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                      {node.title}
                    </h3>
                  </div>

                  <p className="mt-1 text-[12px] text-[var(--text-muted)] font-[family-name:var(--font-body)] text-balance">
                    {node.period}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MÀN HÌNH MOBILE (< 640px): Timeline dọc */}
      <div className="block sm:hidden relative pl-3 pr-1 py-2">
        <div
          className="absolute top-7 bottom-8 left-[35px] w-[2px] bg-[var(--gold)]/40 z-0"
          aria-hidden="true"
        />

        <div className="space-y-5 relative z-10">
          {nodes.map((node) => (
            <Link
              key={node.id}
              href={`/giai-doan/${node.slug}`}
              className="group flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-[var(--radius-card)] p-1.5 transition-colors"
            >
              <div
                className="w-14 h-14 rounded-full border-[3px] border-[var(--gold-light)] group-hover:border-[var(--gold)] shadow-sm flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-[1.06] overflow-hidden bg-[var(--bg-surface)]"
                title={node.alt}
              >
                <SafeImage
                  src={node.image}
                  alt={node.alt}
                  fallbackLetter={node.letter}
                  sizes="56px"
                  className="w-full h-full"
                />
              </div>

              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold font-[family-name:var(--font-heading)] text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                  {node.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-body)] mt-0.5">
                  {node.period}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </OrnamentFrame>
  );
}
