export interface HeroData {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  exploreButtonText: string;
  journeyButtonText: string;
  videoUrl?: string; // YouTube embed URL placeholder, tạm để rỗng
  videoLabel: string;
}

export const heroData: HeroData = {
  eyebrow: "HÀNH TRÌNH QUA DÒNG CHẢY DÂN TỘC",
  titleLine1: "Mỗi dấu mốc,",
  titleLine2: "một câu chuyện Việt Nam",
  description:
    "Khám phá lịch sử Việt Nam qua những dòng thời gian sống động, những câu chuyện ý nghĩa và những nhân vật kiệt xuất.",
  exploreButtonText: "Bắt đầu khám phá",
  journeyButtonText: "Xem hành trình",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1", // Link embed sẵn sàng phát tự động khi bấm Play
  videoLabel: "Khám phá qua video",
};
