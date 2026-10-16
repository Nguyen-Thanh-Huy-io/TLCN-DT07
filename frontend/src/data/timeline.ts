export interface TimelineNode {
  id: string;
  slug: string;
  title: string;
  period: string;
  image: string;
  alt: string;
  letter: string;
}

export const timelineData: TimelineNode[] = [
  {
    id: "van-lang-au-lac",
    slug: "van-lang-au-lac",
    title: "Văn Lang – Âu Lạc",
    period: "(thế kỷ VII TCN\u00A0– thế kỷ II TCN)",
    image: "/assets/timeline/van-lang.jpg",
    alt: "Thời kỳ Văn Lang – Âu Lạc buổi đầu dựng nước",
    letter: "VL",
  },
  {
    id: "thoi-bac-thuoc",
    slug: "thoi-bac-thuoc",
    title: "Thời Bắc thuộc",
    period: "(179 TCN – 938)",
    image: "/assets/timeline/bac-thuoc.jpg",
    alt: "Thời kỳ Bắc thuộc và đấu tranh giành độc lập",
    letter: "BT",
  },
  {
    id: "nha-ly-nha-tran",
    slug: "nha-ly-nha-tran",
    title: "Nhà Lý – Nhà Trần",
    period: "(1009 – 1400)",
    image: "/assets/timeline/ly-tran.jpg",
    alt: "Thời kỳ hưng thịnh của Đại Việt thời Lý - Trần",
    letter: "LT",
  },
  {
    id: "khoi-nghia-lam-son",
    slug: "khoi-nghia-lam-son",
    title: "Khởi nghĩa Lam Sơn",
    period: "(1418 – 1427)",
    image: "/assets/timeline/lam-son.jpg",
    alt: "Khởi nghĩa Lam Sơn giải phóng đất nước",
    letter: "LS",
  },
  {
    id: "trieu-nguyen",
    slug: "trieu-nguyen",
    title: "Triều Nguyễn",
    period: "(1802 – 1945)",
    image: "/assets/timeline/nguyen.jpg",
    alt: "Triều đại phong kiến cuối cùng - Triều Nguyễn",
    letter: "TN",
  },
  {
    id: "viet-nam-hien-dai",
    slug: "viet-nam-hien-dai",
    title: "Việt Nam hiện đại",
    period: "(1945 – nay)",
    image: "/assets/timeline/hien-dai.jpg",
    alt: "Thời kỳ Việt Nam hiện đại và hội nhập quốc tế",
    letter: "VN",
  },
];
