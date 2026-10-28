import {
  ContentStatus,
  EventCategory,
  EventRelationType,
  FigureRole,
  HistoricalEntityType,
  VerificationStatus,
} from '@prisma/client';
import {
  ENTITY_RELATION_CODES,
  EVENT_ENTITY_ROLES,
  HISTORICAL_REGIONS,
  HISTORICAL_SITE_TYPES,
  PERIOD_SLUGS,
} from '../constants/ingestion.constants';
import {
  ICatalogDatasetProvider,
  IEntityGraphRelationSeed,
  IEntitySeedRecord,
  IEventCausalRelationSeed,
  IEventEntityRelationSeed,
  IEventSeedRecord,
  IRelationsSeedDataset,
} from '../interfaces/ingestion.interface';
import { IFigureProfileSeed } from './figure-profiles.catalog';

const wiki = (title: string): string =>
  encodeURI(`https://vi.wikipedia.org/wiki/${title}`);

const linkEventEntity = (
  eventSlug: string,
  entitySlug: string,
  role: string,
  roleLabel: string,
  displayOrder: number,
  isPrimary = displayOrder === 1,
  notes: string | null = null,
): IEventEntityRelationSeed => ({
  eventSlug,
  entitySlug,
  role,
  roleLabel,
  isPrimary,
  displayOrder,
  notes,
});

const { MONARCH, GENERAL, SCHOLAR, REVOLUTIONARY, POLITICIAN } = FigureRole;

/**
 * 1. HỒ SƠ CHI TIẾT NHÂN VẬT THẾ GIỚI & LIÊN XÔ (FIGURE PROFILES)
 */
export const WORLD_SOVIET_FIGURE_PROFILES: Record<string, IFigureProfileSeed> =
  {
    // --- Nhân vật Liên Xô ---
    'vladimir-ilyich-lenin': {
      roles: [REVOLUTIONARY, POLITICIAN, SCHOLAR],
      profile: {
        hometown: 'Simbirsk (nay là Ulyanovsk, Nga)',
        backgroundAndYouth:
          'Tên thật là Vladimir Ilyich Ulyanov, sinh trưởng trong một gia đình trí thức tiến bộ. Sớm tiếp thu học thuyết Mác và dấn thân vào phong trào cách mạng vô sản Nga từ cuối thế kỷ XIX.',
        notableWorks: [
          'Lãnh đạo thắng lợi Cách mạng Tháng Mười Nga (1917)',
          'Sáng lập Nhà nước Xô viết và Quốc tế Cộng sản (Comintern)',
          'Đề xướng Chính sách Kinh tế Mới (NEP, 1921)',
          'Tác giả "Nhà nước và Cách mạng", "Sơ thảo lần thứ nhất những luận cương về vấn đề dân tộc và vấn đề thuộc địa"',
        ],
        legacyAndHonors:
          'Lãnh tụ vĩ đại của giai cấp vô sản thế giới, người mở ra thời đại mới trong lịch sử nhân loại. Luận cương của Lenin đã soi đường cho Nguyễn Ái Quốc tìm thấy con đường cứu nước năm 1920.',
        anecdotes: [
          'Tháng 7/1920, khi đọc "Luận cương của Lenin về vấn đề dân tộc và thuộc địa" trên báo Nhân Đạo (L’Humanité), Nguyễn Ái Quốc đã xúc động reo lên: "Hỡi đồng bào bị đọa đày đau khổ! Đây là cái cần thiết cho chúng ta, đây là con đường giải phóng chúng ta!".',
        ],
        famousQuote: 'Học, học nữa, học mãi. — V.I. Lenin',
      },
    },
    'joseph-stalin': {
      roles: [POLITICIAN, GENERAL, REVOLUTIONARY],
      profile: {
        hometown: 'Gori, Gruzia (thuộc Đế quốc Nga)',
        backgroundAndYouth:
          'Tên khai sinh là Iosif Vissarionovich Dzhugashvili, tham gia đảng Bolshevik từ những ngày đầu hoạt động bí mật.',
        notableWorks: [
          'Chỉ đạo các kế hoạch 5 năm công nghiệp hóa xã hội chủ nghĩa',
          'Tổng Tư lệnh Tối cao Hồng quân Liên Xô trong Chiến tranh Vệ quốc Vĩ đại (1941–1945)',
          'Tham dự Hội nghị Thượng đỉnh Tehran, Yalta và Potsdam định hình trật tự thế giới sau Thế chiến II',
        ],
        legacyAndHonors:
          'Nguyên thủ Liên Xô đưa đất nước từ một quốc gia nông nghiệp trở thành siêu cường công nghiệp – quân sự đánh bại chủ nghĩa phát xít Đức.',
      },
    },
    'georgy-zhukov': {
      roles: [GENERAL],
      profile: {
        hometown: 'Strelkovka, tỉnh Kaluga, Nga',
        backgroundAndYouth:
          'Xuất thân từ gia đình nông dân nghèo, từng là hạ sĩ quan kỵ binh trong Thế chiến I trước khi gia nhập Hồng quân công nông năm 1918.',
        notableWorks: [
          'Chỉ huy thắng lợi Chiến dịch Khalkhin Gol (1939)',
          'Chỉ huy bảo vệ Moskva (1941), phản công Stalingrad (1942–1943), Vòng cung Kursk (1943) và Chiến dịch Berlin (1945)',
          'Thay mặt Bộ Tư lệnh Tối cao Liên Xô tiếp nhận văn kiện đầu hàng không điều kiện của phát xít Đức (08/05/1945)',
        ],
        legacyAndHonors:
          'Nguyên soái Liên Xô, 4 lần được phong tặng danh hiệu Anh hùng Liên Xô, được mệnh danh là "Vị Nguyên soái Chiến thắng".',
      },
    },
    'yuri-gagarin': {
      roles: [SCHOLAR],
      profile: {
        hometown: 'Làng Klushino, vùng Smolensk, Liên Xô',
        backgroundAndYouth:
          'Sinh ra trong gia đình nông trang tập thể, từng là công nhân đúc kim loại trước khi trúng tuyển vào trường phi công quân sự và đội phi hành gia đầu tiên của Liên Xô.',
        notableWorks: [
          'Thực hiện chuyến bay lịch sử vòng quanh Trái Đất trong 108 phút trên tàu vũ trụ Vostok 1 ngày 12/04/1961',
        ],
        legacyAndHonors:
          'Người đầu tiên trong lịch sử nhân loại bay vào vũ trụ; Anh hùng Liên Xô; ngày 12/04 hằng năm được Liên Hợp Quốc chọn làm Ngày Quốc tế Chuyến bay Vũ trụ của Con người.',
        famousQuote: 'Poyekhali! (Chúng ta đi thôi!) — Yuri Gagarin, 12/04/1961',
      },
    },
    'mikhail-gorbachev': {
      roles: [POLITICIAN],
      profile: {
        hometown: 'Privolnoye, vùng Stavropol, Liên Xô',
        backgroundAndYouth:
          'Tốt nghiệp khoa Luật Đại học Quốc gia Moskva (MGU), đi lên từ công tác Đoàn Komsomol và Đảng bộ vùng Stavropol.',
        notableWorks: [
          'Khởi xướng chính sách Cải tổ (Perestroika) và Công khai (Glasnost) từ năm 1985',
          'Ký kết các hiệp ước cắt giảm vũ khí hạt nhân chiến lược (INF, START I) với Hoa Kỳ',
        ],
        legacyAndHonors:
          'Tổng Bí thư cuối cùng của ĐCS Liên Xô và Tổng thống đầu tiên kiêm cuối cùng của Liên Xô (từ chức ngày 25/12/1991); Giải Nobel Hòa bình năm 1990.',
      },
    },

    // --- Nhân vật Thế giới ---
    'george-washington': {
      roles: [GENERAL, POLITICIAN, REVOLUTIONARY],
      profile: {
        hometown: 'Westmoreland County, Virginia, Bắc Mỹ',
        backgroundAndYouth:
          'Điền chủ và sĩ quan dân quân tại thuộc địa Virginia trước khi được Quốc hội Lục địa bầu làm Tổng tư lệnh Quân đội Lục địa năm 1775.',
        notableWorks: [
          'Tổng tư lệnh Quân đội Lục địa giành thắng lợi trong Chiến tranh Giành độc lập Hoa Kỳ (1775–1783)',
          'Chủ trì Hội nghị Lập hiến Philadelphia (1787)',
          'Tổng thống đầu tiên của Hợp chúng quốc Hoa Kỳ (1789–1797)',
        ],
        legacyAndHonors:
          'Được tôn vinh là "Người cha lập quốc" (Father of His Country) của Hoa Kỳ; tên ông được đặt cho thủ đô Washington, D.C.',
      },
    },
    'napoleon-bonaparte': {
      roles: [MONARCH, GENERAL, POLITICIAN],
      profile: {
        hometown: 'Ajaccio, đảo Corsica, Pháp',
        backgroundAndYouth:
          'Tốt nghiệp trường Quân sự Brienne và Học viện Quân sự Paris, nổi danh là tướng pháo binh tài ba từ thời Cách mạng Pháp.',
        notableWorks: [
          'Ban hành Bộ luật Dân sự Napoleon (Code Napoléon, 1804) có ảnh hưởng sâu rộng tới hệ thống pháp luật hiện đại châu Âu',
          'Chỉ huy các chiến dịch quân sự kinh điển như Austerlitz, Jena, Marengo',
        ],
        legacyAndHonors:
          'Hoàng đế Pháp (Napoléon I), một trong những nhà quân sự kiệt xuất nhất lịch sử thế giới cận đại.',
      },
    },
    'thien-hoang-minh-tri': {
      roles: [MONARCH, POLITICIAN],
      profile: {
        hometown: 'Kyoto, Nhật Bản',
        backgroundAndYouth:
          'Tên húy là Mutsuhito, lên ngôi năm 1867 khi mới 15 tuổi, tiếp nhận quyền lực từ Mạc phủ Tokugawa.',
        notableWorks: [
          'Tiến hành cuộc Duy tân Minh Trị (1868) xóa bỏ chế độ phong kiến cát cứ Mạc phủ',
          'Ban hành Hiến pháp Đại Nhật Bản Đế quốc (1889), công nghiệp hóa và hiện đại hóa đất nước theo mô hình phương Tây',
        ],
        legacyAndHonors:
          'Đưa Nhật Bản trở thành cường quốc công nghiệp hiện đại đầu tiên ở châu Á, giữ vững độc lập trước làn sóng thực dân phương Tây.',
      },
    },
    'franklin-d-roosevelt': {
      roles: [POLITICIAN],
      profile: {
        hometown: 'Hyde Park, New York, Hoa Kỳ',
        backgroundAndYouth:
          'Tốt nghiệp Đại học Harvard và Trường Luật Columbia, từng giữ chức Thống đốc bang New York trước khi đắc cử Tổng thống năm 1932.',
        notableWorks: [
          'Thực thi Chính sách Mới (New Deal) đưa nước Mỹ thoát khỏi Đại suy thoái kinh tế (1929–1933)',
          'Lãnh đạo Hoa Kỳ trong Chiến tranh Thế giới thứ hai và đồng sáng lập Liên Hợp Quốc',
        ],
        legacyAndHonors:
          'Tổng thống thứ 32 của Hoa Kỳ, vị tổng thống duy nhất đắc cử 4 nhiệm kỳ liên tiếp.',
      },
    },
    'winston-churchill': {
      roles: [POLITICIAN, SCHOLAR],
      profile: {
        hometown: 'Cung điện Blenheim, Oxfordshire, Vương quốc Anh',
        backgroundAndYouth:
          'Tốt nghiệp Học viện Quân sự Hoàng gia Sandhurst, từng là sĩ quan, phóng viên chiến trường và Bộ trưởng Hải quân.',
        notableWorks: [
          'Thủ tướng Anh kiên cường lãnh đạo đất nước chống lại phát xít Đức trong Thế chiến II (1940–1945)',
          'Tham gia liên minh "Tam cường" (Anh – Liên Xô – Mỹ) tại các hội nghị Tehran, Yalta',
        ],
        legacyAndHonors:
          'Một trong những chính khách có tầm ảnh hưởng lớn nhất thế kỷ XX; Giải Nobel Văn học năm 1953 cho các bộ sử ký về Thế chiến II.',
      },
    },
  };

/**
 * 2. THỰC THỂ LỊCH SỬ THẾ GIỚI & LIÊN XÔ (ENTITIES)
 */
const RAW_WORLD_SOVIET_ENTITIES: IEntitySeedRecord[] = [
  // ================= NHÂN VẬT LIÊN XÔ =================
  {
    slug: 'vladimir-ilyich-lenin',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    name: 'Vladimir Ilyich Lenin',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Lãnh tụ Cách mạng Tháng Mười Nga, người sáng lập Nhà nước Xô viết.',
    description:
      'Vladimir Ilyich Lenin (1870–1924) là nhà lý luận chính trị, lãnh tụ của Đảng Bolshevik, người lãnh đạo thắng lợi Cách mạng Tháng Mười Nga năm 1917 và đứng đầu Chính phủ Xô viết đầu tiên trên thế giới.',
    aliases: ['V.I. Lenin', 'Vladimir Ilyich Ulyanov', 'Lê-nin'],
    imageUrl: null,
    imageCaption: 'Vladimir Ilyich Lenin năm 1920',
    isFeatured: true,
    displayOrder: 50,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1870,
      deathYear: 1924,
      birthDateLabel: '22/04/1870',
      deathDateLabel: '21/01/1924',
      biography:
        'Vladimir Ilyich Lenin phát triển chủ nghĩa Mác trong thời đại đế quốc chủ nghĩa (chủ nghĩa Mác – Lênin), lãnh đạo cuộc Cách mạng Tháng Mười năm 1917 lật đổ Chính phủ lâm thời tư sản Nga, lập nên chính quyền công nông và thành lập Liên bang Cộng hòa Xã hội Chủ nghĩa Xô viết năm 1922.',
      occupation: 'Nhà cách mạng, Chủ tịch Hội đồng Dân ủy Liên Xô',
      titles: [
        'Chủ tịch Hội đồng Dân ủy Liên Xô',
        'Lãnh tụ Đảng Bolshevik',
      ],
      roles: [REVOLUTIONARY, POLITICIAN, SCHOLAR],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Vladimir_Ilyich_Lenin')],
    },
  },
  {
    slug: 'joseph-stalin',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    name: 'Joseph Stalin',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Nhà lãnh đạo Liên Xô thời kỳ công nghiệp hóa và Chiến tranh Vệ quốc Vĩ đại.',
    description:
      'Joseph Vissarionovich Stalin (1878–1953) là Tổng Bí thư Ban Chấp hành Trung ương Đảng Cộng sản Liên Xô và Chủ tịch Hội đồng Bộ trưởng Liên Xô, Tổng Tư lệnh Tối cao Hồng quân Liên Xô trong Thế chiến II.',
    aliases: ['Iosif Vissarionovich Stalin', 'Xta-lin'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 51,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1878,
      deathYear: 1953,
      birthDateLabel: '18/12/1878',
      deathDateLabel: '05/03/1953',
      biography:
        'Joseph Stalin đứng đầu Liên Xô từ giữa thập niên 1920 đến năm 1953. Ông chỉ đạo công cuộc công nghiệp hóa xã hội chủ nghĩa, tập thể hóa nông nghiệp và lãnh đạo Liên Xô giành chiến thắng trước phát xít Đức trong Chiến tranh Vệ quốc Vĩ đại (1941–1945).',
      occupation: 'Tổng Bí thư ĐCS Liên Xô, Đại nguyên soái',
      titles: ['Tổng Bí thư ĐCS Liên Xô', 'Chủ tịch Hội đồng Bộ trưởng'],
      roles: [POLITICIAN, GENERAL, REVOLUTIONARY],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Joseph_Stalin')],
    },
  },
  {
    slug: 'georgy-zhukov',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    name: 'Georgy Konstantinovich Zhukov',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Nguyên soái Liên Xô chỉ huy các chiến dịch Stalingrad, Kursk và Berlin.',
    description:
      'Georgy Konstantinovich Zhukov (1896–1974) là nhà cầm quân xuất sắc của Hồng quân Liên Xô trong Chiến tranh Thế giới thứ hai, bốn lần được trao tặng danh hiệu Anh hùng Liên Xô.',
    aliases: ['Georgy Zhukov', 'Nguyên soái Zhukov'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 52,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1896,
      deathYear: 1974,
      birthDateLabel: '01/12/1896',
      deathDateLabel: '18/06/1974',
      biography:
        'Nguyên soái Georgy Zhukov giữ vai trò Phó Tổng tư lệnh Tối cao Hồng quân Liên Xô, trực tiếp chỉ huy nhiều chiến dịch bước ngoặt của Thế chiến II như bảo vệ Leningrad, bảo vệ Moskva, phản công tại Stalingrad, trận Vòng cung Kursk và Chiến dịch Công phá Berlin năm 1945.',
      occupation: 'Nguyên soái Liên Xô, Bộ trưởng Quốc phòng',
      titles: ['Nguyên soái Liên Xô', 'Anh hùng Liên Xô (4 lần)'],
      roles: [GENERAL],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Georgy_Konstantinovich_Zhukov')],
    },
  },
  {
    slug: 'yuri-gagarin',
    periodSlug: PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA,
    name: 'Yuri Alekseyevich Gagarin',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Phi hành gia Liên Xô, người đầu tiên trong lịch sử nhân loại bay vào vũ trụ (1961).',
    description:
      'Yuri Alekseyevich Gagarin (1934–1968) là phi công và phi hành gia Liên Xô. Ngày 12/04/1961, ông thực hiện chuyến bay lịch sử trên tàu vũ trụ Vostok 1 vòng quanh quỹ đạo Trái Đất.',
    aliases: ['Yuri Gagarin', 'Gagarin'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 53,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1934,
      deathYear: 1968,
      birthDateLabel: '09/03/1934',
      deathDateLabel: '27/03/1968',
      biography:
        'Ngày 12/04/1961, thiếu tá không quân Yuri Gagarin trở thành con người đầu tiên bay vào không gian vũ trụ trên con tàu Vostok 1 xuất phát từ sân bay vũ trụ Baikonur, mở ra kỷ nguyên khám phá vũ trụ có người lái của nhân loại.',
      occupation: 'Phi hành gia, Đại tá Không quân Liên Xô',
      titles: ['Anh hùng Liên Xô', 'Phi hành gia Liên Xô'],
      roles: [SCHOLAR],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Yuri_Alekseyevich_Gagarin')],
    },
  },
  {
    slug: 'mikhail-gorbachev',
    periodSlug: PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA,
    name: 'Mikhail Sergeyevich Gorbachev',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Nhà lãnh đạo cuối cùng của Liên Xô, người khởi xướng chính sách Cải tổ (Perestroika).',
    description:
      'Mikhail Sergeyevich Gorbachev (1931–2022) là Tổng Bí thư Ban Chấp hành Trung ương Đảng Cộng sản Liên Xô (1985–1991) và Tổng thống Liên Xô (1990–1991).',
    aliases: ['Mikhail Gorbachev', 'Goóc-ba-chốp'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 54,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1931,
      deathYear: 2022,
      birthDateLabel: '02/03/1931',
      deathDateLabel: '30/08/2022',
      biography:
        'Mikhail Gorbachev phát động công cuộc Cải tổ (Perestroika) và Công khai (Glasnost) nhằm cải cách kinh tế - chính trị tại Liên Xô, đồng thời thúc đẩy chấm dứt Chiến tranh Lạnh. Tuy nhiên, khủng hoảng toàn diện đã dẫn tới sự tan rã của Liên bang Xô viết vào tháng 12/1991.',
      occupation: 'Tổng Bí thư ĐCS Liên Xô, Tổng thống Liên Xô',
      titles: ['Tổng thống Liên Xô', 'Giải Nobel Hòa bình (1990)'],
      roles: [POLITICIAN],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Mikhail_Sergeyevich_Gorbachev')],
    },
  },

  // ================= NHÂN VẬT THẾ GIỚI =================
  {
    slug: 'george-washington',
    periodSlug: PERIOD_SLUGS.WORLD_BOURGEOIS_REVOLUTIONS,
    name: 'George Washington',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Tổng tư lệnh Quân đội Lục địa và Tổng thống đầu tiên của Hoa Kỳ.',
    description:
      'George Washington (1732–1799) là nhà lãnh đạo quân sự và chính trị gia người Mỹ, chỉ huy cuộc Chiến tranh Giành độc lập của 13 thuộc địa Bắc Mỹ và trở thành Tổng thống đầu tiên của Hoa Kỳ.',
    aliases: ['Washington'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 55,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1732,
      deathYear: 1799,
      birthDateLabel: '22/02/1732',
      deathDateLabel: '14/12/1799',
      biography:
        'George Washington lãnh đạo Quân đội Lục địa đánh bại thực dân Anh trong Chiến tranh Giành độc lập Hoa Kỳ (1775–1783), chủ trì Hội nghị Lập hiến năm 1787 và giữ chức Tổng thống Hoa Kỳ hai nhiệm kỳ đầu tiên (1789–1797).',
      occupation: 'Tổng thống Hoa Kỳ, Tổng tư lệnh Quân đội Lục địa',
      titles: ['Tổng thống thứ nhất của Hoa Kỳ'],
      roles: [GENERAL, POLITICIAN, REVOLUTIONARY],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('George_Washington')],
    },
  },
  {
    slug: 'napoleon-bonaparte',
    periodSlug: PERIOD_SLUGS.WORLD_BOURGEOIS_REVOLUTIONS,
    name: 'Napoléon Bonaparte',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Hoàng đế Pháp, danh tướng kiệt xuất và người ban hành Bộ luật Dân sự Napoléon.',
    description:
      'Napoléon Bonaparte (1769–1821) là nhà quân sự và chính trị gia người Pháp, vươn lên trong thời kỳ Cách mạng Pháp và trị vì với tước hiệu Hoàng đế của người Pháp (Napoléon I) từ 1804 đến 1814/1815.',
    aliases: ['Napoleon I', 'Napoléon'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 56,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1769,
      deathYear: 1821,
      birthDateLabel: '15/08/1769',
      deathDateLabel: '05/05/1821',
      biography:
        'Napoléon Bonaparte củng cố những thành quả cốt lõi của Cách mạng Tư sản Pháp thông qua Bộ luật Dân sự năm 1804, cải tổ hành chính - giáo dục và tiến hành các cuộc chiến tranh Napoléon làm rung chuyển chế độ phong kiến khắp châu Âu trước khi thất bại tại trận Waterloo năm 1815.',
      occupation: 'Hoàng đế Pháp, Thống chế quân đội',
      titles: ['Hoàng đế của người Pháp', 'Đệ nhất Tổng tài'],
      roles: [MONARCH, GENERAL, POLITICIAN],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Napoléon_Bonaparte')],
    },
  },
  {
    slug: 'thien-hoang-minh-tri',
    periodSlug: PERIOD_SLUGS.WORLD_INDUSTRIAL_MEIJI,
    name: 'Thiên hoàng Minh Trị (Meiji)',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Vị Thiên hoàng lãnh đạo công cuộc Duy tân Minh Trị đưa Nhật Bản thành cường quốc.',
    description:
      'Thiên hoàng Minh Trị (1852–1912), tên húy là Mutsuhito, là vị Thiên hoàng thứ 122 của Nhật Bản, trị vì từ năm 1867 đến năm 1912.',
    aliases: ['Meiji Tenno', 'Mutsuhito', 'Minh Trị Thiên hoàng'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 57,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1852,
      deathYear: 1912,
      birthDateLabel: '03/11/1852',
      deathDateLabel: '30/07/1912',
      biography:
        'Dưới triều đại của Thiên hoàng Minh Trị, Nhật Bản tiến hành cuộc cải cách toàn diện (Minh Trị Duy Tân năm 1868) về chính trị, kinh tế, giáo dục và quân sự, chuyển mình từ một quốc gia phong kiến đóng cửa thành cường quốc công nghiệp hiện đại.',
      occupation: 'Thiên hoàng Nhật Bản',
      titles: ['Thiên hoàng thứ 122 của Nhật Bản'],
      roles: [MONARCH, POLITICIAN],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Thiên_hoàng_Minh_Trị')],
    },
  },
  {
    slug: 'franklin-d-roosevelt',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    name: 'Franklin D. Roosevelt',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Tổng thống thứ 32 của Hoa Kỳ, trụ cột khối Đồng minh chống phát xít trong Thế chiến II.',
    description:
      'Franklin Delano Roosevelt (1882–1945), thường gọi là FDR, là Tổng thống thứ 32 của Hoa Kỳ từ năm 1933 đến năm 1945.',
    aliases: ['FDR', 'Franklin Delano Roosevelt'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 58,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1882,
      deathYear: 1945,
      birthDateLabel: '30/01/1882',
      deathDateLabel: '12/04/1945',
      biography:
        'Franklin D. Roosevelt khởi xướng chương trình Chính sách Mới (New Deal) vực dậy nền kinh tế Mỹ sau Đại suy thoái 1929–1933, đồng thời cùng Liên Xô và Anh lãnh đạo phe Đồng minh đánh bại phe Trục phát xít và đặt nền móng thành lập Liên Hợp Quốc.',
      occupation: 'Tổng thống Hoa Kỳ',
      titles: ['Tổng thống thứ 32 của Hoa Kỳ'],
      roles: [POLITICIAN],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Franklin_D._Roosevelt')],
    },
  },
  {
    slug: 'winston-churchill',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    name: 'Winston Churchill',
    type: HistoricalEntityType.PERSON,
    tagline:
      'Thủ tướng Vương quốc Anh thời kỳ Chiến tranh Thế giới thứ hai.',
    description:
      'Sir Winston Leonard Spencer Churchill (1874–1965) là Thủ tướng Vương quốc Liên hiệp Anh và Bắc Ireland trong giai đoạn 1940–1945 và 1951–1955.',
    aliases: ['Sir Winston Churchill'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 59,
    status: ContentStatus.PUBLISHED,
    person: {
      birthYear: 1874,
      deathYear: 1965,
      birthDateLabel: '30/11/1874',
      deathDateLabel: '24/01/1965',
      biography:
        'Winston Churchill nổi tiếng với ý chí kiên định không khoan nhượng trước phát xít Đức trong trận không chiến nước Anh năm 1940 và là một trong ba nguyên thủ chủ chốt tại Hội nghị Tehran và Hội nghị Yalta.',
      occupation: 'Thủ tướng Vương quốc Anh, Nhà văn',
      titles: ['Thủ tướng Vương quốc Anh', 'Giải Nobel Văn học (1953)'],
      roles: [POLITICIAN, SCHOLAR],
    },
    historicalSite: null,
    metadata: {
      sources: [wiki('Winston_Churchill')],
    },
  },

  // ================= ĐỊA DANH / DI TÍCH LIÊN XÔ =================
  {
    slug: 'cung-dien-mua-dong',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    name: 'Cung điện Mùa Đông (Petrograd / Saint Petersburg)',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Biểu tượng quyền lực Nga hoàng và tâm điểm cuộc tấn công đêm Cách mạng Tháng Mười 1917.',
    description:
      'Cung điện Mùa Đông tại Saint Petersburg (tên cũ là Petrograd, Leningrad) từng là dinh thự chính thức của các Sa hoàng Nga và trụ sở Chính phủ Lâm thời tư sản trước khi bị lực lượng Cận vệ Đỏ Bolshevik chiếm giữ trong đêm 07/11/1917.',
    aliases: ['Winter Palace', 'Bảo tàng Hermitage'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 60,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.PALACE,
      address: 'Palace Embankment 32, Saint Petersburg, Liên bang Nga',
      latitude: 59.9404,
      longitude: 30.3139,
      constructionYear: 1754,
      constructionLabel: '1754 – 1762',
      preservationStatus: 'Bảo tồn nguyên vẹn (thuộc Bảo tàng Hermitage)',
      recognitionLevel: 'Di sản Thế giới UNESCO',
      managingAgency: 'Bảo tàng Quốc gia Hermitage',
    },
    metadata: {
      sources: [wiki('Cung_điện_Mùa_Đông')],
    },
  },
  {
    slug: 'dien-kremlin-quang-truong-do',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    name: 'Điện Kremlin và Quảng trường Đỏ (Moskva)',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Trung tâm chính trị tối cao của Liên bang Xô viết và nơi diễn ra cuộc duyệt binh lịch sử năm 1941, 1945.',
    description:
      'Quần thể Điện Kremlin và Quảng trường Đỏ tại thủ đô Moskva là cơ quan đầu não của Đảng và Nhà nước Liên Xô từ năm 1918 đến năm 1991, gắn liền với cuộc duyệt binh ngày 07/11/1941 tiến thẳng ra mặt trận và Lễ duyệt binh Chiến thắng ngày 24/06/1945.',
    aliases: ['Điện Kremli', 'Quảng trường Đỏ Moskva'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 61,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.CITADEL,
      address: 'Quảng trường Đỏ, Moskva, Liên bang Nga',
      latitude: 55.752,
      longitude: 37.6175,
      constructionYear: 1485,
      constructionLabel: 'Thế kỷ XV',
      preservationStatus: 'Bảo tồn đặc biệt',
      recognitionLevel: 'Di sản Thế giới UNESCO (1990)',
      managingAgency: 'Chính phủ Liên bang Nga',
    },
    metadata: {
      sources: [wiki('Điện_Kremli'), wiki('Quảng_trường_Đỏ')],
    },
  },
  {
    slug: 'thanh-pho-stalingrad',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    name: 'Thành phố Anh hùng Stalingrad (nay là Volgograd)',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Chiến trường ác liệt bậc nhất lịch sử nhân loại, nơi xoay chuyển cục diện Chiến tranh Thế giới thứ hai.',
    description:
      'Thành phố Stalingrad bên bờ sông Volga (nay là Volgograd, Nga) là nơi diễn ra Chiến dịch Stalingrad kéo dài 200 ngày đêm (1942–1943), nơi Hồng quân Liên Xô bao vây và tiêu diệt Tập đoàn quân số 6 tinh nhuệ của phát xít Đức.',
    aliases: ['Volgograd', 'Tsaritsyn', 'Đồi Mamayev Kurgan'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 62,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.BATTLEFIELD,
      address: 'Volgograd, Tỉnh Volgograd, Liên bang Nga',
      latitude: 48.7424,
      longitude: 44.537,
      constructionYear: 1589,
      constructionLabel: 'Thành phố Anh hùng Liên Xô',
      preservationStatus: 'Khu tưởng niệm Quốc gia Đồi Mamayev Kurgan',
      recognitionLevel: 'Di tích Lịch sử Quốc gia Đặc biệt Liên bang Nga',
      managingAgency: 'Khu bảo tồn Bảo tàng Trận Stalingrad',
    },
    metadata: {
      sources: [wiki('Volgograd'), wiki('Trận_Stalingrad')],
    },
  },
  {
    slug: 'san-bay-vu-tru-baikonur',
    periodSlug: PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA,
    name: 'Sân bay vũ trụ Baikonur',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Cảng vũ trụ đầu tiên và lớn nhất thế giới, nơi phóng vệ tinh Sputnik 1 và tàu Vostok 1.',
    description:
      'Được Liên Xô xây dựng năm 1955 trên thảo nguyên Kazakhstan, Sân bay vũ trụ Baikonur là bệ phóng đưa vệ tinh nhân tạo đầu tiên Sputnik 1 (1957), phi hành gia đầu tiên Yuri Gagarin (1961) và anh hùng Phạm Tuân của Việt Nam (1980) bay vào vũ trụ.',
    aliases: ['Baikonur Cosmodrome', 'Tyuratam'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 63,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.MONUMENT,
      address: 'Baikonur, Kazakhstan (Liên Xô cũ)',
      latitude: 45.9646,
      longitude: 63.3052,
      constructionYear: 1955,
      constructionLabel: 'Khởi công năm 1955',
      preservationStatus: 'Đang hoạt động & Bảo tàng Lịch sử Vũ trụ',
      recognitionLevel: 'Di tích Khoa học & Vũ trụ Quốc tế',
      managingAgency: 'Roscosmos',
    },
    metadata: {
      sources: [wiki('Sân_bay_vũ_trụ_Baikonur')],
    },
  },

  // ================= ĐỊA DANH / DI TÍCH THẾ GIỚI =================
  {
    slug: 'cung-dien-versailles',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    name: 'Cung điện Versailles (Pháp)',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Trung tâm vương quyền Pháp và nơi ký kết Hòa ước Versailles (1919) kết thúc Thế chiến I.',
    description:
      'Nằm ở phía tây nam thủ đô Paris, Cung điện Versailles vừa gắn liền với cuộc Đại Cách mạng Pháp năm 1789 vừa là nơi các cường quốc thắng trận ký Hòa ước Versailles ngày 28/06/1919 thiết lập trật tự Versailles – Washington.',
    aliases: ['Lâu đài Versailles', 'Château de Versailles'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 64,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.PALACE,
      address: 'Place d’Armes, 78000 Versailles, Cộng hòa Pháp',
      latitude: 48.8049,
      longitude: 2.1204,
      constructionYear: 1661,
      constructionLabel: 'Thế kỷ XVII',
      preservationStatus: 'Bảo tồn nguyên vẹn',
      recognitionLevel: 'Di sản Thế giới UNESCO (1979)',
      managingAgency: 'Bộ Văn hóa Pháp',
    },
    metadata: {
      sources: [wiki('Cung_điện_Versailles')],
    },
  },
  {
    slug: 'tran-chau-cang',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    name: 'Trân Châu Cảng (Pearl Harbor, Hawaii)',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Căn cứ Hạm đội Thái Bình Dương của Hoa Kỳ bị Hải quân Đế quốc Nhật Bản tập kích năm 1941.',
    description:
      'Quân cảng chiến lược trên đảo Oahu (Hawaii, Hoa Kỳ), nơi diễn ra cuộc tập kích bất ngờ sáng ngày 07/12/1941 khiến Hoa Kỳ chính thức tuyên chiến và tham gia Chiến tranh Thế giới thứ hai.',
    aliases: ['Pearl Harbor'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 65,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.BATTLEFIELD,
      address: 'Oahu, Hawaii, Hợp chúng quốc Hoa Kỳ',
      latitude: 21.3649,
      longitude: -157.95,
      constructionYear: 1908,
      constructionLabel: 'Căn cứ Hải quân Hoa Kỳ',
      preservationStatus: 'Khu tưởng niệm Quốc gia USS Arizona',
      recognitionLevel: 'Danh thắng Lịch sử Quốc gia Hoa Kỳ',
      managingAgency: 'Cục Công viên Quốc gia Hoa Kỳ',
    },
    metadata: {
      sources: [wiki('Trân_Châu_Cảng')],
    },
  },
  {
    slug: 'bai-bien-normandy',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    name: 'Bãi biển Normandy (Pháp)',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Nơi diễn ra cuộc đổ bộ đường biển lớn nhất lịch sử trong Chiến dịch Overlord (D-Day, 06/06/1944).',
    description:
      'Dải bờ biển vùng Normandy miền bắc nước Pháp (gồm 5 bãi đổ bộ Utah, Omaha, Gold, Juno, Sword), nơi liên quân Đồng minh mở Mặt trận thứ hai ở Tây Âu chống phát xít Đức.',
    aliases: ['Normandie', 'Bãi đổ bộ Omaha'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 66,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.BATTLEFIELD,
      address: 'Normandie, Cộng hòa Pháp',
      latitude: 49.3697,
      longitude: -0.8711,
      constructionYear: 1944,
      constructionLabel: 'Chiến trường Thế chiến II (1944)',
      preservationStatus: 'Hệ thống bảo tàng và nghĩa trang tưởng niệm D-Day',
      recognitionLevel: 'Di tích Lịch sử Quốc gia Pháp',
      managingAgency: 'Chính phủ Cộng hòa Pháp',
    },
    metadata: {
      sources: [wiki('Trận_Normandie')],
    },
  },
  {
    slug: 'cung-dien-livadia-yalta',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    name: 'Cung điện Livadia (Yalta, bán đảo Krym)',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Địa điểm tổ chức Hội nghị Thượng đỉnh Yalta (02/1945) giữa nguyên thủ Liên Xô, Mỹ và Anh.',
    description:
      'Cung điện Livadia tại thành phố biển Yalta là nơi diễn ra Hội nghị Yalta từ ngày 04 đến 11/02/1945 giữa Joseph Stalin, Franklin D. Roosevelt và Winston Churchill nhằm phân chia phạm vi ảnh hưởng và thành lập Liên Hợp Quốc.',
    aliases: ['Livadia Palace', 'Hội trường Yalta'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 67,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.PALACE,
      address: 'Yalta, Bán đảo Krym',
      latitude: 44.4678,
      longitude: 34.1436,
      constructionYear: 1911,
      constructionLabel: 'Hoàn thành năm 1911',
      preservationStatus: 'Bảo tàng Lịch sử Hội nghị Yalta',
      recognitionLevel: 'Di tích Lịch sử Quốc tế',
      managingAgency: 'Bảo tàng Cung điện Livadia',
    },
    metadata: {
      sources: [wiki('Hội_nghị_Yalta')],
    },
  },
  {
    slug: 'buc-tuong-berlin',
    periodSlug: PERIOD_SLUGS.WORLD_COLD_WAR_MULTIPOLAR,
    name: 'Bức tường Berlin và Cổng Brandenburg (Đức)',
    type: HistoricalEntityType.LOCATION,
    tagline:
      'Biểu tượng chia cắt Đông – Tây trong Chiến tranh Lạnh (1961–1989) và sự kiện thống nhất nước Đức.',
    description:
      'Bức tường Berlin được xây dựng từ năm 1961 ngăn cách Tây Berlin với Đông Berlin và Cộng hòa Dân chủ Đức. Sự kiện mở cửa Bức tường Berlin đêm 09/11/1989 đánh dấu bước ngoặt kết thúc Chiến tranh Lạnh ở châu Âu.',
    aliases: ['Berlin Wall', 'Berliner Mauer'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 68,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: {
      siteType: HISTORICAL_SITE_TYPES.MONUMENT,
      address: 'Bernauer Straße, Berlin, Cộng hòa Liên bang Đức',
      latitude: 52.5351,
      longitude: 13.3903,
      constructionYear: 1961,
      constructionLabel: '1961 – 1989',
      preservationStatus: 'Khu tưởng niệm Bức tường Berlin & East Side Gallery',
      recognitionLevel: 'Di tích Lịch sử Quốc gia Đức',
      managingAgency: 'Berlin Wall Foundation',
    },
    metadata: {
      sources: [wiki('Bức_tường_Berlin')],
    },
  },

  // ================= LỰC LƯỢNG, TỔ CHỨC & HIỆN VẬT =================
  {
    slug: 'hong-quan-lien-xo',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    name: 'Hồng quân Công Nông Liên Xô (RKKA)',
    type: HistoricalEntityType.MILITARY_FORCE,
    tagline:
      'Lực lượng vũ trang nòng cốt bảo vệ Nhà nước Xô viết và đánh bại chủ nghĩa phát xít trong Thế chiến II.',
    description:
      'Thành lập ngày 23/02/1918 theo sắc lệnh của V.I. Lenin, Hồng quân Công Nông Liên Xô đã chiến thắng trong Nội chiến Nga và đóng vai trò quyết định tiêu diệt hơn 75% sinh lực quân đội phát xít Đức trên Mặt trận Xô – Đức (1941–1945).',
    aliases: ['Hồng quân Liên Xô', 'Quân đội Liên Xô'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 69,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: null,
    metadata: {
      foundedYear: 1918,
      retiredYear: 1991,
      sources: [wiki('Hồng_quân')],
    },
  },
  {
    slug: 'lien-hop-quoc',
    periodSlug: PERIOD_SLUGS.WORLD_COLD_WAR_MULTIPOLAR,
    name: 'Tổ chức Liên Hợp Quốc (United Nations - UN)',
    type: HistoricalEntityType.ORGANIZATION,
    tagline:
      'Tổ chức liên chính phủ lớn nhất hành tinh được thành lập năm 1945 nhằm duy trì hòa bình và an ninh quốc tế.',
    description:
      'Được định hình từ Hội nghị Yalta và chính thức thành lập ngày 24/10/1945 khi Hiến chương Liên Hợp Quốc có hiệu lực, Liên Hợp Quốc giữ vai trò trung tâm trong luật pháp quốc tế, giải trừ quân bị và thúc đẩy quyền tự quyết của các dân tộc thuộc địa.',
    aliases: ['Liên Hiệp Quốc', 'United Nations', 'UN'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: true,
    displayOrder: 70,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: null,
    metadata: {
      foundedYear: 1945,
      sources: [wiki('Liên_Hợp_Quốc')],
    },
  },
  {
    slug: 'tau-vu-tru-vostok-1',
    periodSlug: PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA,
    name: 'Tàu vũ trụ Vostok 1 (Phương Đông 1)',
    type: HistoricalEntityType.ARTIFACT,
    tagline:
      'Con tàu vũ trụ đầu tiên trong lịch sử nhân loại đưa con người bay vào quỹ đạo Trái Đất (12/04/1961).',
    description:
      'Được thiết kế dưới sự chủ trì của Tổng công trình sư Sergei Korolev thuộc chương trình không gian Liên Xô, tàu vũ trụ Vostok 1 đã đưa phi hành gia Yuri Gagarin bay một vòng quanh Trái Đất ở độ cao tối đa 327 km trong 108 phút.',
    aliases: ['Phương Đông 1', 'Vostok-1'],
    imageUrl: null,
    imageCaption: null,
    isFeatured: false,
    displayOrder: 71,
    status: ContentStatus.PUBLISHED,
    person: null,
    historicalSite: null,
    metadata: {
      foundedYear: 1961,
      sources: [wiki('Vostok_1')],
    },
  },
];

/**
 * 3. SỰ KIỆN LỊCH SỬ THẾ GIỚI & LIÊN XÔ (EVENTS)
 */
const RAW_WORLD_SOVIET_EVENTS: IEventSeedRecord[] = [
  // =========================================================================
  // PHẦN A: SỰ KIỆN LỊCH SỬ THẾ GIỚI (10 SỰ KIỆN)
  // =========================================================================
  {
    slug: 'columbus-tim-ra-chau-my-1492',
    periodSlug: PERIOD_SLUGS.WORLD_MEDIEVAL_EUROPE,
    locationSlug: null,
    parentSlug: null,
    title: 'Hải trình của Christopher Columbus phát kiến ra Châu Mỹ',
    startYear: 1492,
    startMonth: 10,
    startDay: 12,
    endYear: 1492,
    eventDateNote: 'Ngày 12/10/1492 đoàn thám hiểm đặt chân tới quần đảo Bahamas.',
    summary:
      'Đoàn thám hiểm Tây Ban Nha do Christopher Columbus dẫn đầu vượt Đại Tây Dương đặt chân tới Tân Thế giới, mở ra kỷ nguyên Đại phát kiến địa lý.',
    description:
      'Với sự bảo trợ của Vương quyền Tây Ban Nha, nhà hàng hải Christopher Columbus chỉ huy ba chiến thuyền Santa María, Pinta và Niña vượt Đại Tây Dương tìm đường sang Ấn Độ nhưng đã phát hiện ra châu Mỹ ngày 12/10/1492. Sự kiện này kết nối hai bán cầu Đông – Tây, thúc đẩy thương mại toàn cầu và đánh dấu bước chuyển từ thời Trung đại sang Cận đại.',
    thumbnailUrl: null,
    displayOrder: 1,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause:
        'Nhu cầu tìm kiếm tuyến đường biển mới sang phương Đông sau khi Đế quốc Ottoman kiểm soát Constantinople (1453).',
      outcome:
        'Mở ra thời kỳ Đại phát kiến địa lý, giao lưu kinh tế – sinh học toàn cầu và quá trình thực dân hóa châu Mỹ.',
      sources: [wiki('Cristoforo_Colombo'), wiki('Thời_đại_Thám_hiểm')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'tuyen-ngon-doc-lap-hoa-ky-1776',
    periodSlug: PERIOD_SLUGS.WORLD_BOURGEOIS_REVOLUTIONS,
    locationSlug: null,
    parentSlug: null,
    title: 'Tuyên ngôn Độc lập Hoa Kỳ khai sinh Hợp chúng quốc Hoa Kỳ',
    startYear: 1776,
    startMonth: 7,
    startDay: 4,
    endYear: 1776,
    eventDateNote: 'Ngày 04/07/1776 tại Philadelphia.',
    summary:
      'Đại hội Lục địa lần thứ hai thông qua bản Tuyên ngôn Độc lập do Thomas Jefferson soạn thảo, tuyên bố 13 thuộc địa Bắc Mỹ tách khỏi Đế quốc Anh.',
    description:
      'Trong bối cảnh cuộc Chiến tranh Giành độc lập của 13 thuộc địa Bắc Mỹ dưới sự chỉ huy của Tổng tư lệnh George Washington đang diễn ra quyết liệt, ngày 04/07/1776 Đại hội Lục địa thông qua Tuyên ngôn Độc lập, khẳng định quyền bất khả xâm phạm của con người về quyền sống, quyền tự do và quyền mưu cầu hạnh phúc. Năm 1945, Chủ tịch Hồ Chí Minh đã trích dẫn văn kiện này trong phần mở đầu Tuyên ngôn Độc lập của nước Việt Nam Dân chủ Cộng hòa.',
    thumbnailUrl: null,
    displayOrder: 2,
    category: EventCategory.REVOLUTION,
    metadata: {
      cause:
        'Chính sách thuế khóa hà khắc và sự kìm hãm kinh tế của chính quốc Anh đối với 13 thuộc địa Bắc Mỹ.',
      outcome:
        'Ra đời Hợp chúng quốc Hoa Kỳ và truyền cảm hứng cho các cuộc cách mạng dân chủ tư sản cùng phong trào giải phóng dân tộc trên thế giới.',
      sources: [wiki('Tuyên_ngôn_Độc_lập_Hoa_Kỳ')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'dai-cach-mang-phap-1789',
    periodSlug: PERIOD_SLUGS.WORLD_BOURGEOIS_REVOLUTIONS,
    locationSlug: 'cung-dien-versailles',
    parentSlug: null,
    title: 'Đại Cách mạng Tư sản Pháp bùng nổ và sự kiện phá ngục Bastille',
    startYear: 1789,
    startMonth: 7,
    startDay: 14,
    endYear: 1799,
    eventDateNote: 'Ngày 14/07/1789 quần chúng Paris tấn công pháo đài – nhà tù Bastille.',
    summary:
      'Quần chúng nhân dân Paris đánh chiếm ngục Bastille, lật đổ chế độ quân chủ chuyên chế Bourbon và công bố Tuyên ngôn Nhân quyền và Dân quyền.',
    description:
      'Ngày 14/07/1789, nhân dân thủ đô Paris vũ trang tấn công ngục Bastille — biểu tượng của chế độ quân chủ chuyên chế Pháp. Tháng 8/1789, Quốc hội Lập hiến thông qua bản "Tuyên ngôn Nhân quyền và Dân quyền" với khẩu hiệu nổi tiếng "Tự do – Bình đẳng – Bác ái", xóa bỏ trật tự đẳng cấp phong kiến và đặt nền tảng cho nhà nước cộng hòa hiện đại tại châu Âu.',
    thumbnailUrl: null,
    displayOrder: 3,
    category: EventCategory.REVOLUTION,
    metadata: {
      cause:
        'Mâu thuẫn gay gắt giữa Đẳng cấp thứ ba (tư sản, nông dân, bình dân thành thị) với chế độ phong kiến chuyên chế và tăng lữ, quý tộc.',
      outcome:
        'Xóa bỏ chế độ quân chủ chuyên chế ở Pháp, thông qua Tuyên ngôn Nhân quyền và Dân quyền (1789).',
      sources: [wiki('Cách_mạng_Pháp')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'tran-waterloo-1815',
    periodSlug: PERIOD_SLUGS.WORLD_BOURGEOIS_REVOLUTIONS,
    locationSlug: null,
    parentSlug: null,
    title: 'Trận Waterloo và sự kết thúc các cuộc Chiến tranh Napoléon',
    startYear: 1815,
    startMonth: 6,
    startDay: 18,
    endYear: 1815,
    eventDateNote: 'Ngày 18/06/1815 tại Waterloo (nay thuộc Vương quốc Bỉ).',
    summary:
      'Quân đội của Hoàng đế Napoléon Bonaparte thất bại trước Liên quân thứ bảy (Anh và Phổ), khép lại triều đại Đệ nhất Đế chế Pháp.',
    description:
      'Sau khi trở lại nắm quyền trong "Triều đại Một trăm ngày", Hoàng đế Napoléon Bonaparte chạm trán liên quân Anh – Đồng minh do Công tước xứ Wellington chỉ huy và quân Phổ của Thống chế Blücher tại Waterloo ngày 18/06/1815. Thất bại tại Waterloo buộc Napoléon thoái vị lần thứ hai và bị lưu đày tới đảo Saint Helena, mở đường cho trật tự châu Âu theo Hội nghị Viên.',
    thumbnailUrl: null,
    displayOrder: 4,
    category: EventCategory.BATTLE,
    metadata: {
      cause:
        'Napoléon Bonaparte trở về Pháp khôi phục Đế chế khiến các cường quốc châu Âu lập Liên minh thứ bảy chống Pháp.',
      outcome:
        'Kết thúc hơn hai thập kỷ Chiến tranh Napoléon, định hình lại bản đồ chính trị châu Âu tại Hội nghị Viên (1815).',
      sources: [wiki('Trận_Waterloo')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'cuoc-duy-tan-minh-tri-1868',
    periodSlug: PERIOD_SLUGS.WORLD_INDUSTRIAL_MEIJI,
    locationSlug: null,
    parentSlug: null,
    title: 'Cuộc Duy tân Minh Trị hiện đại hóa Nhật Bản',
    startYear: 1868,
    startMonth: 1,
    startDay: 3,
    endYear: 1889,
    eventDateNote: 'Bắt đầu từ tháng 01/1868 dưới triều Thiên hoàng Minh Trị.',
    summary:
      'Thiên hoàng Minh Trị xóa bỏ chế độ Mạc phủ Tokugawa, tiến hành cải cách toàn diện đưa Nhật Bản trở thành quốc gia công nghiệp hiện đại.',
    description:
      'Tháng 01/1868, sau khi thu hồi quyền lực từ Mạc phủ Tokugawa, Thiên hoàng Minh Trị ban bố "Ngũ điều Ngự thệ" và thực hiện hàng loạt cải cách sâu rộng: xóa bỏ chế độ phiên trấn phong kiến, thống nhất tiền tệ và thị trường, áp dụng chế độ giáo dục bắt buộc, cử du học sinh sang Âu – Mỹ và xây dựng công nghiệp – quân đội hiện đại. Cuộc Duy tân Minh Trị giúp Nhật Bản thoát khỏi nguy cơ trở thành thuộc địa và truyền cảm hứng cho phong trào Đông Du của Phan Bội Châu tại Việt Nam đầu thế kỷ XX.',
    thumbnailUrl: null,
    displayOrder: 5,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause:
        'Khủng hoảng của chế độ phong kiến Mạc phủ Tokugawa và sức ép từ các hiệp ước bất bình đẳng của phương Tây.',
      outcome:
        'Nhật Bản chuyển mình thành cường quốc tư bản công nghiệp hiện đại duy nhất ở châu Á thế kỷ XIX.',
      sources: [wiki('Minh_Trị_Duy_tân')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'chien-tranh-the-gioi-thu-nhat-1914-1918',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    locationSlug: null,
    parentSlug: null,
    title: 'Chiến tranh Thế giới thứ nhất (Đại chiến Thế giới lần thứ nhất)',
    startYear: 1914,
    startMonth: 7,
    startDay: 28,
    endYear: 1918,
    endMonth: 11,
    endDay: 11,
    eventDateNote: '28/07/1914 – 11/11/1918.',
    summary:
      'Cuộc chiến tranh đế quốc quy mô toàn cầu đầu tiên giữa khối Hiệp ước (Entente) và khối Liên minh Trung tâm, làm sụp đổ 4 đế quốc lớn.',
    description:
      'Bùng nổ sau vụ ám sát Thái tử Áo – Hung tại Sarajevo năm 1914, Chiến tranh Thế giới thứ nhất lôi cuốn hơn 30 quốc gia tham chiến với chiến tranh chiến hào khốc liệt tại châu Âu. Cuộc chiến kết thúc ngày 11/11/1918 với thất bại của phe Liên minh Trung tâm, dẫn đến sự sụp đổ của 4 đế quốc (Nga hoàng, Đức, Áo – Hung, Ottoman) và làm bùng nổ Cách mạng Tháng Mười Nga năm 1917.',
    thumbnailUrl: null,
    displayOrder: 6,
    category: EventCategory.WAR,
    metadata: {
      cause:
        'Mâu thuẫn gay gắt giữa các đế quốc già (Anh, Pháp) và đế quốc trẻ (Đức, Áo – Hung) về vấn đề phân chia thuộc địa và thị trường thế giới.',
      outcome:
        'Khối Hiệp ước thắng trận; 4 đế quốc phong kiến – quân phiệt sụp đổ; Cách mạng Tháng Mười Nga thắng lợi năm 1917.',
      sources: [wiki('Chiến_tranh_thế_giới_thứ_nhất')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'hoa-uoc-versailles-1919',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    locationSlug: 'cung-dien-versailles',
    parentSlug: null,
    title: 'Ký kết Hòa ước Versailles thiết lập trật tự thế giới sau Thế chiến I',
    startYear: 1919,
    startMonth: 6,
    startDay: 28,
    endYear: 1919,
    eventDateNote: 'Ngày 28/06/1919 tại Cung điện Versailles (Pháp).',
    summary:
      'Các cường quốc thắng trận ký Hòa ước Versailles với Đức và thành lập Hội Quốc Liên; cũng tại hội nghị này Nguyễn Ái Quốc đã gửi Bản Yêu sách của nhân dân An Nam.',
    description:
      'Hòa ước Versailles được ký kết ngày 28/06/1919 tại Cung điện Versailles (Pháp), chính thức khép lại Chiến tranh Thế giới thứ nhất và xác lập hệ thống Versailles – Washington. Tại Hội nghị Versailles tháng 6/1919, nhà yêu nước Nguyễn Ái Quốc (Hồ Chí Minh) đã thay mặt Hội những người An Nam yêu nước tại Pháp gửi tới hội nghị "Bản Yêu sách của nhân dân An Nam" gồm 8 điểm đòi quyền tự do, dân chủ cho dân tộc Việt Nam.',
    thumbnailUrl: null,
    displayOrder: 7,
    category: EventCategory.TREATY,
    metadata: {
      cause:
        'Kết thúc Chiến tranh Thế giới thứ nhất, các nước thắng trận họp tại Paris để phân chia lại bản đồ thế giới.',
      outcome:
        'Hình thành trật tự Versailles – Washington và Hội Quốc Liên; tuy nhiên những điều khoản khắc nghiệt áp đặt lên Đức đã gieo mầm cho Thế chiến II.',
      sources: [wiki('Hòa_ước_Versailles')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'chien-tranh-the-gioi-thu-hai-1939-1945',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    locationSlug: null,
    parentSlug: null,
    title: 'Chiến tranh Thế giới thứ hai chống chủ nghĩa phát xít',
    startYear: 1939,
    startMonth: 9,
    startDay: 1,
    endYear: 1945,
    endMonth: 9,
    endDay: 2,
    eventDateNote: '01/09/1939 – 02/09/1945.',
    summary:
      'Cuộc chiến tranh lớn nhất trong lịch sử nhân loại giữa khối Đồng minh chống phát xít (trụ cột là Liên Xô, Mỹ, Anh) và khối Trục phát xít (Đức, Ý, Nhật).',
    description:
      'Khởi đầu ngày 01/09/1939 khi phát xít Đức tấn công Ba Lan và kết thúc ngày 02/09/1945 khi Nhật Bản ký văn kiện đầu hàng vô điều kiện. Thắng lợi vĩ đại của phe Đồng minh — trong đó Liên Xô giữ vai trò lực lượng chủ lực tiêu diệt phát xít Đức ở châu Âu và đánh tan đạo quân Quan Đông ở châu Á — đã tạo thời cơ lịch sử thuận lợi cho Cách mạng Tháng Tám năm 1945 tại Việt Nam giành thắng lợi.',
    thumbnailUrl: null,
    displayOrder: 8,
    category: EventCategory.WAR,
    metadata: {
      cause:
        'Sự trỗi dậy và chính sách bành trướng xâm lược của chủ nghĩa phát xít Đức, Ý và quân phiệt Nhật Bản sau cuộc Đại suy thoái 1929–1933.',
      outcome:
        'Chủ nghĩa phát xít bị tiêu diệt hoàn toàn; Liên Hợp Quốc ra đời; cao trào giải phóng dân tộc bùng nổ mạnh mẽ ở Á, Phi, Mỹ Latinh.',
      sources: [wiki('Chiến_tranh_thế_giới_thứ_hai')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'tran-tran-chau-cang-1941',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    locationSlug: 'tran-chau-cang',
    parentSlug: 'chien-tranh-the-gioi-thu-hai-1939-1945',
    title: 'Cuộc tập kích Trân Châu Cảng mở rộng Thế chiến II sang Thái Bình Dương',
    startYear: 1941,
    startMonth: 12,
    startDay: 7,
    endYear: 1941,
    eventDateNote: 'Sáng ngày 07/12/1941 tại Hawaii.',
    summary:
      'Không quân Hải quân Đế quốc Nhật Bản bất ngờ tấn công căn cứ Trân Châu Cảng, đưa Hoa Kỳ trực tiếp bước vào Chiến tranh Thế giới thứ hai.',
    description:
      'Rạng sáng ngày 07/12/1941, hạm đội tàu sân bay của Hải quân Đế quốc Nhật Bản bất ngờ oanh tạc Trân Châu Cảng (Hawaii), đánh chìm và làm hư hại nặng nhiều thiết giáp hạm của Hạm đội Thái Bình Dương Hoa Kỳ. Ngay ngày hôm sau, Tổng thống Franklin D. Roosevelt và Quốc hội Mỹ tuyên chiến với Nhật Bản, thúc đẩy sự hình thành Mặt trận Đồng minh chống phát xít trên phạm vi toàn cầu.',
    thumbnailUrl: null,
    displayOrder: 9,
    category: EventCategory.BATTLE,
    metadata: {
      cause:
        'Tham vọng bá chủ khu vực châu Á – Thái Bình Dương của quân phiệt Nhật Bản và lệnh cấm vận dầu mỏ từ Hoa Kỳ.',
      outcome:
        'Chiến tranh Thái Bình Dương bùng nổ; Hoa Kỳ chính thức tham gia khối Đồng minh chống phát xít.',
      sources: [wiki('Trận_Trân_Châu_Cảng')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'chien-dich-do-bo-normandy-1944',
    periodSlug: PERIOD_SLUGS.WORLD_TWO_WORLD_WARS,
    locationSlug: 'bai-bien-normandy',
    parentSlug: 'chien-tranh-the-gioi-thu-hai-1939-1945',
    title: 'Chiến dịch Đổ bộ Normandy (D-Day) mở Mặt trận thứ hai ở Tây Âu',
    startYear: 1944,
    startMonth: 6,
    startDay: 6,
    endYear: 1944,
    endMonth: 8,
    endDay: 30,
    eventDateNote: 'Ngày D-Day: 06/06/1944.',
    summary:
      'Quân đội Đồng minh Anh – Mỹ – Canada đổ bộ lên bờ biển Normandy (Pháp), mở Mặt trận thứ hai phối hợp với đà tổng phản công của Hồng quân Liên Xô từ phía Đông.',
    description:
      'Thực hiện cam kết với Liên Xô tại Hội nghị Tehran (1943), ngày 06/06/1944 lực lượng Đồng minh phương Tây tiến hành Chiến dịch Overlord đổ bộ hơn 156.000 binh sĩ qua eo biển Manche lên 5 bãi biển vùng Normandy. Chiến dịch giải phóng nước Pháp và đặt phát xít Đức vào thế bị kẹp giữa hai gọng kìm Đông – Tây.',
    thumbnailUrl: null,
    displayOrder: 10,
    category: EventCategory.BATTLE,
    metadata: {
      cause:
        'Quyết định mở Mặt trận thứ hai tại Tây Âu của liên minh Tam cường nhằm nhanh chóng đập tan nước Đức Quốc xã.',
      outcome:
        'Giải phóng Paris và Tây Âu, tiến thẳng vào biên giới phía Tây nước Đức.',
      sources: [wiki('Trận_Normandie')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'hoi-nghi-yalta-va-thanh-lap-lien-hop-quoc-1945',
    periodSlug: PERIOD_SLUGS.WORLD_COLD_WAR_MULTIPOLAR,
    locationSlug: 'cung-dien-livadia-yalta',
    parentSlug: null,
    title: 'Hội nghị Thượng đỉnh Yalta và sự ra đời của Liên Hợp Quốc',
    startYear: 1945,
    startMonth: 2,
    startDay: 4,
    endYear: 1945,
    endMonth: 10,
    endDay: 24,
    eventDateNote: 'Hội nghị Yalta (02/1945) & Hiến chương LHQ có hiệu lực (24/10/1945).',
    summary:
      'Nguyên thủ ba cường quốc Liên Xô (Stalin), Mỹ (Roosevelt) và Anh (Churchill) họp tại Yalta, quyết định tiêu diệt tận gốc chủ nghĩa phát xít, lập Liên Hợp Quốc và định hình Trật tự hai cực Ianta.',
    description:
      'Từ ngày 04 đến 11/02/1945 tại Cung điện Livadia (Yalta), Hội nghị Thượng đỉnh Tam cường đã thống nhất ba quyết định lịch sử: tiêu diệt tận gốc chủ nghĩa phát xít Đức và quân phiệt Nhật (Liên Xô cam kết tham chiến chống Nhật sau khi Đức đầu hàng); thành lập Tổ chức Liên Hợp Quốc để duy trì hòa bình thế giới; và thỏa thuận đóng quân, phân chia phạm vi ảnh hưởng ở châu Âu và châu Á, hình thành khuôn khổ Trật tự thế giới hai cực Ianta (1945–1991).',
    thumbnailUrl: null,
    displayOrder: 11,
    category: EventCategory.SUMMIT_CONFERENCE,
    metadata: {
      cause:
        'Chiến tranh Thế giới thứ hai bước vào giai đoạn kết thúc, đặt ra yêu cầu cấp bách về tổ chức lại trật tự thế giới sau chiến tranh.',
      outcome:
        'Ra đời Tổ chức Liên Hợp Quốc (24/10/1945) và xác lập Trật tự hai cực Ianta do Liên Xô và Mỹ đứng đầu mỗi cực.',
      sources: [wiki('Hội_nghị_Yalta'), wiki('Liên_Hợp_Quốc')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'sup-do-buc-tuong-berlin-1989',
    periodSlug: PERIOD_SLUGS.WORLD_COLD_WAR_MULTIPOLAR,
    locationSlug: 'buc-tuong-berlin',
    parentSlug: null,
    title: 'Sự kiện sụp đổ Bức tường Berlin và tái thống nhất nước Đức',
    startYear: 1989,
    startMonth: 11,
    startDay: 9,
    endYear: 1990,
    endMonth: 10,
    endDay: 3,
    eventDateNote: 'Đêm 09/11/1989 mở cửa Bức tường Berlin; 03/10/1990 nước Đức thống nhất.',
    summary:
      'Bức tường Berlin bị dỡ bỏ sau 28 năm chia cắt, mở đường cho sự thống nhất nước Đức và báo hiệu sự kết thúc của Chiến tranh Lạnh ở châu Âu.',
    description:
      'Tối ngày 09/11/1989, trước làn sóng biến chuyển chính trị sâu sắc tại Đông Âu, chính quyền Cộng hòa Dân chủ Đức tuyên bố mở cửa biên giới qua Bức tường Berlin. Hàng vạn người dân Đông và Tây Berlin đã đổ về Cổng Brandenburg dỡ bỏ bức tường chia cắt kéo dài từ năm 1961, tiến tới ngày tái thống nhất nước Đức (03/10/1990).',
    thumbnailUrl: null,
    displayOrder: 12,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause:
        'Khủng hoảng kinh tế – chính trị tại Đông Âu cuối thập niên 1980 và chính sách đối ngoại mới trong thời kỳ Cải tổ.',
      outcome:
        'Nước Đức tái thống nhất (1990), chấm dứt sự đối đầu khối quân sự Đông – Tây tại trung tâm châu Âu.',
      sources: [wiki('Bức_tường_Berlin')],
    },
    status: ContentStatus.PUBLISHED,
  },

  // =========================================================================
  // PHẦN B: SỰ KIỆN LỊCH SỬ LIÊN XÔ (8 SỰ KIỆN TRỌNG ĐẠI)
  // =========================================================================
  {
    slug: 'cach-mang-thang-muoi-nga-1917',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    locationSlug: 'cung-dien-mua-dong',
    parentSlug: null,
    title: 'Cách mạng Tháng Mười Nga vĩ đại thắng lợi tại Petrograd',
    startYear: 1917,
    startMonth: 11,
    startDay: 7,
    endYear: 1917,
    eventDateNote:
      'Ngày 25/10/1917 theo lịch Julius (tức ngày 07/11/1917 theo lịch Gregorius hiện hành).',
    summary:
      'Dưới sự lãnh đạo của V.I. Lenin và Đảng Bolshevik, công nhân, binh lính và thủy thủ Nga khởi nghĩa vũ trang chiếm Cung điện Mùa Đông, lập nên Nhà nước Xô viết công nông đầu tiên trên thế giới.',
    description:
      'Đêm 24 rạng sáng 25/10/1917 (tức 07/11/1917 dương lịch), theo tiếng pháo hiệu từ tuần dương hạm Rạng Đông (Aurora), lực lượng Cận vệ Đỏ cùng công nhân và binh lính cách mạng tại thủ đô Petrograd đã tấn công chiếm Cung điện Mùa Đông, bắt giữ các bộ trưởng của Chính phủ Lâm thời tư sản. Đại hội Xô viết toàn Nga lần thứ II tuyên bố thành lập Chính phủ Xô viết do V.I. Lenin đứng đầu và thông qua "Sắc lệnh Hòa bình" cùng "Sắc lệnh Ruộng đất". Cách mạng Tháng Mười đã mở ra thời đại giải phóng dân tộc gắn liền với chủ nghĩa xã hội, có ảnh hưởng quyết định đến con đường cách mạng Việt Nam.',
    thumbnailUrl: null,
    displayOrder: 1,
    category: EventCategory.REVOLUTION,
    metadata: {
      cause:
        'Khủng hoảng toàn diện của nước Nga trong Thế chiến I và việc Chính phủ Lâm thời tư sản tiếp tục theo đuổi chiến tranh đế quốc.',
      outcome:
        'Ra đời Nhà nước Xô viết công nông đầu tiên trên thế giới, cổ vũ mạnh mẽ phong trào giải phóng dân tộc ở các nước thuộc địa.',
      sources: [wiki('Cách_mạng_Tháng_Mười')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'thanh-lap-lien-bang-xo-viet-1922',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    locationSlug: 'dien-kremlin-quang-truong-do',
    parentSlug: null,
    title:
      'Thành lập Liên bang Cộng hòa Xã hội Chủ nghĩa Xô viết (Liên Xô - USSR)',
    startYear: 1922,
    startMonth: 12,
    startDay: 30,
    endYear: 1922,
    eventDateNote: 'Ngày 30/12/1922 tại Đại hội Xô viết toàn Liên bang lần thứ nhất ở Moskva.',
    summary:
      'Đại hội Xô viết toàn Liên bang lần thứ nhất thông qua Tuyên ngôn và Hiệp ước thành lập Liên bang Cộng hòa Xã hội Chủ nghĩa Xô viết (Liên Xô) trên cơ sở bình đẳng, tự nguyện.',
    description:
      'Sau khi Hồng quân đánh bại thù trong giặc ngoài (14 nước đế quốc can thiệp vũ trang) trong cuộc Nội chiến (1918–1920), ngày 30/12/1922 tại thủ đô Moskva, theo tư tưởng chỉ đạo của V.I. Lenin, bốn nước cộng hòa Xô viết đầu tiên gồm Nga (RSFSR), Ukraina, Belarus và Ngoại Kavkaz đã ký Hiệp ước thành lập Liên bang Cộng hòa Xã hội Chủ nghĩa Xô viết (gọi tắt là Liên Xô). Về sau Liên bang mở rộng lên 15 nước cộng hòa thành viên.',
    thumbnailUrl: null,
    displayOrder: 2,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause:
        'Yêu cầu liên minh chặt chẽ về quân sự, kinh tế và chính trị giữa các nước Cộng hòa Xô viết để khôi phục đất nước và xây dựng chủ nghĩa xã hội.',
      outcome:
        'Hình thành nhà nước liên bang xã hội chủ nghĩa đa sắc tộc rộng lớn nhất thế giới với thủ đô đặt tại Moskva.',
      sources: [wiki('Liên_Xô')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'chien-tranh-ve-quoc-vi-dai-1941-1945',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    locationSlug: 'dien-kremlin-quang-truong-do',
    parentSlug: null,
    title: 'Cuộc Chiến tranh Vệ quốc Vĩ đại của nhân dân Liên Xô (1941 – 1945)',
    startYear: 1941,
    startMonth: 6,
    startDay: 22,
    endYear: 1945,
    endMonth: 5,
    endDay: 9,
    eventDateNote: '22/06/1941 – 09/05/1945 (1.418 ngày đêm chiến đấu).',
    summary:
      'Cuộc chiến đấu anh dũng của Hồng quân và nhân dân Liên Xô đập tan cuộc xâm lược Barbarossa của phát xít Đức, giải phóng Đông Âu và kết thúc bằng Ngày Chiến thắng 09/05/1945.',
    description:
      'Rạng sáng 22/06/1941, phát xít Đức bội ước huy động 5,5 triệu quân tràn qua biên giới mở Chiến dịch Barbarossa tấn công Liên Xô. Trải qua 1.418 ngày đêm chiến đấu kiên cường với sự hy sinh của khoảng 27 triệu quân dân Xô viết, Hồng quân Liên Xô đã chặn đứng quân Đức trước cửa ngõ Moskva (1941), tạo bước ngoặt tại Stalingrad (1942–1943) và Kursk (1943), giải phóng hoàn toàn lãnh thổ cùng nhiều quốc gia châu Âu và tiến công sào huyệt Berlin buộc phát xít Đức đầu hàng ngày 09/05/1945.',
    thumbnailUrl: null,
    displayOrder: 3,
    category: EventCategory.WAR,
    metadata: {
      cause:
        'Phát xít Đức đơn phương xé bỏ Hiệp ước không xâm phạm Xô – Đức, phát động Chiến dịch Barbarossa xâm lược Liên Xô ngày 22/06/1941.',
      outcome:
        'Liên Xô bảo vệ vững chắc Tổ quốc xã hội chủ nghĩa, tiêu diệt lực lượng chủ lực của phát xít Đức và nâng cao uy tín quốc tế.',
      sources: [wiki('Chiến_tranh_Xô-Đức')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'tran-stalingrad-1942-1943',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    locationSlug: 'thanh-pho-stalingrad',
    parentSlug: 'chien-tranh-ve-quoc-vi-dai-1941-1945',
    title:
      'Chiến thắng Stalingrad — Bước ngoặt xoay chuyển Chiến tranh Thế giới thứ hai',
    startYear: 1942,
    startMonth: 7,
    startDay: 17,
    endYear: 1943,
    endMonth: 2,
    endDay: 2,
    eventDateNote: '17/07/1942 – 02/02/1943 (200 ngày đêm).',
    summary:
      'Hồng quân Liên Xô tiến hành Chiến dịch Sao Thiên Vương phản công bao vây và tiêu diệt 33 vạn quân tinh nhuệ của Tập đoàn quân số 6 phát xít Đức tại Stalingrad.',
    description:
      'Sau hơn 4 tháng phòng ngự kiên cường từng góc phố, căn nhà bên bờ sông Volga, ngày 19/11/1942 Hồng quân Liên Xô dưới sự điều phối của Đại bản doanh và Nguyên soái Georgy Zhukov đã mở Chiến dịch phản công Sao Thiên Vương (Uranus), hợp vây 22 sư đoàn Đức. Ngày 02/02/1943, Thống chế Friedrich Paulus cùng toàn bộ tàn quân Tập đoàn quân số 6 Đức phải hạ vũ khí đầu hàng. Chiến thắng Stalingrad đánh dấu bước ngoặt căn bản đưa Hồng quân chuyển sang tổng phản công chiến lược.',
    thumbnailUrl: null,
    displayOrder: 4,
    category: EventCategory.BATTLE,
    metadata: {
      cause:
        'Quân Đức mở chiến dịch tiến đánh Stalingrad nhằm cắt đứt huyết mạch giao thông sông Volga và chiếm vùng dầu mỏ Kavkaz của Liên Xô.',
      outcome:
        'Tiêu diệt và bắt sống khoảng 330.000 quân tinh nhuệ phe Trục, làm xoay chuyển hoàn toàn cục diện Thế chiến II.',
      sources: [wiki('Trận_Stalingrad')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'chien-dich-berlin-1945',
    periodSlug: PERIOD_SLUGS.SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR,
    locationSlug: null,
    parentSlug: 'chien-tranh-ve-quoc-vi-dai-1941-1945',
    title:
      'Chiến dịch Công phá Berlin và Lá cờ Chiến thắng trên nóc tòa nhà Quốc hội Đức',
    startYear: 1945,
    startMonth: 4,
    startDay: 16,
    endYear: 1945,
    endMonth: 5,
    endDay: 9,
    eventDateNote: '16/04/1945 – 09/05/1945.',
    summary:
      'Ba Phương diện quân Hồng quân Liên Xô tổng công kích sào huyệt Berlin, cắm Cờ Chiến thắng trên nóc Reichstag và buộc phát xít Đức ký văn kiện đầu hàng vô điều kiện.',
    description:
      'Ngày 16/04/1945, Phương diện quân Belarus 1 (Nguyên soái Zhukov), Phương diện quân Ukraina 1 (Nguyên soái Konev) và Phương diện quân Belarus 2 (Nguyên soái Rokossovsky) với 2,5 triệu quân mở cuộc tổng công kích vào Berlin. Ngày 30/04/1945, các chiến sĩ Hồng quân đã cắm Lá cờ Chiến thắng đỏ thắm búa liềm lên nóc tòa nhà Quốc hội Đức (Reichstag). Đêm 08/05 rạng sáng 09/05/1945 (giờ Moskva), phát xít Đức ký văn kiện đầu hàng không điều kiện, chấm dứt chiến tranh ở châu Âu.',
    thumbnailUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Raising_a_flag_over_the_Reichstag_-_Restoration.jpg/800px-Raising_a_flag_over_the_Reichstag_-_Restoration.jpg',
    displayOrder: 5,
    category: EventCategory.BATTLE,
    metadata: {
      cause:
        'Đòn quyết chiến chiến lược cuối cùng của Hồng quân Liên Xô nhằm đập tan cơ quan đầu não Đế chế thứ ba tại Berlin.',
      outcome:
        'Chế độ Quốc xã Hitler sụp đổ hoàn toàn; ngày 09/05 trở thành Ngày Chiến thắng (Victory Day) của Liên Xô và nhân loại tiến bộ.',
      sources: [wiki('Chiến_dịch_Berlin')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'lien-xo-phong-ve-tinh-sputnik-1-1957',
    periodSlug: PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA,
    locationSlug: 'san-bay-vu-tru-baikonur',
    parentSlug: null,
    title:
      'Liên Xô phóng thành công Sputnik 1 — Vệ tinh nhân tạo đầu tiên của Trái Đất',
    startYear: 1957,
    startMonth: 10,
    startDay: 4,
    endYear: 1957,
    eventDateNote: 'Ngày 04/10/1957 tại Sân bay vũ trụ Baikonur.',
    summary:
      'Liên Xô phóng thành công vệ tinh nhân tạo Sputnik 1 lên quỹ đạo tầm thấp của Trái Đất, chính thức mở đầu Kỷ nguyên Vũ trụ của nhân loại.',
    description:
      'Ngày 04/10/1957, tên lửa đẩy R-7 Semyorka phóng từ Sân bay vũ trụ Baikonur đã đưa vệ tinh nhân tạo đầu tiên mang tên Sputnik 1 (nặng 83,6 kg) bay vào quỹ đạo Trái Đất và phát tín hiệu vô tuyến về mặt đất. Thành tựu khoa học – kỹ thuật đột phá này khẳng định vị thế đi đầu của Liên Xô trong lĩnh vực tên lửa – không gian và khởi đầu kỷ nguyên chinh phục vũ trụ.',
    thumbnailUrl: null,
    displayOrder: 6,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause:
        'Sự phát triển vượt bậc của ngành tên lửa và khoa học vũ trụ Liên Xô dưới sự dẫn dắt của Tổng công trình sư Sergei Korolev.',
      outcome:
        'Mở đầu Kỷ nguyên Vũ trụ và tạo tiền đề trực tiếp cho các chuyến bay có người lái vào không gian.',
      sources: [wiki('Sputnik_1')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'yuri-gagarin-bay-vao-vu-tru-1961',
    periodSlug: PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA,
    locationSlug: 'san-bay-vu-tru-baikonur',
    parentSlug: null,
    title:
      'Chuyến bay lịch sử của Yuri Gagarin trên tàu Vostok 1 đưa con người vào vũ trụ',
    startYear: 1961,
    startMonth: 4,
    startDay: 12,
    endYear: 1961,
    eventDateNote: 'Ngày 12/04/1961 (108 phút bay vòng quanh Trái Đất).',
    summary:
      'Phi hành gia Liên Xô Yuri Gagarin trên tàu vũ trụ Vostok 1 bay một vòng quanh quỹ đạo Trái Đất, trở thành người đầu tiên trong lịch sử nhân loại bay vào không gian.',
    description:
      'Lúc 09 giờ 07 phút sáng ngày 12/04/1961 (giờ Moskva), tàu vũ trụ Vostok 1 (Phương Đông 1) rời bệ phóng tại Sân bay vũ trụ Baikonur, đưa nhà du hành vũ trụ 27 tuổi Yuri Alekseyevich Gagarin lên quỹ đạo Trái Đất. Sau 108 phút bay vòng quanh hành tinh ở độ cao hơn 300 km, Gagarin hạ cánh an toàn tại vùng Saratov. Năm 1980, thông qua chương trình Interkosmos của Liên Xô, phi công Phạm Tuân của Việt Nam cùng nhà du hành Viktor Gorbatko cũng đã bay vào vũ trụ trên tàu Soyuz 37 từ chính Baikonur.',
    thumbnailUrl: null,
    displayOrder: 7,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause:
        'Tiếp nối thành công của vệ tinh Sputnik và chương trình tàu vũ trụ có người lái Vostok của Liên Xô.',
      outcome:
        'Lần đầu tiên con người thoát khỏi lực hấp dẫn Trái Đất bay vào vũ trụ; ngày 12/04 trở thành Ngày Vũ trụ Quốc tế.',
      sources: [wiki('Vostok_1'), wiki('Yuri_Alekseyevich_Gagarin')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'su-tan-ra-cua-lien-bang-xo-viet-1991',
    periodSlug: PERIOD_SLUGS.SOVIET_COLD_WAR_SPACE_ERA,
    locationSlug: 'dien-kremlin-quang-truong-do',
    parentSlug: null,
    title:
      'Công cuộc Cải tổ (Perestroika) và sự tan rã của Liên bang Xô viết',
    startYear: 1985,
    startMonth: 3,
    startDay: 11,
    endYear: 1991,
    endMonth: 12,
    endDay: 26,
    eventDateNote: 'Tối 25/12/1991 lá cờ đỏ búa liềm hạ xuống trên Điện Kremlin.',
    summary:
      'Sau 6 năm thực hiện đường lối Cải tổ (1985–1991) lâm vào khủng hoảng toàn diện, Liên bang Cộng hòa Xã hội Chủ nghĩa Xô viết chấm dứt tồn tại sau 69 năm lịch sử, khép lại Trật tự hai cực Ianta.',
    description:
      'Từ tháng 3/1985, Tổng Bí thư Mikhail Gorbachev tiến hành đường lối Cải tổ (Perestroika) nhằm khắc phục tình trạng trì trệ kinh tế sau khủng hoảng dầu mỏ thế giới thập niên 1970. Tuy nhiên, những sai lầm chủ quan trong cải cách kinh tế – chính trị đã làm đất nước rơi vào khủng hoảng trầm trọng và xung đột sắc tộc. Ngày 21/12/1991, 11 nước cộng hòa ký Tuyên bố Alma-Ata thành lập Cộng đồng các Quốc gia Độc lập (SNG). Tối 25/12/1991, Gorbachev tuyên bố từ chức Tổng thống Liên Xô và lá cờ Liên bang Xô viết được hạ xuống khỏi nóc Điện Kremlin, chấm dứt Chiến tranh Lạnh và chuyển thế giới sang xu thế đa cực.',
    thumbnailUrl: null,
    displayOrder: 8,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause:
        'Sự trì trệ kéo dài của mô hình kinh tế tập trung quan liêu bao cấp kết hợp với những sai lầm nghiêm trọng trong quá trình Cải tổ (Perestroika) và sự chống phá của các thế lực thù địch.',
      outcome:
        'Liên bang Xô viết tan rã thành 15 quốc gia độc lập (Liên bang Nga kế thừa tư cách pháp lý tại Hội đồng Bảo an LHQ); Trật tự hai cực Ianta chấm dứt.',
      sources: [wiki('Sự_tan_rã_của_Liên_Xô')],
    },
    status: ContentStatus.PUBLISHED,
  },
];

/**
 * 4. ĐỒ THỊ QUAN HỆ THẾ GIỚI & LIÊN XÔ (RELATIONS)
 */
const RAW_WORLD_SOVIET_RELATIONS: IRelationsSeedDataset = {
  eventEntityRelations: [
    // --- Thế giới ---
    linkEventEntity(
      'tuyen-ngon-doc-lap-hoa-ky-1776',
      'george-washington',
      EVENT_ENTITY_ROLES.LEADER,
      'Tổng tư lệnh Quân đội Lục địa lãnh đạo cuộc chiến giành độc lập',
      1,
    ),
    linkEventEntity(
      'dai-cach-mang-phap-1789',
      'cung-dien-versailles',
      EVENT_ENTITY_ROLES.LOCATION,
      'Nơi triệu tập Hội nghị Ba đẳng cấp và Quốc hội Lập hiến Pháp',
      1,
    ),
    linkEventEntity(
      'tran-waterloo-1815',
      'napoleon-bonaparte',
      EVENT_ENTITY_ROLES.COMMANDER,
      'Hoàng đế Pháp trực tiếp chỉ huy quân đội tại Waterloo',
      1,
    ),
    linkEventEntity(
      'cuoc-duy-tan-minh-tri-1868',
      'thien-hoang-minh-tri',
      EVENT_ENTITY_ROLES.LEADER,
      'Thiên hoàng khởi xướng và chủ trì công cuộc Duy tân Minh Trị',
      1,
    ),
    linkEventEntity(
      'hoa-uoc-versailles-1919',
      'cung-dien-versailles',
      EVENT_ENTITY_ROLES.LOCATION,
      'Sảnh Gương (Hall of Mirrors) nơi ký Hòa ước Versailles',
      1,
    ),
    linkEventEntity(
      'chien-tranh-the-gioi-thu-hai-1939-1945',
      'joseph-stalin',
      EVENT_ENTITY_ROLES.LEADER,
      'Tổng Tư lệnh Tối cao Liên Xô trong liên minh chống phát xít',
      1,
    ),
    linkEventEntity(
      'chien-tranh-the-gioi-thu-hai-1939-1945',
      'franklin-d-roosevelt',
      EVENT_ENTITY_ROLES.LEADER,
      'Tổng thống Hoa Kỳ trong liên minh Đồng minh chống phát xít',
      2,
      true,
    ),
    linkEventEntity(
      'chien-tranh-the-gioi-thu-hai-1939-1945',
      'winston-churchill',
      EVENT_ENTITY_ROLES.LEADER,
      'Thủ tướng Vương quốc Anh trong liên minh Đồng minh',
      3,
      false,
    ),
    linkEventEntity(
      'chien-tranh-the-gioi-thu-hai-1939-1945',
      'hong-quan-lien-xo',
      EVENT_ENTITY_ROLES.PARTICIPANT,
      'Lực lượng vũ trang chủ lực tiêu diệt quân đội phát xít trên chiến trường châu Âu',
      4,
      false,
    ),
    linkEventEntity(
      'tran-tran-chau-cang-1941',
      'franklin-d-roosevelt',
      EVENT_ENTITY_ROLES.LEADER,
      'Tổng thống Mỹ đọc diễn văn tuyên chiến sau cuộc tập kích',
      1,
    ),
    linkEventEntity(
      'tran-tran-chau-cang-1941',
      'tran-chau-cang',
      EVENT_ENTITY_ROLES.LOCATION,
      'Căn cứ Hạm đội Thái Bình Dương bị tập kích',
      2,
      true,
    ),
    linkEventEntity(
      'chien-dich-do-bo-normandy-1944',
      'franklin-d-roosevelt',
      EVENT_ENTITY_ROLES.INITIATOR,
      'Nguyên thủ Hoa Kỳ phê chuẩn Chiến dịch Overlord',
      1,
    ),
    linkEventEntity(
      'chien-dich-do-bo-normandy-1944',
      'winston-churchill',
      EVENT_ENTITY_ROLES.INITIATOR,
      'Thủ tướng Anh đồng tổ chức cuộc đổ bộ mở Mặt trận thứ hai',
      2,
      true,
    ),
    linkEventEntity(
      'chien-dich-do-bo-normandy-1944',
      'bai-bien-normandy',
      EVENT_ENTITY_ROLES.LOCATION,
      'Khu vực bờ biển đổ bộ của quân Đồng minh',
      3,
      true,
    ),
    linkEventEntity(
      'hoi-nghi-yalta-va-thanh-lap-lien-hop-quoc-1945',
      'joseph-stalin',
      EVENT_ENTITY_ROLES.SIGNATORY,
      'Đại diện Liên Xô chủ trì Hội nghị Thượng đỉnh Yalta',
      1,
    ),
    linkEventEntity(
      'hoi-nghi-yalta-va-thanh-lap-lien-hop-quoc-1945',
      'franklin-d-roosevelt',
      EVENT_ENTITY_ROLES.SIGNATORY,
      'Đại diện Hoa Kỳ tại Hội nghị Thượng đỉnh Yalta',
      2,
      true,
    ),
    linkEventEntity(
      'hoi-nghi-yalta-va-thanh-lap-lien-hop-quoc-1945',
      'winston-churchill',
      EVENT_ENTITY_ROLES.SIGNATORY,
      'Đại diện Vương quốc Anh tại Hội nghị Thượng đỉnh Yalta',
      3,
      true,
    ),
    linkEventEntity(
      'hoi-nghi-yalta-va-thanh-lap-lien-hop-quoc-1945',
      'lien-hop-quoc',
      EVENT_ENTITY_ROLES.PARTICIPANT,
      'Tổ chức quốc tế được quyết định thành lập từ hội nghị',
      4,
      false,
    ),
    linkEventEntity(
      'hoi-nghi-yalta-va-thanh-lap-lien-hop-quoc-1945',
      'cung-dien-livadia-yalta',
      EVENT_ENTITY_ROLES.LOCATION,
      'Nơi diễn ra Hội nghị Thượng đỉnh Yalta',
      5,
      false,
    ),
    linkEventEntity(
      'sup-do-buc-tuong-berlin-1989',
      'buc-tuong-berlin',
      EVENT_ENTITY_ROLES.LOCATION,
      'Công trình biên giới chia cắt Đông và Tây Berlin được mở cửa',
      1,
    ),
    linkEventEntity(
      'sup-do-buc-tuong-berlin-1989',
      'mikhail-gorbachev',
      EVENT_ENTITY_ROLES.PARTICIPANT,
      'Nhà lãnh đạo Liên Xô chấp thuận tiến trình tái thống nhất nước Đức',
      2,
      false,
    ),

    // --- Liên Xô ---
    linkEventEntity(
      'cach-mang-thang-muoi-nga-1917',
      'vladimir-ilyich-lenin',
      EVENT_ENTITY_ROLES.LEADER,
      'Lãnh tụ tối cao trực tiếp chỉ đạo cuộc khởi nghĩa vũ trang tại Petrograd',
      1,
    ),
    linkEventEntity(
      'cach-mang-thang-muoi-nga-1917',
      'joseph-stalin',
      EVENT_ENTITY_ROLES.PARTICIPANT,
      'Ủy viên Trung ương Đảng Bolshevik tham gia lãnh đạo khởi nghĩa',
      2,
      false,
    ),
    linkEventEntity(
      'cach-mang-thang-muoi-nga-1917',
      'cung-dien-mua-dong',
      EVENT_ENTITY_ROLES.LOCATION,
      'Trụ sở Chính phủ Lâm thời tư sản bị quân khởi nghĩa đánh chiếm',
      3,
      true,
    ),
    linkEventEntity(
      'thanh-lap-lien-bang-xo-viet-1922',
      'vladimir-ilyich-lenin',
      EVENT_ENTITY_ROLES.LEADER,
      'Người đề xướng nguyên tắc bình đẳng, tự nguyện thành lập Liên bang Xô viết và giữ chức Chủ tịch Hội đồng Dân ủy',
      1,
    ),
    linkEventEntity(
      'thanh-lap-lien-bang-xo-viet-1922',
      'joseph-stalin',
      EVENT_ENTITY_ROLES.SIGNATORY,
      'Tổng Bí thư trình bày báo cáo thành lập Liên bang tại Đại hội Xô viết',
      2,
      false,
    ),
    linkEventEntity(
      'thanh-lap-lien-bang-xo-viet-1922',
      'dien-kremlin-quang-truong-do',
      EVENT_ENTITY_ROLES.LOCATION,
      'Thủ đô Moskva và trung tâm chính trị của Liên bang Xô viết',
      3,
      true,
    ),
    linkEventEntity(
      'chien-tranh-ve-quoc-vi-dai-1941-1945',
      'joseph-stalin',
      EVENT_ENTITY_ROLES.LEADER,
      'Chủ tịch Hội đồng Quốc phòng Nhà nước kiêm Tổng Tư lệnh Tối cao',
      1,
    ),
    linkEventEntity(
      'chien-tranh-ve-quoc-vi-dai-1941-1945',
      'georgy-zhukov',
      EVENT_ENTITY_ROLES.COMMANDER,
      'Phó Tổng tư lệnh Tối cao Hồng quân Liên Xô',
      2,
      true,
    ),
    linkEventEntity(
      'chien-tranh-ve-quoc-vi-dai-1941-1945',
      'hong-quan-lien-xo',
      EVENT_ENTITY_ROLES.PARTICIPANT,
      'Lực lượng vũ trang chiến đấu bảo vệ Tổ quốc Xô viết',
      3,
      true,
    ),
    linkEventEntity(
      'chien-tranh-ve-quoc-vi-dai-1941-1945',
      'dien-kremlin-quang-truong-do',
      EVENT_ENTITY_ROLES.LOCATION,
      'Nơi diễn ra cuộc duyệt binh lịch sử 07/11/1941 và Lễ duyệt binh Chiến thắng 24/06/1945',
      4,
      false,
    ),
    linkEventEntity(
      'tran-stalingrad-1942-1943',
      'georgy-zhukov',
      EVENT_ENTITY_ROLES.COMMANDER,
      'Đại diện Đại bản doanh trực tiếp điều phối Chiến dịch phản công Sao Thiên Vương',
      1,
    ),
    linkEventEntity(
      'tran-stalingrad-1942-1943',
      'joseph-stalin',
      EVENT_ENTITY_ROLES.LEADER,
      'Tổng Tư lệnh Tối cao ban hành Mệnh lệnh số 227 "Không lùi một bước!"',
      2,
      false,
    ),
    linkEventEntity(
      'tran-stalingrad-1942-1943',
      'hong-quan-lien-xo',
      EVENT_ENTITY_ROLES.PARTICIPANT,
      'Lực lượng hợp vây và tiêu diệt Tập đoàn quân số 6 phát xít Đức',
      3,
      true,
    ),
    linkEventEntity(
      'tran-stalingrad-1942-1943',
      'thanh-pho-stalingrad',
      EVENT_ENTITY_ROLES.LOCATION,
      'Chiến trường quyết chiến bên bờ sông Volga',
      4,
      true,
    ),
    linkEventEntity(
      'chien-dich-berlin-1945',
      'georgy-zhukov',
      EVENT_ENTITY_ROLES.COMMANDER,
      'Tư lệnh Phương diện quân Belarus 1 trực tiếp đánh chiếm trung tâm Berlin và tiếp nhận đầu hàng',
      1,
    ),
    linkEventEntity(
      'chien-dich-berlin-1945',
      'hong-quan-lien-xo',
      EVENT_ENTITY_ROLES.PARTICIPANT,
      'Lực lượng cắm Lá cờ Chiến thắng lên nóc tòa nhà Quốc hội Đức (Reichstag)',
      2,
      true,
    ),
    linkEventEntity(
      'lien-xo-phong-ve-tinh-sputnik-1-1957',
      'san-bay-vu-tru-baikonur',
      EVENT_ENTITY_ROLES.LOCATION,
      'Bệ phóng số 1 tại Baikonur nơi phóng Sputnik 1',
      1,
    ),
    linkEventEntity(
      'yuri-gagarin-bay-vao-vu-tru-1961',
      'yuri-gagarin',
      EVENT_ENTITY_ROLES.LEADER,
      'Phi hành gia đầu tiên của nhân loại điều khiển tàu Vostok 1',
      1,
    ),
    linkEventEntity(
      'yuri-gagarin-bay-vao-vu-tru-1961',
      'tau-vu-tru-vostok-1',
      EVENT_ENTITY_ROLES.ARTIFACT_USED,
      'Con tàu vũ trụ đưa Yuri Gagarin bay vòng quanh Trái Đất',
      2,
      true,
    ),
    linkEventEntity(
      'yuri-gagarin-bay-vao-vu-tru-1961',
      'san-bay-vu-tru-baikonur',
      EVENT_ENTITY_ROLES.LOCATION,
      'Điểm xuất phát của chuyến bay Vostok 1',
      3,
      true,
    ),
    linkEventEntity(
      'su-tan-ra-cua-lien-bang-xo-viet-1991',
      'mikhail-gorbachev',
      EVENT_ENTITY_ROLES.LEADER,
      'Tổng Bí thư khởi xướng Cải tổ và Tổng thống cuối cùng tuyên bố từ chức ngày 25/12/1991',
      1,
    ),
    linkEventEntity(
      'su-tan-ra-cua-lien-bang-xo-viet-1991',
      'dien-kremlin-quang-truong-do',
      EVENT_ENTITY_ROLES.LOCATION,
      'Nơi quốc kỳ Liên bang Xô viết được hạ xuống tối 25/12/1991',
      2,
      true,
    ),
  ],

  entityRelations: [
    {
      sourceEntitySlug: 'joseph-stalin',
      targetEntitySlug: 'vladimir-ilyich-lenin',
      relationType: ENTITY_RELATION_CODES.SUCCESSOR_TO,
      startYear: 1924,
      endYear: 1953,
      note: 'Kế tục sự nghiệp lãnh đạo Đảng Cộng sản và Nhà nước Liên Xô sau khi V.I. Lenin qua đời năm 1924.',
    },
    {
      sourceEntitySlug: 'vladimir-ilyich-lenin',
      targetEntitySlug: 'hong-quan-lien-xo',
      relationType: ENTITY_RELATION_CODES.FOUNDER_OF,
      startYear: 1918,
      endYear: 1924,
      note: 'Ký Sắc lệnh thành lập Hồng quân Công Nông ngày 23/02/1918 để bảo vệ chính quyền Xô viết.',
    },
    {
      sourceEntitySlug: 'joseph-stalin',
      targetEntitySlug: 'hong-quan-lien-xo',
      relationType: ENTITY_RELATION_CODES.LEADER_OF,
      startYear: 1941,
      endYear: 1945,
      note: 'Tổng Tư lệnh Tối cao các lực lượng vũ trang Liên Xô trong Chiến tranh Vệ quốc Vĩ đại.',
    },
    {
      sourceEntitySlug: 'georgy-zhukov',
      targetEntitySlug: 'hong-quan-lien-xo',
      relationType: ENTITY_RELATION_CODES.LEADER_OF,
      startYear: 1941,
      endYear: 1957,
      note: 'Nguyên soái Liên Xô, Phó Tổng tư lệnh Tối cao trong Thế chiến II và sau đó là Bộ trưởng Quốc phòng.',
    },
    {
      sourceEntitySlug: 'joseph-stalin',
      targetEntitySlug: 'franklin-d-roosevelt',
      relationType: ENTITY_RELATION_CODES.ALLIED_WITH,
      startYear: 1941,
      endYear: 1945,
      note: 'Đồng minh chiến lược trong khối Tam cường chống chủ nghĩa phát xít và sáng lập Liên Hợp Quốc.',
    },
    {
      sourceEntitySlug: 'franklin-d-roosevelt',
      targetEntitySlug: 'winston-churchill',
      relationType: ENTITY_RELATION_CODES.ALLIED_WITH,
      startYear: 1941,
      endYear: 1945,
      note: 'Ký Hiến chương Đại Tây Dương (1941) và phối hợp chỉ đạo chiến trường Đồng minh phương Tây.',
    },
    {
      sourceEntitySlug: 'joseph-stalin',
      targetEntitySlug: 'winston-churchill',
      relationType: ENTITY_RELATION_CODES.ALLIED_WITH,
      startYear: 1941,
      endYear: 1945,
      note: 'Liên minh chống phát xít Đức tại các Hội nghị Thượng đỉnh Tehran, Yalta và Potsdam.',
    },
    {
      sourceEntitySlug: 'franklin-d-roosevelt',
      targetEntitySlug: 'lien-hop-quoc',
      relationType: ENTITY_RELATION_CODES.FOUNDER_OF,
      startYear: 1942,
      endYear: 1945,
      note: 'Người đưa ra tên gọi "United Nations" và thúc đẩy thành lập tổ chức tại Hội nghị Yalta.',
    },
  ],

  eventCausalRelations: [
    {
      sourceEventSlug: 'tuyen-ngon-doc-lap-hoa-ky-1776',
      targetEventSlug: 'dai-cach-mang-phap-1789',
      relationType: EventRelationType.INFLUENCES,
      description:
        'Tư tưởng tự do, dân chủ của Tuyên ngôn Độc lập Hoa Kỳ năm 1776 đã cổ vũ trực tiếp cho sự bùng nổ của Đại Cách mạng Pháp năm 1789.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Thế giới Cận đại, NXB Giáo dục Việt Nam',
    },
    {
      sourceEventSlug: 'dai-cach-mang-phap-1789',
      targetEventSlug: 'tran-waterloo-1815',
      relationType: EventRelationType.PRECEDES,
      description:
        'Những biến động của Cách mạng Pháp đưa Napoléon Bonaparte lên nắm quyền và dẫn tới các cuộc Chiến tranh Napoléon kết thúc tại Waterloo.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Thế giới Cận đại, NXB Giáo dục Việt Nam',
    },
    {
      sourceEventSlug: 'chien-tranh-the-gioi-thu-nhat-1914-1918',
      targetEventSlug: 'cach-mang-thang-muoi-nga-1917',
      relationType: EventRelationType.CAUSES,
      description:
        'Thất bại quân sự và khủng hoảng kinh tế – xã hội trầm trọng của nước Nga trong Thế chiến I đã làm bùng nổ Cách mạng năm 1917.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Thế giới Hiện đại, NXB Giáo dục Việt Nam',
    },
    {
      sourceEventSlug: 'chien-tranh-the-gioi-thu-nhat-1914-1918',
      targetEventSlug: 'hoa-uoc-versailles-1919',
      relationType: EventRelationType.CAUSES,
      description:
        'Chiến tranh Thế giới thứ nhất kết thúc dẫn tới việc triệu tập Hội nghị Hòa bình Paris và ký kết Hòa ước Versailles năm 1919.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Thế giới Hiện đại, NXB Giáo dục Việt Nam',
    },
    {
      sourceEventSlug: 'cach-mang-thang-muoi-nga-1917',
      targetEventSlug: 'thanh-lap-lien-bang-xo-viet-1922',
      relationType: EventRelationType.CAUSES,
      description:
        'Thắng lợi của Cách mạng Tháng Mười và cuộc chiến bảo vệ chính quyền Xô viết là nền tảng trực tiếp để thành lập Liên bang Xô viết ngày 30/12/1922.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Thế giới Hiện đại, NXB Giáo dục Việt Nam',
    },
    {
      sourceEventSlug: 'hoa-uoc-versailles-1919',
      targetEventSlug: 'chien-tranh-the-gioi-thu-hai-1939-1945',
      relationType: EventRelationType.INFLUENCES,
      description:
        'Những điều khoản bồi thường chiến phí và cắt đất khắc nghiệt của Hòa ước Versailles đã bị chủ nghĩa phát xít Hitler lợi dụng để kích động phục thù, dẫn tới Thế chiến II.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Thế giới Hiện đại, NXB Giáo dục Việt Nam',
    },
    {
      sourceEventSlug: 'tran-stalingrad-1942-1943',
      targetEventSlug: 'chien-dich-do-bo-normandy-1944',
      relationType: EventRelationType.PRECEDES,
      description:
        'Sau khi Hồng quân Liên Xô xoay chuyển cục diện tại Stalingrad và Kursk, quân Đồng minh phương Tây mở Mặt trận thứ hai tại Normandy (06/1944).',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Chiến tranh Vệ quốc Vĩ đại của Liên Xô',
    },
    {
      sourceEventSlug: 'tran-stalingrad-1942-1943',
      targetEventSlug: 'chien-dich-berlin-1945',
      relationType: EventRelationType.PRECEDES,
      description:
        'Từ bước ngoặt Stalingrad, Hồng quân Liên Xô chuyển sang tổng phản công chiến lược tiến thẳng tới sào huyệt Berlin năm 1945.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Chiến tranh Vệ quốc Vĩ đại của Liên Xô',
    },
    {
      sourceEventSlug: 'chien-dich-berlin-1945',
      targetEventSlug: 'hoi-nghi-yalta-va-thanh-lap-lien-hop-quoc-1945',
      relationType: EventRelationType.INFLUENCES,
      description:
        'Chiến thắng đập tan chủ nghĩa phát xít ở châu Âu tạo cơ sở hiện thực hóa các quyết nghị của Hội nghị Yalta và thành lập Liên Hợp Quốc (10/1945).',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Quan hệ Quốc tế Hiện đại',
    },
    {
      sourceEventSlug: 'lien-xo-phong-ve-tinh-sputnik-1-1957',
      targetEventSlug: 'yuri-gagarin-bay-vao-vu-tru-1961',
      relationType: EventRelationType.PRECEDES,
      description:
        'Thành công của vệ tinh nhân tạo Sputnik 1 năm 1957 mở đường cho chuyến bay vũ trụ có người lái đầu tiên của Yuri Gagarin trên tàu Vostok 1 năm 1961.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Khoa học và Kỹ thuật Thế giới Thế kỷ XX',
    },
    {
      sourceEventSlug: 'sup-do-buc-tuong-berlin-1989',
      targetEventSlug: 'su-tan-ra-cua-lien-bang-xo-viet-1991',
      relationType: EventRelationType.INFLUENCES,
      description:
        'Sự sụp đổ của hệ thống xã hội chủ nghĩa ở Đông Âu và Bức tường Berlin năm 1989 đã đẩy nhanh quá trình khủng hoảng và tan rã của Liên bang Xô viết năm 1991.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Thế giới Hiện đại, NXB Giáo dục Việt Nam',
    },
  ],
};

/**
 * Concrete Dataset Provider cho Lịch sử Thế giới & Liên Xô (Composite / Provider Pattern)
 */
export class WorldAndSovietCatalogProvider implements ICatalogDatasetProvider {
  public readonly regionName = `${HISTORICAL_REGIONS.WORLD} & ${HISTORICAL_REGIONS.SOVIET_UNION}`;

  public getEntities(): IEntitySeedRecord[] {
    return RAW_WORLD_SOVIET_ENTITIES;
  }

  public getEvents(): IEventSeedRecord[] {
    return RAW_WORLD_SOVIET_EVENTS;
  }

  public getRelations(): IRelationsSeedDataset {
    return RAW_WORLD_SOVIET_RELATIONS;
  }

  public static buildEntities(): IEntitySeedRecord[] {
    return RAW_WORLD_SOVIET_ENTITIES;
  }

  public static buildEvents(): IEventSeedRecord[] {
    return RAW_WORLD_SOVIET_EVENTS;
  }

  public static buildRelations(): IRelationsSeedDataset {
    return RAW_WORLD_SOVIET_RELATIONS;
  }
}
