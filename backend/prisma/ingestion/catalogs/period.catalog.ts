import { ContentStatus, DatePrecision } from '@prisma/client';
import { toSlug } from '../../../src/common/utils/slug.util';
import { IPeriodSeedRecord } from '../interfaces/ingestion.interface';

interface IRawPeriodDef {
  id: string;
  parentSlug?: string | null;
  name: string;
  slug?: string;
  startYear: number | null;
  endYear: number | null;
  timeLabel: string;
  datePrecision?: DatePrecision;
  region: string;
  description: string;
  coverImageUrl?: string;
}

const RAW_PERIODS: IRawPeriodDef[] = [
  // ============================================================================
  // I. LỊCH SỬ VIỆT NAM: 1. THỜI KỲ DỰNG NƯỚC VÀ GIỮ NƯỚC (2879 TCN - 938)
  // (Đã bỏ Thời kỳ Nguyên thủy theo đúng yêu cầu)
  // ============================================================================
  {
    id: 'a0000000-0000-4000-8000-000000000100',
    parentSlug: null,
    name: 'Thời kỳ Dựng nước và Giữ nước (2879 TCN - 938)',
    slug: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
    startYear: -2879,
    endYear: 938,
    timeLabel: '2879 TCN – 938',
    datePrecision: DatePrecision.APPROXIMATE,
    region: 'Việt Nam',
    description:
      'Nơi khởi nguồn của những nền văn hóa đặc sắc (Văn hóa Đông Sơn - Văn Lang Âu Lạc, Văn hóa Sa Huỳnh - Lâm Ấp Champa, Văn hóa Đồng Nai Óc Eo - Phù Nam) hình thành nền tảng văn minh nông nghiệp lúa nước, tiếp nối bởi hơn một thiên niên kỷ kiên cường đấu tranh chống Bắc thuộc giành lại độc lập tự chủ.',
    coverImageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Dong_Son_bronze_drum.jpg/800px-Dong_Son_bronze_drum.jpg',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000101',
    parentSlug: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
    name: 'Thời đại Hồng Bàng: Xích Quỷ, Văn Lang & Nhà Thục Âu Lạc (2879 TCN - 208 TCN)',
    slug: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
    startYear: -2879,
    endYear: -208,
    timeLabel: '2879 TCN – 208 TCN',
    datePrecision: DatePrecision.APPROXIMATE,
    region: 'Việt Nam',
    description:
      'Khởi nguồn từ truyền thuyết Kinh Dương Vương (nước Xích Quỷ), Lạc Long Quân - Âu Cơ, đến 18 đời Vua Hùng dựng nước Văn Lang tại Phong Châu và Thục Phán An Dương Vương hợp nhất Âu Việt - Lạc Việt lập nên nhà Thục (nước Âu Lạc, 257 TCN - 208 TCN) đóng đô ở Cổ Loa.',
    coverImageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Dong_Son_bronze_drum.jpg/800px-Dong_Son_bronze_drum.jpg',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000102',
    parentSlug: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
    name: 'Thời kỳ Bắc thuộc lần I: Nhà Triệu & Thuộc Hán (208 TCN - 39)',
    slug: 'thoi-ky-bac-thuoc-lan-1-208-tcn-39',
    startYear: -208,
    endYear: 39,
    timeLabel: '208 TCN – 39 CN',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Gồm giai đoạn Nhà Triệu (208 TCN - 111 TCN) của Triệu Đà đặt tên nước Nam Việt đóng đô ở Phiên Ngưng, và giai đoạn Thuộc Hán (111 TCN - 39) khi Hán Vũ Đế thôn tính Nam Việt, chia làm 9 quận (trong đó có Giao Chỉ, Cửu Chân, Nhật Nam) với chính sách cai trị hà khắc.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000103',
    parentSlug: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
    name: 'Giai đoạn Trưng Nữ Vương (40 - 43)',
    slug: 'giai-doan-trung-nu-vuong-40-43',
    startYear: 40,
    endYear: 43,
    timeLabel: '40 – 43',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Cuộc khởi nghĩa oanh liệt dưới sự lãnh đạo của hai chị em Trưng Trắc và Trưng Nhị đánh chiếm 65 thành trì ở Giao Chỉ, Cửu Chân, Nhật Nam, Hợp Phố, giành quyền tự chủ trong 3 năm trước khi anh dũng tuẫn tiết tại sông Hát khi chống quân Mã Viện nhà Đông Hán.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000104',
    parentSlug: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
    name: 'Thời kỳ Bắc thuộc lần II (43 - 543)',
    slug: 'thoi-ky-bac-thuoc-lan-2-43-543',
    startYear: 43,
    endYear: 543,
    timeLabel: '43 – 543',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Trải qua ách đô hộ của các triều đại Đông Hán, Đông Ngô, Tấn, Lưu Tống, Nam Tề, Lương. Tiêu biểu có cuộc khởi nghĩa Bà Triệu (Triệu Thị Trinh) năm 248 chống Đông Ngô và khởi nghĩa anh em Lý Trường Nhân - Lý Thúc Hiến (468 - 485) chống Lưu Tống, Nam Tề.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000105',
    parentSlug: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
    name: 'Thời kỳ Nhà Tiền Lý & Nước Vạn Xuân (544 - 602)',
    slug: 'thoi-ky-nha-tien-ly-544-602',
    startYear: 544,
    endYear: 602,
    timeLabel: '544 – 602',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Năm 542 Lý Bí khởi nghĩa đánh bại nhà Lương, mùa xuân năm 544 xưng là Lý Nam Đế, đặt quốc hiệu Vạn Xuân. Tiếp nối bởi Triệu Việt Vương (Triệu Quang Phục, 548 - 571) tại đầm Dạ Trạch, Đào Lang Vương (Lý Thiên Bảo) và Hậu Lý Nam Đế (Lý Phật Tử, 571 - 602).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000106',
    parentSlug: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
    name: 'Thời kỳ Bắc thuộc lần III (602 - 905)',
    slug: 'thoi-ky-bac-thuoc-lan-3-602-905',
    startYear: 602,
    endYear: 905,
    timeLabel: '602 – 905',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Thời kỳ chịu sự cai trị của nhà Tùy và nhà Đường. Nhân dân liên tục nổi dậy với các cuộc khởi nghĩa lớn: Mai Thúc Loan xưng Mai Hắc Đế ở Hoan Châu (713 - 722), Bố Cái Đại Vương Phùng Hưng (766 - 791) và khởi nghĩa Dương Thanh (819 - 820).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000107',
    parentSlug: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
    name: 'Thời kỳ Tự chủ: Họ Khúc & Dương Đình Nghệ (905 - 938)',
    slug: 'thoi-ky-tu-chu-905-938',
    startYear: 905,
    endYear: 938,
    timeLabel: '905 – 938',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Khúc Thừa Dụ giành quyền tự chủ năm 905 xưng Tiết độ sứ, truyền cho Khúc Hạo (907 - 917) cải cách chính sự và Khúc Thừa Mỹ (917 - 930). Năm 931, Dương Đình Nghệ đánh tan quân Nam Hán giành lại thành Đại La, và năm 938 Ngô Quyền đại thắng Bạch Đằng chấm dứt Bắc thuộc.',
  },

  // ============================================================================
  // II. LỊCH SỬ VIỆT NAM: 2. THỜI KỲ PHONG KIẾN ĐỘC LẬP TỰ CHỦ (939 - 1883)
  // ============================================================================
  {
    id: 'a0000000-0000-4000-8000-000000000200',
    parentSlug: null,
    name: 'Thời kỳ Phong kiến Việt Nam (939 - 1883)',
    slug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    startYear: 939,
    endYear: 1883,
    timeLabel: '939 – 1883',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Hơn 9 thế kỷ của 10 triều đại phong kiến Việt Nam từ khi Ngô Quyền xưng vương tại Cổ Loa (939), trải qua Đinh - Tiền Lê - Lý - Trần - Hồ - Hậu Lê - Mạc - Trịnh Nguyễn phân tranh - Tây Sơn đến triều Nguyễn độc lập tự chủ (1802 - 1883).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000201',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Nhà Ngô, Nhà Đinh & Nhà Tiền Lê (939 - 1009)',
    slug: 'nha-ngo-nha-dinh-nha-tien-le-939-1009',
    startYear: 939,
    endYear: 1009,
    timeLabel: '939 – 1009',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Nhà Ngô (939 - 965: Ngô Quyền, Dương Bình Vương, Hậu Ngô Vương & Loạn 12 sứ quân), Nhà Đinh (968 - 980: Đinh Tiên Hoàng dẹp loạn 12 sứ quân lập nước Đại Cồ Việt ở Hoa Lư, Đinh Phế Đế) và Nhà Tiền Lê (980 - 1009: Lê Đại Hành phá Tống bình Chiêm, Lê Trung Tông, Lê Ngọa Triều).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000202',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Triều đại Nhà Lý (1009 - 1225)',
    slug: 'trieu-dai-nha-ly-1009-1225',
    startYear: 1009,
    endYear: 1225,
    timeLabel: '1009 – 1225',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Trải qua 9 đời vua: Lý Thái Tổ (dời đô về Thăng Long 1010), Lý Thái Tông, Lý Thánh Tông (đặt quốc hiệu Đại Việt), Lý Nhân Tông (cùng Thái phi Ỷ Lan, Lý Đạo Thành, Lý Thường Kiệt 2 lần đánh tan quân Tống), Lý Thần Tông, Lý Anh Tông (Tô Hiến Thành phò tá), Lý Cao Tông, Lý Huệ Tông và Lý Chiêu Hoàng.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000203',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Triều đại Nhà Trần (1225 - 1400)',
    slug: 'trieu-dai-nha-tran-1225-1400',
    startYear: 1225,
    endYear: 1400,
    timeLabel: '1225 – 1400',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      '175 năm trị vì qua 12 đời vua (Trần Thái Tông, Thánh Tông, Nhân Tông, Anh Tông, Minh Tông, Hiến Tông, Dụ Tông, Nghệ Tông, Duệ Tông, Phế Đế, Thuận Tông, Thiếu Đế) với chiến công hiển hách 3 lần đại phá quân Nguyên - Mông (1258, 1285, 1288) và sự ra đời của Thiền phái Trúc Lâm Yên Tử.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000204',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Nhà Hồ, Nhà Hậu Trần & Thời kỳ Bắc thuộc lần IV (1400 - 1428)',
    slug: 'nha-ho-nha-hau-tran-va-bac-thuoc-lan-4-1400-1428',
    startYear: 1400,
    endYear: 1428,
    timeLabel: '1400 – 1428',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Nhà Hồ (1400 - 1407: Hồ Quý Ly, Hồ Hán Thương đặt quốc hiệu Đại Ngu), Nhà Hậu Trần (1407 - 1413: Giản Định Đế, Trùng Quang Đế) và Thời kỳ Bắc thuộc lần IV (1413 - 1428) khi quân Minh đô hộ tàn bạo trước khi bị Khởi nghĩa Lam Sơn của Lê Lợi đánh đuổi.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000205',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Nhà Hậu Lê - Giai đoạn Lê Sơ (1428 - 1527)',
    slug: 'nha-hau-le-le-so-1428-1527',
    startYear: 1428,
    endYear: 1527,
    timeLabel: '1428 – 1527',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Khởi đầu từ Lê Thái Tổ (Lê Lợi), trải qua Lê Thái Tông, Lê Nhân Tông và đạt đến đỉnh cao cực thịnh dưới triều vua Lê Thánh Tông (1460 - 1497), Lê Hiến Tông, Lê Túc Tông trước khi suy yếu thời Lê Uy Mục, Lê Tương Dực, Lê Chiêu Tông và Lê Cung Hoàng.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000206',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Thời kỳ Chia cắt: Bắc Triều - Nam Triều (1527 - 1592)',
    slug: 'thoi-ky-bac-trieu-nam-trieu-1527-1592',
    startYear: 1527,
    endYear: 1592,
    timeLabel: '1527 – 1592',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Cục diện phân tranh giữa Bắc Triều Nhà Mạc (Mạc Đăng Dung, Mạc Đăng Doanh, Mạc Phúc Hải, Mạc Phúc Nguyên, Mạc Mậu Hợp, Mạc Toàn) và Nam Triều Lê Trung Hưng do Nguyễn Kim, Trịnh Kiểm, Trịnh Tùng phò tá (Lê Trang Tông, Trung Tông, Anh Tông, Thế Tông).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000207',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Thời kỳ Trịnh - Nguyễn Phân tranh: Đàng Ngoài & Đàng Trong (1593 - 1778)',
    slug: 'thoi-ky-trinh-nguyen-phan-tranh-1593-1778',
    startYear: 1593,
    endYear: 1778,
    timeLabel: '1593 – 1778',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Đất nước chia làm Đàng Ngoài (Vua Lê Trung Hưng từ Lê Kính Tông đến Lê Mẫn Đế - Chúa Trịnh từ Trịnh Tùng đến Trịnh Bồng) và Đàng Trong (các Chúa Nguyễn từ Chúa Tiên Nguyễn Hoàng, Chúa Sãi Nguyễn Phúc Nguyên đến Chúa Định Nguyễn Phúc Thuần mở mang bờ cõi xuống tận đồng bằng sông Cửu Long).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000208',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Triều đại Nhà Tây Sơn (1778 - 1802)',
    slug: 'trieu-dai-nha-tay-son-1778-1802',
    startYear: 1778,
    endYear: 1802,
    timeLabel: '1778 – 1802',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Ba anh em Nguyễn Nhạc (Thái Đức Hoàng đế), Nguyễn Huệ (Quang Trung Hoàng đế) và Nguyễn Lữ xóa bỏ thế phân liệt Trịnh - Nguyễn, đại phá 5 vạn quân Xiêm tại Rạch Gầm - Xoài Mút (1785) và 29 vạn quân Thanh tại Ngọc Hồi - Đống Đa (1789), truyền đến thời Cảnh Thịnh (Nguyễn Quang Toản).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000209',
    parentSlug: 'thoi-ky-phong-kien-viet-nam-939-1883',
    name: 'Thời kỳ Thống nhất: Nhà Nguyễn Độc lập Tự chủ (1802 - 1883)',
    slug: 'thoi-ky-thong-nhat-nha-nguyen-doc-lap-1802-1883',
    startYear: 1802,
    endYear: 1883,
    timeLabel: '1802 – 1883',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Trải qua 4 đời hoàng đế độc lập: Gia Long (1802 - 1820, thống nhất đất nước từ Nam chí Bắc, đặt quốc hiệu Việt Nam), Minh Mạng (1820 - 1840, cải cách hành chính, đặt quốc hiệu Đại Nam rộng lớn), Thiệu Trị (1841 - 1847) và Tự Đức (1847 - 1883, đối mặt với cuộc xâm lược của Pháp từ năm 1858).',
  },

  // ============================================================================
  // III. LỊCH SỬ VIỆT NAM: 3. THỜI KỲ CẬN - HIỆN ĐẠI (1883 - NAY)
  // ============================================================================
  {
    id: 'a0000000-0000-4000-8000-000000000300',
    parentSlug: null,
    name: 'Thời kỳ Cận - Hiện đại Việt Nam (1883 - Nay)',
    slug: 'thoi-ky-hien-dai-viet-nam-1883-nay',
    startYear: 1883,
    endYear: 2026,
    timeLabel: '1883 – Nay',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Từ thời kỳ Pháp thuộc và các vua triều Nguyễn giai đoạn 1883 - 1945, đến thắng lợi của Cách mạng Tháng Tám khai sinh nước Việt Nam Dân chủ Cộng hòa, hai cuộc kháng chiến chống Pháp (1945 - 1954), chống Mỹ (1954 - 1975) và nước Cộng hòa Xã hội Chủ nghĩa Việt Nam (1976 - nay).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000301',
    parentSlug: 'thoi-ky-hien-dai-viet-nam-1883-nay',
    name: 'Nhà Nguyễn Thời kỳ Pháp thuộc & Phong trào Giải phóng Dân tộc (1883 - 1945)',
    slug: 'nha-nguyen-thoi-ky-phap-thuoc-1883-1945',
    startYear: 1883,
    endYear: 1945,
    timeLabel: '1883 – 1945',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Giai đoạn các vua Dục Đức, Hiệp Hòa, Kiến Phúc, Hàm Nghi (chiếu Cần Vương), Đồng Khánh, Thành Thái, Duy Tân, Khải Định, Bảo Đại; song hành cùng các phong trào yêu nước và hành trình Nguyễn Ái Quốc thành lập Đảng Cộng sản Việt Nam (1930) lãnh đạo Cách mạng Tháng Tám (1945).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000302',
    parentSlug: 'thoi-ky-hien-dai-viet-nam-1883-nay',
    name: 'Việt Nam Dân chủ Cộng hòa & Kháng chiến chống Pháp (1945 - 1954)',
    slug: 'viet-nam-dan-chu-cong-hoa-khang-chien-chong-phap-1945-1954',
    startYear: 1945,
    endYear: 1954,
    timeLabel: '1945 – 1954',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Ngày 02/09/1945 Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình. Toàn dân tộc bước vào 9 năm kháng chiến chống thực dân Pháp (Hà Nội 1946, Việt Bắc 1947, Biên giới 1950) và kết thúc bằng Chiến thắng Điện Biên Phủ (07/05/1954) cùng Hiệp định Giơnevơ.',
  },
  {
    // Giữ nguyên ID & Slug gốc của seed.ts để tương thích 100% với các bài học sẵn có
    id: 'a0000000-0000-4000-8000-000000000001',
    parentSlug: 'thoi-ky-hien-dai-viet-nam-1883-nay',
    name: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)',
    slug: 'khang-chien-chong-my-cuu-nuoc-1954-1975',
    startYear: 1954,
    endYear: 1975,
    timeLabel: '(1954 - 1975)',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Toàn quốc',
    description:
      'Giai đoạn lịch sử oanh liệt của dân tộc Việt Nam: thực hiện đồng thời hai nhiệm vụ chiến lược - xây dựng chủ nghĩa xã hội ở miền Bắc làm hậu phương lớn vững chắc và tiến hành cách mạng dân tộc dân chủ nhân dân ở miền Nam, kiên cường đánh bại các chiến lược chiến tranh của đế quốc Mỹ, đỉnh cao là Đại thắng mùa Xuân 1975, thu non sông về một mối.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000303',
    parentSlug: 'thoi-ky-hien-dai-viet-nam-1883-nay',
    name: 'Cộng hòa Xã hội Chủ nghĩa Việt Nam & Thời kỳ Đổi mới (1976 - Nay)',
    slug: 'cong-hoa-xa-hoi-chu-nghia-viet-nam-1976-nay',
    startYear: 1976,
    endYear: 2026,
    timeLabel: '1976 – Nay',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Việt Nam',
    description:
      'Năm 1976 hoàn thành thống nhất đất nước về mặt nhà nước với tên nước Cộng hòa Xã hội Chủ nghĩa Việt Nam, thủ đô Hà Nội, Sài Gòn đổi tên thành TP. Hồ Chí Minh; bảo vệ biên giới Tổ quốc, tiến hành công cuộc Đổi mới (1986) và hội nhập quốc tế sâu rộng.',
  },

  // ============================================================================
  // IV. LỊCH SỬ THẾ GIỚI: 3 THỜI KỲ TRỌNG TÂM (TRUNG ĐẠI, CẬN ĐẠI, HIỆN ĐẠI)
  // ============================================================================
  {
    id: 'a0000000-0000-4000-8000-000000000400',
    parentSlug: null,
    name: 'Lịch sử Thế giới: Thời kỳ Trung đại (476 - 1492)',
    slug: 'thoi-ky-trung-dai-the-gioi',
    startYear: 476,
    endYear: 1492,
    timeLabel: '476 – 1492',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Thế giới',
    description:
      'Thời kỳ hình thành và phát triển của chế độ phong kiến ở Châu Âu và Châu Á: các vương triều Đường - Tống - Nguyên - Minh, Đế quốc Byzantine, Thời đại Hoàng kim Hồi giáo, các cuộc Thập tự chinh, Đế quốc Mông Cổ, Văn hóa Phục Hưng và các cuộc Đại phát kiến địa lý.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000401',
    parentSlug: 'thoi-ky-trung-dai-the-gioi',
    name: 'Phong kiến Phương Đông: Đường - Tống - Mông Nguyên - Minh & Đông Nam Á (581 - 1500)',
    slug: 'trung-dai-phuong-dong-duong-tong-nguyen-minh',
    startYear: 581,
    endYear: 1500,
    timeLabel: '581 – 1500',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Châu Á',
    description:
      'Sự thịnh trị của nhà Đường, Tứ đại phát minh thời Tống, các cuộc chinh phạt Á - Âu của Đế quốc Mông Cổ (Thành Cát Tư Hãn, Hốt Tất Liệt), hải trình Trịnh Hòa thời Minh và kỷ nguyên Angkor - Majapahit tại Đông Nam Á.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000402',
    parentSlug: 'thoi-ky-trung-dai-the-gioi',
    name: 'Châu Âu Trung đại, Thập tự chinh, Văn hóa Phục Hưng & Phát kiến Địa lý (476 - 1492)',
    slug: 'trung-dai-chau-au-thap-tu-chinh-va-phuc-hung',
    startYear: 476,
    endYear: 1492,
    timeLabel: '476 – 1492',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Châu Âu & Địa Trung Hải',
    description:
      'Đế quốc Byzantine, Charlemagne, Đại hiến chương Magna Carta (1215), Chiến tranh Trăm Năm, sự sụp đổ của Constantinople (1453), phong trào Văn hóa Phục Hưng và các chuyến hải trình tìm ra châu Mỹ của Columbus (1492).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000500',
    parentSlug: null,
    name: 'Lịch sử Thế giới: Thời kỳ Cận đại (1500 - 1914)',
    slug: 'thoi-ky-can-dai-the-gioi',
    startYear: 1500,
    endYear: 1914,
    timeLabel: '1500 – 1914',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Thế giới',
    description:
      'Thời đại của các cuộc Cách mạng Tư sản (Anh, Mỹ, Pháp), Thời kỳ Khai sáng, những cuộc Chiến tranh của Napoleon, Cách mạng Công nghiệp lần thứ nhất và thứ hai, Nội chiến Hoa Kỳ, Minh Trị Duy Tân và sự hình thành các đế quốc thực dân.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000501',
    parentSlug: 'thoi-ky-can-dai-the-gioi',
    name: 'Cách mạng Tư sản Âu - Mỹ & Thời đại Napoleon (1640 - 1815)',
    slug: 'can-dai-cach-mang-tu-san-va-napoleon',
    startYear: 1640,
    endYear: 1815,
    timeLabel: '1640 – 1815',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Châu Âu & Bắc Mỹ',
    description:
      'Cách mạng Tư sản Anh, Chiến tranh Giành độc lập Hoa Kỳ (Tuyên ngôn Độc lập 1776), Đại Cách mạng Pháp (1789) và các chiến dịch quân sự của Hoàng đế Napoleon Bonaparte cho đến Hội nghị Viên (1815).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000502',
    parentSlug: 'thoi-ky-can-dai-the-gioi',
    name: 'Cách mạng Công nghiệp, Nội chiến Mỹ & Minh Trị Duy Tân Châu Á (1815 - 1914)',
    slug: 'can-dai-cach-mang-cong-nghiep-va-minh-tri-duy-tan',
    startYear: 1815,
    endYear: 1914,
    timeLabel: '1815 – 1914',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Thế giới',
    description:
      'Bùng nổ máy hơi nước, đường sắt, điện năng; Nội chiến Hoa Kỳ (1861 - 1865); thống nhất Đức và Ý; Công xã Paris (1871); công cuộc Minh Trị Duy Tân tại Nhật Bản (1868) và Cách mạng Tân Hợi tại Trung Quốc (1911).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000600',
    parentSlug: null,
    name: 'Lịch sử Thế giới: Thời kỳ Hiện đại (1914 - Nay)',
    slug: 'thoi-ky-hien-dai-the-gioi',
    startYear: 1914,
    endYear: 2026,
    timeLabel: '1914 – Nay',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Thế giới',
    description:
      'Thế kỷ XX và đầu thế kỷ XXI với hai cuộc Chiến tranh Thế giới thứ nhất (1914 - 1918) và thứ hai (1939 - 1945), Cách mạng Tháng Mười Nga (1917), Chiến tranh Lạnh (1947 - 1991), kỷ nguyên chinh phục vũ trụ và toàn cầu hóa.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000601',
    parentSlug: 'thoi-ky-hien-dai-the-gioi',
    name: 'Chiến tranh Thế giới thứ nhất, Cách mạng Tháng Mười & Chiến tranh Thế giới thứ hai (1914 - 1945)',
    slug: 'hien-dai-hai-cuoc-chien-tranh-the-gioi-1914-1945',
    startYear: 1914,
    endYear: 1945,
    timeLabel: '1914 – 1945',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Thế giới',
    description:
      'Đại chiến Thế giới lần thứ nhất, Cách mạng Tháng Mười Nga (1917), Đại suy thoái kinh tế 1929 - 1933 và cuộc Chiến tranh Thế giới thứ hai chống chủ nghĩa phát xít (Stalingrad, Normandy, Berlin, kết thúc năm 1945).',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000602',
    parentSlug: 'thoi-ky-hien-dai-the-gioi',
    name: 'Chiến tranh Lạnh, Kỷ nguyên Vũ trụ & Thế giới Đa cực Hiện đại (1945 - Nay)',
    slug: 'hien-dai-chien-tranh-lanh-va-the-gioi-da-cuc-1945-nay',
    startYear: 1945,
    endYear: 2026,
    timeLabel: '1945 – Nay',
    datePrecision: DatePrecision.EXACT_YEAR,
    region: 'Thế giới',
    description:
      'Sự ra đời của Liên Hợp Quốc, trật tự hai cực Ianta, phong trào phi thực dân hóa Á - Phi - Mỹ Latinh, cuộc chạy đua vũ trụ (Vostok 1, Apollo 11), sự sụp đổ Bức tường Berlin (1989) và trật tự thế giới đa cực thế kỷ XXI.',
  },
];

export class PeriodCatalogBuilder {
  public static buildCatalog(): IPeriodSeedRecord[] {
    return RAW_PERIODS.map((p, index) => ({
      id: p.id,
      parentSlug: p.parentSlug ?? null,
      name: p.name,
      slug: p.slug || toSlug(p.name),
      startYear: p.startYear,
      endYear: p.endYear,
      timeLabel: p.timeLabel,
      datePrecision: p.datePrecision ?? DatePrecision.EXACT_YEAR,
      region: p.region,
      description: p.description,
      coverImageUrl: p.coverImageUrl,
      displayOrder: index + 1,
      status: ContentStatus.PUBLISHED,
    }));
  }

  /**
   * Tự động định tuyến Period phù hợp cho Thực thể hoặc Sự kiện dựa theo năm và khu vực
   * Khớp chính xác 100% với phân kỳ Lịch sử Việt Nam và 3 thời kỳ Lịch sử Thế giới
   */
  public static resolvePeriodSlug(year: number | null | undefined, isVietnam: boolean): string {
    const y = year ?? 1900;
    if (isVietnam) {
      if (y <= -208) return 'thoi-hong-bang-xich-quy-van-lang-au-lac';
      if (y <= 39) return 'thoi-ky-bac-thuoc-lan-1-208-tcn-39';
      if (y <= 43) return 'giai-doan-trung-nu-vuong-40-43';
      if (y <= 543) return 'thoi-ky-bac-thuoc-lan-2-43-543';
      if (y <= 602) return 'thoi-ky-nha-tien-ly-544-602';
      if (y <= 904) return 'thoi-ky-bac-thuoc-lan-3-602-905';
      if (y <= 938) return 'thoi-ky-tu-chu-905-938';
      if (y <= 1009) return 'nha-ngo-nha-dinh-nha-tien-le-939-1009';
      if (y <= 1225) return 'trieu-dai-nha-ly-1009-1225';
      if (y <= 1399) return 'trieu-dai-nha-tran-1225-1400';
      if (y <= 1427) return 'nha-ho-nha-hau-tran-va-bac-thuoc-lan-4-1400-1428';
      if (y <= 1526) return 'nha-hau-le-le-so-1428-1527';
      if (y <= 1592) return 'thoi-ky-bac-trieu-nam-trieu-1527-1592';
      if (y <= 1777) return 'thoi-ky-trinh-nguyen-phan-tranh-1593-1778';
      if (y <= 1801) return 'trieu-dai-nha-tay-son-1778-1802';
      if (y <= 1882) return 'thoi-ky-thong-nhat-nha-nguyen-doc-lap-1802-1883';
      if (y <= 1945) return 'nha-nguyen-thoi-ky-phap-thuoc-1883-1945';
      if (y <= 1954) return 'viet-nam-dan-chu-cong-hoa-khang-chien-chong-phap-1945-1954';
      if (y <= 1975) return 'khang-chien-chong-my-cuu-nuoc-1954-1975';
      return 'cong-hoa-xa-hoi-chu-nghia-viet-nam-1976-nay';
    }

    // Lịch sử Thế giới: Trung đại -> Cận đại -> Hiện đại
    if (y <= 1492) {
      return 'trung-dai-chau-au-thap-tu-chinh-va-phuc-hung';
    }
    if (y <= 1815) {
      return 'can-dai-cach-mang-tu-san-va-napoleon';
    }
    if (y <= 1913) {
      return 'can-dai-cach-mang-cong-nghiep-va-minh-tri-duy-tan';
    }
    if (y <= 1945) {
      return 'hien-dai-hai-cuoc-chien-tranh-the-gioi-1914-1945';
    }
    return 'hien-dai-chien-tranh-lanh-va-the-gioi-da-cuc-1945-nay';
  }
}
