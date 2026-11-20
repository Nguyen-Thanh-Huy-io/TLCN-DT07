/** Loại nội dung có phiên bản hóa. */
export const REVISION_CONTENT_TYPES = {
  LESSON: 'LESSON',
  ARTICLE: 'ARTICLE',
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
  article: REVISION_CONTENT_TYPES.ARTICLE,
  topic: REVISION_CONTENT_TYPES.TOPIC,
  learningPath: REVISION_CONTENT_TYPES.LEARNING_PATH,
  chapter: REVISION_CONTENT_TYPES.CHAPTER,
};

/** Bảng mà id trong trường tham chiếu trỏ tới — dùng tra tên khi hiển thị so sánh. */
export type RevisionRef = 'topic' | 'category' | 'tag';

/**
 * Cách hiển thị một trường khi so sánh:
 *  text / longtext / bool / image: giá trị đơn · list: danh sách chữ · ref / refs: id → tên ·
 *  blocks: khối nội dung (bài học / bài viết) · object: hồ sơ mở rộng (so theo từng khoá).
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
    | 'object';
  ref?: RevisionRef;
}

const ORDER: RevisionField = {
  key: 'displayOrder',
  label: 'Thứ tự hiển thị',
  kind: 'text',
};

/**
 * Các trường biên tập được của từng loại — payload bản sửa / ảnh chụp chỉ gồm các trường này
 * (trạng thái xuất bản, slug không nằm trong bản sửa).
 */
export const REVISION_FIELDS: Record<RevisionContentType, RevisionField[]> = {
  LESSON: [
    { key: 'title', label: 'Tiêu đề', kind: 'text' },
    { key: 'description', label: 'Mô tả ngắn', kind: 'longtext' },
    { key: 'topicId', label: 'Chủ đề', kind: 'ref', ref: 'topic' },
    { key: 'content', label: 'Nội dung bài học', kind: 'blocks' },
    { key: 'difficulty', label: 'Độ khó', kind: 'text' },
    { key: 'thumbnailUrl', label: 'Ảnh đại diện', kind: 'image' },
    { key: 'sourceReferenceNote', label: 'Ghi chú nguồn', kind: 'longtext' },
    ORDER,
  ],
  ARTICLE: [
    { key: 'title', label: 'Tiêu đề', kind: 'text' },
    { key: 'categoryId', label: 'Chuyên mục', kind: 'ref', ref: 'category' },
    { key: 'topicId', label: 'Chủ đề', kind: 'ref', ref: 'topic' },
    { key: 'tagIds', label: 'Tag', kind: 'refs', ref: 'tag' },
    { key: 'summary', label: 'Tóm tắt', kind: 'longtext' },
    { key: 'contentBlocks', label: 'Nội dung', kind: 'blocks' },
    { key: 'coverImageUrl', label: 'Ảnh bìa', kind: 'image' },
    { key: 'coverCaption', label: 'Chú thích ảnh bìa', kind: 'text' },
    { key: 'dateText', label: 'Nhãn niên đại', kind: 'text' },
    { key: 'startYear', label: 'Năm bắt đầu', kind: 'text' },
    { key: 'endYear', label: 'Năm kết thúc', kind: 'text' },
    { key: 'datePrecision', label: 'Độ chính xác niên đại', kind: 'text' },
    { key: 'metadata', label: 'Hồ sơ mở rộng', kind: 'object' },
    { key: 'links', label: 'Liên kết bài viết', kind: 'object' },
    { key: 'isFeatured', label: 'Nổi bật', kind: 'bool' },
    ORDER,
  ],
  TOPIC: [
    { key: 'name', label: 'Tên chủ đề', kind: 'text' },
    { key: 'eyebrow', label: 'Dòng nhỏ phía trên', kind: 'text' },
    { key: 'description', label: 'Mô tả', kind: 'longtext' },
    { key: 'parentId', label: 'Chủ đề cha', kind: 'ref', ref: 'topic' },
    { key: 'icon', label: 'Biểu tượng', kind: 'text' },
    { key: 'coverImageUrl', label: 'Ảnh bìa', kind: 'image' },
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
  UNKNOWN_TYPE: (type: string) =>
    `Loại nội dung "${type}" chưa có phiên bản hóa.`,
  NOT_PENDING: 'Bản sửa này không còn ở trạng thái chờ duyệt.',
  NOT_SNAPSHOT: 'Chỉ khôi phục được từ một phiên bản trong lịch sử.',
  CANNOT_REVIEW_OWN: 'Bạn không thể tự duyệt bản sửa do chính mình đề xuất.',
  REJECT_NOTE_REQUIRED: 'Cần ghi lý do khi từ chối bản sửa.',
  PROPOSED:
    'Nội dung đang xuất bản nên thay đổi được lưu thành bản sửa chờ người duyệt chấp thuận.',
} as const;
