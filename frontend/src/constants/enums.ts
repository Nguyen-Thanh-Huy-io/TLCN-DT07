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

export enum LearningPathType {
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  THEMATIC = 'THEMATIC',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
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
 * Loại hạng mục công trình / hiện vật bên trong di tích
 */
export enum SubStructureType {
  ARCHITECTURE = 'ARCHITECTURE',
  NATIONAL_TREASURE = 'NATIONAL_TREASURE',
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
 * Loại thông báo hệ thống và tương tác xã hội (Đồng bộ Prisma NotificationType)
 */
export enum NotificationType {
  NEW_QUESTION = 'NEW_QUESTION',
  NEW_REPLY = 'NEW_REPLY',
  OFFICIAL_REPLY = 'OFFICIAL_REPLY',
  BLOG_COMMENT = 'BLOG_COMMENT',
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  CONTENT_REJECTED = 'CONTENT_REJECTED',
  POST_LIKED = 'POST_LIKED',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  CONTENT_VIOLATION = 'CONTENT_VIOLATION',
}

/**
 * Tab lọc danh sách thông báo
 */
export enum NotificationFilterTab {
  ALL = 'ALL',
  UNREAD = 'UNREAD',
}

/**
 * Biến thể hiển thị chuông thông báo
 */
export enum NotificationBellVariant {
  HEADER = 'header',
  TOPBAR = 'topbar',
}

/**
 * Loại đối tượng / bài viết thực thể lịch sử (Đồng bộ ArticleKind)
 */
export enum ArticleKindEnum {
  PERSON = 'PERSON',
  EVENT = 'EVENT',
  LOCATION = 'LOCATION',
  DYNASTY = 'DYNASTY',
  OTHER = 'OTHER',
}

/**
 * Phân hệ Kiểm duyệt nội dung (Moderation)
 */
export enum ModerationActionTakenEnum {
  NONE = 'NONE',
  AUTO_HIDDEN = 'AUTO_HIDDEN',
  CONFIRMED_REMOVED = 'CONFIRMED_REMOVED',
  DISMISSED = 'DISMISSED',
}

export enum ModerationResolveActionEnum {
  CONFIRM_REMOVE = 'CONFIRM_REMOVE',
  RESTORE = 'RESTORE',
  BAN_USER = 'BAN_USER',
}

export enum ModerationSourceEnum {
  AI_SCAN = 'AI_SCAN',
  USER_REPORT = 'USER_REPORT',
}

export enum ModerationTargetTypeEnum {
  POST = 'POST',
  COMMENT = 'COMMENT',
}

/** Loại tệp trong thư viện media CMS — chữ thường vì đã lưu sẵn trong localStorage của MediaManagerView. */
export enum MediaItemType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

/**
 * Icon Name Enum
 */
export enum IconName {
  GRID = 'grid',
  CLOCK = 'clock',
  FOLDER = 'folder',
  BOOK = 'book',
  CALENDAR = 'calendar',
  TAG = 'tag',
  CHECK = 'check',
  USERS = 'users',
  SEARCH = 'search',
  BELL = 'bell',
  CHEVRON = 'chevron',
  CHEVRON_LEFT = 'chevron-left',
  MORE = 'more',
  PLUS = 'plus',
  ARROW = 'arrow',
  LOGOUT = 'logout',
  MENU = 'menu',
  EDIT = 'edit',
  EYE = 'eye',
  TRASH = 'trash',
  FILTER = 'filter',
  SPARK = 'spark',
  IMAGE = 'image',
  FILE = 'file',
  VIDEO = 'video',
  SETTINGS = 'settings',
  CHART = 'chart',
  HELP_CIRCLE = 'help-circle',
  MAP_PIN = 'map-pin',
  SHIELD = 'shield',
}

export type IconNameType = `${IconName}`;

/** Alias tương thích cho KeyboardKey */
export const KEYBOARD_KEYS = KeyboardKey;

/**
 * Blog Enums & Constants
 */
export enum BlogPostTypeEnum {
  LONG_FORM = 'LONG_FORM',
  QUICK_POST = 'QUICK_POST',
}

export enum StoryBlockTypeEnum {
  PARAGRAPH = 'paragraph',
  IMAGE = 'image',
}

export enum BlogStatusEnum {
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  REJECTED = 'REJECTED',
}

export const BLOG_URL_PLACEHOLDER = 'https://...';

/**
 * Quiz Enums & Constants
 */
export const ALL_FILTER_VALUE = 'all';

export enum QuizStatusEnum {
  ALL = 'all',
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
}

export enum QuestionDifficultyEnum {
  ALL = 'all',
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; tone: 'ok' | 'warn' | 'neutral' }
> = {
  EASY: { label: 'Dễ', tone: 'ok' },
  MEDIUM: { label: 'Trung bình', tone: 'warn' },
  HARD: { label: 'Khó', tone: 'neutral' },
};

export const QUIZ_STATUS_BADGE_MAP: Record<
  string,
  { label: string; tone: 'ok' | 'neutral' }
> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'ok' },
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
};

export const DEFAULT_QUIZ_TIME_LIMIT = 15;
export const DEFAULT_QUIZ_PASSING_SCORE = 80;

/**
 * Community Domain Enums and Constants
 */
export enum CommunityTabKey {
  ALL = 'all',
  FOLLOWING = 'following',
  TRENDING = 'trending',
  SHARED_BLOG = 'shared_blog',
  SAVED = 'saved',
}

export enum BlogPostType {
  LONG_FORM = 'LONG_FORM',
  QUICK_POST = 'QUICK_POST',
}

export enum ComposerMode {
  QUESTION = 'question',
  SHARE_BLOG = 'share_blog',
}

export enum CommunitySortMode {
  LATEST = 'latest',
  TRENDING = 'trending',
}

export const COMMUNITY_TAB_LABELS: Record<CommunityTabKey, string> = {
  [CommunityTabKey.ALL]: 'Tất cả thảo luận',
  [CommunityTabKey.FOLLOWING]: 'Đang theo dõi',
  [CommunityTabKey.TRENDING]: 'Sôi nổi',
  [CommunityTabKey.SHARED_BLOG]: 'Bài Blog chia sẻ',
  [CommunityTabKey.SAVED]: 'Đã lưu',
};
