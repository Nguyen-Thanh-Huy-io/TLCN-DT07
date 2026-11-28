import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@hisgo.edu.vn';

/**
 * 5 Sơ đồ tư duy mẫu đại diện cho 5 cấu trúc chuẩn của HISGO:
 * 1. TIMELINE: Dòng thời gian Kháng chiến chống Mỹ cứu nước (1954 - 1975)
 * 2. MIND_MAP: Triều đại Nhà Trần (1225 – 1400)
 * 3. FISHBONE: Nguyên nhân Thắng lợi Khởi nghĩa Lam Sơn (1418 – 1427)
 * 4. ORG_CHART: Tổ chức Bộ máy Nhà nước thời Lê Sơ
 * 5. LOGIC_CHART: Chiến dịch Điện Biên Phủ 1954 - Tiến trình 3 đợt tiến công
 */
const SEED_MINDMAPS = [
  {
    id: 'c0000001-0000-4000-8000-000000000001',
    title: 'Dòng thời gian Kháng chiến chống Mỹ cứu nước',
    periodLabel: '1954 – 1975',
    template: 'SPIDER',
    graph: {
      structure: 'TIMELINE',
      mapTheme: 'HISGO_HERITAGE',
      balancedBranches: true,
      nodes: [
        {
          id: 'n-root',
          x: 420,
          y: 240,
          title: 'Kháng chiến chống Mỹ cứu nước',
          badge: 'Đại thắng Mùa Xuân',
          dateLabel: '1954 – 1975',
          note: 'Cuộc kháng chiến trường kỳ, gian khổ nhưng vĩ đại nhất trong lịch sử dựng nước và giữ nước thời hiện đại.',
          color: 'CRIMSON',
        },
        {
          id: 'n-t1',
          x: 100,
          y: 80,
          title: 'Hiệp định Genève & Phong trào Đồng Khởi',
          badge: 'Giai đoạn 1',
          dateLabel: '1954 – 1960',
          note: 'Bắc - Nam tạm thời chia cắt; Bến Tre bùng nổ phong trào Đồng Khởi chuyển cách mạng miền Nam sang thế tiến công.',
          color: 'GOLD',
        },
        {
          id: 'n-t2',
          x: 260,
          y: 400,
          title: 'Đánh bại Chiến tranh Đặc biệt',
          badge: 'Giai đoạn 2',
          dateLabel: '1961 – 1965',
          note: 'Chiến thắng Ấp Bắc, Bình Giã, Ba Gia làm phá sản hoàn toàn chiến lược Chiến tranh đặc biệt của đế quốc Mỹ.',
          color: 'TEAL',
        },
        {
          id: 'n-t3',
          x: 420,
          y: 80,
          title: 'Đánh bại Chiến tranh Cục bộ & Mậu Thân',
          badge: 'Giai đoạn 3',
          dateLabel: '1965 – 1968',
          note: 'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968 giáng đòn quyết định buộc Mỹ phải xuống thang chiến tranh.',
          color: 'INDIGO',
        },
        {
          id: 'n-t4',
          x: 580,
          y: 400,
          title: 'Việt Nam hóa chiến tranh & Điện Biên Phủ trên không',
          badge: 'Giai đoạn 4',
          dateLabel: '1969 – 1973',
          note: '12 ngày đêm Hà Nội - Điện Biên Phủ trên không 1972 buộc Mỹ ký kết Hiệp định Paris 1973 rút toàn bộ quân về nước.',
          color: 'STONE',
        },
        {
          id: 'n-t5',
          x: 740,
          y: 80,
          title: 'Đại thắng Mùa Xuân 1975',
          badge: 'Toàn thắng',
          dateLabel: '1973 – 1975',
          note: 'Chiến dịch Tây Nguyên, Huế - Đà Nẵng và Chiến dịch Hồ Chí Minh lịch sử giải phóng hoàn toàn miền Nam, thống nhất đất nước.',
          color: 'CRIMSON',
        },
      ],
      edges: [
        { id: 'e-1', fromId: 'n-root', toId: 'n-t1', label: 'Khởi đầu' },
        { id: 'e-2', fromId: 'n-root', toId: 'n-t2', label: 'Bước ngoặt 1' },
        { id: 'e-3', fromId: 'n-root', toId: 'n-t3', label: 'Bước ngoặt 2' },
        { id: 'e-4', fromId: 'n-root', toId: 'n-t4', label: 'Bước ngoặt 3' },
        { id: 'e-5', fromId: 'n-root', toId: 'n-t5', label: 'Toàn thắng' },
      ],
    },
  },
  {
    id: 'c0000001-0000-4000-8000-000000000002',
    title: 'Vương triều Nhà Trần — Hào khí Đông A',
    periodLabel: '1225 – 1400',
    template: 'SPIDER',
    graph: {
      structure: 'MIND_MAP',
      mapTheme: 'MODERN_BLUE',
      balancedBranches: true,
      nodes: [
        {
          id: 'n-root',
          x: 420,
          y: 240,
          title: 'Vương triều Nhà Trần',
          badge: 'Hào khí Đông A',
          dateLabel: '1225 – 1400',
          note: 'Triều đại rực rỡ với nghệ thuật quân sự đỉnh cao, 3 lần toàn thắng giặc Nguyên - Mông hung bạo.',
          color: 'CRIMSON',
        },
        {
          id: 'n-b1',
          x: 200,
          y: 120,
          title: 'Tổ chức Chính trị & Quân sự',
          badge: 'Thiết chế',
          dateLabel: 'Chế độ Thái Thượng Hoàng',
          note: 'Cha truyền con nối kết hợp Thái Thượng Hoàng cùng trị quốc; quân đội tinh nhuệ "vua tôi đồng lòng, anh em hòa mục".',
          color: 'GOLD',
        },
        {
          id: 'n-b1-1',
          x: 80,
          y: 80,
          title: 'Hội nghị Diên Hồng & Bình Than',
          note: 'Đỉnh cao của dân chủ quân sự và ý chí đại đoàn kết toàn dân tộc.',
          color: 'GOLD',
        },
        {
          id: 'n-b1-2',
          x: 80,
          y: 160,
          title: 'Quân đội Vạn Kiếp & Tiết chế',
          note: 'Trần Hưng Đạo thống lĩnh quân đội, soạn Hịch tướng sĩ và Binh thư yếu lược.',
          color: 'GOLD',
        },
        {
          id: 'n-b2',
          x: 640,
          y: 120,
          title: '3 Lần Đánh tan Quân Nguyên Mông',
          badge: 'Chiến công hiển hách',
          dateLabel: '1258, 1285, 1287-1288',
          note: 'Kế sách "Vườn không nhà trống", chiến thắng Chương Dương, Hàm Tử, Tây Kết và Bạch Đằng giang 1288.',
          color: 'TEAL',
        },
        {
          id: 'n-b2-1',
          x: 760,
          y: 80,
          title: 'Bạch Đằng 1288',
          note: 'Bãi cọc ngầm tiêu diệt hoàn toàn đoàn thuyền chiến Ô Mã Nhi.',
          color: 'TEAL',
        },
        {
          id: 'n-b3',
          x: 200,
          y: 360,
          title: 'Kinh tế & Điền trang Thái ấp',
          badge: 'Nông nghiệp',
          note: 'Chính sách đắp đê quai vạc, khai hoang lập điền trang thái ấp làm giàu quốc lực.',
          color: 'INDIGO',
        },
        {
          id: 'n-b4',
          x: 640,
          y: 360,
          title: 'Văn hóa & Thiền phái Trúc Lâm',
          badge: 'Tư tưởng',
          note: 'Vua Trần Nhân Tông sáng lập Thiền phái Trúc Lâm Yên Tử đậm đà bản sắc tự chủ Đại Việt.',
          color: 'STONE',
        },
      ],
      edges: [
        { id: 'e-1', fromId: 'n-root', toId: 'n-b1' },
        { id: 'e-2', fromId: 'n-b1', toId: 'n-b1-1' },
        { id: 'e-3', fromId: 'n-b1', toId: 'n-b1-2' },
        { id: 'e-4', fromId: 'n-root', toId: 'n-b2' },
        { id: 'e-5', fromId: 'n-b2', toId: 'n-b2-1' },
        { id: 'e-6', fromId: 'n-root', toId: 'n-b3' },
        { id: 'e-7', fromId: 'n-root', toId: 'n-b4' },
      ],
    },
  },
  {
    id: 'c0000001-0000-4000-8000-000000000003',
    title: 'Nguyên nhân Thắng lợi Khởi nghĩa Lam Sơn',
    periodLabel: '1418 – 1427',
    template: 'SPIDER',
    graph: {
      structure: 'FISHBONE',
      mapTheme: 'AMBER_WARM',
      balancedBranches: true,
      nodes: [
        {
          id: 'n-root',
          x: 750,
          y: 240,
          title: 'Thắng lợi Khởi nghĩa Lam Sơn',
          badge: 'Đầu cá (Mục tiêu)',
          dateLabel: '1427 (Hội thề Đông Quan)',
          note: 'Quét sạch 15 vạn viện binh Liễu Thăng - Mộc Thạnh, giành lại độc lập vẹn toàn.',
          color: 'CRIMSON',
        },
        {
          id: 'n-f1',
          x: 200,
          y: 120,
          title: 'Đường lối Quân sự & Nhân nghĩa',
          badge: 'Xương trên 1',
          note: 'Nguyễn Trãi khởi xướng tư tưởng: "Đem đại nghĩa để thắng hung tàn, lấy chí nhân để thay cường bạo".',
          color: 'GOLD',
        },
        {
          id: 'n-f1-1',
          x: 150,
          y: 60,
          title: 'Tâm công (Đánh vào lòng người)',
          note: 'Viết thư dụ hàng các tướng giặc Vương Thông, Sơn Thọ giúp giảm thiểu xương máu.',
          color: 'GOLD',
        },
        {
          id: 'n-f2',
          x: 450,
          y: 120,
          title: 'Nghệ thuật Tác chiến & Địa hình',
          badge: 'Xương trên 2',
          note: 'Chiến thuật phục kích tại các hẻm núi hiểm trở: Chi Lăng - Xương Giang, Tốt Động - Chúc Động.',
          color: 'TEAL',
        },
        {
          id: 'n-f3',
          x: 200,
          y: 360,
          title: 'Lòng Dân & Hậu phương Vững chắc',
          badge: 'Xương dưới 1',
          note: 'Nhân dân Thanh Hóa, Nghệ An đồng lòng đóng góp lương thực, con em gia nhập nghĩa quân.',
          color: 'INDIGO',
        },
        {
          id: 'n-f4',
          x: 450,
          y: 360,
          title: 'Bộ chỉ huy Kiệt xuất & Tinh thần Quả cảm',
          badge: 'Xương dưới 2',
          note: 'Lê Lợi kiên cường lãnh đạo vượt qua những năm tháng đói rét ở núi rừng Chí Linh.',
          color: 'STONE',
        },
      ],
      edges: [
        { id: 'e-1', fromId: 'n-root', toId: 'n-f1' },
        { id: 'e-2', fromId: 'n-f1', toId: 'n-f1-1' },
        { id: 'e-3', fromId: 'n-root', toId: 'n-f2' },
        { id: 'e-4', fromId: 'n-root', toId: 'n-f3' },
        { id: 'e-5', fromId: 'n-root', toId: 'n-f4' },
      ],
    },
  },
  {
    id: 'c0000001-0000-4000-8000-000000000004',
    title: 'Cơ cấu Tổ chức Bộ máy Nhà nước thời Lê Sơ',
    periodLabel: 'Thời vua Lê Thánh Tông (1460 – 1497)',
    template: 'SPIDER',
    graph: {
      structure: 'ORG_CHART',
      mapTheme: 'HISGO_HERITAGE',
      balancedBranches: true,
      nodes: [
        {
          id: 'n-root',
          x: 420,
          y: 80,
          title: 'Hoàng đế (Tập quyền Tối cao)',
          badge: 'Đứng đầu triều đình',
          dateLabel: 'Vua Lê Thánh Tông',
          note: 'Bãi bỏ các chức Tể tướng, Đại tư mã; vua trực tiếp nắm quyền quân sự và hành chính tối cao.',
          color: 'CRIMSON',
        },
        {
          id: 'n-o1',
          x: 220,
          y: 220,
          title: 'Lục Bộ (Cơ quan Chấp hành)',
          badge: 'Trung ương',
          note: 'Lại bộ, Hộ bộ, Lễ bộ, Binh bộ, Hình bộ, Công bộ phụ trách các mặt công tác quốc gia.',
          color: 'GOLD',
        },
        {
          id: 'n-o2',
          x: 620,
          y: 220,
          title: 'Lục Tự & Lục Khoa (Cơ quan Giám sát)',
          badge: 'Thanh tra & Tư pháp',
          note: 'Chuyên trách giám sát, can gián Lục bộ và kiểm tra tính hợp pháp của các chiếu chỉ triều đình.',
          color: 'TEAL',
        },
        {
          id: 'n-o3',
          x: 420,
          y: 360,
          title: '13 Đạo Thừa Tuyên (Địa phương)',
          badge: 'Cấp Đạo',
          note: 'Đứng đầu mỗi đạo có Tam Ty ngang quyền: Đô Ty (quân sự), Thừa Ty (dân sự), Hiến Ty (tư pháp/giám sát).',
          color: 'INDIGO',
        },
        {
          id: 'n-o3-1',
          x: 240,
          y: 480,
          title: 'Phủ & Huyện / Châu',
          badge: 'Cấp Trung gian',
          note: 'Phụ trách thu thuế, giải quyết tranh chấp địa phương.',
          color: 'STONE',
        },
        {
          id: 'n-o3-2',
          x: 600,
          y: 480,
          title: 'Xã (Xã trưởng & Hương ước)',
          badge: 'Cơ sở',
          note: 'Đơn vị hành chính nhỏ nhất, thực thi pháp luật và sinh hoạt cộng đồng làng xã.',
          color: 'STONE',
        },
      ],
      edges: [
        { id: 'e-1', fromId: 'n-root', toId: 'n-o1' },
        { id: 'e-2', fromId: 'n-root', toId: 'n-o2' },
        { id: 'e-3', fromId: 'n-root', toId: 'n-o3' },
        { id: 'e-4', fromId: 'n-o3', toId: 'n-o3-1' },
        { id: 'e-5', fromId: 'n-o3', toId: 'n-o3-2' },
      ],
    },
  },
  {
    id: 'c0000001-0000-4000-8000-000000000005',
    title: 'Chiến dịch Điện Biên Phủ 1954: Tiến trình 3 đợt tiến công',
    periodLabel: '13/03/1954 – 07/05/1954 (56 ngày đêm)',
    template: 'SPIDER',
    graph: {
      structure: 'LOGIC_CHART',
      mapTheme: 'DARK_MINIMAL',
      balancedBranches: true,
      nodes: [
        {
          id: 'n-root',
          x: 80,
          y: 240,
          title: 'Chiến dịch Điện Biên Phủ',
          badge: 'Lừng lẫy năm châu',
          dateLabel: '56 ngày đêm khoét núi ngủ hầm',
          note: 'Chuyển phương châm từ "Đánh nhanh thắng nhanh" sang "Đánh chắc tiến chắc" của Đại tướng Võ Nguyên Giáp.',
          color: 'CRIMSON',
        },
        {
          id: 'n-l1',
          x: 320,
          y: 120,
          title: 'Đợt 1: Tiêu diệt Him Lam - Độc Lập - Bản Kéo',
          badge: 'Mở màn then chốt',
          dateLabel: '13/03 – 17/03/1954',
          note: 'Đập tan cụm cứ điểm phía Bắc, mở toang cánh cửa dẫn vào thung lũng Mường Thanh.',
          color: 'GOLD',
        },
        {
          id: 'n-l2',
          x: 320,
          y: 240,
          title: 'Đợt 2: Siết chặt vòng vây các đồi phía Đông',
          badge: 'Giằng co quyết liệt',
          dateLabel: '30/03 – 26/04/1954',
          note: 'Chiếm lĩnh đồi A1, C1; đào chiến hào cắt đứt sân bay Mường Thanh, triệt tiêu đường tiếp tế của địch.',
          color: 'TEAL',
        },
        {
          id: 'n-l3',
          x: 320,
          y: 360,
          title: 'Đợt 3: Tổng công kích & Bắt sống De Castries',
          badge: 'Toàn thắng',
          dateLabel: '01/05 – 07/05/1954',
          note: 'Chiều 7/5, cờ Quyết chiến Quyết thắng tung bay trên nóc hầm chỉ huy; toàn bộ tập đoàn cứ điểm bị bắt sống.',
          color: 'INDIGO',
        },
        {
          id: 'n-l3-1',
          x: 580,
          y: 360,
          title: 'Kết cục: Thắng lợi Hiệp định Genève',
          badge: 'Ý nghĩa quốc tế',
          note: 'Buộc thực dân Pháp công nhận độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam.',
          color: 'STONE',
        },
      ],
      edges: [
        { id: 'e-1', fromId: 'n-root', toId: 'n-l1' },
        { id: 'e-2', fromId: 'n-root', toId: 'n-l2' },
        { id: 'e-3', fromId: 'n-root', toId: 'n-l3' },
        { id: 'e-4', fromId: 'n-l3', toId: 'n-l3-1' },
      ],
    },
  },
];

async function main() {
  console.log('=== Bắt đầu Seed Mindmaps Lịch sử Việt Nam ===');

  const admin = await prisma.authUser.findFirst({
    where: { email: ADMIN_EMAIL },
    select: { id: true, email: true },
  });

  const ownerId = admin?.id ?? 'seed-admin-owner-id';
  console.log(`Gán chủ sở hữu (ownerId): ${ownerId} (${admin?.email ?? 'Fallback ID'})`);

  const deletedOld = await prisma.studyMindmap.deleteMany({
    where: {
      id: { startsWith: 'seed-mindmap-' },
    },
  });
  if (deletedOld.count > 0) {
    console.log(`Đã dọn dẹp ${deletedOld.count} sơ đồ cũ mang ID không phải UUID.`);
  }

  let seededCount = 0;
  for (const m of SEED_MINDMAPS) {
    await prisma.studyMindmap.upsert({
      where: { id: m.id },
      update: {
        ownerId,
        title: m.title,
        periodLabel: m.periodLabel,
        template: m.template,
        graph: m.graph,
      },
      create: {
        id: m.id,
        ownerId,
        title: m.title,
        periodLabel: m.periodLabel,
        template: m.template,
        graph: m.graph,
      },
    });
    console.log(`✔ [Seed] Đã lưu sơ đồ: ${m.title} (${m.graph.structure})`);
    seededCount++;
  }

  console.log(`=== Hoàn tất Seed ${seededCount} sơ đồ tư duy thành công! ===`);
}

main()
  .catch((err) => {
    console.error('Lỗi khi seed Mindmaps:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
