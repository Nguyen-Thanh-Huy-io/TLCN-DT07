import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import {
  ContentStatus,
  NotificationType,
  PrismaClient,
  userRole,
  userStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const DEFAULT_PASSWORD = process.env.SEED_TEST_PASSWORD || 'Hisgo@Test2026';

const TEST_USERS = [
  {
    email: 'author1@hisgo.test',
    username: 'tacgia_an',
    role: userRole.USER,
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    bio: 'Tác giả chuyên viết về lịch sử Thăng Long - Hà Nội.',
  },
  {
    email: 'author2@hisgo.test',
    username: 'tacgia_binh',
    role: userRole.USER,
    firstName: 'Trần Thị',
    lastName: 'Bình',
    bio: 'Nghiên cứu sinh lịch sử quân sự Việt Nam thời kỳ kháng chiến.',
  },
  {
    email: 'reader1@hisgo.test',
    username: 'docgia_chi',
    role: userRole.USER,
    firstName: 'Lê Văn',
    lastName: 'Chi',
    bio: 'Độc giả yêu thích tìm hiểu lịch sử dân tộc.',
  },
  {
    email: 'reader2@hisgo.test',
    username: 'docgia_dung',
    role: userRole.USER,
    firstName: 'Phạm Hoàng',
    lastName: 'Dũng',
    bio: 'Sinh viên ngành sư phạm lịch sử.',
  },
  {
    email: 'reviewer@hisgo.test',
    username: 'nguoi_duyet',
    role: userRole.ADMIN,
    firstName: 'Ban',
    lastName: 'Kiểm Duyệt',
    bio: 'Hội đồng biên tập và phê duyệt nội dung HISGO.',
  },
];

async function main() {
  console.log('🌱 Bắt đầu seed tài khoản và blog test notifications...');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const userMap = new Map<string, string>();

  // 1. Tạo các tài khoản test
  for (const u of TEST_USERS) {
    const user = await prisma.authUser.upsert({
      where: { email: u.email },
      update: {
        username: u.username,
        role: u.role,
        password: passwordHash,
        verified: true,
        status: userStatus.ACTIVE,
        tokenVersion: { increment: 1 },
      },
      create: {
        email: u.email,
        username: u.username,
        role: u.role,
        password: passwordHash,
        verified: true,
        status: userStatus.ACTIVE,
        provider: 'local',
        tokenVersion: 1,
      },
    });

    userMap.set(u.email, user.id);

    // Cập nhật Profile
    await prisma.userProfile.upsert({
      where: { authId: user.id },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        bio: u.bio,
      },
      create: {
        authId: user.id,
        firstName: u.firstName,
        lastName: u.lastName,
        bio: u.bio,
      },
    });

    // Cập nhật Security
    await prisma.authSecurity.upsert({
      where: { authId: user.id },
      update: {
        failedAttempts: 0,
        lockExpiresAt: null,
      },
      create: {
        authId: user.id,
        failedAttempts: 0,
      },
    });

    console.log(` ✅ Đã tạo/cập nhật user: ${u.email} (${u.username}) - Role: ${u.role}`);
  }

  const author1Id = userMap.get('author1@hisgo.test')!;
  const author2Id = userMap.get('author2@hisgo.test')!;
  const reader1Id = userMap.get('reader1@hisgo.test')!;

  // 2. Tạo bài blog 1: Đã xuất bản (PUBLISHED) để test bình luận
  const blog1Slug = 'kham-pha-hoang-thanh-thang-long-ngan-nam-van-hien';
  const blog1Title = 'Khám phá Hoàng thành Thăng Long — Ngàn năm văn hiến';
  
  // Tạo hoặc cập nhật Article đồng bộ để thỏa mãn foreign key constraint của article_comments
  const articleSync1 = await prisma.article.upsert({
    where: { slug: `sync-${blog1Slug}` },
    update: { title: blog1Title, status: ContentStatus.PUBLISHED },
    create: {
      title: blog1Title,
      slug: `sync-${blog1Slug}`,
      summary: 'Quần thể di tích lịch sử gắn liền với kinh thành Thăng Long.',
      status: ContentStatus.PUBLISHED,
    },
  });

  const blog1 = await prisma.blogPost.upsert({
    where: { slug: blog1Slug },
    update: {
      id: articleSync1.id, // Đồng bộ ID với Article để hỗ trợ comments
      authorId: author1Id,
      title: blog1Title,
      excerpt: 'Hoàng thành Thăng Long là quần thể di tích gắn liền với lịch sử kinh thành Thăng Long - Đông Kinh và tỉnh thành Hà Nội.',
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
      publishedAt: new Date(),
    },
    create: {
      id: articleSync1.id,
      authorId: author1Id,
      title: blog1Title,
      slug: blog1Slug,
      excerpt: 'Hoàng thành Thăng Long là quần thể di tích gắn liền với lịch sử kinh thành Thăng Long - Đông Kinh và tỉnh thành Hà Nội.',
      coverImageUrl: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1200&q=80',
      contentBlocks: [
        {
          id: 'b1',
          type: 'paragraph',
          content: '<p>Hoàng thành Thăng Long là quần thể di tích lịch sử gắn liền với hơn một ngàn năm lịch sử của dân tộc Việt Nam...</p>',
        },
      ],
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
      publishedAt: new Date(),
    },
  });

  console.log(` 📝 Đã tạo Blog 1 (PUBLISHED): "${blog1.title}" (Tác giả: author1@hisgo.test)`);

  // 3. Tạo một bình luận mẫu trên Blog 1 từ reader1 để sẵn sàng test chức năng reply (phản hồi)
  const comment1 = await prisma.articleComment.upsert({
    where: { id: 'c1111111-2222-3333-4444-555555555555' },
    update: {
      articleId: blog1.id,
      authorId: reader1Id,
      content: 'Bài viết rất giàu tư liệu và xúc động. Cảm ơn tác giả nhiều!',
      status: 'VISIBLE',
    },
    create: {
      id: 'c1111111-2222-3333-4444-555555555555',
      articleId: blog1.id,
      authorId: reader1Id,
      content: 'Bài viết rất giàu tư liệu và xúc động. Cảm ơn tác giả nhiều!',
      status: 'VISIBLE',
    },
  });

  console.log(` 💬 Đã tạo bình luận mẫu trên Blog 1 (Người viết: reader1@hisgo.test, ID: ${comment1.id})`);

  // 4. Tạo bài blog 2: Đang chờ duyệt (PENDING_REVIEW) để test phê duyệt/từ chối
  const blog2Slug = '56-ngay-dem-khoet-nui-ngu-ham-ky-uc-dien-bien-phu';
  const blog2Title = '56 ngày đêm "khoét núi, ngủ hầm, mưa dầm, cơm vắt" — Ký ức Điện Biên Phủ';

  const articleSync2 = await prisma.article.upsert({
    where: { slug: `sync-${blog2Slug}` },
    update: { title: blog2Title, status: ContentStatus.PENDING_REVIEW },
    create: {
      title: blog2Title,
      slug: `sync-${blog2Slug}`,
      summary: 'Ký ức hào hùng về chiến dịch Điện Biên Phủ chấn động địa cầu.',
      status: ContentStatus.PENDING_REVIEW,
    },
  });

  const blog2 = await prisma.blogPost.upsert({
    where: { slug: blog2Slug },
    update: {
      id: articleSync2.id,
      authorId: author2Id,
      title: blog2Title,
      excerpt: 'Hồi ức về những ngày tháng chiến đấu gian khổ nhưng hào hùng của quân và dân ta trong chiến dịch Điện Biên Phủ lịch sử.',
      status: ContentStatus.PENDING_REVIEW,
      isFeatured: false,
    },
    create: {
      id: articleSync2.id,
      authorId: author2Id,
      title: blog2Title,
      slug: blog2Slug,
      excerpt: 'Hồi ức về những ngày tháng chiến đấu gian khổ nhưng hào hùng của quân và dân ta trong chiến dịch Điện Biên Phủ lịch sử.',
      coverImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      contentBlocks: [
        {
          id: 'b2',
          type: 'paragraph',
          content: '<p>Chiến thắng Điện Biên Phủ lừng lẫy năm châu, chấn động địa cầu là mốc son chói lọi trong lịch sử dân tộc...</p>',
        },
      ],
      status: ContentStatus.PENDING_REVIEW,
      isFeatured: false,
    },
  });

  console.log(` 📝 Đã tạo Blog 2 (PENDING_REVIEW): "${blog2.title}" (Tác giả: author2@hisgo.test)`);

  // 5. Seed thông báo ban đầu (để test con số trên chuông ngay khi đăng nhập)
  // Xóa các thông báo test cũ của các user này để dữ liệu sạch
  await prisma.notification.deleteMany({
    where: {
      userId: { in: [author1Id, author2Id, reader1Id] },
    },
  });

  // Tạo 2 thông báo cho tác giả 1 (1 chưa đọc để hiện số 1 trên chuông, 1 đã đọc)
  await prisma.notification.createMany({
    data: [
      {
        userId: author1Id,
        type: NotificationType.BLOG_COMMENT,
        title: 'Bình luận mới trên bài viết',
        message: 'Độc giả docgia_chi đã bình luận vào bài viết "Khám phá Hoàng thành Thăng Long — Ngàn năm văn hiến".',
        linkUrl: `/blog/${blog1.slug}`,
        isRead: false, // CHƯA ĐỌC -> Sẽ hiện số 1 trên chuông
      },
      {
        userId: author1Id,
        type: NotificationType.CONTENT_APPROVED,
        title: 'Bài viết đã được duyệt xuất bản',
        message: 'Chúc mừng! Bài viết "Khám phá Hoàng thành Thăng Long — Ngàn năm văn hiến" của bạn đã được xuất bản.',
        linkUrl: `/blog/${blog1.slug}`,
        isRead: true, // ĐÃ ĐỌC
      },
    ],
  });

  // Tạo 1 thông báo phản hồi bình luận cho reader1 (chưa đọc để hiện số 1 trên chuông)
  await prisma.notification.create({
    data: {
      userId: reader1Id,
      type: NotificationType.NEW_REPLY,
      title: 'Có phản hồi cho bình luận của bạn',
      message: 'Một độc giả đã trả lời bình luận của bạn trên bài viết "Khám phá Hoàng thành Thăng Long — Ngàn năm văn hiến".',
      linkUrl: `/blog/${blog1.slug}`,
      isRead: false, // CHƯA ĐỌC -> Sẽ hiện số 1 trên chuông
    },
  });

  console.log(' 🔔 Đã tạo thông báo mẫu:');
  console.log('    • author1@hisgo.test: 1 thông báo chưa đọc (Chuông sẽ hiện số 1)');
  console.log('    • reader1@hisgo.test: 1 thông báo chưa đọc (Chuông sẽ hiện số 1)');
  console.log('    • author2@hisgo.test: 0 thông báo (Sẵn sàng nhận thông báo real-time khi được duyệt bài)');

  console.log('\n======================================================');
  console.log('🎉 SEED DỮ LIỆU TEST THÔNG BÁO THÀNH CÔNG!');
  console.log('Mật khẩu chung cho tất cả tài khoản test: ' + DEFAULT_PASSWORD);
  console.log('======================================================');
  console.log('1. Tác giả 1 (author1@hisgo.test / tacgia_an) -> Sở hữu Blog 1 (Đã xuất bản)');
  console.log('   • Link bài: /blog/' + blog1.slug);
  console.log('   • Đang có 1 thông báo chưa đọc (kiểm tra badge số 1 trên chuông)');
  console.log('2. Tác giả 2 (author2@hisgo.test / tacgia_binh) -> Sở hữu Blog 2 (Chờ duyệt)');
  console.log('   • Đang chờ Admin duyệt để nhận thông báo real-time');
  console.log('3. Độc giả 1 (reader1@hisgo.test / docgia_chi) -> Đã bình luận trên Blog 1');
  console.log('   • Đang có 1 thông báo phản hồi (badge số 1 trên chuông)');
  console.log('4. Độc giả 2 (reader2@hisgo.test / docgia_dung) -> Dùng để comment/reply');
  console.log('5. Ban duyệt (reviewer@hisgo.test / nguoi_duyet) -> Role ADMIN');
  console.log('   • Vào /review để Duyệt hoặc Từ chối Blog 2');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
