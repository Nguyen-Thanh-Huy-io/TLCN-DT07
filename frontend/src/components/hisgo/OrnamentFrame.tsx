import React from "react";

interface OrnamentFrameProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  cornerSize?: number;
}

export function OrnamentFrame({
  children,
  className = "",
  style,
  cornerSize = 22, // 20-24px cổ điển chuẩn mẫu
}: OrnamentFrameProps) {
  return (
    <div
      style={style}
      className={`relative p-4 md:p-6 border border-[var(--border-gold)] rounded-[var(--radius-card)] bg-[var(--bg-surface)] ${className}`}
    >
      {/* Top Left Corner Ornament (Hoa văn góc vuông cổ 22px, nét 1.5px, màu border-gold) */}
      <span
        className="absolute top-[-1px] left-[-1px] border-t-[1.5px] border-l-[1.5px] border-[var(--border-gold)] z-10 pointer-events-none"
        style={{ width: `${cornerSize}px`, height: `${cornerSize}px` }}
        aria-hidden="true"
      >
        <span className="absolute top-[3px] left-[3px] w-[5px] h-[5px] border-t-[1.5px] border-l-[1.5px] border-[var(--border-gold)]" />
      </span>

      {/* Top Right Corner Ornament */}
      <span
        className="absolute top-[-1px] right-[-1px] border-t-[1.5px] border-r-[1.5px] border-[var(--border-gold)] z-10 pointer-events-none"
        style={{ width: `${cornerSize}px`, height: `${cornerSize}px` }}
        aria-hidden="true"
      >
        <span className="absolute top-[3px] right-[3px] w-[5px] h-[5px] border-t-[1.5px] border-r-[1.5px] border-[var(--border-gold)]" />
      </span>

      {/* Bottom Left Corner Ornament */}
      <span
        className="absolute bottom-[-1px] left-[-1px] border-b-[1.5px] border-l-[1.5px] border-[var(--border-gold)] z-10 pointer-events-none"
        style={{ width: `${cornerSize}px`, height: `${cornerSize}px` }}
        aria-hidden="true"
      >
        <span className="absolute bottom-[3px] left-[3px] w-[5px] h-[5px] border-b-[1.5px] border-l-[1.5px] border-[var(--border-gold)]" />
      </span>

      {/* Bottom Right Corner Ornament */}
      <span
        className="absolute bottom-[-1px] right-[-1px] border-b-[1.5px] border-r-[1.5px] border-[var(--border-gold)] z-10 pointer-events-none"
        style={{ width: `${cornerSize}px`, height: `${cornerSize}px` }}
        aria-hidden="true"
      >
        <span className="absolute bottom-[3px] right-[3px] w-[5px] h-[5px] border-b-[1.5px] border-r-[1.5px] border-[var(--border-gold)]" />
      </span>

      {children}
    </div>
  );
}
