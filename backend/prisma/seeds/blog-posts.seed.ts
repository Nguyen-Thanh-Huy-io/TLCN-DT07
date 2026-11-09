import 'dotenv/config';
import { ContentStatus, PrismaClient, userRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

type BlogSeedItem = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  status: ContentStatus;
  isFeatured: boolean;
  publishedAt: string;
  blocks: Array<{ id: string; type: string; content?: string; quoteText?: string; author?: string; text?: string; [key: string]: any }>;
};

const paragraph = (id: string, text: string) => ({
  id,
  type: 'paragraph',
  content: `<p>${text}</p>`,
});

const heading = (id: string, text: string) => ({
  id,
  type: 'heading',
  content: `<h2>${text}</h2>`,
});

const quote = (id: string, quoteText: string, author: string) => ({
  id,
  type: 'quote',
  quoteText,
  author,
});

const CLOUDINARY = (name: string) => `https://res.cloudinary.com/demo/image/upload/${name}`;

const withMetadata = (blocks: BlogSeedItem['blocks'], tags: string[], references: Array<{ title: string; source: string; url: string }>) => [
  ...blocks,
  {
    id: 'blog-metadata',
    type: 'meta',
    kind: 'metadata',
    tags,
    references,
  },
];

const BLOG_POSTS: BlogSeedItem[] = [
  {
    slug: 'cong-la-ma-va-khong-gian-quyen-luc',
    title: 'Cổng La Mã và không gian quyền lực',
    excerpt:
      'Từ cổng chiến thắng đến quy hoạch thành phố, kiến trúc La Mã biến các không gian công cộng thành lời tuyên ngôn quyền lực sống động.',
    coverImageUrl: CLOUDINARY('cld-sample-2.jpg'),
    status: ContentStatus.PUBLISHED,
    isFeatured: true,
    publishedAt: '2026-11-05T08:00:00.000Z',
    blocks: withMetadata(
      [
        paragraph('p1', 'Cổng thành là nơi hiện thân rõ nhất cho ý niệm thành phố cổ đại: quyền lực, trật tự và dũng khí của kẻ thống trị.'),
        heading('h1', 'Kiến trúc mở ra không gian chính trị'),
        paragraph('p2', 'Những cổng La Mã không chỉ là lối vào, mà còn là một dạng biểu tượng về phương tiện đi qua của người dân, quân đội và hành khách.'),
        quote('q1', 'Thành phố được xây dựng không chỉ để ở, mà còn để khẳng định trật tự quyền lực.', 'HISGO Editorial'),
        paragraph('p3', 'Bằng cách đặt cổng ở đầu đường, người La Mã đã chuyển hoạt động giao thông thành một nghi thức công khai của quyền lực.'),
      ],
      ['La Mã', 'Kiến trúc cổ đại', 'Quyền lực'],
      [
        { title: 'The Roman Forum', source: 'UNESCO World Heritage', url: 'https://whc.unesco.org/en/list/412/' },
        { title: 'Roman architecture', source: 'Britannica', url: 'https://www.britannica.com/topic/Roman-architecture' },
      ],
    ),
  },
  {
    slug: 'duong-sat-va-doi-song-thanh-thi-co-dai',
    title: 'Đường sắt và đời sống thành thị cổ đại',
    excerpt:
      'Một mạng lưới giao thông không chỉ vận chuyển hàng hóa, mà còn định hình thói quen, kinh tế và nhịp sống của các thành phố.',
    coverImageUrl: CLOUDINARY('cld-sample-3.jpg'),
    status: ContentStatus.PUBLISHED,
    isFeatured: false,
    publishedAt: '2026-11-02T08:00:00.000Z',
    blocks: withMetadata(
      [
        heading('h2', 'Mạng lưới vận chuyển đóng vai trò gì?'),
        paragraph('p4', 'Trong các thành phố cổ, hành lang giao thông là nơi chạm tới từng khía cạnh của đời sống: thương mại, tôn giáo, di chuyển và kiểm soát.'),
        paragraph('p5', 'Hệ thống giao thông khiến trung tâm thành phố thành mắt xích kết nối vùng ngoại vi với các trung tâm quyền lực.'),
      ],
      ['Đường sắt', 'Thành thị cổ đại', 'Giao thông'],
      [{ title: 'Urban transport history', source: 'Oxford Research', url: 'https://www.oxfordreference.com/' }],
    ),
  },
  {
    slug: 'lang-nghe-va-lich-su-bien-doi-khong-gian',
    title: 'Làng nghề và lịch sử biến đổi không gian',
    excerpt:
      'Những khu chợ, xưởng thủ công và làng nghề đã hình thành nên mạng lưới văn hóa quanh các đô thị lớn.',
    coverImageUrl: CLOUDINARY('cld-sample-4.jpg'),
    status: ContentStatus.PUBLISHED,
    isFeatured: false,
    publishedAt: '2026-10-28T08:00:00.000Z',
    blocks: withMetadata(
      [
        paragraph('p6', 'Làng nghề trong lịch sử không chỉ là nơi sản xuất, mà còn là nơi tích tụ kiến thức chuyên môn và hệ thống giá trị cộng đồng.'),
        quote('q2', 'Những khu chợ là nơi người ta trao đổi không chỉ hàng hóa mà còn cả ký ức và lời kể.', 'HISGO Editorial'),
        paragraph('p7', 'Sự biến đổi không gian đô thị khiến làng nghề dần gắn với các trung tâm chính trị và thương mại.'),
      ],
      ['Làng nghề', 'Thị trường', 'Nông thôn'],
      [{ title: 'Craft guilds and urban culture', source: 'Academic archive', url: 'https://www.example.com/craft-guilds' }],
    ),
  },
  {
    slug: 'truyen-thuyet-ve-song-hong',
    title: 'Truyền thuyết về sông Hồng',
    excerpt:
      'Một con sông không chỉ là dòng nước mà còn là nguồn cảm hứng cho ký ức, lễ nghi và nhận thức về đất nước.',
    coverImageUrl: CLOUDINARY('cld-sample-5.jpg'),
    status: ContentStatus.PENDING_REVIEW,
    isFeatured: false,
    publishedAt: '2026-11-07T08:00:00.000Z',
    blocks: withMetadata(
      [
        heading('h3', 'Sông Hồng trong ký ức cộng đồng'),
        paragraph('p8', 'Trong nhiều truyền thuyết, sông Hồng là biểu tượng của sự nuôi dưỡng và cả thách thức của thiên nhiên.'),
        paragraph('p9', 'Nhiều cư dân sống dọc bờ sông đã gắn chặt cuộc sống của mình với nhịp mùa nước, bờ cát và các bãi bồi.'),
      ],
      ['Sông Hồng', 'Truyền thuyết', 'Địa lý văn hóa'],
      [{ title: 'River myths in Vietnamese culture', source: 'HISGO archive', url: 'https://www.example.com/river-myths' }],
    ),
  },
  {
    slug: 'van-hoa-an-do-va-bang-chung-co-dai',
    title: 'Văn hóa ẩm thực và bằng chứng cổ đại',
    excerpt:
      'Món ăn, đồ dùng và nghi thức ăn uống lưu giữ những dấu vết rất đậm về cách con người tổ chức cuộc sống hàng ngày.',
    coverImageUrl: CLOUDINARY('cld-sample-6.jpg'),
    status: ContentStatus.DRAFT,
    isFeatured: false,
    publishedAt: '2026-11-09T08:00:00.000Z',
    blocks: withMetadata(
      [
        paragraph('p10', 'Đồ ăn và cách thức chế biến phản ánh môi trường, kinh tế và các mạng lưới trao đổi văn hóa của một thời kỳ.'),
        paragraph('p11', 'Nhiều dấu tích khảo cổ về nồi, chảo, bát đĩa cho thấy sự chắt lọc trong thói quen ăn uống và lễ nghi.'),
      ],
      ['Ẩm thực', 'Khảo cổ', 'Văn hóa vật chất'],
      [{ title: 'Food and social memory', source: 'Journal of Archaeology', url: 'https://www.example.com/food-archaeology' }],
    ),
  },
  {
    slug: 'duong-luoi-bac-trung-doi-song-van-hoa',
    title: 'Dưới lưới bắc, đời sống văn hóa của cộng đồng biển',
    excerpt:
      'Các cộng đồng sống ở bờ biển đã biến nghề đánh bắt thành một hệ thống tri thức, linh hồn và truyền thống riêng.',
    coverImageUrl: CLOUDINARY('cld-sample-7.jpg'),
    status: ContentStatus.REJECTED,
    isFeatured: false,
    publishedAt: '2026-10-10T08:00:00.000Z',
    blocks: withMetadata(
      [
        paragraph('p12', 'Thực hành đánh bắt và xử lý hải sản đòi hỏi nhịp sống gắn với thời tiết và dòng chảy biển.'),
        paragraph('p13', 'Văn hóa đời sống ven biển mang nét đặc thù về tri thức truyền miệng, lễ hội và hệ thống quy ước cộng đồng.'),
      ],
      ['Biển', 'Cộng đồng ven biển', 'Hải sản'],
      [{ title: 'Coastal communities and heritage', source: 'Maritime research collection', url: 'https://www.example.com/coastal-heritage' }],
    ),
  },
];

async function main() {
  const authors = await prisma.authUser.findMany({
    where: {
      role: { in: [userRole.SUPERADMIN, userRole.ADMIN, userRole.MODERATOR, userRole.USER] },
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  if (!authors.length) {
    throw new Error('No authUser found. Please run admin seed first.');
  }

  const createdPosts = [] as Array<{ title: string; slug: string; status: ContentStatus }>;

  for (const [index, post] of BLOG_POSTS.entries()) {
    const author = authors[index % authors.length];

    const saved = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        authorId: author.id,
        title: post.title,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        contentBlocks: post.blocks,
        status: post.status,
        isFeatured: post.isFeatured,
        publishedAt: new Date(post.publishedAt),
      },
      create: {
        authorId: author.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        contentBlocks: post.blocks,
        status: post.status,
        isFeatured: post.isFeatured,
        publishedAt: new Date(post.publishedAt),
      },
    });

    createdPosts.push({ title: saved.title, slug: saved.slug, status: saved.status });
  }

  console.log('=== Blog posts seed created/updated ===');
  console.log(JSON.stringify(createdPosts, null, 2));
}

main()
  .catch((error) => {
    console.error('Blog posts seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
