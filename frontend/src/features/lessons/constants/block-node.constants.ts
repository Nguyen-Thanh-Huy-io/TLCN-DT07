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
