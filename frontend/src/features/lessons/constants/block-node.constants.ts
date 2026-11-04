/**
 * Hằng số định danh và cấu hình cho các Node Khối cơ bản (Image & Video)
 * Tuân thủ nguyên tắc không sử dụng Magic Strings.
 */

export enum VideoSourceType {
  UPLOAD = 'Upload',
  URL = 'URL',
  EMBED = 'Embed',
}

export const IMAGE_BLOCK_CONSTANTS = {
  NODE_NAME: 'imageBlock',
  TITLE: 'HÌNH ẢNH',
  SUBTITLE: 'Thêm hình ảnh vào bài học',
  FORMAT_HINT: 'PNG, JPG, WEBP • tối đa 10 MB',
  BTN_UPLOAD: 'Tải ảnh lên',
  DIVIDER_TEXT: 'Hoặc',
  INPUT_URL_PLACEHOLDER: 'Nhập URL hình ảnh...',
  BTN_APPLY_URL: 'Áp dụng',
  BTN_MEDIA_LIBRARY: 'Chọn từ thư viện media',
  BTN_ADD_BELOW: '+ Thêm khối bên dưới',
  CAPTION_PLACEHOLDER: 'Nhập chú thích hình ảnh (tùy chọn)...',
  ALT_PLACEHOLDER: 'Mô tả hình ảnh (alt text cho SEO)...',
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ACCEPTED_FORMATS: 'image/png, image/jpeg, image/webp',
} as const;

export const VIDEO_BLOCK_CONSTANTS = {
  NODE_NAME: 'videoBlock',
  TITLE: 'VIDEO',
  LABEL_SOURCE_TYPE: 'source_type',
  TAB_UPLOAD: 'Upload',
  TAB_URL: 'URL',
  TAB_EMBED: 'Embed',
  UPLOAD_HINT: 'MP4, WebM • tối đa 50 MB',
  BTN_UPLOAD: 'Tải video lên',
  INPUT_URL_PLACEHOLDER: 'Nhập URL video YouTube, Vimeo hoặc direct video...',
  BTN_APPLY_URL: 'Áp dụng URL',
  INPUT_EMBED_PLACEHOLDER: '<iframe src="https://..." ...></iframe>',
  BTN_APPLY_EMBED: 'Nhúng mã',
  BTN_ADD_BELOW: '+ Thêm khối bên dưới',
  CAPTION_PLACEHOLDER: 'Nhập chú thích video (Optional)...',
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
} as const;

export const TIMELINE_BLOCK_CONSTANTS = {
  NODE_NAME: 'timelineBlock',
  TITLE: 'Timeline — Dòng thời gian',
  DEFAULT_SUBTITLE: 'Các mốc lịch sử tiêu biểu',
  DEFAULT_NOTE: 'Có thể chọn các sự kiện đã tồn tại trong kho tri thức HISGO, thay vì nhập lại dữ liệu.',
  BTN_ADD_MANUAL: '+ Thêm mốc thủ công',
  BTN_PICK_EVENT: '+ Chọn sự kiện từ kho dữ liệu',
  BTN_DELETE_BLOCK: 'Xóa khối dòng thời gian',
  BTN_ADD_BELOW: '+ Thêm khối bên dưới',
  YEAR_PLACEHOLDER: 'Năm (1945)...',
  TITLE_PLACEHOLDER: 'Tên mốc sự kiện...',
  DESC_PLACEHOLDER: 'Tóm tắt diễn biến và ý nghĩa lịch sử...',
} as const;

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
  BTN_ADD_BELOW: '+ Thêm khối bên dưới',
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
  BTN_ADD_BELOW: '+ Thêm khối bên dưới',
  NAME_PLACEHOLDER: 'Nhập tên sự kiện lịch sử...',
  TIME_LOC_PLACEHOLDER: 'Thời gian • Địa điểm (Ví dụ: 07/05/1954 • Điện Biên)...',
  SUMMARY_PLACEHOLDER: 'Nhập mô tả diễn biến chính và ý nghĩa của sự kiện...',
} as const;
