import { FigureRole } from '@prisma/client';

export interface IFigureProfileSeed {
  roles: FigureRole[];
  // Lưu vào HistoricalEntity.metadata.profile — khớp FIGURE_PROFILE_METADATA_KEY ở public-content.
  profile?: {
    hometown?: string;
    backgroundAndYouth?: string;
    notableWorks?: string[];
    legacyAndHonors?: string;
    anecdotes?: string[];
    famousQuote?: string;
  };
}

const { MONARCH, GENERAL, SCHOLAR, REVOLUTIONARY, POLITICIAN } = FigureRole;

/**
 * Batch 03 — Vai trò (Person.roles) và hồ sơ "Tiểu sử & di sản" cho toàn bộ
 * 36 nhân vật đã seed. Nhân vật truyền thuyết chỉ ghi những gì truyền thống
 * kể lại và nói rõ là truyền thuyết; nhân vật ít sử liệu để trống các mục
 * không có căn cứ thay vì bịa thêm.
 */
export const FIGURE_PROFILES: Record<string, IFigureProfileSeed> = {
  // ---------- Hồng Bàng ----------
  'cac-vua-hung': {
    roles: [MONARCH],
    profile: {
      hometown: 'Vùng Phong Châu (Phú Thọ ngày nay)',
      backgroundAndYouth: 'Theo truyền thuyết, vua Hùng đầu tiên là con trưởng của Lạc Long Quân và Âu Cơ, được tôn lên ngôi, đặt quốc hiệu Văn Lang và truyền nối 18 đời.',
      legacyAndHonors: 'Ngày 10 tháng 3 âm lịch được lấy làm ngày Giỗ Tổ Hùng Vương. "Tín ngưỡng thờ cúng Hùng Vương ở Phú Thọ" được UNESCO ghi danh là Di sản văn hóa phi vật thể đại diện của nhân loại năm 2012.',
      anecdotes: ['Truyền thuyết Bánh chưng bánh giầy kể việc Lang Liêu được Hùng Vương thứ 6 truyền ngôi nhờ dâng lễ vật làm từ gạo.'],
      famousQuote: 'Các vua Hùng đã có công dựng nước, Bác cháu ta phải cùng nhau giữ lấy nước. — Hồ Chí Minh, 1954',
    },
  },
  'kinh-duong-vuong': {
    roles: [MONARCH],
    profile: {
      backgroundAndYouth: 'Theo truyền thuyết Hồng Bàng, Kinh Dương Vương (tên Lộc Tục) là cháu bốn đời của Thần Nông, được phong cai quản phương Nam, lập ra nước Xích Quỷ và lấy con gái Động Đình Quân là Thần Long.',
      legacyAndHonors: 'Được coi là thủy tổ của người Việt; lăng và đền thờ Kinh Dương Vương ở Thuận Thành, Bắc Ninh.',
    },
  },
  'lac-long-quan': {
    roles: [MONARCH],
    profile: {
      backgroundAndYouth: 'Con của Kinh Dương Vương, thuộc nòi rồng. Theo truyền thuyết, ông diệt trừ các loài yêu quái như Ngư Tinh, Hồ Tinh, Mộc Tinh, dạy dân trồng lúa, làm nhà.',
      legacyAndHonors: 'Cùng Âu Cơ là biểu tượng của nguồn gốc "con Rồng cháu Tiên" và tinh thần "đồng bào" của người Việt.',
      anecdotes: ['Khi chia tay Âu Cơ, Lạc Long Quân dẫn năm mươi con xuống biển, hẹn khi có việc thì cùng nhau giúp đỡ.'],
    },
  },
  'au-co': {
    roles: [],
    profile: {
      backgroundAndYouth: 'Theo truyền thuyết, Âu Cơ thuộc dòng tiên, con gái Đế Lai, kết duyên cùng Lạc Long Quân và sinh ra bọc trăm trứng.',
      legacyAndHonors: 'Được tôn là Quốc Mẫu; đền Mẫu Âu Cơ ở Hiền Lương, Hạ Hòa, Phú Thọ là nơi thờ chính, gắn với lễ hội đền Mẫu Âu Cơ hằng năm.',
      anecdotes: ['Âu Cơ dẫn năm mươi người con lên núi; người con trưởng sau được tôn làm vua Hùng.'],
    },
  },
  'an-duong-vuong': {
    roles: [MONARCH],
    profile: {
      backgroundAndYouth: 'Tên là Thục Phán, thủ lĩnh bộ tộc Âu Việt. Ông hợp nhất Âu Việt với Lạc Việt, lập nước Âu Lạc và đóng đô ở Cổ Loa.',
      notableWorks: ['Xây thành Cổ Loa', 'Tổ chức phòng thủ chống quân Tần và Triệu Đà'],
      legacyAndHonors: 'Được thờ tại đền Thượng trong khu di tích Cổ Loa (Đông Anh, Hà Nội) và đền Cuông (Diễn Châu, Nghệ An).',
      anecdotes: ['Truyền thuyết kể thần Kim Quy giúp xây thành và tặng móng làm lẫy nỏ thần; Trọng Thủy lừa Mị Châu đánh tráo lẫy nỏ khiến Âu Lạc mất nước.'],
    },
  },
  'son-tinh': {
    roles: [],
    profile: {
      hometown: 'Núi Tản Viên (Ba Vì, Hà Nội)',
      backgroundAndYouth: 'Thần núi Tản Viên trong truyền thuyết thời Hùng Vương thứ 18, người cưới được công chúa Mị Nương.',
      legacyAndHonors: 'Một trong "Tứ bất tử" của tín ngưỡng dân gian Việt Nam, được thờ ở nhiều nơi quanh vùng Ba Vì.',
      anecdotes: ['Hằng năm Thủy Tinh dâng nước đánh Sơn Tinh — cách dân gian giải thích mùa lũ ở đồng bằng sông Hồng.'],
    },
  },

  // ---------- Bắc thuộc lần I ----------
  'trieu-da': {
    roles: [MONARCH],
    profile: {
      hometown: 'Chân Định (Hà Bắc, Trung Quốc ngày nay)',
      backgroundAndYouth: 'Vốn là tướng nhà Tần theo Đồ Thư đánh phương nam, làm huyện lệnh Long Xuyên rồi úy quận Nam Hải.',
      notableWorks: ['Lập nước Nam Việt, đóng đô ở Phiên Ngung', 'Sáp nhập đất Âu Lạc'],
      legacyAndHonors: 'Sử cũ Việt Nam từng xếp nhà Triệu vào chính thống; từ thế kỷ XVIII, Ngô Thì Sĩ và nhiều sử gia về sau coi Triệu Đà là kẻ xâm lược.',
      anecdotes: ['Ông sống rất thọ và trị vì Nam Việt khoảng bảy mươi năm theo ghi chép của sử cũ.'],
    },
  },
  'lu-gia': {
    roles: [POLITICIAN],
    profile: {
      backgroundAndYouth: 'Người bản địa Nam Việt, làm thừa tướng trải ba đời vua nhà Triệu, rất được lòng dân.',
      legacyAndHonors: 'Được thờ ở nhiều đình, đền vùng đồng bằng Bắc Bộ như một biểu tượng chống nội thuộc phương Bắc.',
    },
  },
  'han-vu-de': {
    roles: [MONARCH],
    profile: {
      backgroundAndYouth: 'Tên là Lưu Triệt, hoàng đế thứ bảy của nhà Tây Hán, trị vì từ năm 141 đến 87 TCN.',
      notableWorks: ['Chinh phục Nam Việt (111 TCN)', 'Đặt các quận Giao Chỉ, Cửu Chân, Nhật Nam'],
    },
  },
  'lo-bac-duc': {
    roles: [GENERAL],
    profile: {
      backgroundAndYouth: 'Tướng nhà Tây Hán, được phong Phục Ba tướng quân.',
      notableWorks: ['Chỉ huy quân Hán phá thành Phiên Ngung năm 111 TCN'],
    },
  },
  'to-dinh': {
    roles: [POLITICIAN],
    profile: {
      backgroundAndYouth: 'Thái thú quận Giao Chỉ thời Đông Hán, bị sử cũ chép là tham lam, tàn bạo.',
    },
  },
  'thi-sach': {
    roles: [POLITICIAN],
    profile: {
      hometown: 'Huyện Chu Diên',
      backgroundAndYouth: 'Con Lạc tướng huyện Chu Diên, chồng của Trưng Trắc.',
      legacyAndHonors: 'Sử cũ chép việc Thi Sách bị Tô Định giết là một nguyên nhân khởi nghĩa; một số nhà nghiên cứu hiện đại dựa vào Hậu Hán thư cho rằng điều này chưa chắc chắn.',
    },
  },

  // ---------- Trưng Nữ Vương ----------
  'trung-trac': {
    roles: [MONARCH, REVOLUTIONARY],
    profile: {
      hometown: 'Huyện Mê Linh (nay thuộc Hà Nội)',
      backgroundAndYouth: 'Con gái Lạc tướng Mê Linh, thuộc dòng dõi Hùng Vương theo truyền thống. Bà kết duyên với Thi Sách, con Lạc tướng Chu Diên.',
      notableWorks: ['Lãnh đạo khởi nghĩa năm 40', 'Xưng vương, đóng đô ở Mê Linh', 'Miễn thuế hai năm cho dân Giao Chỉ, Cửu Chân'],
      legacyAndHonors: 'Người phụ nữ đầu tiên làm vua trong lịch sử Việt Nam. Được thờ ở đền Hát Môn, đền Mê Linh, đền Đồng Nhân; nhiều đường phố và trường học mang tên Hai Bà Trưng.',
      famousQuote: 'Một xin rửa sạch nước thù / Hai xin đem lại nghiệp xưa họ Hùng — Thiên Nam ngữ lục',
    },
  },
  'trung-nhi': {
    roles: [REVOLUTIONARY, GENERAL],
    profile: {
      hometown: 'Huyện Mê Linh (nay thuộc Hà Nội)',
      backgroundAndYouth: 'Em gái Trưng Trắc, cùng chị luyện võ nghệ và dấy binh khởi nghĩa.',
      legacyAndHonors: 'Được thờ cùng Trưng Trắc trong các đền thờ Hai Bà Trưng; ngày giỗ Hai Bà là mùng 6 tháng 2 âm lịch.',
    },
  },
  'ma-vien': {
    roles: [GENERAL],
    profile: {
      backgroundAndYouth: 'Tướng nhà Đông Hán, được phong Phục Ba tướng quân, nổi tiếng với câu "da ngựa bọc thây".',
      notableWorks: ['Đàn áp khởi nghĩa Hai Bà Trưng (42 – 43)'],
      anecdotes: ['Tương truyền ông dựng cột đồng ở biên giới với lời nguyền "Đồng trụ chiết, Giao Chỉ diệt"; sử gia hiện đại chưa xác định được vị trí cột đồng.'],
    },
  },
  'to-dinh-thoi-trung': {
    roles: [POLITICIAN],
    profile: {
      backgroundAndYouth: 'Thái thú Giao Chỉ, bị nghĩa quân Hai Bà Trưng đánh đuổi năm 40, phải cắt tóc, bỏ ấn tín chạy về nước.',
    },
  },
  'thi-sach-thoi-trung': {
    roles: [POLITICIAN],
    profile: {
      hometown: 'Huyện Chu Diên',
      backgroundAndYouth: 'Chồng của Trưng Trắc, con Lạc tướng huyện Chu Diên.',
    },
  },
  'thanh-thien': {
    roles: [GENERAL],
    profile: {
      backgroundAndYouth: 'Theo truyền thống thờ phụng địa phương, bà là nữ tướng của Hai Bà Trưng, được giao trấn giữ vùng Ngọc Lâm (Bắc Giang).',
      legacyAndHonors: 'Được thờ ở nhiều nơi với danh hiệu Thánh Thiên công chúa.',
    },
  },

  // ---------- Bắc thuộc lần II ----------
  'ba-trieu': {
    roles: [REVOLUTIONARY, GENERAL],
    profile: {
      hometown: 'Quận Cửu Chân (nay thuộc Thanh Hóa)',
      backgroundAndYouth: 'Tên là Triệu Thị Trinh, mồ côi cha mẹ từ nhỏ, sống cùng anh là Triệu Quốc Đạt. Bà lên núi Nưa luyện tập võ nghệ, chiêu mộ nghĩa sĩ.',
      notableWorks: ['Lãnh đạo khởi nghĩa chống Đông Ngô năm 248'],
      legacyAndHonors: 'Được thờ tại đền Bà Triệu (Hậu Lộc, Thanh Hóa). Hình tượng Bà Triệu cưỡi voi ra trận trở thành biểu tượng của nữ anh hùng Việt Nam.',
      famousQuote: 'Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ, chém cá kình ở biển Đông, đánh đuổi quân Ngô, giành lại giang sơn, cởi ách nô lệ, chứ không chịu khom lưng làm tì thiếp người!',
    },
  },
  'trieu-quoc-dat': {
    roles: [REVOLUTIONARY],
    profile: {
      hometown: 'Quận Cửu Chân (nay thuộc Thanh Hóa)',
      backgroundAndYouth: 'Anh trai Bà Triệu, hào trưởng có thế lực ở Cửu Chân, cùng em dấy binh chống Đông Ngô và mất trong thời gian khởi nghĩa.',
    },
  },
  'luc-dan': {
    roles: [GENERAL, POLITICIAN],
    profile: {
      backgroundAndYouth: 'Tướng nhà Đông Ngô, được cử làm thứ sử Giao Châu năm 248.',
      notableWorks: ['Đàn áp khởi nghĩa Bà Triệu bằng cả vũ lực lẫn mua chuộc thủ lĩnh địa phương'],
    },
  },
  'si-nhiep': {
    roles: [POLITICIAN, SCHOLAR],
    profile: {
      hometown: 'Quảng Tín, quận Thương Ngô (tổ tiên gốc nước Lỗ)',
      backgroundAndYouth: 'Học ở Lạc Dương, đỗ hiếu liêm, rồi được cử làm thái thú Giao Chỉ.',
      notableWorks: ['Giữ Giao Chỉ yên ổn khoảng 40 năm', 'Mở mang Nho học tại Luy Lâu'],
      legacyAndHonors: 'Được gọi là "Nam Giao học tổ"; đền thờ Sĩ Nhiếp ở Thuận Thành, Bắc Ninh. Sử gia hiện đại đánh giá ông là quan cai trị phương Bắc, nên việc tôn vinh vẫn còn tranh luận.',
    },
  },
  'khuong-tang-hoi': {
    roles: [SCHOLAR],
    profile: {
      hometown: 'Giao Chỉ (tổ tiên người Khương Cư — Sogdiana)',
      backgroundAndYouth: 'Theo cha buôn bán đến sinh sống ở Giao Chỉ; cha mẹ mất sớm nên xuất gia từ năm mười tuổi.',
      notableWorks: ['Lục độ tập kinh', 'Dựng chùa Kiến Sơ ở Kiến Nghiệp (247)'],
      legacyAndHonors: 'Được xem là một trong những thiền sư đầu tiên của Phật giáo Việt Nam và người đưa Phật giáo đến vùng Giang Nam.',
    },
  },
  'dao-hoang': {
    roles: [GENERAL, POLITICIAN],
    profile: {
      backgroundAndYouth: 'Tướng nhà Đông Ngô, đánh chiếm Giao Chỉ năm 271; sau khi Ngô mất (280) ông theo nhà Tấn và tiếp tục giữ chức thứ sử Giao Châu.',
    },
  },

  // ---------- Nhà Tiền Lý ----------
  'ly-bi': {
    roles: [MONARCH, REVOLUTIONARY],
    profile: {
      hometown: 'Thái Bình, Giao Châu (vị trí cụ thể còn nhiều ý kiến)',
      backgroundAndYouth: 'Tổ tiên lánh loạn từ phương Bắc sang Giao Châu từ cuối thời Tây Hán. Ông có tài văn võ, từng làm giám quân châu Đức cho nhà Lương nhưng bất bình bỏ về quê.',
      notableWorks: ['Khởi nghĩa năm 542', 'Lập nước Vạn Xuân, xưng Nam Việt Đế (544)', 'Dựng điện Vạn Thọ, chùa Khai Quốc'],
      legacyAndHonors: 'Người Việt đầu tiên xưng đế, đặt quốc hiệu và niên hiệu riêng. Được thờ ở nhiều nơi tại Hà Nội và các tỉnh đồng bằng Bắc Bộ.',
    },
  },
  'trieu-quang-phuc': {
    roles: [MONARCH, GENERAL],
    profile: {
      hometown: 'Huyện Chu Diên',
      backgroundAndYouth: 'Con Thái phó Triệu Túc, theo cha tham gia khởi nghĩa Lý Bí và lập nhiều chiến công.',
      notableWorks: ['Kháng chiến ở đầm Dạ Trạch (548 – 550)', 'Giành lại Long Biên, xưng Triệu Việt Vương'],
      legacyAndHonors: 'Dân gian gọi là Dạ Trạch Vương; được thờ ở đền Hóa Dạ Trạch (Khoái Châu, Hưng Yên).',
      anecdotes: ['Truyền thuyết kể Chử Đồng Tử hiện lên trao cho ông móng rồng gắn lên mũ đâu mâu, nhờ đó đánh đâu thắng đó.'],
    },
  },
  'ly-phat-tu': {
    roles: [MONARCH],
    profile: {
      backgroundAndYouth: 'Người họ Lý, theo Lý Thiên Bảo (anh Lý Nam Đế) chạy vào Cửu Chân rồi Lào, sau nắm quyền lực lượng này.',
      notableWorks: ['Thống nhất Vạn Xuân năm 571, đóng đô ở Phong Châu'],
      legacyAndHonors: 'Sử gọi là Hậu Lý Nam Đế. Việc ông ra hàng nhà Tùy năm 602 khép lại thời kỳ Vạn Xuân.',
    },
  },
  'pham-tu': {
    roles: [GENERAL],
    profile: {
      hometown: 'Thanh Liệt, Thanh Trì (Hà Nội ngày nay)',
      backgroundAndYouth: 'Võ tướng theo Lý Bí từ ngày đầu khởi nghĩa.',
      notableWorks: ['Đứng đầu ban võ triều Vạn Xuân', 'Đánh lui quân Lâm Ấp ở Cửu Đức (543)'],
      legacyAndHonors: 'Hy sinh năm 545 khi chống quân Lương; được thờ tại quê nhà Thanh Liệt.',
    },
  },
  'tinh-thieu': {
    roles: [SCHOLAR, POLITICIAN],
    profile: {
      backgroundAndYouth: 'Người có tài văn chương, từng sang nhà Lương xin chức nhưng chỉ được làm Quảng Dương môn lang (người gác cổng thành), lấy làm hổ thẹn nên về theo Lý Bí.',
      notableWorks: ['Đứng đầu ban văn triều Vạn Xuân'],
    },
  },
  'tran-ba-tien': {
    roles: [GENERAL, MONARCH],
    profile: {
      backgroundAndYouth: 'Tướng nhà Lương, nổi lên nhờ chiến công đánh Lý Nam Đế ở Giao Châu.',
      notableWorks: ['Chỉ huy quân Lương đánh Vạn Xuân (545 – 548)', 'Lập nhà Trần (Nam triều), trị vì 557 – 559'],
    },
  },

  // ---------- Kháng chiến chống Mỹ ----------
  'chu-tich-ho-chi-minh': {
    roles: [REVOLUTIONARY, POLITICIAN],
    profile: {
      hometown: 'Làng Kim Liên, huyện Nam Đàn, tỉnh Nghệ An',
      backgroundAndYouth: 'Tên khai sinh là Nguyễn Sinh Cung, con cụ Phó bảng Nguyễn Sinh Sắc. Năm 1911, với tên Văn Ba, Người rời bến Nhà Rồng ra nước ngoài tìm đường cứu nước.',
      notableWorks: ['Bản án chế độ thực dân Pháp (1925)', 'Đường Kách mệnh (1927)', 'Nhật ký trong tù (1942 – 1943)', 'Tuyên ngôn Độc lập (1945)', 'Di chúc (1965 – 1969)'],
      legacyAndHonors: 'Người sáng lập Đảng Cộng sản Việt Nam và nước Việt Nam Dân chủ Cộng hòa. Năm 1987, UNESCO thông qua nghị quyết kỷ niệm 100 năm ngày sinh của Người.',
      famousQuote: 'Không có gì quý hơn độc lập, tự do.',
    },
  },
  'dai-tuong-vo-nguyen-giap': {
    roles: [GENERAL, REVOLUTIONARY],
    profile: {
      hometown: 'Làng An Xá, xã Lộc Thủy, huyện Lệ Thủy, tỉnh Quảng Bình',
      backgroundAndYouth: 'Học Trường Quốc học Huế, tốt nghiệp cử nhân luật, từng dạy sử ở Trường tư thục Thăng Long (Hà Nội). Năm 1944 ông thành lập Đội Việt Nam Tuyên truyền Giải phóng quân.',
      notableWorks: ['Chỉ huy chiến dịch Điện Biên Phủ (1954)', 'Những năm tháng không thể nào quên', 'Tổng hành dinh trong mùa Xuân toàn thắng'],
      legacyAndHonors: 'Đại tướng đầu tiên của Quân đội Nhân dân Việt Nam (1948), Tổng Tư lệnh suốt hai cuộc kháng chiến.',
      famousQuote: 'Thần tốc, thần tốc hơn nữa; táo bạo, táo bạo hơn nữa. — Bức điện ngày 7/4/1975',
    },
  },
  'nu-tuong-nguyen-thi-dinh': {
    roles: [GENERAL, REVOLUTIONARY],
    profile: {
      hometown: 'Xã Lương Hòa, huyện Giồng Trôm, tỉnh Bến Tre',
      backgroundAndYouth: 'Tham gia cách mạng từ năm 1936. Năm 1946 bà ra Bắc báo cáo tình hình và tổ chức chuyến tàu đầu tiên vượt biển chở vũ khí về chi viện Nam Bộ.',
      notableWorks: ['Lãnh đạo phong trào Đồng Khởi Bến Tre (1960)', 'Không còn đường nào khác (hồi ký)'],
      legacyAndHonors: 'Nữ tướng đầu tiên của Quân đội Nhân dân Việt Nam (Thiếu tướng, 1974), Phó Tư lệnh Quân Giải phóng miền Nam. Được truy tặng danh hiệu Anh hùng Lực lượng vũ trang nhân dân năm 1995.',
      anecdotes: ['Bà là người tổ chức "Đội quân tóc dài" — lực lượng phụ nữ đấu tranh chính trị nổi tiếng ở miền Nam.'],
    },
  },
  'dai-tuong-van-tien-dung': {
    roles: [GENERAL],
    profile: {
      hometown: 'Làng Cổ Nhuế, huyện Từ Liêm, Hà Nội',
      backgroundAndYouth: 'Công nhân dệt ở Hà Nội, tham gia cách mạng từ năm 1936, nhiều lần bị thực dân Pháp bắt giam.',
      notableWorks: ['Tư lệnh Chiến dịch Hồ Chí Minh (1975)', 'Đại thắng mùa Xuân (hồi ký)'],
      legacyAndHonors: 'Tổng Tham mưu trưởng Quân đội Nhân dân Việt Nam nhiều năm, Bộ trưởng Bộ Quốc phòng (1980 – 1986).',
    },
  },
  'nha-ngoai-giao-nguyen-thi-binh': {
    roles: [POLITICIAN, REVOLUTIONARY],
    profile: {
      hometown: 'Sinh tại Sa Đéc; quê gốc Điện Bàn, Quảng Nam',
      backgroundAndYouth: 'Cháu ngoại chí sĩ Phan Châu Trinh, tham gia phong trào học sinh, sinh viên yêu nước ở Sài Gòn và từng bị chính quyền thực dân bắt giam.',
      notableWorks: ['Trưởng đoàn Chính phủ Cách mạng lâm thời tại Hội nghị Paris', 'Ký Hiệp định Paris (27/01/1973)', 'Gia đình, bạn bè và đất nước (hồi ký)'],
      legacyAndHonors: 'Bộ trưởng Ngoại giao Chính phủ Cách mạng lâm thời, sau là Bộ trưởng Bộ Giáo dục và Phó Chủ tịch nước (1992 – 2002).',
    },
  },
  'dai-tuong-nguyen-chi-thanh': {
    roles: [GENERAL, POLITICIAN],
    profile: {
      hometown: 'Làng Niêm Phò, huyện Quảng Điền, tỉnh Thừa Thiên Huế',
      backgroundAndYouth: 'Tham gia cách mạng từ năm 1937, từng làm Bí thư Xứ ủy Trung Kỳ.',
      notableWorks: ['Chủ nhiệm Tổng cục Chính trị', 'Chính ủy Quân giải phóng miền Nam, đề ra phương châm "Nắm thắt lưng địch mà đánh"'],
      legacyAndHonors: 'Được phong Đại tướng năm 1959. Ông mất đột ngột tại Hà Nội năm 1967 khi đang chuẩn bị trở lại chiến trường.',
    },
  },
};
