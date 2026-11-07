export type BlogCategory = 'Lịch sử' | 'Văn hóa' | 'Nhân vật' | 'Khảo cổ' | 'Sự kiện';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
  accent: string;
  tags: string[];
};

export const blogCategories: Array<{ name: string; count: number }> = [
  { name: 'Lịch sử', count: 18 },
  { name: 'Văn hóa', count: 12 },
  { name: 'Nhân vật', count: 9 },
  { name: 'Khảo cổ', count: 7 },
  { name: 'Sự kiện', count: 14 },
];

export const blogPosts: BlogPost[] = [
  {
    slug: 'thang-long-trong-mat-sao-cau-truc',
    title: 'Thăng Long trong mắt người đi đường: không gian, nhịp sống và ký ức của một thành phố',
    excerpt:
      'Từ bến sông đến ngõ phố, Thăng Long hiện lên như một bản khúc dài của sự liên tục giữa triều đình, thương nhân và đời sống thường nhật.',
    category: 'Lịch sử',
    author: 'Hà Minh Anh',
    date: '12/11/2026',
    readTime: '7 phút đọc',
    image:
      'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    accent: 'from-[#7b3f2b] via-[#b27342] to-[#d9c09b]',
    tags: ['Thăng Long', 'Đô thị', 'Hà Nội'],
  },
  {
    slug: 'hanh-trinh-cua-nguoi-duy-nhat-khong-lo',
    title: 'Hành trình của người giữ lửa: những kỹ nghệ gia và truyền thừa trong đời sống cung đình',
    excerpt:
      'Người sáng tạo ra sản phẩm không chỉ là kỹ thuật gia; họ là người giữ lại nhịp sống của một thời đại qua tay nghề và ký ức.',
    category: 'Văn hóa',
    author: 'Đặng Quốc Sơn',
    date: '08/11/2026',
    readTime: '6 phút đọc',
    image:
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
    accent: 'from-[#3a4d43] via-[#6a7d5f] to-[#d2c5a3]',
    tags: ['Kỹ nghệ', 'Văn hóa', 'Di sản'],
  },
  {
    slug: 'nhan-vat-chi-cho-ki-chi-thang-phong',
    title: 'Nhân vật chiếu sáng: một đời người trong giai đoạn chuyển giao quyền lực',
    excerpt:
      'Khi thế cờ thay đổi, những con người ở ranh giới giữa truyền thống và đổi mới thường là người mang sứ mệnh lịch sử.',
    category: 'Nhân vật',
    author: 'Nguyễn Thu Hoài',
    date: '04/11/2026',
    readTime: '5 phút đọc',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    accent: 'from-[#513b31] via-[#9b724f] to-[#e0c8a8]',
    tags: ['Nhân vật', 'Quyền lực', 'Biến cố'],
  },
  {
    slug: 'dau-chan-tren-dat-nuoc-trieu-trung',
    title: 'Dấu chân trên đất nước: khảo cổ và cách đọc lại những nơi từng là trung tâm văn minh',
    excerpt:
      'Mỗi mảnh gốm, mỗi lớp đất và mỗi tàn tích là một lời nhắn của quá khứ muốn được hiểu lại đúng cách.',
    category: 'Khảo cổ',
    author: 'Lê Huyền Trâm',
    date: '01/11/2026',
    readTime: '9 phút đọc',
    image:
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
    accent: 'from-[#2e3a3d] via-[#58716a] to-[#d7d0bf]',
    tags: ['Khảo cổ', 'Di tích', 'Địa tầng'],
  },
  {
    slug: 'bien-co-trong-mot-thoi-dai-khong-gian-lanh',
    title: 'Biến cố trong một thời đại không yên: khi các tuyến đường đổi hướng lịch sử',
    excerpt:
      'Biến động không chỉ làm thay đổi bản đồ; nó thay đổi cả phương cách người ta nghĩ về sự ổn định, quyền lực và chiến tranh.',
    category: 'Sự kiện',
    author: 'Phạm Tuấn Minh',
    date: '28/10/2026',
    readTime: '8 phút đọc',
    image:
      'https://images.unsplash.com/photo-1501879779178-8d39f8d9f5f6?auto=format&fit=crop&w=1200&q=80',
    accent: 'from-[#5a3929] via-[#ad7659] to-[#f0dabc]',
    tags: ['Sự kiện', 'Bản đồ', 'Chiến tranh'],
  },
  {
    slug: 'nhung-hoi-giang-lam-nen-van-hoa-mien-nam',
    title: 'Những hội giang làm nên văn hóa miền Nam: từ làng xóm đến di sản đời sống',
    excerpt:
      'Trên những bờ sông và đường quê, các hội giang là nơi hội tụ ký ức, lời kể và phong tục của cộng đồng.',
    category: 'Văn hóa',
    author: 'Trần Kim Duyên',
    date: '22/10/2026',
    readTime: '4 phút đọc',
    image:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    accent: 'from-[#3d4a55] via-[#72828a] to-[#eee1bf]',
    tags: ['Văn hóa', 'Làng xã', 'Di sản'],
  },
];

export const featuredBlogPost = blogPosts.find((post) => post.featured) ?? blogPosts[0];

export function findBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}
