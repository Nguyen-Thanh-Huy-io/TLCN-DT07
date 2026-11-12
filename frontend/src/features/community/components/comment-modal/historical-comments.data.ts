import { CommunityCommentItem } from './comment-modal.types';
import { CommunityPost, extractCommunityContent } from '../../api';

/**
 * Kho bình luận lịch sử có sẵn từ trước cho các bài thảo luận mẫu và chuyên khảo
 * giúp khi bấm mở Popup luôn hiển thị đầy đủ mạch thảo luận của cộng đồng.
 */
export const HISTORICAL_PRESET_COMMENTS: Record<string, CommunityCommentItem[]> = {
  'chia-se-bai-viet-cong-la-ma-va-khong-gian-quyen-luc': [
    {
      id: 'hist-c-lama-1',
      authorId: 'scholar-1',
      authorName: 'Đặng Quốc Huy',
      authorBadge: 'Nghiên cứu viên Kiến trúc cổ',
      content:
        'Bài chuyên khảo phân tích rất sâu sắc mối liên hệ giữa cổng khải hoàn La Mã (Triumphal Arch) và trục quy hoạch đô thị. Nếu đối chiếu với Ngọ Môn hay Đoan Môn tại Hoàng thành Thăng Long, ta cũng thấy tư duy lấy cổng thành làm tâm điểm nghi lễ triều đình.',
      createdAt: '2026-11-09T09:12:00.000Z',
      likes: 11,
      likedByMe: false,
      replies: [
        {
          id: 'hist-c-lama-1-r1',
          authorId: 'author-1',
          authorName: 'Trần Minh Khôi',
          authorBadge: 'Tác giả',
          content:
            'Cảm ơn anh Huy! Đúng là ở phương Đông, cổng thành không tách rời thành một vòm độc lập giữa quảng trường như La Mã mà gắn liền với lầu ngũ phụng và tường thành phòng thủ, nhưng hiệu ứng thị giác uy quyền thì rất tương đồng.',
          createdAt: '2026-11-09T09:40:00.000Z',
          likes: 6,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: 'hist-c-lama-2',
      authorId: 'scholar-2',
      authorName: 'Vũ Thanh Mai',
      authorBadge: 'Thành viên Sử quán',
      content:
        'Mình rất ấn tượng phần giải thích về phù điêu kể chuyện chiến thắng khắc trên vòm cổng Titus và Constantine. Đối với cư dân cổ đại chưa biết chữ nhiều, kiến trúc cổng chính là một cuốn biên niên sử bằng đá ngoài trời.',
      createdAt: '2026-11-09T11:05:00.000Z',
      likes: 8,
      likedByMe: false,
      replies: [],
    },
    {
      id: 'hist-c-lama-3',
      authorId: 'scholar-3',
      authorName: 'Ngô Đình Bảo',
      content:
        'Không biết trong bài Blog bạn có đề cập thêm tới kỹ thuật vữa Pozzolana giúp vòm cuốn La Mã đứng vững qua hàng thiên niên kỷ không? Mình vừa bấm vào thẻ bài viết để đọc chi tiết!',
      createdAt: '2026-11-09T15:20:00.000Z',
      likes: 4,
      likedByMe: false,
      replies: [],
    },
  ],
  'vi-sao-bia-tien-si-khoa-nham-tuat-1442-dung-nam-1484': [
    {
      id: 'hist-c-bia-1',
      authorId: 'scholar-4',
      authorName: 'TS. Nguyễn Văn Thịnh',
      authorBadge: 'Chuyên gia Hán Nôm',
      content:
        'Theo Đại Việt sử ký toàn thư (Bản kỷ thực lục, quyển XI), ngay sau mỗi khoa thi đều có "Đăng khoa lục" ghi chép bằng giấy lưu tại bộ Lễ và Quốc Tử Giám. Do biến động chính trị giai đoạn Nghi Dân (1459) nên việc dựng bia đá bị trì hoãn tới thời Hồng Đức thịnh trị năm 1484 mới khắc đồng loạt.',
      createdAt: '2026-11-09T14:50:00.000Z',
      likes: 16,
      likedByMe: false,
      replies: [
        {
          id: 'hist-c-bia-1-r1',
          authorId: 'author-2',
          authorName: 'Lê Hoàng Nam',
          authorBadge: 'Tác giả',
          content:
            'Giải đáp quá chuẩn xác ạ! Nhờ có sổ Đăng khoa lục của bộ Lễ lưu trữ cẩn mật suốt 42 năm nên tên tuổi, quê quán của cả 33 vị tiến sĩ khoa Nhâm Tuất 1442 vẫn còn nguyên vẹn để Thân Nhân Trung soạn bài ký.',
          createdAt: '2026-11-09T15:18:00.000Z',
          likes: 7,
          likedByMe: false,
          replies: [],
        },
        {
          id: 'hist-c-bia-1-r2',
          authorId: 'scholar-5',
          authorName: 'Hoàng Minh Tuấn',
          content:
            'Bổ sung thêm là năm 1484 vua Lê Thánh Tông cho dựng một lúc 10 tấm bia tiến sĩ cho các khoa thi từ 1442 đến 1484, tạo thành quy chế dựng bia định kỳ sau mỗi khoa thi.',
          createdAt: '2026-11-09T16:02:00.000Z',
          likes: 5,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: 'hist-c-bia-2',
      authorId: 'scholar-6',
      authorName: 'Phạm Thu Thủy',
      content:
        'Mỗi lần ghé Văn Miếu đọc lại bản dịch bài ký của Thân Nhân Trung trên tấm bia khoa Nhâm Tuất vẫn thấy lời văn vô cùng đanh thép: "Hiền tài là nguyên khí của quốc gia, nguyên khí thịnh thì thế nước mạnh mà vươn cao...".',
      createdAt: '2026-11-09T18:30:00.000Z',
      likes: 12,
      likedByMe: false,
      replies: [],
    },
  ],
  'chia-se-bai-viet-lang-nghe-va-lich-su-bien-doi-khong-gian': [
    {
      id: 'hist-c-langnghe-1',
      authorId: 'scholar-7',
      authorName: 'Lương Gia Khánh',
      authorBadge: 'Thành viên Sử quán',
      content:
        'Bài viết trên Blog tổng hợp rất rõ cấu trúc "ba mươi sáu phố phường" Kẻ Chợ gắn liền với các làng nghề gốc ở ven đô như gốm Bát Tràng, giấy Yên Thái, lụa Nghi Tàm, đúc đồng Ngũ Xã.',
      createdAt: '2026-11-10T04:10:00.000Z',
      likes: 14,
      likedByMe: false,
      replies: [
        {
          id: 'hist-c-langnghe-1-r1',
          authorId: 'author-3',
          authorName: 'Nguyễn Hà Phương',
          authorBadge: 'Tác giả',
          content:
            'Cảm ơn bạn Khánh đã đọc bài! Điểm thú vị nhất là thợ thủ công từ các làng quê di cư lên Kẻ Chợ nhưng vẫn giữ nguyên tục thờ Tổ nghề và lập đình vọng ngay tại phố nghề của mình.',
          createdAt: '2026-11-10T04:45:00.000Z',
          likes: 8,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: 'hist-c-langnghe-2',
      authorId: 'scholar-8',
      authorName: 'Trịnh Hoài An',
      content:
        'Mình rất thích bản đồ đối chiếu mạng lưới sông Tô Lịch - sông Hồng với vị trí các bến chợ gốm và chợ tơ lụa trong bài viết. Giao thông thủy thực sự là mạch máu của kinh tế Thăng Long xưa.',
      createdAt: '2026-11-10T06:15:00.000Z',
      likes: 9,
      likedByMe: false,
      replies: [],
    },
  ],
  'ky-thuat-ghep-da-thanh-nha-ho-1397': [
    {
      id: 'hist-c-nhaho-1',
      authorId: 'scholar-9',
      authorName: 'KTS. Bùi Trọng Nghĩa',
      authorBadge: 'Nghiên cứu Bảo tồn Di sản',
      content:
        'Các cuộc khai quật tại núi đá An Tôn (Vĩnh Lộc, Thanh Hóa) đã tìm thấy những phiến đá vôi nặng hơn 20 tấn đang chế tác dở dang có hàng lỗ đục vuông thẳng hàng. Thợ đá thời Hồ đóng nêm gỗ khô vào lỗ rồi tưới nước cho gỗ nở ra để tách đá cực kỳ phẳng!',
      createdAt: '2026-11-10T06:20:00.000Z',
      likes: 15,
      likedByMe: false,
      replies: [
        {
          id: 'hist-c-nhaho-1-r1',
          authorId: 'author-4',
          authorName: 'Phạm Quốc Đạt',
          authorBadge: 'Tác giả',
          content:
            'Đúng vậy anh Nghĩa ơi! Ngoài con lăn gỗ và đường trượt đất sét, có giả thuyết cho rằng người xưa còn tận dụng mùa nước nổi trên sông Mã và sông Bưởi để chở đá bằng bè lớn áp sát chân thành.',
          createdAt: '2026-11-10T06:55:00.000Z',
          likes: 6,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: 'hist-c-nhaho-2',
      authorId: 'scholar-10',
      authorName: 'Đỗ Nhật Minh',
      content:
        'Một kỹ thuật đáng kinh ngạc nữa ở Cổng Nam Thành Nhà Hồ là phương pháp đắp cốt đất thành ụ vòm trước, xếp các phiến đá hình múi bưởi lên trên cho tự khóa chặt bằng trọng lực rồi mới đào bỏ phần đất bên dưới.',
      createdAt: '2026-11-10T07:40:00.000Z',
      likes: 10,
      likedByMe: false,
      replies: [],
    },
  ],
  'nghi-van-su-lieu-ve-bau-vat-thoi-tran': [
    {
      id: 'hist-c-tran-1',
      authorId: 'scholar-11',
      authorName: 'Phan Thanh Tùng',
      authorBadge: 'Khảo cổ học',
      content:
        'Đối với mảnh gốm men ngọc phát lộ tại khu vực Tức Mặc - Thiên Trường, hoa văn cúc dây in chìm dưới lớp men dày rất đặc trưng cho lò gốm Thiên Trường thế kỷ XIII–XIV, tuy nhiên cần đối chiếu thêm tầng văn hóa trước khi kết luận niên đại tuyệt đối.',
      createdAt: '2026-11-10T06:30:00.000Z',
      likes: 5,
      likedByMe: false,
      replies: [],
    },
    {
      id: 'hist-c-tran-2',
      authorId: 'scholar-12',
      authorName: 'Lê Minh Châu',
      content:
        'Mình đồng tình với hướng tiếp cận thận trọng, cần chờ báo cáo giám định nhiệt phát quang và so sánh với sưu tập gốm thời Trần tại Hoàng thành Thăng Long.',
      createdAt: '2026-11-10T07:10:00.000Z',
      likes: 3,
      likedByMe: false,
      replies: [],
    },
  ],
};

export function getPresetCommentsForPost(post: CommunityPost): CommunityCommentItem[] {
  if (HISTORICAL_PRESET_COMMENTS[post.slug]) {
    return HISTORICAL_PRESET_COMMENTS[post.slug];
  }

  const parsed = extractCommunityContent(post);
  if (parsed.sharedBlog?.slug && HISTORICAL_PRESET_COMMENTS[parsed.sharedBlog.slug]) {
    return HISTORICAL_PRESET_COMMENTS[parsed.sharedBlog.slug];
  }

  const authorName = post.author?.username || 'Thành viên HISGO';
  return [
    {
      id: `hist-default-1-${post.id}`,
      authorId: 'scholar-default-1',
      authorName: 'Nguyễn Minh Triết',
      authorBadge: 'Thành viên Sử quán',
      content: `Chủ đề "${post.title}" rất đáng chú ý. Theo các nguồn tư liệu thư tịch cổ và kết quả khảo cổ gần đây, việc đối chiếu đa chiều giữa chính sử và bi ký địa phương sẽ giúp làm sáng tỏ nhiều chi tiết quan trọng.`,
      createdAt: post.publishedAt || post.createdAt || '2026-11-09T10:00:00.000Z',
      likes: 5,
      likedByMe: false,
      replies: [
        {
          id: `hist-default-1-r1-${post.id}`,
          authorId: post.author?.id || 'author-default',
          authorName,
          authorBadge: 'Tác giả',
          content:
            'Cảm ơn bạn đã góp ý! Mình cũng đang tổng hợp thêm các nguồn tư liệu bi ký để bổ sung vào mạch thảo luận này.',
          createdAt: post.publishedAt || post.createdAt || '2026-11-09T10:35:00.000Z',
          likes: 3,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: `hist-default-2-${post.id}`,
      authorId: 'scholar-default-2',
      authorName: 'Trần Lan Hương',
      content:
        'Rất mong tác giả tiếp tục cập nhật các góc nhìn mới để cộng đồng cùng đào sâu phân tích.',
      createdAt: post.publishedAt || post.createdAt || '2026-11-09T12:00:00.000Z',
      likes: 2,
      likedByMe: false,
      replies: [],
    },
  ];
}
