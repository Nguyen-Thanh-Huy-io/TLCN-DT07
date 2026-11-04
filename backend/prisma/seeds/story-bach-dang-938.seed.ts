/**
 * Seed bài học dạng "Câu chuyện lịch sử" (khối STORY_CHAPTER) để trình diễn dàn trang tạp chí:
 *   "Ngô Quyền và chiến thắng Bạch Đằng năm 938 — Khép lại nghìn năm Bắc thuộc"
 *
 * Quy trình thực thi:
 *   1. Tạo trước các Thực thể lịch sử (HistoricalEntity & Person):
 *      - Ngô Quyền (PERSON)
 *      - Dương Đình Nghệ (PERSON)
 *      - Kiều Công Tiễn (PERSON)
 *      - Lưu Hoằng Tháo (PERSON)
 *      - Sông Bạch Đằng (LOCATION)
 *      - Kinh đô Cổ Loa (LOCATION)
 *      - Nhà Ngô (DYNASTY)
 *   2. Tạo bài học dạng Câu chuyện lịch sử (Lesson):
 *      - Nhúng ID thực thể thật vào các khối (CHARACTER, RELATED_PEOPLE, TIMELINE).
 *      - Khối STORY_CHAPTER 5 chương phong cách Editorial Spread:
 *          Chương I   (MAGAZINE_GRID 4:8) — Đêm trường Bắc thuộc & Lời hiệu triệu
 *          Chương II  (ASYMMETRIC 5:7)   — Kế sách cọc gỗ đầu sắt
 *          Chương III (FULL_WIDTH 21:9)  — Quyết chiến trên sóng triều Bạch Đằng
 *          Chương IV  (SPLIT 6:6)        — Khúc khải hoàn & Tái lập kinh đô Cổ Loa
 *          Chương V   (MAGAZINE_GRID 7:5) — Mở ra kỷ nguyên độc lập muôn đời
 *      - Khối nhân vật 2 cột (SECTION_ROW + CHARACTER).
 *      - Khối nhân vật liên quan (RELATED_PEOPLE).
 *      - Khối dòng thời gian (TIMELINE 6 mốc từ 905 đến 939).
 *      - Đề ôn tập tương tác (Quiz 5 câu: Multiple Choice, True/False, Ordering, Matching, Fill Blank).
 *
 * Idempotent: upsert theo slug, chạy lại bao nhiêu lần cũng đồng bộ an toàn.
 * Chạy lệnh: npm run seed:story (từ thư mục backend)
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  PrismaClient,
  HistoricalEntityType,
  ContentStatus,
  DatePrecision,
  DifficultyLevel,
  LessonStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export const STORY_LESSON_SLUG = 'ngo-quyen-va-chien-thang-bach-dang-938';

// ---------------------------------------------------------------------------
// Hằng số loại khối & bảng màu (Tuân thủ Clean Code, không Magic String)
// ---------------------------------------------------------------------------
const BLOCK = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  QUOTE: 'QUOTE',
  CALLOUT: 'CALLOUT',
  TIMELINE: 'TIMELINE',
  CHARACTER: 'CHARACTER',
  SECTION_ROW: 'SECTION_ROW',
  RELATED_PEOPLE: 'RELATED_PEOPLE',
  RESOURCE_LINK: 'RESOURCE_LINK',
  DIVIDER: 'DIVIDER',
  STORY_CHAPTER: 'STORY_CHAPTER',
} as const;

type EditorialLayout = 'MAGAZINE_GRID' | 'ASYMMETRIC' | 'FULL_WIDTH' | 'SPLIT';
type ColumnRatio = '4_8' | '5_7' | '6_6' | '7_5' | '8_4';

const PALETTE = {
  PAPER: '#faf7f2',
  PARCHMENT: '#f3ece0',
  INK_NIGHT: '#1c1917',
  RIVER: '#eef3f1',
  SEAL_RED: '#8b261d',
  BRONZE: '#a16207',
  JADE: '#2d6a4f',
  BORDER: '#e7e5e4',
} as const;

const MEDIA = {
  COVER: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80',
  RIVER_MIST: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1400&q=80',
  ESTUARY: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1800&q=80',
  WOODEN_BOAT: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1400&q=80',
  NGO_QUYEN_AVATAR: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
  DUONG_DINH_NGHE_AVATAR: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80',
  KIEU_CONG_TIEN_AVATAR: 'https://images.unsplash.com/photo-1569701813229-33284b643e3c?auto=format&fit=crop&w=600&q=80',
  LUU_HOANG_THAO_AVATAR: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
} as const;

function editorialConfig(
  type: EditorialLayout,
  opts: {
    columnRatio?: ColumnRatio;
    textColumns?: 1 | 2;
    backgroundColor?: string;
    initialLetterColor?: string;
    dropCap?: boolean;
    mediaRatio?: '16_10' | '21_9' | '16_9' | '4_3' | '3_4';
    pullQuoteStyle?: 'CLASSIC_QUOTES' | 'BORDER_LEFT' | 'MINIMAL';
    shadow?: 'NONE' | 'SM' | 'MD';
  } = {},
) {
  return {
    version: 1,
    layout: {
      type,
      columns: 12,
      columnRatio: opts.columnRatio ?? '4_8',
      textColumns: opts.textColumns ?? 1,
      gap: 'MD',
      rowGap: 'MD',
      contentWidth: 'FULL',
      horizontalAlign: 'CENTER',
      padding: 'SPACIOUS',
      paddingTopPx: 40,
      paddingBottomPx: 40,
      paddingLeftPx: 36,
      paddingRightPx: 36,
      childBlockGap: 'MD',
      alignment: 'TOP',
    },
    typography: {
      headingFont: 'SERIF',
      headingFontName: 'var(--font-merriweather), Georgia, serif',
      bodyFont: 'SANS',
      bodyFontName: 'var(--font-be-vietnam-pro), sans-serif',
      captionFont: 'SERIF',
      headingSize: 'LG',
      headingWeight: 'BOLD',
      headingTransform: 'NONE',
      headingLetterSpacing: 'TIGHT',
      bodySize: 'MD',
      bodyFontSizePx: 17,
      bodyWeight: 'REGULAR',
      bodyAlign: 'JUSTIFY',
      lineHeight: 'RELAXED',
      lineHeightValue: '1.7',
      dropCap: opts.dropCap ?? true,
      initialLetterColor: opts.initialLetterColor ?? PALETTE.SEAL_RED,
      firstParagraphHighlight: false,
      pullQuoteStyle: opts.pullQuoteStyle ?? 'CLASSIC_QUOTES',
      paragraphIndent: false,
    },
    media: {
      defaultRatio: opts.mediaRatio ?? '16_10',
      imageFit: 'COVER',
      imagePosition: 'CENTER',
      showCaption: true,
      captionPosition: 'BOTTOM',
    },
    appearance: {
      backgroundColor: opts.backgroundColor ?? PALETTE.PAPER,
      overlayOpacity: 0,
      showRegionDividers: true,
      borderStyle: 'SOLID',
      borderWidthPx: 1,
      borderColor: PALETTE.BORDER,
      borderRadius: 'XL',
      shadow: opts.shadow ?? 'NONE',
      scrollAnimation: 'FADE_UP',
      stickySection: false,
      hideOnDesktop: false,
      hideOnTablet: false,
      hideOnMobile: false,
    },
    responsive: {
      tabletColumns: 8,
      mobileColumns: 4,
      stackOnMobile: true,
      mobileOrder: 'DEFAULT',
    },
  };
}

// ---------------------------------------------------------------------------
// BƯỚC 1: TẠO CÁC THỰC THỂ LỊCH SỬ (HISTORICAL ENTITIES & PERSONS) TRƯỚC
// ---------------------------------------------------------------------------
export async function seedHistoricalEntities() {
  console.log('\n--- 1. KHỞI TẠO CÁC THỰC THỂ LỊCH SỬ LIÊN QUAN ---');

  // 1. Ngô Quyền (PERSON)
  const ngoQuyen = await prisma.historicalEntity.upsert({
    where: { slug: 'ngo-quyen' },
    update: {
      name: 'Ngô Quyền',
      type: HistoricalEntityType.PERSON,
      tagline: 'Tiền Ngô Vương — Vị vua khép lại nghìn năm Bắc thuộc, mở ra kỷ nguyên độc lập tự chủ',
      description:
        'Ngô Quyền (898 – 944) là người làng Đường Lâm, Ba Vì, Hà Nội. Ông là vị tướng tài ba dưới trướng Dương Đình Nghệ. Năm 938, ông lãnh đạo quân dân đánh tan hạm đội quân Nam Hán trên sông Bạch Đằng, xưng vương năm 939 và định đô tại Cổ Loa.',
      aliases: ['Tiền Ngô Vương', 'Ngô Chúa'],
      imageUrl: MEDIA.NGO_QUYEN_AVATAR,
      dateText: '898 – 944',
      startYear: 898,
      endYear: 944,
      datePrecision: DatePrecision.YEAR,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      slug: 'ngo-quyen',
      name: 'Ngô Quyền',
      type: HistoricalEntityType.PERSON,
      tagline: 'Tiền Ngô Vương — Vị vua khép lại nghìn năm Bắc thuộc, mở ra kỷ nguyên độc lập tự chủ',
      description:
        'Ngô Quyền (898 – 944) là người làng Đường Lâm, Ba Vì, Hà Nội. Ông là vị tướng tài ba dưới trướng Dương Đình Nghệ. Năm 938, ông lãnh đạo quân dân đánh tan hạm đội quân Nam Hán trên sông Bạch Đằng, xưng vương năm 939 và định đô tại Cổ Loa.',
      aliases: ['Tiền Ngô Vương', 'Ngô Chúa'],
      imageUrl: MEDIA.NGO_QUYEN_AVATAR,
      dateText: '898 – 944',
      startYear: 898,
      endYear: 944,
      datePrecision: DatePrecision.YEAR,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
  });

  await prisma.person.upsert({
    where: { entityId: ngoQuyen.id },
    update: {
      birthYear: 898,
      deathYear: 944,
      birthDateText: '898 (Mậu Ngọ)',
      deathDateText: '944 (Giáp Thìn)',
      titles: ['Tiền Ngô Vương', 'Tiết độ sứ Ái Châu'],
      biography:
        'Sinh ra tại Đường Lâm, nổi tiếng dũng lược, mưu trí. Là người sáng lập triều Ngô và xác lập thể chế nhà nước tự chủ sau hơn mười thế kỷ lệ thuộc phương Bắc.',
    },
    create: {
      entityId: ngoQuyen.id,
      birthYear: 898,
      deathYear: 944,
      birthDateText: '898 (Mậu Ngọ)',
      deathDateText: '944 (Giáp Thìn)',
      titles: ['Tiền Ngô Vương', 'Tiết độ sứ Ái Châu'],
      biography:
        'Sinh ra tại Đường Lâm, nổi tiếng dũng lược, mưu trí. Là người sáng lập triều Ngô và xác lập thể chế nhà nước tự chủ sau hơn mười thế kỷ lệ thuộc phương Bắc.',
    },
  });
  console.log(`✓ Thực thể PERSON: Ngô Quyền (${ngoQuyen.id})`);

  // 2. Dương Đình Nghệ (PERSON)
  const duongDinhNghe = await prisma.historicalEntity.upsert({
    where: { slug: 'duong-dinh-nghe' },
    update: {
      name: 'Dương Đình Nghệ',
      type: HistoricalEntityType.PERSON,
      tagline: 'Hào trưởng đất Ái Châu, người đánh đuổi quân Nam Hán giành quyền tự chủ năm 931',
      description:
        'Dương Đình Nghệ (874 – 937) nuôi ba nghìn nghĩa sĩ, đem quân đánh chiếm thành Đại La, quét sạch tàn quân Nam Hán. Ông là cha vợ và người trao quyền trấn giữ Ái Châu cho Ngô Quyền.',
      aliases: ['Dương Diên Nghệ'],
      imageUrl: MEDIA.DUONG_DINH_NGHE_AVATAR,
      dateText: '874 – 937',
      startYear: 874,
      endYear: 937,
      datePrecision: DatePrecision.YEAR,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      slug: 'duong-dinh-nghe',
      name: 'Dương Đình Nghệ',
      type: HistoricalEntityType.PERSON,
      tagline: 'Hào trưởng đất Ái Châu, người đánh đuổi quân Nam Hán giành quyền tự chủ năm 931',
      description:
        'Dương Đình Nghệ (874 – 937) nuôi ba nghìn nghĩa sĩ, đem quân đánh chiếm thành Đại La, quét sạch tàn quân Nam Hán. Ông là cha vợ và người trao quyền trấn giữ Ái Châu cho Ngô Quyền.',
      aliases: ['Dương Diên Nghệ'],
      imageUrl: MEDIA.DUONG_DINH_NGHE_AVATAR,
      dateText: '874 – 937',
      startYear: 874,
      endYear: 937,
      datePrecision: DatePrecision.YEAR,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
  });

  await prisma.person.upsert({
    where: { entityId: duongDinhNghe.id },
    update: {
      birthYear: 874,
      deathYear: 937,
      titles: ['Tiết độ sứ'],
      biography:
        'Nha tướng của Khúc Hạo, là người kiên trì ngọn cờ tự chủ của họ Khúc, lập công lớn đánh tan tướng Nam Hán Trần Bảo năm 931.',
    },
    create: {
      entityId: duongDinhNghe.id,
      birthYear: 874,
      deathYear: 937,
      titles: ['Tiết độ sứ'],
      biography:
        'Nha tướng của Khúc Hạo, là người kiên trì ngọn cờ tự chủ của họ Khúc, lập công lớn đánh tan tướng Nam Hán Trần Bảo năm 931.',
    },
  });
  console.log(`✓ Thực thể PERSON: Dương Đình Nghệ (${duongDinhNghe.id})`);

  // 3. Kiều Công Tiễn (PERSON)
  const kieuCongTien = await prisma.historicalEntity.upsert({
    where: { slug: 'kieu-cong-tien' },
    update: {
      name: 'Kiều Công Tiễn',
      type: HistoricalEntityType.PERSON,
      tagline: 'Nha tướng phản phúc, kẻ sát hại Dương Đình Nghệ và rước quân Nam Hán sang xâm lược',
      description:
        'Hào trưởng đất Phong Châu (Phú Thọ). Tháng 4 năm 937 giết hại Dương Đình Nghệ cướp chức Tiết độ sứ. Khi Ngô Quyền kéo quân ra Bắc vấn tội, Tiễn sai sứ sang Quảng Châu cầu cứu vua Nam Hán.',
      imageUrl: MEDIA.KIEU_CONG_TIEN_AVATAR,
      dateText: '? – 938',
      endYear: 938,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      slug: 'kieu-cong-tien',
      name: 'Kiều Công Tiễn',
      type: HistoricalEntityType.PERSON,
      tagline: 'Nha tướng phản phúc, kẻ sát hại Dương Đình Nghệ và rước quân Nam Hán sang xâm lược',
      description:
        'Hào trưởng đất Phong Châu (Phú Thọ). Tháng 4 năm 937 giết hại Dương Đình Nghệ cướp chức Tiết độ sứ. Khi Ngô Quyền kéo quân ra Bắc vấn tội, Tiễn sai sứ sang Quảng Châu cầu cứu vua Nam Hán.',
      imageUrl: MEDIA.KIEU_CONG_TIEN_AVATAR,
      dateText: '? – 938',
      endYear: 938,
      status: ContentStatus.PUBLISHED,
    },
  });

  await prisma.person.upsert({
    where: { entityId: kieuCongTien.id },
    update: {
      deathYear: 938,
      biography:
        'Bị quân Ngô Quyền bao vây và trừng trị tại thành Đại La vào cuối năm 938 trước khi đoàn thuyền chiến Nam Hán kịp tiến vào cửa biển.',
    },
    create: {
      entityId: kieuCongTien.id,
      deathYear: 938,
      biography:
        'Bị quân Ngô Quyền bao vây và trừng trị tại thành Đại La vào cuối năm 938 trước khi đoàn thuyền chiến Nam Hán kịp tiến vào cửa biển.',
    },
  });
  console.log(`✓ Thực thể PERSON: Kiều Công Tiễn (${kieuCongTien.id})`);

  // 4. Lưu Hoằng Tháo (PERSON)
  const luuHoangThao = await prisma.historicalEntity.upsert({
    where: { slug: 'luu-hoang-thao' },
    update: {
      name: 'Lưu Hoằng Tháo',
      type: HistoricalEntityType.PERSON,
      tagline: 'Hoàng tử Nam Hán, chủ tướng đạo quân thủy xâm lược bị tiêu diệt tại Bạch Đằng',
      description:
        'Con trai thứ của vua Nam Hán Lưu Cung. Được phong làm Vạn Vương và đóng vai trò tổng chỉ huy đoàn thủy quân tiến vào Giao Châu năm 938, tử trận khi thuyền chiến va phải bãi cọc nhọn.',
      imageUrl: MEDIA.LUU_HOANG_THAO_AVATAR,
      dateText: '? – 938',
      endYear: 938,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      slug: 'luu-hoang-thao',
      name: 'Lưu Hoằng Tháo',
      type: HistoricalEntityType.PERSON,
      tagline: 'Hoàng tử Nam Hán, chủ tướng đạo quân thủy xâm lược bị tiêu diệt tại Bạch Đằng',
      description:
        'Con trai thứ của vua Nam Hán Lưu Cung. Được phong làm Vạn Vương và đóng vai trò tổng chỉ huy đoàn thủy quân tiến vào Giao Châu năm 938, tử trận khi thuyền chiến va phải bãi cọc nhọn.',
      imageUrl: MEDIA.LUU_HOANG_THAO_AVATAR,
      dateText: '? – 938',
      endYear: 938,
      status: ContentStatus.PUBLISHED,
    },
  });

  await prisma.person.upsert({
    where: { entityId: luuHoangThao.id },
    update: {
      deathYear: 938,
      titles: ['Vạn Vương (Nam Hán)', 'Giao Chỉ Tiết độ sứ (tự phong)'],
    },
    create: {
      entityId: luuHoangThao.id,
      deathYear: 938,
      titles: ['Vạn Vương (Nam Hán)', 'Giao Chỉ Tiết độ sứ (tự phong)'],
    },
  });
  console.log(`✓ Thực thể PERSON: Lưu Hoằng Tháo (${luuHoangThao.id})`);

  // 5. Sông Bạch Đằng (LOCATION)
  const songBachDang = await prisma.historicalEntity.upsert({
    where: { slug: 'song-bach-dang' },
    update: {
      name: 'Sông Bạch Đằng',
      type: HistoricalEntityType.LOCATION,
      tagline: 'Thủy đạo chiến lược Đông Bắc — dòng sông ba lần vùi xác quân xâm lăng',
      description:
        'Con sông chảy qua Hải Phòng và Quảng Ninh ngày nay, cửa ngõ đường thủy yết hầu từ phương Bắc vào châu thổ sông Hồng. Nổi tiếng với chiến thắng 938 của Ngô Quyền, 981 của Lê Hoàn và 1288 của Trần Hưng Đạo.',
      aliases: ['Bạch Đằng Giang', 'Sông Rừng'],
      imageUrl: MEDIA.ESTUARY,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      slug: 'song-bach-dang',
      name: 'Sông Bạch Đằng',
      type: HistoricalEntityType.LOCATION,
      tagline: 'Thủy đạo chiến lược Đông Bắc — dòng sông ba lần vùi xác quân xâm lăng',
      description:
        'Con sông chảy qua Hải Phòng và Quảng Ninh ngày nay, cửa ngõ đường thủy yết hầu từ phương Bắc vào châu thổ sông Hồng. Nổi tiếng với chiến thắng 938 của Ngô Quyền, 981 của Lê Hoàn và 1288 của Trần Hưng Đạo.',
      aliases: ['Bạch Đằng Giang', 'Sông Rừng'],
      imageUrl: MEDIA.ESTUARY,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
  });
  console.log(`✓ Thực thể LOCATION: Sông Bạch Đằng (${songBachDang.id})`);

  // 6. Kinh đô Cổ Loa (LOCATION)
  const kinhDoCoLoa = await prisma.historicalEntity.upsert({
    where: { slug: 'kinh-do-co-loa' },
    update: {
      name: 'Kinh đô Cổ Loa',
      type: HistoricalEntityType.LOCATION,
      tagline: 'Kinh thành Âu Lạc xưa, nơi Ngô Quyền chọn định đô năm 939 để nối lại dòng dõi Lạc Hồng',
      description:
        'Tọa lạc tại Đông Anh, Hà Nội ngày nay. Ngô Quyền không dùng Đại La (nơi quan đô hộ phương Bắc từng đóng) mà về Cổ Loa xưng vương, thể hiện ý chí quật cường và sự kế tục quốc thống độc lập.',
      imageUrl: MEDIA.COVER,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      slug: 'kinh-do-co-loa',
      name: 'Kinh đô Cổ Loa',
      type: HistoricalEntityType.LOCATION,
      tagline: 'Kinh thành Âu Lạc xưa, nơi Ngô Quyền chọn định đô năm 939 để nối lại dòng dõi Lạc Hồng',
      description:
        'Tọa lạc tại Đông Anh, Hà Nội ngày nay. Ngô Quyền không dùng Đại La (nơi quan đô hộ phương Bắc từng đóng) mà về Cổ Loa xưng vương, thể hiện ý chí quật cường và sự kế tục quốc thống độc lập.',
      imageUrl: MEDIA.COVER,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
  });
  console.log(`✓ Thực thể LOCATION: Kinh đô Cổ Loa (${kinhDoCoLoa.id})`);

  // 7. Nhà Ngô (DYNASTY)
  const nhaNgo = await prisma.historicalEntity.upsert({
    where: { slug: 'trieu-dai-nha-ngo' },
    update: {
      name: 'Nhà Ngô',
      type: HistoricalEntityType.DYNASTY,
      tagline: 'Triều đại mở đầu thời kỳ độc lập tự chủ trung hưng của nước Việt (939 – 965)',
      description:
        'Triều đại quân chủ do Tiền Ngô Vương Ngô Quyền thành lập sau chiến công Bạch Đằng, đặt nền móng thể chế chính trị cho các triều Đinh, Tiền Lê, Lý, Trần về sau.',
      dateText: '939 – 965',
      startYear: 939,
      endYear: 965,
      datePrecision: DatePrecision.YEAR,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      slug: 'trieu-dai-nha-ngo',
      name: 'Nhà Ngô',
      type: HistoricalEntityType.DYNASTY,
      tagline: 'Triều đại mở đầu thời kỳ độc lập tự chủ trung hưng của nước Việt (939 – 965)',
      description:
        'Triều đại quân chủ do Tiền Ngô Vương Ngô Quyền thành lập sau chiến công Bạch Đằng, đặt nền móng thể chế chính trị cho các triều Đinh, Tiền Lê, Lý, Trần về sau.',
      dateText: '939 – 965',
      startYear: 939,
      endYear: 965,
      datePrecision: DatePrecision.YEAR,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    },
  });
  console.log(`✓ Thực thể DYNASTY: Nhà Ngô (${nhaNgo.id})`);

  return {
    ngoQuyen,
    duongDinhNghe,
    kieuCongTien,
    luuHoangThao,
    songBachDang,
    kinhDoCoLoa,
    nhaNgo,
  };
}

// ---------------------------------------------------------------------------
// BƯỚC 2: TẠO BÀI HỌC CÂU CHUYỆN LỊCH SỬ KÈM LIÊN KẾT ENTITY
// ---------------------------------------------------------------------------
export function buildStoryLessonBlocks(entities: {
  ngoQuyen: { id: string; name: string };
  duongDinhNghe: { id: string; name: string };
  kieuCongTien: { id: string; name: string };
  luuHoangThao: { id: string; name: string };
  songBachDang: { id: string; name: string };
  kinhDoCoLoa: { id: string; name: string };
  nhaNgo: { id: string; name: string };
}) {
  const storyChapters = [
    // CHƯƠNG I: MAGAZINE_GRID (4:8)
    {
      id: 'bd938_chap_1',
      order: 0,
      title: 'Đêm trường Bắc thuộc & Lời hiệu triệu',
      subtitle: 'Bối cảnh lịch sử • Đầu thế kỷ X',
      config: editorialConfig('MAGAZINE_GRID', { columnRatio: '4_8' }),
      blocks: [
        {
          id: 'bd938_c1_lead',
          type: BLOCK.TEXT,
          zone: 'LEFT',
          content:
            '<p>Hơn một nghìn năm, đất Giao Châu nằm dưới ách đô hộ của các triều đại phong kiến phương Bắc. Những cuộc khởi nghĩa của Hai Bà Trưng, Bà Triệu, Lý Bí, Mai Thúc Loan nối nhau bùng lên rồi lại bị dìm trong biển máu.</p><p>Nhưng ngọn lửa tự chủ chưa bao giờ lụi tàn. Đến đầu thế kỷ X, khi đế chế nhà Đường sụp đổ, thời cơ ngàn năm có một đã mở ra trước vận mệnh non sông.</p>',
        },
        {
          id: 'bd938_c1_main',
          type: BLOCK.TEXT,
          zone: 'RIGHT',
          content:
            `<p>Năm 905, Khúc Thừa Dụ chiếm thành Tống Bình, đặt nền móng quyền tự chủ. Truyền được ba đời thì chúa Nam Hán ở Quảng Châu thừa cơ đem quân sang chiếm đóng.</p><p>Năm 931, <strong>Dương Đình Nghệ</strong> — hào kiệt đất Ái Châu — tập hợp ba nghìn con nuôi cùng nghĩa sĩ quét sạch quân xâm lược, tự xưng Tiết độ sứ. Ông tin cậy gả con gái cho người anh hùng đất Đường Lâm: <strong>Ngô Quyền</strong>, giao trọng trách trấn thủ Ái Châu.</p><p>Nhưng bi kịch ập đến vào năm 937: nha tướng <strong>Kiều Công Tiễn</strong> vì tham vọng đã nhẫn tâm sát hại Dương Đình Nghệ cướp quyền. Bị toàn dân căm ghét và cô lập, Tiễn hoảng hốt sai người sang cầu viện chúa Nam Hán Lưu Cung — mở cửa rước giặc vào giày xéo giang sơn.</p>`,
        },
        {
          id: 'bd938_c1_img',
          type: BLOCK.IMAGE,
          zone: 'RIGHT',
          src: MEDIA.RIVER_MIST,
          alt: 'Sông nước châu thổ Bắc Bộ trong sương mai',
          caption: 'Châu thổ sông Hồng — cái nôi gìn giữ linh hồn dân tộc suốt hơn một nghìn năm Bắc thuộc.',
        },
      ],
    },

    // CHƯƠNG II: ASYMMETRIC (5:7)
    {
      id: 'bd938_chap_2',
      order: 1,
      title: 'Kế sách cọc gỗ đầu sắt',
      subtitle: 'Bày trận diệt thù • Mùa đông năm 938',
      config: editorialConfig('ASYMMETRIC', {
        columnRatio: '5_7',
        backgroundColor: PALETTE.PARCHMENT,
        initialLetterColor: PALETTE.BRONZE,
        pullQuoteStyle: 'BORDER_LEFT',
      }),
      blocks: [
        {
          id: 'bd938_c2_quote',
          type: BLOCK.QUOTE,
          zone: 'LEFT',
          quoteText:
            'Hoằng Tháo là đứa trẻ khờ, đem quân từ xa đến, quân lính mỏi mệt. Nghe tin Tiễn bị giết, không có người làm nội ứng, tất đã mất vía trước. Quân ta dĩ dật đãi lao, tất phá được!',
          author: 'Ngô Quyền',
          sourceContext: 'Đại Việt sử ký toàn thư (Kỷ chép về Tiền Ngô Vương)',
        },
        {
          id: 'bd938_c2_note',
          type: BLOCK.CALLOUT,
          zone: 'LEFT',
          variant: 'HISTORICAL_NOTE',
          title: 'Vũ khí từ tự nhiên: Quy luật con nước',
          content:
            'Cửa sông Bạch Đằng có biên độ triều cường kỷ lục: chênh lệch mực nước khi thủy triều lớn nhất và lúc kiệt đáy lên tới hơn 3 mét. Ngô Quyền đã biến địa hình sông ngòi và nước thủy triều thành thứ vũ khí sát thương chí mạng.',
        },
        {
          id: 'bd938_c2_main',
          type: BLOCK.TEXT,
          zone: 'RIGHT',
          content:
            `<p>Mùa đông năm 938, chúa Nam Hán sai con trai là <strong>Lưu Hoằng Tháo</strong> cầm đầu đạo quân thủy khổng lồ tràn sang nước ta.</p><p>Ngô Quyền thần tốc đem quân từ Thanh Hóa ra Bắc, <strong>chém đầu nghịch tặc Kiều Công Tiễn</strong>, trừ mối họa nội phản trước khi giặc đặt chân tới bờ cõi. Nắm chắc thủy quân giặc ắt đi lối cửa biển Bạch Đằng, ông lập tức hành quân về vùng Đông Bắc lập phòng tuyến.</p><p>Dưới sự chỉ huy của ông, hàng vạn binh sĩ cùng nhân dân bản địa đẵn những thân cây gỗ lim, táu cổ thụ vót nhọn, <strong>bịt sắt nhọn ở đầu</strong>, rồi cắm nghiêng xuôi theo dòng nước sâu ở cửa biển. Khi triều lên, mặt nước mênh mông che giấu hoàn toàn bãi chông ngầm. Khi triều rút, bãi cọc nhô lên như bức tường thành thép sắc bén sẵn sàng xé toạc mọi chiến thuyền.</p>`,
        },
      ],
    },

    // CHƯƠNG III: FULL_WIDTH (21:9 Cinematic)
    {
      id: 'bd938_chap_3',
      order: 2,
      title: 'Quyết chiến trên sóng triều Bạch Đằng',
      subtitle: 'Trận đánh định mệnh xoay chuyển lịch sử • Cuối năm Mậu Tuất (938)',
      config: editorialConfig('FULL_WIDTH', {
        textColumns: 2,
        mediaRatio: '21_9',
        backgroundColor: PALETTE.RIVER,
        initialLetterColor: PALETTE.JADE,
        shadow: 'SM',
      }),
      blocks: [
        {
          id: 'bd938_c3_img',
          type: BLOCK.IMAGE,
          zone: 'FULL',
          src: MEDIA.ESTUARY,
          alt: 'Toàn cảnh cửa biển Bạch Đằng cuồn cuộn sóng triều',
          caption: 'Cửa biển Bạch Đằng — thủy đạo huyết mạch nơi chôn vùi tham vọng xâm lăng của Nam Hán (ảnh minh họa).',
        },
        {
          id: 'bd938_c3_main',
          type: BLOCK.TEXT,
          zone: 'FULL',
          content:
            `<p>Vào một ngày cuối năm 938, hạm đội thuyền chiến to lớn của Lưu Hoằng Tháo nối đuôi nhau vượt biển tiến vào cửa sông. Khi nước thủy triều đang dâng cao ngập ngụa, Ngô Quyền cho những toán thuyền độc mộc nhỏ nhẹ bơi ra khiêu chiến rồi vờ hốt hoảng rút chạy.</p><p>Tưởng quân ta yếu thế, Hoằng Tháo đắc chí hò reo thúc toàn bộ hạm đội giặc tiến sâu vào dòng sông, vượt qua bãi cọc ngầm mà không hề hay biết tai họa đang rình rập.</p><p>Đúng lúc <strong>thủy triều đạt đỉnh và bắt đầu đổ dồn ra biển</strong>, tiếng tù và lệnh của Ngô Quyền rền vang đôi bờ! Từ các kênh rạch rậm rạp, hàng trăm chiến thuyền mai phục của quân ta như mãnh hổ lao ra áp sát. Trên bờ, bộ binh bắn tên như mưa, tiếng reo hò dậy đất.</p><p>Quân Nam Hán hoảng loạn quay đầu tháo chạy. Đúng lúc ấy, nước triều rút cạn với tốc độ chóng mặt, để lộ rừng cọc gỗ nhọn hoắt. Thuyền chiến nặng nề của giặc bị dòng nước xiết đẩy mạnh, đâm thủng đáy, gãy nát, đắm la liệt. Lưu Hoằng Tháo chết chìm giữa lòng sông; quân giặc chết đuối quá nửa. Vua cha Lưu Cung ở biên giới nghe tin kinh hoàng, chỉ biết ôm mặt khóc than rồi cuốn cờ rút chạy.</p>`,
        },
        {
          id: 'bd938_c3_quote',
          type: BLOCK.QUOTE,
          zone: 'FULL',
          quoteText: 'Bạch Đằng một trận kinh hoàng — Sóng dâng đỏ máu, nghìn năm dứt cùm!',
          author: 'Hùng ca sông núi',
          sourceContext: 'Âm vang trận thủy chiến thế kỷ X',
        },
      ],
    },

    // CHƯƠNG IV: SPLIT (6:6)
    {
      id: 'bd938_chap_4',
      order: 3,
      title: 'Khúc khải hoàn & Tái lập kinh đô Cổ Loa',
      subtitle: 'Xây nền độc lập • Mùa xuân năm 939',
      config: editorialConfig('SPLIT', {
        columnRatio: '6_6',
        initialLetterColor: PALETTE.SEAL_RED,
        mediaRatio: '4_3',
      }),
      blocks: [
        {
          id: 'bd938_c4_left',
          type: BLOCK.TEXT,
          zone: 'LEFT',
          content:
            `<p>Mùa xuân năm Kỷ Hợi (939), khói lửa chiến tranh vừa tan, Ngô Quyền <strong>chính thức xưng vương</strong>, kiên quyết phế bỏ danh hiệu Tiết độ sứ bù nhìn vốn do thiên triều phương Bắc ban tặng.</p><p>Đặc biệt, ông không chọn Đại La — sào huyệt cai trị hàng thế kỷ của quan đô hộ — mà dời đại bản doanh về <strong>Kinh thành Cổ Loa</strong>, cố đô lịch sử của vua Thục An Dương Vương.</p><p>Quyết định này mang thông điệp bang giao và lịch sử đanh thép: Nước Việt là một quốc gia có nguồn cội Lạc Hồng độc lập từ xa xưa, nay trở về với cội rễ tự chủ ngàn đời của tổ tiên.</p>`,
        },
        {
          id: 'bd938_c4_img',
          type: BLOCK.IMAGE,
          zone: 'RIGHT',
          src: MEDIA.WOODEN_BOAT,
          alt: 'Chiến thuyền gỗ truyền thống thời cổ đại',
          caption: 'Biểu tượng của tinh thần quật khởi và sức mạnh sông nước Việt Nam.',
        },
        {
          id: 'bd938_c4_right',
          type: BLOCK.TEXT,
          zone: 'RIGHT',
          content:
            '<p>Ngô Vương thiết lập triều nghi hoàn chỉnh: định ngôi thứ bá quan, đặt ra màu sắc phẩm phục, bãi bỏ chế độ cống nạp nô dịch. Một thể chế quân chủ tự chủ thực thụ ra đời, thắp sáng niềm tự hào cho muôn thế hệ sau.</p>',
        },
      ],
    },

    // CHƯƠNG V: MAGAZINE_GRID (7:5)
    {
      id: 'bd938_chap_5',
      order: 4,
      title: 'Mở ra kỷ nguyên độc lập muôn đời',
      subtitle: 'Ý nghĩa lịch sử • Di sản muôn thế hệ',
      config: editorialConfig('MAGAZINE_GRID', {
        columnRatio: '7_5',
        initialLetterColor: PALETTE.BRONZE,
        pullQuoteStyle: 'CLASSIC_QUOTES',
      }),
      blocks: [
        {
          id: 'bd938_c5_lead',
          type: BLOCK.TEXT,
          zone: 'LEFT',
          content:
            `<p>Đại thắng Bạch Đằng năm 938 không chỉ là một kỳ tích quân sự chói lọi, mà là <strong>cột mốc vĩ đại khép lại hơn một nghìn năm Bắc thuộc</strong> tăm tối kéo dài từ thời Triệu – Hán.</p><p>Kể từ đây, dân tộc ta bước vào kỷ nguyên độc lập, tự chủ hoàn toàn. Chiến thuật bãi cọc kết hợp thủy triều của Ngô Quyền trở thành bài học nghệ thuật quân sự kinh điển, được <strong>Lê Hoàn (năm 981)</strong> và <strong>Trần Hưng Đạo (năm 1288)</strong> tiếp nối thần kỳ trên cùng một dòng sông lịch sử.</p>`,
        },
        {
          id: 'bd938_c5_quote',
          type: BLOCK.QUOTE,
          zone: 'RIGHT',
          quoteText:
            'Tiền Ngô Vương có thể lấy quân mới họp của đất Việt ta mà phá tan trăm vạn quân của Lưu Hoằng Tháo, mở nước xưng vương, làm cho người phương Bắc không dám lại sang nữa. Có thể nói là một cơn giận mà yên được dân!',
          author: 'Sử thần Lê Văn Hưu',
          sourceContext: 'Đại Việt sử ký (1272)',
        },
        {
          id: 'bd938_c5_quote2',
          type: BLOCK.QUOTE,
          zone: 'RIGHT',
          quoteText: 'Ngô Vương Quyền là vị tổ trung hưng vĩ đại của dân tộc ta.',
          author: 'Chí sĩ Phan Bội Châu',
          sourceContext: 'Việt Nam quốc sử khảo (1908)',
        },
      ],
    },
  ];

  return [
    {
      id: 'bd938_intro',
      type: BLOCK.TEXT,
      content:
        '<p class="lead">Có những dòng sông chảy qua bờ cõi non sông, nhưng có những dòng sông chảy thẳng vào trang sử vàng dân tộc. <strong>Sông Bạch Đằng</strong> là dòng sông như thế — nơi mà vào mùa đông năm 938, anh hùng Ngô Quyền đã dùng thủy triều và rừng cọc gỗ nhọn chôn vùi mộng tưởng xâm lược phương Bắc, chính thức chấm dứt hơn 10 thế kỷ Bắc thuộc.</p>',
    },
    // Khối STORY_CHAPTER với 5 chương
    {
      id: 'bd938_story',
      type: BLOCK.STORY_CHAPTER,
      width: 'FULL',
      storyTitle: 'Ngô Quyền và chiến thắng Bạch Đằng năm 938',
      subjectType: 'EVENT',
      showToc: true,
      autoNumberChapters: true,
      chapters: storyChapters,
    },
    { id: 'bd938_div_1', type: BLOCK.DIVIDER },

    // Khối TIMELINE liên kết Entity
    {
      id: 'bd938_timeline',
      type: BLOCK.TIMELINE,
      title: 'Hành trình 34 năm giành lại độc lập tự chủ (905 – 939)',
      subtitle: 'Từ khúc tráng ca họ Khúc đến vương triều Cổ Loa',
      orientation: 'VERTICAL',
      sourceMode: 'MANUAL',
      displayConfig: {
        sceneStyle: 'MUSEUM_SPLIT',
        dateFormat: 'YEAR_ONLY',
        sortOrder: 'CHRONOLOGICAL',
        showDescription: true,
        showImage: true,
        showLocation: true,
        showRole: false,
        showDetailButton: true,
        itemsPerPage: 6,
      },
      nodes: [
        {
          id: 'bd_n1',
          year: '905',
          title: 'Khúc Thừa Dụ dấy nghiệp tự chủ',
          description: 'Khúc Thừa Dụ chiếm thành Tống Bình, tự xưng Tiết độ sứ, mở đầu nền độc lập sơ khai.',
          locationName: 'Thành Tống Bình',
          isManual: true,
          confidence: 'EXACT',
        },
        {
          id: 'bd_n2',
          year: '930',
          title: 'Nam Hán đánh phá đất Việt',
          description: 'Quân Nam Hán bắt Tiết độ sứ Khúc Thừa Mỹ, mưu toan tái lập nền đô hộ hà khắc.',
          isManual: true,
          confidence: 'EXACT',
        },
        {
          id: 'bd_n3',
          year: '931',
          title: 'Dương Đình Nghệ quét sạch giặc thù',
          description: 'Dương Đình Nghệ dẫn ba nghìn dũng sĩ từ Thanh Hóa tiến ra giải phóng thành Đại La.',
          locationName: 'Thành Đại La',
          entityId: entities.duongDinhNghe.id,
          isManual: true,
          confidence: 'EXACT',
        },
        {
          id: 'bd_n4',
          year: '937',
          title: 'Kiều Công Tiễn phản phúc cầu viện',
          description: 'Kiều Công Tiễn giết chủ tướng đoạt vị rồi rước thủy quân Nam Hán vào xâm lăng.',
          entityId: entities.kieuCongTien.id,
          isManual: true,
          confidence: 'EXACT',
        },
        {
          id: 'bd_n5',
          year: '938',
          dateLabel: 'Cuối năm 938',
          title: 'Đại thắng Bạch Đằng vang dội',
          description: 'Ngô Quyền dùng trận địa cọc ngầm đánh tan hạm đội Lưu Hoằng Tháo, giết sạch quân thù.',
          locationName: 'Sông Bạch Đằng',
          entityId: entities.ngoQuyen.id,
          locationId: entities.songBachDang.id,
          thumbnailUrl: MEDIA.ESTUARY,
          isManual: true,
          confidence: 'EXACT',
        },
        {
          id: 'bd_n6',
          year: '939',
          dateLabel: 'Mùa xuân 939',
          title: 'Ngô Quyền xưng vương, đóng đô Cổ Loa',
          description: 'Thành lập vương triều Nhà Ngô, phục hưng thể chế độc lập muôn đời của dân tộc.',
          locationName: 'Cổ Loa',
          entityId: entities.ngoQuyen.id,
          locationId: entities.kinhDoCoLoa.id,
          isManual: true,
          confidence: 'EXACT',
        },
      ],
    },

    // Khối 2 cột: Hồ sơ nhân vật đối kháng (SECTION_ROW + CHARACTER) gắn ID thực thể thật
    {
      id: 'bd938_people_section',
      type: BLOCK.SECTION_ROW,
      columnCount: 2,
      columns: [
        {
          id: 'bd938_col_a',
          widthPercent: 50,
          blocks: [
            {
              id: 'bd938_char_ngoquyen',
              type: BLOCK.CHARACTER,
              name: 'Ngô Quyền (Tiền Ngô Vương)',
              years: '898 – 944',
              avatarUrl: MEDIA.NGO_QUYEN_AVATAR,
              role: 'Chủ tướng đại thắng Bạch Đằng • Người sáng lập triều Ngô',
              summary:
                'Người con kiệt xuất đất Đường Lâm. Có chí lớn mưu sâu, lãnh đạo nhân dân đánh tan quân Nam Hán, mở ra kỷ nguyên độc lập tự chủ lâu dài.',
              detailContent:
                '<p>Được phong Tiền Ngô Vương, đặt đô tại Cổ Loa. Là nhân vật lịch sử mở đầu dòng chảy quân chủ độc lập của Đại Việt.</p>',
              entityId: entities.ngoQuyen.id,
            },
          ],
        },
        {
          id: 'bd938_col_b',
          widthPercent: 50,
          blocks: [
            {
              id: 'bd938_char_duongdinhnghe',
              type: BLOCK.CHARACTER,
              name: 'Dương Đình Nghệ',
              years: '874 – 937',
              avatarUrl: MEDIA.DUONG_DINH_NGHE_AVATAR,
              role: 'Tiết độ sứ Ái Châu • Người dìu dắt Ngô Quyền',
              summary:
                'Hào kiệt dũng mãnh đất Ái Châu. Người nuôi dưỡng tinh thần độc lập, dẫn đầu nghĩa quân đánh đuổi quân Nam Hán năm 931.',
              entityId: entities.duongDinhNghe.id,
            },
          ],
        },
      ],
    },

    // Khối RELATED_PEOPLE: Liên kết 4 nhân vật lịch sử với Entity ID thật
    {
      id: 'bd938_related_people',
      type: BLOCK.RELATED_PEOPLE,
      title: 'Các nhân vật tâm điểm trong chiến dịch Bạch Đằng',
      description: 'Đồ thị tri thức liên kết các nhân vật đối đầu và đồng hành trong bước ngoặt năm 938.',
      sourceMode: 'MANUAL',
      people: [
        {
          id: entities.ngoQuyen.id,
          name: 'Ngô Quyền',
          role: 'Tổng chỉ huy chiến thắng Bạch Đằng',
          avatarUrl: MEDIA.NGO_QUYEN_AVATAR,
        },
        {
          id: entities.duongDinhNghe.id,
          name: 'Dương Đình Nghệ',
          role: 'Tiết độ sứ giải phóng Đại La năm 931',
          avatarUrl: MEDIA.DUONG_DINH_NGHE_AVATAR,
        },
        {
          id: entities.kieuCongTien.id,
          name: 'Kiều Công Tiễn',
          role: 'Kẻ sát hại chủ tướng và rước giặc vào nhà',
          avatarUrl: MEDIA.KIEU_CONG_TIEN_AVATAR,
        },
        {
          id: entities.luuHoangThao.id,
          name: 'Lưu Hoằng Tháo',
          role: 'Chủ tướng thủy quân Nam Hán đền tội giữa sông',
          avatarUrl: MEDIA.LUU_HOANG_THAO_AVATAR,
        },
      ],
    },

    {
      id: 'bd938_callout',
      type: BLOCK.CALLOUT,
      variant: 'INFO',
      title: 'Sông Bạch Đằng — 3 lần vùi xác giặc phương Bắc',
      content:
        'Con sông Đông Bắc này đã 3 lần chứng kiến đại thắng vang dội của dân tộc: Năm 938 (Ngô Quyền đánh tan Nam Hán), Năm 981 (Lê Hoàn đánh lui nhà Tống), và Năm 1288 (Trần Hưng Đạo đại phá thủy quân Nguyên Mông). Cả ba đều phát huy tài tình nghệ thuật đóng cọc và quy luật thủy triều.',
    },
    {
      id: 'bd938_ref_1',
      type: BLOCK.RESOURCE_LINK,
      title: 'Đại Việt sử ký toàn thư — Ngoại kỷ toàn thư Quyển 5',
      url: 'https://vi.wikipedia.org/wiki/%C4%90%E1%BA%A1i_Vi%E1%BB%87t_s%E1%BB%AD_k%C3%BD_to%C3%A0n_th%C6%B0',
      note: 'Sử gia Ngô Sĩ Liên ghi chép chi tiết về mưu lược cọc gỗ bịt sắt và công đức Tiền Ngô Vương.',
    },
    {
      id: 'bd938_ref_2',
      type: BLOCK.RESOURCE_LINK,
      title: 'Di tích Bạch Đằng Giang (Tràng Kênh, Thủy Nguyên, Hải Phòng)',
      url: 'https://vi.wikipedia.org/wiki/Khu_di_t%C3%ADch_B%E1%BA%A1ch_%C4%90%E1%BA%B1ng_Giang',
      note: 'Quần thể di tích lịch sử và bãi cọc phục dựng tưởng niệm ba chiến thắng lẫy lừng.',
    },
  ];
}

// ---------------------------------------------------------------------------
// ĐỀ ÔN TẬP 5 CÂU HỎI TƯƠNG TÁC CHUẨN SỬ LIỆU
// ---------------------------------------------------------------------------
export const STORY_LESSON_QUIZ = {
  title: 'Đề ôn tập: Ngô Quyền và chiến thắng Bạch Đằng năm 938',
  passingScorePercent: 70,
  questions: [
    {
      id: 'bd_q1',
      type: 'MULTIPLE_CHOICE',
      prompt: 'Vì sao Kiều Công Tiễn sai người sang cầu cứu vua Nam Hán năm 937?',
      options: [
        {
          id: 'a',
          text: 'Vì sau khi giết Dương Đình Nghệ, hắn bị muôn dân căm ghét, cô lập và hoảng sợ trước nghĩa quân Ngô Quyền',
          isCorrect: true,
        },
        { id: 'b', text: 'Vì Kiều Công Tiễn là người của hoàng tộc Nam Hán từ trước', isCorrect: false },
        { id: 'c', text: 'Vì muốn liên minh với Nam Hán để cùng đánh chiếm nhà Đường', isCorrect: false },
        { id: 'd', text: 'Vì nghe theo lời trăng trối của Dương Đình Nghệ', isCorrect: false },
      ],
      explanation:
        'Hành động phản nghịch giết chủ khiến Kiều Công Tiễn mất hết lòng dân; trước khí thế diệt giặc cứu nước của Ngô Quyền, hắn đã mở đường cho ngoại bang can thiệp.',
    },
    {
      id: 'bd_q2',
      type: 'TRUE_FALSE',
      prompt: 'Ngô Quyền phát lệnh dốc toàn lực phản công khi nước thủy triều đang dâng lên cao nhất.',
      correctAnswer: false,
      explanation:
        'Ngô Quyền chỉ cho thuyền nhẹ nhử giặc lúc triều lên, nhưng kiên nhẫn đợi đến khi thủy triều bắt đầu rút mạnh mới tổng phản công để thuyền địch mắc cạn vào bãi cọc nhọn.',
    },
    {
      id: 'bd_q3',
      type: 'ORDERING',
      prompt: 'Hãy sắp xếp các mốc sự kiện lịch sử sau theo đúng trình tự thời gian:',
      items: [
        { id: 'e1', label: 'Khúc Thừa Dụ dấy nghiệp tự chủ (905)' },
        { id: 'e2', label: 'Dương Đình Nghệ đánh tan quân Nam Hán chiếm Đại La (931)' },
        { id: 'e3', label: 'Kiều Công Tiễn giết Dương Đình Nghệ rồi cầu viện Nam Hán (937)' },
        { id: 'e4', label: 'Đại thắng Bạch Đằng chôn vùi hạm đội Lưu Hoằng Tháo (938)' },
        { id: 'e5', label: 'Ngô Quyền xưng vương, đóng đô tại Cổ Loa (939)' },
      ],
      correctOrder: ['e1', 'e2', 'e3', 'e4', 'e5'],
      explanation: 'Hành trình 34 năm: 905 → 931 → 937 → 938 → 939.',
    },
    {
      id: 'bd_q4',
      type: 'MATCHING',
      prompt: 'Hãy ghép nhân vật lịch sử với vai trò tương ứng trong chiến cuộc:',
      leftItems: [
        { id: 'l1', label: 'Ngô Quyền' },
        { id: 'l2', label: 'Lưu Hoằng Tháo' },
        { id: 'l3', label: 'Dương Đình Nghệ' },
        { id: 'l4', label: 'Kiều Công Tiễn' },
      ],
      rightItems: [
        { id: 'r1', label: 'Tổng chỉ huy trận Bạch Đằng, xưng vương năm 939' },
        { id: 'r2', label: 'Chủ tướng thủy quân Nam Hán, tử trận giữa dòng sông' },
        { id: 'r3', label: 'Giải phóng Đại La năm 931, nuôi dưỡng chí tự chủ' },
        { id: 'r4', label: 'Kẻ phản nghịch giết chủ, rước họa xâm lăng' },
      ],
      correctPairs: [
        { leftId: 'l1', rightId: 'r1' },
        { leftId: 'l2', rightId: 'r2' },
        { leftId: 'l3', rightId: 'r3' },
        { leftId: 'l4', rightId: 'r4' },
      ],
      explanation: 'Mỗi nhân vật đại diện cho một vai trò quyết định trong khúc quanh lịch sử năm 938.',
    },
    {
      id: 'bd_q5',
      type: 'FILL_IN_BLANK',
      prompt: 'Sau khi đại thắng, năm 939 Ngô Quyền đã chọn ________ làm kinh đô để khẳng định sự nối tiếp truyền thống thời An Dương Vương.',
      acceptedAnswers: ['Cổ Loa', 'cổ loa', 'Co Loa', 'co loa', 'thành Cổ Loa', 'thanh Co Loa'],
      caseSensitive: false,
      explanation:
        'Cổ Loa là kinh đô của nhà nước Âu Lạc. Việc Ngô Quyền không đóng đô ở Đại La mà về Cổ Loa là biểu tượng vĩ đại của sự phục hưng quốc thống Lạc Hồng.',
    },
  ],
};

// ---------------------------------------------------------------------------
// THỰC THI SEED IDEMPOTENT
// ---------------------------------------------------------------------------
export async function seedStoryBachDang938() {
  console.log(`\n============================================================`);
  console.log(`BẮT ĐẦU SEED: ${STORY_LESSON_SLUG}`);
  console.log(`============================================================`);

  // 1. Tạo các HistoricalEntity trước
  const entities = await seedHistoricalEntities();

  // 2. Tạo nội dung bài học với liên kết Entity
  console.log('\n--- 2. KHỞI TẠO BÀI HỌC CÂU CHUYỆN LỊCH SỬ VÀ QUIZ ---');
  const blocks = buildStoryLessonBlocks(entities);

  const lessonData = {
    title: 'Ngô Quyền và chiến thắng Bạch Đằng năm 938',
    description:
      'Câu chuyện lịch sử 5 chương phong cách tạp chí báo chí về trận thủy chiến Bạch Đằng năm 938 — thiên tài quân sự của Ngô Quyền khép lại nghìn năm Bắc thuộc, mở ra kỷ nguyên độc lập tự chủ muôn đời.',
    content: blocks,
    thumbnailUrl: MEDIA.COVER,
    difficulty: DifficultyLevel.MEDIUM,
    status: LessonStatus.PUBLISHED,
    publishedAt: new Date(),
    sourceReferenceNote:
      'Đại Việt sử ký toàn thư (Ngô Sĩ Liên); Việt sử lược; Khâm định Việt sử thông giám cương mục (Quốc sử quán triều Nguyễn); Lịch sử Việt Nam tập 1 (Viện Sử học).',
  };

  const lesson = await prisma.lesson.upsert({
    where: { slug: STORY_LESSON_SLUG },
    update: lessonData,
    create: { slug: STORY_LESSON_SLUG, ...lessonData },
  });
  console.log(`✓ Bài học (Lesson): [${lesson.id}] "${lesson.title}"`);
  console.log(`  - Tổng số khối: ${blocks.length} khối`);
  console.log(`  - Số chương câu chuyện: 5 chương Editorial Spread`);

  const quiz = await prisma.quiz.upsert({
    where: { lessonId: lesson.id },
    update: {
      title: STORY_LESSON_QUIZ.title,
      passingScorePercent: STORY_LESSON_QUIZ.passingScorePercent,
      questions: STORY_LESSON_QUIZ.questions,
    },
    create: {
      lessonId: lesson.id,
      title: STORY_LESSON_QUIZ.title,
      passingScorePercent: STORY_LESSON_QUIZ.passingScorePercent,
      questions: STORY_LESSON_QUIZ.questions,
    },
  });
  console.log(`✓ Đề ôn tập (Quiz): [${quiz.id}] ${STORY_LESSON_QUIZ.questions.length} câu hỏi tương tác`);

  console.log(`\n============================================================`);
  console.log(`HOÀN TẤT SEED THÀNH CÔNG!`);
  console.log(`→ Trang học sinh xem bài học:  /bai-hoc/${STORY_LESSON_SLUG}`);
  console.log(`→ Trình soạn thảo bài học:     /lessons/${lesson.id}`);
  console.log(`============================================================\n`);

  return { lesson, quiz, entities };
}

if (require.main === module) {
  seedStoryBachDang938()
    .catch((err) => {
      console.error('Lỗi khi seed bài học câu chuyện:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
