/**
 * TẦNG 1: THỬ NGHIỆM TỰ ĐỘNG CÀO & BIÊN DỊCH DỮ LIỆU TRIỀU ĐẠI NHÀ LÝ (1009 - 1225)
 *
 * Pipeline kết hợp:
 * 1. Wikipedia REST API: Cào metadata chính thức & trích đoạn sử liệu uy tín.
 * 2. DynastyContentTransformer (Builder Pattern): Biên tập tự động thành bộ contentBlocks JSONB
 *    đa phương thức chất lượng Bảo tàng số (QUOTE, TEXT, CALLOUT, COMPARISON_TABLE, TIMELINE, MAP, IMAGE).
 * 3. Database Ingestion: Upsert vào HistoricalEntity (type=DYNASTY) và gắn chuẩn với Period "thoi-ky-nha-ly".
 *
 * Tuân thủ: SOLID, Design Patterns, Zero Magic String.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient, HistoricalEntityType, ContentStatus, DatePrecision } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

// ============================================================================
// HẰNG SỐ ĐỊNH DANH (ZERO MAGIC STRINGS)
// ============================================================================

export const DYNASTY_CONSTANTS = {
  SLUG: 'nha-ly',
  NAME: 'Triều đại Nhà Lý',
  PERIOD_SLUG: 'thoi-ky-nha-ly',
  START_YEAR: 1009,
  END_YEAR: 1225,
  WIKI_API_URL: 'https://vi.wikipedia.org/api/rest_v1/page/summary/Nh%C3%A0_L%C3%BD',
  BLOCK_TYPES: {
    TEXT: 'TEXT',
    QUOTE: 'QUOTE',
    CALLOUT: 'CALLOUT',
    TIMELINE: 'TIMELINE',
    COMPARISON_TABLE: 'COMPARISON_TABLE',
    MAP: 'MAP',
    IMAGE: 'IMAGE',
  },
} as const;

// ============================================================================
// WIKIPEDIA REST API CLIENT
// ============================================================================

export interface WikipediaSummaryResponse {
  title: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
  description?: string;
  content_urls?: { desktop: { page: string } };
}

export class WikipediaApiClient {
  /**
   * Gọi Wikipedia REST API lấy bản tóm tắt và metadata chính thức
   */
  public static async fetchSummary(apiUrl: string): Promise<WikipediaSummaryResponse> {
    console.log(`🌐 Đang kết nối Wikipedia REST API: ${apiUrl}...`);
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'AntigravityHistoryBot/1.0 (contact@tlcn-dt07.edu.vn)',
      },
    });

    if (!res.ok) {
      throw new Error(`Wikipedia API phản hồi lỗi HTTP ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as WikipediaSummaryResponse;
    console.log(`✅ Lấy thành công dữ liệu bách khoa bài viết: "${data.title}"`);
    return data;
  }
}

// ============================================================================
// CONTENT BLOCK BUILDER & TRANSFORMER (BUILDER & STRATEGY PATTERNS)
// ============================================================================

export class DynastyContentTransformer {
  /**
   * Biến đổi dữ liệu thô và tài liệu sử học thành 8 khối JSONB chất lượng Bảo tàng số
   */
  public static transformToBlocks(wikiData: WikipediaSummaryResponse): Record<string, any>[] {
    const blocks: Record<string, any>[] = [];

    // Khối 1: QUOTE — Thiên cổ hùng văn Chiếu dời đô
    blocks.push({
      id: 'blk_quote_thien_do_chieu',
      type: DYNASTY_CONSTANTS.BLOCK_TYPES.QUOTE,
      quoteText:
        'Huống chi thành Đại La, đô cũ của Cao Vương: Ở vào nơi trung tâm trời đất; được cái thế rồng cuộn hổ ngồi. Đã đúng ngôi Nam Bắc Đông Tây; lại tiện hướng nhìn sông tựa núi... Thật là chốn tụ hội trọng yếu của bốn phương đất nước; cũng là nơi kinh đô bậc nhất của đế vương muôn đời.',
      author: 'Thái Tổ Hoàng đế Lý Công Uẩn',
      sourceContext: 'Thiên đô chiếu (Chiếu dời đô), Mùa thu năm Canh Tuất 1010',
    });

    // Khối 2: TEXT — Tổng quan triều đại và bối cảnh thành lập từ Wikipedia
    blocks.push({
      id: 'blk_text_overview',
      type: DYNASTY_CONSTANTS.BLOCK_TYPES.TEXT,
      content: `<h2>1. Buổi đầu lập quốc & Kỷ nguyên định đô Thăng Long</h2>
<p><strong>Triều đại Nhà Lý</strong> (1009 – 1225) là vương triều quân chủ mở đầu cho kỷ nguyên độc lập tự chủ lâu dài và phát triển rực rỡ văn minh Đại Việt.</p>
<p>${wikiData.extract}</p>
<p>Dưới sự hỗ trợ của Thiền sư Vạn Hạnh và các đại thần, việc dời đô từ vùng núi non hiểm trở Hoa Lư về đồng bằng màu mỡ Thăng Long năm 1010 đã thể hiện tầm nhìn chiến lược vượt thời đại, mở ra thời kỳ hưng thịnh kéo dài hơn hai thế kỷ của dân tộc.</p>`,
    });

    // Khối 3: CALLOUT — Quốc hiệu Đại Việt & Quốc giáo Phật giáo
    blocks.push({
      id: 'blk_callout_dai_viet_phat_giao',
      type: DYNASTY_CONSTANTS.BLOCK_TYPES.CALLOUT,
      variant: 'HISTORICAL_NOTE',
      title: 'Quốc hiệu Đại Việt (1054) & Thời kỳ Phật giáo là Quốc giáo',
      content:
        'Năm 1054, vua Lý Thánh Tông đặt quốc hiệu nước ta là Đại Việt — quốc hiệu thiêng liêng gắn liền với các trang sử vẻ vang nhất. Thời Lý, Phật giáo đạt đỉnh cao hưng thịnh, được coi là Quốc giáo. Triều đình cho xây dựng hàng trăm danh lam cổ tự như Chùa Một Cột (Diên Hựu tự), Tháp Báo Thiên, Tháp Sùng Thiện Diên Linh; các vị cao tăng thường xuyên được vua thỉnh mời bàn luận việc nước.',
    });

    // Khối 4: COMPARISON_TABLE — Bảng 9 vị Hoàng đế triều Lý
    blocks.push({
      id: 'blk_table_emperors',
      type: DYNASTY_CONSTANTS.BLOCK_TYPES.COMPARISON_TABLE,
      title: 'Bảng niên biểu 9 vị Hoàng đế triều đại Nhà Lý (1009 – 1225)',
      colAName: 'Hoàng đế & Niên hiệu',
      colBName: 'Thời gian trị vì & Cương vị lịch sử',
      rows: [
        {
          criteria: 'Lý Thái Tổ (Lý Công Uẩn)',
          colA: 'Niên hiệu: Thuận Thiên (1010 – 1028)',
          colB: '1009 – 1028 (19 năm) • Sáng lập vương triều, ban Chiếu dời đô về Thăng Long',
        },
        {
          criteria: 'Lý Thái Tông (Lý Phật Mã)',
          colA: 'Niên hiệu: Thông Thụy, Càn Phù...',
          colB: '1028 – 1054 (26 năm) • Dẹp loạn Tam vương, ban bố bộ luật "Hình thư" năm 1042',
        },
        {
          criteria: 'Lý Thánh Tông (Lý Nhật Tôn)',
          colA: 'Niên hiệu: Long Thụy, Chương Thánh...',
          colB: '1054 – 1072 (18 năm) • Đổi quốc hiệu Đại Việt, lập Văn Miếu (1070)',
        },
        {
          criteria: 'Lý Nhân Tông (Lý Càn Đức)',
          colA: 'Niên hiệu: Thái Ninh, Anh Vũ...',
          colB: '1072 – 1127 (55 năm) • Lập Quốc Tử Giám (1076), chiến thắng phòng tuyến Như Nguyệt',
        },
        {
          criteria: 'Lý Thần Tông (Lý Dương Hoán)',
          colA: 'Niên hiệu: Thiên Thuận, Càn Thành',
          colB: '1127 – 1138 (11 năm) • Trị vì thời kỳ thái bình thịnh trị, sùng kính Phật pháp',
        },
        {
          criteria: 'Lý Anh Tông (Lý Thiên Tộ)',
          colA: 'Niên hiệu: Đại Định, Chính Long...',
          colB: '1138 – 1175 (37 năm) • Khảo sát cương giới, lập trang Vân Đồn mở rộng ngoại thương',
        },
        {
          criteria: 'Lý Cao Tông (Lý Long Cán)',
          colA: 'Niên hiệu: Trị Bình, Thiên Gia...',
          colB: '1175 – 1210 (35 năm) • Triều chính bắt đầu suy yếu, phong trào nổi dậy bùng nổ',
        },
        {
          criteria: 'Lý Huệ Tông (Lý Sảm)',
          colA: 'Niên hiệu: Kiến Gia (1211 – 1224)',
          colB: '1210 – 1224 (14 năm) • Thế lực họ Trần trỗi dậy thao túng triều đình',
        },
        {
          criteria: 'Lý Chiêu Hoàng (Lý Phật Kim)',
          colA: 'Niên hiệu: Thiên Chương Hữu Đạo',
          colB: '1224 – 1225 (1 năm) • Nữ hoàng duy nhất trong lịch sử, nhường ngôi cho Trần Cảnh',
        },
      ],
    });

    // Khối 5: TIMELINE — Các mốc son lịch sử chói lọi
    blocks.push({
      id: 'blk_timeline_milestones',
      type: DYNASTY_CONSTANTS.BLOCK_TYPES.TIMELINE,
      title: 'Biên niên sử các mốc son chói lọi của Vương triều Nhà Lý',
      subtitle: '216 năm định hình nền văn hiến và quốc thống Đại Việt',
      orientation: 'VERTICAL',
      nodes: [
        {
          id: 'node_1009',
          year: '1009',
          title: 'Khởi lập triều đại Nhà Lý tại Hoa Lư',
          description: 'Lý Công Uẩn được triều thần và tăng lữ suy tôn lên ngôi Hoàng đế, lấy hiệu Lý Thái Tổ, mở đầu triều đại.',
        },
        {
          id: 'node_1010',
          year: '1010',
          title: 'Ban Chiếu dời đô & Định đô Thăng Long',
          description: 'Dời đô từ Hoa Lư về thành Đại La, đổi tên thành Thăng Long khi thấy hình tượng rồng vàng bay lên.',
        },
        {
          id: 'node_1042',
          year: '1042',
          title: 'Ban hành bộ luật "Hình thư"',
          description: 'Bộ luật thành văn đầu tiên trong lịch sử pháp luật Việt Nam, xác lập khuôn khổ trật tự xã hội quân chủ.',
        },
        {
          id: 'node_1054',
          year: '1054',
          title: 'Chính thức đặt quốc hiệu Đại Việt',
          description: 'Vua Lý Thánh Tông khẳng định nền độc lập và vị thế cường quốc phương Nam ngang hàng với phương Bắc.',
        },
        {
          id: 'node_1070_1076',
          year: '1070 – 1076',
          title: 'Thành lập Văn Miếu – Quốc Tử Giám',
          description: 'Đặt nền móng Nho học và trường đại học đầu tiên của Việt Nam, mở khoa thi Nho học Tam khoa đầu tiên năm 1075.',
        },
        {
          id: 'node_1077',
          year: '1077',
          title: 'Đại thắng Như Nguyệt & Tuyên ngôn "Nam quốc sơn hà"',
          description: 'Lý Thường Kiệt lãnh đạo quân dân Đại Việt đập tan âm mưu xâm lược của nhà Tống trên phòng tuyến sông Cầu.',
        },
        {
          id: 'node_1225',
          year: '1225',
          title: 'Hòa bình chuyển giao vương quyền cho nhà Trần',
          description: 'Lý Chiêu Hoàng thoái vị nhường ngôi cho Trần Cảnh, khép lại trọn vẹn 216 năm vương triều Lý trong hòa bình.',
        },
      ],
    });

    // Khối 6: MAP — Địa bàn Kinh đô Thăng Long
    blocks.push({
      id: 'blk_map_thang_long',
      type: DYNASTY_CONSTANTS.BLOCK_TYPES.MAP,
      locationName: 'Hoàng thành Thăng Long — Kinh đô muôn đời của vương triều Lý',
      description: 'Trung tâm quyền lực chính trị và văn hóa của nước Đại Việt suốt 216 năm trị vì của 9 đời vua Lý (nay thuộc quận Ba Đình, Hà Nội).',
    });

    // Khối 7: IMAGE — Bản đồ lãnh thổ cương vực từ Wikipedia
    const imageUrl =
      wikiData.originalimage?.source ||
      wikiData.thumbnail?.source ||
      'https://upload.wikimedia.org/wikipedia/commons/b/bb/Vietnam_%281009-1225%29.png';
    blocks.push({
      id: 'blk_img_map_ly',
      type: DYNASTY_CONSTANTS.BLOCK_TYPES.IMAGE,
      src: imageUrl,
      alt: 'Bản đồ cương vực Đại Việt thời Lý (1009 – 1225)',
      caption: 'Lãnh thổ nước Đại Việt dưới triều đại Nhà Lý với đường biên giới phía Bắc được bảo vệ vững chắc và sự phát triển rực rỡ của cảng thị Vân Đồn.',
    });

    // Khối 8: CALLOUT — Nhận định sử học của Lê Văn Hưu
    blocks.push({
      id: 'blk_callout_le_van_huu',
      type: DYNASTY_CONSTANTS.BLOCK_TYPES.CALLOUT,
      variant: 'SUCCESS',
      title: 'Nhận định của Sử thần Lê Văn Hưu (Đại Việt Sử Ký)',
      content:
        '"Lý Thái Tổ lên ngôi chưa được bao lâu mà kinh đô đã định xong, mưu kế sâu xa, đặt nền móng bền vững muôn đời, phong thái của bậc đế vương thật là cao rộng vậy!"',
    });

    return blocks;
  }
}

// ============================================================================
// FACADE: INGESTION PIPELINE CHO TRIỀU ĐẠI NHÀ LÝ
// ============================================================================

export class DynastyIngestionFacade {
  public static async execute(): Promise<void> {
    console.log('🏛️  Bắt đầu Pipeline cào tự động và tạo khối JSONB cho Triều đại Nhà Lý...');

    // 1. Kiểm tra Period cha
    const period = await prisma.period.findUnique({
      where: { slug: DYNASTY_CONSTANTS.PERIOD_SLUG },
    });
    if (!period) {
      throw new Error(`Không tìm thấy Period "${DYNASTY_CONSTANTS.PERIOD_SLUG}". Hãy chạy seed:periods trước!`);
    }

    // 2. Cào dữ liệu từ Wikipedia REST API
    const wikiData = await WikipediaApiClient.fetchSummary(DYNASTY_CONSTANTS.WIKI_API_URL);

    // 3. Biến đổi dữ liệu thành các khối JSONB đa phương thức
    const contentBlocks = DynastyContentTransformer.transformToBlocks(wikiData);
    console.log(`✨ Đã biên tập thành công ${contentBlocks.length} khối JSONB chất lượng cao.`);

    // 4. Upsert vào Database (HistoricalEntity type = DYNASTY)
    const entity = await prisma.historicalEntity.upsert({
      where: { slug: DYNASTY_CONSTANTS.SLUG },
      create: {
        slug: DYNASTY_CONSTANTS.SLUG,
        name: DYNASTY_CONSTANTS.NAME,
        type: HistoricalEntityType.DYNASTY,
        periodId: period.id,
        tagline: 'Triều đại định đô Thăng Long, đặt quốc hiệu Đại Việt và mở ra nền văn hiến',
        description: wikiData.extract,
        aliases: ['Nhà Lý', 'Triều Lý', 'Đại Việt thời Lý'],
        imageUrl: wikiData.thumbnail?.source || null,
        imageCaption: 'Bản đồ cương vực nước Đại Việt thời Lý (1009 – 1225)',
        startYear: DYNASTY_CONSTANTS.START_YEAR,
        endYear: DYNASTY_CONSTANTS.END_YEAR,
        datePrecision: DatePrecision.YEAR,
        dateText: '1009 – 1225 (216 năm)',
        contentBlocks,
        isFeatured: true,
        displayOrder: 1,
        status: ContentStatus.PUBLISHED,
      },
      update: {
        name: DYNASTY_CONSTANTS.NAME,
        type: HistoricalEntityType.DYNASTY,
        periodId: period.id,
        tagline: 'Triều đại định đô Thăng Long, đặt quốc hiệu Đại Việt và mở ra nền văn hiến',
        description: wikiData.extract,
        aliases: ['Nhà Lý', 'Triều Lý', 'Đại Việt thời Lý'],
        imageUrl: wikiData.thumbnail?.source || null,
        imageCaption: 'Bản đồ cương vực nước Đại Việt thời Lý (1009 – 1225)',
        startYear: DYNASTY_CONSTANTS.START_YEAR,
        endYear: DYNASTY_CONSTANTS.END_YEAR,
        datePrecision: DatePrecision.YEAR,
        dateText: '1009 – 1225 (216 năm)',
        contentBlocks,
        isFeatured: true,
        status: ContentStatus.PUBLISHED,
      },
    });

    console.log(`🎉 Nạp thành công Triều đại Nhà Lý vào Database (ID: ${entity.id})!`);
  }
}

// ============================================================================
// CHẠY TRỰC TIẾP TỪ CLI
// ============================================================================

if (require.main === module) {
  DynastyIngestionFacade.execute()
    .catch((err) => {
      console.error('❌ Lỗi khi thực thi pipeline Triều đại Nhà Lý:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
