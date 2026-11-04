'use client';

import { EntityType } from '@/constants/enums';
import { KnowledgeRelationType } from '@/components/common/KnowledgeRelationManager';
import type { ContentSkeleton } from '../components/ContentBlockEditor';

/**
 * Interface cho Entity Type Strategy
 * Áp dụng Strategy Pattern + OCP:
 * Mỗi loại thực thể (Nhân vật, Địa danh, Triều đại, Hiện vật...) tự định nghĩa
 * nhãn hiển thị, tiêu đề bước, cấu hình trường nhập liệu, sườn bài viết và tab liên kết phù hợp.
 */
export interface EntityTypeStrategy {
  readonly type: EntityType;
  readonly label: string;
  readonly targetName: string; // "địa danh", "nhân vật", "triều đại",...

  // 1. Tiêu đề và mô tả từng bước trong form
  getSectionConfig(stepIndex: number): {
    title: string;
    subtitle: string;
  };

  // 2. Nhãn và placeholder trường nhập liệu (Bước 1)
  readonly fields: {
    nameLabel: string;
    namePlaceholder: string;
    taglineLabel: string;
    taglinePlaceholder: string;
    taglineHint: string;
    aliasLabel: string;
    aliasPlaceholder: string;
    avatarTitle: string;
    avatarCaptionPlaceholder: string;
    chronologyHeader: string;
    chronologyHint: string;
    startYearLabel: string;
    endYearLabel: string;
    startDateLabel: string;
    endDateLabel: string;
    startYearPlaceholder: string;
    endYearPlaceholder: string;
    startDatePlaceholder: string;
    endDatePlaceholder: string;
  };

  // 3. Cấu hình liên kết tri thức (Bước 3)
  readonly relationsConfig: {
    sectionTitle: string;
    allowedTabs: KnowledgeRelationType[];
    targetEntityName: string;
  };

  // 4. Sườn bài soạn thảo gợi ý (Bước 2)
  readonly contentSkeletons: ContentSkeleton[];
}

/**
 * Strategy dành cho Nhân vật lịch sử (PERSON)
 */
export class PersonEntityStrategy implements EntityTypeStrategy {
  readonly type = EntityType.PERSON;
  readonly label = 'Nhân vật lịch sử';
  readonly targetName = 'nhân vật';

  getSectionConfig(stepIndex: number) {
    switch (stepIndex) {
      case 1:
        return {
          title: 'Thông tin chung',
          subtitle: 'Tên gọi, danh xưng ngắn, ảnh đại diện, thời kỳ và năm sinh - năm mất.',
        };
      case 2:
        return {
          title: 'Nội dung & Tiểu sử',
          subtitle: 'Soạn thảo tiểu sử, sự nghiệp, giai thoại và di sản của nhân vật.',
        };
      case 3:
        return {
          title: 'Quan hệ & Bối cảnh',
          subtitle: 'Thiết lập mạng lưới quan hệ với sự kiện tham gia, triều đại và nhân vật liên quan.',
        };
      case 4:
        return {
          title: 'Kiểm tra & Xuất bản',
          subtitle: 'Xem lại bảng kiểm tra chất lượng, tùy chọn nổi bật và công bố nhân vật.',
        };
      default:
        return { title: '', subtitle: '' };
    }
  }

  readonly fields = {
    nameLabel: 'Tên nhân vật lịch sử',
    namePlaceholder: 'Ví dụ: Trần Hưng Đạo, Nguyễn Huệ, Võ Nguyên Giáp...',
    taglineLabel: 'Danh xưng / Tước hiệu nhận diện ngắn (1 dòng)',
    taglinePlaceholder: 'Ví dụ: Quốc công Tiết chế, danh tướng kiệt xuất nhà Trần...',
    taglineHint: 'Hiển thị dưới tên ở danh sách, thẻ preview hoặc tooltip tìm kiếm',
    aliasLabel: 'Bí danh / Tên khác / Tước hiệu / Tên húy',
    aliasPlaceholder: 'Nhập tên khác (VD: Trần Quốc Tuấn, Hưng Đạo Đại Vương...) rồi nhấn Thêm',
    avatarTitle: 'Ảnh chân dung / Tượng đài nhân vật',
    avatarCaptionPlaceholder: 'Ví dụ: Tượng đồng Hưng Đạo Đại Vương tại đền Kiếp Bạc, Hải Dương...',
    chronologyHeader: 'Năm sinh & Năm mất',
    chronologyHint: 'Nhập năm sinh, năm mất (hỗ trợ số âm cho TCN)',
    startYearLabel: 'Năm sinh',
    endYearLabel: 'Năm mất',
    startDateLabel: 'Ngày sinh cụ thể (dạng chữ)',
    endDateLabel: 'Ngày mất cụ thể (dạng chữ)',
    startYearPlaceholder: '1228',
    endYearPlaceholder: '1300',
    startDatePlaceholder: 'Khoảng năm 1228, Đầu thế kỷ XIII...',
    endDatePlaceholder: 'Mùa thu năm Canh Tý (1300)...',
  };

  readonly relationsConfig = {
    sectionTitle: 'Mạng lưới liên kết nhân vật (Sự kiện tham gia, Lực lượng, Địa danh)',
    allowedTabs: [
      KnowledgeRelationType.ALL,
      KnowledgeRelationType.EVENT,
      KnowledgeRelationType.PERSON,
      KnowledgeRelationType.LOCATION,
      KnowledgeRelationType.FORCE,
      KnowledgeRelationType.ARTIFACT,
    ],
    targetEntityName: 'nhân vật',
  };

  readonly contentSkeletons: ContentSkeleton[] = [
    {
      label: '+ Chèn sườn bài Nhân vật',
      html: [
        '<h2>1. Xuất thân & Thiếu thời</h2><p></p>',
        '<h2>2. Sự nghiệp & Các mốc son lịch sử</h2><p></p>',
        '<h2>3. Giai thoại & Đóng góp đặc biệt</h2><p></p>',
        '<h2>4. Di sản & Tôn vinh hậu thế</h2><p></p>',
      ].join(''),
    },
  ];
}

/**
 * Strategy dành cho Địa danh / Di tích lịch sử (LOCATION)
 */
export class LocationEntityStrategy implements EntityTypeStrategy {
  readonly type = EntityType.LOCATION;
  readonly label = 'Địa danh / Di tích lịch sử';
  readonly targetName = 'địa danh';

  getSectionConfig(stepIndex: number) {
    switch (stepIndex) {
      case 1:
        return {
          title: 'Thông tin chung',
          subtitle: 'Tên địa danh, tọa độ bản đồ, cấp bảo tồn và niên đại khởi dựng.',
        };
      case 2:
        return {
          title: 'Nội dung & Lịch sử hình thành',
          subtitle: 'Soạn thảo bài viết chi tiết, kiến trúc, cảnh quan và diễn biến lịch sử tại địa danh.',
        };
      case 3:
        return {
          title: 'Quan hệ & Bối cảnh',
          subtitle: 'Liên kết địa danh với Sự kiện diễn ra, Nhân vật lịch sử và Hiện vật bảo tồn.',
        };
      case 4:
        return {
          title: 'Kiểm tra & Xuất bản',
          subtitle: 'Xem lại tiêu chuẩn dữ liệu, thiết lập độ ưu tiên hiển thị và xuất bản di tích.',
        };
      default:
        return { title: '', subtitle: '' };
    }
  }

  readonly fields = {
    nameLabel: 'Tên địa danh / Di tích lịch sử',
    namePlaceholder: 'Ví dụ: Hoàng thành Thăng Long, Cố đô Huế, Chiến trường Điện Biên Phủ...',
    taglineLabel: 'Mô tả nhận diện ngắn địa danh (1 dòng)',
    taglinePlaceholder: 'Ví dụ: Di sản Văn hóa Thế giới, trung tâm quyền lực chính trị qua nhiều triều đại...',
    taglineHint: 'Hiển thị trên bản đồ số, danh sách tra cứu và kết quả tìm kiếm',
    aliasLabel: 'Tên gọi khác / Tên cổ / Tên dân gian',
    aliasPlaceholder: 'Nhập tên khác (VD: Đông Kinh, Kẻ Chợ, Long Biên...) rồi nhấn Thêm',
    avatarTitle: 'Ảnh đại diện / Tư liệu địa danh',
    avatarCaptionPlaceholder: 'Ví dụ: Toàn cảnh Đoan Môn nhìn từ phía ngoài Hoàng thành Thăng Long...',
    chronologyHeader: 'Niên đại khởi dựng / Tồn tại',
    chronologyHint: 'Mốc thời gian xây dựng, thành lập hoặc niên đại khảo cổ phát hiện',
    startYearLabel: 'Năm khởi dựng / Xây dựng',
    endYearLabel: 'Năm biến mất / Phá hủy (nếu có)',
    startDateLabel: 'Thời điểm khởi dựng (dạng chữ)',
    endDateLabel: 'Thời điểm biến mất / Mốc tu bổ lớn (dạng chữ)',
    startYearPlaceholder: '1010',
    endYearPlaceholder: 'Để trống nếu còn tồn tại đến nay',
    startDatePlaceholder: 'Mùa thu năm Canh Tuất (1010)...',
    endDatePlaceholder: 'Để trống nếu còn tồn tại hoặc ghi mốc tu bổ...',
  };

  readonly relationsConfig = {
    sectionTitle: 'Mối quan hệ lịch sử gắn với địa danh (Sự kiện diễn ra, Nhân vật, Hiện vật)',
    // Ẩn tab PERIOD vì người dùng đã chọn Thời kỳ tại Mục 1
    allowedTabs: [
      KnowledgeRelationType.ALL,
      KnowledgeRelationType.EVENT,
      KnowledgeRelationType.PERSON,
      KnowledgeRelationType.LOCATION,
      KnowledgeRelationType.FORCE,
      KnowledgeRelationType.ARTIFACT,
    ],
    targetEntityName: 'địa danh',
  };

  readonly contentSkeletons: ContentSkeleton[] = [
    {
      label: '+ Chèn sườn bài Địa danh / Di tích',
      html: [
        '<h2>1. Lịch sử hình thành & Niên đại khởi dựng</h2><p></p>',
        '<h2>2. Kiến trúc cảnh quan & Quy mô xây dựng</h2><p></p>',
        '<h2>3. Các sự kiện & Nhân vật lịch sử gắn liền</h2><p></p>',
        '<h2>4. Giá trị văn hóa & Công tác bảo tồn hiện nay</h2><p></p>',
      ].join(''),
    },
  ];
}

/**
 * Strategy dành cho Triều đại / Quốc gia (DYNASTY)
 */
export class DynastyEntityStrategy implements EntityTypeStrategy {
  readonly type = EntityType.DYNASTY;
  readonly label = 'Triều đại / Quốc gia / Chính thể';
  readonly targetName = 'triều đại';

  getSectionConfig(stepIndex: number) {
    switch (stepIndex) {
      case 1:
        return {
          title: 'Thông tin chung',
          subtitle: 'Tên quốc hiệu, niên đại trị vì, quốc đô và người sáng lập.',
        };
      case 2:
        return {
          title: 'Nội dung & Lịch sử triều đại',
          subtitle: 'Soạn thảo quá trình hưng thịnh, suy vong, thành tựu văn hóa và kinh tế.',
        };
      case 3:
        return {
          title: 'Quan hệ & Bối cảnh',
          subtitle: 'Liên kết với vua chúa, danh tướng, các cuộc chiến tranh và địa danh kinh đô.',
        };
      case 4:
        return {
          title: 'Kiểm tra & Xuất bản',
          subtitle: 'Xem lại tiến độ hoàn thiện và xuất bản triều đại lên cây lịch sử.',
        };
      default:
        return { title: '', subtitle: '' };
    }
  }

  readonly fields = {
    nameLabel: 'Tên triều đại / Quốc gia / Chính thể',
    namePlaceholder: 'Ví dụ: Nhà Trần, Nhà Hậu Lê, Nước Đại Cồ Việt...',
    taglineLabel: 'Đặc trưng nhận diện triều đại (1 dòng)',
    taglinePlaceholder: 'Ví dụ: Triều đại hiển hách với ba lần đánh tan quân xâm lược Mông - Nguyên...',
    taglineHint: 'Mô tả tóm tắt xuất hiện trên trục thời gian các triều đại',
    aliasLabel: 'Quốc hiệu / Tên khác / Tên chính thể',
    aliasPlaceholder: 'Nhập quốc hiệu (VD: Đại Việt, Vạn Xuân...) rồi nhấn Thêm',
    avatarTitle: 'Ảnh biểu tượng / Bản đồ lãnh thổ triều đại',
    avatarCaptionPlaceholder: 'Ví dụ: Bản đồ cương thổ Đại Việt thời vua Lê Thánh Tông...',
    chronologyHeader: 'Niên đại trị vì & Tồn tại',
    chronologyHint: 'Khoảng thời gian nắm quyền của triều đại',
    startYearLabel: 'Năm khởi lập',
    endYearLabel: 'Năm kết thúc',
    startDateLabel: 'Thời điểm khởi lập (dạng chữ)',
    endDateLabel: 'Thời điểm kết thúc (dạng chữ)',
    startYearPlaceholder: '1225',
    endYearPlaceholder: '1400',
    startDatePlaceholder: 'Tháng 12 năm Ất Dậu (1225)...',
    endDatePlaceholder: 'Năm Canh Thìn (1400)...',
  };

  readonly relationsConfig = {
    sectionTitle: 'Mạng lưới liên kết triều đại (Nhân vật trị vì, Sự kiện lớn, Kinh đô)',
    allowedTabs: [
      KnowledgeRelationType.ALL,
      KnowledgeRelationType.EVENT,
      KnowledgeRelationType.PERSON,
      KnowledgeRelationType.LOCATION,
      KnowledgeRelationType.FORCE,
      KnowledgeRelationType.ARTIFACT,
    ],
    targetEntityName: 'triều đại',
  };

  readonly contentSkeletons: ContentSkeleton[] = [
    {
      label: '+ Chèn sườn bài Triều đại',
      html: [
        '<h2>1. Bối cảnh khởi lập & Người sáng lập</h2><p></p>',
        '<h2>2. Tổ chức bộ máy chính quyền & Pháp luật</h2><p></p>',
        '<h2>3. Kinh tế, Văn hóa - Xã hội & Quân sự</h2><p></p>',
        '<h2>4. Diễn biến suy vong & Vị trí trong lịch sử</h2><p></p>',
      ].join(''),
    },
  ];
}

/**
 * Strategy dành cho Hiện vật / Bảo vật quốc gia (ARTIFACT)
 */
export class ArtifactEntityStrategy implements EntityTypeStrategy {
  readonly type = EntityType.ARTIFACT;
  readonly label = 'Hiện vật / Bảo vật quốc gia';
  readonly targetName = 'hiện vật';

  getSectionConfig(stepIndex: number) {
    switch (stepIndex) {
      case 1:
        return {
          title: 'Thông tin chung',
          subtitle: 'Tên hiện vật, thời kỳ chế tác, xuất xứ khai quật và ảnh tư liệu.',
        };
      case 2:
        return {
          title: 'Nội dung & Giá trị di sản',
          subtitle: 'Soạn thảo nguồn gốc khảo cổ, hoa văn mỹ thuật và ý nghĩa lịch sử của hiện vật.',
        };
      case 3:
        return {
          title: 'Quan hệ & Bối cảnh',
          subtitle: 'Liên kết hiện vật với Nơi lưu giữ, Thời kỳ văn hóa và Nhân vật sở hữu.',
        };
      case 4:
        return {
          title: 'Kiểm tra & Xuất bản',
          subtitle: 'Kiểm tra độ đầy đủ thông tin hiện vật trước khi công bố bảo tàng số.',
        };
      default:
        return { title: '', subtitle: '' };
    }
  }

  readonly fields = {
    nameLabel: 'Tên hiện vật / Bảo vật quốc gia',
    namePlaceholder: 'Ví dụ: Trống đồng Ngọc Lũ, Tượng Phật A Di Đà chùa Phật Tích...',
    taglineLabel: 'Đặc điểm nhận diện hiện vật (1 dòng)',
    taglinePlaceholder: 'Ví dụ: Đỉnh cao nghệ thuật đúc đồng Đông Sơn, bảo vật quốc gia đợt 1...',
    taglineHint: 'Mô tả ngắn hiển thị bên dưới tên hiện vật',
    aliasLabel: 'Tên gọi khác / Định danh khảo cổ',
    aliasPlaceholder: 'Nhập tên gọi khác rồi nhấn Thêm',
    avatarTitle: 'Ảnh chụp hiện vật / Bản vẽ hoa văn',
    avatarCaptionPlaceholder: 'Ví dụ: Chi tiết mặt trống đồng với hoa văn ngôi sao 14 cánh...',
    chronologyHeader: 'Niên đại chế tác & Khảo cổ',
    chronologyHint: 'Thời điểm chế tác hoặc thời kỳ văn hóa phát hiện',
    startYearLabel: 'Niên đại chế tác',
    endYearLabel: 'Thời điểm khai quật / Phát hiện',
    startDateLabel: 'Niên đại chế tác (dạng chữ)',
    endDateLabel: 'Thời điểm phát hiện (dạng chữ)',
    startYearPlaceholder: '-500',
    endYearPlaceholder: '1893',
    startDatePlaceholder: 'Khoảng thế kỷ III - II TCN...',
    endDatePlaceholder: 'Phát hiện năm 1893 tại Hà Nam...',
  };

  readonly relationsConfig = {
    sectionTitle: 'Mạng lưới liên kết hiện vật (Nơi lưu giữ, Triều đại, Nhân vật)',
    allowedTabs: [
      KnowledgeRelationType.ALL,
      KnowledgeRelationType.EVENT,
      KnowledgeRelationType.PERSON,
      KnowledgeRelationType.LOCATION,
      KnowledgeRelationType.FORCE,
    ],
    targetEntityName: 'hiện vật',
  };

  readonly contentSkeletons: ContentSkeleton[] = [
    {
      label: '+ Chèn sườn bài Hiện vật / Bảo vật',
      html: [
        '<h2>1. Nguồn gốc xuất xứ & Hoàn cảnh phát hiện</h2><p></p>',
        '<h2>2. Đặc điểm hình dáng, Chất liệu & Kỹ thuật chế tác</h2><p></p>',
        '<h2>3. Ý nghĩa hoa văn biểu tượng & Giá trị lịch sử</h2><p></p>',
        '<h2>4. Hiện trạng lưu giữ & Công tác bảo tồn</h2><p></p>',
      ].join(''),
    },
  ];
}

/**
 * Strategy mặc định cho các loại thực thể khác (Tổ chức, Lực lượng quân sự, Khác)
 */
export class DefaultEntityStrategy implements EntityTypeStrategy {
  constructor(
    public readonly type: EntityType = EntityType.OTHER,
    public readonly label: string = 'Thực thể lịch sử',
    public readonly targetName: string = 'thực thể',
  ) {}

  getSectionConfig(stepIndex: number) {
    switch (stepIndex) {
      case 1:
        return {
          title: 'Thông tin chung',
          subtitle: 'Tên gọi, phân loại, mô tả nhận diện ngắn và niên đại hoạt động.',
        };
      case 2:
        return {
          title: 'Nội dung & Lịch sử hoạt động',
          subtitle: 'Soạn thảo nội dung lịch sử chi tiết bằng hệ thống khối đa phương tiện.',
        };
      case 3:
        return {
          title: 'Quan hệ & Bối cảnh',
          subtitle: 'Mạng lưới liên kết tri thức với các sự kiện, nhân vật và địa danh liên quan.',
        };
      case 4:
        return {
          title: 'Kiểm tra & Xuất bản',
          subtitle: 'Kiểm tra mức độ hoàn thiện dữ liệu và thiết lập trạng thái xuất bản.',
        };
      default:
        return { title: '', subtitle: '' };
    }
  }

  readonly fields = {
    nameLabel: 'Tên thực thể lịch sử',
    namePlaceholder: 'Ví dụ: Hội Việt Nam Cách mạng Thanh niên, Đội Việt Nam Tuyên truyền Giải phóng quân...',
    taglineLabel: 'Mô tả nhận diện ngắn (1 dòng)',
    taglinePlaceholder: 'Ví dụ: Tổ chức tiền thân của Đảng Cộng sản Việt Nam...',
    taglineHint: 'Hiển thị dưới tên ở danh sách, thẻ preview hoặc tooltip',
    aliasLabel: 'Tên gọi khác / Tên viết tắt',
    aliasPlaceholder: 'Nhập tên khác rồi nhấn Thêm',
    avatarTitle: 'Ảnh đại diện / Tư liệu',
    avatarCaptionPlaceholder: 'Ví dụ: Ảnh tư liệu lễ thành lập...',
    chronologyHeader: 'Niên đại & Thời điểm hoạt động',
    chronologyHint: 'Thời gian thành lập, giải thể hoặc giai đoạn hoạt động',
    startYearLabel: 'Năm thành lập / Bắt đầu',
    endYearLabel: 'Năm giải thể / Kết thúc',
    startDateLabel: 'Thời điểm bắt đầu (dạng chữ)',
    endDateLabel: 'Thời điểm kết thúc (dạng chữ)',
    startYearPlaceholder: '1944',
    endYearPlaceholder: '',
    startDatePlaceholder: 'Ngày 22/12/1944...',
    endDatePlaceholder: 'Còn hoạt động đến nay...',
  };

  readonly relationsConfig = {
    sectionTitle: 'Mạng lưới liên kết tri thức',
    allowedTabs: [
      KnowledgeRelationType.ALL,
      KnowledgeRelationType.EVENT,
      KnowledgeRelationType.PERSON,
      KnowledgeRelationType.LOCATION,
      KnowledgeRelationType.FORCE,
      KnowledgeRelationType.ARTIFACT,
    ],
    targetEntityName: 'thực thể',
  };

  readonly contentSkeletons: ContentSkeleton[] = [
    {
      label: '+ Chèn sườn bài Hoạt động',
      html: [
        '<h2>1. Bối cảnh ra đời & Mục tiêu</h2><p></p>',
        '<h2>2. Quá trình phát triển & Các chiến công / Sự kiện</h2><p></p>',
        '<h2>3. Ý nghĩa lịch sử & Tác động</h2><p></p>',
      ].join(''),
    },
  ];
}

/**
 * Registry quản lý các Entity Strategy (Pattern: Registry + Strategy + Factory)
 * Tuân thủ Open/Closed Principle (OCP):
 * Khi có loại thực thể mới, chỉ cần tạo Strategy class và đăng ký vào Registry.
 */
export class EntityStrategyRegistry {
  private static readonly strategies = new Map<EntityType, EntityTypeStrategy>();
  private static readonly defaultStrategy = new DefaultEntityStrategy();

  static {
    // Khởi tạo các strategy mặc định
    this.register(new PersonEntityStrategy());
    this.register(new LocationEntityStrategy());
    this.register(new DynastyEntityStrategy());
    this.register(new ArtifactEntityStrategy());
    this.register(
      new DefaultEntityStrategy(
        EntityType.ORGANIZATION,
        'Tổ chức / Đảng phái',
        'tổ chức',
      ),
    );
    this.register(
      new DefaultEntityStrategy(
        EntityType.MILITARY_FORCE,
        'Lực lượng quân sự / Binh đoàn',
        'lực lượng quân sự',
      ),
    );
  }

  static register(strategy: EntityTypeStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  static get(type: EntityType): EntityTypeStrategy {
    return this.strategies.get(type) ?? this.defaultStrategy;
  }
}
