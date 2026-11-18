'use client';

import React from 'react';

/**
 * Họa tiết di sản mờ (Ambient Heritage Background) cho HISGO.
 * Tái hiện vòng tròn mặt trời Trống đồng Đông Sơn và cánh chim Lạc bay
 * với sắc thái mờ ảo (opacity 3.5% - 4.5%), cố định toàn trang.
 * Không bắt chước thô thiển, không che khuất chữ, tạo chiều sâu bảo tàng số.
 */
export function HeritageAmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Góc trên bên phải: Vành trống đồng lớn lan tỏa */}
      <div className="absolute -top-32 -right-32 sm:-top-48 sm:-right-48 w-[500px] h-[500px] sm:w-[750px] sm:h-[750px] opacity-[0.038] text-[var(--primary,#7A1F24)]">
        <DongSonDrumSvg className="w-full h-full animate-[spin_360s_linear_infinite]" />
      </div>

      {/* Góc dưới bên trái: Vành nhật quang và đàn chim Lạc bay ngược chiều */}
      <div className="absolute -bottom-40 -left-40 sm:-bottom-56 sm:-left-56 w-[450px] h-[450px] sm:w-[680px] sm:h-[680px] opacity-[0.032] text-[var(--gold,#B8893F)]">
        <DongSonDrumSvg className="w-full h-full animate-[spin_420s_linear_infinite_reverse]" />
      </div>
    </div>
  );
}

/**
 * Vector SVG cách điệu Trống đồng Đông Sơn:
 * Mặt trời 14 tia, vành lông công răng cưa, vành chim Lạc sải cánh bay.
 */
function DongSonDrumSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      stroke="currentColor"
      className={className}
    >
      {/* Vòng ngoài cùng */}
      <circle cx="300" cy="300" r="290" strokeWidth="2.5" />
      <circle cx="300" cy="300" r="282" strokeWidth="1.2" strokeDasharray="3 4" />
      <circle cx="300" cy="300" r="270" strokeWidth="2" />

      {/* Vành chim Lạc bay (8 cánh chim cách điệu xoay quanh trục) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 300 300)`}>
          <path
            d="M 300 48 Q 308 65 315 85 Q 295 80 280 88 Q 292 72 300 48 Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M 315 85 Q 330 92 345 95 Q 320 100 310 102 Z"
            fill="currentColor"
            opacity="0.8"
          />
        </g>
      ))}

      {/* Vòng gờ phân cách */}
      <circle cx="300" cy="300" r="200" strokeWidth="1.8" />
      <circle cx="300" cy="300" r="192" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="300" cy="300" r="180" strokeWidth="2" />

      {/* Vành răng cưa / họa tiết kỷ hà (36 mắt cưa) */}
      {[...Array(36)].map((_, i) => (
        <line
          key={i}
          x1="300"
          y1="180"
          x2="300"
          y2="192"
          strokeWidth="1.5"
          transform={`rotate(${i * 10} 300 300)`}
        />
      ))}

      {/* Vành chấm dải tròn trung gian */}
      <circle cx="300" cy="300" r="140" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="132" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="300" cy="300" r="120" strokeWidth="2" />

      {/* Tâm mặt trời Đông Sơn 14 cánh sao */}
      <circle cx="300" cy="300" r="48" fill="currentColor" opacity="0.15" />
      {[...Array(14)].map((_, i) => (
        <g key={i} transform={`rotate(${i * (360 / 14)} 300 300)`}>
          <polygon
            points="300,195 292,252 308,252"
            fill="currentColor"
            opacity="0.85"
          />
          <line x1="300" y1="252" x2="300" y2="300" strokeWidth="1" opacity="0.4" />
        </g>
      ))}

      {/* Nhụy trung tâm */}
      <circle cx="300" cy="300" r="22" strokeWidth="2" fill="none" />
      <circle cx="300" cy="300" r="8" fill="currentColor" />
    </svg>
  );
}
