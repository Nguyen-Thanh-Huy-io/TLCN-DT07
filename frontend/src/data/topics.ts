export interface TopicItem {
  id: string;
  slug: string;
  title: string;
  icon: "Landmark" | "Castle" | "Swords" | "Scale" | "BookOpen" | "MapPin";
  href: string;
}

export const topicsData: TopicItem[] = [
  {
    id: "van-hoa-doi-song",
    slug: "van-hoa-doi-song",
    title: "Văn hóa & Đời sống",
    icon: "Landmark",
    href: "/kien-thuc/van-hoa-doi-song",
  },
  {
    id: "kien-truc-di-tich",
    slug: "kien-truc-di-tich",
    title: "Kiến trúc & Di tích",
    icon: "Castle",
    href: "/kien-thuc/kien-truc-di-tich",
  },
  {
    id: "chien-tranh-ngoai-giao",
    slug: "chien-tranh-ngoai-giao",
    title: "Chiến tranh & Ngoại giao",
    icon: "Swords",
    href: "/kien-thuc/chien-tranh-ngoai-giao",
  },
  {
    id: "kinh-te-xa-hoi",
    slug: "kinh-te-xa-hoi",
    title: "Kinh tế & Xã hội",
    icon: "Scale",
    href: "/kien-thuc/kinh-te-xa-hoi",
  },
  {
    id: "tu-tuong-ton-giao",
    slug: "tu-tuong-ton-giao",
    title: "Tư tưởng & Tôn giáo",
    icon: "BookOpen",
    href: "/kien-thuc/tu-tuong-ton-giao",
  },
  {
    id: "ban-do-dia-danh",
    slug: "ban-do-dia-danh",
    title: "Bản đồ & Địa danh",
    icon: "MapPin",
    href: "/kien-thuc/ban-do-dia-danh",
  },
];
