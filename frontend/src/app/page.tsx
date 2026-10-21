import React from "react";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { HeroSection } from "@/sections/hisgo/HeroSection";
import {
  TimelineSection,
  MemorableChaptersSection,
  ProminentFiguresSection,
  PeriodExploreSection,
  KnowledgeTopicsSection,
  NewsletterSection,
} from "@/sections/hisgo/HomeSections";
import { ScrollRevealProvider } from "@/components/hisgo/ScrollRevealProvider";
import Image from "next/image";
import { USE_DECOR } from "@/config";
import { fetchLandingContent } from "@/services/entities/landing.service";

export default async function HomePage() {
  const { timelineNodes, eras, chapters, knowledgeTopics, figures } =
    await fetchLandingContent();

  return (
    <ScrollRevealProvider>
      <div className="hisgo-theme min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-body)] relative overflow-x-hidden">
        {/* Skip Link cho khả năng truy cập bàn phím (Accessibility Skip Link) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[100] px-4 py-2 bg-[var(--primary)] text-white font-medium text-sm rounded shadow-lg outline-none focus:ring-2 focus:ring-[var(--gold)]"
        >
          Bỏ qua điều hướng đến nội dung chính
        </a>

        {/* HỌA TIẾT NỀN TOÀN TRANG (Mục H & CÔNG TẮC NỀN USE_DECOR)
            - Khi USE_DECOR = true: Render dải hoa văn và vân giấy
            - Khi USE_DECOR = false: Không render bất kỳ họa tiết nào, chỉ còn màu nền sạch --bg-page
        */}
        {USE_DECOR && (
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
            aria-hidden="true"
          >
          {/* 1. Lớp Radial Gradient ấm nền vân giấy */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background: "radial-gradient(ellipse at 50% 20%, #FAF6EA 0%, #F5EEDC 60%, #F1E7CF 100%)",
            }}
          />

          {/* 2. Vân giấy / Texture mỏng nhẹ 0.04-0.05 */}
          <div
            className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
            style={{
              backgroundImage: "url('/assets/decor/bg-texture.jpg')",
              backgroundRepeat: "repeat",
            }}
          />

          {/* 3. Dải họa tiết mép trái (rộng 20%, mask-image mờ dần sang phải và 2 đầu) */}
          <div
            className="absolute top-0 bottom-0 left-0 w-[20%] opacity-12"
            style={{
              backgroundImage: "url('/assets/decor/page-bg-frame.jpg')",
              backgroundPosition: "left top",
              backgroundRepeat: "repeat-y",
              backgroundSize: "contain",
              WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)",
              maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
          />

          {/* 4. Dải họa tiết mép phải (rộng 20%, đối xứng gương, mask-image mờ dần sang trái) */}
          <div
            className="absolute top-0 bottom-0 right-0 w-[20%] opacity-12 scale-x-[-1]"
            style={{
              backgroundImage: "url('/assets/decor/page-bg-frame.jpg')",
              backgroundPosition: "left top",
              backgroundRepeat: "repeat-y",
              backgroundSize: "contain",
              WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)",
              maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
          />

          {/* 5. Điểm xuyết họa tiết thủy mặc trống đồng ở Hero (opacity 0.20, fade nhẹ đáy) */}
          <div
            className="absolute top-0 left-0 right-0 h-[720px] opacity-20"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
            }}
          >
            <Image
              src="/assets/decor/hero-bg-art.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      )}

      {/* 1. Header Sticky */}
        <Header />

        {/* 2. Main Content */}
        <main id="main-content" className="flex-1 relative z-10">
          {/* Hero */}
          <div className="scroll-reveal">
            <HeroSection />
          </div>

          {/* Dòng chảy lịch sử Việt Nam */}
          <div className="scroll-reveal">
            <TimelineSection nodes={timelineNodes} />
          </div>

          {/* Những chương sử đáng nhớ */}
          <div className="scroll-reveal">
            <MemorableChaptersSection chapters={chapters} />
          </div>

          {/* Nhân vật lịch sử tiêu biểu */}
          <div className="scroll-reveal">
            <ProminentFiguresSection figures={figures} />
          </div>

          {/* Khám phá theo giai đoạn */}
          <div className="scroll-reveal">
            <PeriodExploreSection eras={eras} />
          </div>

          {/* Kiến thức lịch sử */}
          <div className="scroll-reveal">
            <KnowledgeTopicsSection topics={knowledgeTopics} />
          </div>

          {/* Newsletter Cùng HISGO */}
          <div className="scroll-reveal">
            <NewsletterSection />
          </div>
        </main>

        {/* 3. Footer 4 Cột */}
        <Footer />
      </div>
    </ScrollRevealProvider>
  );
}
