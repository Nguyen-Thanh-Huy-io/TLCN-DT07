import { ContentStatus, EventCategory } from '@prisma/client';
import { IEventSeedRecord } from '../interfaces/ingestion.interface';

/**
 * Batch 01 — Sự kiện lịch sử cho ĐÚNG 1 giai đoạn duy nhất
 * (thoi-hong-bang-xich-quy-van-lang-au-lac), dùng để chạy thử trọn vẹn
 * pipeline (Entity → Event → Relations) trước khi mở rộng ra các giai đoạn
 * khác. Số lượng cố tình giữ ít (6 sự kiện) để kiểm chứng chất lượng dễ hơn.
 *
 * Batch 02 (nối tiếp, không tách mảng mới): migrate 16 Event của giai đoạn
 * "Kháng chiến chống Mỹ, cứu nước (1954-1975)" từ seed.ts cũ — sửa category
 * (trước đây TOÀN BỘ bị để mặc định OTHER), chuyển sourceReferenceNote lẻ
 * sang metadata.sources (mảng), bổ sung nguồn cho 3 sự kiện con trước đây
 * thiếu hẳn (tái dùng nguồn của sự kiện cha cùng chiến dịch), và publish nốt
 * 1 sự kiện còn ở trạng thái DRAFT nay đã có nguồn đầy đủ.
 */
const RAW_EVENTS: IEventSeedRecord[] = [
  {
    slug: 'hung-vuong-dung-nuoc-van-lang',
    periodSlug: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
    locationSlug: null,
    parentSlug: null,
    title: 'Hùng Vương dựng nước Văn Lang',
    startYear: -2879,
    startMonth: null,
    startDay: null,
    endYear: -258,
    eventDateNote: 'Theo truyền thuyết và thư tịch cổ (Đại Việt sử ký toàn thư), niên đại cụ thể không được khảo cổ học xác nhận.',
    summary: 'Theo truyền thuyết, các vua Hùng nối đời dựng và cai quản nước Văn Lang tại vùng Phong Châu.',
    description:
      'Nước Văn Lang được truyền thống sử Việt ghi là nhà nước đầu tiên của người Việt, do 18 đời vua Hùng nối tiếp cai quản. Đây là mốc khởi nguồn mang tính biểu tượng cho ý thức dân tộc, nhưng số đời vua và niên đại cụ thể chưa có bằng chứng khảo cổ học đương thời xác nhận đầy đủ.',
    thumbnailUrl: '/assets/events/hung-vuong-dung-nuoc-van-lang.jpg',
    displayOrder: 1,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause: 'Nhu cầu liên kết các bộ lạc Lạc Việt để trị thủy, canh tác nông nghiệp lúa nước và phòng vệ.',
      outcome: 'Hình thành nhà nước sơ khai đầu tiên của người Việt, đặt nền móng cho ý thức cộng đồng dân tộc.',
      sources: ['https://vi.wikipedia.org/wiki/V%C4%83n_Lang'],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'su-tich-boc-tram-trung',
    periodSlug: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
    locationSlug: null,
    parentSlug: null,
    title: 'Sự tích "bọc trăm trứng" — nguồn gốc Lạc Long Quân và Âu Cơ',
    startYear: -2879,
    startMonth: null,
    startDay: null,
    endYear: null,
    eventDateNote: 'Truyền thuyết, không có niên đại lịch sử xác thực.',
    summary: 'Truyền thuyết về việc Âu Cơ sinh bọc trăm trứng, nửa theo cha xuống biển, nửa theo mẹ lên núi.',
    description:
      'Theo truyền thuyết, Lạc Long Quân (nòi rồng) kết duyên cùng Âu Cơ (dòng tiên) sinh ra bọc trăm trứng, nở thành trăm người con — tổ tiên của các dân tộc Việt. Câu chuyện thể hiện quan niệm về nguồn gốc chung "đồng bào" của cộng đồng người Việt, không phải sự kiện lịch sử có thể kiểm chứng.',
    thumbnailUrl: null,
    displayOrder: 2,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause: null,
      outcome: 'Hình thành quan niệm "con Rồng cháu Tiên" và ý thức cội nguồn chung của dân tộc Việt.',
      sources: ['https://vi.wikipedia.org/wiki/L%E1%BA%A1c_Long_Qu%C3%A2n'],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'thuc-phan-lap-nuoc-au-lac',
    periodSlug: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
    locationSlug: 'thanh-co-loa',
    parentSlug: null,
    title: 'Thục Phán hợp nhất Âu Việt – Lạc Việt, lập nước Âu Lạc',
    startYear: -257,
    startMonth: null,
    startDay: null,
    endYear: -208,
    eventDateNote: 'Khoảng năm 257 TCN theo truyền thống sử Việt.',
    summary: 'Thục Phán đánh bại vua Hùng thứ 18, hợp nhất bộ tộc Âu Việt và Lạc Việt, lập nên nước Âu Lạc.',
    description:
      'Thục Phán, thủ lĩnh bộ tộc Âu Việt, sau khi hợp nhất với Lạc Việt đã xưng vương, lấy hiệu An Dương Vương, đặt quốc hiệu Âu Lạc. Đây là bước chuyển tiếp từ nhà nước Văn Lang sang một tổ chức chính trị mới, rộng lớn hơn về lãnh thổ.',
    thumbnailUrl: null,
    displayOrder: 3,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause: 'Xung đột và sau đó hợp nhất giữa hai khối bộ tộc Âu Việt (miền núi phía Bắc) và Lạc Việt (vua Hùng).',
      outcome: 'Ra đời nhà nước Âu Lạc, đóng đô tại Cổ Loa, mở rộng lãnh thổ so với Văn Lang.',
      sources: ['https://vi.wikipedia.org/wiki/An_D%C6%B0%C6%A1ng_V%C6%B0%C6%A1ng'],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'xay-dung-thanh-co-loa',
    periodSlug: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
    locationSlug: 'thanh-co-loa',
    parentSlug: null,
    title: 'Xây dựng thành Cổ Loa làm kinh đô Âu Lạc',
    startYear: -257,
    startMonth: null,
    startDay: null,
    endYear: -208,
    eventDateNote: 'Khoảng thế kỷ III TCN.',
    summary: 'An Dương Vương cho xây dựng thành Cổ Loa — toà thành đất hình xoáy ốc làm kinh đô Âu Lạc.',
    description:
      'Thành Cổ Loa được xây dựng với kết cấu nhiều vòng thành đất đồng tâm, thể hiện trình độ kỹ thuật quân sự và tổ chức lao động của cư dân Âu Lạc. Di chỉ khảo cổ tại Đông Anh (Hà Nội) ngày nay vẫn còn dấu tích các vòng thành này.',
    thumbnailUrl: null,
    displayOrder: 4,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause: 'Nhu cầu phòng thủ quân sự và khẳng định vị thế trung tâm chính trị của nhà nước Âu Lạc.',
      outcome: 'Hình thành kinh đô kiên cố, hiện là di tích khảo cổ quan trọng về kỹ thuật xây thành cổ của người Việt.',
      sources: ['https://vi.wikipedia.org/wiki/C%E1%BB%95_Loa'],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'truyen-thuyet-no-than-va-mat-nuoc-au-lac',
    periodSlug: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
    locationSlug: 'thanh-co-loa',
    parentSlug: null,
    title: 'Truyền thuyết nỏ thần và việc mất nước Âu Lạc',
    startYear: -208,
    startMonth: null,
    startDay: null,
    endYear: null,
    eventDateNote: 'Khoảng năm 208 TCN. Diễn biến cụ thể (nỏ thần, Mỵ Châu – Trọng Thủy) thuộc truyền thuyết, không phải sử liệu xác thực.',
    summary: 'Theo truyền thuyết, Triệu Đà đánh chiếm Âu Lạc sau khi bí mật nỏ thần của An Dương Vương bị lộ.',
    description:
      'Sử sách và truyền thuyết dân gian ghi lại việc Triệu Đà tấn công Âu Lạc; câu chuyện nỏ thần, Mỵ Châu lén cho Trọng Thủy xem bí mật quân sự là mô-típ truyền thuyết giải thích nguyên nhân thất bại. Về mặt lịch sử, đây là mốc Âu Lạc bị sáp nhập, mở đầu thời kỳ Bắc thuộc.',
    thumbnailUrl: null,
    displayOrder: 5,
    category: EventCategory.WAR,
    metadata: {
      cause: 'Theo truyền thuyết: bí mật nỏ thần bị lộ qua Mỵ Châu – Trọng Thủy. Về sử học: tương quan lực lượng quân sự giữa Nam Việt và Âu Lạc.',
      outcome: 'Âu Lạc sáp nhập vào Nam Việt của Triệu Đà, mở đầu giai đoạn Bắc thuộc lần I.',
      sources: ['https://vi.wikipedia.org/wiki/An_D%C6%B0%C6%A1ng_V%C6%B0%C6%A1ng'],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'van-hoa-dong-son-phat-trien',
    periodSlug: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
    locationSlug: 'di-chi-dong-son',
    parentSlug: null,
    title: 'Văn hóa Đông Sơn phát triển rực rỡ (thời đại đồ đồng)',
    startYear: -700,
    startMonth: null,
    startDay: null,
    endYear: -100,
    eventDateNote: 'Khoảng thế kỷ VII TCN – thế kỷ I, xác định qua khảo cổ học.',
    summary: 'Văn hóa Đông Sơn với kỹ thuật đúc trống đồng tinh xảo phát triển rực rỡ tại miền Bắc Việt Nam.',
    description:
      'Văn hóa Đông Sơn, đặt tên theo di chỉ tại Thanh Hóa, là nền văn hóa khảo cổ tiêu biểu của thời đại kim khí ở Việt Nam, nổi bật với kỹ thuật đúc trống đồng (như trống đồng Ngọc Lũ) đạt trình độ cao, phản ánh đời sống kinh tế - xã hội và tín ngưỡng của cư dân Văn Lang - Âu Lạc.',
    thumbnailUrl: null,
    displayOrder: 6,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause: 'Sự phát triển của nghề luyện kim đồng thau và nông nghiệp lúa nước ổn định.',
      outcome: 'Để lại hệ thống hiện vật khảo cổ phong phú (trống đồng, công cụ lao động) minh chứng cho trình độ văn minh bản địa.',
      sources: ['https://vi.wikipedia.org/wiki/V%C4%83n_h%C3%B3a_%C4%90%C3%B4ng_S%C6%A1n'],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
  "slug": "mo-tuyen-duong-van-tai-chien-luoc-truong-son-duong-ho-chi-minh",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Mở tuyến đường vận tải chiến lược Trường Sơn - Đường Hồ Chí Minh",
  "startYear": 1959,
  "startMonth": null,
  "startDay": null,
  "endYear": 1975,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "19/05/1959",
  "summary": "Mở tuyến đường vận tải chiến lược Trường Sơn - Đường Hồ Chí Minh",
  "description": "Đoàn 559 được thành lập, mở đường mòn Hồ Chí Minh trên bộ soi đường chi viện sức người, vũ khí từ hậu phương miền Bắc cho tiền tuyến miền Nam.",
  "thumbnailUrl": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1000&q=80",
  "displayOrder": 1,
  "category": "WAR",
  "metadata": {
    "cause": "Cách mạng miền Nam chuyển sang thế tiến công sau Nghị quyết 15, đòi hỏi tuyến giao liên vận tải chiến lược xuyên Bắc - Nam để chi viện vũ khí, cán bộ và hậu cần.",
    "outcome": "Hình thành mạng lưới đường cơ giới hơn 20.000km xuyên Trường Sơn, vận chuyển hàng triệu tấn vũ khí và hàng triệu lượt bộ đội vào chiến trường miền Nam.",
    "sources": [
      "Lịch sử Đoàn 559 - Bộ đội Trường Sơn, NXB Quân đội Nhân dân"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "chien-thang-duong-14-phuoc-long",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Chiến thắng Đường 14 - Phước Long",
  "startYear": 1974,
  "startMonth": null,
  "startDay": null,
  "endYear": 1975,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "13/12/1974 - 06/01/1975",
  "summary": "Chiến thắng Đường 14 - Phước Long",
  "description": "Đòn trinh sát chiến lược giải phóng hoàn toàn một thị xã và một tỉnh đầu tiên ở miền Nam, tạo cơ sở thực tiễn để Bộ Chính trị quyết tâm giải phóng miền Nam.",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Thực hiện chủ trương mở chiến dịch tiến công tại Đông Nam Bộ nhằm mở rộng hành lang chiến lược và thăm dò phản ứng thực tế của Mỹ và quân đội Sài Gòn.",
    "outcome": "Giải phóng hoàn toàn tỉnh Phước Long, củng cố quyết tâm chiến lược của Bộ Chính trị giải phóng miền Nam ngay trong năm 1975.",
    "sources": [
      "Lịch sử Quân đoàn 4 - Binh đoàn Cửu Long"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "dot-pha-khau-buon-ma-thuot-khai-man-chien-dich-tay-nguyen",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Đột phá khẩu Buôn Ma Thuột - Khai màn Chiến dịch Tây Nguyên",
  "startYear": 1975,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "10/03/1975",
  "summary": "Đột phá khẩu Buôn Ma Thuột - Khai màn Chiến dịch Tây Nguyên",
  "description": "Đòn điểm huyệt chiến lược xuất sắc làm rung chuyển và tan rã toàn bộ Quân đoàn 2 ngụy, mở toang cánh cửa xuống đồng bằng duyên hải miền Trung.",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Bộ Chính trị và Quân ủy Trung ương chọn Tây Nguyên làm hướng tiến công chủ yếu trong năm 1975, lấy thị xã Buôn Ma Thuột làm mục tiêu đột phá mở màn.",
    "outcome": "Giải phóng hoàn toàn Tây Nguyên, tiêu diệt Quân đoàn 2 ngụy, chuyển cuộc kháng chiến từ tiến công chiến lược sang Tổng tiến công chiến lược trên toàn miền Nam.",
    "sources": [
      "Tổng hành dinh trong mùa Xuân toàn thắng - Đại tướng Võ Nguyên Giáp"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "cac-dot-tien-cong-tai-cac-do-thi-mien-nam",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": "cuoc-tong-tien-cong-va-noi-day-tet-mau-than-1968",
  "title": "Các đợt tiến công tại các đô thị miền Nam",
  "startYear": 1968,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "Đợt 1 (30/01 - 25/02/1968)",
  "summary": "Các đợt tiến công tại các đô thị miền Nam",
  "description": "Đồng loạt tiến công vào 4 trên 6 thành phố lớn, 37 trên 44 thị xã và hàng trăm quận lỵ.",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Mục tiêu giáng đòn bất ngờ làm sụp đổ hệ thống phòng thủ hậu cứ đô thị của địch.",
    "outcome": "Gây chấn động dư luận nước Mỹ, phá vỡ hoàn toàn thế trận bình định nông thôn và phòng thủ đô thị của quân đội Mỹ.",
    "sources": [
      "Tổng tiến công và nổi dậy Xuân Mậu Thân 1968, NXB Quân đội Nhân dân"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "tran-danh-diem-cao-543-va-bat-song-ban-chi-huy-lu-doan-du-3-dich",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": "chien-thang-chien-dich-duong-9-nam-lao",
  "title": "Trận đánh điểm cao 543 và bắt sống Ban chỉ huy Lữ đoàn dù 3 địch",
  "startYear": 1971,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "25/02/1971",
  "summary": "Trận đánh điểm cao 543 và bắt sống Ban chỉ huy Lữ đoàn dù 3 địch",
  "description": "Trung đoàn 102 (Đại đoàn 308) tiêu diệt cứ điểm then chốt trên điểm cao 543, bắt sống đại tá Nguyễn Văn Thọ.",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Đánh bẻ gãy cánh quân dù tinh nhuệ của quân lực Việt Nam Cộng hòa trong cuộc hành quân Lam Sơn 719.",
    "outcome": "Làm lung lay tinh thần toàn bộ cánh quân phía bắc của địch, tạo thế bao vây tiêu diệt căn cứ Bản Đông.",
    "sources": [
      "Chiến dịch phản công Đường 9 - Nam Lào 1971, Viện Lịch sử Quân sự"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "dai-thang-chien-dich-ho-chi-minh-giai-phong-hoan-toan-mien-nam",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": "dinh-doc-lap-hoi-truong-thong-nhat",
  "parentSlug": null,
  "title": "Đại thắng Chiến dịch Hồ Chí Minh - Giải phóng hoàn toàn miền Nam",
  "startYear": 1975,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "26/04 - 30/04/1975",
  "summary": "Đại thắng Chiến dịch Hồ Chí Minh - Giải phóng hoàn toàn miền Nam",
  "description": "11 giờ 30 phút ngày 30/4/1975, xe tăng 390 húc đổ cổng chính Dinh Độc Lập. Lá cờ Mặt trận Dân tộc Giải phóng tung bay trên nóc dinh, non sông thu về một mối.",
  "thumbnailUrl": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1000&q=80",
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Thời cơ tổng công kích vào sào huyệt cuối cùng của địch tại Sài Gòn - Gia Định đã chín muồi với phương châm \"Thần tốc, táo bạo, bất ngờ, chắc thắng\".",
    "outcome": "Giải phóng hoàn toàn miền Nam, thống nhất đất nước, kết thúc thắng lợi 21 năm kháng chiến chống Mỹ cứu nước và 30 năm chiến tranh giải phóng dân tộc.",
    "sources": [
      "Đại thắng mùa Xuân 1975 - Đại tướng Văn Tiến Dũng, NXB Quân đội Nhân dân"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "chien-thang-ap-bac-chan-dong",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Chiến thắng Ấp Bắc chấn động",
  "startYear": 1963,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "02/01/1963",
  "summary": "Chiến thắng Ấp Bắc chấn động",
  "description": "Lực lượng vũ trang cách mạng miền Nam bẻ gãy chiến thuật trực thăng vận và thiết xa vận của Mỹ, mở ra phong trào thi đua \"Ấp Bắc giết giặc lập công\".",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Mỹ - ngụy huy động hơn 2.000 quân tinh nhuệ cùng máy bay trực thăng và xe thiết giáp M-113 mở cuộc càn quét lớn vào vùng giải phóng Ấp Bắc (Mỹ Tho).",
    "outcome": "Bắn rơi 5 máy bay trực thăng, phá hủy 3 xe thiết giáp M-113, đánh dấu sự phá sản bước đầu của các chiến thuật tân kỳ trong \"Chiến tranh đặc biệt\".",
    "sources": [
      "Lịch sử kháng chiến chống Mỹ, cứu nước 1954 - 1975, Tập III"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "chien-thang-dien-bien-phu-tren-khong-12-ngay-dem-ha-noi",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": "hoang-thanh-thang-long-ham-chi-huy-tac-chien-t1",
  "parentSlug": null,
  "title": "Chiến thắng \"Điện Biên Phủ trên không\" 12 ngày đêm Hà Nội",
  "startYear": 1972,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "18/12 - 30/12/1972",
  "summary": "Chiến thắng \"Điện Biên Phủ trên không\" 12 ngày đêm Hà Nội",
  "description": "Quân dân miền Bắc bắn rơi 34 pháo đài bay B-52, đập tan cuộc tập kích đường không chiến lược Linebacker II của đế quốc Mỹ.",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Tổng thống Mỹ Nixon mở chiến dịch tập kích đường không chiến lược Linebacker II bằng siêu pháo đài bay B-52 hòng khuất phục Hà Nội và ép ta ký Hiệp định Paris theo điều khoản của Mỹ.",
    "outcome": "Bắn rơi 81 máy bay Mỹ (có 34 chiếc B-52), buộc chính quyền Nixon tuyên bố ngừng ném bom từ vĩ tuyến 20 trở ra và ký Hiệp định Paris nguyên vẹn.",
    "sources": [
      "Lịch sử Quân chủng Phòng không - Không quân Việt Nam"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "chien-thang-van-tuong-tran-dung-dau-lich-su-voi-quan-vien-chinh-my",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Chiến thắng Vạn Tường - Trận đụng đầu lịch sử với quân viễn chinh Mỹ",
  "startYear": 1965,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "18/08/1965",
  "summary": "Chiến thắng Vạn Tường - Trận đụng đầu lịch sử với quân viễn chinh Mỹ",
  "description": "Trận đánh phủ đầu lính thủy đánh bộ Mỹ, chứng minh quân dân miền Nam có đầy đủ khả năng đánh thắng trực diện quân viễn chinh Mỹ.",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Quân viễn chinh Mỹ mở cuộc hành quân \"Ánh sáng sao\" (Starlite) nhằm tiêu diệt Trung đoàn 1 Chủ lực Quân khu 5 tại thôn Vạn Tường.",
    "outcome": "Loại khỏi vòng chiến đấu khoảng 900 lính Mỹ, bắn cháy 22 xe tăng và xe bọc thép, mở đầu cao trào \"Tìm Mỹ mà đánh, lùng ngụy mà diệt\".",
    "sources": [
      "Lịch sử Quân khu 5 trong kháng chiến chống Mỹ"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "cuoc-tong-tien-cong-va-noi-day-tet-mau-than-1968",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968",
  "startYear": 1968,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "30/01/1968",
  "summary": "Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968",
  "description": "Đòn tập kích bất ngờ vào Tòa Đại sứ Mỹ, Dinh Độc Lập, Bộ Tổng tham mưu ngụy, làm lung lay ý chí xâm lược của chính giới Washington.",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Nhằm giáng một đòn quyết định làm chuyển biến cục diện chiến tranh, buộc Mỹ phải xuống thang chiến tranh và ngồi vào bàn đàm phán.",
    "outcome": "Làm phá sản chiến lược \"Chiến tranh cục bộ\", buộc Tổng thống Johnson phải tuyên bố ngừng ném bom miền Bắc và chấp nhận đàm phán tại Hội nghị Paris.",
    "sources": [
      "Tổng tiến công và nổi dậy Xuân Mậu Thân 1968, NXB Quân đội Nhân dân"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "chien-thang-chien-dich-duong-9-nam-lao",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Chiến thắng chiến dịch Đường 9 - Nam Lào",
  "startYear": 1971,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "30/01 - 23/03/1971",
  "summary": "Chiến thắng chiến dịch Đường 9 - Nam Lào",
  "description": "Đập tan cuộc hành quân Lam Sơn 719 của địch, bảo vệ vững chắc tuyến hành lang vận chuyển chiến lược Bắc - Nam.",
  "thumbnailUrl": null,
  "displayOrder": 1,
  "category": "BATTLE",
  "metadata": {
    "cause": "Mỹ - ngụy mở cuộc hành quân quy mô lớn \"Lam Sơn 719\" nhằm cắt đứt tuyến đường chi viện Trường Sơn tại khu vực Đường 9 - Nam Lào.",
    "outcome": "Tiêu diệt phần lớn lực lượng tinh nhuệ của Quân đội Sài Gòn, giáng đòn nặng nề vào công thức \"Quân đội Sài Gòn + Hỏa lực Mỹ\" của học thuyết Việt Nam hóa chiến tranh.",
    "sources": [
      "Chiến dịch phản công Đường 9 - Nam Lào 1971, Viện Lịch sử Quân sự"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "giai-phong-co-do-hue-va-thanh-pho-da-nang",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Giải phóng Cố đô Huế và thành phố Đà Nẵng",
  "startYear": 1975,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "26/03 - 29/03/1975",
  "summary": "Giải phóng Cố đô Huế và thành phố Đà Nẵng",
  "description": "Tiêu diệt và làm tan rã toàn bộ lực lượng Quân đoàn 1 ngụy, giải phóng hoàn toàn dải đất miền Trung, tạo thời cơ \"thần tốc\" tiến về Sài Gòn.",
  "thumbnailUrl": null,
  "displayOrder": 2,
  "category": "BATTLE",
  "metadata": {
    "cause": "Nắm vững thời cơ chiến lược sau thắng lợi Tây Nguyên, Quân giải phóng thần tốc bao vây cô lập và tiến công giải phóng Trị - Thiên - Huế và căn cứ liên hợp Đà Nẵng.",
    "outcome": "Đập tan hoàn toàn ý đồ co cụm chiến lược của địch ở miền Trung, tạo bàn đạp trực tiếp cho 5 cánh quân tiến vào Chiến dịch Hồ Chí Minh.",
    "sources": [
      "Đại thắng mùa Xuân 1975 - Văn Tiến Dũng"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "phong-trao-dong-khoi-ben-tre-bung-no",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": "khu-di-tich-dong-khoi-ben-tre",
  "parentSlug": null,
  "title": "Phong trào Đồng Khởi Bến Tre bùng nổ",
  "startYear": 1959,
  "startMonth": null,
  "startDay": null,
  "endYear": 1960,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "17/01/1960",
  "summary": "Phong trào Đồng Khởi Bến Tre bùng nổ",
  "description": "Dưới sự lãnh đạo của Nữ tướng Nguyễn Thị Định và Tỉnh ủy Bến Tre, nhân dân huyện Mỏ Cày đồng loạt nổi dậy, mở đầu cao trào Đồng Khởi khắp miền Nam.",
  "thumbnailUrl": "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80",
  "displayOrder": 2,
  "category": "REVOLUTION",
  "metadata": {
    "cause": "Chính quyền Ngô Đình Diệm thi hành chính sách \"Tố cộng, diệt cộng\" tàn bạo với Luật 10/59; Nghị quyết Trung ương 15 (1959) soi đường cho quần chúng nổi dậy.",
    "outcome": "Phá vỡ từng mảng lớn bộ máy cai trị cơ sở của địch ở nông thôn, chuyển cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công, dẫn tới sự ra đời của Mặt trận Dân tộc Giải phóng miền Nam Việt Nam.",
    "sources": [
      "Sách giáo khoa Lịch sử 12, NXB Giáo dục Việt Nam, tr. 140 - 144"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "dien-bien-tac-chien-tai-sai-gon-gia-dinh",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": "cuoc-tong-tien-cong-va-noi-day-tet-mau-than-1968",
  "title": "Diễn biến tác chiến tại Sài Gòn - Gia Định",
  "startYear": 1968,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "Đêm 30 rạng sáng 31/01/1968",
  "summary": "Diễn biến tác chiến tại Sài Gòn - Gia Định",
  "description": "Các đội Biệt động Sài Gòn tập kích Tòa Đại sứ Mỹ, Dinh Độc Lập, Bộ Tổng tham mưu quân đội Sài Gòn và Đài Phát thanh.",
  "thumbnailUrl": null,
  "displayOrder": 2,
  "category": "BATTLE",
  "metadata": {
    "cause": "Đánh thẳng vào cơ quan đầu não chỉ huy chiến tranh của đối phương giữa trung tâm Sài Gòn.",
    "outcome": "Tạo hiệu ứng truyền thông toàn cầu, phơi bày sự bất lực của chính quyền Sài Gòn và quân đội Mỹ ngay tại trung tâm thủ phủ.",
    "sources": [
      "Tổng tiến công và nổi dậy Xuân Mậu Thân 1968, NXB Quân đội Nhân dân"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "ky-ket-hiep-dinh-paris-ve-cham-dut-chien-tranh-tai-viet-nam",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Ký kết Hiệp định Paris về chấm dứt chiến tranh tại Việt Nam",
  "startYear": 1973,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "27/01/1973",
  "summary": "Ký kết Hiệp định Paris về chấm dứt chiến tranh tại Việt Nam",
  "description": "Mỹ buộc phải cam kết tôn trọng độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của nước Việt Nam, rút hết toàn bộ quân viễn chinh về nước.",
  "thumbnailUrl": null,
  "displayOrder": 2,
  "category": "TREATY",
  "metadata": {
    "cause": "Sau thất bại nặng nề trên cả hai miền Nam - Bắc, đặc biệt là trận Điện Biên Phủ trên không cuối năm 1972, đế quốc Mỹ không còn con đường nào khác ngoài giải pháp ngoại giao.",
    "outcome": "Hoàn thành mục tiêu chiến lược \"Đánh cho Mỹ cút\", tạo bước ngoặt quyết định về tương quan lực lượng để tiến lên \"Đánh cho ngụy nhào\" vào mùa Xuân 1975.",
    "sources": [
      "Mặt trận Ngoại giao Việt Nam trong kháng chiến chống Mỹ (1954 - 1975)"
    ]
  },
  "status": "PUBLISHED"
},
{
  "slug": "thanh-lap-mat-tran-dan-toc-giai-phong-mien-nam-viet-nam",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "locationSlug": null,
  "parentSlug": null,
  "title": "Thành lập Mặt trận Dân tộc Giải phóng miền Nam Việt Nam",
  "startYear": 1960,
  "startMonth": null,
  "startDay": null,
  "endYear": null,
  "endMonth": null,
  "endDay": null,
  "eventDateNote": "20/12/1960",
  "summary": "Thành lập Mặt trận Dân tộc Giải phóng miền Nam Việt Nam",
  "description": "Mặt trận Dân tộc Giải phóng miền Nam Việt Nam ra đời nhằm đoàn kết toàn dân đánh đổ ách thống trị của đế quốc Mỹ và chính quyền tay sai Ngô Đình Diệm.",
  "thumbnailUrl": null,
  "displayOrder": 3,
  "category": "POLITICAL_EVENT",
  "metadata": {
    "cause": "Thắng lợi vang dội của cao trào Đồng Khởi (1959 - 1960) đặt ra yêu cầu bức thiết phải có một tổ chức chính trị công khai quy tụ mọi tầng lớp yêu nước tại miền Nam.",
    "outcome": "Tập hợp đông đảo các giai cấp, dân tộc, tôn giáo dưới ngọn cờ độc lập, dân chủ, hòa bình, trung lập, tiến tới hòa bình thống nhất Tổ quốc.",
    "sources": [
      "Văn kiện Đảng Toàn tập, Tập 21, NXB Chính trị Quốc gia"
    ]
  },
  "status": "PUBLISHED"
}
];

export class EventCatalogBuilder {
  public static buildCatalog(): IEventSeedRecord[] {
    return RAW_EVENTS;
  }
}
