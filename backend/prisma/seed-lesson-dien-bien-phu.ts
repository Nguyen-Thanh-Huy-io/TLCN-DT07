/**
 * Seeder làm đầy toàn diện Bài học:
 * "Trận Điện Biên Phủ trên không 12 ngày đêm cuối năm 1972"
 * và tích hợp Đề ôn tập nhanh (Quiz) tương tác.
 *
 * Chạy bằng: npx ts-node prisma/seed-lesson-dien-bien-phu.ts
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient, DifficultyLevel, LessonStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export const DIEN_BIEN_PHU_LESSON_SLUG = 'tran-dien-bien-phu-tren-khong-12-ngay-dem-cuoi-nam-1972';

export const DIEN_BIEN_PHU_BLOCKS_DATA = [
  {
    id: 'blk_text_intro',
    type: 'TEXT',
    content: `<h2>1. Âm mưu của đế quốc Mỹ & Tầm nhìn chiến lược của Bác Hồ</h2>
<p>Cuối năm 1972, sau những thất bại nặng nề trên cả hai miền Nam - Bắc và thế bế tắc trên bàn đàm phán Paris, chính quyền Tổng thống Mỹ Richard Nixon quyết định dùng con bài quân sự chiến lược cuối cùng: phát động chiến dịch tập kích đường không <strong>Linebacker II</strong>.</p>
<p>Mỹ đã huy động gần <strong>50% tổng số máy bay B-52</strong> hiện có của toàn nước Mỹ (193 chiếc) cùng gần 1.000 máy bay chiến thuật hiện đại bậc nhất, rải hàng vạn tấn bom xuống Hà Nội, Hải Phòng và các thành phố trọng yếu miền Bắc với cuồng vọng đưa miền Bắc <em>"trở về thời kỳ đồ đá"</em>, hủy diệt tiềm lực hậu phương lớn và ép ta phải ký kết hiệp định theo những điều khoản áp đặt của Mỹ.</p>
<blockquote>
  <p><em>"Sớm muộn rồi đế quốc Mỹ cũng sẽ đưa B-52 ra đánh Hà Nội, rồi có thua nó mới chịu thua... Phải dự kiến trước tình huống càng sớm càng tốt, để có thời gian mà suy nghĩ, chuẩn bị... Ở Việt Nam, Mỹ nhất định thua, nhưng nó chỉ chịu thua sau khi thua trên bầu trời Hà Nội."</em></p>
  <footer>— <strong>Chủ tịch Hồ Chí Minh</strong> (Căn dặn Quân chủng Phòng không - Không quân, tháng 12/1967)</footer>
</blockquote>`,
  },
  {
    id: 'blk_timeline_1',
    type: 'TIMELINE',
    title: '12 ngày đêm "Hà Nội - Điện Biên Phủ trên không"',
    subtitle: 'Những mốc son chói lọi bẻ gãy cuộc tập kích chiến lược Linebacker II (18/12 - 30/12/1972)',
    orientation: 'VERTICAL',
    nodes: [
      {
        id: 'node_1',
        year: '18/12/1972',
        title: 'Mở màn chiến dịch Linebacker II — B-52 đầu tiên đền tội',
        description: '19h44: Tiểu đoàn 59, Trung đoàn Tên lửa 261 phóng đạn tiêu diệt tại chỗ chiếc B-52 đầu tiên rơi trên cánh đồng Chuôm, xã Phù Lỗ, huyện Kim Anh (nay thuộc Sóc Sơn, Hà Nội).',
        detailContent: '<p>Chiến công bắn rơi B-52 ngay trong đêm mở màn đã củng cố niềm tin mãnh liệt cho toàn quân và toàn dân: <strong>"Bộ đội Việt Nam hoàn toàn có thể bắn rơi pháo đài bay B-52 tại chỗ!"</strong>, phá tan huyền thoại bất khả xâm phạm của không lực Mỹ.</p>',
        mediaList: [
          {
            type: 'IMAGE',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/S-75_Dvina_%28SA-2_Guideline%29_missile_on_launcher.jpg/640px-S-75_Dvina_%28SA-2_Guideline%29_missile_on_launcher.jpg',
            caption: 'Bệ phóng tên lửa SAM-2 vươn nòng trực chiến trong đêm.',
          },
        ],
      },
      {
        id: 'node_2',
        year: '20/12/1972',
        title: 'Đêm cao điểm — 7 pháo đài bay B-52 bị hạ gục',
        description: 'Chỉ trong một đêm, các đơn vị tên lửa bảo vệ Hà Nội đã bắn rơi 7 chiếc B-52 (trong đó có 5 chiếc rơi tại chỗ), giáng đòn choáng váng vào Bộ chỉ huy không quân Mỹ.',
      },
      {
        id: 'node_3',
        year: '26/12/1972',
        title: 'Trận then chốt — Bom rải thảm Khâm Thiên & 8 chiếc B-52 tan xác',
        description: 'Địch huy động 105 lượt B-52 rải bom hủy diệt phố Khâm Thiên và Bệnh viện Bạch Mai. Quân dân ta kiên cường chiến đấu, bắn rơi 8 máy bay B-52 và 10 máy bay chiến thuật khác.',
        detailContent: '<p>Đêm 26/12 được coi là trận quyết chiến ác liệt nhất trong suốt chiến dịch. Sự hy sinh của đồng bào Khâm Thiên biến thành ngọn lửa căm thù, tiếp thêm sức mạnh cho lưới lửa phòng không giáng đòn trừng phạt đích đáng xuống lũ giặc trời.</p>',
      },
      {
        id: 'node_4',
        year: '27/12/1972',
        title: 'Phi công Phạm Tuân lập kỳ tích bắn rơi B-52 trên không',
        description: 'Phi công Phạm Tuân điều khiển MiG-21 xuất kích từ sân bay Yên Bái, bí mật tiếp cận và bắn rơi 1 pháo đài bay B-52 trên vùng trời Mộc Châu, trở thành phi công đầu tiên hạ B-52.',
        detailContent: '<p>Đêm 27/12/1972, bằng kỹ thuật điêu luyện và lòng dũng cảm, Đại úy <strong>Phạm Tuân</strong> đã vượt qua hàng rào máy bay tiêm kích F-4 yểm trợ, bám sát đuôi B-52, phóng liền hai quả tên lửa tiêu diệt mục tiêu và hạ cánh an toàn.</p>',
      },
      {
        id: 'node_5',
        year: '28/12/1972',
        title: 'Phi công Vũ Xuân Thiều dũng cảm công kích áp sát tiêu diệt B-52',
        description: 'Phi công Vũ Xuân Thiều lái MiG-21 kiên quyết công kích cự ly gần tiêu diệt 1 B-52 trên vùng trời Sơn La và anh dũng hy sinh, được truy tặng danh hiệu Anh hùng LLVTND.',
      },
      {
        id: 'node_6',
        year: '30/12/1972',
        title: 'Nixon tuyên bố ngừng ném bom miền Bắc',
        description: '7 giờ sáng ngày 30/12, trước thất bại nặng nề và làn sóng phản đối dữ dội trên toàn thế giới, Tổng thống Richard Nixon buộc phải tuyên bố ngừng ném bom từ vĩ tuyến 20 trở ra.',
      },
      {
        id: 'node_7',
        year: '27/01/1973',
        title: 'Ký kết Hiệp định Paris — Mỹ rút toàn bộ quân về nước',
        description: 'Hiệp định Paris được ký kết tại thủ đô nước Pháp. Mỹ cam kết tôn trọng độc lập, chủ quyền của Việt Nam, mở toang cánh cửa dẫn tới ngày toàn thắng 30/4/1975.',
      },
    ],
  },
  {
    id: 'blk_row_1',
    type: 'SECTION_ROW',
    columnCount: 2,
    columns: [
      {
        id: 'col_1',
        widthPercent: 50,
        blocks: [
          {
            id: 'blk_char_1',
            type: 'CHARACTER',
            name: 'Trung tướng, Anh hùng Phạm Tuân',
            years: 'Sinh năm 1947',
            summary: 'Phi công MiG-21 xuất sắc của Không quân Nhân dân Việt Nam — người đầu tiên trên thế giới bắn rơi "pháo đài bay" B-52 bằng máy bay tiêm kích đêm 27/12/1972. Năm 1980, ông trở thành phi công vũ trụ đầu tiên của Việt Nam và châu Á bay vào không gian.',
            avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Ph%E1%BA%A1m_Tu%C3%A2n.jpg/440px-Ph%E1%BA%A1m_Tu%C3%A2n.jpg',
            detailContent: '<p>Trong đêm 27/12/1972, chiếc MiG-21 mang số hiệu 5121 của Phạm Tuân đã khéo léo luồn lách qua hệ thống radar cảnh giới dày đặc của đối phương, tắt đèn và giữ liên lạc vô tuyến im lặng tuyệt đối. Khi phát hiện dãy đèn đuôi của B-52, ông bình tĩnh tăng tốc độ lên Mach 1.4, tiếp cận cự ly hiệu quả và phóng liền 2 quả đạn tên lửa không đối không K-13, tiêu diệt tại chỗ pháo đài bay của địch.</p>',
          },
        ],
      },
      {
        id: 'col_2',
        widthPercent: 50,
        blocks: [
          {
            id: 'blk_char_2',
            type: 'CHARACTER',
            name: 'Liệt sĩ, Anh hùng Vũ Xuân Thiều',
            years: '1945 – 1972',
            summary: 'Phi công tiêm kích MiG-21 thuộc Trung đoàn Không quân 927. Đêm 28/12/1972, sau khi phóng hết tên lửa ở cự ly quá gần để bảo đảm tiêu diệt B-52, máy bay của ông đã lao thẳng vào đám cháy của máy bay giặc trên vùng trời Sơn La. Ông anh dũng hy sinh khi mới 27 tuổi.',
            avatarUrl: 'https://upload.wikimedia.org/wikipedia/vi/thumb/9/91/Vu_Xuan_Thieu.jpg/440px-Vu_Xuan_Thieu.jpg',
            detailContent: '<p>Trước ý đồ điên cuồng của kẻ thù, Vũ Xuân Thiều đã khẳng định ý chí quyết tử: <em>"Nếu bắn tên lửa mà B-52 không rơi tại chỗ, tôi sẵn sàng biến máy bay của mình thành quả tên lửa thứ ba lao thẳng vào buồng lái quân thù!"</em>. Tấm gương bất tử của ông là biểu tượng sáng ngời cho chủ nghĩa anh hùng cách mạng Việt Nam.</p>',
          },
        ],
      },
    ],
  },
  {
    id: 'blk_event_1',
    type: 'EVENT',
    title: 'Chiến dịch Linebacker II (18/12 – 29/12/1972)',
    timeLocation: '18/12 - 29/12/1972 • Bầu trời Hà Nội, Hải Phòng và miền Bắc Việt Nam',
    summary: 'Chiến dịch tập kích đường không chiến lược quy mô lớn nhất của Không lực Hoa Kỳ kể từ sau Thế chiến thứ hai. Chiến dịch kết thúc với thất bại thảm hại: 81 máy bay bị bắn rơi (trong đó có 34 siêu pháo đài bay B-52), đập tan mưu đồ đàm phán trên thế mạnh của Washington.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544813687-63931b2749ea?auto=format&fit=crop&w=1200&q=80',
    detailContent: '<p>Mỹ đã trút xuống miền Bắc hơn 36.000 tấn bom, riêng Thủ đô Hà Nội hứng chịu hơn 10.000 tấn. Mật độ bom đạn vượt quá sức tưởng tượng, nhưng quân và dân Thủ đô dưới sự lãnh đạo tài tình của Đảng và Quân chủng Phòng không - Không quân đã giăng nên lưới lửa phòng không 3 tầng dày đặc, đánh bại hoàn toàn cuộc tập kích chiến lược này.</p>',
  },
  {
    id: 'blk_image_1',
    type: 'IMAGE',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Huu_Tiep_Lake_B-52_wreckage_2019.jpg/640px-Huu_Tiep_Lake_B-52_wreckage_2019.jpg',
    alt: 'Xác máy bay B-52 tại hồ Hữu Tiệp, Hà Nội',
    caption: 'Xác "siêu pháo đài bay" B-52 bị bắn rơi đêm 27/12/1972 nằm lại giữa lòng hồ Hữu Tiệp (làng hoa Ngọc Hà, quận Ba Đình, Hà Nội) — di tích lịch sử quốc gia minh chứng cho bản lĩnh quật cường của Thủ đô.',
  },
  {
    id: 'blk_video_1',
    type: 'VIDEO',
    src: 'https://www.youtube.com/embed/8rL4l5IG4xM',
    sourceType: 'URL',
    caption: 'Phim tài liệu lịch sử: "12 ngày đêm Hà Nội - Điện Biên Phủ trên không" (Tư liệu lịch sử VTV & Điện ảnh Quân đội Nhân dân).',
  },
  {
    id: 'blk_text_crimes',
    type: 'TEXT',
    content: `<h2>2. Tội ác ném bom rải thảm và Bản lĩnh bất khuất của Thủ đô</h2>
<p>Trong đêm 26/12/1972, không lực Hoa Kỳ đã ném bom rải thảm xuống khu dân cư đông đúc trên phố <strong>Khâm Thiên</strong> (Hà Nội), san phẳng hàng ngàn ngôi nhà, cướp đi sinh mạng của 287 người dân vô tội và làm bị thương gần 300 người khác. Bệnh viện Bạch Mai — trung tâm y tế lớn nhất miền Bắc — cũng bị bom B-52 đánh phá nhiều lần, khiến nhiều y bác sĩ và bệnh nhân tử nạn.</p>
<p>Biến đau thương thành hành động cách mạng, quân và dân Thủ đô không hề nao núng. Hàng vạn người dân Hà Nội đã sơ tán triệt để theo chỉ đạo, các lực lượng cứu thương, dân phòng, công binh ngày đêm bám trụ mặt đường, rà phá bom mìn, cấp cứu đồng bào và tiếp đạn cho các trận địa tên lửa, pháo cao xạ lập công.</p>`,
  },
  {
    id: 'blk_map_1',
    type: 'MAP',
    locationName: 'Trận địa phòng không bảo vệ Hà Nội - Hải Phòng',
    description: 'Thế trận lưới lửa phòng không nhân dân 3 tầng bao gồm tên lửa đất đối không SAM-2 tầm cao, máy bay tiêm kích MiG-21 tầm trung, cùng hàng ngàn khẩu đội pháo cao xạ 100mm, 57mm, 37mm và súng máy 14,5mm của các đơn vị dân quân tự vệ nhà máy, xí nghiệp Thủ đô.',
  },
  {
    id: 'blk_table_1',
    type: 'COMPARISON_TABLE',
    title: 'Tương quan chiến lược giữa Không lực Hoa Kỳ và Quân dân miền Bắc',
    colAName: 'Không lực Hoa Kỳ (Chiến dịch Linebacker II)',
    colBName: 'Quân chủng Phòng không - Không quân Việt Nam',
    rows: [
      {
        criteria: 'Lực lượng & Vũ khí chủ lực',
        colA: '193 pháo đài bay B-52 (gần 50% tổng số B-52 của Mỹ), gần 1.000 máy bay chiến thuật (F-111, F-4 Phantom)',
        colB: 'Các trung đoàn Tên lửa phòng không SAM-2, máy bay tiêm kích MiG-21, pháo cao xạ 100mm, lưới lửa tự vệ Thủ đô',
      },
      {
        criteria: 'Tác chiến điện tử & Công nghệ',
        colA: 'Máy bay EB-66 gây nhiễu chủ động, B-52 phóng hàng triệu sợi nhiễu kim loại tạo màn mù điện tử che mắt radar',
        colB: 'Đúc kết cẩm nang bìa đỏ "Cách đánh B-52", cải tiến radar, kíp trắc thủ dày dặn kinh nghiệm vạch nhiễu tìm thù',
      },
      {
        criteria: 'Tổn thất trên chiến trường',
        colA: '81 máy bay bị tiêu diệt (34 B-52, 5 chiếc F-111), 43 phi công Mỹ bị bắt sống tại miền Bắc',
        colB: 'Chịu nhiều đau thương mất mát về sinh mạng và cơ sở hạ tầng, nhưng giữ vững mạng lưới tác chiến và hậu phương',
      },
      {
        criteria: 'Kết quả chiến lược',
        colA: 'Phá sản hoàn toàn mục tiêu ép Việt Nam nhượng bộ; buộc Nixon tuyên bố ngừng ném bom từ vĩ tuyến 20 trở ra',
        colB: 'Bảo vệ vững chắc Thủ đô, buộc Mỹ phải đặt bút ký Hiệp định Paris rút toàn bộ quân viễn chinh về nước',
      },
    ],
  },
  {
    id: 'blk_quiz_inline',
    type: 'QUIZ',
    question: 'Chiến thắng 12 ngày đêm Điện Biên Phủ trên không cuối năm 1972 có ý nghĩa quyết định trực tiếp nhất đến thắng lợi nào sau đây của dân tộc ta?',
    options: [
      {
        id: 'qopt_1',
        text: 'Buộc đế quốc Mỹ phải ký Hiệp định Paris (27/01/1973), chấm dứt chiến tranh và rút toàn bộ quân viễn chinh về nước',
        isCorrect: true,
      },
      {
        id: 'qopt_2',
        text: 'Làm phá sản hoàn toàn chiến lược Chiến tranh cục bộ của chính quyền Tổng thống Johnson',
        isCorrect: false,
      },
      {
        id: 'qopt_3',
        text: 'Giải phóng hoàn toàn miền Nam và thống nhất non sông ngay trong mùa xuân năm 1973',
        isCorrect: false,
      },
      {
        id: 'qopt_4',
        text: 'Buộc đế quốc Mỹ phải chấp nhận đàm phán tại Hội nghị quốc tế Giơ-ne-vơ',
        isCorrect: false,
      },
    ],
    explanation: 'Thất bại thảm hại trong chiến dịch Linebacker II đã tước bỏ hoàn toàn con bài quân sự cuối cùng của Mỹ, buộc chính quyền Nixon phải ký kết Hiệp định Paris theo đúng dự thảo đã thỏa thuận trước đó, tạo bước ngoặt chiến lược "Đánh cho Mỹ cút".',
  },
  {
    id: 'blk_text_meaning',
    type: 'TEXT',
    content: `<h2>3. Tầm vóc lịch sử & Bài học nghệ thuật quân sự</h2>
<p>Chiến thắng <strong>"Hà Nội - Điện Biên Phủ trên không"</strong> là một trong những trang sử vàng chói lọi nhất của lịch sử chống ngoại xâm của dân tộc Việt Nam trong thế kỷ XX:</p>
<ul>
  <li><strong>Về mặt quân sự:</strong> Đây là thất bại nặng nề nhất trong lịch sử của Không lực Hoa Kỳ. Tỷ lệ tổn thất máy bay B-52 lên tới 17,6% (vượt xa mức tổn thất 10% mà Lầu Năm Góc có thể chịu đựng), làm sụp đổ hoàn toàn thần tượng về sức mạnh không lực bất khả chiến bại của Mỹ.</li>
  <li><strong>Về mặt chính trị - ngoại giao:</strong> Chiến thắng đã bảo vệ vững chắc hậu phương lớn miền Bắc XHCN, trực tiếp buộc chính quyền Nixon phải ký kết <em>Hiệp định Paris ngày 27/01/1973</em>, hoàn thành mục tiêu chiến lược <strong>"Đánh cho Mỹ cút"</strong> mà Chủ tịch Hồ Chí Minh đã đề ra.</li>
  <li><strong>Bài học nghệ thuật quân sự:</strong> Khẳng định bản lĩnh, trí tuệ Việt Nam, đỉnh cao của nghệ thuật chiến tranh nhân dân, kết hợp chặt chẽ giữa ý chí kiên cường và tinh thần sáng tạo làm chủ khí tài quân sự hiện đại.</li>
</ul>`,
  },
  {
    id: 'blk_reslink_1',
    type: 'RESOURCE_LINK',
    title: 'Chiến dịch Linebacker II — Bách khoa toàn thư Wikipedia',
    url: 'https://vi.wikipedia.org/wiki/Chi%E1%BA%BFn_d%E1%BB%8Bch_Linebacker_II',
    note: 'Tổng hợp chi tiết diễn biến tác chiến, số liệu thương vong đối chiếu giữa hai bên và các nguồn tư liệu quốc tế.',
  },
  {
    id: 'blk_reslink_2',
    type: 'RESOURCE_LINK',
    title: 'Bảo tàng Chiến thắng B-52 — Chứng tích lịch sử Thủ đô',
    url: 'https://vi.wikipedia.org/wiki/B%E1%BA%A3o_t%C3%A0ng_Chi%E1%BA%BFn_th%E1%BA%AFng_B-52',
    note: 'Địa chỉ: 157 phố Đội Cấn, Ba Đình, Hà Nội — Nơi lưu giữ xác máy bay B-52, tên lửa SAM-2 và các hiện vật lịch sử 12 ngày đêm.',
  },
];

export const DIEN_BIEN_PHU_QUIZ_DATA = {
  title: 'Đề ôn tập: 12 ngày đêm Hà Nội - Điện Biên Phủ trên không (1972)',
  passingScorePercent: 80,
  questions: [
    {
      id: 'q_mc_1',
      type: 'MULTIPLE_CHOICE',
      prompt: 'Mục tiêu chiến lược cao nhất của đế quốc Mỹ khi mở cuộc tập kích đường không chiến lược Linebacker II cuối năm 1972 là gì?',
      options: [
        {
          id: 'opt_1',
          text: 'Buộc phái đoàn Việt Nam Dân chủ Cộng hòa phải nhượng bộ và ký Hiệp định Paris theo các điều khoản do Mỹ áp đặt',
          isCorrect: true,
        },
        {
          id: 'opt_2',
          text: 'Cắt đứt hoàn toàn tuyến vận tải chiến lược đường mòn Hồ Chí Minh trên bộ',
          isCorrect: false,
        },
        {
          id: 'opt_3',
          text: 'Ngăn chặn quân ta mở cuộc tổng tiến công giải phóng miền Nam trong mùa khô 1973',
          isCorrect: false,
        },
        {
          id: 'opt_4',
          text: 'Thử nghiệm tính năng các loại máy bay tiêm kích tàng hình thế hệ mới trên chiến trường',
          isCorrect: false,
        },
      ],
      explanation: 'Chính quyền Nixon muốn dùng đòn sấm sét hủy diệt bằng B-52 để thương lượng trên thế mạnh, ép ta chấp nhận các sửa đổi bất lợi tại bàn đàm phán Paris.',
    },
    {
      id: 'q_tf_1',
      type: 'TRUE_FALSE',
      prompt: 'Trước khi chiến dịch Linebacker II diễn ra, "siêu pháo đài bay" B-52 của không quân Mỹ được coi là bất khả xâm phạm và chưa từng bị lực lượng phòng không nước nào bắn rơi tại chỗ.',
      correctAnswer: true,
      explanation: 'Đế quốc Mỹ luôn tự hào B-52 bay ở độ cao trên 10km và trang bị hệ thống gây nhiễu điện tử tối tân tạo thành "màn chắn vô hình", coi nó là vũ khí bất khả chiến bại trước khi bị lưới lửa phòng không Hà Nội đánh sập.',
    },
    {
      id: 'q_order_1',
      type: 'ORDERING',
      prompt: 'Hãy sắp xếp các mốc lịch sử sau theo đúng thứ tự thời gian diễn ra trong 12 ngày đêm Điện Biên Phủ trên không (1972):',
      items: [
        { id: 'm1', label: '18/12/1972: Quả đạn SAM-2 đầu tiên bắn rơi pháo đài bay B-52 tại Phù Lỗ' },
        { id: 'm2', label: '26/12/1972: Mỹ rải thảm bom tàn phá phố Khâm Thiên; quân dân ta bắn rơi 8 máy bay B-52' },
        { id: 'm3', label: '27/12/1972: Phi công Phạm Tuân lái MiG-21 bắn rơi B-52 trên vùng trời Mộc Châu' },
        { id: 'm4', label: '28/12/1972: Phi công Vũ Xuân Thiều dũng cảm công kích áp sát tiêu diệt B-52' },
        { id: 'm5', label: '30/12/1972: Tổng thống Nixon buộc phải tuyên bố ngừng ném bom miền Bắc' },
      ],
      correctOrder: ['m1', 'm2', 'm3', 'm4', 'm5'],
      explanation: 'Chiến dịch mở màn đêm 18/12, đỉnh điểm rải thảm Khâm Thiên đêm 26/12, hai chiến công MiG-21 vang dội đêm 27 và 28/12, và kết thúc khi Nixon tuyên bố ngừng ném bom sáng 30/12.',
    },
    {
      id: 'q_match_1',
      type: 'MATCHING',
      prompt: 'Hãy ghép nối các anh hùng, lực lượng tham chiến với chiến công, đóng góp tiêu biểu:',
      leftItems: [
        { id: 'l1', label: 'Phi công Phạm Tuân' },
        { id: 'l2', label: 'Liệt sĩ phi công Vũ Xuân Thiều' },
        { id: 'l3', label: 'Bộ đội Tên lửa SAM-2' },
        { id: 'l4', label: 'Lực lượng Tự vệ Thủ đô' },
      ],
      rightItems: [
        { id: 'r1', label: 'Phi công Việt Nam đầu tiên lái MiG-21 bắn rơi pháo đài bay B-52 đêm 27/12' },
        { id: 'r2', label: 'Quả cảm công kích áp sát cự ly gần tiêu diệt B-52 đêm 28/12' },
        { id: 'r3', label: 'Hỏa lực phòng không chủ lực bắn rơi 29 trong tổng số 34 máy bay B-52' },
        { id: 'r4', label: 'Bố trí các trận địa súng máy cao xạ 14,5mm bắn rơi máy bay F-111 bay thấp' },
      ],
      correctPairs: [
        { leftId: 'l1', rightId: 'r1' },
        { leftId: 'l2', rightId: 'r2' },
        { leftId: 'l3', rightId: 'r3' },
        { leftId: 'l4', rightId: 'r4' },
      ],
      explanation: 'Mỗi lực lượng trong thế trận chiến tranh nhân dân đất đối không đều lập nên những chiến công xuất sắc, đập tan thần tượng B-52.',
    },
    {
      id: 'q_fib_1',
      type: 'FILL_IN_BLANK',
      prompt: 'Thất bại nặng nề trong 12 ngày đêm Điện Biên Phủ trên không đã buộc chính phủ Mỹ phải ký kết Hiệp định ________ ngày 27/01/1973 để chấm dứt chiến tranh, rút hết quân viễn chinh về nước.',
      acceptedAnswers: ['Paris', 'Hiệp định Paris', 'hiệp định Paris', 'hiệp định paris', 'PARIS'],
      caseSensitive: false,
      explanation: 'Hiệp định Paris được ký kết ngày 27/01/1973, thực hiện trọn vẹn mục tiêu chiến lược "Đánh cho Mỹ cút", tạo tiền đề vững chắc cho đại thắng mùa Xuân 1975.',
    },
  ],
};

export async function enrichDienBienPhuLesson() {
  console.log(`=== BẮT ĐẦU LÀM ĐẦY BÀI HỌC "${DIEN_BIEN_PHU_LESSON_SLUG}" ===`);

  // 1. Tìm bài học theo slug
  let lesson = await prisma.lesson.findUnique({
    where: { slug: DIEN_BIEN_PHU_LESSON_SLUG },
  });

  if (!lesson) {
    console.log(`Không tìm thấy lesson với slug "${DIEN_BIEN_PHU_LESSON_SLUG}". Đang tìm theo từ khóa 'dien-bien-phu'...`);
    lesson = await prisma.lesson.findFirst({
      where: { slug: { contains: 'dien-bien-phu' } },
    });
  }

  if (!lesson) {
    throw new Error(`Không tìm thấy bài học Điện Biên Phủ trên không trong DB!`);
  }

  console.log(`✓ Tìm thấy bài học: ID=${lesson.id}, Title="${lesson.title}"`);

  // 2. Cập nhật Lesson với nội dung 11 khối đầy đủ
  const updatedLesson = await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      content: DIEN_BIEN_PHU_BLOCKS_DATA,
      description: 'Chiến thắng 12 ngày đêm vĩ đại (18/12 - 30/12/1972) đập tan cuộc tập kích chiến lược B-52 của đế quốc Mỹ, bảo vệ vững chắc Thủ đô và buộc Mỹ phải ký Hiệp định Paris 1973.',
      difficulty: DifficultyLevel.HARD,
      status: LessonStatus.PUBLISHED,
      thumbnailUrl: 'https://images.unsplash.com/photo-1544813687-63931b2749ea?auto=format&fit=crop&w=1200&q=80',
      sourceReferenceNote: 'Lịch sử Quân chủng Phòng không - Không quân & Lịch sử Quân sự Việt Nam (NXB Quân đội Nhân dân)',
    },
  });

  console.log(`✓ Đã cập nhật ${DIEN_BIEN_PHU_BLOCKS_DATA.length} khối nội dung Block Builder vào Lesson ID=${updatedLesson.id}`);

  // 3. Upsert Quiz cho bài học này
  const quiz = await prisma.quiz.upsert({
    where: { lessonId: lesson.id },
    update: {
      title: DIEN_BIEN_PHU_QUIZ_DATA.title,
      passingScorePercent: DIEN_BIEN_PHU_QUIZ_DATA.passingScorePercent,
      questions: DIEN_BIEN_PHU_QUIZ_DATA.questions,
    },
    create: {
      lessonId: lesson.id,
      title: DIEN_BIEN_PHU_QUIZ_DATA.title,
      passingScorePercent: DIEN_BIEN_PHU_QUIZ_DATA.passingScorePercent,
      questions: DIEN_BIEN_PHU_QUIZ_DATA.questions,
    },
  });

  console.log(`✓ Đã tạo/cập nhật Quiz ID=${quiz.id} với ${DIEN_BIEN_PHU_QUIZ_DATA.questions.length} câu hỏi đa dạng (Multiple Choice, True/False, Ordering, Matching, Fill In Blank)`);
  console.log(`=== HOÀN TẤT LÀM ĐẦY BÀI HỌC VÀ QUIZ THÀNH CÔNG 100%! ===`);

  return { lesson: updatedLesson, quiz };
}

if (require.main === module) {
  enrichDienBienPhuLesson()
    .catch((err) => {
      console.error('Lỗi khi nạp dữ liệu bài học:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
