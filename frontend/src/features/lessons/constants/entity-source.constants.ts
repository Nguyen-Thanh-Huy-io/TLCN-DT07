/**
 * Quản lý toàn bộ hằng số cho tính năng Tra cứu nguồn dữ liệu Thực thể lịch sử
 * Tuyệt đối không dùng magic string.
 */

export const ENTITY_SOURCE_CONSTANTS = {
  TABS: {
    HISGO_TITLE: 'Kho tri thức HISGO',
    HISGO_SUBTITLE: 'Dữ liệu nội bộ đã thẩm định, liên kết đồ thị tri thức',
    WIKIPEDIA_TITLE: 'Wikipedia tiếng Việt',
    WIKIPEDIA_SUBTITLE: 'Tra cứu bách khoa mở rộng toàn cầu (vi.wikipedia.org)',
  },
  WIKIPEDIA_API: {
    BASE_SEARCH_URL: 'https://vi.wikipedia.org/w/rest.php/v1/search/title',
    BASE_SUMMARY_URL: 'https://vi.wikipedia.org/api/rest_v1/page/summary',
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
