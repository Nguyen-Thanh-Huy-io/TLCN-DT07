import {
  ILessonTemplateStrategy,
  LessonTemplateContext,
  LessonTemplateMeta,
  LessonTemplateType,
} from './lesson-template.types';

/**
 * 1. Mẫu bài học chuẩn sư phạm chung (Standard Pedagogical Template)
 */
export class StandardLessonTemplateStrategy implements ILessonTemplateStrategy {
  readonly meta: LessonTemplateMeta = {
    type: LessonTemplateType.STANDARD,
    label: 'Bài học Sư phạm chuẩn',
    badge: 'Phổ biến',
    description: 'Bố cục 4 phần chuẩn chương trình giáo dục phổ thông môn Lịch sử',
    icon: '',
  };

  generateHtml(context: LessonTemplateContext): string {
    const title = context.lessonTitle || 'Bài học Lịch sử';
    const topic = context.topicName ? `trong chủ đề <em>${context.topicName}</em>` : '';

    return `
<h2>I. Mục tiêu bài học</h2>
<p>Qua bài học <strong>${title}</strong> ${topic}, người học cần đạt được:</p>
<ul>
  <li><strong>Về kiến thức:</strong> Nắm vững bối cảnh, diễn biến chính và kết quả của sự kiện.</li>
  <li><strong>Về tư duy & kỹ năng:</strong> Rèn luyện năng lực phân tích nguyên nhân lịch sử và liên hệ thực tiễn.</li>
  <li><strong>Về phẩm chất:</strong> Bồi dưỡng lòng yêu nước, niềm tự hào dân tộc và ý thức trách nhiệm.</li>
</ul>

<h2>II. Bối cảnh lịch sử</h2>
<p>Nêu rõ bối cảnh tình hình trong nước và quốc tế trước khi diễn ra sự kiện, các tiền đề kinh tế, chính trị - xã hội quan trọng...</p>

<h2>III. Diễn biến then chốt</h2>
<p>Khái quát các giai đoạn phát triển chính theo dòng thời gian:</p>
<ul>
  <li><strong>Giai đoạn chuẩn bị:</strong> Những chủ trương, kế hoạch tác chiến hoặc quyết định chiến lược.</li>
  <li><strong>Giai đoạn cao trào:</strong> Các sự kiện đột phá, trận then chốt làm thay đổi cục diện.</li>
  <li><strong>Giai đoạn kết thúc:</strong> Kết cục thắng lợi và các chuyển biến thực tế.</li>
</ul>

<h2>IV. Kết quả & Ý nghĩa lịch sử</h2>
<blockquote>
  <p>Đánh giá khách quan tầm vóc của sự kiện đối với phong trào đấu tranh và tiến trình lịch sử dân tộc.</p>
</blockquote>

<h2>V. Tư liệu tham khảo & Câu hỏi ôn tập</h2>
<ol>
  <li>Nguyên nhân quyết định dẫn đến thắng lợi là gì?</li>
  <li>Bài học kinh nghiệm nào có giá trị kế thừa sâu sắc nhất?</li>
</ol>
`.trim();
  }
}

/**
 * 2. Mẫu Chiến dịch & Trận đánh quân sự (Military Campaign Template)
 */
export class MilitaryCampaignTemplateStrategy implements ILessonTemplateStrategy {
  readonly meta: LessonTemplateMeta = {
    type: LessonTemplateType.MILITARY_CAMPAIGN,
    label: 'Chiến dịch & Trận đánh',
    badge: 'Quân sự',
    description: 'Tập trung tương quan lực lượng, bản đồ tác chiến và nghệ thuật quân sự',
    icon: '',
  };

  generateHtml(context: LessonTemplateContext): string {
    const title = context.lessonTitle || 'Chiến dịch quân sự';

    return `
<h2>I. Âm mưu của địch & Chủ trương của ta</h2>
<ul>
  <li><strong>Phía đối phương:</strong> Kế hoạch hành quân, bố trí hỏa lực, lực lượng tham chiến và mục tiêu chiến dịch.</li>
  <li><strong>Chủ trương của ta:</strong> Quyết tâm của Bộ Chỉ huy, phương châm tác chiến và công tác chuẩn bị lực lượng, hậu cần.</li>
</ul>

<h2>II. Tương quan lực lượng & Địa bàn tác chiến</h2>
<p>Phân tích địa hình chiến trường, mạng lưới giao thông, so sánh quân số, trang bị vũ khí giữa hai bên...</p>

<h2>III. Các đợt tiến công & Diễn biến chính</h2>
<ul>
  <li><strong>Đợt 1 (Mở màn):</strong> Các đòn đánh phủ đầu, làm rung chuyển tuyến phòng ngự then chốt của đối phương.</li>
  <li><strong>Đợt 2 (Đột phá then chốt):</strong> Bao vây chia cắt, tiêu diệt các cứ điểm phòng ngự kiên cố.</li>
  <li><strong>Đợt 3 (Tổng công kích):</strong> Đập tan đợt phản kích cuối cùng, giải phóng toàn bộ chiến trường.</li>
</ul>

<h2>IV. Nghệ thuật quân sự & Bài học tác chiến</h2>
<blockquote>
  <p>Sự sáng tạo trong nghệ thuật chỉ đạo chiến tranh nhân dân, kết hợp tiến công quân sự và nổi dậy của quần chúng.</p>
</blockquote>
`.trim();
  }
}

/**
 * 3. Mẫu Nhân vật & Danh nhân lịch sử (Historical Figure Template)
 */
export class HistoricalFigureTemplateStrategy implements ILessonTemplateStrategy {
  readonly meta: LessonTemplateMeta = {
    type: LessonTemplateType.HISTORICAL_FIGURE,
    label: 'Nhân vật & Anh hùng',
    badge: 'Tiểu sử',
    description: 'Thân thế, sự nghiệp cứu nước và phẩm chất cao đẹp của nhân vật',
    icon: '',
  };

  generateHtml(context: LessonTemplateContext): string {
    const title = context.lessonTitle || 'Nhân vật lịch sử';

    return `
<h2>I. Thân thế & Quê hương</h2>
<p>Thời gian sinh - mất, quê quán, xuất thân gia đình và bối cảnh thời đại hun đúc nên chí hướng của <strong>${title}</strong>...</p>

<h2>II. Quá trình hoạt động cách mạng & Đóng góp lớn</h2>
<ul>
  <li><strong>Thời kỳ đầu:</strong> Bước đường giác ngộ cách mạng và những hoạt động tiên phong.</li>
  <li><strong>Thời kỳ giữ trọng trách:</strong> Những quyết sách lịch sử, cống hiến vượt bậc cho dân tộc.</li>
  <li><strong>Tấm gương chiến đấu / hy sinh:</strong> Tinh thần quật cường, xả thân vì nước.</li>
</ul>

<h2>III. Di sản tinh thần & Tôn vinh của nhân dân</h2>
<blockquote>
  <p>Khẳng định tấm gương đạo đức, phong cách sống và sự tri ân của các thế hệ hôm nay và mai sau.</p>
</blockquote>
`.trim();
  }
}

/**
 * 4. Mẫu Hiệp định & Ngoại giao lịch sử (Treaty & Conference Template)
 */
export class TreatyConferenceTemplateStrategy implements ILessonTemplateStrategy {
  readonly meta: LessonTemplateMeta = {
    type: LessonTemplateType.TREATY_CONFERENCE,
    label: 'Hiệp định & Ngoại giao',
    badge: 'Chính trị',
    description: 'Bối cảnh đàm phán, nội dung các điều khoản và thắng lợi ngoại giao',
    icon: '',
  };

  generateHtml(context: LessonTemplateContext): string {
    const title = context.lessonTitle || 'Hiệp định lịch sử';

    return `
<h2>I. Hoàn cảnh lịch sử dẫn đến đàm phán</h2>
<p>Những thắng lợi quyết định trên chiến trường buộc đối phương phải ngồi vào bàn thương lượng về <strong>${title}</strong>...</p>

<h2>II. Cuộc đấu tranh ngoại giao trên bàn đàm phán</h2>
<ul>
  <li>Lập trường kiên định của phái đoàn Việt Nam.</li>
  <li>Các mưu đồ trì hoãn, nhượng bộ bất đắc dĩ của đối phương.</li>
</ul>

<h2>III. Nội dung cốt lõi của văn bản</h2>
<ul>
  <li>Các nước công nhận độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam.</li>
  <li>Quy định về ngừng bắn, rút quân viễn chinh và trao trả tù binh.</li>
</ul>

<h2>IV. Ý nghĩa lịch sử & Thắng lợi của mặt trận ngoại giao</h2>
<blockquote>
  <p>Đỉnh cao kết hợp đấu tranh quân sự, chính trị và ngoại giao, tạo thời cơ chiến lược cho sự nghiệp giải phóng dân tộc.</p>
</blockquote>
`.trim();
  }
}

/**
 * 5. Mẫu Bản nháp trống (Blank Strategy)
 */
export class BlankLessonTemplateStrategy implements ILessonTemplateStrategy {
  readonly meta: LessonTemplateMeta = {
    type: LessonTemplateType.BLANK,
    label: 'Bản nháp trống',
    badge: 'Tự do',
    description: 'Chỉ tạo bài học trống, tự do soạn thảo văn bản từ đầu',
    icon: '',
  };

  generateHtml(): string {
    return '';
  }
}
