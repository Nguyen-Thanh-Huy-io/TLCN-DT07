import { ContentStatus, EventCategory } from '@prisma/client';
import { IEventSeedRecord } from '../interfaces/ingestion.interface';

const wiki = (title: string) => encodeURI(`https://vi.wikipedia.org/wiki/${title}`);

/**
 * Batch 03 — Sự kiện cho 4 giai đoạn đã có Entity nhưng chưa có Event nào
 * (Bắc thuộc lần I, Trưng Nữ Vương, Bắc thuộc lần II, Nhà Tiền Lý), cộng thêm
 * 1 truyền thuyết thời Hùng Vương và 2 mốc thời chống Mỹ để dùng tới các
 * địa danh đã seed nhưng chưa gắn sự kiện (Hiền Lương, Thành cổ Quảng Trị).
 * Niên đại theo Đại Việt sử ký toàn thư; chỗ sử học hiện đại còn tranh luận
 * được ghi rõ trong eventDateNote.
 */
export const BATCH_03_EVENTS: IEventSeedRecord[] = [
  // ---------- Hồng Bàng ----------
  {
    slug: 'truyen-thuyet-son-tinh-thuy-tinh',
    periodSlug: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
    locationSlug: null,
    parentSlug: null,
    title: 'Truyền thuyết Sơn Tinh – Thủy Tinh',
    startYear: -258,
    eventDateNote: 'Truyền thuyết gắn với đời Hùng Vương thứ 18, không có niên đại lịch sử xác thực.',
    summary: 'Sơn Tinh và Thủy Tinh tranh nhau cầu hôn Mị Nương, con gái vua Hùng thứ 18; Sơn Tinh thắng và đẩy lùi nước lũ.',
    description:
      'Theo truyền thuyết, Sơn Tinh (thần núi Tản Viên) dâng lễ vật trước nên cưới được Mị Nương. Thủy Tinh tức giận dâng nước đánh Sơn Tinh, nhưng nước dâng cao bao nhiêu thì núi cao bấy nhiêu. Câu chuyện phản ánh cuộc đấu tranh trị thủy lâu dài của cư dân đồng bằng sông Hồng thời dựng nước.',
    thumbnailUrl: null,
    displayOrder: 7,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause: 'Lũ lụt hằng năm ở đồng bằng sông Hồng — bối cảnh hiện thực của truyền thuyết.',
      outcome: 'Sơn Tinh trở thành một trong "Tứ bất tử" của tín ngưỡng dân gian Việt Nam.',
      sources: [wiki('Sơn_Tinh_–_Thủy_Tinh')],
    },
    status: ContentStatus.PUBLISHED,
  },

  // ---------- Bắc thuộc lần I ----------
  {
    slug: 'trieu-da-lap-nuoc-nam-viet',
    periodSlug: 'thoi-ky-bac-thuoc-lan-1-208-tcn-39',
    locationSlug: 'thanh-phien-ngung',
    parentSlug: null,
    title: 'Triệu Đà lập nước Nam Việt, đóng đô ở Phiên Ngung',
    startYear: -207,
    eventDateNote: 'Đại Việt sử ký toàn thư chép năm 207 TCN; nhiều sử gia hiện đại xếp vào khoảng 204 TCN.',
    summary: 'Nhân lúc nhà Tần sụp đổ, Triệu Đà chiếm các quận phía nam, xưng vương và lập nước Nam Việt.',
    description:
      'Triệu Đà vốn là tướng nhà Tần, làm huyện lệnh Long Xuyên rồi úy quận Nam Hải. Khi nhà Tần suy loạn, ông đóng các cửa ải, sáp nhập Quế Lâm, Tượng Quận cùng đất Âu Lạc, xưng Nam Việt Vũ Vương và đóng đô tại Phiên Ngung (nay thuộc Quảng Châu). Nhà Triệu tồn tại gần một thế kỷ trước khi bị nhà Hán thôn tính.',
    thumbnailUrl: null,
    displayOrder: 1,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause: 'Nhà Tần sụp đổ, các quận phương nam mất sự kiểm soát của triều đình trung ương.',
      outcome: 'Hình thành nước Nam Việt, đất Âu Lạc trở thành hai quận Giao Chỉ và Cửu Chân thuộc Nam Việt.',
      sources: [wiki('Triệu_Đà'), wiki('Nam_Việt')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'lu-gia-chong-viec-noi-thuoc-nha-han',
    periodSlug: 'thoi-ky-bac-thuoc-lan-1-208-tcn-39',
    locationSlug: 'thanh-phien-ngung',
    parentSlug: null,
    title: 'Thừa tướng Lữ Gia chống việc Nam Việt nội thuộc nhà Hán',
    startYear: -112,
    eventDateNote: 'Năm 112 TCN.',
    summary: 'Lữ Gia phản đối việc Cù thái hậu xin cho Nam Việt nội thuộc nhà Hán, giết vua Triệu Ai Vương và thái hậu, lập Triệu Thuật Dương Vương.',
    description:
      'Lữ Gia làm thừa tướng trải ba đời vua nhà Triệu. Khi Cù thái hậu (người Hán) cùng vua Triệu Ai Vương muốn dâng biểu xin nội thuộc nhà Hán, Lữ Gia cùng các quan chống lại, giết vua, thái hậu và sứ giả nhà Hán, lập Kiến Đức (Triệu Thuật Dương Vương) lên ngôi. Hán Vũ Đế lấy cớ đó mang quân sang đánh.',
    thumbnailUrl: null,
    displayOrder: 2,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause: 'Mâu thuẫn trong triều Nam Việt giữa phe muốn nội thuộc nhà Hán và phe giữ quyền tự chủ.',
      outcome: 'Nhà Hán lấy cớ sứ giả bị giết để phát binh đánh Nam Việt năm 111 TCN.',
      sources: [wiki('Lữ_Gia')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'nha-han-thon-tinh-nam-viet',
    periodSlug: 'thoi-ky-bac-thuoc-lan-1-208-tcn-39',
    locationSlug: 'thanh-phien-ngung',
    parentSlug: null,
    title: 'Nhà Hán thôn tính Nam Việt, đặt các quận Giao Chỉ, Cửu Chân, Nhật Nam',
    startYear: -111,
    eventDateNote: 'Năm 111 TCN.',
    summary: 'Quân Hán do Lộ Bác Đức chỉ huy chiếm Phiên Ngung; Nam Việt bị chia thành 9 quận, trong đó có Giao Chỉ, Cửu Chân, Nhật Nam.',
    description:
      'Hán Vũ Đế sai Phục Ba tướng quân Lộ Bác Đức và Lâu thuyền tướng quân Dương Bộc đem quân đánh Nam Việt. Thành Phiên Ngung bị phá, Lữ Gia và vua Triệu bị bắt. Nhà Hán chia đất Nam Việt thành 9 quận; vùng Bắc Bộ và Bắc Trung Bộ Việt Nam ngày nay thuộc ba quận Giao Chỉ, Cửu Chân và Nhật Nam, mở đầu thời kỳ cai trị trực tiếp của phương Bắc.',
    thumbnailUrl: null,
    displayOrder: 3,
    category: EventCategory.WAR,
    metadata: {
      cause: 'Chính sách bành trướng xuống phương nam của Hán Vũ Đế, lấy cớ biến loạn trong triều Nam Việt.',
      outcome: 'Nam Việt diệt vong; đất Việt cổ bị đặt thành các quận của nhà Hán.',
      sources: [wiki('Chiến_tranh_Hán_–_Nam_Việt')],
    },
    status: ContentStatus.PUBLISHED,
  },

  // ---------- Trưng Nữ Vương ----------
  {
    slug: 'khoi-nghia-hai-ba-trung',
    periodSlug: 'giai-doan-trung-nu-vuong-40-43',
    locationSlug: 'hat-mon',
    parentSlug: null,
    title: 'Khởi nghĩa Hai Bà Trưng',
    startYear: 40,
    startMonth: 3,
    eventDateNote: 'Mùa xuân năm 40 (tháng 2 âm lịch theo truyền thống).',
    summary: 'Trưng Trắc và Trưng Nhị phát động khởi nghĩa ở Hát Môn, đánh đuổi thái thú Tô Định, giải phóng 65 thành trì.',
    description:
      'Bất bình trước chính sách cai trị hà khắc của thái thú Giao Chỉ Tô Định, Trưng Trắc cùng em là Trưng Nhị — con gái Lạc tướng Mê Linh — dấy binh ở cửa sông Hát. Các Lạc tướng ở Giao Chỉ, Cửu Chân, Nhật Nam, Hợp Phố cùng hưởng ứng. Nghĩa quân nhanh chóng hạ 65 thành, Tô Định phải bỏ chạy về nước.',
    thumbnailUrl: null,
    displayOrder: 1,
    category: EventCategory.REVOLUTION,
    metadata: {
      cause: 'Chính sách bóc lột và đồng hóa hà khắc của chính quyền Đông Hán dưới thời thái thú Tô Định.',
      outcome: 'Chính quyền đô hộ bị lật đổ, mở ra thời kỳ tự chủ ngắn ngủi 40 – 43.',
      sources: [wiki('Khởi_nghĩa_Hai_Bà_Trưng')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'trung-trac-xung-vuong-dong-do-me-linh',
    periodSlug: 'giai-doan-trung-nu-vuong-40-43',
    locationSlug: 'den-hai-ba-trung-me-linh',
    parentSlug: 'khoi-nghia-hai-ba-trung',
    title: 'Trưng Trắc xưng vương, đóng đô ở Mê Linh',
    startYear: 40,
    eventDateNote: 'Năm 40, ngay sau thắng lợi của cuộc khởi nghĩa.',
    summary: 'Trưng Trắc được tôn làm vua (Trưng Nữ Vương), đóng đô ở Mê Linh và miễn thuế hai năm cho dân.',
    description:
      'Sau khi đánh đuổi quân Đông Hán, Trưng Trắc lên ngôi vua, đóng đô ở Mê Linh — quê hương của Hai Bà. Theo sử cũ, Trưng Vương xá thuế hai năm cho dân hai quận Giao Chỉ và Cửu Chân. Đây là chính quyền tự chủ đầu tiên của người Việt sau hơn 150 năm Bắc thuộc.',
    thumbnailUrl: null,
    displayOrder: 2,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause: 'Thắng lợi của khởi nghĩa Hai Bà Trưng năm 40.',
      outcome: 'Khẳng định quyền tự chủ của người Việt, trở thành biểu tượng cho tinh thần độc lập dân tộc.',
      sources: [wiki('Trưng_Trắc')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'khang-chien-chong-quan-ma-vien',
    periodSlug: 'giai-doan-trung-nu-vuong-40-43',
    locationSlug: null,
    parentSlug: null,
    title: 'Kháng chiến chống quân Mã Viện',
    startYear: 42,
    endYear: 43,
    eventDateNote: 'Từ năm 42 đến năm 43.',
    summary: 'Nhà Đông Hán sai Mã Viện đem quân sang đàn áp; quân Hai Bà Trưng thất trận ở Lãng Bạc, rút về Cấm Khê và thất bại năm 43.',
    description:
      'Năm 42, Hán Quang Vũ Đế sai Phục Ba tướng quân Mã Viện mang quân sang Giao Chỉ. Quân Trưng Vương chặn đánh ở Lãng Bạc nhưng bị thua, phải lui về Cấm Khê và cầm cự đến năm 43. Theo truyền thống, Hai Bà Trưng không chịu khuất phục và tuẫn tiết trên sông Hát. Sau thất bại, đất Việt rơi vào thời kỳ Bắc thuộc lần thứ hai.',
    thumbnailUrl: null,
    displayOrder: 3,
    category: EventCategory.WAR,
    metadata: {
      cause: 'Nhà Đông Hán muốn tái lập quyền cai trị ở Giao Chỉ.',
      outcome: 'Chính quyền Trưng Nữ Vương sụp đổ; Mã Viện tổ chức lại bộ máy cai trị, siết chặt ách đô hộ.',
      sources: [wiki('Mã_Viện'), wiki('Khởi_nghĩa_Hai_Bà_Trưng')],
    },
    status: ContentStatus.PUBLISHED,
  },

  // ---------- Bắc thuộc lần II ----------
  {
    slug: 'si-nhiep-cai-tri-giao-chi-luy-lau-thanh-trung-tam',
    periodSlug: 'thoi-ky-bac-thuoc-lan-2-43-543',
    locationSlug: 'luy-lau',
    parentSlug: null,
    title: 'Sĩ Nhiếp cai trị Giao Chỉ, Luy Lâu thành trung tâm văn hóa',
    startYear: 187,
    endYear: 226,
    eventDateNote: 'Khoảng năm 187 – 226.',
    summary: 'Thái thú Sĩ Nhiếp giữ Giao Chỉ ổn định suốt 40 năm giữa lúc Trung Hoa loạn lạc; Luy Lâu trở thành nơi hội tụ Nho học và Phật giáo.',
    description:
      'Sĩ Nhiếp làm thái thú Giao Chỉ khi nhà Đông Hán suy yếu. Ông giữ cho vùng đất tương đối yên ổn, thu nhận nhiều nho sĩ phương Bắc lánh nạn, nên được hậu thế gọi là "Nam Giao học tổ". Trị sở Luy Lâu (Thuận Thành, Bắc Ninh ngày nay) trở thành trung tâm chính trị, kinh tế và là một trong những trung tâm Phật giáo sớm nhất ở khu vực.',
    thumbnailUrl: null,
    displayOrder: 1,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause: 'Nhà Đông Hán suy yếu, các thế lực địa phương ở phương nam có điều kiện tự quản.',
      outcome: 'Nho học và Phật giáo được truyền bá rộng; Luy Lâu phát triển thành trung tâm lớn của Giao Chỉ.',
      sources: [wiki('Sĩ_Nhiếp'), wiki('Luy_Lâu')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'khuong-tang-hoi-truyen-phat-giao-sang-dong-ngo',
    periodSlug: 'thoi-ky-bac-thuoc-lan-2-43-543',
    locationSlug: null,
    parentSlug: null,
    title: 'Khương Tăng Hội từ Giao Châu sang Đông Ngô truyền Phật pháp',
    startYear: 247,
    eventDateNote: 'Năm 247 theo Cao tăng truyện.',
    summary: 'Thiền sư Khương Tăng Hội, sinh trưởng ở Giao Chỉ, đến Kiến Nghiệp (kinh đô Đông Ngô) dựng chùa Kiến Sơ và dịch kinh.',
    description:
      'Khương Tăng Hội có tổ tiên người Khương Cư (Sogdiana), theo cha buôn bán đến sinh sống ở Giao Chỉ, xuất gia từ nhỏ. Năm 247 ông đến Kiến Nghiệp, được Ngô Tôn Quyền cho dựng chùa Kiến Sơ — ngôi chùa đầu tiên ở Giang Nam. Ông dịch và chú giải nhiều kinh, trong đó có Lục độ tập kinh, cho thấy Phật giáo Giao Châu đã phát triển và lan tỏa ngược lên phương Bắc.',
    thumbnailUrl: null,
    displayOrder: 2,
    category: EventCategory.CULTURE_SCIENCE,
    metadata: {
      cause: 'Giao Châu là điểm trung chuyển của tuyến giao thương và truyền giáo đường biển giữa Ấn Độ và Trung Hoa.',
      outcome: 'Phật giáo được truyền bá ở vùng Giang Nam; khẳng định vị thế của trung tâm Phật giáo Giao Châu.',
      sources: [wiki('Khương_Tăng_Hội')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'khoi-nghia-ba-trieu',
    periodSlug: 'thoi-ky-bac-thuoc-lan-2-43-543',
    locationSlug: 'nui-nua',
    parentSlug: null,
    title: 'Khởi nghĩa Bà Triệu',
    startYear: 248,
    eventDateNote: 'Năm 248.',
    summary: 'Triệu Thị Trinh cùng anh là Triệu Quốc Đạt khởi nghĩa ở Cửu Chân chống ách đô hộ Đông Ngô; cuộc khởi nghĩa bị Lục Dận đàn áp.',
    description:
      'Từ căn cứ núi Nưa (Thanh Hóa), Bà Triệu và Triệu Quốc Đạt dấy binh chống chính quyền Đông Ngô. Khi Triệu Quốc Đạt mất, nghĩa quân tôn Bà Triệu làm chủ tướng. Nhà Ngô cử Lục Dận làm thứ sử Giao Châu, vừa dùng quân vừa mua chuộc thủ lĩnh địa phương. Sau nhiều tháng chiến đấu, cuộc khởi nghĩa bị dập tắt, Bà Triệu hy sinh trên núi Tùng (Hậu Lộc, Thanh Hóa).',
    thumbnailUrl: null,
    displayOrder: 3,
    category: EventCategory.REVOLUTION,
    metadata: {
      cause: 'Chính sách bóc lột, cống nạp nặng nề của nhà Đông Ngô tại Giao Châu.',
      outcome: 'Khởi nghĩa thất bại nhưng để lại hình tượng nữ anh hùng tiêu biểu, cổ vũ các cuộc đấu tranh về sau.',
      sources: [wiki('Bà_Triệu')],
    },
    status: ContentStatus.PUBLISHED,
  },

  // ---------- Nhà Tiền Lý ----------
  {
    slug: 'khoi-nghia-ly-bi',
    periodSlug: 'thoi-ky-nha-tien-ly-544-602',
    locationSlug: 'thanh-long-bien',
    parentSlug: null,
    title: 'Khởi nghĩa Lý Bí giải phóng Giao Châu',
    startYear: 542,
    startMonth: 1,
    endYear: 543,
    endMonth: 5,
    eventDateNote: 'Mùa xuân năm 542 – tháng 5 năm 543.',
    summary:
      'Cuộc khởi nghĩa vũ trang quật khởi bùng nổ vào mùa xuân năm 542 dưới sự lãnh đạo của hào trưởng Lý Bí cùng hào kiệt các châu, nhanh chóng đánh chiếm châu thành Long Biên, đuổi Thứ sử nhà Lương Tiêu Tư tháo chạy về nước. Sau đó, nghĩa quân liên tiếp đánh tan hai cuộc phản công quy mô lớn của triều đình nhà Lương tại Hợp Phố, bán đảo Lôi Châu và đập tan cuộc xâm lấn của quân Lâm Ấp ở phía Nam, hoàn thành thắng lợi sự nghiệp giải phóng toàn bộ đất nước và mở đường thành lập nước Vạn Xuân độc lập năm 544.',
    description:
      'Mùa xuân năm 542, từ vùng đất Thái Bình, hào trưởng Lý Bí chính thức dựng cờ dấy binh khởi nghĩa. Đông đảo nhân dân và hào kiệt khắp các châu huyện thuộc Giao Châu — tiêu biểu như Tinh Thiều, lão tướng Phạm Tu ở Thanh Liệt, cha con Triệu Túc và Triệu Quang Phục ở Chu Diên — đã đồng lòng kéo về quy tụ dưới cờ nghĩa. Nghĩa quân thần tốc tiến đánh cơ quan đầu não của chính quyền đô hộ tại thành Long Biên. Thứ sử Tiêu Tư hoảng sợ cùng cực, bí mật đem vàng bạc đút lót cho nghĩa quân rồi bỏ trốn về Quảng Châu. Chỉ trong vòng chưa đầy ba tháng, nghĩa quân đã giải phóng toàn bộ châu thành và làm chủ hầu hết các quận huyện trọng yếu.\n\nTháng 4 năm 542, sau khi nghe tin thành Long Biên thất thủ, vua Lương Vũ Đế tức tốc hạ lệnh cho Thứ sử Việt Châu là Trần Hầu và Thứ sử Quảng Châu là Tôn Quýnh đem đại quân tiến sang hòng đè bẹp nghĩa quân. Với tầm nhìn quân sự chủ động, Lý Bí không chờ giặc đến chân thành mà chủ động chia quân tiến lên vùng biên ải phía Bắc, đón đánh và tiêu diệt tan tác đạo quân phản công của giặc tại Hợp Phố (vùng vịnh Bắc Bộ), thu hồi toàn bộ vùng duyên hải biên giới.\n\nĐầu năm 543, triều Lương cay cú dốc toàn lực tổ chức cuộc viễn chinh phản kích lần thứ hai với quy mô lớn hơn, cử các danh tướng lão luyện Tôn Quýnh, Lư Tử Hùng đem đại quân tràn xuống phương Nam. Nắm bắt được mâu thuẫn nội bộ và sự khiếp nhược của quân Lương, Lý Bí phối hợp cùng đại tướng Phạm Tu tổ chức thế trận mai phục hiểm hóc tại mũi bán đảo Lôi Châu (Quảng Đông ngày nay). Trận tập kích sấm sét của nghĩa quân đã đánh tan nát đạo quân viễn chinh nhà Lương, tàn quân chết đuối và tan rã đến bảy tám phần mười, hai tướng chỉ huy giặc tháo chạy về nước rồi bị vua Lương xử tử.\n\nTháng 5 năm 543, trong lúc quân dân Giao Châu đang củng cố phòng thủ phương Bắc, vua nước Lâm Ấp ở phương Nam nhân cơ hội đem đại quân xâm lấn quận Cửu Đức (vùng Hà Tĩnh ngày nay). Lý Bí lập tức ủy thác binh quyền cho lão tướng Phạm Tu dẫn quân nam hạ. Dưới sự chỉ huy mưu lược của Phạm Tu, nghĩa quân đã giáng một đòn chí mạng, đánh tan tác quân xâm lược Lâm Ấp tại Cửu Đức, chém tướng giặc và buộc Lâm Ấp phải rút tàn quân về nước, giữ vững toàn vẹn biên cương non sông.',
    thumbnailUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Statue_of_Ly_Nam_De.jpg/800px-Statue_of_Ly_Nam_De.jpg',
    displayOrder: 1,
    category: EventCategory.REVOLUTION,
    metadata: {
      cause:
        'Từ đầu thế kỷ VI, triều Lương (Nam triều phương Bắc) thi hành chính sách cai trị và bóc lột vô cùng tàn bạo đối với nhân dân Giao Châu. Thứ sử Tiêu Tư — một kẻ thuộc tôn thất nhà Lương — nổi tiếng tham lam, hà khắc, đã đặt ra hàng trăm thứ thuế vô lý từ muối, sắt đến cả cây cau, cây chuối, đẩy người dân vào cảnh khốn cùng.\n\nBên cạnh đó, triều đình nhà Lương thi hành chế độ phân biệt đẳng cấp sĩ tộc cực đoan, coi thường và tước đoạt mọi cơ hội thăng tiến của người bản xứ phương Nam. Điển hình là bi kịch của danh sĩ Tinh Thiều — người học rộng tài cao, từng lặn lội sang tận kinh đô Kiến Khang thi đỗ chức cử nhưng viên Thượng thư lệnh Lương cho rằng họ Tinh không thuộc dòng dõi danh gia vọng tộc nên chỉ chuẩn cho làm chức "Gác cổng thành". Tinh Thiều uất ức bỏ về quê, nung nấu ý chí đánh đổ chế độ đô hộ.\n\nLý Bí (Lý Bôn) xuất thân từ hào tộc lâu đời tại vùng Thái Bình, từng được bổ giữ chức Giám quân ở Đức Châu (Hà Tĩnh). Thấu hiểu nỗi thống khổ của muôn dân và căm ghét chế độ cai trị tàn bạo của Tiêu Tư, ông đã chủ động từ quan, trở về quê hương liên kết với các tù trưởng, hào kiệt uy tín như Triệu Túc (hào trưởng Chu Diên), Phạm Tu (võ tướng Thanh Liệt), Tinh Thiều để mưu tính đại sự khởi nghĩa giành độc lập.',
      outcome:
        'Thắng lợi oanh liệt của Khởi nghĩa Lý Bí đã quét sạch hoàn toàn ách thống trị đô hộ hà khắc của nhà Lương, chấm dứt thời kỳ Bắc thuộc lần thứ hai kéo dài gần 5 thế kỷ (từ sau cuộc kháng chiến của Hai Bà Trưng năm 43 đến năm 544).\n\nCuộc khởi nghĩa là mốc son chói lọi khẳng định ý chí tự chủ, tinh thần quật khởi kiên cường và ý thức dân tộc tự cường sâu sắc của nhân dân ta, minh chứng cho sức mạnh đoàn kết của toàn thể hào kiệt và bách tính các châu huyện.\n\nThắng lợi toàn diện này là tiền đề trực tiếp để mùa xuân năm 544 (tháng 2 âm lịch), Lý Bí lên ngôi Hoàng đế, lấy hiệu là Lý Nam Đế, đặt quốc hiệu là Vạn Xuân với ước nguyện đất nước mãi trường tồn muôn vạn mùa xuân, đặt niên hiệu riêng Thiên Đức, thành lập triều đình độc lập và cho xây dựng ngôi chùa Khai Quốc (nay là chùa Trấn Quốc trên bờ Hồ Tây, Hà Nội).',
      sources: [
        wiki('Khởi_nghĩa_Lý_Bí'),
        wiki('Lý_Nam_Đế'),
        wiki('Phạm_Tu'),
        'Đại Việt sử ký toàn thư, Ngoại kỷ toàn thư, Quyển 4 (Kỷ Tiền Lý)',
        'Việt sử lược, Quyển 1',
        'Lương thư, Liệt truyện, Quyển 3 & Quyển 54',
        'Lịch sử Việt Nam, Tập 1, Viện Sử học, NXB Khoa học Xã hội',
      ],
      campaignPhases: [
        {
          phase: 'Giai đoạn 1',
          time: 'Mùa xuân 542',
          title: 'Dấy binh dẹp loạn & Giải phóng thành Long Biên',
          description:
            'Lý Bí phát động khởi nghĩa từ Thái Bình, nghĩa quân thần tốc hạ thành Long Biên, Tiêu Tư bỏ chạy về Quảng Châu.',
        },
        {
          phase: 'Giai đoạn 2',
          time: 'Tháng 4/542',
          title: 'Chủ động đón đánh tan phản công Lương tại Hợp Phố',
          description:
            'Lý Bí điều quân lên vùng biên ải Hợp Phố tiêu diệt đạo quân phản công của Trần Hầu và Tôn Quýnh.',
        },
        {
          phase: 'Giai đoạn 3',
          time: 'Đầu năm 543',
          title: 'Phục kích đại phá quân phản công Lôi Châu',
          description:
            'Phối hợp cùng Phạm Tu lập trận địa mai phục tại mũi bán đảo Lôi Châu, tiêu diệt cánh quân của Tôn Quýnh, Lư Tử Hùng.',
        },
        {
          phase: 'Giai đoạn 4',
          time: 'Tháng 5/543',
          title: 'Đại tướng Phạm Tu đánh tan quân xâm lược Lâm Ấp tại Cửu Đức',
          description:
            'Lão tướng Phạm Tu cầm quân nam hạ chém tướng Lâm Ấp, giữ vững toàn vẹn biên cương phía Nam.',
        },
      ],
      forces: {
        insurgents:
          'Nghĩa quân Lý Bí liên minh cùng hào kiệt các châu (Chu Diên, Thanh Liệt, Cửu Đức...)',
        occupiers:
          'Chính quyền đô hộ nhà Lương (Thứ sử Tiêu Tư) và quân viễn chinh (Trần Hầu, Tôn Quýnh, Lư Tử Hùng)',
      },
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'ly-nam-de-lap-nuoc-van-xuan',
    periodSlug: 'thoi-ky-nha-tien-ly-544-602',
    locationSlug: 'chua-tran-quoc',
    parentSlug: null,
    title: 'Lý Nam Đế lên ngôi, đặt quốc hiệu Vạn Xuân',
    startYear: 544,
    startMonth: 2,
    eventDateNote: 'Tháng 2 âm lịch năm 544.',
    summary: 'Lý Bí xưng Nam Việt Đế, đặt quốc hiệu Vạn Xuân, niên hiệu Thiên Đức, dựng triều đình với ban văn, ban võ.',
    description:
      'Lần đầu tiên một người Việt xưng đế, đặt niên hiệu riêng, khẳng định vị thế ngang hàng với các hoàng đế phương Bắc. Triều đình có Tinh Thiều đứng đầu ban văn, Phạm Tu đứng đầu ban võ. Theo truyền thống, chùa Khai Quốc (nay là chùa Trấn Quốc) được dựng trong thời kỳ này.',
    thumbnailUrl: null,
    displayOrder: 2,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause: 'Thắng lợi của khởi nghĩa Lý Bí (542 – 543).',
      outcome: 'Ra đời nước Vạn Xuân — nhà nước độc lập với quốc hiệu, niên hiệu và triều đình riêng.',
      sources: [wiki('Vạn_Xuân'), wiki('Lý_Nam_Đế')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'khang-chien-chong-quan-luong-cua-ly-nam-de',
    periodSlug: 'thoi-ky-nha-tien-ly-544-602',
    locationSlug: 'cua-song-to-lich',
    parentSlug: null,
    title: 'Lý Nam Đế kháng chiến chống quân Lương',
    startYear: 545,
    endYear: 548,
    eventDateNote: 'Từ năm 545 đến năm 548.',
    summary: 'Nhà Lương sai Trần Bá Tiên sang đánh; Lý Nam Đế thua ở cửa sông Tô Lịch, thành Gia Ninh, hồ Điển Triệt, rồi mất năm 548.',
    description:
      'Năm 545, quân Lương do Dương Phiêu và Trần Bá Tiên chỉ huy tiến đánh Vạn Xuân. Lý Nam Đế dựng thành lũy ở cửa sông Tô Lịch nhưng bị phá, phải lui về thành Gia Ninh, rồi động Khuất Lão. Năm 548 ông mất, trước đó đã trao binh quyền cho Triệu Quang Phục tiếp tục kháng chiến.',
    thumbnailUrl: null,
    displayOrder: 3,
    category: EventCategory.WAR,
    metadata: {
      cause: 'Nhà Lương không chấp nhận sự tồn tại của nước Vạn Xuân độc lập.',
      outcome: 'Lý Nam Đế thất bại và qua đời; cuộc kháng chiến chuyển sang giai đoạn do Triệu Quang Phục lãnh đạo.',
      sources: [wiki('Lý_Nam_Đế'), wiki('Trần_Bá_Tiên')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'trieu-quang-phuc-khang-chien-o-dam-da-trach',
    periodSlug: 'thoi-ky-nha-tien-ly-544-602',
    locationSlug: 'da-trach',
    parentSlug: null,
    title: 'Triệu Quang Phục kháng chiến ở đầm Dạ Trạch',
    startYear: 548,
    endYear: 550,
    eventDateNote: 'Từ năm 548 đến năm 550.',
    summary: 'Triệu Quang Phục đưa quân vào đầm Dạ Trạch đánh du kích, năm 550 phá quân Lương, giành lại Long Biên và xưng Triệu Việt Vương.',
    description:
      'Dựa vào địa thế đầm lầy rộng, lau sậy um tùm ở Dạ Trạch (Khoái Châu, Hưng Yên), Triệu Quang Phục ngày ẩn đêm ra đánh úp quân Lương. Năm 550, nhân nhà Lương có loạn Hầu Cảnh phải rút bớt quân về, ông phản công giết tướng Dương Sàn, chiếm lại Long Biên và xưng Triệu Việt Vương. Dân gian gọi ông là Dạ Trạch Vương.',
    thumbnailUrl: null,
    displayOrder: 4,
    category: EventCategory.WAR,
    metadata: {
      cause: 'Lực lượng Vạn Xuân suy yếu sau thất bại của Lý Nam Đế, cần một phương thức kháng chiến lâu dài.',
      outcome: 'Đánh bại quân Lương, khôi phục nền độc lập của nước Vạn Xuân.',
      sources: [wiki('Triệu_Quang_Phục')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'ly-phat-tu-gianh-quyen-trieu-viet-vuong',
    periodSlug: 'thoi-ky-nha-tien-ly-544-602',
    locationSlug: null,
    parentSlug: null,
    title: 'Lý Phật Tử đánh úp Triệu Việt Vương, thống nhất Vạn Xuân',
    startYear: 571,
    eventDateNote: 'Năm 571.',
    summary: 'Lý Phật Tử bất ngờ tấn công Triệu Việt Vương; Triệu Quang Phục thua chạy đến cửa biển Đại Nha rồi mất, Lý Phật Tử nắm toàn bộ Vạn Xuân.',
    description:
      'Sau khi cát cứ ở phía tây, Lý Phật Tử từng giảng hòa và chia đất với Triệu Việt Vương. Năm 571, ông bội ước đánh úp thành Ô Diên. Triệu Quang Phục thua, chạy đến cửa biển Đại Nha (Nam Định) thì mất. Lý Phật Tử xưng Nam Việt Đế (sử gọi là Hậu Lý Nam Đế), đóng đô ở Phong Châu.',
    thumbnailUrl: null,
    displayOrder: 5,
    category: EventCategory.POLITICAL_EVENT,
    metadata: {
      cause: 'Tranh chấp quyền lực giữa hai thế lực kế thừa nước Vạn Xuân.',
      outcome: 'Vạn Xuân thống nhất dưới quyền Lý Phật Tử, kéo dài đến năm 602.',
      sources: [wiki('Lý_Phật_Tử'), wiki('Triệu_Quang_Phục')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: 'nha-tuy-chiem-van-xuan',
    periodSlug: 'thoi-ky-nha-tien-ly-544-602',
    locationSlug: null,
    parentSlug: null,
    title: 'Nhà Tùy chiếm Vạn Xuân, chấm dứt thời Tiền Lý',
    startYear: 602,
    eventDateNote: 'Năm 602.',
    summary: 'Tướng Tùy Lưu Phương đem quân sang đánh; Lý Phật Tử ra hàng, nước Vạn Xuân sụp đổ, mở đầu Bắc thuộc lần thứ ba.',
    description:
      'Sau khi thống nhất Trung Hoa, nhà Tùy sai Lưu Phương đem quân đánh Vạn Xuân. Lý Phật Tử lo sợ không chống nổi nên ra hàng và bị đưa về phương Bắc. Nền độc lập kéo dài hơn nửa thế kỷ (542 – 602) chấm dứt, đất Việt bước vào thời kỳ Bắc thuộc lần thứ ba.',
    thumbnailUrl: null,
    displayOrder: 6,
    category: EventCategory.WAR,
    metadata: {
      cause: 'Nhà Tùy thống nhất Trung Hoa và tiếp tục chính sách bành trướng xuống phương nam.',
      outcome: 'Kết thúc thời kỳ độc lập Vạn Xuân; bắt đầu Bắc thuộc lần III.',
      sources: [wiki('Lý_Phật_Tử')],
    },
    status: ContentStatus.PUBLISHED,
  },

  // ---------- Kháng chiến chống Mỹ ----------
  {
    slug: 'hiep-dinh-geneve-chia-cat-tai-vi-tuyen-17',
    periodSlug: 'khang-chien-chong-my-cuu-nuoc-1954-1975',
    locationSlug: 'doi-bo-hien-luong-ben-hai-vi-tuyen-17',
    parentSlug: null,
    title: 'Hiệp định Genève — đất nước tạm thời chia cắt tại vĩ tuyến 17',
    startYear: 1954,
    startMonth: 7,
    startDay: 21,
    eventDateNote: 'Hiệp định ký ngày 21/07/1954.',
    summary: 'Hiệp định Genève chấm dứt chiến tranh Đông Dương, lấy sông Bến Hải (vĩ tuyến 17) làm giới tuyến quân sự tạm thời.',
    description:
      'Hiệp định quy định hai bên tập kết quân đội về hai miền, lấy vĩ tuyến 17 làm giới tuyến tạm thời và hẹn tổng tuyển cử thống nhất đất nước vào tháng 7/1956. Cuộc tổng tuyển cử không diễn ra; đôi bờ Hiền Lương – Bến Hải trở thành biểu tượng của 21 năm đất nước chia cắt.',
    thumbnailUrl: null,
    displayOrder: 17,
    category: EventCategory.TREATY,
    metadata: {
      cause: 'Thắng lợi của chiến dịch Điện Biên Phủ buộc Pháp phải đàm phán chấm dứt chiến tranh.',
      outcome: 'Miền Bắc hoàn toàn giải phóng; miền Nam tạm thời do chính quyền được Mỹ hậu thuẫn kiểm soát.',
      sources: [wiki('Hiệp_định_Genève_1954')],
    },
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: '81-ngay-dem-bao-ve-thanh-co-quang-tri',
    periodSlug: 'khang-chien-chong-my-cuu-nuoc-1954-1975',
    locationSlug: 'thanh-co-quang-tri',
    parentSlug: null,
    title: '81 ngày đêm bảo vệ Thành cổ Quảng Trị',
    startYear: 1972,
    startMonth: 6,
    startDay: 28,
    endYear: 1972,
    endMonth: 9,
    endDay: 16,
    eventDateNote: 'Từ 28/06 đến 16/09/1972.',
    summary: 'Quân Giải phóng chiến đấu 81 ngày đêm giữ Thành cổ Quảng Trị trước cuộc phản công quy mô lớn của đối phương.',
    description:
      'Trong chiến dịch Trị – Thiên năm 1972, Thành cổ Quảng Trị trở thành tâm điểm giao tranh khốc liệt. Lực lượng bảo vệ thành phải chịu hỏa lực bom đạn cực lớn suốt 81 ngày đêm trước khi rút sang bờ bắc sông Thạch Hãn. Cuộc chiến đấu góp phần tạo thế cho phái đoàn Việt Nam trên bàn đàm phán Paris.',
    thumbnailUrl: null,
    displayOrder: 18,
    category: EventCategory.BATTLE,
    metadata: {
      cause: 'Đối phương mở cuộc phản công nhằm tái chiếm Quảng Trị sau thắng lợi của Quân Giải phóng đầu chiến dịch 1972.',
      outcome: 'Giam chân và tiêu hao lớn lực lượng đối phương, tác động trực tiếp đến tiến trình Hội nghị Paris.',
      sources: [wiki('Trận_Thành_cổ_Quảng_Trị')],
    },
    status: ContentStatus.PUBLISHED,
  },
];
