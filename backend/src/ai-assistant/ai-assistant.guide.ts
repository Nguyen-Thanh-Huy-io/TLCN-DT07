import { AssistantLinkKind } from './ai-assistant.constant';
import { AssistantQuickAction } from './ai-assistant.types';

export interface FeatureGuideRule {
  keywords: RegExp;
  reply: string;
  actions: AssistantQuickAction[];
}

export const ROUTE_FLASHCARDS = '/tai-khoan?tab=the-ghi-nho';
export const ROUTE_MINDMAPS = '/tai-khoan?tab=so-do-tu-duy';
export const ROUTE_GAMIFICATION = '/tai-khoan?tab=muc-tieu';
export const ROUTE_BOOKMARKS = '/tai-khoan?tab=tu-lieu';
export const ROUTE_PRACTICE = '/luyen-tap';
export const ROUTE_CURRICULUM = '/chuong-trinh-hoc';
export const ROUTE_TIMELINE = '/dong-thoi-gian';
export const ROUTE_ARTICLES = '/bai-viet';
export const LABEL_CURRICULUM = 'Chương trình học';

export const STATIC_PAGE_DESCRIPTIONS: ReadonlyArray<{
  match: (path: string) => boolean;
  title: string;
  summary: string;
  href: string;
  kind?: AssistantLinkKind;
}> = [
  {
    match: (p) => p === '/' || p === '',
    title: 'Trang chủ HISGO — Khám phá Lịch sử',
    summary:
      'Trang chủ tổng hợp hệ sinh thái học & tra cứu lịch sử: thanh tiếp tục hành trình học tập, lối vào Dòng thời gian Đa tầng, Nhân vật, Bài viết & Di tích, Chương trình học và thử thách lịch sử mỗi ngày.',
    href: '/',
  },
  {
    match: (p) => p.startsWith('/chuong-trinh-hoc'),
    title: 'Chương trình học & Lộ trình Lịch sử',
    summary:
      'Danh sách Lộ trình học Lịch sử chia theo Chương và Bài học có trình tự. Học viên có thể ghi danh, theo dõi tiến độ % hoàn thành và mở bài học để đọc, ghi chú, ôn tập.',
    href: ROUTE_CURRICULUM,
  },
  {
    match: (p) => p.startsWith('/dong-thoi-gian') || p.startsWith('/giai-doan'),
    title: 'Dòng thời gian Lịch sử Đa tầng',
    summary:
      'Trục thời gian tương tác xuyên suốt các thời kỳ lịch sử. Hỗ trợ lọc theo giai đoạn và bấm vào từng mốc năm để đọc bài viết sự kiện/nhân vật gắn với mốc đó.',
    href: ROUTE_TIMELINE,
    kind: AssistantLinkKind.TIMELINE,
  },
  {
    match: (p) =>
      p.startsWith('/bai-viet') ||
      p.startsWith('/su-kien') ||
      p.startsWith('/nhan-vat') ||
      p.startsWith('/di-tich'),
    title: 'Thư viện Bài viết & Tư liệu Lịch sử',
    summary:
      'Kho bách khoa toàn thư HISGO phân loại theo Sự kiện, Nhân vật, Di tích, Triều đại và Tác phẩm tư liệu. Hỗ trợ lọc theo chuyên mục và tìm từ khóa.',
    href: ROUTE_ARTICLES,
  },
  {
    match: (p) => p.startsWith('/luyen-tap'),
    title: 'Phòng Luyện tập & Khảo thí Lịch sử',
    summary:
      'Không gian làm đề thi trắc nghiệm có bấm giờ theo từng Chủ đề lịch sử với 6 dạng câu hỏi tương tác, chấm điểm tự động kèm lời giải chi tiết.',
    href: ROUTE_PRACTICE,
  },
  {
    match: (p) => p.startsWith('/cong-dong'),
    title: 'Diễn đàn Cộng đồng Sử học HISGO',
    summary:
      'Bảng tin thảo luận lịch sử cộng đồng: đăng bài thảo luận, chia sẻ nghiên cứu, bình luận thời gian thực và kiểm duyệt tự động bằng AI Sentinel.',
    href: '/cong-dong',
  },
  {
    match: (p) => p.startsWith('/blog'),
    title: 'Chuyên khảo & Góc nhìn Sử học (Blog)',
    summary:
      'Nơi đăng tải các bài viết nghiên cứu lịch sử dài hạn (Long-form) kèm trích dẫn nguồn sử liệu của cộng đồng và biên tập viên.',
    href: '/blog',
    kind: AssistantLinkKind.BLOG,
  },
  {
    match: (p) => p.startsWith('/tai-khoan'),
    title: 'Không gian Tài khoản & Học tập Cá nhân',
    summary:
      'Trung tâm quản lý học tập gồm Hồ sơ, Lộ trình, Mục tiêu & Thành tựu (Streak/XP), Tư liệu đã lưu, Flashcards SM-2 & AI, Mindmap Canvas Studio & AI.',
    href: '/tai-khoan',
  },
];

export const FEATURE_GUIDE_RULES: readonly FeatureGuideRule[] = [
  {
    keywords: /flashcard|thẻ ghi nhớ|sm-2|ôn thẻ/i,
    reply:
      'Trên HISGO, **Thẻ ghi nhớ (Flashcards SM-2)** giúp bạn ôn tập lặp lại ngắt quãng:\n• Tự tạo bộ thẻ, bôi đen tạo nhanh khi đọc bài, hoặc bấm **"✨ Tạo bộ thẻ bằng AI"** từ ghi chú và câu Quiz làm sai.\n• Hệ thống tự hẹn lịch ôn theo 4 mức: *Quên (10 phút)*, *Khó*, *Nhớ*, *Dễ*.',
    actions: [
      { label: 'Mở Thẻ ghi nhớ (SM-2)', href: ROUTE_FLASHCARDS },
      { label: 'Mở Sơ đồ tư duy', href: ROUTE_MINDMAPS },
    ],
  },
  {
    keywords: /mindmap|sơ đồ tư duy|canvas/i,
    reply:
      '**Sơ đồ tư duy (Mindmap Canvas Studio)** hỗ trợ 5 cấu trúc trực quan (2 bên, tổ chức, cây logic ngang, xương cá, tự do). Bạn có thể gõ yêu cầu hoặc để AI phát triển tiếp nhánh đang vẽ dở ngay dưới Canvas.',
    actions: [
      { label: 'Mở Sơ đồ tư duy AI', href: ROUTE_MINDMAPS },
      { label: 'Xem Dòng thời gian', href: ROUTE_TIMELINE },
    ],
  },
  {
    keywords: /streak|chuỗi ngày|xp|cấp bậc|huy hiệu|mục tiêu|gamification/i,
    reply:
      'Hệ thống **Gamification** thưởng **XP** và giữ **Chuỗi ngày học (Streak)** khi bạn hoàn thành bài học, đọc bài viết, nộp bài Quiz, ôn Flashcard hoặc dựng Mindmap.',
    actions: [
      { label: 'Xem Mục tiêu & Huy hiệu', href: ROUTE_GAMIFICATION },
      { label: 'Vào Phòng Luyện tập', href: ROUTE_PRACTICE },
    ],
  },
  {
    keywords: /luyện tập|quiz|đề thi|trắc nghiệm|kiểm tra/i,
    reply:
      'Tại **Phòng Luyện tập (/luyen-tap)**, bạn có thể làm đề theo từng Chủ đề lịch sử với 6 dạng câu hỏi tương tác, chấm điểm tự động và lưu lại câu làm sai để tạo Flashcard ôn tập.',
    actions: [
      { label: 'Vào Phòng Luyện tập', href: ROUTE_PRACTICE },
      { label: LABEL_CURRICULUM, href: ROUTE_CURRICULUM },
    ],
  },
  {
    keywords: /ghi chú|highlight|bôi đen|đánh dấu|đã lưu|tủ sách|bookmark/i,
    reply:
      'Khi đọc **Bài viết** hoặc **Bài học**, hãy bôi đen đoạn văn để ghi chú theo nhãn hoặc bấm **Lưu tư liệu** đưa vào Tủ sách cá nhân (`/tai-khoan?tab=tu-lieu`).',
    actions: [
      { label: 'Tư liệu đã lưu', href: ROUTE_BOOKMARKS },
      { label: 'Khám phá Bài viết', href: ROUTE_ARTICLES },
    ],
  },
  {
    keywords: /cộng đồng|diễn đàn|đăng bài|blog|bình luận/i,
    reply:
      'Không gian **Cộng đồng (/cong-dong)** và **Blog (/blog)** là nơi trao đổi sử học, đăng bài nghiên cứu kèm trích dẫn nguồn và thảo luận thời gian thực.',
    actions: [
      { label: 'Vào Cộng đồng', href: '/cong-dong' },
      { label: 'Đọc Blog chuyên khảo', href: '/blog' },
    ],
  },
];
