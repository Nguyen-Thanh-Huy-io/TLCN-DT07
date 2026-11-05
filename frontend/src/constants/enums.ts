/**
 * Domain Enums
 * Synchronized with the business logic and Prisma Schema
 */

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum LessonStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPERADMIN = 'SUPERADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
  BLOCKED = 'BLOCKED',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',
  TRUE_FALSE = 'TRUE_FALSE',
}

export enum ScoringMode {
  STANDARD = 'STANDARD',
  WEIGHTED = 'WEIGHTED',
}

/** Loại di tích — đồng bộ với backend public-content/site-type.constant. */
export enum LocationType {
  ANCIENT_CAPITAL = 'ANCIENT_CAPITAL',
  CITADEL = 'CITADEL',
  PALACE = 'PALACE',
  BATTLEFIELD = 'BATTLEFIELD',
  RESISTANCE_BASE = 'RESISTANCE_BASE',
  TEMPLE = 'TEMPLE',
  ARCHAEOLOGICAL_SITE = 'ARCHAEOLOGICAL_SITE',
  MONUMENT = 'MONUMENT',
  OTHER = 'OTHER',
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  [LocationType.ANCIENT_CAPITAL]: 'Cố đô',
  [LocationType.CITADEL]: 'Thành lũy',
  [LocationType.PALACE]: 'Cung điện',
  [LocationType.BATTLEFIELD]: 'Chiến trường',
  [LocationType.RESISTANCE_BASE]: 'Căn cứ kháng chiến',
  [LocationType.TEMPLE]: 'Đền miếu',
  [LocationType.ARCHAEOLOGICAL_SITE]: 'Di chỉ khảo cổ',
  [LocationType.MONUMENT]: 'Di tích lịch sử',
  [LocationType.OTHER]: 'Khác',
};

export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  DYNASTY = 'DYNASTY',
  MILITARY_FORCE = 'MILITARY_FORCE',
  ARTIFACT = 'ARTIFACT',
  LOCATION = 'LOCATION',
  OTHER = 'OTHER',
}

export enum LearningPathType {
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  THEMATIC = 'THEMATIC',
  MYTHOLOGICAL = 'MYTHOLOGICAL',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

/** Mã loại sự kiện "thường gặp" — chỉ còn là gợi ý mặc định/nhãn dự phòng, KHÔNG còn giới
 * hạn giá trị hợp lệ (danh mục thật là EVENT_TYPE, có 15+ mã, xem /public/taxonomies). Dùng
 * làm hằng chuỗi (không phải enum) để không ràng buộc kiểu `category` về đúng 9 mã này. */
export const EVENT_CATEGORY_CODES = {
  BATTLE: 'BATTLE',
  WAR: 'WAR',
  TREATY: 'TREATY',
  REVOLUTION: 'REVOLUTION',
  POLITICAL_EVENT: 'POLITICAL_EVENT',
  SUMMIT_CONFERENCE: 'SUMMIT_CONFERENCE',
  CULTURE_SCIENCE: 'CULTURE_SCIENCE',
  NATURAL_DISASTER: 'NATURAL_DISASTER',
  OTHER: 'OTHER',
} as const;

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  BATTLE: 'Trận đánh',
  WAR: 'Chiến tranh',
  TREATY: 'Hiệp ước',
  REVOLUTION: 'Cách mạng',
  POLITICAL_EVENT: 'Biến cố chính trị',
  SUMMIT_CONFERENCE: 'Hội nghị',
  CULTURE_SCIENCE: 'Văn hóa và khoa học',
  NATURAL_DISASTER: 'Thiên tai dịch bệnh',
  OTHER: 'Khác',
};

/** Vai trò lịch sử của nhân vật — một người có thể có nhiều vai trò. */
export enum FigureRole {
  MONARCH = 'MONARCH',
  GENERAL = 'GENERAL',
  SCHOLAR = 'SCHOLAR',
  REVOLUTIONARY = 'REVOLUTIONARY',
  POLITICIAN = 'POLITICIAN',
}

export const FIGURE_ROLE_LABELS: Record<FigureRole, string> = {
  [FigureRole.MONARCH]: 'Quân chủ / Hoàng tộc',
  [FigureRole.GENERAL]: 'Tướng lĩnh / Chỉ huy quân sự',
  [FigureRole.SCHOLAR]: 'Học giả / Danh sĩ',
  [FigureRole.REVOLUTIONARY]: 'Lãnh tụ khởi nghĩa / Phong trào',
  [FigureRole.POLITICIAN]: 'Chính khách / Đại thần',
};

/**
 * Từ điển ánh xạ ngữ nghĩa chuẩn hóa (Canonical Role Dictionary)
 * Dành riêng cho nhân vật lịch sử (danh nhân), mang tính khái quát, học thuật, phi định kiến.
 */
export const CANONICAL_ROLE_LABELS: Record<string, string> = {
  // 1. Quân sự & Chiến lược
  GENERAL: 'Tướng lĩnh / Chỉ huy quân sự',
  COMMANDER: 'Tướng lĩnh / Chỉ huy quân sự',
  COMMANDER_IN_CHIEF: 'Tổng chỉ huy / Thống soái',
  STRATEGIST: 'Quân sư / Chiến lược gia',
  MILITARY_ADVISER: 'Quân sư / Cố vấn quân sự',
  WARRIOR: 'Võ tướng / Chiến binh',

  // 2. Thể chế & Quyền lực
  MONARCH: 'Quân chủ / Hoàng tộc',
  POLITICIAN: 'Chính khách / Đại thần',
  STATESMAN: 'Chính khách',
  DIPLOMAT: 'Nhà ngoại giao / Sứ thần',
  REFORMER: 'Nhà cải cách',

  // 3. Tư tưởng, Văn hóa & Giáo dục
  SCHOLAR: 'Học giả / Danh sĩ',
  CULTURAL_FIGURE: 'Danh nhân văn hóa / Tác gia',
  POET: 'Nhà thơ / Thi nhân',
  WRITER: 'Nhà văn / Tác gia',
  PHILOSOPHER: 'Nhà tư tưởng',
  SCIENTIST: 'Nhà khoa học',

  // 4. Tôn giáo & Tinh thần
  RELIGIOUS_FIGURE: 'Nhân vật tôn giáo / Thiền sư',

  // 5. Phong trào & Khởi nghĩa
  REVOLUTIONARY: 'Lãnh tụ khởi nghĩa / Phong trào',
  PATRIOT: 'Nhà yêu nước',
  HERO: 'Anh hùng dân tộc',
};

export enum EntityRelationType {
  LEADER_OF = 'LEADER_OF',
  MEMBER_OF = 'MEMBER_OF',
  FOUNDER_OF = 'FOUNDER_OF',
  SUCCESSOR_TO = 'SUCCESSOR_TO',
  SERVED_UNDER = 'SERVED_UNDER',
  CONTEMPORARY_OF = 'CONTEMPORARY_OF',
  CHILD_OF = 'CHILD_OF',
  PARENT_OF = 'PARENT_OF',
  SPOUSE_OF = 'SPOUSE_OF',
  SIBLING_OF = 'SIBLING_OF',
  ALLIED_WITH = 'ALLIED_WITH',
  OPPOSED_TO = 'OPPOSED_TO',
  VASSAL_OF = 'VASSAL_OF',
  AUTHOR_OF = 'AUTHOR_OF',
  HOUSED_AT = 'HOUSED_AT',
  COMMEMORATES = 'COMMEMORATES',
  LOCATED_IN = 'LOCATED_IN',
  CAPITAL_OF = 'CAPITAL_OF',
  OTHER = 'OTHER',
}

export const ENTITY_RELATION_TYPE_LABELS: Record<EntityRelationType, string> = {
  [EntityRelationType.LEADER_OF]: 'Lãnh đạo',
  [EntityRelationType.MEMBER_OF]: 'Thành viên',
  [EntityRelationType.FOUNDER_OF]: 'Sáng lập',
  [EntityRelationType.SUCCESSOR_TO]: 'Kế vị',
  [EntityRelationType.SERVED_UNDER]: 'Phụng sự',
  [EntityRelationType.CONTEMPORARY_OF]: 'Cùng thời với',
  [EntityRelationType.CHILD_OF]: 'Con cái của',
  [EntityRelationType.PARENT_OF]: 'Cha mẹ của',
  [EntityRelationType.SPOUSE_OF]: 'Vợ chồng với',
  [EntityRelationType.SIBLING_OF]: 'Anh chị em ruột',
  [EntityRelationType.ALLIED_WITH]: 'Đồng minh với',
  [EntityRelationType.OPPOSED_TO]: 'Đối địch với',
  [EntityRelationType.VASSAL_OF]: 'Thần phục',
  [EntityRelationType.AUTHOR_OF]: 'Tác giả của',
  [EntityRelationType.HOUSED_AT]: 'Lưu giữ tại',
  [EntityRelationType.COMMEMORATES]: 'Tưởng niệm',
  [EntityRelationType.LOCATED_IN]: 'Tọa lạc tại',
  [EntityRelationType.CAPITAL_OF]: 'Kinh đô của',
  [EntityRelationType.OTHER]: 'Quan hệ khác',
};

/** Nhãn cho mã vai trò của thực thể trong sự kiện (HistoricalEventEntity.role). */
export const EVENT_ENTITY_ROLE_LABELS: Record<string, string> = {
  COMMANDER: 'Chỉ huy',
  PARTICIPANT: 'Tham gia',
  BELLIGERENT: 'Bên tham chiến',
  SIGNATORY: 'Đại diện ký kết',
  LOCATION: 'Địa điểm diễn ra',
  LEADER: 'Lãnh đạo',
  INITIATOR: 'Khởi xướng',
  ARTIFACT_USED: 'Hiện vật liên quan',
};

export enum EventRelationType {
  CAUSES = 'CAUSES',
  PRECEDES = 'PRECEDES',
  FOLLOWS = 'FOLLOWS',
  INFLUENCES = 'INFLUENCES',
  PARALLEL_TO = 'PARALLEL_TO',
  OPPOSES = 'OPPOSES',
  DERIVED_FROM = 'DERIVED_FROM',
  ENDED_BY = 'ENDED_BY',
  OTHER = 'OTHER',
}

export const EVENT_RELATION_TYPE_LABELS: Record<EventRelationType, string> = {
  [EventRelationType.CAUSES]: 'Nguyên nhân dẫn tới',
  [EventRelationType.PRECEDES]: 'Tiền đề diễn ra trước',
  [EventRelationType.FOLLOWS]: 'Hệ quả diễn ra sau',
  [EventRelationType.INFLUENCES]: 'Tác động ảnh hưởng',
  [EventRelationType.PARALLEL_TO]: 'Diễn ra đồng thời',
  [EventRelationType.OPPOSES]: 'Đối kháng phản ứng lại',
  [EventRelationType.DERIVED_FROM]: 'Bắt nguồn từ',
  [EventRelationType.ENDED_BY]: 'Kết thúc bằng',
  [EventRelationType.OTHER]: 'Mối liên hệ khác',
};

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  HYPOTHESIS = 'HYPOTHESIS',
  DISPUTED = 'DISPUTED',
  DRAFT = 'DRAFT',
}

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VerificationStatus.VERIFIED]: 'Đã xác minh (Đồng thuận chính sử)',
  [VerificationStatus.HYPOTHESIS]: 'Giả thuyết lịch sử',
  [VerificationStatus.DISPUTED]: 'Còn tranh cãi học thuật',
  [VerificationStatus.DRAFT]: 'Bản nháp đang nghiên cứu',
};

/**
 * Chuẩn hóa khu vực lịch sử (Đồng bộ với Backend HistoricalRegion, không dùng Magic String)
 */
export enum HistoricalRegion {
  VIETNAM = 'Việt Nam',
  NATIONWIDE = 'Toàn quốc',
  WORLD = 'Thế giới',
  SOVIET_UNION = 'Liên Xô',
  ASIA = 'Châu Á',
  EUROPE_MEDITERRANEAN = 'Châu Âu & Địa Trung Hải',
  EUROPE_NORTH_AMERICA = 'Châu Âu & Bắc Mỹ',
  SOUTHEAST_ASIA = 'Đông Nam Á',
}

export const HISTORICAL_REGION_OPTIONS: string[] = [
  HistoricalRegion.VIETNAM,
  HistoricalRegion.WORLD,
  HistoricalRegion.SOVIET_UNION,
  HistoricalRegion.SOUTHEAST_ASIA,
  HistoricalRegion.ASIA,
  HistoricalRegion.EUROPE_MEDITERRANEAN,
  HistoricalRegion.EUROPE_NORTH_AMERICA,
];

/**
 * Hành động lưu/duyệt nội dung
 */
export enum ContentAction {
  DRAFT = 'DRAFT',
  PUBLISH = 'PUBLISH',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

/**
 * Phím bàn phím chuẩn cho keyboard navigation (thay thế Magic String e.key)
 */
export enum KeyboardKey {
  ENTER = 'Enter',
  ESCAPE = 'Escape',
  TAB = 'Tab',
  SPACE = ' ',
  ARROW_UP = 'ArrowUp',
  ARROW_DOWN = 'ArrowDown',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_RIGHT = 'ArrowRight',
  HOME = 'Home',
  END = 'End',
}

/**
 * Chế độ xem cây lộ trình học tập HISGO Studio
 */
export enum CurriculumViewMode {
  STUDIO = 'STUDIO',
  TOPIC_TREE = 'TOPIC_TREE',
}

/**
 * Tab làm việc trong HISGO Studio
 */
export enum StudioTab {
  CURRICULUM = 'CURRICULUM',
  LESSON_LIBRARY = 'LESSON_LIBRARY',
}

/**
 * Kiểu trường hiển thị trong bản ghi so sánh phiên bản (Revision Diff)
 */
export enum RevisionFieldKind {
  TEXT = 'text',
  LONGTEXT = 'longtext',
  BOOL = 'bool',
  IMAGE = 'image',
  LIST = 'list',
  REF = 'ref',
  REFS = 'refs',
  BLOCKS = 'blocks',
  RELATIONS = 'relations',
  MEDIA = 'media',
  OBJECT = 'object',
}

/**
 * Hướng di chuyển / sắp xếp thứ tự
 */
export enum SortDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

/**
 * Kiểu thông báo UI
 */
export enum NoticeTone {
  ERROR = 'error',
  SUCCESS = 'success',
  INFO = 'info',
  OK = 'ok',
}

export enum AuthProviderType {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
}

/**
 * Xếp hạng di tích lịch sử
 */
export enum HeritageRank {
  SPECIAL_NATIONAL = 'SPECIAL_NATIONAL',
  NATIONAL = 'NATIONAL',
  PROVINCIAL = 'PROVINCIAL',
  UNESCO = 'UNESCO',
  INTERNATIONAL = 'INTERNATIONAL',
  UNRANKED = 'UNRANKED',
  OTHER = 'OTHER',
}

/**
 * Loại hạng mục công trình / hiện vật bên trong di tích
 */
export enum SubStructureType {
  ARCHITECTURE = 'ARCHITECTURE',
  NATIONAL_TREASURE = 'NATIONAL_TREASURE',
}

/**
 * Mã nhóm phân loại Taxonomy
 */
export enum TaxonomyGroupCode {
  EVENT_TYPE = 'EVENT_TYPE',
  ROLE_TYPE = 'ROLE_TYPE',
  PREDICATE = 'PREDICATE',
}

/**
 * Kiểu trường dữ liệu linh hoạt của danh mục (Taxonomy Field Type)
 */
export enum CategoryFieldType {
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  LIST = 'list',
  TEXT = 'text',
}

/**
 * Khóa trường dữ liệu của bài học (Lesson Field Key)
 */
export enum LessonFieldKey {
  TITLE = 'title',
  SLUG = 'slug',
  DESCRIPTION = 'description',
  SHORT_DESCRIPTION = 'shortDescription',
  SUMMARY = 'summary',
  TOPIC_ID = 'topicId',
  DIFFICULTY = 'difficulty',
  THUMBNAIL_URL = 'thumbnailUrl',
}

/**
 * Mục accordion trong tab phân loại bài học
 */
export enum ClassificationSectionKey {
  TAGS = 'tags',
  DIFFICULTY = 'difficulty',
}

/**
 * Bộ lọc chung
 */
export enum CommonFilterOption {
  ALL = 'ALL',
}

/**
 * Bộ lọc sơ đồ cây chương trình học (Curriculum Tree Filter)
 */
export enum CurriculumTreeFilter {
  ALL = 'ALL',
  ROOT_ONLY = 'ROOT_ONLY',
  HAS_LESSONS = 'HAS_LESSONS',
  NO_QUIZ = 'NO_QUIZ',
}

/**
 * Trạng thái submission của biểu mẫu UI
 */
export enum FormStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Chế độ hiển thị modal quản trị / chỉnh sửa thực thể
 */
export enum ModalMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
}

/**
 * Chế độ hiển thị danh sách sự kiện
 */
export enum EventListViewMode {
  TREE = 'TREE',
  TREE_VIEW = 'TREE_VIEW',
  FLAT = 'FLAT',
}

/**
 * Độ chính xác thời gian lịch sử dùng chung (Đồng bộ với Prisma DatePrecision)
 */
export enum DatePrecision {
  DAY = 'DAY',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  DECADE = 'DECADE',
  CENTURY = 'CENTURY',
  APPROXIMATE = 'APPROXIMATE',
  RANGE = 'RANGE',
  UNKNOWN = 'UNKNOWN',
}

export const DATE_PRECISION_LABELS: Record<DatePrecision, string> = {
  [DatePrecision.DAY]: 'Ngày cụ thể (Ngày/Tháng/Năm)',
  [DatePrecision.MONTH]: 'Tháng & Năm',
  [DatePrecision.YEAR]: 'Năm cụ thể',
  [DatePrecision.DECADE]: 'Thập niên',
  [DatePrecision.CENTURY]: 'Thế kỷ',
  [DatePrecision.APPROXIMATE]: 'Ước lượng / Khoảng',
  [DatePrecision.RANGE]: 'Khoảng thời gian (Từ năm – Đến năm)',
  [DatePrecision.UNKNOWN]: 'Chưa xác định',
};




