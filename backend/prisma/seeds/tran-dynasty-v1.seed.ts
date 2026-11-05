/**
 * Seeder Tri thức Lịch sử Chuyên sâu:
 * "KỶ NGUYÊN NHÀ TRẦN & ĐẠI THẮNG BẠCH ĐẰNG 1288"
 *
 * Tuân thủ tuyệt đối:
 * - Nguyên tắc SOLID (Single Responsibility, Open/Closed, Dependency Inversion)
 * - Design Patterns: Builder Pattern (ContentBlockBuilder), Facade Pattern (TranDynastySeedFacade)
 * - Zero Magic String: Sử dụng Enums và Constants định kiểu chặt chẽ
 * - Kiến trúc Knowledge Graph chuẩn: HistoricalEntity, HistoricalEvent, HistoricalStatement, Period, Taxonomy
 * - Trường `contentBlocks` (JSONB) chất lượng Bảo tàng số: đa khối TEXT, QUOTE, CALLOUT, TIMELINE, COMPARISON_TABLE, SECTION_ROW, MAP, IMAGE.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  PrismaClient,
  HistoricalEntityType,
  ContentStatus,
  VerificationStatus,
  DatePrecision,
  StatementValueType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

// ============================================================================
// HẰNG SỐ ĐỊNH DANH (ZERO MAGIC STRINGS)
// ============================================================================

export const SEED_CONSTANTS = {
  PERIODS: {
    TRAN_DYNASTY: 'thoi-ky-nha-tran',
  },
  ENTITIES: {
    // Thể chế & Quốc gia
    DAI_VIET: 'dai-viet',
    NHA_TRAN: 'nha-tran-entity',
    DE_QUOC_MONG_CO: 'de-quoc-mong-co',
    QUAN_DOI_DAI_VIET: 'quan-doi-dai-viet',
    THUY_QUAN_NGUYEN_MONG: 'thuy-quan-nguyen-mong',
    // Nhân vật lịch sử
    TRAN_HUNG_DAO: 'tran-hung-dao',
    TRAN_NHAN_TONG: 'tran-nhan-tong',
    TRAN_THANH_TONG: 'tran-thanh-tong',
    TRAN_KHANH_DU: 'tran-khanh-du',
    O_MA_NHI: 'o-ma-nhi',
    PHAN_TIEP: 'phan-tiep',
    THOAT_HOAN: 'thoat-hoan',
    // Địa danh & Di tích
    SONG_BACH_DANG: 'song-bach-dang',
    VAN_DON: 'van-don',
    THANG_LONG: 'thang-long',
    DI_TICH_BACH_DANG: 'khu-di-tich-quoc-gia-dac-biet-bach-dang',
    // Hiện vật / Tác phẩm
    BAI_COC_BACH_DANG: 'bai-coc-bach-dang',
    HICH_TUONG_SI: 'hich-tuong-si',
  },
  EVENTS: {
    KHANG_CHIEN_LAN_3: 'khang-chien-chong-nguyen-mong-lan-3',
    TRAN_VAN_DON: 'tran-van-don-1288',
    TRAN_BACH_DANG: 'dai-thang-bach-dang-1288',
  },
  PREDICATES: {
    COMMANDED: 'COMMANDED',
    PARTICIPATED_IN: 'PARTICIPATED_IN',
    OCCURRED_AT: 'OCCURRED_AT',
    CAUSED_BY: 'CAUSED_BY',
    SUB_EVENT_OF: 'SUB_EVENT_OF',
    OPPONENT_OF: 'OPPONENT_OF',
    RULED: 'RULED',
    CHILD_OF: 'CHILD_OF',
    AUTHORED: 'AUTHORED',
    LOCATED_AT: 'LOCATED_AT',
  },
  TAXONOMY_GROUPS: {
    EVENT_TYPE: 'EVENT_TYPE',
    PREDICATE: 'PREDICATE',
    FIGURE_ROLE: 'FIGURE_ROLE',
    SITE_TYPE: 'SITE_TYPE',
    SOURCE_FORMAT: 'SOURCE_FORMAT',
    SOURCE_NATURE: 'SOURCE_NATURE',
  },
  TAXONOMY_CODES: {
    BATTLE: 'BATTLE',
    WAR: 'WAR',
    COMMANDER: 'COMMANDER',
    OPPONENT: 'OPPONENT',
    PARTICIPANT: 'PARTICIPANT',
    BATTLEFIELD: 'BATTLEFIELD',
    HISTORICAL_REMAINS: 'HISTORICAL_REMAINS',
  },
  BLOCK_TYPES: {
    TEXT: 'TEXT',
    QUOTE: 'QUOTE',
    CALLOUT: 'CALLOUT',
    TIMELINE: 'TIMELINE',
    COMPARISON_TABLE: 'COMPARISON_TABLE',
    SECTION_ROW: 'SECTION_ROW',
    CHARACTER: 'CHARACTER',
    MAP: 'MAP',
    IMAGE: 'IMAGE',
    DIVIDER: 'DIVIDER',
  },
} as const;

// ============================================================================
// BUILDER PATTERN: CONTENT BLOCK BUILDER CHO JSONB
// ============================================================================

export class ContentBlockBuilder {
  private blocks: Record<string, any>[] = [];

  public addQuote(id: string, quote: string, author: string, source?: string): this {
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.QUOTE,
      quoteText: quote,
      author,
      sourceContext: source,
    });
    return this;
  }

  public addText(id: string, htmlContent: string): this {
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.TEXT,
      content: htmlContent,
    });
    return this;
  }

  public addCallout(id: string, tone: 'AMBER' | 'EMERALD' | 'BLUE' | 'ROSE', title: string, content: string): this {
    const VARIANT_BY_TONE: Record<string, string> = {
      AMBER: 'HISTORICAL_NOTE',
      EMERALD: 'SUCCESS',
      BLUE: 'INFO',
      ROSE: 'WARNING',
    };
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.CALLOUT,
      variant: VARIANT_BY_TONE[tone] ?? 'HISTORICAL_NOTE',
      title,
      content,
    });
    return this;
  }

  public addComparisonTable(
    id: string,
    title: string,
    colAName: string,
    colBName: string,
    rows: Array<{ criteria: string; colA: string; colB: string }>,
  ): this {
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.COMPARISON_TABLE,
      title,
      colAName,
      colBName,
      rows,
    });
    return this;
  }

  public addTimeline(
    id: string,
    title: string,
    subtitle: string,
    nodes: Array<{
      id: string;
      year: string;
      title: string;
      description: string;
      detailContent?: string;
    }>,
  ): this {
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.TIMELINE,
      title,
      subtitle,
      orientation: 'VERTICAL',
      nodes,
    });
    return this;
  }

  public addSectionRow(id: string, columns: Array<{ id: string; widthPercent: number; blocks: any[] }>): this {
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.SECTION_ROW,
      columnCount: columns.length,
      columns,
    });
    return this;
  }

  public addMap(id: string, locationName: string, description: string): this {
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.MAP,
      locationName,
      description,
    });
    return this;
  }

  public addImage(id: string, src: string, alt: string, caption: string): this {
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.IMAGE,
      src,
      alt,
      caption,
    });
    return this;
  }

  public addDivider(id: string): this {
    this.blocks.push({
      id,
      type: SEED_CONSTANTS.BLOCK_TYPES.DIVIDER,
    });
    return this;
  }

  public build(): Record<string, any>[] {
    return this.blocks;
  }
}

// ============================================================================
// TAXONOMY CACHE HELPER
// ============================================================================

const taxonomyCache = new Map<string, string>();

async function getTaxonomyId(groupCode: string, code: string): Promise<string> {
  const cacheKey = `${groupCode}:${code}`;
  if (taxonomyCache.has(cacheKey)) return taxonomyCache.get(cacheKey)!;

  const term = await prisma.taxonomyTerm.findUnique({
    where: { groupCode_code: { groupCode, code } },
  });
  if (!term) {
    throw new Error(`[Seed Error] Không tìm thấy TaxonomyTerm: ${groupCode}.${code}`);
  }
  taxonomyCache.set(cacheKey, term.id);
  return term.id;
}

// ============================================================================
// FACADE PATTERN: TRAN DYNASTY SEED FACADE
// ============================================================================

export class TranDynastySeedFacade {
  /**
   * Điểm kích hoạt toàn bộ luồng nạp dữ liệu kỷ nguyên Nhà Trần
   */
  public static async execute(): Promise<void> {
    console.log('⚔️  Khởi chạy nạp dữ liệu Kỷ nguyên Nhà Trần & Đại thắng Bạch Đằng 1288...');

    // 1. Kiểm tra Period cha
    const period = await prisma.period.findUnique({
      where: { slug: SEED_CONSTANTS.PERIODS.TRAN_DYNASTY },
    });
    if (!period) {
      throw new Error(`Chưa có Period ${SEED_CONSTANTS.PERIODS.TRAN_DYNASTY}. Hãy chạy npm run seed:periods trước!`);
    }
    const periodId = period.id;

    // 2. Nạp Thực thể Master Data (Dynasty, Organization, Military Force, Location, Relic)
    await this.seedOrganizationsAndDynasty(periodId);
    await this.seedLocations(periodId);
    await this.seedArtifacts(periodId);
    await this.seedPersons(periodId);

    // 3. Nạp Sự kiện Chiến dịch & Trận đánh then chốt
    await this.seedEvents(periodId);

    // 4. Thiết lập Mạng lưới Quan hệ (Knowledge Graph Statements)
    await this.seedStatements();

    console.log('✅ Hoàn tất nạp dữ liệu chất lượng cao Kỷ nguyên Nhà Trần & Đại thắng Bạch Đằng 1288!');
  }

  private static async seedOrganizationsAndDynasty(periodId: string) {
    console.log('  -> Nạp Thể chế, Triều đại & Lực lượng quân sự...');

    await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.ENTITIES.DAI_VIET },
      create: {
        slug: SEED_CONSTANTS.ENTITIES.DAI_VIET,
        name: 'Đại Việt',
        type: HistoricalEntityType.ORGANIZATION,
        periodId,
        tagline: 'Quốc hiệu Việt Nam dưới các triều đại phong kiến độc lập',
        description: 'Nhà nước độc lập tự chủ của dân tộc Việt Nam, đạt đỉnh cao về văn hiến, chính trị và quân sự thời Lý - Trần.',
        startYear: 1054,
        endYear: 1804,
        datePrecision: DatePrecision.YEAR,
        isFeatured: true,
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });

    await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.ENTITIES.NHA_TRAN },
      create: {
        slug: SEED_CONSTANTS.ENTITIES.NHA_TRAN,
        name: 'Triều đại Nhà Trần',
        type: HistoricalEntityType.DYNASTY,
        periodId,
        tagline: 'Triều đại quân chủ rực rỡ với Hào khí Đông A',
        description: 'Triều đại cai trị Đại Việt kéo dài 175 năm, nổi danh với 3 lần đánh bại quân xâm lược Mông - Nguyên hùng mạnh bậc nhất thế giới.',
        startYear: 1225,
        endYear: 1400,
        datePrecision: DatePrecision.YEAR,
        isFeatured: true,
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });

    await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.ENTITIES.DE_QUOC_MONG_CO },
      create: {
        slug: SEED_CONSTANTS.ENTITIES.DE_QUOC_MONG_CO,
        name: 'Đế quốc Mông Cổ / Nhà Nguyên',
        type: HistoricalEntityType.ORGANIZATION,
        periodId,
        tagline: 'Đế chế du mục bành trướng rộng lớn nhất lịch sử nhân loại',
        description: 'Đế quốc do Thành Cát Tư Hãn thành lập, bành trướng khắp Á - Âu. Dưới thời Hốt Tất Liệt lập ra nhà Nguyên, 3 lần đưa quân xâm lược Đại Việt đều chịu thất bại.',
        startYear: 1206,
        endYear: 1368,
        datePrecision: DatePrecision.YEAR,
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });

    await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.ENTITIES.QUAN_DOI_DAI_VIET },
      create: {
        slug: SEED_CONSTANTS.ENTITIES.QUAN_DOI_DAI_VIET,
        name: 'Quân đội Đại Việt thời Trần',
        type: HistoricalEntityType.MILITARY_FORCE,
        periodId,
        tagline: 'Đội quân bách chiến bách thắng với tinh thần Sát Thát',
        description: 'Lực lượng vũ trang tinh nhuệ theo chính sách "ngụ binh ư nông", kết hợp cấm quân triều đình, quân các vương hầu và hương binh làng xã.',
        startYear: 1225,
        endYear: 1400,
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });

    await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.ENTITIES.THUY_QUAN_NGUYEN_MONG },
      create: {
        slug: SEED_CONSTANTS.ENTITIES.THUY_QUAN_NGUYEN_MONG,
        name: 'Đạo thủy binh viễn chinh Mông - Nguyên',
        type: HistoricalEntityType.MILITARY_FORCE,
        periodId,
        tagline: 'Hạm đội thủy chiến viễn chinh do Ô Mã Nhi và Phàn Tiếp chỉ huy',
        description: 'Bao gồm hàng trăm chiến thuyền lớn chở theo hàng vạn quân tinh nhuệ hợp cùng đoàn thuyền lương Trương Văn Hổ.',
        startYear: 1287,
        endYear: 1288,
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });
  }

  private static async seedLocations(periodId: string) {
    console.log('  -> Nạp Địa danh & Chiến trường lịch sử...');
    const siteTypeId = await getTaxonomyId(SEED_CONSTANTS.TAXONOMY_GROUPS.SITE_TYPE, SEED_CONSTANTS.TAXONOMY_CODES.BATTLEFIELD);

    const locations = [
      {
        slug: SEED_CONSTANTS.ENTITIES.SONG_BACH_DANG,
        name: 'Sông Bạch Đằng',
        tagline: 'Dòng sông địa linh nhân kiệt với 3 lần đại thắng giặc phương Bắc',
        description: 'Dòng sông lịch sử chảy qua địa phận Quảng Ninh và Hải Phòng, nơi từng ghi dấu chiến thắng Ngô Quyền (938), Lê Hoàn (981) và Trần Quốc Tuấn (1288).',
        address: 'Thị xã Quảng Yên, tỉnh Quảng Ninh và huyện Thủy Nguyên, thành phố Hải Phòng',
        lat: 20.9065,
        lng: 106.6782,
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.VAN_DON,
        name: 'Thương cảng Vân Đồn',
        tagline: 'Thương cảng cổ phồn hoa và nơi diễn ra chiến thắng đánh chìm đoàn thuyền lương 1288',
        description: 'Thương cảng sầm uất thời Trần, địa bàn chiến lược nơi Nhân Huệ Vương Trần Khánh Dư bày trận chặn đánh tiêu diệt 70 vạn thạch lương của Trương Văn Hổ.',
        address: 'Huyện Vân Đồn, tỉnh Quảng Ninh',
        lat: 21.0543,
        lng: 107.4123,
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.THANG_LONG,
        name: 'Kinh thành Thăng Long',
        tagline: 'Trái tim của Đại Việt thời Lý - Trần',
        description: 'Kinh đô Đại Việt nơi diễn ra kế sách "Vườn không nhà trống" huyền thoại cả 3 lần khiến quân Mông - Nguyên lâm vào cảnh bế tắc, thiếu đói cùng cực.',
        address: 'Khu di tích Hoàng thành Thăng Long, Ba Đình, Hà Nội',
        lat: 21.0338,
        lng: 105.8407,
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.DI_TICH_BACH_DANG,
        name: 'Khu di tích quốc gia đặc biệt Bạch Đằng',
        tagline: 'Quần thể di tích quốc gia đặc biệt ghi dấu chiến tích năm 1288',
        description: 'Quần thể bao gồm các bãi cọc Yên Giang, Đồng Vạn Muối, Đồng Má Ngựa và các đền thờ vua Trần, Trần Hưng Đạo tại thị xã Quảng Yên.',
        address: 'Quảng Yên, tỉnh Quảng Ninh',
        lat: 20.9389,
        lng: 106.7944,
      },
    ];

    for (const loc of locations) {
      const entity = await prisma.historicalEntity.upsert({
        where: { slug: loc.slug },
        create: {
          slug: loc.slug,
          name: loc.name,
          type: HistoricalEntityType.LOCATION,
          periodId,
          tagline: loc.tagline,
          description: loc.description,
          status: ContentStatus.PUBLISHED,
        },
        update: { periodId, status: ContentStatus.PUBLISHED },
      });

      await prisma.historicalSite.upsert({
        where: { entityId: entity.id },
        create: {
          entityId: entity.id,
          siteType: SEED_CONSTANTS.TAXONOMY_CODES.BATTLEFIELD,
          siteTypeId,
          address: loc.address,
          latitude: loc.lat,
          longitude: loc.lng,
        },
        update: {
          siteTypeId,
          address: loc.address,
          latitude: loc.lat,
          longitude: loc.lng,
        },
      });
    }
  }

  private static async seedArtifacts(periodId: string) {
    console.log('  -> Nạp Hiện vật & Tác phẩm lịch sử...');

    await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.ENTITIES.BAI_COC_BACH_DANG },
      create: {
        slug: SEED_CONSTANTS.ENTITIES.BAI_COC_BACH_DANG,
        name: 'Bãi cọc gỗ Bạch Đằng',
        type: HistoricalEntityType.ARTIFACT,
        periodId,
        tagline: 'Chứng tích khảo cổ học đỉnh cao của nghệ thuật thủy chiến Đại Việt',
        description: 'Các cọc gỗ lim, táu có đường kính 20–30 cm, dài 2–3 m được vót nhọn đầu và cắm nghiêng xuôi theo dòng nước, tạo nên trận địa cạm bẫy ngầm dưới lòng sông.',
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });

    await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.ENTITIES.HICH_TUONG_SI },
      create: {
        slug: SEED_CONSTANTS.ENTITIES.HICH_TUONG_SI,
        name: 'Hịch tướng sĩ (Dụ chư tì tướng hịch văn)',
        type: HistoricalEntityType.ARTIFACT,
        periodId,
        tagline: 'Thiên cổ hùng văn khơi dậy tinh thần yêu nước và ý chí quyết chiến',
        description: 'Áng văn chính luận quân sự bất hủ do Tiết chế Trần Quốc Tuấn viết trước cuộc kháng chiến lần hai (1284), khích lệ tướng sĩ quyết tâm đánh giặc bảo vệ giang sơn.',
        startYear: 1284,
        datePrecision: DatePrecision.YEAR,
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });
  }

  private static async seedPersons(periodId: string) {
    console.log('  -> Nạp Danh nhân lịch sử & Tướng soái hai bên...');

    const persons = [
      {
        slug: SEED_CONSTANTS.ENTITIES.TRAN_HUNG_DAO,
        name: 'Trần Hưng Đạo (Trần Quốc Tuấn)',
        tagline: 'Quốc công Tiết chế — Thiên tài quân sự kiệt xuất của dân tộc',
        birthYear: 1228,
        deathYear: 1300,
        biography: 'Nhà quân sự thiên tài, linh hồn chỉ huy tối cao của quân đội Đại Việt trong 2 cuộc kháng chiến chống Nguyên - Mông lần 2 (1285) và lần 3 (1288). Ông được nhân dân tôn kính là Đức Thánh Trần.',
        titles: ['Tiết chế Quốc công', 'Hưng Đạo Đại Vương', 'Thái sư'],
        roles: ['COMMANDER', 'STRATEGIST'],
        isFeatured: true,
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.TRAN_NHAN_TONG,
        name: 'Vua Trần Nhân Tông (Trần Khâm)',
        tagline: 'Vị vua anh minh lãnh đạo toàn dân chiến thắng và Sơ tổ Thiền phái Trúc Lâm',
        birthYear: 1258,
        deathYear: 1308,
        biography: 'Vị hoàng đế thứ ba của nhà Trần, cùng Thượng hoàng lãnh đạo toàn dân Đại Việt vượt qua 2 cuộc xâm lăng khốc liệt nhất của quân Nguyên, về sau sáng lập Thiền phái Trúc Lâm Yên Tử.',
        titles: ['Hoàng đế Đại Việt', 'Trúc Lâm Đại Đầu Đà'],
        roles: ['MONARCH', 'COMMANDER'],
        isFeatured: true,
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.TRAN_THANH_TONG,
        name: 'Thượng hoàng Trần Thánh Tông (Trần Hoang)',
        tagline: 'Vị Thượng hoàng chủ trì Hội nghị Diên Hồng 1284',
        birthYear: 1240,
        deathYear: 1290,
        biography: 'Vị vua thứ hai của nhà Trần, sau nhường ngôi làm Thượng hoàng, cùng vua con điều hành đất nước, quy tụ sức mạnh đoàn kết toàn dân tộc.',
        titles: ['Thượng hoàng Đại Việt'],
        roles: ['MONARCH'],
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.TRAN_KHANH_DU,
        name: 'Trần Khánh Dư (Nhân Huệ Vương)',
        tagline: 'Vị tướng tài ba chỉ huy chiến thắng Vân Đồn làm xoay chuyển cục diện',
        birthYear: 1240,
        deathYear: 1340,
        biography: 'Phó đô tướng thủy quân Đại Việt, người lập chiến công hiển hách đánh chìm và bắt trọn đoàn thuyền lương Trương Văn Hổ tại Vân Đồn đầu năm 1288.',
        titles: ['Nhân Huệ Vương', 'Phó đô tướng'],
        roles: ['COMMANDER'],
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.O_MA_NHI,
        name: 'Ô Mã Nhi (Omar)',
        tagline: 'Tướng thủy binh hung hãn của quân đội Mông - Nguyên',
        birthYear: 1240,
        deathYear: 1289,
        biography: 'Tướng lĩnh người Hồi Hột phục vụ nhà Nguyên, nổi tiếng tàn bạo, chỉ huy toàn bộ thủy quân xâm lược Đại Việt năm 1288 và bị bắt sống tại trận Bạch Đằng.',
        titles: ['Tham tri chính sự', 'Tướng thủy quân Nguyên'],
        roles: ['OPPONENT'],
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.PHAN_TIEP,
        name: 'Phàn Tiếp',
        tagline: 'Tướng kỵ binh và thủy chiến tinh nhuệ của nhà Nguyên',
        deathYear: 1288,
        biography: 'Viên tướng hung hãn tiên phong cùng Ô Mã Nhi vượt sông Bạch Đằng, bị trúng tên độc, rơi xuống nước và bị quân Đại Việt dùng câu liêm bắt sống.',
        titles: ['Tướng quân viễn chinh Nguyên'],
        roles: ['OPPONENT'],
      },
      {
        slug: SEED_CONSTANTS.ENTITIES.THOAT_HOAN,
        name: 'Thoát Hoan (Toghan)',
        tagline: 'Trấn Nam Vương — Tổng chỉ huy hai cuộc viễn chinh xâm lược Đại Việt',
        biography: 'Hoàng tử thứ chín của Hốt Tất Liệt, được phong Trấn Nam Vương thống lĩnh đại quân xâm lược Đại Việt các năm 1285 và 1287-1288, cả hai lần đều đại bại tháo chạy.',
        titles: ['Trấn Nam Vương'],
        roles: ['OPPONENT'],
      },
    ];

    for (const p of persons) {
      const entity = await prisma.historicalEntity.upsert({
        where: { slug: p.slug },
        create: {
          slug: p.slug,
          name: p.name,
          type: HistoricalEntityType.PERSON,
          periodId,
          tagline: p.tagline,
          description: p.biography,
          isFeatured: p.isFeatured ?? false,
          status: ContentStatus.PUBLISHED,
        },
        update: {
          periodId,
          name: p.name,
          tagline: p.tagline,
          description: p.biography,
          isFeatured: p.isFeatured ?? false,
          status: ContentStatus.PUBLISHED,
        },
      });

      await prisma.person.upsert({
        where: { entityId: entity.id },
        create: {
          entityId: entity.id,
          birthYear: p.birthYear ?? null,
          deathYear: p.deathYear ?? null,
          biography: p.biography,
          titles: p.titles ?? [],
          roles: p.roles ?? [],
        },
        update: {
          birthYear: p.birthYear ?? null,
          deathYear: p.deathYear ?? null,
          biography: p.biography,
          titles: p.titles ?? [],
          roles: p.roles ?? [],
        },
      });
    }
  }

  private static async seedEvents(periodId: string) {
    console.log('  -> Nạp Sự kiện Chiến dịch & Xây dựng JSONB ContentBlocks chuẩn mực...');
    const battleTypeId = await getTaxonomyId(SEED_CONSTANTS.TAXONOMY_GROUPS.EVENT_TYPE, SEED_CONSTANTS.TAXONOMY_CODES.BATTLE);
    const warTypeId = await getTaxonomyId(SEED_CONSTANTS.TAXONOMY_GROUPS.EVENT_TYPE, SEED_CONSTANTS.TAXONOMY_CODES.WAR);

    // 1. Mega Event: Cuộc kháng chiến chống Nguyên - Mông lần thứ ba (1287 - 1288)
    const warEntity = await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.EVENTS.KHANG_CHIEN_LAN_3 },
      create: {
        slug: SEED_CONSTANTS.EVENTS.KHANG_CHIEN_LAN_3,
        name: 'Kháng chiến chống quân Mông - Nguyên lần thứ ba',
        type: HistoricalEntityType.EVENT,
        periodId,
        startYear: 1287,
        endYear: 1288,
        datePrecision: DatePrecision.YEAR,
        tagline: 'Cuộc kháng chiến toàn thắng chấm dứt vĩnh viễn mưu đồ xâm lược của nhà Nguyên',
        description: 'Cuộc kháng chiến vĩ đại do vua tôi nhà Trần lãnh đạo, đỉnh cao là hai trận đánh tiêu diệt lương thảo tại Vân Đồn và chôn vùi thủy quân giặc trên sông Bạch Đằng.',
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });
    await prisma.historicalEvent.upsert({
      where: { entityId: warEntity.id },
      create: { entityId: warEntity.id, categoryIds: [warTypeId] },
      update: { categoryIds: [warTypeId] },
    });

    // 2. Tiền đề Nhân quả: Trận Vân Đồn (Đầu năm 1288)
    const vanDonEntity = await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.EVENTS.TRAN_VAN_DON },
      create: {
        slug: SEED_CONSTANTS.EVENTS.TRAN_VAN_DON,
        name: 'Trận Vân Đồn (Chiến thắng tiêu diệt đoàn thuyền lương Trương Văn Hổ)',
        type: HistoricalEntityType.EVENT,
        periodId,
        startYear: 1288,
        datePrecision: DatePrecision.YEAR,
        tagline: 'Đòn đánh hiểm quyết định xoay chuyển hoàn toàn cục diện chiến tranh',
        description: 'Nhân Huệ Vương Trần Khánh Dư chỉ huy thủy quân phục kích tiêu diệt hoàn toàn đoàn thuyền tải 70 vạn thạch lương của giặc Nguyên, khiến đạo quân Thoát Hoan lâm vào cảnh đói khát cùng quẫn.',
        status: ContentStatus.PUBLISHED,
      },
      update: { periodId, status: ContentStatus.PUBLISHED },
    });
    await prisma.historicalEvent.upsert({
      where: { entityId: vanDonEntity.id },
      create: {
        entityId: vanDonEntity.id,
        parentId: warEntity.id,
        categoryIds: [battleTypeId],
      },
      update: {
        parentId: warEntity.id,
        categoryIds: [battleTypeId],
      },
    });

    // 3. Sự kiện Đỉnh cao: ĐẠI THẮNG BẠCH ĐẰNG 1288 (với ContentBlocks JSONB chất lượng Bảo tàng số)
    const bachDangBlocks = new ContentBlockBuilder()
      // Khối 1: Trích dẫn hào hùng
      .addQuote(
        'blk_quote_thd',
        'Năm nay đánh giặc nhàn!',
        'Tiết chế Quốc công Trần Hưng Đạo',
        'Đại Việt Sử Ký Toàn Thư (Tâu với Thượng hoàng Thánh Tông sau khi tin thắng trận Vân Đồn báo về)',
      )
      // Khối 2: Văn bản Dẫn nhập bối cảnh chiến lược
      .addText(
        'blk_text_context',
        `<h2>1. Bối cảnh chiến lược: Khi đạo quân xâm lược lâm vào tuyệt lộ</h2>
<p>Đầu năm 1288, hơn 30 vạn quân Mông - Nguyên dưới sự chỉ huy của <strong>Trấn Nam Vương Thoát Hoan</strong> ồ ạt tiến vào Thăng Long nhưng chỉ thấy một tòa thành hoang vắng tiêu điều do quân dân Đại Việt thực hiện triệt để kế sách <em>"Vườn không nhà trống"</em>.</p>
<p>Điều trí mạng nhất đối với đạo quân xâm lược là toàn bộ đoàn thuyền chở <strong>70 vạn thạch lương thảo</strong> của Trương Văn Hổ đã bị danh tướng <strong>Trần Khánh Dư</strong> đánh đắm hoàn toàn tại vùng biển <em>Vân Đồn</em>. Không có lương ăn, quân sĩ hoang mang, dịch bệnh hoành hành, Thoát Hoan buộc phải hạ lệnh chia quân rút lui về nước: bộ binh theo hướng Lạng Sơn, còn toàn bộ thủy quân tinh nhuệ do tướng <strong>Ô Mã Nhi</strong> và <strong>Phàn Tiếp</strong> chỉ huy rút lui theo đường sông Bạch Đằng.</p>`,
      )
      // Khối 3: Hộp tiêu điểm Nghệ thuật quân sự
      .addCallout(
        'blk_callout_military_art',
        'AMBER',
        'Kế sách "Dĩ đoản binh chế trường trận" & Trận địa cọc ngầm',
        'Kế thừa sáng tạo chiến thắng của Ngô Quyền năm 938, Trần Quốc Tuấn đã huy động hàng vạn quân dân chặt gỗ lim từ rừng Tràng Kênh, vót nhọn, bịt sắt cắm chéo đón dòng nước dưới lòng sông Bạch Đằng. Sự tính toán chuẩn xác quy luật nhật triều phương Nam đã biến con sông thành một cái bẫy khổng lồ không lối thoát.',
      )
      // Khối 4: Bảng so sánh Tương quan Lực lượng
      .addComparisonTable(
        'blk_table_forces',
        'So sánh tương quan chiến lược giữa Thủy quân Mông - Nguyên và Quân dân Đại Việt',
        'Thủy quân Mông - Nguyên (Ô Mã Nhi, Phàn Tiếp)',
        'Quân thủy - bộ Đại Việt (Trần Quốc Tuấn chỉ huy)',
        [
          {
            criteria: 'Lực lượng & Phương tiện',
            colA: 'Hơn 400 chiến thuyền tải trọng lớn, trang bị máy bắn đá và cung nỏ cực mạnh',
            colB: 'Đội thuyền chiến cơ động cao, kết hợp phục binh thủy - bộ dọc hai bên bờ sông',
          },
          {
            criteria: 'Sĩ khí & Lương thảo',
            colA: 'Hoang mang tột độ, cạn kiệt lương thực, mục đích duy nhất là tháo chạy an toàn',
            colB: 'Hào khí Sát Thát ngút trời, chủ động bày sẵn thế trận đón lõng kẻ thù',
          },
          {
            criteria: 'Địa hình & Yếu tố tự nhiên',
            colA: 'Hoàn toàn xa lạ với địa thế hiểm trở và quy luật nước thủy triều lên xuống',
            colB: 'Am tường con nước từng giờ, làm chủ các nhánh sông ngòi bọc lót hiểm hóc',
          },
          {
            criteria: 'Kết cục sau trận đánh',
            colA: 'Hơn 400 thuyền bị thiêu rụi/chìm đắm, tướng soái Ô Mã Nhi, Phàn Tiếp bị bắt sống',
            colB: 'Toàn thắng vang dội, đất nước sạch bóng quân thù, bảo toàn vẹn toàn độc lập',
          },
        ],
      )
      // Khối 5: Trục thời gian diễn biến trận đánh ngày 9/4/1288
      .addTimeline(
        'blk_timeline_battle',
        'Nhật ký tác chiến trận Bạch Đằng — Ngày 09 tháng 4 năm 1288 (8 tháng 3 Âm lịch)',
        'Kế hoạch phục kích liên hoàn theo từng con nước thủy triều',
        [
          {
            id: 'node_morning',
            year: 'Sáng sớm (Nước lớn)',
            title: 'Khiêu chiến nhử địch vượt qua bãi cọc ngầm',
            description: 'Trần Quốc Tuấn cử một đội thuyền nhẹ ra nghênh chiến rồi giả thua tháo chạy. Ô Mã Nhi tưởng thật, đốc thúc toàn bộ chiến thuyền đuổi theo vượt qua bãi cọc khi mực nước sông đang dâng cao ngập đầu cọc.',
            detailContent: '<p>Chiến thuật nghi binh tài tình của các tướng lĩnh Đại Việt đã dụ toàn bộ đoàn thuyền cồng kềnh của địch lọt sâu vào tử địa mà quân giặc không hề hay biết cạm bẫy dưới đáy sông.</p>',
          },
          {
            id: 'node_noon',
            year: 'Chính trưa (Nước triều đứng & bắt đầu rút)',
            title: 'Tổng phản công — Thuyền giặc mắc kẹt trên bãi cọc nhọn',
            description: 'Đúng giờ Ngọ, nước thủy triều rút cực nhanh. Trần Quốc Tuấn hạ lệnh cho phục binh từ các nhánh sông Chanh, sông Rút và hai bên bờ Tràng Kênh ồ ạt đổ ra giáp chiến, chặn đầu khóa đuôi quân giặc.',
            detailContent: '<p>Quân Đại Việt dùng thuyền nhỏ cơ động xông vào chia cắt đội hình địch, phóng hỏa tiễn thiêu đốt thuyền giặc. Thuyền quân Nguyên lùi lại thì gặp bãi cọc nhô lên đâm thủng vỡ toang, đội hình rối loạn đè bẹp lẫn nhau.</p>',
          },
          {
            id: 'node_afternoon',
            year: 'Chiều muộn (Thủy triều cạn)',
            title: 'Đại thắng khải hoàn — Bắt sống Ô Mã Nhi và các tướng chỉ huy',
            description: 'Toàn bộ đạo thủy quân viễn chinh Mông - Nguyên bị chôn vùi. Các tướng giặc Ô Mã Nhi, Phàn Tiếp, Tích Lệ Cơ đều bị quân ta bắt sống tại trận.',
            detailContent: '<p>Trận quyết chiến kết thúc trọn vẹn. Vua Trần Nhân Tông cho khắc thơ lên vách đá Tràng Kênh để muôn đời ghi nhớ: <em>"Bạch Đằng nhất trận điếm phong ba / Xã tắc lưỡng triều phao lộc mã"</em> (Sông Bạch Đằng một trận dẹp sạch sóng gió / Hai triều gian nan gìn giữ vẹn toàn giang sơn).</p>',
          },
        ],
      )
      // Khối 6: Bố cục 2 cột Tướng lĩnh Đối đầu
      .addSectionRow('blk_row_commanders', [
        {
          id: 'col_thd',
          widthPercent: 50,
          blocks: [
            {
              id: 'char_thd',
              type: 'CHARACTER',
              name: 'Quốc công Tiết chế Trần Hưng Đạo',
              years: '1228 – 1300',
              summary: 'Tổng chỉ huy thiên tài của quân dân Đại Việt — người kiến tạo nên trận địa cọc ngầm Bạch Đằng lịch sử.',
              detailContent: '<p>Tài năng quân sự xuất chúng của Trần Hưng Đạo thể hiện ở chỗ: biết dựa vào dân, phát huy sở trường đánh thủy của người Việt, và nắm bắt chuẩn xác từng biến đổi của thiên nhiên để giáng đòn chí tử tiêu diệt quân thù.</p>',
            },
          ],
        },
        {
          id: 'col_omn',
          widthPercent: 50,
          blocks: [
            {
              id: 'char_omn',
              type: 'CHARACTER',
              name: 'Tướng giặc Ô Mã Nhi (Omar)',
              years: 'Mất năm 1289',
              summary: 'Tướng soái thủy quân Mông - Nguyên khét tiếng hung hãn và kiêu ngạo, đã sa vào bẫy phục kích và chịu trói tại sông Bạch Đằng.',
              detailContent: '<p>Từng ngạo nghễ tuyên bố san phẳng Đại Việt, nhưng sự mù quáng và coi thường đối thủ của Ô Mã Nhi đã dẫn toàn bộ hạm đội hơn 400 chiến thuyền vào chỗ diệt vong.</p>',
            },
          ],
        },
      ])
      // Khối 7: Khối Bản đồ chiến sự
      .addMap(
        'blk_map_battlefield',
        'Trận địa phục kích sông Bạch Đằng — Ngã ba sông Chanh & Dãy núi Tràng Kênh',
        'Khu vực tác chiến kéo dài từ cửa biển Nam Triệu qua ngã ba sông Bạch Đằng - sông Chanh đến khu vực Tràng Kênh (Quảng Ninh - Hải Phòng). Đây là khúc sông hiểm yếu với nhiều luồng lạch và bãi ngập bùn lầy khi triều rút.',
      )
      // Khối 8: Hiện vật Bãi cọc khảo cổ học
      .addImage(
        'blk_img_coc_go',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Bach_Dang_stake.jpg/640px-Bach_Dang_stake.jpg',
        'Cọc gỗ Bạch Đằng tại di tích Yên Giang',
        'Những thân cọc gỗ lim được khai quật tại bãi cọc Yên Giang (thị xã Quảng Yên) — minh chứng khảo cổ sống động cho trận địa cọc ngầm kỳ tài của Trần Hưng Đạo năm 1288.',
      )
      // Khối 9: Ý nghĩa lịch sử & Lời bình
      .addText(
        'blk_text_legacy',
        `<h2>2. Ý nghĩa lịch sử thiên thu & Hào khí Đông A</h2>
<p>Chiến thắng Bạch Đằng năm 1288 không chỉ cứu nước Đại Việt thoát khỏi thảm họa diệt vong dưới gót sắt của đế chế Mông - Nguyên, mà còn có tầm vóc thời đại sâu sắc: <strong>ngăn chặn hoàn toàn dã tâm bành trướng của quân Nguyên xuống toàn bộ khu vực Đông Nam Á</strong>.</p>
<p>Chiến công chói lọi này là đỉnh cao kết tinh của <em>Hào khí Đông A</em> — biểu tượng bất diệt cho ý chí độc lập, tự chủ, sức mạnh đoàn kết toàn dân và trí tuệ quân sự Việt Nam.</p>`,
      )
      .addCallout(
        'blk_callout_dvsktt',
        'EMERALD',
        'Lời bình của Sử thần Ngô Sĩ Liên (Đại Việt Sử Ký Toàn Thư)',
        '"Trận đánh này sở dĩ thành công là nhờ vua tôi đồng lòng, anh em hòa thuận, cả nước chung sức, tướng giỏi quyền biến, tùy cơ ứng biến mà nên vậy."',
      )
      .build();

    const bachDangEntity = await prisma.historicalEntity.upsert({
      where: { slug: SEED_CONSTANTS.EVENTS.TRAN_BACH_DANG },
      create: {
        slug: SEED_CONSTANTS.EVENTS.TRAN_BACH_DANG,
        name: 'Đại thắng Bạch Đằng năm 1288',
        type: HistoricalEntityType.EVENT,
        periodId,
        startYear: 1288,
        startMonth: 4,
        startDay: 9,
        endYear: 1288,
        endMonth: 4,
        endDay: 9,
        datePrecision: DatePrecision.DAY,
        tagline: 'Trận quyết chiến chiến lược vĩ đại chôn vùi toàn bộ đạo thủy binh Mông - Nguyên',
        description: 'Trận thủy chiến lừng lẫy trên sông Bạch Đằng do Hưng Đạo Vương Trần Quốc Tuấn chỉ huy, đánh tan hơn 400 chiến thuyền giặc, bắt sống Ô Mã Nhi, đập tan hoàn toàn cuộc xâm lăng của nhà Nguyên.',
        contentBlocks: bachDangBlocks,
        isFeatured: true,
        displayOrder: 1,
        status: ContentStatus.PUBLISHED,
      },
      update: {
        periodId,
        name: 'Đại thắng Bạch Đằng năm 1288',
        startYear: 1288,
        startMonth: 4,
        startDay: 9,
        endYear: 1288,
        endMonth: 4,
        endDay: 9,
        datePrecision: DatePrecision.DAY,
        tagline: 'Trận quyết chiến chiến lược vĩ đại chôn vùi toàn bộ đạo thủy binh Mông - Nguyên',
        description: 'Trận thủy chiến lừng lẫy trên sông Bạch Đằng do Hưng Đạo Vương Trần Quốc Tuấn chỉ huy, đánh tan hơn 400 chiến thuyền giặc, bắt sống Ô Mã Nhi, đập tan hoàn toàn cuộc xâm lăng của nhà Nguyên.',
        contentBlocks: bachDangBlocks,
        isFeatured: true,
        status: ContentStatus.PUBLISHED,
      },
    });

    await prisma.historicalEvent.upsert({
      where: { entityId: bachDangEntity.id },
      create: {
        entityId: bachDangEntity.id,
        parentId: warEntity.id,
        categoryIds: [battleTypeId],
        eventDateNote: 'Ngày 09/04/1288 (tức ngày 8 tháng 3 năm Mậu Tý)',
      },
      update: {
        parentId: warEntity.id,
        categoryIds: [battleTypeId],
        eventDateNote: 'Ngày 09/04/1288 (tức ngày 8 tháng 3 năm Mậu Tý)',
      },
    });
  }

  private static async seedStatements() {
    console.log('  -> Thiết lập Mạng lưới Quan hệ Knowledge Graph (Statements)...');

    // Lấy ID thực thể
    const getEntity = async (slug: string) => {
      const e = await prisma.historicalEntity.findUnique({ where: { slug } });
      if (!e) throw new Error(`Không tìm thấy Entity "${slug}" để tạo Statement!`);
      return e.id;
    };

    const bachDangId = await getEntity(SEED_CONSTANTS.EVENTS.TRAN_BACH_DANG);
    const vanDonId = await getEntity(SEED_CONSTANTS.EVENTS.TRAN_VAN_DON);
    const warId = await getEntity(SEED_CONSTANTS.EVENTS.KHANG_CHIEN_LAN_3);
    const thdId = await getEntity(SEED_CONSTANTS.ENTITIES.TRAN_HUNG_DAO);
    const nhanTongId = await getEntity(SEED_CONSTANTS.ENTITIES.TRAN_NHAN_TONG);
    const thanhTongId = await getEntity(SEED_CONSTANTS.ENTITIES.TRAN_THANH_TONG);
    const khanhDuId = await getEntity(SEED_CONSTANTS.ENTITIES.TRAN_KHANH_DU);
    const oMaNhiId = await getEntity(SEED_CONSTANTS.ENTITIES.O_MA_NHI);
    const phanTiepId = await getEntity(SEED_CONSTANTS.ENTITIES.PHAN_TIEP);
    const thoatHoanId = await getEntity(SEED_CONSTANTS.ENTITIES.THOAT_HOAN);
    const songBachDangId = await getEntity(SEED_CONSTANTS.ENTITIES.SONG_BACH_DANG);
    const vanDonLocId = await getEntity(SEED_CONSTANTS.ENTITIES.VAN_DON);
    const baiCocId = await getEntity(SEED_CONSTANTS.ENTITIES.BAI_COC_BACH_DANG);
    const hichTuongSiId = await getEntity(SEED_CONSTANTS.ENTITIES.HICH_TUONG_SI);
    const daiVietId = await getEntity(SEED_CONSTANTS.ENTITIES.DAI_VIET);
    const nhaTranId = await getEntity(SEED_CONSTANTS.ENTITIES.NHA_TRAN);
    const mongCoId = await getEntity(SEED_CONSTANTS.ENTITIES.DE_QUOC_MONG_CO);

    // Lấy ID predicates
    const getPred = (code: string) => getTaxonomyId(SEED_CONSTANTS.TAXONOMY_GROUPS.PREDICATE, code);
    const predCommanded = await getPred(SEED_CONSTANTS.PREDICATES.COMMANDED);
    const predParticipated = await getPred(SEED_CONSTANTS.PREDICATES.PARTICIPATED_IN);
    const predOccurredAt = await getPred(SEED_CONSTANTS.PREDICATES.OCCURRED_AT);
    const predCausedBy = await getPred(SEED_CONSTANTS.PREDICATES.CAUSED_BY);
    const predSubEventOf = await getPred(SEED_CONSTANTS.PREDICATES.SUB_EVENT_OF);
    const predOpponentOf = await getPred(SEED_CONSTANTS.PREDICATES.OPPONENT_OF);
    const predRuled = await getPred(SEED_CONSTANTS.PREDICATES.RULED);
    const predChildOf = await getPred(SEED_CONSTANTS.PREDICATES.CHILD_OF);
    const predAuthored = await getPred(SEED_CONSTANTS.PREDICATES.AUTHORED);
    const predLocatedAt = await getPred(SEED_CONSTANTS.PREDICATES.LOCATED_AT);

    const statementsData = [
      // 1. Nhân quả Sự kiện: Đại thắng Bạch Đằng caused by Trận Vân Đồn
      {
        subjectId: bachDangId,
        predicateId: predCausedBy,
        objectId: vanDonId,
        qualifiers: {
          mechanism: 'Trận Vân Đồn tiêu diệt đoàn thuyền lương khiến quân Nguyên thiếu đói cùng cực, buộc phải rút lui qua đường sông Bạch Đằng, mở ra thời cơ quyết chiến.',
          directness: 'DIRECT',
        },
        validFromYear: 1288,
        validToYear: 1288,
      },
      // 2. Phân cấp Sự kiện: Trận Bạch Đằng & Vân Đồn là sự kiện con của Kháng chiến lần 3
      {
        subjectId: bachDangId,
        predicateId: predSubEventOf,
        objectId: warId,
        qualifiers: { phase: 'Quyết chiến chiến lược kết thúc chiến tranh', order: 2 },
        validFromYear: 1288,
        validToYear: 1288,
      },
      {
        subjectId: vanDonId,
        predicateId: predSubEventOf,
        objectId: warId,
        qualifiers: { phase: 'Chặn đường tiếp tế lương thảo', order: 1 },
        validFromYear: 1288,
        validToYear: 1288,
      },
      // 3. Chỉ huy & Tham chiến trong trận Bạch Đằng
      {
        subjectId: thdId,
        predicateId: predCommanded,
        objectId: bachDangId,
        qualifiers: { role: 'COMMANDER', roleLabel: 'Quốc công Tiết chế — Tổng tư lệnh chiến dịch' },
        validFromYear: 1288,
        validToYear: 1288,
        isPrimary: true,
      },
      {
        subjectId: nhanTongId,
        predicateId: predParticipated,
        objectId: bachDangId,
        qualifiers: { role: 'MONARCH', roleLabel: 'Hoàng đế thống suất kháng chiến' },
        validFromYear: 1288,
        validToYear: 1288,
      },
      {
        subjectId: oMaNhiId,
        predicateId: predParticipated,
        objectId: bachDangId,
        qualifiers: { role: 'OPPONENT', roleLabel: 'Tướng giặc chỉ huy đạo thủy binh (Bị bắt sống)' },
        validFromYear: 1288,
        validToYear: 1288,
      },
      {
        subjectId: phanTiepId,
        predicateId: predParticipated,
        objectId: bachDangId,
        qualifiers: { role: 'OPPONENT', roleLabel: 'Tướng tiên phong giặc (Bị bắt sống)' },
        validFromYear: 1288,
        validToYear: 1288,
      },
      // 4. Chỉ huy trận Vân Đồn
      {
        subjectId: khanhDuId,
        predicateId: predCommanded,
        objectId: vanDonId,
        qualifiers: { role: 'COMMANDER', roleLabel: 'Phó đô tướng thủy quân Đại Việt' },
        validFromYear: 1288,
        validToYear: 1288,
        isPrimary: true,
      },
      // 5. Địa điểm diễn ra trận đánh (OCCURRED_AT)
      {
        subjectId: bachDangId,
        predicateId: predOccurredAt,
        objectId: songBachDangId,
        qualifiers: { notes: 'Chiến trường hạ lưu sông Bạch Đằng giáp ranh Quảng Ninh và Hải Phòng' },
        validFromYear: 1288,
        validToYear: 1288,
        isPrimary: true,
      },
      {
        subjectId: vanDonId,
        predicateId: predOccurredAt,
        objectId: vanDonLocId,
        qualifiers: { notes: 'Vùng biển thương cảng Vân Đồn' },
        validFromYear: 1288,
        validToYear: 1288,
        isPrimary: true,
      },
      // 6. Hiện vật khảo cổ gắn với địa điểm
      {
        subjectId: baiCocId,
        predicateId: predLocatedAt,
        objectId: songBachDangId,
        qualifiers: { notes: 'Bãi cọc ngầm dưới lòng sông và đầm lầy Yên Giang' },
      },
      // 7. Tác giả áng văn Hịch tướng sĩ
      {
        subjectId: thdId,
        predicateId: predAuthored,
        objectId: hichTuongSiId,
        qualifiers: { year: 1284, genre: 'Hịch văn chính luận quân sự' },
        validFromYear: 1284,
      },
      // 8. Quan hệ Thực thể: Đối kháng quốc gia & Tướng lĩnh
      {
        subjectId: daiVietId,
        predicateId: predOpponentOf,
        objectId: mongCoId,
        qualifiers: { context: '3 cuộc kháng chiến chống Mông - Nguyên xâm lược' },
      },
      {
        subjectId: thdId,
        predicateId: predOpponentOf,
        objectId: thoatHoanId,
        qualifiers: { context: 'Trần Hưng Đạo trực tiếp đối đầu Trấn Nam Vương Thoát Hoan' },
      },
      {
        subjectId: thdId,
        predicateId: predOpponentOf,
        objectId: oMaNhiId,
        qualifiers: { context: 'Đối đầu thủy chiến quyết định tại sông Bạch Đằng' },
      },
      // 9. Quan hệ Phả hệ & Chính trị hoàng tộc
      {
        subjectId: nhanTongId,
        predicateId: predRuled,
        objectId: nhaTranId,
        qualifiers: { reignStartYear: 1278, reignEndYear: 1293 },
      },
      {
        subjectId: nhanTongId,
        predicateId: predChildOf,
        objectId: thanhTongId,
        qualifiers: { biological: true },
      },
    ];

    for (const stmt of statementsData) {
      const existing = await prisma.historicalStatement.findFirst({
        where: {
          subjectId: stmt.subjectId,
          predicateId: stmt.predicateId,
          objectId: stmt.objectId,
        },
      });

      if (existing) {
        await prisma.historicalStatement.update({
          where: { id: existing.id },
          data: {
            qualifiers: stmt.qualifiers,
            validFromYear: stmt.validFromYear ?? null,
            validToYear: stmt.validToYear ?? null,
            isPrimary: stmt.isPrimary ?? false,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        });
      } else {
        await prisma.historicalStatement.create({
          data: {
            subjectId: stmt.subjectId,
            predicateId: stmt.predicateId,
            objectId: stmt.objectId,
            qualifiers: stmt.qualifiers,
            validFromYear: stmt.validFromYear ?? null,
            validToYear: stmt.validToYear ?? null,
            isPrimary: stmt.isPrimary ?? false,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        });
      }
    }
  }
}

// ----------------------------------------------------------------------------
// THỰC THI SEED NẾU CHẠY TRỰC TIẾP TỪ CLI
// ----------------------------------------------------------------------------

if (require.main === module) {
  TranDynastySeedFacade.execute()
    .catch((err) => {
      console.error('❌ Lỗi khi nạp dữ liệu Kỷ nguyên Nhà Trần:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
