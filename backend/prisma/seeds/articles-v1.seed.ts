/**
 * Seed mô hình Article + Category + Tag + Timeline (thay Pilot v1.0 Knowledge Graph đã xoá
 * 2026-11-05). Chạy được nhiều lần: upsert theo slug/tên; mốc của mỗi Timeline xoá rồi tạo lại.
 *
 *   npm run seed:articles
 *
 * Nội dung chỉ dùng các mốc phổ biến trong sách giáo khoa; chỗ sử liệu chưa thống nhất (vd năm
 * sinh Trần Hưng Đạo) ghi rõ là ước đoán qua datePrecision = APPROXIMATE và dấu "?" trong dateText.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { ArticleKind, ContentStatus, DatePrecision, Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

// ---------- Khối nội dung (cùng định dạng Lesson.content / Block Builder) ----------
const text = (html: string) => ({ id: randomUUID(), type: 'TEXT', width: 'FULL', content: html });
const heading = (value: string, level: 2 | 3 = 2) => ({
  id: randomUUID(),
  type: 'HEADING',
  width: 'FULL',
  level,
  text: value,
});
const quote = (quoteText: string, author: string, sourceContext?: string) => ({
  id: randomUUID(),
  type: 'QUOTE',
  width: 'FULL',
  quoteText,
  author,
  sourceContext,
});
const callout = (title: string, content: string, variant = 'HISTORICAL_NOTE') => ({
  id: randomUUID(),
  type: 'CALLOUT',
  width: 'FULL',
  variant,
  title,
  content,
});

// ---------- Dữ liệu ----------
const CATEGORIES = [
  { slug: 'nhan-vat', kind: ArticleKind.PERSON, name: 'Nhân vật', icon: 'User', description: 'Tiểu sử các nhân vật lịch sử.' },
  { slug: 'su-kien', kind: ArticleKind.EVENT, name: 'Sự kiện', icon: 'Swords', description: 'Trận đánh, hội nghị, cuộc cách mạng và các biến cố lịch sử.' },
  { slug: 'di-tich', kind: ArticleKind.LOCATION, name: 'Di tích', icon: 'Landmark', description: 'Di tích, địa danh gắn với lịch sử dân tộc.' },
  { slug: 'trieu-dai', kind: ArticleKind.DYNASTY, name: 'Triều đại', icon: 'Crown', description: 'Các triều đại và nhà nước trong lịch sử Việt Nam.' },
];

const TAGS = [
  { name: 'Nhà Trần', colorHex: '#B45309' },
  { name: 'Kháng chiến chống Nguyên Mông', colorHex: '#B91C1C' },
  { name: 'Thời Ngô', colorHex: '#0F766E' },
  { name: 'Cách mạng tháng Tám', colorHex: '#C2410C' },
];

interface ArticleSeed {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  dateText?: string;
  startYear?: number;
  endYear?: number;
  datePrecision?: DatePrecision;
  isFeatured?: boolean;
  blocks: Record<string, unknown>[];
  /** Hồ sơ mô tả (Article.metadata) — cấu trúc ở src/article/article-metadata.ts. */
  meta?: Record<string, unknown>;
  /** Liên kết tới bài khác (bảng article_links), ghi theo SLUG — đổi sang id khi seed. */
  links?: { slug: string; label?: string; note?: string }[];
}

const ARTICLES: ArticleSeed[] = [
  {
    slug: 'nha-tran',
    title: 'Nhà Trần',
    category: 'trieu-dai',
    tags: ['Nhà Trần'],
    summary:
      'Triều đại trị vì Đại Việt từ năm 1226 đến năm 1400, ba lần đánh thắng quân Nguyên Mông và để lại dấu ấn sâu đậm về văn hoá, tư tưởng.',
    dateText: '1226 – 1400',
    startYear: 1226,
    endYear: 1400,
    datePrecision: DatePrecision.YEAR,
    isFeatured: true,
    blocks: [
      text(
        '<p>Năm 1226, Lý Chiêu Hoàng nhường ngôi cho chồng là Trần Cảnh, mở ra triều Trần. Người dàn xếp cuộc chuyển giao này là Thái sư Trần Thủ Độ.</p>',
      ),
      heading('Ba lần kháng chiến chống Nguyên Mông'),
      text(
        '<p>Trong các năm 1258, 1285 và 1287–1288, quân dân Đại Việt dưới sự lãnh đạo của vua Trần và các tướng lĩnh như Trần Hưng Đạo đã ba lần đánh bại quân xâm lược Nguyên Mông. Trận Bạch Đằng năm 1288 khép lại cuộc kháng chiến lần thứ ba.</p>',
      ),
      callout(
        'Kết thúc triều đại',
        'Năm 1400, Hồ Quý Ly phế vua Trần Thiếu Đế, lập ra nhà Hồ.',
      ),
    ],
  },
  {
    slug: 'tran-thu-do',
    title: 'Trần Thủ Độ',
    category: 'nhan-vat',
    tags: ['Nhà Trần'],
    summary: 'Thái sư, người dàn xếp việc chuyển giao ngôi báu từ nhà Lý sang nhà Trần năm 1226.',
    dateText: '1194 – 1264',
    startYear: 1194,
    endYear: 1264,
    datePrecision: DatePrecision.YEAR,
    meta: {
      person: {
        titles: ['Thái sư'],
        roles: ['POLITICIAN'],
        famousQuote: 'Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo.',
      },
    },
    blocks: [
      quote('Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo.', 'Trần Thủ Độ', 'Kháng chiến chống Mông Cổ (1258)'),
      text(
        '<p>Trần Thủ Độ giữ vai trò then chốt trong việc đưa Trần Cảnh lên ngôi năm 1226 và củng cố bộ máy nhà nước thời đầu nhà Trần. Trong cuộc kháng chiến năm 1258, ông kiên quyết chủ chiến.</p>',
      ),
    ],
  },
  {
    slug: 'tran-hung-dao',
    title: 'Trần Hưng Đạo',
    category: 'nhan-vat',
    tags: ['Nhà Trần', 'Kháng chiến chống Nguyên Mông'],
    summary:
      'Hưng Đạo Đại Vương Trần Quốc Tuấn, tổng chỉ huy quân đội Đại Việt trong hai cuộc kháng chiến chống Nguyên năm 1285 và 1287–1288.',
    dateText: '1228? – 1300',
    startYear: 1228,
    endYear: 1300,
    datePrecision: DatePrecision.APPROXIMATE,
    isFeatured: true,
    meta: {
      aliases: ['Trần Quốc Tuấn', 'Hưng Đạo Đại Vương'],
      region: 'Việt Nam',
      person: {
        titles: ['Quốc công Tiết chế'],
        roles: ['COMMANDER_IN_CHIEF', 'GENERAL'],
        birthDateLabel: 'Chưa rõ (khoảng 1228)',
        notableWorks: ['Hịch tướng sĩ', 'Binh thư yếu lược'],
        famousQuote: 'Bệ hạ chém đầu thần trước rồi hãy hàng.',
      },
    },
    links: [
      { slug: 'tran-nhan-tong', label: 'Phụng sự' },
      { slug: 'tran-bach-dang-1288', label: 'Chỉ huy' },
    ],
    blocks: [
      heading('Thân thế'),
      text(
        '<p>Trần Quốc Tuấn là con của An Sinh vương Trần Liễu. Năm sinh của ông chưa được sử liệu ghi thống nhất.</p>',
      ),
      heading('Sự nghiệp'),
      text(
        '<p>Ông được giao thống lĩnh quân đội trong các cuộc kháng chiến chống Nguyên lần thứ hai và thứ ba, và là người chỉ huy trận Bạch Đằng năm 1288. Ông là tác giả <em>Hịch tướng sĩ</em>.</p>',
      ),
    ],
  },
  {
    slug: 'tran-nhan-tong',
    title: 'Trần Nhân Tông',
    category: 'nhan-vat',
    tags: ['Nhà Trần', 'Kháng chiến chống Nguyên Mông'],
    summary:
      'Vị vua thứ ba của nhà Trần, lãnh đạo hai cuộc kháng chiến chống Nguyên; về sau xuất gia, khai sáng Thiền phái Trúc Lâm.',
    dateText: '1258 – 1308',
    startYear: 1258,
    endYear: 1308,
    datePrecision: DatePrecision.YEAR,
    meta: {
      aliases: ['Trần Khâm', 'Điều Ngự Giác Hoàng'],
      region: 'Việt Nam',
      person: {
        roles: ['MONARCH', 'RELIGIOUS_FIGURE'],
        legacyAndHonors: 'Khai sáng Thiền phái Trúc Lâm Yên Tử.',
      },
    },
    links: [{ slug: 'tran-bach-dang-1288', label: 'Lãnh đạo' }],
    blocks: [
      text(
        '<p>Trần Nhân Tông lên ngôi năm 1278. Dưới thời ông, Đại Việt đánh thắng quân Nguyên trong các năm 1285 và 1287–1288. Sau khi nhường ngôi, ông xuất gia và lập ra Thiền phái Trúc Lâm Yên Tử.</p>',
      ),
    ],
  },
  {
    slug: 'hoi-nghi-dien-hong',
    title: 'Hội nghị Diên Hồng',
    category: 'su-kien',
    tags: ['Nhà Trần', 'Kháng chiến chống Nguyên Mông'],
    summary:
      'Hội nghị các bô lão do Thượng hoàng Trần Thánh Tông triệu tập để hỏi ý kiến về việc đánh hay hoà trước cuộc xâm lược lần thứ hai của quân Nguyên.',
    dateText: '1284',
    startYear: 1284,
    datePrecision: DatePrecision.YEAR,
    blocks: [
      text(
        '<p>Trước nguy cơ quân Nguyên tiến công lần thứ hai, Thượng hoàng Trần Thánh Tông mời các bô lão về điện Diên Hồng để bàn kế sách. Các bô lão đồng thanh tán thành đánh giặc.</p>',
      ),
    ],
  },
  {
    slug: 'tran-bach-dang-1288',
    meta: {
      region: 'Việt Nam',
      event: {
        belligerents: ['Đại Việt (nhà Trần)', 'Quân Nguyên'],
        outcome: 'Đoàn thuyền quân Nguyên bị tiêu diệt; cuộc kháng chiến lần thứ ba kết thúc thắng lợi.',
      },
    },
    links: [{ slug: 'khu-di-tich-bach-dang', label: 'Diễn ra tại' }],
    title: 'Trận Bạch Đằng năm 1288',
    category: 'su-kien',
    tags: ['Nhà Trần', 'Kháng chiến chống Nguyên Mông'],
    summary:
      'Trận thuỷ chiến trên sông Bạch Đằng do Trần Hưng Đạo chỉ huy, tiêu diệt đoàn thuyền của quân Nguyên, kết thúc thắng lợi cuộc kháng chiến lần thứ ba.',
    dateText: 'Tháng 4/1288',
    startYear: 1288,
    datePrecision: DatePrecision.MONTH,
    isFeatured: true,
    blocks: [
      text(
        '<p>Nối tiếp cách đánh của Ngô Quyền năm 938, quân Trần cắm cọc gỗ dưới lòng sông Bạch Đằng, nhử đoàn thuyền của quân Nguyên vào trận địa lúc nước triều lên rồi phản công khi nước rút.</p>',
      ),
      callout('Kết quả', 'Đoàn thuyền của quân Nguyên bị tiêu diệt, tướng Ô Mã Nhi bị bắt. Cuộc kháng chiến lần thứ ba kết thúc thắng lợi.', 'INFO'),
    ],
  },
  {
    slug: 'ngo-quyen',
    title: 'Ngô Quyền',
    category: 'nhan-vat',
    tags: ['Thời Ngô'],
    summary: 'Người lãnh đạo trận Bạch Đằng năm 938, chấm dứt thời kỳ Bắc thuộc và mở ra thời kỳ độc lập lâu dài.',
    dateText: '898 – 944',
    startYear: 898,
    endYear: 944,
    datePrecision: DatePrecision.YEAR,
    isFeatured: true,
    meta: {
      aliases: ['Ngô Vương', 'Tiền Ngô Vương'],
      region: 'Việt Nam',
      person: {
        roles: ['MONARCH', 'GENERAL'],
        hometown: 'Đường Lâm (nay thuộc Sơn Tây, Hà Nội)',
      },
    },
    links: [{ slug: 'tran-bach-dang-938', label: 'Chỉ huy' }],
    blocks: [
      text(
        '<p>Sau chiến thắng Bạch Đằng năm 938, năm 939 Ngô Quyền xưng vương, đóng đô ở Cổ Loa.</p>',
      ),
    ],
  },
  {
    slug: 'tran-bach-dang-938',
    meta: {
      region: 'Việt Nam',
      event: {
        belligerents: ['Quân Ngô Quyền', 'Quân Nam Hán'],
        outcome: 'Quân Nam Hán thất bại; thời kỳ Bắc thuộc kết thúc.',
      },
    },
    links: [{ slug: 'khu-di-tich-bach-dang', label: 'Diễn ra tại' }],
    title: 'Trận Bạch Đằng năm 938',
    category: 'su-kien',
    tags: ['Thời Ngô'],
    summary: 'Ngô Quyền dùng trận địa cọc trên sông Bạch Đằng đánh tan quân Nam Hán, kết thúc hơn một nghìn năm Bắc thuộc.',
    dateText: '938',
    startYear: 938,
    datePrecision: DatePrecision.YEAR,
    blocks: [
      text(
        '<p>Ngô Quyền cho đóng cọc nhọn bịt sắt dưới lòng sông Bạch Đằng. Khi nước triều lên, quân ta nhử thuyền giặc vào bãi cọc; khi nước rút, thuyền giặc mắc cọc và bị đánh tan.</p>',
      ),
    ],
  },
  {
    slug: 'khu-di-tich-bach-dang',
    meta: {
      region: 'Việt Nam',
      site: {
        siteType: 'BATTLEFIELD',
        address: 'Sông Bạch Đằng, Quảng Ninh – Hải Phòng',
        preservation: 'ARCHAEOLOGICAL_RUIN',
        statusNote: 'Nhiều bãi cọc gỗ cổ đã được khai quật trong khu vực.',
      },
    },
    title: 'Khu di tích Bạch Đằng',
    category: 'di-tich',
    tags: ['Nhà Trần', 'Thời Ngô'],
    summary: 'Vùng sông Bạch Đằng gắn với các trận thuỷ chiến năm 938 và 1288; nhiều bãi cọc gỗ cổ đã được phát hiện ở khu vực này.',
    blocks: [
      text(
        '<p>Sông Bạch Đằng chảy qua địa phận Quảng Ninh và Hải Phòng. Các bãi cọc gỗ được khai quật trong khu vực là dấu tích vật chất của trận địa cọc thời Trần.</p>',
      ),
    ],
  },
  {
    slug: 'cach-mang-thang-tam',
    meta: {
      region: 'Việt Nam',
      event: { outcome: 'Nước Việt Nam Dân chủ Cộng hoà ra đời ngày 2/9/1945.' },
    },
    title: 'Cách mạng tháng Tám năm 1945',
    category: 'su-kien',
    tags: ['Cách mạng tháng Tám'],
    summary:
      'Cuộc tổng khởi nghĩa giành chính quyền trên cả nước tháng 8/1945, dẫn tới sự ra đời của nước Việt Nam Dân chủ Cộng hoà ngày 2/9/1945.',
    dateText: '14/8 – 2/9/1945',
    startYear: 1945,
    datePrecision: DatePrecision.DAY,
    isFeatured: true,
    blocks: [
      text(
        '<p>Khi Nhật đầu hàng Đồng minh, Đảng Cộng sản Đông Dương và Mặt trận Việt Minh phát động tổng khởi nghĩa. Chính quyền về tay nhân dân ở Hà Nội ngày 19/8, Huế ngày 23/8 và Sài Gòn ngày 25/8/1945.</p>',
      ),
      quote(
        'Nước Việt Nam có quyền hưởng tự do và độc lập, và sự thật đã thành một nước tự do độc lập.',
        'Hồ Chí Minh',
        'Tuyên ngôn độc lập (2/9/1945)',
      ),
    ],
  },
];

interface NodeSeed {
  title: string;
  year: number;
  month?: number;
  day?: number;
  dateText?: string;
  description?: string;
  article?: string;
}

const TIMELINES: { slug: string; title: string; description: string; nodes: NodeSeed[] }[] = [
  {
    slug: 'ket-thuc-bac-thuoc',
    title: 'Kết thúc nghìn năm Bắc thuộc',
    description: 'Từ chiến thắng Bạch Đằng năm 938 tới khi Ngô Quyền xưng vương.',
    nodes: [
      { title: 'Trận Bạch Đằng', year: 938, article: 'tran-bach-dang-938' },
      { title: 'Ngô Quyền xưng vương, đóng đô ở Cổ Loa', year: 939, article: 'ngo-quyen' },
      { title: 'Ngô Quyền mất', year: 944 },
    ],
  },
  {
    slug: 'nha-tran-khang-chien-nguyen-mong',
    title: 'Nhà Trần và ba lần kháng chiến chống Nguyên Mông',
    description: 'Từ khi nhà Trần được thành lập tới chiến thắng Bạch Đằng năm 1288 và sự kết thúc của triều đại.',
    nodes: [
      { title: 'Nhà Trần được thành lập', year: 1226, article: 'nha-tran' },
      { title: 'Kháng chiến chống Mông Cổ lần thứ nhất', year: 1258 },
      { title: 'Hội nghị Diên Hồng', year: 1284, article: 'hoi-nghi-dien-hong' },
      { title: 'Kháng chiến chống Nguyên lần thứ hai', year: 1285 },
      { title: 'Trận Bạch Đằng', year: 1288, dateText: 'Tháng 4/1288', article: 'tran-bach-dang-1288' },
      { title: 'Hồ Quý Ly lập nhà Hồ, nhà Trần kết thúc', year: 1400 },
    ],
  },
  {
    slug: 'cach-mang-thang-tam-1945',
    title: 'Cách mạng tháng Tám năm 1945',
    description: 'Các mốc chính của cuộc tổng khởi nghĩa giành chính quyền.',
    nodes: [
      { title: 'Hội nghị toàn quốc của Đảng tại Tân Trào', year: 1945, month: 8, day: 14, dateText: '13–15/8/1945' },
      { title: 'Quốc dân Đại hội Tân Trào', year: 1945, month: 8, day: 16 },
      { title: 'Giành chính quyền ở Hà Nội', year: 1945, month: 8, day: 19, article: 'cach-mang-thang-tam' },
      { title: 'Giành chính quyền ở Huế', year: 1945, month: 8, day: 23 },
      { title: 'Giành chính quyền ở Sài Gòn', year: 1945, month: 8, day: 25 },
      { title: 'Vua Bảo Đại thoái vị', year: 1945, month: 8, day: 30 },
      { title: 'Chủ tịch Hồ Chí Minh đọc Tuyên ngôn độc lập', year: 1945, month: 9, day: 2 },
    ],
  },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, kind: c.kind, description: c.description, displayOrder: i },
      create: { ...c, displayOrder: i },
    });
    categoryIds.set(c.slug, row.id);
  }

  const tagIds = new Map<string, string>();
  for (const t of TAGS) {
    const row = await prisma.tag.upsert({
      where: { name: t.name },
      update: { colorHex: t.colorHex },
      create: t,
    });
    tagIds.set(t.name, row.id);
  }

  const articleIds = new Map<string, string>();
  for (const [i, a] of ARTICLES.entries()) {
    const data = {
      title: a.title,
      summary: a.summary,
      categoryId: categoryIds.get(a.category) ?? null,
      contentBlocks: a.blocks as object[],
      dateText: a.dateText ?? null,
      startYear: a.startYear ?? null,
      endYear: a.endYear ?? null,
      datePrecision: a.datePrecision ?? null,
      isFeatured: a.isFeatured ?? false,
      displayOrder: i,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    };
    const row = await prisma.article.upsert({
      where: { slug: a.slug },
      update: data,
      create: { slug: a.slug, ...data },
    });
    articleIds.set(a.slug, row.id);

    await prisma.articleTag.deleteMany({ where: { articleId: row.id } });
    await prisma.articleTag.createMany({
      data: a.tags.map((name) => ({ articleId: row.id, tagId: tagIds.get(name)! })),
    });
  }

  // Lượt 2: hồ sơ mô tả + liên kết (cần id của mọi bài nên chạy sau khi tạo xong).
  for (const a of ARTICLES) {
    const sourceId = articleIds.get(a.slug)!;
    await prisma.article.update({
      where: { id: sourceId },
      data: { metadata: a.meta ? (a.meta as object) : Prisma.DbNull },
    });
    await prisma.articleLink.deleteMany({ where: { sourceId } });
    if (!a.links?.length) continue;
    await prisma.articleLink.createMany({
      data: a.links.map((l, displayOrder) => {
        const targetId = articleIds.get(l.slug);
        if (!targetId) throw new Error(`Seed: ${a.slug} liên kết tới bài không tồn tại "${l.slug}"`);
        return { sourceId, targetId, label: l.label ?? null, note: l.note ?? null, displayOrder };
      }),
    });
  }

  for (const [i, t] of TIMELINES.entries()) {
    const timeline = await prisma.timeline.upsert({
      where: { slug: t.slug },
      update: { title: t.title, description: t.description, displayOrder: i, status: ContentStatus.PUBLISHED },
      create: { slug: t.slug, title: t.title, description: t.description, displayOrder: i, status: ContentStatus.PUBLISHED },
    });
    await prisma.timelineNode.deleteMany({ where: { timelineId: timeline.id } });
    await prisma.timelineNode.createMany({
      data: t.nodes.map((n, order) => ({
        timelineId: timeline.id,
        articleId: n.article ? articleIds.get(n.article)! : null,
        title: n.title,
        description: n.description ?? null,
        dateText: n.dateText ?? null,
        year: n.year,
        month: n.month ?? null,
        day: n.day ?? null,
        displayOrder: order,
      })),
    });
  }

  const linkCount = ARTICLES.reduce((n, a) => n + (a.links?.length ?? 0), 0);
  console.log(
    `Seed xong: ${CATEGORIES.length} chuyên mục, ${TAGS.length} tag, ${ARTICLES.length} bài viết, ${linkCount} liên kết, ${TIMELINES.length} dòng thời gian.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
