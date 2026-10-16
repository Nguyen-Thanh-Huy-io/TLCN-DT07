import React from "react";
import Link from "next/link";
import { ChapterItem } from "@/data/chapters";
import { SafeImage } from "@/components/hisgo/SafeImage";

interface ChapterCardProps {
  chapter: ChapterItem;
  hasTopLeftOrnament?: boolean;
  hasTopRightOrnament?: boolean;
}

export function ChapterCard({
  chapter,
  hasTopLeftOrnament = false,
  hasTopRightOrnament = false,
}: ChapterCardProps) {
  return (
    <Link
      href={chapter.href}
      className="group relative w-full aspect-[3/4.4] rounded-[10px] overflow-hidden shadow-[var(--shadow-card)] border border-[var(--border)]/40 flex flex-col justify-end p-4 sm:p-5 transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
    >
      {/* Background Image / SafeImage Full-bleed with Zoom effect on Hover */}
      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.04]">
        <SafeImage
          src={chapter.image}
          alt={chapter.alt}
          fallbackGradient={chapter.gradient}
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 16vw"
          className="w-full h-full"
        />
      </div>

      {/* Gradient to top overlay-ink: 0.92 ở đáy -> 0.70 ở 45% -> 0.15 ở đỉnh */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(11, 23, 48, 0.94) 0%, rgba(11, 23, 48, 0.70) 45%, rgba(11, 23, 48, 0.15) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Ornament góc vàng ở góc trên-trái (nét 1.5px, cỡ 18-20px) */}
      {hasTopLeftOrnament && (
        <span
          className="absolute top-2.5 left-2.5 w-5 h-5 border-t-[1.5px] border-l-[1.5px] border-[var(--border-gold)] z-20 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Ornament góc vàng ở góc trên-phải */}
      {hasTopRightOrnament && (
        <span
          className="absolute top-2.5 right-2.5 w-5 h-5 border-t-[1.5px] border-r-[1.5px] border-[var(--border-gold)] z-20 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Nội dung đáy card */}
      <div className="relative z-20 space-y-2 text-left">
        <p
          className="text-[11px] sm:text-[12px] font-bold tracking-widest uppercase !text-[var(--on-dark-muted)]"
          style={{
            color: "var(--on-dark-muted)",
            textShadow: "0 1px 8px rgba(0, 0, 0, 0.45)",
          }}
        >
          {chapter.eyebrow}
        </p>

        <h3
          className="text-lg sm:text-[20px] font-bold font-[family-name:var(--font-heading)] leading-snug !text-white"
          style={{
            color: "#FFFFFF",
            textShadow: "0 1px 8px rgba(0, 0, 0, 0.45)",
          }}
        >
          {chapter.title}
        </h3>

        <p
          className="text-[13px] sm:text-[13.5px] font-[family-name:var(--font-body)] line-clamp-5 leading-relaxed"
          style={{
            color: "rgba(255, 255, 255, 0.88)",
            textShadow: "0 1px 8px rgba(0, 0, 0, 0.45)",
          }}
        >
          {chapter.description}
        </p>

        {/* Nút tròn 32px viền gold */}
        <div className="pt-2 flex justify-end">
          <div className="w-8 h-8 rounded-full border border-[var(--gold)] flex items-center justify-center text-[var(--gold)] group-hover:bg-[var(--gold)] group-hover:text-[var(--ink)] transition-colors duration-300">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
