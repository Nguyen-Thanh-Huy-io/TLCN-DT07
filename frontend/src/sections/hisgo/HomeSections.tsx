import React from "react";
import { SectionTitle } from "@/components/hisgo/SectionTitle";
import { TimelineStrip } from "@/sections/hisgo/TimelineStrip";
import { ChapterCard } from "@/components/hisgo/ChapterCard";
import { FigureCard } from "@/components/hisgo/FigureCard";
import { EraCard } from "@/components/hisgo/EraCard";
import { TopicTile } from "@/components/hisgo/TopicTile";
import { NewsletterBanner } from "@/components/hisgo/NewsletterBanner";
import { chaptersData, ChapterItem } from "@/data/chapters";
import { figuresData, FigureItem } from "@/data/figures";
import { erasData, EraItem } from "@/data/eras";
import { topicsData, TopicItem } from "@/data/topics";

import { TimelineNode } from "@/data/timeline";

/**
 * 2. Section Timeline: Dòng chảy lịch sử Việt Nam (#timeline)
 * Khoảng cách dọc tiêu chuẩn tối đa 64px (md:py-8 py-6) để không bị cộng dồn
 */
interface TimelineSectionProps {
  nodes?: TimelineNode[];
}

export function TimelineSection({ nodes }: TimelineSectionProps = {}) {
  return (
    <section id="timeline" className="w-full py-6 md:py-8 scroll-mt-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <SectionTitle
          title="Dòng chảy lịch sử Việt Nam"
          subtitle="Từ buổi đầu dựng nước đến thời đại hôm nay"
        />
        <div className="mt-7">
          <TimelineStrip nodes={nodes} />
        </div>
      </div>
    </section>
  );
}

/**
 * 3. Section: Những chương sử đáng nhớ (#chuong-su)
 */
interface MemorableChaptersSectionProps {
  chapters?: ChapterItem[];
}

export function MemorableChaptersSection({
  chapters = chaptersData,
}: MemorableChaptersSectionProps = {}) {
  return (
    <section id="chuong-su" className="w-full py-6 md:py-8 overflow-hidden scroll-mt-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <SectionTitle
          title="Những chương sử đáng nhớ"
          subtitle="Những sự kiện, giai đoạn và câu chuyện tiêu biểu làm nên lịch sử Việt Nam"
        />

        <div className="mt-7 hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
          {chapters.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              hasTopLeftOrnament={index === 0}
              hasTopRightOrnament={index === chapters.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="mt-7 sm:hidden">
        <div
          className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar"
          style={{
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: "16px",
            scrollPaddingRight: "16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="w-[78vw] max-w-[320px] flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <ChapterCard
                chapter={chapter}
                hasTopLeftOrnament={index === 0}
                hasTopRightOrnament={index === chapters.length - 1}
              />
            </div>
          ))}
          <div className="w-1 flex-shrink-0" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/**
 * 4. Section: Nhân vật lịch sử tiêu biểu (#nhan-vat)
 */
interface ProminentFiguresSectionProps {
  figures?: FigureItem[];
}

export function ProminentFiguresSection({
  figures = figuresData,
}: ProminentFiguresSectionProps = {}) {
  return (
    <section id="nhan-vat" className="w-full py-6 md:py-8 overflow-hidden scroll-mt-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <SectionTitle
          title="Nhân vật lịch sử tiêu biểu"
          subtitle="Những con người đã làm nên vận mệnh dân tộc"
        />

        <div className="mt-7 hidden sm:grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
          {figures.map((figure) => (
            <FigureCard key={figure.id} figure={figure} />
          ))}
        </div>
      </div>

      <div className="mt-7 sm:hidden">
        <div
          className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar"
          style={{
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: "16px",
            scrollPaddingRight: "16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {figures.map((figure) => (
            <div
              key={figure.id}
              className="w-[44vw] max-w-[180px] flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <FigureCard figure={figure} />
            </div>
          ))}
          <div className="w-1 flex-shrink-0" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/**
 * 5. Section: Khám phá theo giai đoạn (#giai-doan)
 */
interface PeriodExploreSectionProps {
  eras?: EraItem[];
}

export function PeriodExploreSection({
  eras = erasData,
}: PeriodExploreSectionProps = {}) {
  return (
    <section id="giai-doan" className="relative w-full py-6 md:py-8 overflow-hidden scroll-mt-20">
      {/* Họa tiết nền mờ tinh tế phía sau Khám phá theo giai đoạn */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.06] select-none"
        style={{
          backgroundImage: "url('/assets/decor/hero-bg-art.png')",
          backgroundPosition: "center 40%",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
        <SectionTitle
          title="Khám phá theo giai đoạn"
          subtitle="Lựa chọn giai đoạn lịch sử bạn quan tâm để tìm hiểu sâu hơn"
        />

        <div className="mt-7 hidden sm:grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {eras.map((era) => (
            <EraCard key={era.id} era={era} />
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-7 sm:hidden">
        <div
          className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar"
          style={{
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: "16px",
            scrollPaddingRight: "16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {eras.map((era) => (
            <div
              key={era.id}
              className="w-[62vw] max-w-[260px] flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <EraCard era={era} />
            </div>
          ))}
          <div className="w-1 flex-shrink-0" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/**
 * 6. Section: Kiến thức lịch sử (#kien-thuc)
 */
interface KnowledgeTopicsSectionProps {
  topics?: TopicItem[];
}

export function KnowledgeTopicsSection({
  topics = topicsData,
}: KnowledgeTopicsSectionProps = {}) {
  return (
    <section id="kien-thuc" className="relative w-full py-6 md:py-8 scroll-mt-20 overflow-hidden">
      {/* Họa tiết nền mờ tinh tế phía sau Kiến thức lịch sử */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] select-none"
        style={{
          backgroundImage: "url('/assets/decor/page-bg-frame.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "repeat",
          WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 75%)",
          maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 75%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
        <SectionTitle
          title="Kiến thức lịch sử"
          subtitle="Cùng mở rộng hiểu biết qua các chủ đề đặc sắc"
        />

        <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {topics.map((topic) => (
            <TopicTile key={topic.id} topic={topic} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 7. Section: Newsletter Cùng HISGO (#dang-ky) (Cách footer 48px)
 */
export function NewsletterSection() {
  return (
    <section id="dang-ky" className="relative w-full pt-6 md:pt-8 pb-12 scroll-mt-20 overflow-hidden">
      {/* Điểm xuyết hoa văn nền mờ phía sau Newsletter banner */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.06] select-none"
        style={{
          backgroundImage: "url('/assets/decor/hero-bg-art.png')",
          backgroundPosition: "center bottom",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
        <NewsletterBanner />
      </div>
    </section>
  );
}
