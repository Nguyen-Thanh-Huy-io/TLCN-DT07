/**
 * Seed bộ danh mục Thời kỳ (Period) chuẩn hóa 2 cấp cho cả Việt Nam và Thế giới.
 * Tuân thủ chuẩn học thuật: Period là khung thời gian niên biểu, không chứa cuộc chiến/hành động.
 */
import 'dotenv/config';
import { PrismaClient, ContentStatus, DatePrecision } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

interface PeriodSeedInput {
  slug: string;
  name: string;
  startYear?: number;
  endYear?: number;
  timeLabel?: string;
  regionCode: string;
  description?: string;
  parentSlug?: string;
  displayOrder: number;
}

// ----------------------------------------------------------------------------
// 1. TRỤC LỊCH SỬ VIỆT NAM (regionCode = 'VIETNAM')
// ----------------------------------------------------------------------------

const VIETNAM_ROOT_PERIODS: PeriodSeedInput[] = [
  {
    slug: 'thoi-tien-su-so-su',
    name: 'Thời tiền sử và sơ sử',
    endYear: -700,
    timeLabel: 'Trước thế kỷ 7 TCN',
    regionCode: 'VIETNAM',
    description: 'Dấu tích người nguyên thủy, thời đại đồ đá và sự hình thành các văn hóa tiền sử trên đất nước Việt Nam.',
    displayOrder: 10,
  },
  {
    slug: 'thoi-dung-nuoc',
    name: 'Thời kỳ dựng nước Văn Lang – Âu Lạc',
    startYear: -700,
    endYear: -179,
    timeLabel: 'Thế kỷ 7 TCN – 179 TCN',
    regionCode: 'VIETNAM',
    description: 'Buổi đầu dựng nước của dân tộc với nhà nước Văn Lang thời các vua Hùng và nhà nước Âu Lạc thời An Dương Vương.',
    displayOrder: 20,
  },
  {
    slug: 'thoi-bac-thuoc',
    name: 'Thời kỳ Bắc thuộc và đấu tranh giành độc lập',
    startYear: -179,
    endYear: 938,
    timeLabel: '179 TCN – 938',
    regionCode: 'VIETNAM',
    description: 'Hơn một nghìn năm đấu tranh bền bỉ chống ách đô hộ của các triều đại phong kiến phương Bắc, kết thúc bằng chiến thắng Bạch Đằng.',
    displayOrder: 30,
  },
  {
    slug: 'thoi-phong-kien-doc-lap',
    name: 'Thời kỳ phong kiến độc lập và tự chủ',
    startYear: 938,
    endYear: 1858,
    timeLabel: '938 – 1858',
    regionCode: 'VIETNAM',
    description: 'Kỷ nguyên độc lập tự chủ lâu dài với sự hưng thịnh của các triều đại phong kiến quân chủ Việt Nam.',
    displayOrder: 40,
  },
  {
    slug: 'thoi-can-dai-phap-thuoc',
    name: 'Thời kỳ cận đại và chống thực dân Pháp',
    startYear: 1858,
    endYear: 1945,
    timeLabel: '1858 – 1945',
    regionCode: 'VIETNAM',
    description: 'Giai đoạn đất nước chịu ách thống trị thực dân Pháp và phong trào đấu tranh kiên cường giải phóng dân tộc.',
    displayOrder: 50,
  },
  {
    slug: 'thoi-ky-hien-dai',
    name: 'Thời kỳ hiện đại',
    startYear: 1945,
    timeLabel: '1945 – Nay',
    regionCode: 'VIETNAM',
    description: 'Kỷ nguyên độc lập, thống nhất đất nước, tiến hành công cuộc đổi mới và hội nhập quốc tế.',
    displayOrder: 60,
  },
];

const VIETNAM_CHILD_PERIODS: PeriodSeedInput[] = [
  // Thuộc Thời tiền sử & sơ sử
  {
    slug: 'van-hoa-dong-son',
    name: 'Văn hóa Đông Sơn và thời đại kim khí',
    endYear: -700,
    timeLabel: 'Trước thế kỷ 7 TCN',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-tien-su-so-su',
    description: 'Đỉnh cao văn hóa thời đại đồ đồng và đồ sắt sớm trên đất nước Việt Nam.',
    displayOrder: 11,
  },

  // Thuộc Thời kỳ dựng nước
  {
    slug: 'thoi-ky-van-lang',
    name: 'Thời kỳ Văn Lang',
    startYear: -700,
    endYear: -258,
    timeLabel: 'Thế kỷ 7 TCN – 258 TCN',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-dung-nuoc',
    description: 'Nhà nước đầu tiên trong lịch sử dân tộc dưới sự trị vì của các đời Vua Hùng.',
    displayOrder: 21,
  },
  {
    slug: 'thoi-ky-au-lac',
    name: 'Thời kỳ Âu Lạc',
    startYear: -257,
    endYear: -179,
    timeLabel: '257 TCN – 179 TCN',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-dung-nuoc',
    description: 'Nhà nước của người Âu Việt và Lạc Việt dưới sự lãnh đạo của Thục Phán An Dương Vương với thành Cổ Loa.',
    displayOrder: 22,
  },

  // Thuộc Thời kỳ Bắc thuộc
  {
    slug: 'bac-thuoc-lan-1-khoi-nghia-hai-ba-trung',
    name: 'Thời kỳ Bắc thuộc lần 1 và Khởi nghĩa Hai Bà Trưng',
    startYear: -179,
    endYear: 43,
    timeLabel: '179 TCN – 43',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-bac-thuoc',
    description: 'Giai đoạn đô hộ của nhà Triệu, Tây Hán và cuộc khởi nghĩa quật khởi của Hai Bà Trưng.',
    displayOrder: 31,
  },
  {
    slug: 'nha-tien-ly-nuoc-van-xuan',
    name: 'Thời kỳ Tiền Lý và Nước Vạn Xuân',
    startYear: 544,
    endYear: 602,
    timeLabel: '544 – 602',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-bac-thuoc',
    description: 'Nhà nước Vạn Xuân độc lập do Lý Bí thành lập, tiếp nối bởi Triệu Quang Phục và Lý Phật Tử.',
    displayOrder: 32,
  },
  {
    slug: 'giai-doan-tu-chu-khuc-duong',
    name: 'Giai đoạn tự chủ đầu thế kỷ 10',
    startYear: 905,
    endYear: 938,
    timeLabel: '905 – 938',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-bac-thuoc',
    description: 'Thời kỳ gây dựng quyền tự chủ của họ Khúc và Dương Đình Nghệ, mở đường cho nền độc lập hoàn toàn.',
    displayOrder: 33,
  },

  // Thuộc Thời kỳ phong kiến độc lập
  {
    slug: 'thoi-ngo-dinh-tien-le',
    name: 'Thời kỳ Ngô – Đinh – Tiền Lê',
    startYear: 939,
    endYear: 1009,
    timeLabel: '939 – 1009',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Thế kỷ định hình thể chế quốc gia độc lập với quốc hiệu Đại Cồ Việt và kinh đô Hoa Lư.',
    displayOrder: 41,
  },
  {
    slug: 'thoi-ky-nha-ly',
    name: 'Thời kỳ Nhà Lý',
    startYear: 1009,
    endYear: 1225,
    timeLabel: '1009 – 1225',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Giai đoạn định đô Thăng Long, thịnh trị của Phật giáo, củng cố nền văn hiến và quốc hiệu Đại Việt.',
    displayOrder: 42,
  },
  {
    slug: 'thoi-ky-nha-tran',
    name: 'Thời kỳ Nhà Trần',
    startYear: 1225,
    endYear: 1400,
    timeLabel: '1225 – 1400',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Triều đại với hào khí Đông A oanh liệt, phát triển rực rỡ văn minh Đại Việt.',
    displayOrder: 43,
  },
  {
    slug: 'thoi-ky-nha-ho',
    name: 'Thời kỳ Nhà Hồ và thời thuộc Minh',
    startYear: 1400,
    endYear: 1427,
    timeLabel: '1400 – 1427',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Thời kỳ cải cách của Hồ Quý Ly với quốc hiệu Đại Ngu, tiếp đó là cuộc đấu tranh giải phóng khỏi ách đô hộ nhà Minh.',
    displayOrder: 44,
  },
  {
    slug: 'thoi-ky-nha-le-so',
    name: 'Thời kỳ Nhà Lê Sơ',
    startYear: 1428,
    endYear: 1527,
    timeLabel: '1428 – 1527',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Thời kỳ đỉnh cao của chế độ quân chủ chuyên chế Đại Việt với bộ luật Hồng Đức thời Lê Thánh Tông.',
    displayOrder: 45,
  },
  {
    slug: 'thoi-ky-nam-bac-trieu',
    name: 'Thời kỳ Nam – Bắc triều',
    startYear: 1533,
    endYear: 1592,
    timeLabel: '1533 – 1592',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Giai đoạn phân chia giữa nhà Mạc ở phía Bắc và nhà Lê Trung Hưng ở phía Nam.',
    displayOrder: 46,
  },
  {
    slug: 'thoi-ky-trinh-nguyen',
    name: 'Thời kỳ Trịnh – Nguyễn phân tranh',
    startYear: 1627,
    endYear: 1777,
    timeLabel: '1627 – 1777',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Giai đoạn đất nước chia thành Đàng Ngoài (vua Lê chúa Trịnh) và Đàng Trong (chúa Nguyễn mở cõi phương Nam).',
    displayOrder: 47,
  },
  {
    slug: 'thoi-ky-tay-son',
    name: 'Thời kỳ Tây Sơn',
    startYear: 1778,
    endYear: 1802,
    timeLabel: '1778 – 1802',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Phong trào nông dân quật khởi lật đổ các tập đoàn phong kiến suy tàn, mở đầu quá trình tái thống nhất đất nước.',
    displayOrder: 48,
  },
  {
    slug: 'thoi-ky-nha-nguyen-doc-lap',
    name: 'Thời kỳ Nhà Nguyễn độc lập',
    startYear: 1802,
    endYear: 1858,
    timeLabel: '1802 – 1858',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-phong-kien-doc-lap',
    description: 'Triều đại phong kiến cuối cùng cai trị lãnh thổ thống nhất từ ải Nam Quan đến mũi Cà Mau trước khi thực dân Pháp xâm lược.',
    displayOrder: 49,
  },

  // Thuộc Thời kỳ cận đại & chống thực dân Pháp
  {
    slug: 'phong-trao-can-vuong',
    name: 'Thời kỳ Phong trào Cần Vương và kháng chiến thế kỷ 19',
    startYear: 1858,
    endYear: 1896,
    timeLabel: '1858 – 1896',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-can-dai-phap-thuoc',
    description: 'Giai đoạn phong trào kháng chiến dưới ngọn cờ Cần Vương phò vua cứu nước của các sĩ phu phong kiến.',
    displayOrder: 51,
  },
  {
    slug: 'phong-trao-yeu-nuoc-dau-tk-20',
    name: 'Thời kỳ Phong trào yêu nước đầu thế kỷ 20',
    startYear: 1896,
    endYear: 1930,
    timeLabel: '1896 – 1930',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-can-dai-phap-thuoc',
    description: 'Giai đoạn đấu tranh cứu nước theo khuynh hướng dân chủ tư sản (Đông Du, Duy Tân, Đông Kinh Nghĩa Thục).',
    displayOrder: 52,
  },
  {
    slug: 'giai-doan-van-dong-giai-phong-dan-toc',
    name: 'Giai đoạn vận động giải phóng dân tộc',
    startYear: 1930,
    endYear: 1945,
    timeLabel: '1930 – 1945',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-can-dai-phap-thuoc',
    description: 'Giai đoạn phong trào cách mạng dưới sự lãnh đạo của Đảng Cộng sản, đỉnh cao là Cách mạng Tháng Tám.',
    displayOrder: 53,
  },

  // Thuộc Thời kỳ hiện đại
  {
    slug: 'giai-doan-1945-1954',
    name: 'Giai đoạn 1945 – 1954',
    startYear: 1945,
    endYear: 1954,
    timeLabel: '1945 – 1954',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-ky-hien-dai',
    description: 'Giai đoạn bảo vệ chính quyền dân chủ nhân dân non trẻ và tiến hành cuộc kháng chiến toàn quốc chống thực dân Pháp.',
    displayOrder: 61,
  },
  {
    slug: 'giai-doan-1954-1975',
    name: 'Giai đoạn 1954 – 1975',
    startYear: 1954,
    endYear: 1975,
    timeLabel: '1954 – 1975',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-ky-hien-dai',
    description: 'Giai đoạn đất nước tạm thời bị chia cắt hai miền, xây dựng CNXH ở miền Bắc và giải phóng miền Nam.',
    displayOrder: 62,
  },
  {
    slug: 'giai-doan-1975-1986',
    name: 'Giai đoạn 1975 – 1986',
    startYear: 1975,
    endYear: 1986,
    timeLabel: '1975 – 1986',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-ky-hien-dai',
    description: 'Giai đoạn đất nước thống nhất, bảo vệ biên giới và tìm tòi con đường đổi mới kinh tế - xã hội.',
    displayOrder: 63,
  },
  {
    slug: 'thoi-ky-doi-moi-hoi-nhap',
    name: 'Thời kỳ Đổi mới và Hội nhập quốc tế',
    startYear: 1986,
    timeLabel: '1986 – Nay',
    regionCode: 'VIETNAM',
    parentSlug: 'thoi-ky-hien-dai',
    description: 'Kỷ nguyên đổi mới toàn diện đất nước, đẩy mạnh công nghiệp hóa, hiện đại hóa và hội nhập sâu rộng.',
    displayOrder: 64,
  },
];

// ----------------------------------------------------------------------------
// 2. TRỤC LỊCH SỬ THẾ GIỚI (regionCode = 'WORLD')
// ----------------------------------------------------------------------------

const WORLD_ROOT_PERIODS: PeriodSeedInput[] = [
  {
    slug: 'the-gioi-co-dai',
    name: 'Lịch sử thế giới cổ đại',
    endYear: 476,
    timeLabel: 'Khởi nguyên – 476',
    regionCode: 'WORLD',
    description: 'Từ sự xuất hiện của các nền văn minh sơ khai đầu tiên đến sự sụp đổ của Đế quốc Tây La Mã.',
    displayOrder: 100,
  },
  {
    slug: 'the-gioi-trung-dai',
    name: 'Lịch sử thế giới trung đại',
    startYear: 476,
    endYear: 1492,
    timeLabel: '476 – 1492',
    regionCode: 'WORLD',
    description: 'Thời kỳ phong kiến thế giới, sự hưng khởi của các tôn giáo lớn và các đế quốc Á – Âu.',
    displayOrder: 200,
  },
  {
    slug: 'the-gioi-can-dai',
    name: 'Lịch sử thế giới cận đại',
    startYear: 1492,
    endYear: 1918,
    timeLabel: '1492 – 1918',
    regionCode: 'WORLD',
    description: 'Thời kỳ các cuộc phát kiến địa lý, cách mạng tư sản, cách mạng công nghiệp và sự bành trướng thực dân.',
    displayOrder: 300,
  },
  {
    slug: 'the-gioi-hien-dai',
    name: 'Lịch sử thế giới hiện đại',
    startYear: 1918,
    timeLabel: '1918 – Nay',
    regionCode: 'WORLD',
    description: 'Thế giới từ sau Chiến tranh thế giới thứ nhất đến thời kỳ Chiến tranh Lạnh và kỷ nguyên toàn cầu hóa.',
    displayOrder: 400,
  },
];

const WORLD_CHILD_PERIODS: PeriodSeedInput[] = [
  // Thuộc Thế giới cổ đại
  {
    slug: 'van-minh-phuong-dong-co-dai',
    name: 'Thời kỳ Văn minh phương Đông cổ đại',
    endYear: 476,
    timeLabel: 'Thiên niên kỷ 4 TCN – 476',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-co-dai',
    description: 'Các nền văn minh sơ khai bên các dòng sông lớn: Ai Cập, Lưỡng Hà, Ấn Độ và Trung Hoa cổ đại.',
    displayOrder: 101,
  },
  {
    slug: 'van-minh-hy-lap-la-ma-co-dai',
    name: 'Thời kỳ Văn minh Hy Lạp và La Mã cổ đại',
    startYear: -800,
    endYear: 476,
    timeLabel: 'Thế kỷ 8 TCN – 476',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-co-dai',
    description: 'Cái nôi của nền văn minh phương Tây cổ đại với nền cộng hòa và đế chế La Mã.',
    displayOrder: 102,
  },

  // Thuộc Thế giới trung đại
  {
    slug: 'chau-au-thoi-phong-kien-trung-co',
    name: 'Thời kỳ Châu Âu phong kiến trung cổ',
    startYear: 476,
    endYear: 1492,
    timeLabel: '476 – 1492',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-trung-dai',
    description: 'Thời kỳ phân quyền phong kiến tại châu Âu và sự tồn tại của Đế quốc Byzantine.',
    displayOrder: 201,
  },
  {
    slug: 'ky-nguyen-hoi-giao-hoang-kim',
    name: 'Kỷ nguyên Hồi giáo hoàng kim',
    startYear: 622,
    endYear: 1258,
    timeLabel: '622 – 1258',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-trung-dai',
    description: 'Thời kỳ hưng thịnh về khoa học, triết học và thương mại của thế giới Hồi giáo và Con đường tơ lụa.',
    displayOrder: 202,
  },
  {
    slug: 'de-quoc-mong-co-va-chau-a',
    name: 'Kỷ nguyên bành trướng Mông Cổ và các triều đại châu Á',
    startYear: 1206,
    endYear: 1368,
    timeLabel: '1206 – 1368',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-trung-dai',
    description: 'Thời kỳ đế quốc Mông Cổ mở rộng lãnh thổ khắp lục địa Á – Âu, giao thoa trực tiếp với lịch sử Đại Việt.',
    displayOrder: 203,
  },

  // Thuộc Thế giới cận đại
  {
    slug: 'phuc-hung-va-dai-phat-kien',
    name: 'Thời kỳ Phục hưng và Đại phát kiến địa lý',
    startYear: 1492,
    endYear: 1648,
    timeLabel: '1492 – 1648',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-can-dai',
    description: 'Phong trào phục hưng văn hóa, cải cách tôn giáo và các chuyến hải trình mở rộng bản đồ thế giới.',
    displayOrder: 301,
  },
  {
    slug: 'ky-nguyen-khai-sang-cach-mang-tu-san',
    name: 'Kỷ nguyên Khai sáng và các cuộc Cách mạng tư sản',
    startYear: 1648,
    endYear: 1789,
    timeLabel: '1648 – 1789',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-can-dai',
    description: 'Thời kỳ bùng nổ tư tưởng Khai sáng, Cách mạng tư sản Anh, Cách mạng Mỹ và Cách mạng Pháp 1789.',
    displayOrder: 302,
  },
  {
    slug: 'cach-mang-cong-nghiep-va-chu-nghia-de-quoc',
    name: 'Thời kỳ Cách mạng công nghiệp và Chủ nghĩa đế quốc',
    startYear: 1789,
    endYear: 1914,
    timeLabel: '1789 – 1914',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-can-dai',
    description: 'Thời kỳ chuyển dịch sang nền văn minh công nghiệp và sự cạnh tranh phân chia thuộc địa của các cường quốc.',
    displayOrder: 303,
  },
  {
    slug: 'thoi-ky-chien-tranh-the-gioi-thu-nhat',
    name: 'Thời kỳ Chiến tranh thế giới thứ nhất',
    startYear: 1914,
    endYear: 1918,
    timeLabel: '1914 – 1918',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-can-dai',
    description: 'Cuộc đại chiến đầu tiên trên quy mô toàn cầu, kết thúc thời kỳ cận đại.',
    displayOrder: 304,
  },

  // Thuộc Thế giới hiện đại
  {
    slug: 'thoi-ky-giua-hai-cuoc-dai-chien',
    name: 'Thời kỳ giữa hai cuộc đại chiến thế giới',
    startYear: 1918,
    endYear: 1939,
    timeLabel: '1918 – 1939',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-hien-dai',
    description: 'Giai đoạn trật tự Véc-xai - Oa-sinh-tơn, cuộc đại suy thoái kinh tế và phong trào giải phóng dân tộc.',
    displayOrder: 401,
  },
  {
    slug: 'thoi-ky-chien-tranh-the-gioi-thu-hai',
    name: 'Thời kỳ Chiến tranh thế giới thứ hai',
    startYear: 1939,
    endYear: 1945,
    timeLabel: '1939 – 1945',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-hien-dai',
    description: 'Cuộc chiến tranh chống chủ nghĩa phát xít tàn khốc nhất lịch sử nhân loại.',
    displayOrder: 402,
  },
  {
    slug: 'thoi-ky-chien-tranh-lanh',
    name: 'Thời kỳ Chiến tranh Lạnh',
    startYear: 1947,
    endYear: 1991,
    timeLabel: '1947 – 1991',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-hien-dai',
    description: 'Cục diện đối đầu hai cực Ianta giữa phe tư bản do Mỹ đứng đầu và phe xã hội chủ nghĩa do Liên Xô đứng đầu.',
    displayOrder: 403,
  },
  {
    slug: 'the-gioi-da-cuc-toan-cau-hoa',
    name: 'Kỷ nguyên thế giới đa cực và toàn cầu hóa',
    startYear: 1991,
    timeLabel: '1991 – Nay',
    regionCode: 'WORLD',
    parentSlug: 'the-gioi-hien-dai',
    description: 'Trật tự thế giới sau Chiến tranh Lạnh với xu thế đa cực hóa, liên kết kinh tế và bùng nổ công nghệ.',
    displayOrder: 404,
  },
];

// ----------------------------------------------------------------------------
// SEED RUNNER
// ----------------------------------------------------------------------------

export async function seedPeriodsV1() {
  console.log('🏛️ Bắt đầu nạp danh mục Period chuẩn 2 cấp (Việt Nam & Thế giới)...');

  // Cache tra cứu regionId
  const regionTerms = await prisma.taxonomyTerm.findMany({
    where: { groupCode: 'REGION' },
  });
  const regionMap = new Map<string, string>();
  for (const term of regionTerms) {
    regionMap.set(term.code, term.id);
  }

  // 1. Nạp danh sách Gốc (Cấp 1 - parentId = null)
  const allRoots = [...VIETNAM_ROOT_PERIODS, ...WORLD_ROOT_PERIODS];
  for (const item of allRoots) {
    const regionId = regionMap.get(item.regionCode);
    await prisma.period.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        startYear: item.startYear ?? null,
        endYear: item.endYear ?? null,
        timeLabel: item.timeLabel ?? null,
        datePrecision: DatePrecision.YEAR,
        region: item.regionCode,
        regionId: regionId ?? null,
        description: item.description ?? null,
        displayOrder: item.displayOrder,
        status: ContentStatus.PUBLISHED,
        parentId: null,
      },
      update: {
        name: item.name,
        startYear: item.startYear ?? null,
        endYear: item.endYear ?? null,
        timeLabel: item.timeLabel ?? null,
        region: item.regionCode,
        regionId: regionId ?? null,
        description: item.description ?? null,
        displayOrder: item.displayOrder,
        status: ContentStatus.PUBLISHED,
        parentId: null,
      },
    });
  }
  console.log(`✅ Đã nạp thành công ${allRoots.length} Thời đại gốc (Cấp 1).`);

  // Cache id của các Period cha
  const rootPeriods = await prisma.period.findMany();
  const periodIdBySlug = new Map<string, string>();
  for (const p of rootPeriods) {
    periodIdBySlug.set(p.slug, p.id);
  }

  // 2. Nạp danh sách Con (Cấp 2 - parentId trỏ tới cha)
  const allChildren = [...VIETNAM_CHILD_PERIODS, ...WORLD_CHILD_PERIODS];
  for (const item of allChildren) {
    const regionId = regionMap.get(item.regionCode);
    const parentId = item.parentSlug ? periodIdBySlug.get(item.parentSlug) ?? null : null;

    await prisma.period.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        startYear: item.startYear ?? null,
        endYear: item.endYear ?? null,
        timeLabel: item.timeLabel ?? null,
        datePrecision: DatePrecision.YEAR,
        region: item.regionCode,
        regionId: regionId ?? null,
        description: item.description ?? null,
        displayOrder: item.displayOrder,
        status: ContentStatus.PUBLISHED,
        parentId,
      },
      update: {
        name: item.name,
        startYear: item.startYear ?? null,
        endYear: item.endYear ?? null,
        timeLabel: item.timeLabel ?? null,
        region: item.regionCode,
        regionId: regionId ?? null,
        description: item.description ?? null,
        displayOrder: item.displayOrder,
        status: ContentStatus.PUBLISHED,
        parentId,
      },
    });
  }
  console.log(`✅ Đã nạp thành công ${allChildren.length} Thời kỳ con cụ thể (Cấp 2).`);
  console.log(`🎉 Tổng cộng: Đã nạp ${allRoots.length + allChildren.length} Period chuẩn hóa!`);
}

if (require.main === module) {
  seedPeriodsV1()
    .catch((err) => {
      console.error('❌ Lỗi khi seed Period:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
