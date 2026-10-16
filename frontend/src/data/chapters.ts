export interface ChapterItem {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string; // đường dẫn placeholder
  alt: string;
  href: string;
  gradient: string; // Tông sáng rõ theo spec: xanh lam+vàng, hồng đào+ngọc, cam đỏ, nâu vàng, xanh trời, nâu đồng
}

export const chaptersData: ChapterItem[] = [
  {
    id: "van-lang-au-lac",
    slug: "van-lang-au-lac",
    eyebrow: "VĂN LANG – ÂU LẠC",
    title: "Nhà nước đầu tiên của người Việt",
    description:
      "Tìm hiểu về nền văn minh Văn Lang – Âu Lạc với những di chỉ, phong tục và văn hóa đặc sắc.",
    image: "/assets/chapters/van-lang-au-lac.jpg", // TODO: thay bằng /assets/chapters/van-lang-au-lac.jpg
    alt: "Văn hóa Đông Sơn và thời kỳ Văn Lang – Âu Lạc",
    href: "/chuong-su/van-lang-au-lac",
    // Xanh lam + Vàng đồng cho Văn Lang
    gradient: "linear-gradient(135deg, #1C446C 0%, #356B98 45%, #D4A359 100%)",
  },
  {
    id: "nha-ly-nha-tran",
    slug: "nha-ly-nha-tran",
    eyebrow: "NHÀ LÝ – NHÀ TRẦN",
    title: "Thời kỳ vàng son của Đại Việt",
    description:
      "Khám phá sự phát triển rực rỡ của Phật giáo, kiến trúc và văn hóa Đại Việt.",
    image: "/assets/chapters/nha-ly-nha-tran.jpg", // TODO: thay bằng /assets/chapters/nha-ly-nha-tran.jpg
    alt: "Thời kỳ vàng son của Đại Việt thời Lý - Trần",
    href: "/chuong-su/nha-ly-nha-tran",
    // Hồng đào + Xanh ngọc cho Lý - Trần
    gradient: "linear-gradient(135deg, #A84D58 0%, #876274 45%, #2B8A88 100%)",
  },
  {
    id: "khoi-nghia-lam-son",
    slug: "khoi-nghia-lam-son",
    eyebrow: "KHỞI NGHĨA LAM SƠN",
    title: "Dựng lại giang sơn",
    description:
      "Câu chuyện về lòng yêu nước, ý chí quật cường và khát vọng độc lập dân tộc.",
    image: "/assets/chapters/khoi-nghia-lam-son.jpg", // TODO: thay bằng /assets/chapters/khoi-nghia-lam-son.jpg
    alt: "Khởi nghĩa Lam Sơn quật cường dựng lại giang sơn",
    href: "/chuong-su/khoi-nghia-lam-son",
    // Cam đỏ hào hùng cho Lam Sơn
    gradient: "linear-gradient(135deg, #9C331E 0%, #C85028 50%, #E87A38 100%)",
  },
  {
    id: "trieu-nguyen",
    slug: "trieu-nguyen",
    eyebrow: "TRIỀU NGUYỄN",
    title: "Dấu ấn cuối cùng của một triều đại",
    description:
      "Từ chính sách nội trị, đối ngoại đến những biến động lớn của lịch sử cuối thế kỷ XIX – XX.",
    image: "/assets/chapters/trieu-nguyen.jpg", // TODO: thay bằng /assets/chapters/trieu-nguyen.jpg
    alt: "Triều Nguyễn và Cố đô Huế",
    href: "/chuong-su/trieu-nguyen",
    // Nâu vàng hoàng gia cho Triều Nguyễn
    gradient: "linear-gradient(135deg, #6B4423 0%, #9C6635 50%, #D4A359 100%)",
  },
  {
    id: "viet-nam-hien-dai",
    slug: "viet-nam-hien-dai",
    eyebrow: "VIỆT NAM HIỆN ĐẠI",
    title: "Đất nước vươn mình",
    description:
      "Từ cách mạng tháng Tám đến công cuộc đổi mới, hành trình xây dựng và phát triển đất nước.",
    image: "/assets/chapters/viet-nam-hien-dai.jpg", // TODO: thay bằng /assets/chapters/viet-nam-hien-dai.jpg
    alt: "Việt Nam hiện đại thời kỳ đổi mới và phát triển",
    href: "/chuong-su/viet-nam-hien-dai",
    // Xanh trời tươi sáng cho Hiện đại
    gradient: "linear-gradient(135deg, #1C5484 0%, #297EB8 50%, #52B5E8 100%)",
  },
  {
    id: "nhan-vat-lich-su",
    slug: "nhan-vat-lich-su",
    eyebrow: "NHÂN VẬT LỊCH SỬ",
    title: "Những con người làm nên lịch sử",
    description:
      "Khám phá chân dung các anh hùng, trí thức và nhân tài kiệt xuất.",
    image: "/assets/chapters/nhan-vat-lich-su.jpg", // TODO: thay bằng /assets/chapters/nhan-vat-lich-su.jpg
    alt: "Những danh nhân và anh hùng lịch sử dân tộc",
    href: "/nhan-vat",
    // Nâu đồng cổ phong cho Nhân vật
    gradient: "linear-gradient(135deg, #4A3324 0%, #7A5338 50%, #A87950 100%)",
  },
];
