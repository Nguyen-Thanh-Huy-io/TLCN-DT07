import React from "react";
import Link from "next/link";
import { EraItem } from "@/data/eras";
import { SafeImage } from "@/components/hisgo/SafeImage";

interface EraCardProps {
  era: EraItem;
}

export function EraCard({ era }: EraCardProps) {
  return (
    <Link
      href={era.href}
      className="group relative w-full aspect-[6/5] rounded-[10px] overflow-hidden shadow-[var(--shadow-card)] border border-[var(--border)]/40 flex flex-col justify-end p-3.5 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
    >
      {/* Background Image / SafeImage with Zoom on Hover */}
      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.04]">
        <SafeImage
          src={era.image}
          alt={era.alt}
          fallbackGradient={era.gradient}
          sizes="(max-width: 640px) 62vw, (max-width: 1024px) 33vw, 16vw"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay to top */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(11, 23, 48, 0.94) 0%, rgba(11, 23, 48, 0.55) 50%, rgba(11, 23, 48, 0.10) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Nội dung đáy card: chừa padding-right 40px cho nút mũi tên tròn 28px */}
      <div className="relative z-20 w-full pr-[40px] text-left space-y-0.5">
        <h3
          className="text-[14px] font-semibold font-[family-name:var(--font-heading)] leading-snug line-clamp-2 !text-white tracking-wide text-balance"
          style={{
            color: "#FFFFFF",
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
          }}
          title={era.title}
        >
          {era.title}
        </h3>

        <p
          className="text-[12px] font-[family-name:var(--font-body)] leading-tight whitespace-nowrap"
          style={{
            color: "rgba(255, 255, 255, 0.9)",
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
          }}
        >
          {era.period}
        </p>
      </div>

      {/* Nút mũi tên tròn 28px absolute ở góc dưới phải */}
      <div className="absolute bottom-3.5 right-3.5 z-20">
        <div className="w-7 h-7 rounded-full border border-[var(--gold)] flex items-center justify-center text-[var(--gold)] group-hover:bg-[var(--gold)] group-hover:text-[var(--ink)] transition-colors duration-300 shadow-sm">
          <svg
            width="12"
            height="12"
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
    </Link>
  );
}
