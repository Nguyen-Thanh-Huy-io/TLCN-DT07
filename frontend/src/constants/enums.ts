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
  [LocationType.ANCIENT_CAPITAL]: 'Cố đô / Kinh thành',
  [LocationType.CITADEL]: 'Thành lũy',
  [LocationType.PALACE]: 'Cung điện / Dinh thự',
  [LocationType.BATTLEFIELD]: 'Chiến trường',
  [LocationType.RESISTANCE_BASE]: 'Căn cứ kháng chiến',
  [LocationType.TEMPLE]: 'Đền / Chùa',
  [LocationType.ARCHAEOLOGICAL_SITE]: 'Di chỉ khảo cổ',
  [LocationType.MONUMENT]: 'Di tích / Địa danh lịch sử',
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

export enum EventCategory {
  BATTLE = 'BATTLE',
  WAR = 'WAR',
  TREATY = 'TREATY',
  REVOLUTION = 'REVOLUTION',
  POLITICAL_EVENT = 'POLITICAL_EVENT',
  SUMMIT_CONFERENCE = 'SUMMIT_CONFERENCE',
  CULTURE_SCIENCE = 'CULTURE_SCIENCE',
  NATURAL_DISASTER = 'NATURAL_DISASTER',
  OTHER = 'OTHER',
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  [EventCategory.BATTLE]: 'Trận đánh / Chiến dịch',
  [EventCategory.WAR]: 'Chiến tranh / Xung đột',
  [EventCategory.TREATY]: 'Hiệp ước / Hòa ước',
  [EventCategory.REVOLUTION]: 'Cách mạng / Khởi nghĩa',
  [EventCategory.POLITICAL_EVENT]: 'Đảo chính / Biến cố chính trị',
  [EventCategory.SUMMIT_CONFERENCE]: 'Hội nghị / Thượng đỉnh',
  [EventCategory.CULTURE_SCIENCE]: 'Văn hóa / Khoa học',
  [EventCategory.NATURAL_DISASTER]: 'Thiên tai / Đại dịch',
  [EventCategory.OTHER]: 'Khác',
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
  [FigureRole.MONARCH]: 'Vua / Hoàng đế',
  [FigureRole.GENERAL]: 'Danh tướng',
  [FigureRole.SCHOLAR]: 'Danh nhân văn hóa',
  [FigureRole.REVOLUTIONARY]: 'Nhà cách mạng / Lãnh tụ khởi nghĩa',
  [FigureRole.POLITICIAN]: 'Chính trị gia / Quan lại',
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
  [EntityRelationType.LEADER_OF]: 'Lãnh đạo / Chỉ huy',
  [EntityRelationType.MEMBER_OF]: 'Thành viên / Trực thuộc',
  [EntityRelationType.FOUNDER_OF]: 'Sáng lập / Khởi lập',
  [EntityRelationType.SUCCESSOR_TO]: 'Kế vị / Tiếp nối',
  [EntityRelationType.SERVED_UNDER]: 'Phụng sự / Bề tôi của',
  [EntityRelationType.CONTEMPORARY_OF]: 'Cùng thời với',
  [EntityRelationType.CHILD_OF]: 'Con cái của',
  [EntityRelationType.PARENT_OF]: 'Cha mẹ của',
  [EntityRelationType.SPOUSE_OF]: 'Phối ngẫu / Vợ chồng',
  [EntityRelationType.SIBLING_OF]: 'Anh chị em ruột',
  [EntityRelationType.ALLIED_WITH]: 'Liên minh / Đồng minh',
  [EntityRelationType.OPPOSED_TO]: 'Đối địch / Kình địch',
  [EntityRelationType.VASSAL_OF]: 'Thần phục / Chư hầu',
  [EntityRelationType.AUTHOR_OF]: 'Tác giả / Khởi xướng',
  [EntityRelationType.HOUSED_AT]: 'Lưu giữ / Trưng bày tại',
  [EntityRelationType.COMMEMORATES]: 'Tưởng niệm / Vinh danh',
  [EntityRelationType.LOCATED_IN]: 'Đặt tại / Thuộc địa phận',
  [EntityRelationType.CAPITAL_OF]: 'Kinh đô / Thủ phủ của',
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
  [EventRelationType.CAUSES]: 'Nguyên nhân trực tiếp / Gây ra',
  [EventRelationType.PRECEDES]: 'Tiền đề / Diễn ra trước',
  [EventRelationType.FOLLOWS]: 'Tiếp nối / Hệ quả',
  [EventRelationType.INFLUENCES]: 'Tác động / Ảnh hưởng',
  [EventRelationType.PARALLEL_TO]: 'Diễn ra đồng thời / Song song',
  [EventRelationType.OPPOSES]: 'Đối kháng / Phản ứng lại',
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
 * Tab chi tiết di tích lịch sử
 */
export enum HeritageTab {
  OVERVIEW = 'overview',
  STRUCTURES = 'structures',
  TIMELINE = 'timeline',
  LINKS = 'links',
}

/**
 * Mã nhóm phân loại Taxonomy
 */
export enum TaxonomyGroupCode {
  EVENT_CATEGORY = 'EVENT_CATEGORY',
  EVENT_ROLE = 'EVENT_ROLE',
  EVENT_RELATION = 'EVENT_RELATION',
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



