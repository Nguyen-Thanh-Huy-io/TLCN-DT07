'use client';

import { useModerationDashboard, NOTICE_TONE } from './useModerationDashboard';
import { ModerationStatsGrid, ModerationTabs, ModerationFilters, ModerationReportTable, BanConfirmModal } from './ModerationDashboardParts';

export function ModerationDashboardView() {
  const facade = useModerationDashboard();
  const { notice, setNotice } = facade;

  return (
    <div className="space-y-6 pb-10">
      {/* Dải chỉ số KPI tổng quan kiểm duyệt */}
      <ModerationStatsGrid facade={facade} />

      {/* Khung bảng điều khiển chính */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Thanh Tab & Nút làm mới */}
        <ModerationTabs facade={facade} />

        {/* Thanh bộ lọc chi tiết */}
        <ModerationFilters facade={facade} />

        {/* Thông báo phản hồi thao tác */}
        {notice && (
          <div
            role="status"
            className={`mx-5 mt-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
              notice.tone === NOTICE_TONE.OK
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-4 text-xs font-semibold underline"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Bảng danh sách báo cáo kiểm duyệt */}
        <ModerationReportTable facade={facade} />
      </div>

      {/* Hộp thoại xác nhận khóa tài khoản tái phạm */}
      <BanConfirmModal facade={facade} />
    </div>
  );
}
