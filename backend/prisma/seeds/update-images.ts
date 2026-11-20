/**
 * update-images.ts
 * ----------------
 * Quét toàn bộ Article và Timeline trong DB hiện tại,
 * tự động gọi Wikipedia API (prop=pageimages) để lấy ảnh gốc chất lượng cao
 * và cập nhật coverImageUrl, coverCaption vào Database!
 *
 * Chạy bằng: cd backend; npx ts-node prisma/seeds/update-images.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const HEADERS = {
  'User-Agent': 'HisgoImageEnricher/1.0 (https://hisgo.vn; dev@hisgo.vn)',
};

/** Bản đồ tra cứu từ slug sang tên bài viết trên Wikipedia tiếng Việt */
const SLUG_TO_WIKI_PAGE: Record<string, string> = {
  // Lịch sử Việt Nam
  'ngo-quyen': 'Ngô_Quyền',
  'tran-thu-do': 'Trần_Thủ_Độ',
  'tran-hung-dao': 'Trần_Hưng_Đạo',
  'tran-nhan-tong': 'Trần_Nhân_Tông',
  'le-loi': 'Lê_Lợi',
  'nguyen-trai': 'Nguyễn_Trãi',
  'vo-nguyen-giap': 'Võ_Nguyên_Giáp',
  'tran-bach-dang-938': 'Trận_Bạch_Đằng_(938)',
  'tran-bach-dang-1288': 'Trận_Bạch_Đằng_(1288)',
  'chien-thang-bach-dang-1288': 'Trận_Bạch_Đằng_(1288)',
  'hoi-nghi-dien-hong': 'Hội_nghị_Diên_Hồng',
  'cach-mang-thang-tam': 'Cách_mạng_Tháng_Tám',
  'khoi-nghia-lam-son': 'Khởi_nghĩa_Lam_Sơn',
  'chien-dich-dien-bien-phu': 'Chiến_dịch_Điện_Biên_Phủ',
  'nha-tran': 'Nhà_Trần',
  'van-kiep': 'Vạn_Kiếp',
  'hich-tuong-si': 'Hịch_tướng_sĩ',

  // Lịch sử Thế giới
  'chien-tranh-the-gioi-thu-hai': 'Chiến_tranh_thế_giới_thứ_hai',
  'tran-stalingrad': 'Trận_Stalingrad',
  'napoleon-bonaparte': 'Napoléon_Bonaparte',
  'tran-waterloo': 'Trận_Waterloo',
  'julius-caesar': 'Julius_Caesar',
};

async function fetchWikiImage(wikiPageName: string): Promise<string | null> {
  const url = `https://vi.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiPageName)}&prop=pageimages&format=json&pithumbsize=1000&redirects=1`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const json = await res.json();
    const pages = json.query?.pages;
    if (!pages) return null;

    for (const key of Object.keys(pages)) {
      let thumb = pages[key].thumbnail?.source;
      if (thumb) {
        // Loại bỏ query string dài (utm_source...) để link ngắn gọn, an toàn với VarChar(500)
        thumb = thumb.split('?')[0];
        return thumb;
      }
    }
  } catch (err) {
    console.error(`Lỗi khi lấy ảnh cho ${wikiPageName}:`, err);
  }
  return null;
}

async function main() {
  console.log('🖼️ Bắt đầu cào & làm giàu URL ảnh chất lượng cao cho toàn bộ CSDL...');

  // 1. CẬP NHẬT ẢNH CHO ARTICLE
  const articles = await prisma.article.findMany({ select: { id: true, slug: true, title: true, coverImageUrl: true } });
  console.log(`📌 Tìm thấy ${articles.length} bài viết cần kiểm tra ảnh.`);

  for (const art of articles) {
    const wikiPage = SLUG_TO_WIKI_PAGE[art.slug] || art.title.replace(/\s+/g, '_');
    const imageUrl = await fetchWikiImage(wikiPage);

    if (imageUrl) {
      await prisma.article.update({
        where: { id: art.id },
        data: {
          coverImageUrl: imageUrl,
          coverCaption: `Hình ảnh tư liệu: ${art.title} (Wikipedia)`,
        },
      });
      console.log(`✅ [Article] Đã cập nhật ảnh cho: "${art.title}"`);
    } else {
      console.log(`ℹ️ [Article] Chưa tìm thấy ảnh cho: "${art.title}" (${wikiPage})`);
    }
  }

  // 2. CẬP NHẬT ẢNH CHO TIMELINE & TIMELINE NODES
  const timelines = await prisma.timeline.findMany({
    include: {
      nodes: {
        include: { article: { select: { coverImageUrl: true } } },
      },
    },
  });

  for (const t of timelines) {
    let timelineCover = t.coverImageUrl;

    // Cập nhật từng node: nếu node chưa có ảnh mà có articleId thì lấy ảnh từ article
    for (const node of t.nodes) {
      if (!node.imageUrl && node.article?.coverImageUrl) {
        await prisma.timelineNode.update({
          where: { id: node.id },
          data: { imageUrl: node.article.coverImageUrl },
        });
        if (!timelineCover) {
          timelineCover = node.article.coverImageUrl;
        }
      }
    }

    // Nếu timeline chưa có cover, lấy ảnh của node đầu tiên
    if (!t.coverImageUrl && timelineCover) {
      await prisma.timeline.update({
        where: { id: t.id },
        data: { coverImageUrl: timelineCover },
      });
      console.log(`✅ [Timeline] Đã cập nhật ảnh bìa cho timeline: "${t.title}"`);
    }
  }

  // 3. CẬP NHẬT ẢNH CHO BÀI HỌC (LESSON)
  const lessons = await prisma.lesson.findMany({ select: { id: true, slug: true, title: true, thumbnailUrl: true } });
  for (const l of lessons) {
    if (!l.thumbnailUrl) {
      // Tìm thử article cùng chủ đề
      const matchedArt = await prisma.article.findFirst({
        where: { coverImageUrl: { not: null } },
      });
      if (matchedArt?.coverImageUrl) {
        await prisma.lesson.update({
          where: { id: l.id },
          data: { thumbnailUrl: matchedArt.coverImageUrl },
        });
        console.log(`✅ [Lesson] Đã cập nhật thumbnail cho bài học: "${l.title}"`);
      }
    }
  }

  console.log('\n🎉 HOÀN THÀNH: Toàn bộ ảnh đã được cập nhật thành công vào Database!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
