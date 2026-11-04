import React from "react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({ title, subtitle, className = "" }: SectionTitleProps) {
  return (
    <div className={`text-center px-4 ${className}`}>
      {/* Decorative Title Row */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
        {/* Left Cloud Scroll Ornament */}
        <div className="text-[var(--gold)] flex-shrink-0 select-none flex items-center">
          <svg
            width="42"
            height="15"
            viewBox="0 0 54 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-[15px] w-auto"
          >
            <path
              d="M2 9 C10 9 14 3 22 3 C27 3 30 6 30 9 C30 13 25 15 20 15 C14 15 11 11 11 8 C11 4 16 1 22 1 C30 1 36 6 38 9 C40 12 45 15 52 9"
              stroke="var(--gold)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Heading: weight 600, text-balance */}
        <h2 className="text-xl md:text-2xl lg:text-[28px] font-semibold font-[family-name:var(--font-heading)] text-[var(--ink)] tracking-tight px-1 text-balance">
          {title}
        </h2>

        {/* Right Cloud Scroll Ornament (Đối xứng gương) */}
        <div className="text-[var(--gold)] flex-shrink-0 select-none flex items-center scale-x-[-1]">
          <svg
            width="42"
            height="15"
            viewBox="0 0 54 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-[15px] w-auto"
          >
            <path
              d="M2 9 C10 9 14 3 22 3 C27 3 30 6 30 9 C30 13 25 15 20 15 C14 15 11 11 11 8 C11 4 16 1 22 1 C30 1 36 6 38 9 C40 12 45 15 52 9"
              stroke="var(--gold)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Subtitle 13-14px, màu text-muted */}
      {subtitle && (
        <p className="mt-2 text-[13px] md:text-[14px] text-[var(--text-muted)] font-[family-name:var(--font-body)] max-w-xl mx-auto px-4 text-balance">
          {subtitle}
        </p>
      )}
    </div>
  );
}
