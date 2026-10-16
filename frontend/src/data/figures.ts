export interface FigureItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image: string; // đường dẫn placeholder
  alt: string;
  href: string;
  letter: string;
  gradient: string;
}

export const figuresData: FigureItem[] = [
  {
    id: "hung-vuong",
    slug: "hung-vuong",
    name: "Hùng Vương",
    tagline: "Vị vua đầu tiên của dân tộc Việt",
    image: "/assets/figures/hung-vuong.jpg", // TODO: thay bằng /assets/figures/hung-vuong.jpg
    alt: "Chân dung Hùng Vương - Vị vua đầu tiên của dân tộc Việt",
    href: "/nhan-vat/hung-vuong",
    letter: "HV",
    gradient: "linear-gradient(135deg, #3D291D 0%, #63432B 50%, #8A643E 100%)",
  },
  {
    id: "ly-thai-to",
    slug: "ly-thai-to",
    name: "Lý Thái Tổ",
    tagline: "Nhà vua khai sáng nhà Lý",
    image: "/assets/figures/ly-thai-to.jpg", // TODO: thay bằng /assets/figures/ly-thai-to.jpg
    alt: "Chân dung Lý Thái Tổ - Nhà vua khai sáng nhà Lý",
    href: "/nhan-vat/ly-thai-to",
    letter: "LT",
    gradient: "linear-gradient(135deg, #2D241E 0%, #523D2B 50%, #7A5B3D 100%)",
  },
  {
    id: "tran-hung-dao",
    slug: "tran-hung-dao",
    name: "Trần Hưng Đạo",
    tagline: "Anh hùng dân tộc kiệt xuất",
    image: "/assets/figures/tran-hung-dao.jpg", // TODO: thay bằng /assets/figures/tran-hung-dao.jpg
    alt: "Chân dung Trần Hưng Đạo - Anh hùng dân tộc kiệt xuất",
    href: "/nhan-vat/tran-hung-dao",
    letter: "TH",
    gradient: "linear-gradient(135deg, #38241D 0%, #5C3826 50%, #855338 100%)",
  },
  {
    id: "le-loi",
    slug: "le-loi",
    name: "Lê Lợi",
    tagline: "Lãnh tụ khởi nghĩa Lam Sơn",
    image: "/assets/figures/le-loi.jpg", // TODO: thay bằng /assets/figures/le-loi.jpg
    alt: "Chân dung Lê Lợi - Lãnh tụ khởi nghĩa Lam Sơn",
    href: "/nhan-vat/le-loi",
    letter: "LL",
    gradient: "linear-gradient(135deg, #242A2E 0%, #3C4A52 50%, #5B6F7B 100%)",
  },
  {
    id: "nguyen-hue",
    slug: "nguyen-hue",
    name: "Nguyễn Huệ",
    tagline: "Vị anh hùng áo vải Tây Sơn",
    image: "/assets/figures/nguyen-hue.jpg", // TODO: thay bằng /assets/figures/nguyen-hue.jpg
    alt: "Chân dung Nguyễn Huệ - Quang Trung hoàng đế",
    href: "/nhan-vat/nguyen-hue",
    letter: "NH",
    gradient: "linear-gradient(135deg, #421D1D 0%, #6E2D2B 50%, #9E4542 100%)",
  },
  {
    id: "ho-chi-minh",
    slug: "ho-chi-minh",
    name: "Hồ Chí Minh",
    tagline: "Danh nhân văn hóa thế giới",
    image: "/assets/figures/ho-chi-minh.jpg", // TODO: thay bằng /assets/figures/ho-chi-minh.jpg
    alt: "Chân dung Chủ tịch Hồ Chí Minh - Danh nhân văn hóa thế giới",
    href: "/nhan-vat/ho-chi-minh",
    letter: "HCM",
    gradient: "linear-gradient(135deg, #2E251E 0%, #4D3C2E 50%, #735C45 100%)",
  },
];
