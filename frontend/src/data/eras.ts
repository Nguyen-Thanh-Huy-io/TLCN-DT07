export interface EraItem {
  id: string;
  slug: string;
  title: string;
  period: string;
  image: string; // đường dẫn placeholder
  alt: string;
  href: string;
  gradient: string;
}

export const erasData: EraItem[] = [
  {
    id: "thoi-tien-su",
    slug: "thoi-tien-su",
    title: "Thời tiền sử",
    period: "(trước 2879 TCN)",
    image: "/assets/eras/tien-su.jpg",
    alt: "Thời tiền sử Việt Nam",
    href: "/giai-doan/thoi-tien-su",
    gradient: "linear-gradient(135deg, #2D3A4B 0%, #4B3E2F 50%, #6E5339 100%)",
  },
  {
    id: "thoi-ky-dung-nuoc",
    slug: "thoi-ky-dung-nuoc",
    title: "Thời kỳ dựng nước",
    period: "(2879 TCN – 179 TCN)",
    image: "/assets/eras/dung-nuoc.jpg",
    alt: "Thời kỳ dựng nước Văn Lang - Âu Lạc",
    href: "/giai-doan/thoi-ky-dung-nuoc",
    gradient: "linear-gradient(135deg, #1C446C 0%, #4A3E2B 50%, #A8783E 100%)",
  },
  {
    id: "thoi-bac-thuoc",
    slug: "thoi-bac-thuoc",
    title: "Thời Bắc thuộc",
    period: "(179 TCN – 938)",
    image: "/assets/eras/bac-thuoc.jpg",
    alt: "Thời kỳ Bắc thuộc và các cuộc khởi nghĩa giành độc lập",
    href: "/giai-doan/thoi-bac-thuoc",
    gradient: "linear-gradient(135deg, #3A201C 0%, #5C3225 50%, #854832 100%)",
  },
  {
    id: "thoi-phong-kien-doc-lap",
    slug: "thoi-phong-kien-doc-lap",
    title: "Thời phong kiến",
    period: "(938 – 1945)",
    image: "/assets/eras/phong-kien.jpg",
    alt: "Thời phong kiến độc lập qua các triều đại Ngô, Đinh, Tiền Lê, Lý, Trần, Hậu Lê",
    href: "/giai-doan/thoi-phong-kien-doc-lap",
    gradient: "linear-gradient(135deg, #6B3B18 0%, #9E5D24 50%, #C98B3C 100%)",
  },
  {
    id: "thoi-can-dai",
    slug: "thoi-can-dai",
    title: "Thời cận đại",
    period: "(1858 – 1945)",
    image: "/assets/eras/can-dai.jpg",
    alt: "Thời cận đại và phong trào đấu tranh giải phóng dân tộc",
    href: "/giai-doan/thoi-can-dai",
    gradient: "linear-gradient(135deg, #2D2321 0%, #523932 50%, #7A5348 100%)",
  },
  {
    id: "thoi-hien-dai",
    slug: "thoi-hien-dai",
    title: "Thời hiện đại",
    period: "(1945 – nay)",
    image: "/assets/eras/hien-dai.jpg",
    alt: "Thời hiện đại - Đất nước Việt Nam hòa bình và đổi mới",
    href: "/giai-doan/thoi-hien-dai",
    gradient: "linear-gradient(135deg, #1A4670 0%, #2974AB 50%, #4D9DE0 100%)",
  },
];
