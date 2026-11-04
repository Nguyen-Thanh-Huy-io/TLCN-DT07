import React from "react";
import Link from "next/link";
import { FigureItem } from "@/data/figures";
import { SafeImage } from "@/components/hisgo/SafeImage";

interface FigureCardProps {
  figure: FigureItem;
}

export function FigureCard({ figure }: FigureCardProps) {
  return (
    <Link
      href={figure.href}
      className="group relative flex flex-col items-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-[10px] p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-gold)] hover:shadow-[var(--shadow-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] w-full"
    >
      {/* Ảnh chân dung tỉ lệ 4:3, bo 8px với SafeImage */}
      <div className="w-full aspect-[4/3] rounded-[8px] overflow-hidden relative shadow-inner">
        <SafeImage
          src={figure.image}
          alt={figure.alt}
          fallbackGradient={figure.gradient}
          fallbackLetter={figure.letter}
          sizes="(max-width: 640px) 44vw, (max-width: 1024px) 33vw, 16vw"
          className="w-full h-full"
        />
      </div>

      {/* Dưới ảnh: Tên */}
      <div className="min-h-[26px] flex items-center justify-center mt-3">
        <h3 className="text-[15px] sm:text-[16px] font-bold font-[family-name:var(--font-heading)] text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors leading-snug line-clamp-1">
          {figure.name}
        </h3>
      </div>

      {/* Tagline cố định 2 dòng */}
      <div className="min-h-[38px] flex items-center justify-center mt-1">
        <p className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-[family-name:var(--font-body)] line-clamp-2 leading-tight px-1 text-balance">
          {figure.tagline}
        </p>
      </div>

      {/* Góc dưới phải: Nút tròn 20px */}
      <div className="w-full flex justify-end mt-2 pt-1 border-t border-transparent">
        <div className="w-5 h-5 rounded-full border border-[var(--gold)] flex items-center justify-center text-[var(--gold)] group-hover:bg-[var(--gold)] group-hover:text-[var(--ink)] transition-colors flex-shrink-0">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
