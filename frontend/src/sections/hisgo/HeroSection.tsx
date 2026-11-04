"use client";
import React, { useState } from "react";
import { heroData } from "@/data/hero";
import { SafeImage } from "@/components/hisgo/SafeImage";

export function HeroSection() {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  return (
    <section id="hero" className="relative w-full py-12 md:py-16 overflow-hidden scroll-mt-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* CỘT TRÁI (45% trên desktop, căn trái) */}
          <div className="w-full lg:w-[45%] text-left space-y-6">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold tracking-wider uppercase text-[var(--text-muted)]">
              <span className="w-6 h-[1px] bg-[var(--gold)] opacity-70"></span>
              <span>{heroData.eyebrow}</span>
              <span className="w-6 h-[1px] bg-[var(--gold)] opacity-70"></span>
            </div>

            {/* H1 hai dòng: clamp(2rem, 3.2vw, 3rem) chuẩn 2 dòng ở 1024px, không chạm video */}
            <h1
              className="font-bold font-[family-name:var(--font-heading)] text-[var(--ink)] leading-[1.2] tracking-tight text-balance"
              style={{
                fontSize: "clamp(2rem, 3.2vw, 3rem)",
              }}
            >
              <span className="lg:whitespace-nowrap block">
                {heroData.titleLine1}
              </span>
              <span className="lg:whitespace-nowrap block">
                {heroData.titleLine2}
              </span>
            </h1>

            {/* Mô tả */}
            <p className="text-sm md:text-base text-[var(--text-body)] font-[family-name:var(--font-body)] leading-relaxed max-w-lg">
              {heroData.description}
            </p>

            {/* 2 Nút hành động */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection("timeline")}
                className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-[var(--radius-btn)] transition-colors shadow-sm flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer"
              >
                <span>{heroData.exploreButtonText}</span>
                <span aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("chuong-su")}
                className="px-6 py-2.5 bg-transparent border border-[var(--gold)] text-[var(--ink)] hover:bg-[var(--bg-surface)] text-sm font-medium rounded-[var(--radius-btn)] transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] cursor-pointer"
              >
                <span>{heroData.journeyButtonText}</span>
                <span className="text-[var(--gold)] text-xs" aria-hidden="true">
                  ▶
                </span>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI (55% trên desktop, khung video tỉ lệ 16:9 phát trực tiếp) */}
          <div className="w-full lg:w-[55%] relative">
            <div className="relative w-full aspect-video border border-[var(--border-gold)] rounded-[var(--radius-hero)] shadow-[var(--shadow-card)] overflow-hidden bg-black">
              {isPlayingVideo && heroData.videoUrl ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={heroData.videoUrl}
                    title="Khám phá lịch sử qua video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {/* Nút đóng / quay lại thumbnail */}
                  <button
                    type="button"
                    onClick={() => setIsPlayingVideo(false)}
                    className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="Đóng video"
                    aria-label="Đóng video"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(true)}
                  className="relative w-full h-full flex flex-col items-center justify-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] text-left"
                  aria-label="Xem video trực tiếp"
                >
                  {/* SafeImage thật cho Hero với priority */}
                  <div className="absolute inset-0">
                    <SafeImage
                      src="/assets/hero.jpg"
                      alt="Khám phá qua video lịch sử Việt Nam"
                      priority={true}
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="w-full h-full"
                    />
                  </div>

                  {/* Overlay gradient nhẹ */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[var(--overlay-ink)]/75 via-transparent to-black/20 z-10 pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Nút Play tròn */}
                  <div className="relative z-20 w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--ink)] text-white flex items-center justify-center pl-1 border-2 border-[var(--gold)] shadow-xl transition-transform duration-300 group-hover:scale-105">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>

                  {/* Nhãn "Khám phá qua video" */}
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-btn)] bg-[var(--overlay-ink)]/85 border border-[var(--border-gold)]/40 text-white text-xs font-medium backdrop-blur-sm">
                    <span className="text-[var(--gold)] text-[10px]" aria-hidden="true">
                      ▶
                    </span>
                    <span>{heroData.videoLabel}</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
