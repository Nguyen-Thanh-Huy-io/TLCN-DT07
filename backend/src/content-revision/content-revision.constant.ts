/** Loại nội dung có phiên bản hóa (đợt đầu: bài học, sự kiện, thực thể). */
export const REVISION_CONTENT_TYPES = {
  LESSON: 'LESSON',
  EVENT: 'EVENT',
  ENTITY: 'ENTITY',
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
};

export interface RevisionField {
  key: string;
  label: string;
  /** Cách hiển thị khi so sánh: chữ, đoạn văn dài, danh sách, JSON (khối nội dung, metadata...). */
  kind: 'text' | 'longtext' | 'list' | 'json';
}

/**
 * Các trường biên tập được của từng loại — payload bản sửa / ảnh chụp chỉ gồm các trường này
 * (trạng thái xuất bản, slug không nằm trong bản sửa).
 */
export const REVISION_FIELDS: Record<RevisionContentType, RevisionField[]> = {
  LESSON: [
    { key: 'title', label: 'Tiêu đề', kind: 'text' },
    { key: 'description', label: 'Mô tả ngắn', kind: 'longtext' },
    { key: 'content', label: 'Nội dung bài học', kind: 'json' },
    { key: 'difficulty', label: 'Độ khó', kind: 'text' },
    { key: 'thumbnailUrl', label: 'Ảnh đại diện', kind: 'text' },
    { key: 'sourceReferenceNote', label: 'Ghi chú nguồn', kind: 'longtext' },
    { key: 'displayOrder', label: 'Thứ tự hiển thị', kind: 'text' },
  ],
  EVENT: [
    { key: 'title', label: 'Tên sự kiện', kind: 'text' },
    { key: 'categoryIds', label: 'Loại sự kiện', kind: 'list' },
    { key: 'startYear', label: 'Năm bắt đầu', kind: 'text' },
    { key: 'startMonth', label: 'Tháng bắt đầu', kind: 'text' },
    { key: 'startDay', label: 'Ngày bắt đầu', kind: 'text' },
    { key: 'endYear', label: 'Năm kết thúc', kind: 'text' },
    { key: 'endMonth', label: 'Tháng kết thúc', kind: 'text' },
    { key: 'endDay', label: 'Ngày kết thúc', kind: 'text' },
    { key: 'eventDateNote', label: 'Ghi chú niên đại', kind: 'text' },
    { key: 'summary', label: 'Tóm tắt', kind: 'longtext' },
    { key: 'description', label: 'Diễn biến', kind: 'longtext' },
    { key: 'thumbnailUrl', label: 'Ảnh đại diện', kind: 'text' },
    { key: 'periodId', label: 'Giai đoạn', kind: 'text' },
    { key: 'topicId', label: 'Chủ đề', kind: 'text' },
    { key: 'locationId', label: 'Địa điểm chính', kind: 'text' },
    { key: 'parentId', label: 'Sự kiện cha', kind: 'text' },
    { key: 'entityRelations', label: 'Thực thể liên quan & vai trò', kind: 'json' },
    { key: 'media', label: 'Tư liệu đính kèm', kind: 'json' },
    { key: 'metadata', label: 'Thông tin riêng theo loại', kind: 'json' },
    { key: 'displayOrder', label: 'Thứ tự hiển thị', kind: 'text' },
  ],
  ENTITY: [
    { key: 'name', label: 'Tên', kind: 'text' },
    { key: 'type', label: 'Loại thực thể', kind: 'text' },
    { key: 'tagline', label: 'Mô tả ngắn', kind: 'text' },
    { key: 'description', label: 'Giới thiệu', kind: 'longtext' },
    { key: 'aliases', label: 'Tên gọi khác', kind: 'list' },
    { key: 'imageUrl', label: 'Ảnh', kind: 'text' },
    { key: 'imageCaption', label: 'Chú thích ảnh', kind: 'text' },
    { key: 'periodIds', label: 'Giai đoạn', kind: 'list' },
    { key: 'birthYear', label: 'Năm sinh', kind: 'text' },
    { key: 'deathYear', label: 'Năm mất', kind: 'text' },
    { key: 'birthDateLabel', label: 'Ngày sinh (ghi chú)', kind: 'text' },
    { key: 'deathDateLabel', label: 'Ngày mất (ghi chú)', kind: 'text' },
    { key: 'occupation', label: 'Nghề nghiệp / chức vụ', kind: 'text' },
    { key: 'titles', label: 'Danh hiệu', kind: 'list' },
    { key: 'roles', label: 'Vai trò nhân vật', kind: 'list' },
    { key: 'biography', label: 'Tiểu sử', kind: 'longtext' },
    { key: 'siteType', label: 'Loại di tích', kind: 'text' },
    { key: 'address', label: 'Địa chỉ', kind: 'text' },
    { key: 'latitude', label: 'Vĩ độ', kind: 'text' },
    { key: 'longitude', label: 'Kinh độ', kind: 'text' },
    { key: 'constructionYear', label: 'Năm xây dựng', kind: 'text' },
    { key: 'constructionLabel', label: 'Niên đại xây dựng', kind: 'text' },
    { key: 'preservationStatus', label: 'Hiện trạng', kind: 'text' },
    { key: 'statusNote', label: 'Ghi chú hiện trạng', kind: 'text' },
    { key: 'recognitionLevel', label: 'Cấp xếp hạng', kind: 'text' },
    { key: 'managingAgency', label: 'Cơ quan quản lý', kind: 'text' },
    { key: 'metadata', label: 'Hồ sơ mở rộng (metadata)', kind: 'json' },
    { key: 'isFeatured', label: 'Nổi bật', kind: 'text' },
    { key: 'displayOrder', label: 'Thứ tự hiển thị', kind: 'text' },
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
  UNKNOWN_TYPE: (type: string) => `Loại nội dung "${type}" chưa có phiên bản hóa.`,
  NOT_PENDING: 'Bản sửa này không còn ở trạng thái chờ duyệt.',
  NOT_SNAPSHOT: 'Chỉ khôi phục được từ một phiên bản trong lịch sử.',
  CANNOT_REVIEW_OWN: 'Bạn không thể tự duyệt bản sửa do chính mình đề xuất.',
  REJECT_NOTE_REQUIRED: 'Cần ghi lý do khi từ chối bản sửa.',
  PROPOSED:
    'Nội dung đang xuất bản nên thay đổi được lưu thành bản sửa chờ người duyệt chấp thuận.',
} as const;
