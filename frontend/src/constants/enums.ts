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

export enum LocationType {
  BATTLEFIELD = 'BATTLEFIELD',
  MONUMENT = 'MONUMENT',
  ANCIENT_CAPITAL = 'ANCIENT_CAPITAL',
  CITADEL = 'CITADEL',
  TEMPLE = 'TEMPLE',
  OTHER = 'OTHER',
}

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

export enum EntityRelationType {
  LEADER_OF = 'LEADER_OF',
  MEMBER_OF = 'MEMBER_OF',
  FOUNDER_OF = 'FOUNDER_OF',
  SUCCESSOR_TO = 'SUCCESSOR_TO',
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

