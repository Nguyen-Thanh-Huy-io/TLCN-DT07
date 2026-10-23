/** Loại nội dung có phiên bản hóa. */
export const REVISION_CONTENT_TYPES = {
  LESSON: 'LESSON',
  EVENT: 'EVENT',
  ENTITY: 'ENTITY',
  PERIOD: 'PERIOD',
  TOPIC: 'TOPIC',
  LEARNING_PATH: 'LEARNING_PATH',
  CHAPTER: 'CHAPTER',
} as const;

export type RevisionContentType =
  (typeof REVISION_CONTENT_TYPES)[keyof typeof REVISION_CONTENT_TYPES];

export const REVISION_KIND = {
  PROPOSAL: 'PROPOSAL',
  SNAPSHOT: 'SNAPSHOT',
} as const;

export const REVISION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const;

/** Model trong ContentWriteGuard → loại nội dung có phiên bản hóa. */
export const VERSIONED_MODELS: Record<string, RevisionContentType> = {
  lesson: REVISION_CONTENT_TYPES.LESSON,
  historicalEvent: REVISION_CONTENT_TYPES.EVENT,
  historicalEntity: REVISION_CONTENT_TYPES.ENTITY,
  period: REVISION_CONTENT_TYPES.PERIOD,
  topic: REVISION_CONTENT_TYPES.TOPIC,
  learningPath: REVISION_CONTENT_TYPES.LEARNING_PATH,
  chapter: REVISION_CONTENT_TYPES.CHAPTER,
};

/** Bảng mà id trong trường tham chiếu trỏ tới — dùng tra tên khi hiển thị so sánh. */
export type RevisionRef = 'period' | 'topic' | 'entity' | 'event' | 'term' | 'entityType';

/**
 * Cách hiển thị một trường khi so sánh:
 *  text / longtext / bool / image: giá trị đơn · list: danh sách chữ · ref / refs: id → tên ·
 *  blocks: khối nội dung bài học · relations: thực thể liên quan + vai trò · media: tư liệu đính kèm ·
 *  object: metadata (so theo từng khóa).
 */
export interface RevisionField {
  key: string;
  label: string;
  kind:
    | 'text'
    | 'longtext'
    | 'bool'
    | 'image'
    | 'list'
    | 'ref'
    | 'refs'
    | 'blocks'
    | 'relations'
    | 'media'
    | 'object';
  ref?: RevisionRef;
}

const ORDER: RevisionField = { key: 'displayOrder', label: 'Thứ tự hiển thị', kind: 'text' };

/**
 * Các trường biên tập được của từng loại — payload bản sửa / ảnh chụp chỉ gồm các trường này
 * (trạng thái xuất bản, slug không nằm trong bản sửa).
 */
export const REVISION_FIELDS: Record<RevisionContentType, RevisionField[]> = {
  LESSON: [
    { key: 'title', label: 'Tiêu đề', kind: 'text' },
    { key: 'description', label: 'Mô tả ngắn', kind: 'longtext' },
    { key: 'content', label: 'Nội dung bài học', kind: 'blocks' },
    { key: 'difficulty', label: 'Độ khó', kind: 'text' },
    { key: 'thumbnailUrl', label: 'Ảnh đại diện', kind: 'image' },
    { key: 'sourceReferenceNote', label: 'Ghi chú nguồn', kind: 'longtext' },
    ORDER,
  ],
  EVENT: [
    { key: 'title', label: 'Tên sự kiện', kind: 'text' },
    { key: 'categoryIds', label: 'Loại sự kiện', kind: 'refs', ref: 'term' },
    { key: 'startYear', label: 'Năm bắt đầu', kind: 'text' },
    { key: 'startMonth', label: 'Tháng bắt đầu', kind: 'text' },
    { key: 'startDay', label: 'Ngày bắt đầu', kind: 'text' },
    { key: 'endYear', label: 'Năm kết thúc', kind: 'text' },
    { key: 'endMonth', label: 'Tháng kết thúc', kind: 'text' },
    { key: 'endDay', label: 'Ngày kết thúc', kind: 'text' },
    { key: 'eventDateNote', label: 'Ghi chú niên đại', kind: 'text' },
    { key: 'summary', label: 'Tóm tắt', kind: 'longtext' },
    { key: 'description', label: 'Diễn biến', kind: 'longtext' },
    { key: 'thumbnailUrl', label: 'Ảnh đại diện', kind: 'image' },
    { key: 'periodId', label: 'Giai đoạn', kind: 'ref', ref: 'period' },
    { key: 'topicId', label: 'Chủ đề', kind: 'ref', ref: 'topic' },
    { key: 'locationId', label: 'Địa điểm chính', kind: 'ref', ref: 'entity' },
    { key: 'parentId', label: 'Sự kiện cha', kind: 'ref', ref: 'event' },
    { key: 'entityRelations', label: 'Nhân vật, địa danh liên quan & vai trò', kind: 'relations' },
    { key: 'media', label: 'Tư liệu đính kèm', kind: 'media' },
    { key: 'metadata', label: 'Thông tin riêng theo loại', kind: 'object' },
    ORDER,
  ],
  ENTITY: [
    { key: 'name', label: 'Tên', kind: 'text' },
    { key: 'type', label: 'Loại thực thể', kind: 'ref', ref: 'entityType' },
    { key: 'tagline', label: 'Mô tả ngắn', kind: 'text' },
    { key: 'description', label: 'Giới thiệu', kind: 'longtext' },
    { key: 'aliases', label: 'Tên gọi khác', kind: 'list' },
    { key: 'imageUrl', label: 'Ảnh', kind: 'image' },
    { key: 'imageCaption', label: 'Chú thích ảnh', kind: 'text' },
    { key: 'startYear', label: 'Năm bắt đầu tồn tại', kind: 'text' },
    { key: 'endYear', label: 'Năm kết thúc tồn tại', kind: 'text' },
    { key: 'periodIds', label: 'Giai đoạn', kind: 'refs', ref: 'period' },
    { key: 'birthYear', label: 'Năm sinh', kind: 'text' },
    { key: 'deathYear', label: 'Năm mất', kind: 'text' },
    { key: 'birthDateLabel', label: 'Ngày sinh (ghi chú)', kind: 'text' },
    { key: 'deathDateLabel', label: 'Ngày mất (ghi chú)', kind: 'text' },
    { key: 'occupation', label: 'Nghề nghiệp / chức vụ', kind: 'text' },
    { key: 'titles', label: 'Danh hiệu', kind: 'list' },
    { key: 'roles', label: 'Vai trò nhân vật', kind: 'refs', ref: 'term' },
    { key: 'biography', label: 'Tiểu sử', kind: 'longtext' },
    { key: 'siteType', label: 'Loại di tích', kind: 'ref', ref: 'term' },
    { key: 'address', label: 'Địa chỉ', kind: 'text' },
    { key: 'latitude', label: 'Vĩ độ', kind: 'text' },
    { key: 'longitude', label: 'Kinh độ', kind: 'text' },
    { key: 'constructionYear', label: 'Năm xây dựng', kind: 'text' },
    { key: 'constructionLabel', label: 'Niên đại xây dựng', kind: 'text' },
    { key: 'preservationStatus', label: 'Hiện trạng', kind: 'ref', ref: 'term' },
    { key: 'statusNote', label: 'Ghi chú hiện trạng', kind: 'text' },
    { key: 'recognitionLevel', label: 'Cấp xếp hạng', kind: 'ref', ref: 'term' },
    { key: 'managingAgency', label: 'Cơ quan quản lý', kind: 'text' },
    { key: 'metadata', label: 'Hồ sơ mở rộng', kind: 'object' },
    { key: 'isFeatured', label: 'Nổi bật', kind: 'bool' },
    ORDER,
  ],
  PERIOD: [
    { key: 'name', label: 'Tên giai đoạn', kind: 'text' },
    { key: 'parentId', label: 'Thuộc thời kỳ', kind: 'ref', ref: 'period' },
    { key: 'startYear', label: 'Năm bắt đầu', kind: 'text' },
    { key: 'endYear', label: 'Năm kết thúc', kind: 'text' },
    { key: 'timeLabel', label: 'Nhãn niên đại', kind: 'text' },
    { key: 'datePrecision', label: 'Độ chính xác niên đại', kind: 'text' },
    { key: 'region', label: 'Quốc gia / khu vực', kind: 'text' },
    { key: 'description', label: 'Mô tả', kind: 'longtext' },
    { key: 'coverImageUrl', label: 'Ảnh bìa', kind: 'image' },
    ORDER,
  ],
  TOPIC: [
    { key: 'name', label: 'Tên chủ đề', kind: 'text' },
    { key: 'eyebrow', label: 'Dòng nhỏ phía trên', kind: 'text' },
    { key: 'description', label: 'Mô tả', kind: 'longtext' },
    { key: 'periodId', label: 'Giai đoạn', kind: 'ref', ref: 'period' },
    { key: 'parentId', label: 'Chủ đề cha', kind: 'ref', ref: 'topic' },
    { key: 'icon', label: 'Biểu tượng', kind: 'text' },
    { key: 'coverImageUrl', label: 'Ảnh bìa', kind: 'image' },
    { key: 'pathType', label: 'Kiểu lộ trình', kind: 'text' },
    { key: 'isSequential', label: 'Học tuần tự', kind: 'bool' },
    { key: 'isFeatured', label: 'Nổi bật', kind: 'bool' },
    ORDER,
  ],
  LEARNING_PATH: [
    { key: 'title', label: 'Tên lộ trình', kind: 'text' },
    { key: 'description', label: 'Mô tả', kind: 'longtext' },
    { key: 'coverImageUrl', label: 'Ảnh bìa', kind: 'image' },
    { key: 'pathType', label: 'Kiểu lộ trình', kind: 'text' },
    { key: 'isSequential', label: 'Học tuần tự', kind: 'bool' },
    ORDER,
  ],
  CHAPTER: [
    { key: 'title', label: 'Tên chương', kind: 'text' },
    { key: 'description', label: 'Mô tả', kind: 'longtext' },
    ORDER,
  ],
};

/** Nhãn loại thực thể (enum HistoricalEntityType) cho phần so sánh. */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  PERSON: 'Nhân vật',
  ORGANIZATION: 'Tổ chức',
  DYNASTY: 'Triều đại / Quốc gia / Chính thể',
  MILITARY_FORCE: 'Lực lượng quân sự',
  ARTIFACT: 'Hiện vật',
  LOCATION: 'Địa danh / di tích',
  OTHER: 'Khác',
};

export const REVISION_ROUTES = {
  BASE: 'content-revisions',
  PENDING: 'content-revisions/pending',
  CONTENT: 'content-revisions/content/:type/:id',
  OPEN_DRAFT: 'content-revisions/content/:type/:id/draft',
  ONE: 'content-revisions/:revisionId',
  APPROVE: 'content-revisions/:revisionId/approve',
  REJECT: 'content-revisions/:revisionId/reject',
  RESTORE: 'content-revisions/:revisionId/restore',
} as const;

export const REVISION_MESSAGES = {
  NOT_FOUND: 'Không tìm thấy phiên bản.',
  UNKNOWN_TYPE: (type: string) => `Loại nội dung "${type}" chưa có phiên bản hóa.`,
  NOT_PENDING: 'Bản sửa này không còn ở trạng thái chờ duyệt.',
  NOT_SNAPSHOT: 'Chỉ khôi phục được từ một phiên bản trong lịch sử.',
  CANNOT_REVIEW_OWN: 'Bạn không thể tự duyệt bản sửa do chính mình đề xuất.',
  REJECT_NOTE_REQUIRED: 'Cần ghi lý do khi từ chối bản sửa.',
  PROPOSED:
    'Nội dung đang xuất bản nên thay đổi được lưu thành bản sửa chờ người duyệt chấp thuận.',
} as const;
