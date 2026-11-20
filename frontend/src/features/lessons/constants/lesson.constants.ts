import { WIKIPEDIA_VI_API } from '@/constants/routes';
import { BlockPaletteItem, LessonBlockGroup, LessonBlockType } from '../types/editor.types';
import { RowGapSize, RowLayoutPresetId, RowVerticalAlign } from '../types/block-builder.types';

const ADD_BLOCK_BELOW_LABEL = '+ Thêm khối bên dưới';

export const LEGACY_BLOCK_TYPE_STORY_CHAPTER = 'STORY_CHAPTER';

/** MIME type dùng cho HTML5 Drag-and-Drop khi kéo khối từ thanh công cụ sang Canvas. */
export const LESSON_BLOCK_DRAG_MIME = 'application/x-lesson-block';

export const CHARACTER_BLOCK_CONSTANTS = {
  NODE_NAME: 'characterBlock',
  TITLE: 'Nhân vật',
  DEFAULT_NAME: 'Tên nhân vật lịch sử',
  DEFAULT_YEARS: 'Năm sinh – năm mất',
  DEFAULT_SUMMARY: 'Thông tin giới thiệu ngắn.',
  PICK_HINT: 'Khi chưa chọn nhân vật, hiển thị nút chọn từ kho dữ liệu.',
  BTN_PICK_ENTITY: 'Chọn từ kho dữ liệu',
  BTN_CHANGE_ENTITY: 'Đổi nhân vật',
  BTN_DELETE_BLOCK: 'Xóa khối nhân vật',
  BTN_ADD_BELOW: ADD_BLOCK_BELOW_LABEL,
  NAME_PLACEHOLDER: 'Nhập tên nhân vật lịch sử...',
  YEARS_PLACEHOLDER: 'Năm sinh – năm mất (Ví dụ: 1911 – 2013)...',
  SUMMARY_PLACEHOLDER: 'Nhập tiểu sử, chức vụ, vai trò nổi bật...',
} as const;

export const EVENT_BLOCK_CONSTANTS = {
  NODE_NAME: 'eventBlock',
  TITLE: 'Sự kiện',
  SUB_LABEL: 'MỐC LỊCH SỬ',
  DEFAULT_NAME: 'Tên sự kiện lịch sử',
  DEFAULT_TIME_LOCATION: 'Thời gian • Địa điểm',
  DEFAULT_SUMMARY: 'Mô tả ngắn về diễn biến và ý nghĩa của sự kiện.',
  DIFFERENCE_NOTE: 'Khác với khối Văn bản: đây là dữ liệu liên kết đến thực thể Event, không phải nội dung nhập tự do.',
  BTN_PICK_EVENT: 'Chọn từ kho dữ liệu',
  BTN_CHANGE_EVENT: 'Đổi sự kiện',
  BTN_DELETE_BLOCK: 'Xóa khối sự kiện',
  BTN_ADD_BELOW: ADD_BLOCK_BELOW_LABEL,
  NAME_PLACEHOLDER: 'Nhập tên sự kiện lịch sử...',
  TIME_LOC_PLACEHOLDER: 'Thời gian • Địa điểm (Ví dụ: 07/05/1954 • Điện Biên)...',
  SUMMARY_PLACEHOLDER: 'Nhập mô tả diễn biến chính và ý nghĩa của sự kiện...',
} as const;

export const LESSON_BLOCK_ITEMS: BlockPaletteItem[] = [
  {
    type: LessonBlockType.TEXT,
    label: 'Văn bản',
    description: 'Đoạn văn, văn bản định dạng chi tiết',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.HEADING,
    label: 'Tiêu đề mục',
    description: 'Tiêu đề phân cấp chương mục',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.IMAGE,
    label: 'Hình ảnh',
    description: 'Hình ảnh tư liệu lịch sử',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.VIDEO,
    label: 'Phim tư liệu',
    description: 'Phim tài liệu, băng ghi hình lịch sử',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.QUOTE,
    label: 'Trích dẫn',
    description: 'Danh ngôn, lời hịch hào hùng',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.DIVIDER,
    label: 'Đường phân cách',
    description: 'Đường kẻ phân tách nội dung',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.CALLOUT,
    label: 'Hộp ghi chú',
    description: 'Hộp ghi chú bối cảnh, lưu ý sử gia',
    group: LessonBlockGroup.BASIC,
  },
  // Gộp "Nhân vật liên quan" vào "Hồ sơ thực thể" và gộp "Thẻ sự kiện" vào "Sự kiện liên quan"
  // trên bảng chọn khối mới; plugin/renderer cũ vẫn giữ trong Registry để tương thích dữ liệu đã lưu.
  {
    type: LessonBlockType.CHARACTER,
    label: 'Hồ sơ thực thể',
    description: 'Hồ sơ nhân vật, tổ chức, triều đại, địa danh liên quan',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.TIMELINE,
    label: 'Dòng thời gian',
    description: 'Dòng thời gian các mốc sự kiện',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.RELATED_EVENTS,
    label: 'Sự kiện liên quan',
    description: 'Thẻ diễn biến và các sự kiện lịch sử gắn kết',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.MAP,
    label: 'Bản đồ lịch sử',
    description: 'Địa bàn chiến sự, di tích bản đồ',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.COMPARISON_TABLE,
    label: 'Bảng so sánh',
    description: 'Bảng so sánh tương quan lực lượng',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.SECTION_ROW,
    label: 'Bố cục nhiều cột',
    description: 'Chia bố cục đa cột kèm mẫu sẵn (Tạp chí 4:8, Đối xứng 6:6, 3 cột...)',
    group: LessonBlockGroup.ADVANCED,
  },
  {
    type: LessonBlockType.QUIZ,
    label: 'Ôn tập',
    description: 'Vài câu tự kiểm tra tại chỗ (soạn mới hoặc lấy từ Ngân hàng)',
    group: LessonBlockGroup.ADVANCED,
    lessonOnly: true,
  },
];

export const ENTITY_SOURCE_CONSTANTS = {
  TABS: {
    HISGO_TITLE: 'Kho tri thức HISGO',
    HISGO_SUBTITLE: 'Dữ liệu nội bộ đã thẩm định, liên kết đồ thị tri thức',
    WIKIPEDIA_TITLE: 'Wikipedia tiếng Việt',
    WIKIPEDIA_SUBTITLE: 'Tra cứu bách khoa mở rộng toàn cầu (vi.wikipedia.org)',
  },
  WIKIMEDIA_REQUEST_HEADERS: {
    Accept: 'application/json',
    'Api-User-Agent': 'HisgoHistoryApp/1.0 (contact@hisgo.edu.vn)',
  },
  WIKIPEDIA_API: {
    BASE_SEARCH_URL: WIKIPEDIA_VI_API.SEARCH_TITLE,
    BASE_SUMMARY_URL: WIKIPEDIA_VI_API.PAGE_SUMMARY,
    DEFAULT_LIMIT: 10,
    MAX_SUMMARY_LENGTH: 500,
  },
  PREVIEW_LABELS: {
    MODAL_TITLE: 'Tra cứu & Gợi ý Thực thể Lịch sử',
    MODAL_DESC: 'Tìm kiếm nhân vật, sự kiện từ Kho HISGO hoặc Wikipedia để tự động điền vào bài học',
    SEARCH_PLACEHOLDER_HISGO: 'Nhập tên nhân vật, địa danh trong hệ thống HISGO...',
    SEARCH_PLACEHOLDER_WIKI: 'Tìm kiếm nhân vật hoặc sự kiện trên Wikipedia tiếng Việt (Vd: Võ Nguyên Giáp, Chiến dịch Điện Biên Phủ)...',
    NAME_LABEL: 'Tên nhân vật / sự kiện:',
    YEARS_LABEL: 'Thời kỳ / Năm sinh – mất:',
    SUMMARY_LABEL: 'Tóm tắt tiểu sử trích xuất (Tối đa 500 ký tự):',
    SOURCE_LABEL: 'Nguồn tham khảo:',
    BTN_APPLY: '📥 Nhập nhanh vào bài học',
    BTN_CANCEL: 'Hủy bỏ',
    NO_RESULTS: 'Không tìm thấy kết quả phù hợp.',
    SELECT_HINT: '← Chọn một kết quả ở danh sách bên trái để xem trước thông tin chi tiết',
    LOADING_LIST: 'Đang tìm kiếm...',
    LOADING_DETAIL: 'Đang trích xuất dữ liệu...',
  },
} as const;

export const ROW_LAYOUT_CONFIG = {
  MIN_COLUMN_COUNT: 1,
  MAX_COLUMN_COUNT: 4,
  MIN_COLUMN_WIDTH_PERCENT: 20,
  MAX_COLUMN_WIDTH_PERCENT: 80,
  SNAP_STEP_PERCENT: 5,
  DEFAULT_GAP_PX: 16,
} as const;

export interface RatioPresetItem {
  id: string;
  label: string;
  values: number[];
}

export const ROW_RATIO_PRESETS: Record<number, RatioPresetItem[]> = {
  1: [{ id: '100', label: '100% (Toàn chiều rộng)', values: [100] }],
  2: [
    { id: '50-50', label: '50 : 50 (Chia đôi đều)', values: [50, 50] },
    { id: '33-67', label: '33 : 67 (Tạp chí 4:8)', values: [33.33, 66.67] },
    { id: '67-33', label: '67 : 33 (8:4)', values: [66.67, 33.33] },
    { id: '60-40', label: '60 : 40', values: [60, 40] },
    { id: '70-30', label: '70 : 30 (Bài chính + Phụ chú)', values: [70, 30] },
    { id: '30-70', label: '30 : 70 (Phụ chú + Bài chính)', values: [30, 70] },
    { id: '40-60', label: '40 : 60', values: [40, 60] },
  ],
  3: [
    { id: '33-33-33', label: '33 : 33 : 33 (Chia 3 đều)', values: [33.33, 33.33, 33.34] },
    { id: '25-50-25', label: '25 : 50 : 25 (Trung tâm)', values: [25, 50, 25] },
    { id: '50-25-25', label: '50 : 25 : 25', values: [50, 25, 25] },
    { id: '25-25-50', label: '25 : 25 : 50', values: [25, 25, 50] },
  ],
  4: [{ id: '25-25-25-25', label: '25 : 25 : 25 : 25 (Chia 4 đều)', values: [25, 25, 25, 25] }],
};

export interface RowLayoutPresetDefinition {
  id: RowLayoutPresetId;
  label: string;
  description: string;
  columnCount: number;
  widths: number[];
  gapSize: RowGapSize;
  showColumnDivider: boolean;
}

export const ROW_LAYOUT_PRESETS: RowLayoutPresetDefinition[] = [
  {
    id: RowLayoutPresetId.MAGAZINE_4_8,
    label: 'Tạp chí (4:8)',
    description: 'Cột dẫn trái gọn + nội dung chính rộng',
    columnCount: 2,
    widths: [33.33, 66.67],
    gapSize: RowGapSize.LG,
    showColumnDivider: true,
  },
  {
    id: RowLayoutPresetId.SYMMETRIC_6_6,
    label: 'Chia đôi (6:6)',
    description: 'Hai cột cân đối song song',
    columnCount: 2,
    widths: [50, 50],
    gapSize: RowGapSize.MD,
    showColumnDivider: false,
  },
  {
    id: RowLayoutPresetId.MEDIA_LEAD_7_5,
    label: 'Chính – Phụ (7:5)',
    description: 'Bài viết chính rộng + tư liệu bên phải',
    columnCount: 2,
    widths: [60, 40],
    gapSize: RowGapSize.MD,
    showColumnDivider: false,
  },
  {
    id: RowLayoutPresetId.THREE_COLUMNS,
    label: '3 cột đều',
    description: 'Trình bày 3 thẻ hoặc 3 mốc song song',
    columnCount: 3,
    widths: [33.33, 33.33, 33.34],
    gapSize: RowGapSize.MD,
    showColumnDivider: false,
  },
  {
    id: RowLayoutPresetId.THREE_COL_FEATURE,
    label: 'Tiêu điểm giữa',
    description: 'Cột phụ 2 bên + nội dung trung tâm',
    columnCount: 3,
    widths: [25, 50, 25],
    gapSize: RowGapSize.MD,
    showColumnDivider: true,
  },
  {
    id: RowLayoutPresetId.SINGLE_COLUMN,
    label: '1 cột đơn',
    description: 'Gom các khối thành 1 khung dọc',
    columnCount: 1,
    widths: [100],
    gapSize: RowGapSize.MD,
    showColumnDivider: false,
  },
];

export const ROW_GAP_OPTIONS: ReadonlyArray<{ value: RowGapSize; label: string }> = [
  { value: RowGapSize.SM, label: 'Hẹp' },
  { value: RowGapSize.MD, label: 'Vừa' },
  { value: RowGapSize.LG, label: 'Rộng' },
];

export const ROW_VERTICAL_ALIGN_OPTIONS: ReadonlyArray<{ value: RowVerticalAlign; label: string }> = [
  { value: RowVerticalAlign.TOP, label: 'Trên' },
  { value: RowVerticalAlign.CENTER, label: 'Giữa' },
  { value: RowVerticalAlign.STRETCH, label: 'Đều' },
];
