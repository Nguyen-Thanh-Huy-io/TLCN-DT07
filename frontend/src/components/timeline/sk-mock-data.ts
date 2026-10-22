import { heroLandscape } from "./sk-shared";
import type { Era, SubEra, TimeNode, TimelineEvent } from "./sk-types";

const temple = "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=85";
const fields = "https://images.unsplash.com/photo-1759476313188-ace167358a23?auto=format&fit=crop&w=900&q=85";

function makeEvent(
  year: number,
  title: string,
  summary: string,
  category = "Quân sự",
  imageUrl = heroLandscape,
  index = 0,
): TimelineEvent {
  return {
    id: `${year}-${index}`,
    dateLabel: `Năm ${year}`,
    year,
    era: year < 1009 ? "Buổi đầu độc lập" : "Kỷ nguyên Đại Việt",
    subEra: year < 968 ? "Ngô – Đinh" : year < 1009 ? "Đinh – Tiền Lê" : year < 1226 ? "Nhà Lý" : "Nhà Trần",
    category,
    scopeGroup: index === 2 ? "WORLD" : "DOMESTIC",
    domainGroup: category === "Văn hóa" || category === "Kinh tế" ? "ECONOMY_CULTURE" : "POLITICS_MILITARY",
    title,
    summary,
    content: `${summary}\n\nĐây là một dấu mốc quan trọng trong tiến trình lịch sử, phản ánh khát vọng tự chủ và sức sống bền bỉ của dân tộc. Trong bối cảnh nhiều biến động, những quyết sách của người đứng đầu cùng sự đồng lòng của nhân dân đã tạo nên bước chuyển có ý nghĩa lâu dài.\n\nDi sản của giai đoạn này vẫn hiện diện trong đời sống văn hóa, các di tích lịch sử và ký ức cộng đồng ngày nay. Tìm hiểu sự kiện giúp chúng ta kết nối quá khứ với hiện tại và nhìn nhận lịch sử trong mối liên hệ rộng lớn hơn.`,
    imageUrl,
    tags: category === "Văn hóa" ? ["Di sản", "Đại Việt"] : ["Độc lập", "Dựng nước"],
    isMilestone: year === 938 || year === 1010,
  };
}

function node(
  year: number,
  subEraId: string,
  events: TimelineEvent[],
  name: string,
  place: string,
  span = false,
): TimeNode {
  return {
    id: `node-${year}`,
    subEraId,
    dateLabel: span ? `${year} – 1288` : `Năm ${year}`,
    sortYear: year,
    nodeType: span ? "SPAN" : "POINT",
    endDateLabel: span ? "Năm 1288" : undefined,
    isMilestone: year === 938,
    events,
    figures: [
      {
        id: `figure-${year}`,
        name,
        role: "Nhân vật lịch sử",
        bio: `${name} có vai trò quan trọng trong những chuyển biến của giai đoạn này.`,
      },
    ],
    locations: [
      {
        id: `place-${year}`,
        name: place,
        modernName: place === "Hoa Lư" ? "Ninh Bình" : "Việt Nam",
        description: "Địa danh gắn liền với các sự kiện và di sản lịch sử của dân tộc.",
      },
    ],
  };
}

const quiz = [
  {
    id: "q1",
    question: "Chiến thắng Bạch Đằng của Ngô Quyền diễn ra vào năm nào?",
    options: ["Năm 905", "Năm 938", "Năm 968", "Năm 981"],
    correctIndex: 1,
  },
  {
    id: "q2",
    question: "Kinh đô của nhà Đinh được đặt ở đâu?",
    options: ["Thăng Long", "Phú Xuân", "Hoa Lư", "Cổ Loa"],
    correctIndex: 2,
  },
];

const subs: SubEra[] = [
  {
    id: "ngo-dinh",
    eraId: "early",
    title: "Ngô – Đinh",
    periodLabel: "938 – 980",
    summary: "Đặt nền móng cho một quốc gia độc lập, tự chủ.",
    themeColor: "green",
    quizQuestions: quiz,
    timeNodes: [
      node(
        938,
        "ngo-dinh",
        [makeEvent(938, "Chiến thắng Bạch Đằng", "Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng, mở ra kỷ nguyên độc lập lâu dài cho dân tộc.")],
        "Ngô Quyền",
        "Sông Bạch Đằng",
      ),
      node(
        939,
        "ngo-dinh",
        [
          makeEvent(939, "Ngô Quyền xưng vương", "Ngô Quyền lên ngôi, chọn Cổ Loa làm kinh đô, xây dựng nền chính trị độc lập.", "Chính trị", temple),
          makeEvent(939, "Khôi phục nền tự chủ", "Tổ chức triều đình và từng bước củng cố bộ máy nhà nước tự chủ.", "Chính trị", fields, 1),
          makeEvent(939, "Thế giới vào thế kỷ X", "Các quốc gia ở Đông Á bước vào thời kỳ biến chuyển về chính trị và giao thương.", "Kinh tế", heroLandscape, 2),
        ],
        "Ngô Quyền",
        "Cổ Loa",
      ),
      node(
        968,
        "ngo-dinh",
        [makeEvent(968, "Đinh Bộ Lĩnh thống nhất đất nước", "Dẹp loạn 12 sứ quân, lập nước Đại Cồ Việt, đóng đô tại Hoa Lư.", "Chính trị", fields)],
        "Đinh Tiên Hoàng",
        "Hoa Lư",
      ),
    ],
  },
  {
    id: "tien-le",
    eraId: "early",
    title: "Đinh – Tiền Lê",
    periodLabel: "980 – 1009",
    summary: "Củng cố nền độc lập và phát triển quốc gia Đại Cồ Việt.",
    themeColor: "amber",
    quizQuestions: quiz,
    timeNodes: [
      node(
        981,
        "tien-le",
        [makeEvent(981, "Kháng chiến chống Tống", "Lê Hoàn lãnh đạo quân dân Đại Cồ Việt đánh bại cuộc xâm lược của nhà Tống.")],
        "Lê Đại Hành",
        "Sông Bạch Đằng",
      ),
      node(
        987,
        "tien-le",
        [makeEvent(987, "Lễ cày tịch điền đầu tiên", "Vua Lê Đại Hành đích thân xuống ruộng, khuyến khích nông nghiệp và chăm lo đời sống nhân dân.", "Kinh tế", fields)],
        "Lê Đại Hành",
        "Đọi Sơn",
      ),
    ],
  },
  {
    id: "ly",
    eraId: "daiviet",
    title: "Nhà Lý",
    periodLabel: "1009 – 1225",
    summary: "Thăng Long vươn mình, mở đầu thời kỳ thịnh trị của Đại Việt.",
    themeColor: "green",
    quizQuestions: quiz,
    timeNodes: [
      node(
        1010,
        "ly",
        [makeEvent(1010, "Dời đô về Thăng Long", "Lý Thái Tổ ban Chiếu dời đô, chuyển kinh đô từ Hoa Lư về thành Đại La, đổi tên là Thăng Long.", "Chính trị", temple)],
        "Lý Thái Tổ",
        "Thăng Long",
      ),
      node(
        1070,
        "ly",
        [makeEvent(1070, "Xây dựng Văn Miếu", "Văn Miếu được xây dựng tại Thăng Long, trở thành biểu tượng của truyền thống hiếu học.", "Văn hóa", temple)],
        "Lý Thánh Tông",
        "Văn Miếu",
      ),
    ],
  },
  {
    id: "tran",
    eraId: "daiviet",
    title: "Nhà Trần",
    periodLabel: "1226 – 1400",
    summary: "Hào khí Đông A và ba lần chiến thắng quân Nguyên Mông.",
    themeColor: "amber",
    quizQuestions: quiz,
    timeNodes: [
      node(
        1258,
        "tran",
        [
          makeEvent(1258, "Ba lần kháng chiến chống Nguyên Mông", "Quân dân nhà Trần viết nên những trang sử hào hùng, bảo vệ vững chắc nền độc lập của Đại Việt."),
          makeEvent(1258, "Hào khí Đông A", "Tinh thần đoàn kết và ý chí tự cường kết tinh trong văn học, nghệ thuật thời Trần.", "Văn hóa", temple, 1),
        ],
        "Trần Hưng Đạo",
        "Sông Bạch Đằng",
        true,
      ),
    ],
  },
];

subs[0].timeNodes[0].subPhases = [
  {
    ...subs[0],
    id: "bach-dang-detail",
    title: "Chiến dịch Bạch Đằng",
    periodLabel: "Mùa đông năm 938",
    timeNodes: [
      node(
        938,
        "bach-dang-detail",
        [makeEvent(938, "Trận địa cọc trên sông Bạch Đằng", "Ngô Quyền tận dụng thủy triều, bố trí bãi cọc ngầm tạo nên trận địa quyết định.")],
        "Ngô Quyền",
        "Sông Bạch Đằng",
      ),
    ],
  },
];

export const mockTimelineData: Era[] = [
  {
    id: "early",
    title: "Buổi đầu độc lập",
    periodLabel: "938 – 1009",
    overview: "Từ chiến thắng Bạch Đằng đến nền móng của một quốc gia tự chủ.",
    subEras: subs.slice(0, 2),
  },
  {
    id: "daiviet",
    title: "Kỷ nguyên Đại Việt",
    periodLabel: "1009 – 1400",
    overview: "Những triều đại rực rỡ, bản lĩnh và bản sắc của Đại Việt.",
    subEras: subs.slice(2),
  },
];

